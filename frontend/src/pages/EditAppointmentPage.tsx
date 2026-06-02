import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAppointment, updateAppointment } from "../api/appointments";
import { getMasters } from "../api/masters";
import { getServiceOptions, getServices } from "../api/services";
import { CuteLoader } from "../components/CuteLoader";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";
import { BottomNav } from "../components/BottomNav";

import type {
  AppointmentDetails,
  Master,
  Service,
  ServiceOption,
} from "../types";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function toTimeInput(value: string) {
  const date = new Date(value);
  return date.toTimeString().slice(0, 5);
}

export function EditAppointmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null
  );

  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [options, setOptions] = useState<ServiceOption[]>([]);

  const [masterId, setMasterId] = useState<number | null>(null);
  const [category, setCategory] = useState("Ресницы");
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [optionIds, setOptionIds] = useState<number[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedMaster = masters.find((master) => master.id === masterId);

  const filteredServices = services.filter(
    (service) => service.category === category
  );

  const filteredOptions = options.filter(
    (option) => option.category === category
  );

  const selectedOptions = options.filter((option) =>
    optionIds.includes(option.id)
  );

  const totalPrice = useMemo(() => {
    const base = selectedService?.basePrice ?? 0;
    const extra = selectedOptions.reduce(
      (sum, option) => sum + option.priceDelta,
      0
    );

    return base + extra;
  }, [selectedService, selectedOptions]);

  const totalDuration = useMemo(() => {
    const base = selectedService?.durationMinutes ?? 0;
    const extra = selectedOptions.reduce(
      (sum, option) => sum + option.durationDeltaMinutes,
      0
    );

    return base + extra;
  }, [selectedService, selectedOptions]);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  function toggleOption(id: number) {
    setOptionIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  }

  async function loadData() {
    if (!id) return;

    try {
      setLoading(true);

      const [appointmentData, mastersData, servicesData, optionsData] =
        await Promise.all([
          getAppointment(id),
          getMasters(),
          getServices(),
          getServiceOptions(),
        ]);

      setAppointment(appointmentData);
      setMasters(mastersData);
      setServices(servicesData);
      setOptions(optionsData);

      setMasterId(appointmentData.masterId);
      setServiceId(appointmentData.serviceId);
      setCategory(appointmentData.serviceCategory);
      setOptionIds(appointmentData.options.map((option) => option.id));
      setDate(toDateInput(appointmentData.startTime));
      setTime(toTimeInput(appointmentData.startTime));
      setNotes(appointmentData.notes ?? "");
    } catch {
      showToast("Котик не смог загрузить запись для переноса", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!id || !masterId || !serviceId || !date || !time) {
      showToast("Заполни мастера, услугу, дату и время", "error");
      return;
    }

    const startTime = new Date(`${date}T${time}:00`).toISOString();

    try {
      setSaving(true);

      await updateAppointment(id, {
        masterId,
        serviceId,
        optionIds,
        startTime,
        notes,
        status: "rescheduled",
      });

      showToast("Котик перенес запись", "success");
      navigate(`/appointments/${id}`);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        showToast("Это время уже занято у мастера", "error");
        return;
      }

      showToast("Ошибка при обновлении записи", "error");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <main className="mobile-page new-page">
        <header className="form-header">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
            Назад
          </button>

          <h1>Перенос записи</h1>

          <button className="save-link" disabled>
            ...
          </button>
        </header>

        <CuteLoader text="Котик готовит форму переноса..." />
        <ListSkeleton count={4} />

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
      <main className="mobile-page new-page">
        <CuteLoader text="Котик не нашел запись..." />

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
    <main className="mobile-page new-page">
      <header className="form-header">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
          Назад
        </button>

        <h1>Перенос записи</h1>

        <button className="save-link" onClick={handleSubmit} disabled={saving}>
          {saving ? "..." : "Сохранить"}
        </button>
      </header>

      <section className="form-section">
        {saving && <CuteLoader text="Котик сохраняет изменения..." />}

        <div className="readonly-client-box">
          <span>Клиент</span>
          <b>
            {appointment.clientName} · {appointment.clientPhoneLast4}
          </b>
        </div>

        <label className="field-label">Мастер</label>

        <div className="choice-list">
          {masters.map((master) => (
            <button
              key={master.id}
              className={
                masterId === master.id ? "choice active-choice" : "choice"
              }
              onClick={() => setMasterId(master.id)}
              disabled={saving}
            >
              <b>{master.name}</b>
              <span>{master.colorName}</span>
            </button>
          ))}
        </div>

        <label className="field-label">Категория услуги</label>

        <div className="category-row">
          {["Ресницы", "Брови", "Ламинирование"].map((item) => (
            <button
              key={item}
              className={category === item ? "category active-red" : "category"}
              onClick={() => {
                setCategory(item);
                const firstService = services.find(
                  (service) => service.category === item
                );
                setServiceId(firstService?.id ?? null);
                setOptionIds([]);
              }}
              disabled={saving}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="field-label">Услуга</label>

        <div className="choice-list">
          {filteredServices.map((service) => (
            <button
              key={service.id}
              className={
                serviceId === service.id ? "choice active-choice" : "choice"
              }
              onClick={() => setServiceId(service.id)}
              disabled={saving}
            >
              <b>{service.name.replace("Наращивание ресниц ", "")}</b>
              <span>₸{service.basePrice.toLocaleString("ru-RU")}</span>
            </button>
          ))}
        </div>

        {filteredOptions.length > 0 && (
          <>
            <label className="field-label">Дополнительно</label>

            <div className="choice-list">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  className={
                    optionIds.includes(option.id)
                      ? "choice active-choice"
                      : "choice"
                  }
                  onClick={() => toggleOption(option.id)}
                  disabled={saving}
                >
                  <b>{option.name}</b>
                  <span>+₸{option.priceDelta.toLocaleString("ru-RU")}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="date-time-grid">
          <label>
            <span>Дата</span>
            <input
              value={date}
              type="date"
              onChange={(event) => setDate(event.target.value)}
              disabled={saving}
            />
          </label>

          <label>
            <span>Время</span>
            <input
              value={time}
              type="time"
              onChange={(event) => setTime(event.target.value)}
              disabled={saving}
            />
          </label>
        </div>

        <textarea
          className="soft-textarea"
          placeholder="Комментарий"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={saving}
        />

        <div className="summary-box">
          <p>
            {appointment.clientName} · {appointment.clientPhoneLast4}
          </p>
          <b>
            {selectedMaster?.name || "Мастер"} ·{" "}
            {selectedService?.name || "Услуга"}
          </b>
          <span>
            Длительность: {totalDuration} мин · Итого: ₸
            {totalPrice.toLocaleString("ru-RU")}
          </span>
        </div>

        <button className="wide-red-button" onClick={handleSubmit} disabled={saving}>
          {saving ? "Сохраняем..." : "Сохранить изменения"}
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