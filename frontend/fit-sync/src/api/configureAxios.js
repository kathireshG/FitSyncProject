import axios from "axios";

axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

axios.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      Object.prototype.hasOwnProperty.call(response.data, "data")
    ) {
      response.pagination = response.data.pagination;
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("isLoggedIn");
      window.localStorage.removeItem("userID");
      window.localStorage.removeItem("name");
    }
    return Promise.reject(error);
  }
);
