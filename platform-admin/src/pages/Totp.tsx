import { useEffect, useState } from "react";
import { totpSetup, totpEnable, totpVerify, setToken, type AuthResult } from "../api";

interface Props {
  preMfaToken: string;
  mfaSetupRequired: boolean;
  onAuthenticated: (result: AuthResult) => void;
}

export default function Totp({ preMfaToken, mfaSetupRequired, onAuthenticated }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mfaSetupRequired) {
      totpSetup(preMfaToken)
        .then((res) => {
          setQrCode(res.qrCode);
          setSecret(res.secret);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Could not start MFA setup"));
    }
  }, [mfaSetupRequired, preMfaToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = mfaSetupRequired
        ? await totpEnable(preMfaToken, code)
        : await totpVerify(preMfaToken, code);
      setToken(result.token);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card" onSubmit={submit}>
        <h1>{mfaSetupRequired ? "Set up two-factor auth" : "Enter your 6-digit code"}</h1>

        {mfaSetupRequired && (
          <>
            <p className="hint">Scan this with Google Authenticator, Authy, or run:</p>
            <p className="hint"><code>oathtool --totp -b "&lt;secret&gt;"</code></p>
            {qrCode && (
              <div className="qr-box">
                <img src={qrCode} alt="TOTP QR code" />
              </div>
            )}
            {secret && (
              <>
                <label>Secret (manual entry)</label>
                <div className="secret">{secret}</div>
              </>
            )}
          </>
        )}

        <label>Authenticator code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          inputMode="numeric"
          autoFocus
          required
        />

        {error && <div className="error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Verifying..." : mfaSetupRequired ? "Enable & continue" : "Verify"}
        </button>
      </form>
    </div>
  );
}
