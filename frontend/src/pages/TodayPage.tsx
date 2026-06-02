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

function todayIsoDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function TodayPage() {
  const navigate = useNavigate();

  const [masters, setMasters] = useState<Master[]>([]);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);

  const visibleAppointments = useMemo(() => {
    if (selectedMasterId === "all") return appointments;

    return appointments.filter((item) => item.masterId === selectedMasterId);
  }, [appointments, selectedMasterId]);

  const totalPlan = useMemo(() => {
    return visibleAppointments.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [visibleAppointments]);

  async function loadData() {
    try {
      setLoading(true);

      const [mastersData, appointmentsData] = await Promise.all([
        getMasters(),
        getAppointments(todayIsoDate()),
      ]);

      setMasters(mastersData);
      setAppointments(appointmentsData);
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

          <button className="circle-button">
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
        {loading && <p className="muted">Загрузка...</p>}

        {!loading &&
          visibleAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}

        {!loading && visibleAppointments.length === 0 && (
          <div className="empty-state">
            <h3>Записей нет</h3>
            <p>Нажми плюс, чтобы создать новую запись.</p>
          </div>
        )}
      </section>

      <button className="fab" onClick={() => navigate("/appointments/new")}>
        <Plus size={30} />
      </button>

      <BottomNav />
    </main>
  );
}