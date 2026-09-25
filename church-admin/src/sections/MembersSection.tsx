import { useEffect, useState } from "react";
import { listPendingMembers, approveMember, rejectMember, type PendingMember } from "../api";

export default function MembersSection({ token }: { token: string }) {
  const [members, setMembers] = useState<PendingMember[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => {
    listPendingMembers(token)
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load members"));
  };

  useEffect(refresh, [token]);

  const run = async (userId: string, action: typeof approveMember) => {
    setBusyId(userId);
    setError("");
    try {
      await action(token, userId);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Pending Members</h2>
      </div>
      {error && <div className="error">{error}</div>}
      {members === null && <div className="empty">Loading...</div>}
      {members?.length === 0 && <div className="empty">No members awaiting approval.</div>}
      {members?.map((m) => (
        <div key={m.id} className="item-row">
          <div>
            <strong>{m.name || m.email}</strong>
            <div className="meta">
              {m.email}
              {m.phone ? ` · ${m.phone}` : ""}
              {m.requestedRole ? ` · requested ${m.requestedRole}` : ""}
            </div>
          </div>
          <div className="actions">
            <button
              className="btn-primary btn-small"
              style={{ width: "auto", marginTop: 0 }}
              disabled={busyId === m.id}
              onClick={() => run(m.id, approveMember)}
            >
              Approve
            </button>
            <button
              className="btn-danger btn-small"
              disabled={busyId === m.id}
              onClick={() => run(m.id, rejectMember)}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
