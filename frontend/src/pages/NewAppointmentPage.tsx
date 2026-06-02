import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createAppointment } from "../api/appointments";
import { getMasters } from "../api/masters";
import { getServiceOptions, getServices } from "../api/services";
import type { Master, Service, ServiceOption } from "../types";
import { BottomNav } from "../components/BottomNav";

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function NewAppointmentPage() {
  const navigate = useNavigate();

  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [options, setOptions] = useState<ServiceOption[]>([]);

  const [clientName, setClientName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [masterId, setMasterId] = useState<number | null>(null);
  const [category, setCategory] = useState("Ресницы");
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [optionIds, setOptionIds] = useState<number[]>([]);
  const [date, setDate] = useState(getTodayDateInput());
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedMaster = masters.find((master) => master.id === masterId);

  const filteredServices = services.filter((service) => service.category === category);
  const filteredOptions = options.filter((option) => option.category === category);

  const selectedOptions = options.filter((option) => optionIds.includes(option.id));

  const totalPrice = useMemo(() => {
    const base = selectedService?.basePrice ?? 0;
    const extra = selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);

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

  function toggleOption(id: number) {
    setOptionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function loadData() {
    const [mastersData, servicesData, optionsData] = await Promise.all([
      getMasters(),
      getServices(),
      getServiceOptions(),
    ]);

    setMasters(mastersData);
    setServices(servicesData);
    setOptions(optionsData);

    setMasterId(mastersData[0]?.id ?? null);
    setServiceId(servicesData.find((item) => item.category === "Ресницы")?.id ?? null);
  }

  async function handleSubmit() {
    if (!clientName || !masterId || !serviceId) {
      alert("Заполни клиента, мастера и услугу");
      return;
    }

    const fakePhone = phoneLast4 ? `8700000${phoneLast4}` : undefined;

    const startTime = new Date(`${date}T${time}:00`).toISOString();

    try {
      await createAppointment({
        client: {
          name: clientName,
          phone: fakePhone,
          notes,
        },
        masterId,
        serviceId,
        optionIds,
        startTime,
        notes,
      });

      navigate("/today");
    } catch (error: any) {
      if (error?.response?.status === 409) {
        alert("Это время уже занято у мастера");
        return;
      }

      alert("Ошибка при создании записи");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="mobile-page new-page">
      <header className="form-header">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
          Отмена
        </button>

        <h1>Новая запись</h1>

        <button className="save-link" onClick={handleSubmit}>
          Сохранить
        </button>
      </header>

      <section className="form-section">
        <input
          className="soft-input"
          placeholder="Имя клиента"
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
        />

        <input
          className="soft-input"
          placeholder="0606"
          value={phoneLast4}
          maxLength={4}
          onChange={(event) => setPhoneLast4(event.target.value)}
        />

        <label className="field-label">Мастер</label>

        <div className="choice-list">
          {masters.map((master) => (
            <button
              key={master.id}
              className={masterId === master.id ? "choice active-choice" : "choice"}
              onClick={() => setMasterId(master.id)}
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
                const firstService = services.find((service) => service.category === item);
                setServiceId(firstService?.id ?? null);
                setOptionIds([]);
              }}
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
              className={serviceId === service.id ? "choice active-choice" : "choice"}
              onClick={() => setServiceId(service.id)}
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
                    optionIds.includes(option.id) ? "choice active-choice" : "choice"
                  }
                  onClick={() => toggleOption(option.id)}
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
            />
          </label>

          <label>
            <span>Время</span>
            <input
              value={time}
              type="time"
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
        </div>

        <textarea
          className="soft-textarea"
          placeholder="Например: ресницы и брови, натуральный эффект"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        <div className="summary-box">
          <p>{clientName || "Клиент"} · {phoneLast4 || "0000"}</p>
          <b>
            {selectedMaster?.name || "Мастер"} · {selectedService?.name || "Услуга"}
          </b>
          <span>
            Длительность: {totalDuration} мин · Итого: ₸
            {totalPrice.toLocaleString("ru-RU")}
          </span>
        </div>

        <button className="wide-red-button" onClick={handleSubmit}>
          Создать запись
        </button>
      </section>

      <BottomNav />
    </main>
  );
}