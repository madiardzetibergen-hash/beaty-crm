import { api } from "./api";

export type FreeSlot = {
  startTime: string;
  endTime: string;
  label: string;
};

export async function getFreeSlots(params: {
  masterId: number;
  serviceId: number;
  date: string;
  optionIds?: number[];
}) {
  const response = await api.get<{
    masterId: number;
    serviceId: number;
    date: string;
    durationMinutes: number;
    slots: FreeSlot[];
  }>("/free-slots", {
    params: {
      masterId: params.masterId,
      serviceId: params.serviceId,
      date: params.date,
      optionIds: params.optionIds?.join(","),
    },
  });

  return response.data;
}