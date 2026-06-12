export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Drop {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  totalStock: number;
  availableStock: number;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  purchases: PurchaseBrief[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PurchaseBrief {
  user: { username: string };
  createdAt: string;
}

export interface ReservationResponse {
  reservation: {
    id: string;
    userId: string;
    dropId: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  };
  availableStock: number;
}

export interface PurchaseResponse {
  purchase: {
    id: string;
    userId: string;
    dropId: string;
    reservationId: string;
    createdAt: string;
    user: { username: string };
  };
  availableStock: number;
}

export interface StockUpdateEvent {
  dropId: string;
  availableStock: number;
  totalStock: number;
}

export interface PurchaseEvent {
  dropId: string;
  username: string;
  createdAt: string;
}

export interface ReservationExpiredEvent {
  dropId: string;
  reservationId: string;
}

declare global {
  interface Window {
    __socket: import("socket.io-client").Socket | undefined;
  }
}
