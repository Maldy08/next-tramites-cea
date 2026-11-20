// Utilidades del proxy hacia el backend CEA, comunes a todos los módulos.
// Solo se usa desde route handlers (servidor).
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { Result } from "@/shared/domain/result";
import { nivelEnModulo } from "@/shared/modulos";

const API = process.env.URL_API_CEA;

export type SessionUser = NonNullable<Session["user"]>;

export class CeaError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

export const fail = (message: string) => ({ succeeded: false, messages: [message], data: null, exception: null, code: 0 });
export const ok = <T>(data: T, message?: string) => ({
  succeeded: true,
  messages: message ? [message] : [],
  data,
  exception: null,
  code: 0,
});

export const unauthorized = () => NextResponse.json(fail("Sesión no válida"), { status: 401 });
export const forbidden = (msg = "No tiene permiso para esta operación") => NextResponse.json(fail(msg), { status: 403 });

export const getUser = async (): Promise<SessionUser | null> => {
  const session = await auth();
  return session?.user?.token ? session.user : null;
};

/**
 * Usuario con sesión y con acceso al módulo. Uso en un handler:
 *   const { user, error } = await usuarioDeModulo("viaticos"); if (error) return error;
 */
export const usuarioDeModulo = async (
  moduloId: string
): Promise<{ user: SessionUser; nivel: number; error?: never } | { user?: never; nivel?: never; error: NextResponse }> => {
  const user = await getUser();
  if (!user) return { error: unauthorized() };
  const nivel = nivelEnModulo(user.permisos, moduloId);
  if (nivel === null) return { error: forbidden("No tiene acceso a este módulo") };
  return { user, nivel };
};

export const errorResponse = (error: unknown) => {
  const status = error instanceof CeaError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Error inesperado";
  console.error("[api]", message);
  return NextResponse.json(fail(message), { status });
};

/** Todos los textos (a cualquier profundidad) en mayúsculas; números, booleanos y null quedan igual. */
const enMayusculas = (valor: unknown): unknown =>
  typeof valor === "string"
    ? valor.toLocaleUpperCase("es-MX")
    : Array.isArray(valor)
      ? valor.map(enMayusculas)
      : valor && typeof valor === "object"
        ? Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, enMayusculas(v)]))
        : valor;

/**
 * Regla del sistema: todo lo capturado se guarda en MAYÚSCULAS. Aquí pasan todas las escrituras (POST/PUT/PATCH con
 * cuerpo JSON) hacia el backend CEA, así ningún módulo tiene que acordarse. Las fechas ISO no cambian ("T" ya es
 * mayúscula). El login no pasa por aquí (auth.ts), así que la contraseña no se toca.
 */
const cuerpoEnMayusculas = (init?: RequestInit): RequestInit | undefined => {
  const metodo = (init?.method ?? "GET").toUpperCase();
  if (typeof init?.body !== "string" || !["POST", "PUT", "PATCH"].includes(metodo)) return init;
  try {
    return { ...init, body: JSON.stringify(enMayusculas(JSON.parse(init.body))) };
  } catch {
    return init;
  }
};

export const ceaFetch = (user: SessionUser, path: string, init?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...cuerpoEnMayusculas(init),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${user.token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

/** Llama al backend y devuelve el JSON; lanza CeaError si la respuesta HTTP no es 2xx. */
export const ceaJson = async <T>(user: SessionUser, path: string, init?: RequestInit): Promise<T> => {
  const res = await ceaFetch(user, path, init);
  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new CeaError(`Backend CEA respondió ${res.status} en ${path}${detalle ? `: ${detalle.slice(0, 300)}` : ""}`);
  }
  return res.json() as Promise<T>;
};

/** Desenvuelve un Result<T> del backend; lanza si `succeeded` es false. */
export const ceaData = async <T>(user: SessionUser, path: string, init?: RequestInit): Promise<T> => {
  const result = await ceaJson<Result<T>>(user, path, init);
  if (!result?.succeeded) {
    throw new CeaError(result?.messages?.join(" ") || `Operación rechazada por el backend (${path})`, 422);
  }
  return result.data;
};

export const toInt = (valor: string) => {
  const n = Number.parseInt(valor, 10);
  return Number.isFinite(n) ? n : NaN;
};
