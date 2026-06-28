import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api") + "/auth";

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
    }
    if (!error.response) {
      error.message = "Cannot connect to server. Please try again.";
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  const { data } = await apiClient.post("/login", { email, password });
  return data;
};

export const registerUser = async (name, email, password) => {
  const { data } = await apiClient.post("/register", { name, email, password });
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
};
