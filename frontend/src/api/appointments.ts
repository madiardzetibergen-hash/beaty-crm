import { api } from "./api";
import type { AppointmentDetails, AppointmentListItem } from "../types";

export async function getAppointments(date: string) {
  const response = await api.get<AppointmentListItem[]>("/appointments", {
    params: { date },
  });

  return response.data;
}

export async function getAppointment(id: string | number) {
  const response = await api.get<AppointmentDetails>(`/appointments/${id}`);
  return response.data;
}

export type CreateAppointmentPayload = {
  clientId?: number;

  client?: {
    name: string;
    phone?: string;
    instagram?: string;
    notes?: string;
  };

  masterId: number;
  serviceId: number;
  optionIds: number[];
  startTime: string;
  notes?: string;
};

export async function createAppointment(payload: CreateAppointmentPayload) {
  const response = await api.post("/appointments", payload);
  return response.data;
}

export async function updateAppointmentStatus(
  id: number | string,
  status: string,
  notes?: string
) {
  const response = await api.patch(`/appointments/${id}/status`, {
    status,
    notes,
  });

  return response.data;
}

export async function cancelAppointment(id: number | string) {
  const response = await api.delete(`/appointments/${id}`);
  return response.data;
}

export type UpdateAppointmentPayload = {
  masterId?: number;
  serviceId?: number;
  optionIds?: number[];
  startTime?: string;
  notes?: string;
  status?: string;
};

export async function updateAppointment(
  id: number | string,
  payload: UpdateAppointmentPayload
) {
  const response = await api.patch(`/appointments/${id}`, payload);
  return response.data;
}