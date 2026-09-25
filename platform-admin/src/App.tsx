import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Totp from "./pages/Totp";
import Dashboard from "./pages/Dashboard";
import { getToken, clearToken, me, type Staff, type AuthResult } from "./api";

type Stage =
  | { name: "loading" }
  | { name: "login" }
  | { name: "totp"; preMfaToken: string; mfaSetupRequired: boolean }
  | { name: "dashboard"; token: string; staff: Staff };

export default function App() {
  const [stage, setStage] = useState<Stage>({ name: "loading" });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStage({ name: "login" });
      return;
    }
    me(token)
      .then((staff) => setStage({ name: "dashboard", token, staff }))
      .catch(() => {
        clearToken();
        setStage({ name: "login" });
      });
  }, []);

  if (stage.name === "loading") return null;

  if (stage.name === "login") {
    return (
      <Login
        onLoggedIn={(preMfaToken, mfaSetupRequired) => setStage({ name: "totp", preMfaToken, mfaSetupRequired })}
      />
    );
  }

  if (stage.name === "totp") {
    return (
      <Totp
        preMfaToken={stage.preMfaToken}
        mfaSetupRequired={stage.mfaSetupRequired}
        onAuthenticated={(result: AuthResult) => setStage({ name: "dashboard", token: result.token, staff: result.staff })}
      />
    );
  }

  return <Dashboard token={stage.token} staff={stage.staff} onLogout={() => setStage({ name: "login" })} />;
}
