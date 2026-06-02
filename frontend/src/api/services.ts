import { api } from "./api";
import type { Service, ServiceOption } from "../types";

export async function getServices() {
  const response = await api.get<Service[]>("/services");
  return response.data;
}

export async function getServiceOptions() {
  const response = await api.get<ServiceOption[]>("/services/options");
  return response.data;
}