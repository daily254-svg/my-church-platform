import { useEffect, useState } from "react";
import { listBranches, createBranch, type Branch } from "../api";

export default function BranchesSection({ token }: { token: string }) {
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    listBranches(token)
      .then(setBranches)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load branches"));
  };

  useEffect(refresh, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createBranch(token, { name, country: country || undefined, adminName, adminEmail, adminPassword });
      setName("");
      setCountry("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create branch");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="section">
        <h2>Add a branch</h2>
        <p className="hint">
          Creates a new branch church under yours, active immediately, with its own admin account. Limited by
          your plan's branch allowance.
        </p>
        <form onSubmit={submit}>
          <div className="form-row">
            <div>
              <label>Branch name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label>Country (optional)</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Branch admin name</label>
              <input value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
            </div>
            <div>
              <label>Branch admin email</label>
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
            </div>
            <div>
              <label>Branch admin password</label>
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <button className="btn-primary" style={{ width: "auto", marginTop: 0 }} disabled={creating} type="submit">
                {creating ? "Creating..." : "Create branch"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Branches</h2>
        </div>
        {error && <div className="error">{error}</div>}
        {branches === null && <div className="empty">Loading...</div>}
        {branches?.length === 0 && <div className="empty">No branches yet.</div>}
        {branches?.map((b) => (
          <div key={b.id} className="item-row">
            <div>
              <strong>{b.name}</strong> <span className={`badge badge-${b.status}`}>{b.status}</span>
              <div className="meta">
                slug: {b.slug} · invite code: <code>{b.inviteCode}</code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
