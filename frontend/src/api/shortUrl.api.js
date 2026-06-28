import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    if (!error.response) {
      error.message = "Cannot connect to server. Please try again.";
    }
    return Promise.reject(error);
  }
);

export const createShortUrl = async (payload) => {
  const { data } = await apiClient.post("/create", payload);
  return data;
};

export const getAllShortUrls = async (filters = {}) => {
  let url = "/create";
  const params = new URLSearchParams();
  if (filters?.tags?.length) params.append("tags", filters.tags.join(","));
  if (filters?.search) params.append("search", filters.search);
  if (params.toString()) url += `?${params.toString()}`;
  const { data } = await apiClient.get(url);
  return data || [];
};

export const getShortUrlDetails = async (shortId) => {
  const { data } = await apiClient.get(`/create/${shortId}`);
  return data;
};

export const updateShortUrl = async (shortId, updates) => {
  const { data } = await apiClient.put(`/create/${shortId}`, updates);
  return data;
};

export const deleteShortUrl = async (shortId) => {
  const { data } = await apiClient.delete(`/create/${shortId}`);
  return data;
};

export const bulkDeleteShortUrls = async (urlIds) => {
  const { data } = await apiClient.post("/create/bulk/delete", { urlIds });
  return data;
};

export const getShortUrlAnalytics = async (shortId) => {
  const { data } = await apiClient.get(`/create/${shortId}/analytics`);
  return data;
};

export const getUserTags = async () => {
  const { data } = await apiClient.get("/create/tags/all");
  return data || [];
};

export const getUrlsByTag = async (tag) => {
  const { data } = await apiClient.get(`/create/tags/${tag}`);
  return data || [];
};

export const exportAnalyticsCSV = async (shortId) => {
  const response = await apiClient.get(`/create/${shortId}/analytics/export`, { responseType: "blob" });
  return response.data;
};

export const generateAPIKey = async () => {
  const { data } = await apiClient.post("/create/api-key/generate");
  return data;
};

export const getUserSettings = async () => {
  const { data } = await apiClient.get("/create/settings/profile");
  return data;
};

export const updateUserSettings = async (settings) => {
  const { data } = await apiClient.put("/create/settings/update", settings);
  return data;
};
