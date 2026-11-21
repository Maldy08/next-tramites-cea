"use client";

// Trámites de NOM_TRAMITES para la Bandeja del supervisor (TRAMITES_NIVEL 2), vía /api/personal/*
// (shared/server/personal.ts): los de su personal a cargo y los que capturó para otros. Cada trámite llega con su
// empleado (nombre del backend; si faltara, el de `personal`).
import { DbAdapter } from "@/shared/adapters/db.adapter";
import type { Result } from "@/shared/domain/result";
import type { EmpleadoExpediente } from "@/shared/expedientes";
import type { Tramite } from "@/shared/tramites";

type TramiteConEmpleado = { tramite: Tramite; empleado: EmpleadoExpediente };

const conEmpleado = (lista: Tramite[], personal: EmpleadoExpediente[] = []): TramiteConEmpleado[] => {
  const porId = new Map(personal.map((p) => [p.id, p.nombre]));
  return lista.map((tramite) => ({
    tramite,
    empleado: {
      id: tramite.idEmpleado,
      nombre: tramite.nombreEmpleado || porId.get(tramite.idEmpleado) || `Empleado ${tramite.idEmpleado}`,
    },
  }));
};

export const getTramitesPersonal = async (ano: number, tipo: number, personal: EmpleadoExpediente[]) =>
  conEmpleado((await DbAdapter.get<Result<Tramite[]>>(`personal/tramites?ano=${ano}&tipo=${tipo}`)).data ?? [], personal);

export const getTramitesCapturados = async (ano: number, tipo: number) =>
  conEmpleado((await DbAdapter.get<Result<Tramite[]>>(`personal/capturados?ano=${ano}&tipo=${tipo}`)).data ?? []);
