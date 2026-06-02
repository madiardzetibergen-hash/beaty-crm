import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getRequests,
  updateRequestStatus,
  type AdminRequest,
  type AdminRequestStatus,
} from "../api/requests";
import { getStoredUser } from "../api/auth";
import { BottomNav } from "../components/BottomNav";
import { CuteLoader } from "../components/CuteLoader";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function getStatusLabel(status: AdminRequestStatus) {
  if (status === "new") return "Новая";
  if (status === "in_progress") return "В работе";
  if (status === "done") return "Выполнено";
  if (status === "rejected") return "Отклонено";
  return status;
}

function getStatusClass(status: AdminRequestStatus) {
  if (status === "new") return "status-new";
  if (status === "in_progress") return "status-progress";
  if (status === "done") return "status-done";
  if (status === "rejected") return "status-rejected";
  return "";
}

export function RequestsPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const canManage = user?.role === "admin" || user?.role === "owner";

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getRequests();
      setRequests(data);
    } catch {
      showToast("Котик не смог загрузить заявки", "error");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: number, status: AdminRequestStatus) {
    try {
      setStatusLoadingId(id);
      await updateRequestStatus(id, status);
      await loadRequests();
      showToast("Статус заявки обновлен", "success");
    } catch {
      showToast("Не получилось обновить статус", "error");
    } finally {
      setStatusLoadingId(null);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <main className="mobile-page requests-page">
      <header className="details-nav">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>

        <h1>Заявки админу</h1>
      </header>

      {user?.role === "master" && (
        <button
          className="create-request-button"
          onClick={() => navigate("/requests/new")}
        >
          <Plus size={22} />
          Новая заявка
        </button>
      )}

      <section className="requests-list">
        {loading && (
          <>
            <CuteLoader text="Котик читает заявки..." />
            <ListSkeleton count={4} />
          </>
        )}

        {!loading &&
          requests.map((request) => (
            <article key={request.id} className="request-card">
              <div className="request-card-top">
                <div>
                  <h2>{request.title}</h2>
                  <p>{request.createdByName}</p>
                </div>

                <span className={`request-status ${getStatusClass(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <p className="request-message">{request.message}</p>

              {request.masterName && (
                <div className="request-master">
                  <span
                    style={{
                      background: request.masterColorHex ?? "#970c1d",
                    }}
                  />
                  {request.masterName}
                </div>
              )}

              {statusLoadingId === request.id && (
                <CuteLoader text="Котик меняет статус..." />
              )}

              {canManage && (
                <div className="request-actions">
                  <button
                    onClick={() => changeStatus(request.id, "in_progress")}
                    disabled={statusLoadingId === request.id}
                  >
                    В работу
                  </button>

                  <button
                    onClick={() => changeStatus(request.id, "done")}
                    disabled={statusLoadingId === request.id}
                  >
                    Готово
                  </button>

                  <button
                    onClick={() => changeStatus(request.id, "rejected")}
                    disabled={statusLoadingId === request.id}
                  >
                    Отклонить
                  </button>
                </div>
              )}
            </article>
          ))}

        {!loading && requests.length === 0 && (
          <EmptyState
            title="Заявок пока нет"
            text="Котик будет складывать сюда просьбы мастеров админу."
            actionText={user?.role === "master" ? "Создать заявку" : undefined}
            onAction={user?.role === "master" ? () => navigate("/requests/new") : undefined}
          />
        )}
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