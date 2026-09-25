import { useEffect, useState } from "react";
import { listSermons, createSermon, updateSermonStatus, deleteSermon, type Sermon, type SermonStatus } from "../api";

const STATUSES: SermonStatus[] = ["DRAFT", "READY", "DELIVERED"];

export default function SermonsSection({ token }: { token: string }) {
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    listSermons(token)
      .then(setSermons)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load sermons"));
  };

  useEffect(refresh, [token]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createSermon(token, { title, description: description || undefined });
      setTitle("");
      setDescription("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create sermon");
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (id: string, status: SermonStatus) => {
    setError("");
    try {
      await updateSermonStatus(token, id, status);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this sermon?")) return;
    setError("");
    try {
      await deleteSermon(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete sermon");
    }
  };

  return (
    <div>
      <div className="section">
        <h2>Add a sermon</h2>
        <form onSubmit={submitCreate}>
          <div className="form-row">
            <div>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <button className="btn-primary" style={{ width: "auto", marginTop: 0 }} disabled={creating} type="submit">
                {creating ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Sermons</h2>
        </div>
        {error && <div className="error">{error}</div>}
        {sermons === null && <div className="empty">Loading...</div>}
        {sermons?.length === 0 && <div className="empty">No sermons yet.</div>}
        {sermons?.map((s) => (
          <div key={s.id} className="item-row">
            <div>
              <strong>{s.title}</strong>{" "}
              <span className={`badge badge-${s.status}`}>{s.status}</span>
              {s.description && <div className="meta">{s.description}</div>}
            </div>
            <div className="actions">
              <select value={s.status} onChange={(e) => changeStatus(s.id, e.target.value as SermonStatus)} style={{ width: "auto" }}>
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <button className="btn-danger btn-small" onClick={() => remove(s.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
