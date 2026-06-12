import type {
  Drop,
  User,
  AuthResponse,
  ReservationResponse,
  PurchaseResponse,
} from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
//update to use env variable for base URL
class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  headers["Content-Type"] = "application/json";
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const message: string = data.error || "Request failed";
    if (data.details) {
      const detail: string = data.details
        .map(
          (d: { path: string; message: string }) => `${d.path}: ${d.message}`,
        )
        .join("; ");
      throw new ApiError(`${message} (${detail})`);
    }
    throw new ApiError(message);
  }

  return data as T;
}

export const api = {
  getDrops: () => request<Drop[]>("GET", "/drops"),
  getDrop: (id: string) => request<Drop>("GET", `/drops/${id}`),
  createDrop: (body: {
    name: string;
    totalStock: number;
    description?: string;
    imageUrl?: string;
  }) => request<Drop>("POST", "/drops", body),
  updateDrop: (id: string, body: {
    name?: string;
    description?: string;
    imageUrl?: string;
    totalStock?: number;
  }) => request<Drop>("PUT", `/drops/${id}`, body),
  deleteDrop: (id: string) => request<{ ok: boolean }>("DELETE", `/drops/${id}`),
  reserve: (userId: string, dropId: string) =>
    request<ReservationResponse>("POST", "/reservations", { userId, dropId }),
  purchase: (userId: string, dropId: string, reservationId: string) =>
    request<PurchaseResponse>("POST", "/purchases", {
      userId,
      dropId,
      reservationId,
    }),
  getUsers: () => request<User[]>("GET", "/users"),
  login: (email: string, password: string) =>
    request<AuthResponse>("POST", "/users/login", { email, password }),
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>("POST", "/users/register", {
      username,
      email,
      password,
    }),
  getMe: () => request<User>("GET", "/users/me"),
  updateProfile: (body: {
    username?: string;
    email?: string;
    password?: string;
  }) => request<User>("PATCH", "/users/me", body),
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    const res = await fetch(`${BASE}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  },
};
