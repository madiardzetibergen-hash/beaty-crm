import { api } from "./api";
import type { User } from "../types";

type LoginResponse = {
  token: string;
  user: User;
};

export async function login(login: string, password: string) {
  const response = await api.post<LoginResponse>("/auth/login", {
    login,
    password,
  });

  localStorage.setItem("beauty_crm_token", response.data.token);
  localStorage.setItem("beauty_crm_user", JSON.stringify(response.data.user));

  return response.data;
}

export function logout() {
  localStorage.removeItem("beauty_crm_token");
  localStorage.removeItem("beauty_crm_user");
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem("beauty_crm_user");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem("beauty_crm_token");
}