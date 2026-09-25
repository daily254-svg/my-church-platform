import { useEffect, useState } from "react";
import { listEvents, createEvent, deleteEvent, type EventItem } from "../api";

export default function EventsSection({ token }: { token: string }) {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("Service");
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    listEvents(token)
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load events"));
  };

  useEffect(refresh, [token]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createEvent(token, { title, date, time, type });
      setTitle("");
      setDate("");
      setTime("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setError("");
    try {
      await deleteEvent(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete event");
    }
  };

  return (
    <div>
      <div className="section">
        <h2>Add an event</h2>
        <form onSubmit={submitCreate}>
          <div className="form-row">
            <div>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label>Date</label>
              <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026-10-05" required />
            </div>
            <div>
              <label>Time</label>
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00 AM" required />
            </div>
            <div>
              <label>Type</label>
              <input value={type} onChange={(e) => setType(e.target.value)} required />
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
          <h2>Events</h2>
        </div>
        {error && <div className="error">{error}</div>}
        {events === null && <div className="empty">Loading...</div>}
        {events?.length === 0 && <div className="empty">No events yet.</div>}
        {events?.map((ev) => (
          <div key={ev.id} className="item-row">
            <div>
              <strong>{ev.title}</strong>
              <div className="meta">
                {ev.date} · {ev.time} · {ev.type} · {ev.registrations.length} registered
              </div>
            </div>
            <div className="actions">
              <button className="btn-danger btn-small" onClick={() => remove(ev.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
