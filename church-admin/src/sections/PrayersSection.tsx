import { useEffect, useState } from "react";
import { listPrayers, deletePrayer, type Prayer } from "../api";

export default function PrayersSection({ token }: { token: string }) {
  const [prayers, setPrayers] = useState<Prayer[] | null>(null);
  const [error, setError] = useState("");

  const refresh = () => {
    listPrayers(token)
      .then(setPrayers)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load prayers"));
  };

  useEffect(refresh, [token]);

  const remove = async (id: string) => {
    if (!confirm("Remove this prayer request?")) return;
    setError("");
    try {
      await deletePrayer(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove prayer request");
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Prayer Requests</h2>
      </div>
      {error && <div className="error">{error}</div>}
      {prayers === null && <div className="empty">Loading...</div>}
      {prayers?.length === 0 && <div className="empty">No prayer requests yet.</div>}
      {prayers?.map((p) => (
        <div key={p.id} className="item-row">
          <div>
            <strong>{p.isAnonymous ? "Anonymous" : p.user.name || "Member"}</strong>{" "}
            <span className="meta">· {p.category} · {p.prayerCount} prayed</span>
            <div className="body-text">{p.text}</div>
          </div>
          <div className="actions">
            <button className="btn-danger btn-small" onClick={() => remove(p.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
