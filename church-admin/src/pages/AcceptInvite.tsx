import { useState } from "react";
import { getApiBase, setApiBase, acceptInvite } from "../api";

const params = new URLSearchParams(window.location.search);

export default function AcceptInvite() {
  const [apiBase, setApiBaseInput] = useState(getApiBase());
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      setApiBase(apiBase);
      await acceptInvite(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept invite");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="center-screen">
        <div className="card">
          <h1>You're in</h1>
          <p className="hint">Your account has been created. Head back to the login page to sign in.</p>
          <button className="btn-primary" onClick={() => (window.location.href = "/")}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <form className="card" onSubmit={submit}>
        <h1>Accept your invite</h1>

        <label>API base URL</label>
        <input
          value={apiBase}
          onChange={(e) => setApiBaseInput(e.target.value)}
          placeholder="https://your-codespace-4000.app.github.dev"
          required
        />

        <label>Invite code</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} required />

        <label>Set a password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <label>Confirm password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

        {error && <div className="error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
