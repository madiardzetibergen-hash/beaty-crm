import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { AppointmentListItem } from "../types";

type Props = {
  appointment: AppointmentListItem;
};

function formatTimeRange(start: string, end: string) {
  return `${format(new Date(start), "HH:mm")}–${format(new Date(end), "HH:mm")}`;
}

export function AppointmentCard({ appointment }: Props) {
  const navigate = useNavigate();

  return (
    <button
      className="appointment-card"
      style={{ background: appointment.masterColorHex }}
      onClick={() => navigate(`/appointments/${appointment.id}`)}
    >
      <div className="appointment-top">
        <span>{formatTimeRange(appointment.startTime, appointment.endTime)}</span>
        <span>₸{appointment.totalPrice.toLocaleString("ru-RU")}</span>
      </div>

      <div className="appointment-client">
        {appointment.clientName} · {appointment.clientPhoneLast4 ?? "----"}
      </div>

      <div className="appointment-service">{appointment.serviceName}</div>

      <div className="appointment-master">{appointment.masterName}</div>
    </button>
  );
}