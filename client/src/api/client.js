import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

let accessToken = null;
let onAuthChange = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// AuthContext registers itself here so the interceptor can push refreshed/expired
// tokens back into React state without api/client.js importing React at all.
export function setOnAuthChange(fn) {
  onAuthChange = fn;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.startsWith('/api/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/api/auth/refresh')
            .then(({ data }) => {
              setAccessToken(data.accessToken);
              onAuthChange?.(data);
              return data.accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        onAuthChange?.(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
