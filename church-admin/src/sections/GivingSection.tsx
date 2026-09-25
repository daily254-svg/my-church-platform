import { useEffect, useState } from "react";
import { getGivingSummary, listGivings, type GivingSummary, type GivingRecord } from "../api";

export default function GivingSection({ token }: { token: string }) {
  const [summary, setSummary] = useState<GivingSummary | null>(null);
  const [records, setRecords] = useState<GivingRecord[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getGivingSummary(token)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load summary"));
    listGivings(token)
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load giving records"));
  }, [token]);

  return (
    <div>
      <div className="section">
        <h2>Summary</h2>
        {error && <div className="error">{error}</div>}
        {summary && (
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="value">{summary.total.toLocaleString()}</div>
              <div className="label">Total ({summary.count})</div>
            </div>
            <div className="stat-tile">
              <div className="value">{summary.titheTotal.toLocaleString()}</div>
              <div className="label">Tithe ({summary.titheCount})</div>
            </div>
            <div className="stat-tile">
              <div className="value">{summary.offeringTotal.toLocaleString()}</div>
              <div className="label">Other ({summary.offeringCount})</div>
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Records</h2>
        </div>
        {records === null && <div className="empty">Loading...</div>}
        {records?.length === 0 && <div className="empty">No giving records yet.</div>}
        {records?.map((g) => (
          <div key={g.id} className="item-row">
            <div>
              <strong>{g.user.name || g.user.email}</strong>
              <div className="meta">
                {g.category} · {g.amount.toLocaleString()} · {g.service} · {new Date(g.createdAt).toLocaleDateString()}
              </div>
            </div>
            <span className={`badge badge-${g.status}`}>{g.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
