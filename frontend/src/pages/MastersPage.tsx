import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMasters } from "../api/masters";
import { BottomNav } from "../components/BottomNav";
import { CuteLoader } from "../components/CuteLoader";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";

import type { Master } from "../types";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

export function MastersPage() {
  const navigate = useNavigate();

  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function loadMasters() {
    try {
      setLoading(true);
      const data = await getMasters();
      setMasters(data);
    } catch {
      showToast("Котик не смог загрузить мастеров", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMasters();
  }, []);

  return (
    <main className="mobile-page masters-page">
      <header className="details-nav">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Мастера</h1>
      </header>

      <section className="masters-list">
        {loading && (
          <>
            <CuteLoader text="Котик собирает мастеров..." />
            <ListSkeleton count={3} />
          </>
        )}

        {!loading &&
          masters.map((master) => (
            <article
              key={master.id}
              className="master-card"
              style={{
                borderLeftColor: master.colorHex,
                background: `linear-gradient(135deg, ${master.colorHex}14, #fff)`,
              }}
            >
              <div className="master-card-top">
                <h2>{master.name}</h2>
                <div
                  className="master-color-dot"
                  style={{ background: master.colorHex }}
                />
              </div>

              <div className="master-info-row">
                <span>Цвет:</span>
                <b>{master.colorName}</b>
              </div>

              <div className="master-info-row">
                <span>Роль:</span>
                <b>Мастер</b>
              </div>

              <div className="master-info-row">
                <span>Доступ:</span>
                <b>Только свои записи</b>
              </div>

              <hr />

              <p>Права:</p>
              <ul>
                <li>Может менять статус записи</li>
              </ul>
            </article>
          ))}

        {!loading && masters.length === 0 && (
          <EmptyState
            title="Мастеров пока нет"
            text="Котик будет показывать здесь мастеров после добавления."
          />
        )}
      </section>

      <section className="permissions-section">
        <h2>Настройка прав доступа</h2>

        {[
          "Видит все записи",
          "Может создавать записи",
          "Может редактировать записи",
          "Может удалять записи",
          "Может менять статус",
        ].map((item) => (
          <div className="permission-row" key={item}>
            <span>{item}</span>
            <button className="toggle" />
          </div>
        ))}
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