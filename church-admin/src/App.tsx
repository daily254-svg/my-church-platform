import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Totp from "./pages/Totp";
import Dashboard from "./pages/Dashboard";
import { getToken, setToken, clearToken, me, type AuthedUser, type AuthResult, type LoginResult } from "./api";

const STAFF_ROLES = ["ADMIN", "PASTOR", "SECRETARY", "MEDIA"];

type Stage =
  | { name: "loading" }
  | { name: "login" }
  | { name: "totp"; preMfaToken: string; mfaSetupRequired: boolean }
  | { name: "denied" }
  | { name: "dashboard"; token: string; user: AuthedUser };

export default function App() {
  const [stage, setStage] = useState<Stage>({ name: "loading" });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStage({ name: "login" });
      return;
    }
    me(token)
      .then((user) => {
        if (!STAFF_ROLES.includes(user.role)) {
          clearToken();
          setStage({ name: "denied" });
          return;
        }
        setStage({ name: "dashboard", token, user });
      })
      .catch(() => {
        clearToken();
        setStage({ name: "login" });
      });
  }, []);

  const handleLoginResult = (result: LoginResult) => {
    if (result.preMfaToken) {
      setStage({ name: "totp", preMfaToken: result.preMfaToken, mfaSetupRequired: !!result.mfaSetupRequired });
      return;
    }
    // MEMBER accounts log in directly (no MFA) — this panel isn't for them.
    clearToken();
    setStage({ name: "denied" });
  };

  const handleAuthenticated = (result: AuthResult) => {
    setToken(result.token);
    setStage({ name: "dashboard", token: result.token, user: result.user });
  };

  if (stage.name === "loading") return null;

  if (stage.name === "login") {
    return <Login onResult={handleLoginResult} />;
  }

  if (stage.name === "denied") {
    return (
      <div className="center-screen">
        <div className="card">
          <h1>Not authorized</h1>
          <p className="hint">
            This panel is for church staff (Admin, Pastor, Secretary, Media) only. If you're a
            member, use the mobile app instead.
          </p>
          <button className="btn-primary" onClick={() => setStage({ name: "login" })}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (stage.name === "totp") {
    return (
      <Totp
        preMfaToken={stage.preMfaToken}
        mfaSetupRequired={stage.mfaSetupRequired}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <Dashboard
      token={stage.token}
      user={stage.user}
      onLogout={() => {
        clearToken();
        setStage({ name: "login" });
      }}
    />
  );
}
