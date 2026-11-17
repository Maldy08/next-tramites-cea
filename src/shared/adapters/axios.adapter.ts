import axios, { AxiosInstance, isAxiosError } from "axios";
import { HttpAdapter } from "./http.adapter";

interface Options {
  baseUrl: string;
  params: Record<string, unknown>;
}

let signingOut = false;

/** Usa el mensaje del Result<T> que devuelve el proxy (messages[]) cuando existe. */
const toError = (error: unknown) => {
  if (isAxiosError(error)) {
    const messages = (error.response?.data as { messages?: string[] } | undefined)?.messages;
    if (messages?.length) return new Error(messages.join(" "));
    return new Error(error.response ? `Error ${error.response.status} al comunicarse con el servidor` : "No hay conexión con el servidor");
  }
  return error instanceof Error ? error : new Error(String(error));
};

async function handleUnauthorized() {
  if (signingOut) return;
  signingOut = true;
  try {
    const { toast } = await import("@/shared/store/useToast");
    toast.warning("Tu sesión expiró. Redirigiendo al inicio de sesión…");
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/login", redirect: true });
  } catch {
    if (typeof window !== "undefined") window.location.href = "/login";
  }
}

export class AxiosAdapter implements HttpAdapter {
  private axiosInstance: AxiosInstance;

  constructor(options: Options) {
    this.axiosInstance = axios.create({
      baseURL: options.baseUrl,
      params: options.params,
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, options?: Record<string, unknown>): Promise<T> {
    try {
      const { data } = await this.axiosInstance.get<T>(url, options);
      return data;
    } catch (error) {
      throw toError(error);
    }
  }

  async post<T>(url: string, data: unknown, options?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, options);
      return response.data;
    } catch (error) {
      throw toError(error);
    }
  }

  async put<T>(url: string, data: unknown, options?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, options);
      return response.data;
    } catch (error) {
      throw toError(error);
    }
  }

  async delete<T>(url: string, data?: unknown, options?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(url, { ...options, data });
      return response.data;
    } catch (error) {
      throw toError(error);
    }
  }
}
