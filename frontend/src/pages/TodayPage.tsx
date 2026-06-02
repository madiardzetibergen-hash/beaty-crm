import { Search, UserRound, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

import { getAppointments } from "../api/appointments";
import { getMasters } from "../api/masters";

import type { AppointmentListItem, Master } from "../types";

import { AppointmentCard } from "../components/AppointmentCard";
import { BottomNav } from "../components/BottomNav";
import { MasterFilter } from "../components/MasterFilter";
import { StatCard } from "../components/StatCard";
import { CuteLoader } from "../components/CuteLoader";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/Skeleton";
import { Toast } from "../components/Toast";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

function todayIsoDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function TodayPage() {
  const navigate = useNavigate();

  const [masters, setMasters] = useState<Master[]>([]);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  const visibleAppointments = useMemo(() => {
    if (selectedMasterId === "all") return appointments;

    return appointments.filter((item) => item.masterId === selectedMasterId);
  }, [appointments, selectedMasterId]);

  const totalPlan = useMemo(() => {
    return visibleAppointments.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [visibleAppointments]);

  function showToast(message: string, type: ToastState["type"] = "info") {
    setToast({ message, type });
  }

  async function loadData() {
    try {
      setLoading(true);

      const [mastersData, appointmentsData] = await Promise.all([
        getMasters(),
        getAppointments(todayIsoDate()),
      ]);

      setMasters(mastersData);
      setAppointments(appointmentsData);
    } catch {
      showToast("Котик не смог загрузить записи на сегодня", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="mobile-page">
      <header className="page-header">
        <div>
          <h1>Сегодня</h1>
          <p>{format(new Date(), "EEE, d MMMM", { locale: ru })}</p>
        </div>

        <div className="header-actions">
          <button className="circle-button">
            <Search size={22} />
          </button>

          <button className="circle-button" onClick={() => navigate("/profile")}>
            <UserRound size={22} />
          </button>
        </div>
      </header>

      <MasterFilter
        masters={masters}
        selectedMasterId={selectedMasterId}
        onChange={setSelectedMasterId}
      />

      <section className="stats-grid">
        <StatCard value={visibleAppointments.length} label="записей" />
        <StatCard value={masters.length} label="мастера" />
        <StatCard value={2} label="свободных окна" />
        <StatCard value={`₸${totalPlan.toLocaleString("ru-RU")}`} label="план" />
      </section>

      <section className="appointments-list">
        {loading && (
          <>
            <CuteLoader text="Котик ищет записи на сегодня..." />
            <ListSkeleton count={4} />
          </>
        )}

        {!loading &&
          visibleAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}

        {!loading && visibleAppointments.length === 0 && (
          <EmptyState
            title="Записей пока нет"
            text="Котик говорит: день свободный. Можно добавить первую запись."
            actionText="Создать запись"
            onAction={() => navigate("/appointments/new")}
          />
        )}
      </section>

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