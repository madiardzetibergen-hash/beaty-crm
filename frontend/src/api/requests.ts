import { api } from "./api";

export type AdminRequestStatus = "new" | "in_progress" | "done" | "rejected";

export type AdminRequest = {
  id: number;
  title: string;
  message: string;
  status: AdminRequestStatus;
  createdAt: string;
  updatedAt: string;

  createdBy: number;
  createdByName: string;

  masterId: number | null;
  masterName: string | null;
  masterColorHex: string | null;
};

export async function getRequests() {
  const response = await api.get<AdminRequest[]>("/requests");
  return response.data;
}

export async function createRequest(payload: {
  title: string;
  message: string;
}) {
  const response = await api.post("/requests", payload);
  return response.data;
}

export async function updateRequestStatus(
  id: number,
  status: AdminRequestStatus
) {
  const response = await api.patch(`/requests/${id}/status`, {
    status,
  });

  return response.data;
}