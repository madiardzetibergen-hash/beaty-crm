import { api } from "./api";
import type { Client, ClientAppointment } from "../types";

export async function getClients(search?: string) {
  const response = await api.get<Client[]>("/clients", {
    params: search ? { search } : undefined,
  });

  return response.data;
}

export async function getClient(id: string | number) {
  const response = await api.get<Client>(`/clients/${id}`);
  return response.data;
}

export async function getClientAppointments(id: string | number) {
  const response = await api.get<ClientAppointment[]>(
    `/clients/${id}/appointments`
  );

  return response.data;
}