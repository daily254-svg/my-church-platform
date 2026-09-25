import { useEffect, useState } from "react";
import { listMinistries, createMinistry, updateMinistry, deleteMinistry, type MinistryGroup } from "../api";

export default function MinistriesSection({ token }: { token: string }) {
  const [groups, setGroups] = useState<MinistryGroup[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState("#1B3A7A");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const refresh = () => {
    listMinistries(token)
      .then(setGroups)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load ministries"));
  };

  useEffect(refresh, [token]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createMinistry(token, { name, description: description || undefined, accent });
      setName("");
      setDescription("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create ministry");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (g: MinistryGroup) => {
    setEditingId(g.id);
    setEditName(g.name);
    setEditDescription(g.description ?? "");
  };

  const saveEdit = async (id: string) => {
    setError("");
    try {
      await updateMinistry(token, id, { name: editName, description: editDescription });
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update ministry");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this ministry? Members will lose access to its chat.")) return;
    setError("");
    try {
      await deleteMinistry(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete ministry");
    }
  };

  return (
    <div>
      <div className="section">
        <h2>Add a ministry</h2>
        <form onSubmit={submitCreate}>
          <div className="form-row">
            <div>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <label>Accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} style={{ width: 50, padding: 2 }} />
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
          <h2>Ministries</h2>
        </div>
        {error && <div className="error">{error}</div>}
        {groups === null && <div className="empty">Loading...</div>}
        {groups?.length === 0 && <div className="empty">No ministries yet.</div>}
        {groups?.map((g) => (
          <div key={g.id} className="item-row">
            {editingId === g.id ? (
              <div style={{ flex: 1 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: 6 }} />
                <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
            ) : (
              <div>
                <strong>{g.name}</strong>
                <div className="meta">
                  {g.description || "No description"} · {g._count.members} members · {g._count.messages} messages
                </div>
              </div>
            )}
            <div className="actions">
              {editingId === g.id ? (
                <>
                  <button className="btn-primary btn-small" style={{ width: "auto", marginTop: 0 }} onClick={() => saveEdit(g.id)}>
                    Save
                  </button>
                  <button className="btn-secondary btn-small" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary btn-small" onClick={() => startEdit(g)}>
                    Edit
                  </button>
                  <button className="btn-danger btn-small" onClick={() => remove(g.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
