import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export function LoginPage() {
  const navigate = useNavigate();

  const [loginValue, setLoginValue] = useState("admin@dracarys.kz");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(loginValue, password);

      navigate("/today");
    } catch {
      setError("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">DRACARYS</div>
        <h1>Вход</h1>
        <p>CRM для записи клиентов beauty-салона</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
            placeholder="Email или телефон"
          />

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            type="password"
          />

          {error && <div className="form-error">{error}</div>}

          <button disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}