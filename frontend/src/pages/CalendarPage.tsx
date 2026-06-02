import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

import { getAppointments } from "../api/appointments";
import { getMasters } from "../api/masters";
import type { AppointmentListItem, Master } from "../types";
import { BottomNav } from "../components/BottomNav";

const hours = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

function todayIsoDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function CalendarPage() {
  const navigate = useNavigate();

  const [masters, setMasters] = useState<Master[]>([]);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);

  async function loadData() {
    const [mastersData, appointmentsData] = await Promise.all([
      getMasters(),
      getAppointments(todayIsoDate()),
    ]);

    setMasters(mastersData);
    setAppointments(appointmentsData);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="mobile-page calendar-page">
      <header className="page-header">
        <div>
          <h1>Календарь</h1>

          <div className="date-switcher">
            <ChevronLeft size={20} />
            <span>Сегодня, 2 июня</span>
            <ChevronRight size={20} />
          </div>
        </div>
      </header>

      <div className="mode-switch">
        <button className="active-red">День</button>
        <button>Неделя</button>
      </div>

      <section className="calendar-grid">
        <div className="time-column">
          <div className="calendar-spacer" />
          {hours.map((hour) => (
            <div key={hour} className="time-cell">
              {hour}
            </div>
          ))}
        </div>

        <div
          className="masters-calendar"
          style={{
            gridTemplateColumns: `repeat(${masters.length}, 160px)`,
          }}
        >
          {masters.map((master) => (
            <div key={master.id} className="calendar-master-name">
              {master.name}
            </div>
          ))}

          {masters.map((master) => (
            <div key={master.id} className="master-day-column">
              {hours.map((hour) => (
                <div key={hour} className="calendar-hour-line" />
              ))}

              {appointments
                .filter((appointment) => appointment.masterId === master.id)
                .map((appointment) => {
                  const start = new Date(appointment.startTime);
                  const startHour = start.getHours();
                  const startMinute = start.getMinutes();

                  const top = (startHour - 9) * 74 + (startMinute / 60) * 74;
                  const duration =
                    (new Date(appointment.endTime).getTime() -
                      new Date(appointment.startTime).getTime()) /
                    1000 /
                    60;
                  const height = Math.max((duration / 60) * 74, 56);

                  return (
                    <button
                      key={appointment.id}
                      className="calendar-appointment"
                      style={{
                        background: appointment.masterColorHex,
                        top,
                        height,
                      }}
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      <b>
                        {appointment.clientName} {appointment.clientPhoneLast4}
                      </b>
                      <span>{appointment.serviceName}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </section>

      <button className="fab" onClick={() => navigate("/appointments/new")}>
        <Plus size={30} />
      </button>

      <BottomNav />
    </main>
  );
}