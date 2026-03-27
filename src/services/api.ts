import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.prolite.gay/";

const api = axios.create({
  baseURL: apiBaseUrl,
});

const getStoredAccessToken = () => {
  const token = localStorage.getItem("admin_token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
};

const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      if ("error" in data && typeof data.error === "string") {
        return data.error;
      }

      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
};

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(new Error(getApiErrorMessage(error))),
);

export default api;
