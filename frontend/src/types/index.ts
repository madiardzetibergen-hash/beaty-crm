export type UserRole = "owner" | "admin" | "master";

export type User = {
  id: number;
  name: string;
  role: UserRole;
  masterId: number | null;
};

export type Master = {
  id: number;
  name: string;
  colorName: string;
  colorHex: string;
  isTopMaster: boolean;
  isActive: boolean;
};

export type Service = {
  id: number;
  name: string;
  category: string;
  basePrice: number;
  durationMinutes: number;
  isActive: boolean;
};

export type ServiceOption = {
  id: number;
  name: string;
  category: string;
  priceDelta: number;
  durationDeltaMinutes: number;
  isActive: boolean;
};

export type AppointmentListItem = {
  id: number;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  notes: string | null;

  clientId: number;
  clientName: string;
  clientPhoneLast4: string | null;

  masterId: number;
  masterName: string;
  masterColorName: string;
  masterColorHex: string;

  serviceId: number;
  serviceName: string;
  serviceCategory: string;
};

export type AppointmentDetails = AppointmentListItem & {
  clientPhone?: string | null;
  options: {
    id: number;
    name: string;
    priceDelta: number;
    durationDeltaMinutes: number;
  }[];
};