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

function getTimeRange(start: string, end: string) {
  return `${format(new Date(start), "HH:mm")}–${format(new Date(end), "HH:mm")}`;
}

export function AppointmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);

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

  async function loadAppointment() {
    if (!id) return;

    const data = await getAppointment(id);
    setAppointment(data);
  }

  async function handleComplete() {
    if (!appointment) return;

    await updateAppointmentStatus(appointment.id, "completed", appointment.notes ?? undefined);
    await loadAppointment();
  }

  async function handleCancel() {
    if (!appointment) return;

    await cancelAppointment(appointment.id);
    navigate("/today");
  }

  async function copyWhatsappText() {
    await navigator.clipboard.writeText(whatsappText);
    alert("Текст скопирован");
  }

  function openWhatsapp() {
    if (!appointment?.clientPhone) {
      alert("У клиента нет полного номера телефона");
      return;
    }

    const phone = appointment.clientPhone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;

    window.open(url, "_blank");
  }

  useEffect(() => {
    loadAppointment();
  }, [id]);

  if (!appointment) {
    return (
      <main className="mobile-page">
        <p className="muted">Загрузка...</p>
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
        <button className="green-button" onClick={openWhatsapp}>
          <Send size={20} />
          WhatsApp
        </button>

        <button className="dark-button">
          <Phone size={20} />
          Позвонить
        </button>

      <button
  className="light-button"
  onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
>
  <CalendarDays size={20} />
  Перенести
</button>

        <button className="light-button" onClick={handleCancel}>
          <X size={20} />
          Отменить
        </button>
      </section>

      <button className="wide-red-button" onClick={handleComplete}>
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

      <BottomNav />
    </main>
  );
}