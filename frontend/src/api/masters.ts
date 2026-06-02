import { api } from "./api";
import type { Master } from "../types";

export async function getMasters() {
  const response = await api.get<Master[]>("/masters");
  return response.data;
}