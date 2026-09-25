import { useEffect, useState } from "react";
import {
  listAnnouncements,
  createAnnouncement,
  sendAnnouncement,
  deleteAnnouncement,
  type Announcement,
  type AnnouncementCategory,
} from "../api";

const CATEGORIES: AnnouncementCategory[] = ["GENERAL", "EVENT", "EMERGENCY", "PRAYER", "OFFERING"];

export default function AnnouncementsSection({ token }: { token: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("GENERAL");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => {
    listAnnouncements(token)
      .then(setAnnouncements)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load announcements"));
  };

  useEffect(refresh, [token]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createAnnouncement(token, { title, body, category });
      setTitle("");
      setBody("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create announcement");
    } finally {
      setCreating(false);
    }
  };

  const send = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      await sendAnnouncement(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send announcement");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setError("");
    try {
      await deleteAnnouncement(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete announcement");
    }
  };

  return (
    <div>
      <div className="section">
        <h2>New announcement</h2>
        <form onSubmit={submitCreate}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label>Body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="btn-primary" disabled={creating} type="submit">
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Announcements</h2>
        </div>
        {error && <div className="error">{error}</div>}
        {announcements === null && <div className="empty">Loading...</div>}
        {announcements?.length === 0 && <div className="empty">No announcements yet.</div>}
        {announcements?.map((a) => (
          <div key={a.id} className="item-row">
            <div>
              <strong>{a.title}</strong>{" "}
              <span className={`badge badge-${a.category}`}>{a.category}</span>
              {a.isLive && <span className="badge badge-ACTIVE" style={{ marginLeft: 6 }}>SENT</span>}
              <div className="body-text">{a.body}</div>
            </div>
            <div className="actions">
              {!a.isLive && (
                <button className="btn-primary btn-small" style={{ width: "auto", marginTop: 0 }} disabled={busyId === a.id} onClick={() => send(a.id)}>
                  Send
                </button>
              )}
              <button className="btn-danger btn-small" onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
