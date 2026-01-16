import AsyncStorage from "@react-native-async-storage/async-storage";

// API base URL - automatically uses environment-specific backend URL
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("authToken");
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API error: ${response.statusText}`);
  }

  return response.json();
}

export async function get<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: "GET" });
}

export async function post<T>(endpoint: string, body: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function put<T>(endpoint: string, body: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function patch<T>(endpoint: string, body: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function del<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: "DELETE" });
}
