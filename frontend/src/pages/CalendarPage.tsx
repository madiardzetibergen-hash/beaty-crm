import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

import { getAppointments } from "../api/appointments";
import { getMasters } from "../api/masters";
import { getServices } from "../api/services";
import { getFreeSlots, type FreeSlot } from "../api/freeSlots";

import type { AppointmentListItem, Master, Service } from "../types";

import { BottomNav } from "../components/BottomNav";
import { MasterFilter } from "../components/MasterFilter";
import { CuteLoader } from "../components/CuteLoader";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function formatTimeRange(start: string, end: string) {
  return `${format(new Date(start), "HH:mm")}–${format(new Date(end), "HH:mm")}`;
}

function getShortServiceName(name: string) {
  return name
    .replace("Наращивание ресниц ", "")
    .replace("Ламинирование ", "Лам. ");
}

export function CalendarPage() {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);

  const [selectedMasterId, setSelectedMasterId] = useState<number | "all">(
    "all"
  );

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );

  const [freeSlots, setFreeSlots] = useState<Record<number, FreeSlot[]>>({});

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const visibleMasters = useMemo(() => {
    if (selectedMasterId === "all") return masters;

    return masters.filter((master) => master.id === selectedMasterId);
  }, [masters, selectedMasterId]);

  const appointmentsByMaster = useMemo(() => {
    const map = new Map<number, AppointmentListItem[]>();

    for (const master of masters) {
      map.set(master.id, []);
    }

    for (const appointment of appointments) {
      const list = map.get(appointment.masterId) ?? [];
      list.push(appointment);
      map.set(appointment.masterId, list);
    }

    for (const [masterId, list] of map.entries()) {
      map.set(
        masterId,
        list.sort(
          (a, b) =>
            new Date(a.startTime).getTime() -
            new Date(b.startTime).getTime()
        )
      );
    }

    return map;
  }, [appointments, masters]);

  const dayTotal = useMemo(() => {
    return appointments.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [appointments]);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function loadData() {
    try {
      setLoading(true);

      const [mastersData, appointmentsData, servicesData] = await Promise.all([
        getMasters(),
        getAppointments(toIsoDate(date)),
        getServices(),
      ]);

      setMasters(mastersData);
      setAppointments(appointmentsData);
      setServices(servicesData);

      if (!selectedServiceId) {
        setSelectedServiceId(servicesData[0]?.id ?? null);
      }

      setFreeSlots({});
    } catch {
      showToast("Котик не смог загрузить календарь", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadFreeSlots() {
    if (!selectedServiceId) {
      showToast("Выбери услугу для расчета свободных окон", "error");
      return;
    }

    try {
      setLoadingSlots(true);

      const targetMasters =
        selectedMasterId === "all"
          ? masters
          : masters.filter((master) => master.id === selectedMasterId);

      const result: Record<number, FreeSlot[]> = {};

      for (const master of targetMasters) {
        const data = await getFreeSlots({
          masterId: master.id,
          serviceId: selectedServiceId,
          date: toIsoDate(date),
        });

        result[master.id] = data.slots;
      }

      setFreeSlots(result);
      showToast("Котик нашел свободные окна", "success");
    } catch {
      showToast("Не получилось рассчитать свободные окна", "error");
    } finally {
      setLoadingSlots(false);
    }
  }

  function prevDay() {
    setDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  }

  function nextDay() {
    setDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  }

  function goToNewAppointment(masterId: number, slot: FreeSlot) {
    navigate(
      `/appointments/new?masterId=${masterId}&serviceId=${selectedServiceId}&startTime=${encodeURIComponent(
        slot.startTime
      )}`
    );
  }

  useEffect(() => {
    loadData();
  }, [date]);

  return (
    <main className="mobile-page calendar-page-v2">
      <header className="calendar-header-v2">
        <h1>Календарь</h1>

        <div className="calendar-date-row">
          <button onClick={prevDay}>
            <ChevronLeft size={22} />
          </button>

          <div>
            <b>{format(date, "d MMMM", { locale: ru })}</b>
            <span>{format(date, "EEEE", { locale: ru })}</span>
          </div>

          <button onClick={nextDay}>
            <ChevronRight size={22} />
          </button>
        </div>
      </header>

      <MasterFilter
        masters={masters}
        selectedMasterId={selectedMasterId}
        onChange={(value) => {
          setSelectedMasterId(value);
          setFreeSlots({});
        }}
      />

      <section className="calendar-summary-v2">
        <div>
          <b>{appointments.length}</b>
          <span>записей</span>
        </div>

        <div>
          <b>{visibleMasters.length}</b>
          <span>мастера</span>
        </div>

        <div>
          <b>₸{dayTotal.toLocaleString("ru-RU")}</b>
          <span>план</span>
        </div>
      </section>

      <section className="free-slots-panel">
        <div className="free-slots-top">
          <div>
            <b>Свободные окна</b>
            <span>Выбери услугу, чтобы котик рассчитал время</span>
          </div>

          <button onClick={loadFreeSlots} disabled={loadingSlots}>
            {loadingSlots ? "Ищем..." : "Показать"}
          </button>
        </div>

        <select
          value={selectedServiceId ?? ""}
          onChange={(event) => {
            setSelectedServiceId(Number(event.target.value));
            setFreeSlots({});
          }}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} · {service.durationMinutes} мин
            </option>
          ))}
        </select>

        {loadingSlots && <CuteLoader text="Котик нюхает свободные окна..." />}

        {Object.keys(freeSlots).length > 0 && (
          <div className="free-slots-list">
            {visibleMasters.map((master) => {
              const slots = freeSlots[master.id] ?? [];

              return (
                <div key={master.id} className="free-master-block">
                  <div className="free-master-title">
                    <span style={{ background: master.colorHex }} />
                    <b>{master.name}</b>
                  </div>

                  {slots.length === 0 && (
                    <p className="no-slots">Свободных окон нет</p>
                  )}

                  {slots.length > 0 && (
                    <div className="free-slot-chips">
                      {slots.slice(0, 6).map((slot) => (
                        <button
                          key={slot.startTime}
                          onClick={() => goToNewAppointment(master.id, slot)}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {loading && (
        <>
          <CuteLoader text="Котик собирает расписание..." />
          <ListSkeleton count={4} />
        </>
      )}

      {!loading && (
        <section className="master-schedule-list">
          {visibleMasters.map((master) => {
            const masterAppointments = appointmentsByMaster.get(master.id) ?? [];

            return (
              <article key={master.id} className="master-schedule-card">
                <div className="master-schedule-header">
                  <div>
                    <h2>{master.name}</h2>
                    <p>{master.colorName}</p>
                  </div>

                  <div
                    className="master-schedule-dot"
                    style={{ background: master.colorHex }}
                  />
                </div>

                {masterAppointments.length === 0 && (
                  <div className="empty-master-day">
                    <Clock size={18} />
                    <span>Котик отдыхает: на этот день записей нет</span>
                  </div>
                )}

                {masterAppointments.length > 0 && (
                  <div className="master-appointments">
                    {masterAppointments.map((appointment) => (
                      <button
                        key={appointment.id}
                        className="schedule-appointment-row"
                        onClick={() =>
                          navigate(`/appointments/${appointment.id}`)
                        }
                      >
                        <div
                          className="schedule-time"
                          style={{ color: master.colorHex }}
                        >
                          {formatTimeRange(
                            appointment.startTime,
                            appointment.endTime
                          )}
                        </div>

                        <div className="schedule-info">
                          <div className="schedule-main">
                            <b>
                              {appointment.clientName} ·{" "}
                              {appointment.clientPhoneLast4 ?? "----"}
                            </b>

                            <span>
                              ₸{appointment.totalPrice.toLocaleString("ru-RU")}
                            </span>
                          </div>

                          <p>{getShortServiceName(appointment.serviceName)}</p>

                          {appointment.notes && (
                            <small>{appointment.notes}</small>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      <button className="fab" onClick={() => navigate("/appointments/new")}>
        <Plus size={30} />
      </button>

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