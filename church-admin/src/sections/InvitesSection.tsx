import { useEffect, useState } from "react";
import { listInvites, inviteStaff, revokeInvite, type StaffInvite, type StaffRole } from "../api";

const ROLES: StaffRole[] = ["PASTOR", "SECRETARY", "MEDIA", "ADMIN"];

export default function InvitesSection({ token }: { token: string }) {
  const [invites, setInvites] = useState<StaffInvite[] | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("PASTOR");
  const [sending, setSending] = useState(false);

  const refresh = () => {
    listInvites(token)
      .then(setInvites)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load invites"));
  };

  useEffect(refresh, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await inviteStaff(token, { email, name: name || undefined, role });
      setEmail("");
      setName("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite");
    } finally {
      setSending(false);
    }
  };

  const revoke = async (id: string) => {
    setError("");
    try {
      await revokeInvite(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke invite");
    }
  };

  return (
    <div>
      <div className="section">
        <h2>Invite staff</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label>Name (optional)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} style={{ width: "auto" }}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <button className="btn-primary" style={{ width: "auto", marginTop: 0 }} disabled={sending} type="submit">
                {sending ? "Sending..." : "Send invite"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Pending Invites</h2>
        </div>
        {error && <div className="error">{error}</div>}
        {invites === null && <div className="empty">Loading...</div>}
        {invites?.length === 0 && <div className="empty">No pending invites.</div>}
        {invites?.map((inv) => (
          <div key={inv.id} className="item-row">
            <div>
              <strong>{inv.email}</strong> <span className="meta">· {inv.role}</span>
              <div className="meta">Expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
            </div>
            <div className="actions">
              <button className="btn-danger btn-small" onClick={() => revoke(inv.id)}>
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
