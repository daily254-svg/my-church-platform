import { useEffect, useState } from "react";
import {
  type Church,
  type Staff,
  type Plan,
  type Subscription,
  type DeletionQueueEntry,
  listChurches,
  createChurch,
  approveChurch,
  suspendChurch,
  reactivateChurch,
  cancelChurch,
  exportChurchNow,
  getDeletionQueue,
  processDeletions,
  changeSubscriptionPlan,
  changeSubscriptionStatus,
  listPlans,
  createPlan,
  updatePlan,
  clearToken,
} from "../api";

interface Props {
  token: string;
  staff: Staff;
  onLogout: () => void;
}

const SUBSCRIPTION_STATUSES: Subscription["status"][] = ["TRIALING", "ACTIVE", "PAST_DUE", "DISABLED", "CANCELLED"];

function SubscriptionControls({ church, token, plans, onChanged }: { church: Church; token: string; plans: Plan[]; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState(church.subscription?.plan.id ?? "");
  const [status, setStatus] = useState<Subscription["status"]>(church.subscription?.status ?? "TRIALING");

  if (!church.subscription) return null;

  const applyPlan = async () => {
    if (planId === church.subscription!.plan.id) return;
    setBusy(true);
    setError("");
    try {
      await changeSubscriptionPlan(token, church.id, planId);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change plan");
    } finally {
      setBusy(false);
    }
  };

  const applyStatus = async () => {
    if (status === church.subscription!.status) return;
    setBusy(true);
    setError("");
    try {
      await changeSubscriptionStatus(token, church.id, status);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-row" style={{ marginTop: 8 }}>
      <div style={{ flex: "0 0 auto" }}>
        <label>Plan</label>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} style={{ width: "auto" }}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (max {p.maxBranches} branches)
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <button className="btn-secondary btn-small" disabled={busy} onClick={applyPlan}>
          Change plan
        </button>
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Subscription["status"])} style={{ width: "auto" }}>
          {SUBSCRIPTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <button className="btn-secondary btn-small" disabled={busy} onClick={applyStatus}>
          Change status
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

function ChurchRow({ church, token, plans, indent, onChanged }: { church: Church; token: string; plans: Plan[]; indent?: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: (t: string, id: string) => Promise<Church>) => {
    setError("");
    setBusy(true);
    try {
      await action(token, church.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={indent ? "" : "church-card"} style={indent ? { padding: "8px 0" } : undefined}>
      <div className="church-header">
        <div>
          <strong>{church.name}</strong>{" "}
          <span className={`badge badge-${church.status}`}>{church.status.replace("_", " ")}</span>
          {church.subscription && (
            <span className={`badge badge-${church.subscription.status}`} style={{ marginLeft: 6 }}>
              {church.subscription.plan.name} · {church.subscription.status}
            </span>
          )}
        </div>
        <div className="actions">
          {church.status === "PENDING_APPROVAL" && (
            <button className="btn-primary" disabled={busy} onClick={() => run(approveChurch)}>Approve</button>
          )}
          {church.status === "ACTIVE" && (
            <button className="btn-secondary" disabled={busy} onClick={() => run(suspendChurch)}>Suspend</button>
          )}
          {church.status === "SUSPENDED" && (
            <button className="btn-primary" disabled={busy} onClick={() => run(reactivateChurch)}>Reactivate</button>
          )}
          {church.status === "CANCELLED" && (
            <>
              <button className="btn-primary" disabled={busy} onClick={() => run(reactivateChurch)}>
                Undo cancel
              </button>
              <button className="btn-secondary" disabled={busy} onClick={() => run(exportChurchNow)}>
                Export data
              </button>
            </>
          )}
          {church.status !== "CANCELLED" && (
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => {
                if (confirm(`Cancel ${church.name}? This starts the data-export/deletion clock.`)) run(cancelChurch);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      <div className="church-meta">
        slug: {church.slug} · invite code: <code>{church.inviteCode}</code>
        {church.country ? ` · ${church.country}` : ""}
        {church.subscription?.trialEndsAt ? ` · trial ends ${new Date(church.subscription.trialEndsAt).toLocaleDateString()}` : ""}
        {church.cancelledAt ? ` · cancelled ${new Date(church.cancelledAt).toLocaleDateString()}` : ""}
      </div>
      {error && <div className="error">{error}</div>}

      {/* Branches don't carry their own subscription — covered by the mother's plan. */}
      {!indent && church.subscription && (
        <SubscriptionControls church={church} token={token} plans={plans} onChanged={onChanged} />
      )}

      {church.branches.length > 0 && (
        <div className="branches">
          {church.branches.map((b) => (
            <ChurchRow key={b.id} church={b} token={token} plans={plans} indent onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanRow({ plan, token, onChanged }: { plan: Plan; token: string; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [maxBranches, setMaxBranches] = useState(String(plan.maxBranches));
  const [priceKES, setPriceKES] = useState(plan.priceKES !== null ? String(plan.priceKES) : "");
  const [priceUSD, setPriceUSD] = useState(plan.priceUSD !== null ? String(plan.priceUSD) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await updatePlan(token, plan.id, {
        name,
        maxBranches: Number(maxBranches),
        priceKES: priceKES === "" ? undefined : Number(priceKES),
        priceUSD: priceUSD === "" ? undefined : Number(priceUSD),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update plan");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    setBusy(true);
    setError("");
    try {
      await updatePlan(token, plan.id, { isActive: !plan.isActive });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update plan");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="item-row">
        <div className="form-row" style={{ flex: 1 }}>
          <div>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>Max branches</label>
            <input type="number" min="0" value={maxBranches} onChange={(e) => setMaxBranches(e.target.value)} />
          </div>
          <div>
            <label>Price (KES)</label>
            <input type="number" min="0" value={priceKES} onChange={(e) => setPriceKES(e.target.value)} />
          </div>
          <div>
            <label>Price (USD)</label>
            <input type="number" min="0" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} />
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <button className="btn-primary btn-small" style={{ width: "auto", marginTop: 0 }} disabled={busy} onClick={save}>
              Save
            </button>
            <button className="btn-secondary btn-small" style={{ marginLeft: 6 }} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="item-row">
      <div>
        <strong>{plan.name}</strong> <span className="meta">· slug: {plan.slug}</span>
        {!plan.isActive && <span className="badge badge-DISABLED" style={{ marginLeft: 6 }}>INACTIVE</span>}
        <div className="meta">
          max {plan.maxBranches} branches
          {plan.priceKES !== null ? ` · KES ${plan.priceKES.toLocaleString()}` : ""}
          {plan.priceUSD !== null ? ` · $${plan.priceUSD.toLocaleString()}` : ""}
        </div>
        {error && <div className="error">{error}</div>}
      </div>
      <div className="actions">
        <button className="btn-secondary btn-small" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="btn-secondary btn-small" disabled={busy} onClick={toggleActive}>
          {plan.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function DeletionQueueSection({ token }: { token: string }) {
  const [queue, setQueue] = useState<DeletionQueueEntry[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  const refresh = () => {
    getDeletionQueue(token)
      .then(setQueue)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load deletion queue"));
  };

  useEffect(refresh, [token]);

  const runSweep = async () => {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const res = await processDeletions(token);
      const parts: string[] = [];
      if (res.deleted.length) parts.push(`Deleted: ${res.deleted.map((c) => c.name).join(", ")}`);
      if (res.skipped.length) parts.push(`Skipped: ${res.skipped.map((c) => `${c.name} (${c.reason})`).join(", ")}`);
      setResult(parts.length ? parts.join(" — ") : "Nothing due for deletion.");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process deletions");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Deletion queue</h2>
        <button className="btn-secondary btn-small" disabled={busy} onClick={runSweep}>
          {busy ? "Processing..." : "Process due deletions now"}
        </button>
      </div>
      <p className="hint">
        Cancelled churches are permanently deleted 14 days after cancellation. This runs automatically every 12
        hours, or trigger it manually here (useful since this dev environment doesn't stay up continuously).
      </p>
      {error && <div className="error">{error}</div>}
      {result && <div className="hint">{result}</div>}
      {queue === null && <div className="empty">Loading...</div>}
      {queue?.length === 0 && <div className="empty">No churches pending deletion.</div>}
      {queue?.map((entry) => (
        <div key={entry.id} className="item-row">
          <div>
            <strong>{entry.name}</strong>
            <div className="meta">
              Cancelled {new Date(entry.cancelledAt).toLocaleDateString()} · deletes{" "}
              {new Date(entry.deletesAt).toLocaleDateString()} ({entry.daysRemaining} days left)
              {entry.blockedByBranches ? " · blocked — still has branches" : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ token, staff, onLogout }: Props) {
  const [churches, setChurches] = useState<Church[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);
  const [creating, setCreating] = useState(false);

  const [planName, setPlanName] = useState("");
  const [planSlug, setPlanSlug] = useState("");
  const [planMaxBranches, setPlanMaxBranches] = useState("0");
  const [planPriceKES, setPlanPriceKES] = useState("");
  const [planPriceUSD, setPlanPriceUSD] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  const refresh = () => {
    listChurches(token)
      .then(setChurches)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load churches"));
  };

  const refreshPlans = () => {
    listPlans(token)
      .then(setPlans)
      .catch((err) => setPlanError(err instanceof Error ? err.message : "Could not load plans"));
  };

  useEffect(() => {
    refresh();
    refreshPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createChurch(token, { name, country: country || undefined, requireApproval });
      setName("");
      setCountry("");
      setRequireApproval(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create church");
    } finally {
      setCreating(false);
    }
  };

  const submitCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError("");
    setCreatingPlan(true);
    try {
      await createPlan(token, {
        name: planName,
        slug: planSlug,
        maxBranches: Number(planMaxBranches),
        priceKES: planPriceKES === "" ? undefined : Number(planPriceKES),
        priceUSD: planPriceUSD === "" ? undefined : Number(planPriceUSD),
      });
      setPlanName("");
      setPlanSlug("");
      setPlanMaxBranches("0");
      setPlanPriceKES("");
      setPlanPriceUSD("");
      refreshPlans();
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Could not create plan");
    } finally {
      setCreatingPlan(false);
    }
  };

  return (
    <div>
      <div className="topbar">
        <strong>Platform Admin</strong>
        <div>
          <span style={{ marginRight: 12, fontSize: 13, color: "#666" }}>{staff.email} · {staff.role}</span>
          <button
            className="btn-secondary"
            onClick={() => {
              clearToken();
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="container">
        <div className="section">
          <h2>Create a church</h2>
          <form onSubmit={submitCreate}>
            <div className="form-row">
              <div>
                <label>Church name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label>Country (optional)</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={requireApproval}
                    onChange={(e) => setRequireApproval(e.target.checked)}
                  />{" "}
                  Require approval to join
                </label>
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <button className="btn-primary" style={{ width: "auto", marginTop: 0 }} disabled={creating} type="submit">
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="section">
          <h2>Churches</h2>
          {error && <div className="error">{error}</div>}
          {churches === null && <div className="empty">Loading...</div>}
          {churches?.length === 0 && <div className="empty">No churches yet.</div>}
          {churches?.map((church) => (
            <ChurchRow key={church.id} church={church} token={token} plans={plans} onChanged={refresh} />
          ))}
        </div>

        <div className="section">
          <h2>Add a plan</h2>
          <form onSubmit={submitCreatePlan}>
            <div className="form-row">
              <div>
                <label>Name</label>
                <input value={planName} onChange={(e) => setPlanName(e.target.value)} required />
              </div>
              <div>
                <label>Slug</label>
                <input value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} placeholder="growth" required />
              </div>
              <div>
                <label>Max branches</label>
                <input type="number" min="0" value={planMaxBranches} onChange={(e) => setPlanMaxBranches(e.target.value)} required />
              </div>
              <div>
                <label>Price (KES)</label>
                <input type="number" min="0" value={planPriceKES} onChange={(e) => setPlanPriceKES(e.target.value)} />
              </div>
              <div>
                <label>Price (USD)</label>
                <input type="number" min="0" value={planPriceUSD} onChange={(e) => setPlanPriceUSD(e.target.value)} />
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <button className="btn-primary" style={{ width: "auto", marginTop: 0 }} disabled={creatingPlan} type="submit">
                  {creatingPlan ? "Adding..." : "Add plan"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="section">
          <h2>Plans</h2>
          {planError && <div className="error">{planError}</div>}
          {plans.length === 0 && <div className="empty">No plans yet.</div>}
          {plans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} token={token} onChanged={refreshPlans} />
          ))}
        </div>

        <DeletionQueueSection token={token} />
      </div>
    </div>
  );
}
