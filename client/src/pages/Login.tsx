import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuthStore } from "../store/auth.store";
import { C } from "../components/design/tokens";

export default function Login() {
  const [email, setEmail] = useState("admin@merino.com");
  const [password, setPassword] = useState("merino123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: storeLogin } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      storeLogin(user, token);
      navigate("/alertas");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%",
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "11px 14px",
    color: C.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "40px 36px",
        width: 380,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg,${C.accent},#ff7043)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>🎨</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>Andres Merino</div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>CRM · Pinturerias</div>
          </div>
        </div>

        <h2 style={{ color: C.text, fontFamily: "Georgia, serif", fontSize: 20, marginBottom: 24 }}>Iniciar sesión</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inp}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inp}
              required
            />
          </div>

          {error && (
            <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? C.accentDim : C.accent,
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "13px",
            fontWeight: 800,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: "14px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Credenciales de prueba</div>
          {[
            ["admin@merino.com", "ADMIN"],
            ["lucas@merino.com", "SALES"],
            ["sofia@merino.com", "SALES"],
          ].map(([em, role]) => (
            <div key={em} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", cursor: "pointer" }}
              onClick={() => { setEmail(em); setPassword("merino123"); }}>
              <span style={{ color: C.text, fontSize: 12 }}>{em}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>{role}</span>
            </div>
          ))}
          <div style={{ color: C.dim, fontSize: 11, marginTop: 6 }}>Contraseña: merino123</div>
        </div>
      </div>
    </div>
  );
}
