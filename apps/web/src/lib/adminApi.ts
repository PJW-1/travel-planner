import { API_BASE_URL } from "./authApi";

export type AdminOverview = {
  stats: {
    activeUsers: number;
    adminUsers: number;
    trips: number;
    communityRoutes: number;
    videoExtractions: number;
    savedPlaces: number;
  };
  users: Array<{
    id: string;
    email: string;
    nickname: string;
    role: "user" | "admin";
    status: string;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
  trips: Array<{
    id: string;
    title: string;
    destination: string;
    owner: string;
    status: string;
    isPublic: boolean;
    updatedAt: string;
  }>;
  routes: Array<{
    id: string;
    title: string;
    author: string;
    likes: number;
    comments: number;
    forks: number;
    status: "published" | "hidden";
    publishedAt: string | null;
  }>;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "관리자 정보를 불러오지 못했습니다.";
    throw new Error(message);
  }

  return data as T;
}

export async function fetchAdminOverview() {
  const response = await fetch(`${API_BASE_URL}/admin/overview`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<AdminOverview>(response);
}

export async function updateAdminUserStatus(userId: string, status: "active" | "blocked") {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  return parseJson<{ message: string }>(response);
}

export async function updateAdminCommunityRouteStatus(
  routeId: string,
  status: "published" | "hidden",
) {
  const response = await fetch(`${API_BASE_URL}/admin/community/routes/${routeId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  return parseJson<{ message: string }>(response);
}

export async function deleteAdminTrip(tripId: string) {
  const response = await fetch(`${API_BASE_URL}/admin/trips/${tripId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseJson<{ message: string }>(response);
}
