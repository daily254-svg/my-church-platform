import { useEffect, useState } from "react";
import { listPendingMembers, listActiveMembers, approveMember, rejectMember, markMemberLeft, type PendingMember, type StaffRole } from "../api";
import MemberDetailModal from "./MemberDetailModal";

// Backend restricts mark-left to ADMIN/SECRETARY — removing an active
// member is a records action, not a pastoral one.
const CAN_MARK_LEFT: StaffRole[] = ["ADMIN", "SECRETARY"];
// Backend restricts GET /members/:userId the same way — member detail is
// a records lookup, not something PASTOR/MEDIA get here.
const CAN_VIEW_DETAIL: StaffRole[] = ["ADMIN", "SECRETARY"];

export default function MembersSection({ token, role }: { token: string; role: StaffRole }) {
  const [pending, setPending] = useState<PendingMember[] | null>(null);
  const [active, setActive] = useState<PendingMember[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const refresh = () => {
    listPendingMembers(token)
      .then(setPending)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load members"));
    listActiveMembers(token)
      .then(setActive)
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

  const canViewDetail = CAN_VIEW_DETAIL.includes(role);

  return (
    <div>
      <div className="section">
        <div className="section-header">
          <h2>Pending Members</h2>
        </div>
        {error && <div className="error">{error}</div>}
        {pending === null && <div className="empty">Loading...</div>}
        {pending?.length === 0 && <div className="empty">No members awaiting approval.</div>}
        {pending?.map((m) => (
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
              <button className="btn-danger btn-small" disabled={busyId === m.id} onClick={() => run(m.id, rejectMember)}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Active Members</h2>
        </div>
        {active === null && <div className="empty">Loading...</div>}
        {active?.length === 0 && <div className="empty">No active members yet.</div>}
        {active?.map((m) => (
          <div
            key={m.id}
            className={`item-row ${canViewDetail ? "clickable-row" : ""}`}
            onClick={() => canViewDetail && setDetailUserId(m.id)}
          >
            <div>
              <strong>{m.name || m.email}</strong> <span className="meta">· {m.role}</span>
              <div className="meta">
                {m.email}
                {m.phone ? ` · ${m.phone}` : ""}
              </div>
            </div>
            {CAN_MARK_LEFT.includes(role) && (
              <div className="actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn-danger btn-small"
                  disabled={busyId === m.id}
                  onClick={() => {
                    if (confirm(`Mark ${m.name || m.email} as left?`)) run(m.id, markMemberLeft);
                  }}
                >
                  Mark as left
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {detailUserId && (
        <MemberDetailModal token={token} userId={detailUserId} onClose={() => setDetailUserId(null)} />
      )}
    </div>
  );
}
