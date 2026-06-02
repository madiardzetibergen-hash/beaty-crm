import { ArrowLeft, CalendarDays, Check, Copy, Phone, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";

import {
  cancelAppointment,
  getAppointment,
  updateAppointmentStatus,
} from "../api/appointments";
import type { AppointmentDetails } from "../types";
import { BottomNav } from "../components/BottomNav";
import { CuteLoader } from "../components/CuteLoader";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";
import { EmptyState } from "../components/EmptyState";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function getTimeRange(start: string, end: string) {
  return `${format(new Date(start), "HH:mm")}–${format(new Date(end), "HH:mm")}`;
}

export function AppointmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const whatsappText = useMemo(() => {
    if (!appointment) return "";

    return `Здравствуйте, ${appointment.clientName} ❤️
Вы записаны ${format(new Date(appointment.startTime), "d.MM")} в ${format(
      new Date(appointment.startTime),
      "HH:mm"
    )} к мастеру ${appointment.masterName} на ${appointment.serviceName}.
Адрес: ...
Пожалуйста, подтвердите запись.`;
  }, [appointment]);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function loadAppointment() {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getAppointment(id);
      setAppointment(data);
    } catch {
      showToast("Котик не смог загрузить запись", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!appointment) return;

    try {
      setActionLoading(true);
      await updateAppointmentStatus(appointment.id, "completed", appointment.notes ?? undefined);
      await loadAppointment();
      showToast("Запись завершена", "success");
    } catch {
      showToast("Не получилось завершить запись", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!appointment) return;

    try {
      setActionLoading(true);
      await cancelAppointment(appointment.id);
      showToast("Запись отменена", "success");
      navigate("/today");
    } catch {
      showToast("Не получилось отменить запись", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function copyWhatsappText() {
    await navigator.clipboard.writeText(whatsappText);
    showToast("Котик скопировал текст", "success");
  }

  function openWhatsapp() {
    if (!appointment?.clientPhone) {
      showToast("У клиента нет полного номера телефона", "error");
      return;
    }

    const phone = appointment.clientPhone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;

    window.open(url, "_blank");
  }

  function callClient() {
    if (!appointment?.clientPhone) {
      showToast("У клиента нет полного номера телефона", "error");
      return;
    }

    window.location.href = `tel:${appointment.clientPhone}`;
  }

  useEffect(() => {
    loadAppointment();
  }, [id]);

  if (loading) {
    return (
      <main className="mobile-page details-page">
        <header className="details-nav">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Детали записи</h1>
        </header>

        <CuteLoader text="Котик ищет детали записи..." />
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

  if (!appointment) {
    return (
      <main className="mobile-page details-page">
        <header className="details-nav">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Детали записи</h1>
        </header>

        <EmptyState
          title="Запись не найдена"
          text="Котик проверил календарь, но такой записи не увидел."
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
    <main className="mobile-page details-page">
      <header className="details-nav">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Детали записи</h1>
      </header>

      {actionLoading && <CuteLoader text="Котик обновляет запись..." />}

      <section
        className="details-hero"
        style={{ background: appointment.masterColorHex }}
      >
        <h2>{appointment.clientName}</h2>
        <p>{appointment.clientPhoneLast4}</p>
      </section>

      <section className="details-card">
        <div>
          <span>Услуга</span>
          <b>{appointment.serviceName}</b>
        </div>

        <div>
          <span>Мастер</span>
          <b>{appointment.masterName}</b>
        </div>

        <div>
          <span>Дата</span>
          <b>{format(new Date(appointment.startTime), "d MMMM")}</b>
        </div>

        <div>
          <span>Время</span>
          <b>{getTimeRange(appointment.startTime, appointment.endTime)}</b>
        </div>

        <div>
          <span>Цена</span>
          <b>₸{appointment.totalPrice.toLocaleString("ru-RU")}</b>
        </div>

        <div>
          <span>Статус</span>
          <b className="success-text">{appointment.status}</b>
        </div>

        <div className="details-comment">
          <span>Комментарий</span>
          <b>{appointment.notes || "—"}</b>
        </div>
      </section>

      <section className="action-grid">
        <button className="green-button" onClick={openWhatsapp} disabled={actionLoading}>
          <Send size={20} />
          WhatsApp
        </button>

        <button className="dark-button" onClick={callClient} disabled={actionLoading}>
          <Phone size={20} />
          Позвонить
        </button>

        <button
          className="light-button"
          onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
          disabled={actionLoading}
        >
          <CalendarDays size={20} />
          Перенести
        </button>

        <button className="light-button" onClick={handleCancel} disabled={actionLoading}>
          <X size={20} />
          Отменить
        </button>
      </section>

      <button className="wide-red-button" onClick={handleComplete} disabled={actionLoading}>
        <Check size={22} />
        Завершить
      </button>

      <section className="whatsapp-card">
        <p>WhatsApp-шаблон</p>
        <pre>{whatsappText}</pre>

        <div className="whatsapp-actions">
          <button className="red-button" onClick={copyWhatsappText}>
            <Copy size={18} />
            Скопировать
          </button>

          <button className="green-button" onClick={openWhatsapp}>
            Открыть WhatsApp
          </button>
        </div>
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