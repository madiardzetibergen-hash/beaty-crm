import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createRequest } from "../api/requests";
import { BottomNav } from "../components/BottomNav";
import { CuteLoader } from "../components/CuteLoader";
import { Toast } from "../components/Toast";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

const templates = [
  "Перенести запись",
  "Отменить запись",
  "Поменять время",
  "Добавить выходной",
  "Проверить клиента",
  "Другое",
];

export function NewRequestPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("Перенести запись");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function handleSubmit() {
    if (!title || !message) {
      showToast("Заполни тему и сообщение", "error");
      return;
    }

    try {
      setLoading(true);

      await createRequest({
        title,
        message,
      });

      showToast("Котик отправил заявку админу", "success");
      navigate("/requests");
    } catch {
      showToast("Ошибка при создании заявки", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mobile-page new-request-page">
      <header className="form-header">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
          Назад
        </button>

        <h1>Заявка админу</h1>

        <button className="save-link" onClick={handleSubmit} disabled={loading}>
          {loading ? "..." : "Отправить"}
        </button>
      </header>

      <section className="form-section">
        {loading && <CuteLoader text="Котик несет заявку админу..." />}

        <label className="field-label">Что нужно сделать?</label>

        <div className="request-template-grid">
          {templates.map((item) => (
            <button
              key={item}
              className={title === item ? "request-template active-red" : "request-template"}
              onClick={() => setTitle(item)}
              disabled={loading}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="field-label">Комментарий</label>

        <textarea
          className="soft-textarea request-textarea"
          placeholder="Например: перенесите, пожалуйста, Кристину 0606 с 14:00 на 16:00"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={loading}
        />

        <div className="request-hint">
          <b>Подсказка от котика</b>
          <p>
            Пиши конкретно: имя клиента, последние 4 цифры, дату, время и что нужно изменить.
          </p>
        </div>

        <button className="wide-red-button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Отправляем..." : "Отправить заявку"}
        </button>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BottomNav />
    </main>
  );
}