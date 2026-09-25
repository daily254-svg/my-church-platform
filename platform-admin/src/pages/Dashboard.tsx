import { useEffect, useState } from "react";
import {
  type Church,
  type Staff,
  listChurches,
  createChurch,
  approveChurch,
  suspendChurch,
  reactivateChurch,
  cancelChurch,
  clearToken,
} from "../api";

interface Props {
  token: string;
  staff: Staff;
  onLogout: () => void;
}

function ChurchRow({ church, token, indent, onChanged }: { church: Church; token: string; indent?: boolean; onChanged: () => void }) {
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
      </div>
      {error && <div className="error">{error}</div>}

      {church.branches.length > 0 && (
        <div className="branches">
          {church.branches.map((b) => (
            <ChurchRow key={b.id} church={b} token={token} indent onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ token, staff, onLogout }: Props) {
  const [churches, setChurches] = useState<Church[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    listChurches(token)
      .then(setChurches)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load churches"));
  };

  useEffect(refresh, [token]);

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
            <ChurchRow key={church.id} church={church} token={token} onChanged={refresh} />
          ))}
        </div>
      </div>
    </div>
  );
}
