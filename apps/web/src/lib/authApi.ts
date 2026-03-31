const defaultApiBaseUrl =
  typeof window === "undefined"
    ? "http://localhost:4000/api"
    : `${window.location.protocol}//${window.location.hostname}:4000/api`;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "요청 처리 중 오류가 발생했습니다.";

    throw new Error(message);
  }

  return data as T;
}

export async function login(payload: { email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJson<{
    message: string;
    user: {
      id: number;
      email: string;
      nickname: string;
      provider: string;
      status: string;
    };
  }>(response);
}

export async function register(payload: { email: string; nickname: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJson<{
    message: string;
    user: {
      id: number;
      email: string;
      nickname: string;
      provider: string;
      status: string;
    };
  }>(response);
}

export async function fetchMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    user: {
      userId: number;
      email: string;
      nickname: string;
      provider: string;
      status: string;
      createdAt: string;
    };
  }>(response);
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  return parseJson<{ message: string }>(response);
}
