import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { createAppointment } from "../api/appointments";
import { getClients } from "../api/clients";
import { getMasters } from "../api/masters";
import { getServiceOptions, getServices } from "../api/services";
import { BottomNav } from "../components/BottomNav";
import { CuteLoader } from "../components/CuteLoader";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";

import type { Client, Master, Service, ServiceOption } from "../types";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [options, setOptions] = useState<ServiceOption[]>([]);

  const [clientName, setClientName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");

  const [clientSearch, setClientSearch] = useState("");
  const [foundClients, setFoundClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchingClients, setSearchingClients] = useState(false);

  const [masterId, setMasterId] = useState<number | null>(null);
  const [category, setCategory] = useState("Ресницы");
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [optionIds, setOptionIds] = useState<number[]>([]);
  const [date, setDate] = useState(getTodayDateInput());
  const [time, setTime] = useState("10:00");
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

  async function searchClients(value: string) {
    setClientSearch(value);
    setClientName(value);
    setSelectedClient(null);

    if (value.trim().length < 2) {
      setFoundClients([]);
      return;
    }

    try {
      setSearchingClients(true);

      const data = await getClients(value);
      setFoundClients(data.slice(0, 5));
    } catch {
      showToast("Котик не смог найти клиентов", "error");
    } finally {
      setSearchingClients(false);
    }
  }

  function selectClient(client: Client) {
    setSelectedClient(client);
    setClientName(client.name);
    setClientSearch(client.name);
    setPhoneLast4(client.phoneLast4 ?? "");
    setFoundClients([]);
  }

  function clearSelectedClient() {
    setSelectedClient(null);
    setClientSearch("");
    setClientName("");
    setPhoneLast4("");
    setFoundClients([]);
  }

  async function loadData() {
    try {
      setLoading(true);

      const [mastersData, servicesData, optionsData] = await Promise.all([
        getMasters(),
        getServices(),
        getServiceOptions(),
      ]);

      setMasters(mastersData);
      setServices(servicesData);
      setOptions(optionsData);

      const queryMasterId = searchParams.get("masterId");
      const queryServiceId = searchParams.get("serviceId");
      const queryStartTime = searchParams.get("startTime");

      if (queryMasterId) {
        setMasterId(Number(queryMasterId));
      } else {
        setMasterId(mastersData[0]?.id ?? null);
      }

      if (queryServiceId) {
        const service = servicesData.find(
          (item) => item.id === Number(queryServiceId)
        );

        setServiceId(service?.id ?? null);
        setCategory(service?.category ?? "Ресницы");
      } else {
        const firstLashService = servicesData.find(
          (item) => item.category === "Ресницы"
        );

        setServiceId(firstLashService?.id ?? servicesData[0]?.id ?? null);
        setCategory(firstLashService?.category ?? servicesData[0]?.category ?? "Ресницы");
      }

      if (queryStartTime) {
        const startDate = new Date(queryStartTime);

        setDate(startDate.toISOString().slice(0, 10));
        setTime(startDate.toTimeString().slice(0, 5));
      }
    } catch {
      showToast("Котик не смог подготовить форму записи", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!clientName || !masterId || !serviceId) {
      showToast("Заполни клиента, мастера и услугу", "error");
      return;
    }

    const fakePhone = phoneLast4 ? `8700000${phoneLast4}` : undefined;
    const startTime = new Date(`${date}T${time}:00`).toISOString();

    try {
      setSaving(true);

      await createAppointment({
        clientId: selectedClient?.id,

        client: selectedClient
          ? undefined
          : {
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

      showToast("Котик создал запись", "success");
      navigate("/today");
    } catch (error: any) {
      if (error?.response?.status === 409) {
        showToast("Это время уже занято у мастера", "error");
        return;
      }

      showToast("Ошибка при создании записи", "error");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="mobile-page new-page">
        <header className="form-header">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
            Отмена
          </button>

          <h1>Новая запись</h1>

          <button className="save-link" disabled>
            ...
          </button>
        </header>

        <CuteLoader text="Котик готовит форму записи..." />
        <ListSkeleton count={5} />

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
          Отмена
        </button>

        <h1>Новая запись</h1>

        <button className="save-link" onClick={handleSubmit} disabled={saving}>
          {saving ? "..." : "Сохранить"}
        </button>
      </header>

      <section className="form-section">
        {saving && <CuteLoader text="Котик создает запись..." />}

        <div className="client-search-wrapper">
          <input
            className="soft-input"
            placeholder="Имя клиента или последние 4 цифры"
            value={clientSearch}
            onChange={(event) => searchClients(event.target.value)}
            disabled={saving}
          />

          {searchingClients && (
            <p className="client-search-hint">Котик ищет клиента...</p>
          )}

          {selectedClient && (
            <div className="selected-client-box">
              <div>
                <b>{selectedClient.name}</b>
                <span>
                  {selectedClient.phoneLast4
                    ? `****${selectedClient.phoneLast4}`
                    : "номер не указан"}
                </span>
              </div>

              <button onClick={clearSelectedClient} disabled={saving}>Сменить</button>
            </div>
          )}

          {!selectedClient && foundClients.length > 0 && (
            <div className="client-search-results">
              {foundClients.map((client) => (
                <button key={client.id} onClick={() => selectClient(client)} disabled={saving}>
                  <div>
                    <b>{client.name}</b>
                    <span>
                      {client.phoneLast4
                        ? `****${client.phoneLast4}`
                        : "номер не указан"}
                    </span>
                  </div>

                  <small>Выбрать</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          className="soft-input"
          placeholder="Последние 4 цифры телефона"
          value={phoneLast4}
          maxLength={4}
          disabled={Boolean(selectedClient) || saving}
          onChange={(event) => setPhoneLast4(event.target.value)}
        />

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
          placeholder="Например: ресницы и брови, натуральный эффект"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={saving}
        />

        <div className="summary-box">
          <p>
            {selectedClient ? selectedClient.name : clientName || "Клиент"} ·{" "}
            {selectedClient?.phoneLast4 ?? phoneLast4 ?? "0000"}
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
          {saving ? "Создаем..." : "Создать запись"}
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