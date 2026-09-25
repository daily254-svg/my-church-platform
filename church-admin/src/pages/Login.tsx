import { useState } from "react";
import { getApiBase, setApiBase, login, type LoginResult } from "../api";

interface Props {
  onResult: (result: LoginResult) => void;
}

export default function Login({ onResult }: Props) {
  const [apiBase, setApiBaseInput] = useState(getApiBase());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      setApiBase(apiBase);
      const result = await login(email, password);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card" onSubmit={submit}>
        <h1>Church Admin</h1>

        <label>API base URL</label>
        <input
          value={apiBase}
          onChange={(e) => setApiBaseInput(e.target.value)}
          placeholder="https://your-codespace-4000.app.github.dev"
          required
        />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <div className="error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="hint">Staff accounts only (Admin/Pastor/Secretary/Media).</p>
      </form>
    </div>
  );
}
