import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../api/auth";
import { CuteLoader } from "../components/CuteLoader";
import { Toast } from "../components/Toast";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

export function LoginPage() {
  const navigate = useNavigate();

  const [loginValue, setLoginValue] = useState("admin@dracarys.kz");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(loginValue, password);

      showToast("Котик пропустил тебя в CRM", "success");
      navigate("/today");
    } catch {
      setError("Неверный логин или пароль");
      showToast("Котик не узнал этот аккаунт", "error");
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

        {loading && <CuteLoader text="Котик проверяет доступ..." />}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}