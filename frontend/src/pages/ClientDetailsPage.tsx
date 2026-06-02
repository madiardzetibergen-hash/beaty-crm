import { ArrowLeft, CalendarDays, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";

import { getClient, getClientAppointments } from "../api/clients";
import { BottomNav } from "../components/BottomNav";
import { CuteLoader } from "../components/CuteLoader";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";

import type { Client, ClientAppointment } from "../types";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function formatTimeRange(start: string, end: string) {
  return `${format(new Date(start), "HH:mm")}–${format(new Date(end), "HH:mm")}`;
}

export function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  const totalSpent = useMemo(() => {
    return appointments
      .filter((item) => item.status !== "cancelled")
      .reduce((sum, item) => sum + item.totalPrice, 0);
  }, [appointments]);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function loadData() {
    if (!id) return;

    try {
      setLoading(true);

      const [clientData, appointmentsData] = await Promise.all([
        getClient(id),
        getClientAppointments(id),
      ]);

      setClient(clientData);
      setAppointments(appointmentsData);
    } catch {
      showToast("Котик не смог загрузить клиента", "error");
    } finally {
      setLoading(false);
    }
  }

  function callClient() {
    if (!client?.phone) {
      showToast("У клиента нет полного номера", "error");
      return;
    }

    window.location.href = `tel:${client.phone}`;
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <main className="mobile-page client-details-page">
        <header className="details-nav">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Клиент</h1>
        </header>

        <CuteLoader text="Котик ищет карточку клиента..." />
        <ListSkeleton count={3} />

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

  if (!client) {
    return (
      <main className="mobile-page client-details-page">
        <header className="details-nav">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Клиент</h1>
        </header>

        <EmptyState
          title="Клиент не найден"
          text="Котик проверил базу, но такого клиента не увидел."
          actionText="Назад"
          onAction={() => navigate(-1)}
        />

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

  return (
    <main className="mobile-page client-details-page">
      <header className="details-nav">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Клиент</h1>
      </header>

      <section className="client-hero">
        <h2>{client.name}</h2>
        <p>{client.phoneLast4 ? `****${client.phoneLast4}` : "номер не указан"}</p>

        <button onClick={callClient}>
          <Phone size={18} />
          Позвонить
        </button>
      </section>

      <section className="client-stats-grid">
        <div>
          <b>{appointments.length}</b>
          <span>записей</span>
        </div>

        <div>
          <b>₸{totalSpent.toLocaleString("ru-RU")}</b>
          <span>сумма</span>
        </div>
      </section>

      <section className="client-info-card">
        <div>
          <span>Телефон</span>
          <b>{client.phone || "—"}</b>
        </div>

        <div>
          <span>Instagram</span>
          <b>{client.instagram || "—"}</b>
        </div>

        <div>
          <span>Заметки</span>
          <b>{client.notes || "—"}</b>
        </div>
      </section>

      <section className="client-history">
        <h2>История записей</h2>

        {appointments.map((appointment) => (
          <button
            key={appointment.id}
            className="history-card"
            onClick={() => navigate(`/appointments/${appointment.id}`)}
          >
            <div
              className="history-color"
              style={{ background: appointment.masterColorHex }}
            />

            <div className="history-content">
              <div className="history-top">
                <b>{appointment.serviceName}</b>
                <span>₸{appointment.totalPrice.toLocaleString("ru-RU")}</span>
              </div>

              <p>
                <CalendarDays size={15} />
                {format(new Date(appointment.startTime), "dd.MM.yyyy")} ·{" "}
                {formatTimeRange(appointment.startTime, appointment.endTime)}
              </p>

              <small>
                {appointment.masterName} · {appointment.status}
              </small>
            </div>
          </button>
        ))}

        {appointments.length === 0 && (
          <EmptyState
            title="Истории пока нет"
            text="Котик будет хранить здесь все будущие записи клиента."
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