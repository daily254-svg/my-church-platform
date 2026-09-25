import { useEffect, useState } from "react";
import { getMemberDetail, type MemberDetail } from "../api";

interface Props {
  token: string;
  userId: string;
  onClose: () => void;
}

export default function MemberDetailModal({ token, userId, onClose }: Props) {
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMemberDetail(token, userId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load member"));
  }, [token, userId]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{detail?.name || detail?.email || "Member"}</h2>
            {detail && <span className="meta">{detail.role}</span>}
          </div>
          <button className="btn-secondary btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {!detail && !error && <div className="empty">Loading...</div>}

        {detail && (
          <>
            <div className="modal-section">
              <h3>Profile</h3>
              <div className="meta">Email: {detail.email}</div>
              <div className="meta">Phone: {detail.phone || "—"}</div>
              <div className="meta">Gender: {detail.gender || "—"}</div>
              <div className="meta">Self-reported ministry: {detail.ministry || "—"}</div>
              <div className="meta">Joined: {new Date(detail.createdAt).toLocaleDateString()}</div>
            </div>

            <div className="modal-section">
              <h3>Ministries ({detail.ministries.length})</h3>
              {detail.ministries.length === 0 && <div className="empty">Not in any ministry group.</div>}
              {detail.ministries.map((m) => (
                <div key={m.group.id} className="item-row">
                  <div>
                    <strong>{m.group.name}</strong>
                    <div className="meta">Joined {new Date(m.joinedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-section">
              <h3>Giving history ({detail.givings.length})</h3>
              {detail.givings.length === 0 && <div className="empty">No giving records.</div>}
              {detail.givings.map((g) => (
                <div key={g.id} className="item-row">
                  <div>
                    <strong>{g.category}</strong> <span className="meta">· {g.amount.toLocaleString()} · {g.service}</span>
                    <div className="meta">{new Date(g.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`badge badge-${g.status}`}>{g.status}</span>
                </div>
              ))}
            </div>

            <div className="modal-section">
              <h3>Event registrations ({detail.eventRegistrations.length})</h3>
              {detail.eventRegistrations.length === 0 && <div className="empty">Not registered for any events.</div>}
              {detail.eventRegistrations.map((r) => (
                <div key={r.id} className="item-row">
                  <div>
                    <strong>{r.event.title}</strong>
                    <div className="meta">{r.event.date} · {r.event.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
