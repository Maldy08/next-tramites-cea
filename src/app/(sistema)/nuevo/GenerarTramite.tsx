"use client";

import { useEffect, useState } from "react";
import { IoPeopleOutline, IoPerson, IoPersonAddOutline } from "react-icons/io5";
import { CAPTURAS } from "@/modules/capturas";
import { DbAdapter } from "@/shared/adapters/db.adapter";
import { type AlcanceCompaneros, type Companero, esSupervisor } from "@/shared/empleados";
import { Icono } from "@/shared/components/Iconos";
import { COLORES_MODULO } from "@/shared/components/coloresModulo";
import type { Result } from "@/shared/domain/result";
import type { ColorModulo, IconoModulo } from "@/shared/modulos";

export interface TipoTramite {
  id: string;
  nombre: string;
  icono: IconoModulo;
  color: ColorModulo;
}

interface Props {
  tipos: TipoTramite[];
  tipoInicial?: string;
  nombre: string;
  noEmpleado?: number;
  departamento?: string;
  tramitesNivel?: number;
}

type Modo = "personal" | "companero";

const Paso = ({ numero, titulo, nota }: { numero: number; titulo: React.ReactNode; nota?: string }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary-900">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-900 text-xs text-white">
        {numero}
      </span>
      {titulo}
    </span>
    {nota && <span className="text-right text-[11px] font-semibold text-slate-400">{nota}</span>}
  </div>
);

const Dato = ({ etiqueta, valor, mono }: { etiqueta: string; valor: React.ReactNode; mono?: boolean }) => (
  <div className="min-w-0">
    <span className="block text-[10px] font-bold uppercase text-slate-400">{etiqueta}</span>
    <span className={`block break-words font-bold text-slate-800 ${mono ? "font-mono" : ""}`}>{valor || "—"}</span>
  </div>
);

/** [nombre del supervisor, sus compañeros][] ordenado por supervisor (sin Map.groupBy: navegadores viejos). */
const agruparPorSupervisor = (companeros: Companero[]) => {
  const grupos = new Map<string, Companero[]>();
  for (const c of companeros) grupos.set(c.supervisor.nombre, [...(grupos.get(c.supervisor.nombre) ?? []), c]);
  return [...grupos].sort(([a], [b]) => a.localeCompare(b, "es"));
};

const OpcionCompanero = ({ c }: { c: Companero }) => (
  <option value={c.empleado}>
    {c.nombreCompleto} ({c.empleado} · {c.descripcionPuesto})
  </option>
);

/**
 * Pasos de Generar Nuevo Trámite (mockup): 1) para quién, 2) tipo de trámite, 3) captura del tipo elegido.
 * Paso 1: todos pueden hacer "Mi Trámite Personal"; el supervisor (TRAMITES_NIVEL >= 2) además
 * "En Representación de un Compañero": sus compañeros a cargo o, como suplencia, los de su departamento
 * (/api/companeros, ver shared/empleados.ts).
 */
export const GenerarTramite = ({ tipos, tipoInicial, nombre, noEmpleado, departamento, tramitesNivel }: Props) => {
  const supervisor = esSupervisor(tramitesNivel);
  const [modo, setModo] = useState<Modo>("personal");
  const [alcance, setAlcance] = useState<AlcanceCompaneros>("mios");
  // Lista por alcance; se pide la primera vez que se muestra.
  const [listas, setListas] = useState<Partial<Record<AlcanceCompaneros, { companeros: Companero[]; error: string }>>>({});
  const [companeroId, setCompaneroId] = useState<number | null>(null);
  const [tipoId, setTipoId] = useState(tipos.find((t) => t.id === tipoInicial)?.id ?? tipos[0]?.id);

  const cargada = !!listas[alcance];
  useEffect(() => {
    if (!supervisor || modo !== "companero" || cargada) return;
    const guardar = (companeros: Companero[], error = "") => setListas((l) => ({ ...l, [alcance]: { companeros, error } }));
    DbAdapter.get<Result<Companero[]>>(`companeros?alcance=${alcance}`)
      .then((r) => guardar(r.data ?? []))
      .catch((e: Error) => guardar([], e.message));
  }, [supervisor, modo, alcance, cargada]);

  const lista = listas[alcance];
  const companeros = lista?.companeros ?? null;
  const errorCompaneros = lista?.error ?? "";
  const companero = companeros?.find((c) => c.empleado === companeroId);
  // En la suplencia se agrupa por supervisor para saber de quién es cada compañero.
  const grupos = alcance === "departamento" && companeros ? agruparPorSupervisor(companeros) : null;
  const beneficiario = modo === "personal" ? noEmpleado : companero?.empleado;
  const tipo = tipos.find((t) => t.id === tipoId);
  const Captura = tipo ? CAPTURAS[tipo.id] : undefined;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Paso 1: beneficiario */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8">
        <Paso numero={1} titulo="¿Para quién es este trámite?" nota="Selección Requerida *" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label
            className={`relative flex cursor-pointer items-start rounded-2xl border-2 p-4 transition-all hover:shadow-md sm:p-5 ${
              modo === "personal" ? "border-primary-900 bg-primary-50/40" : "border-slate-200 hover:border-primary-900"
            }`}
          >
            <input
              type="radio"
              name="beneficiario"
              value="personal"
              checked={modo === "personal"}
              onChange={() => setModo("personal")}
              className="mt-1 h-5 w-5 accent-primary-900"
            />
            <span className="ml-3.5 min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                  <IoPerson className="text-primary-900" /> Mi Trámite Personal
                </span>
                <span className="rounded border border-primary-200 bg-white px-2 py-0.5 text-[10px] font-bold text-primary-900">
                  Titular
                </span>
              </span>
              <span className="mt-1 block text-xs text-slate-600">
                Se registrará a tu nombre (<span className="font-bold text-slate-800">{nombre}</span>).
              </span>
              <span className="mt-1 block break-words font-mono text-[11px] text-slate-400">
                No. Empleado: {noEmpleado ?? "—"}
                {departamento ? ` · ${departamento}` : ""}
              </span>
            </span>
          </label>

          {supervisor && (
            <label
              className={`relative flex cursor-pointer items-start rounded-2xl border-2 p-4 transition-all hover:shadow-md sm:p-5 ${
                modo === "companero" ? "border-amber-500 bg-amber-50/60" : "border-slate-200 hover:border-amber-500"
              }`}
            >
              <input
                type="radio"
                name="beneficiario"
                value="companero"
                checked={modo === "companero"}
                onChange={() => setModo("companero")}
                className="mt-1 h-5 w-5 accent-amber-600"
              />
              <span className="ml-3.5 min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                    <IoPersonAddOutline className="text-amber-600" /> En Representación de un Compañero
                  </span>
                  <span className="shrink-0 rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                    A tu cargo
                  </span>
                </span>
                <span className="mt-1 block text-xs text-slate-600">
                  Para compañeros a tu cargo que no cuentan con equipo de cómputo. El trámite quedará a nombre del compañero.
                </span>
              </span>
            </label>
          )}
        </div>

        {/* Selector de compañero */}
        {supervisor && modo === "companero" && (
          <div className="mt-5 space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="companero" className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                <IoPeopleOutline className="text-amber-600" /> Selecciona al compañero:
              </label>
              <div className="flex gap-1 self-start rounded-xl bg-amber-100 p-1 text-xs" role="group" aria-label="Qué compañeros mostrar">
                {(
                  [
                    ["mios", "Mis compañeros a cargo"],
                    ["departamento", "Cubrir a otro supervisor"],
                  ] as const
                ).map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={alcance === valor}
                    onClick={() => {
                      setAlcance(valor);
                      setCompaneroId(null);
                    }}
                    className={`rounded-lg px-2.5 py-1 ${
                      alcance === valor ? "bg-white font-bold text-amber-950 shadow-sm" : "font-medium text-amber-800 hover:text-amber-950"
                    }`}
                  >
                    {texto}
                  </button>
                ))}
              </div>
            </div>
            {alcance === "departamento" && (
              <p className="text-[11px] text-amber-800">
                Para cuando otro supervisor no está disponible (vacaciones, incapacidad…): empleados de tu departamento que
                tienen supervisor asignado, agrupados por su supervisor.
              </p>
            )}
            {companeros === null ? (
              <p className="text-xs text-amber-800">Cargando compañeros…</p>
            ) : errorCompaneros ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{errorCompaneros}</p>
            ) : companeros.length === 0 ? (
              <p className="text-xs text-amber-900">
                {alcance === "mios"
                  ? "No tienes compañeros asignados. Se asignan en Recursos Humanos (supervisor del empleado)."
                  : "No hay empleados con supervisor asignado en tu departamento."}
              </p>
            ) : (
              <>
                <select
                  id="companero"
                  value={companeroId ?? ""}
                  onChange={(e) => setCompaneroId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border border-amber-300 bg-white p-3 text-sm font-semibold text-slate-800 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Elige un compañero --</option>
                  {grupos
                    ? grupos.map(([supervisorNombre, delGrupo]) => (
                        <optgroup key={supervisorNombre} label={`Supervisor: ${supervisorNombre}`}>
                          {delGrupo.map((c) => (
                            <OpcionCompanero key={c.empleado} c={c} />
                          ))}
                        </optgroup>
                      ))
                    : companeros.map((c) => <OpcionCompanero key={c.empleado} c={c} />)}
                </select>
                {companero && (
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-white p-4 text-xs shadow-sm sm:grid-cols-4">
                    <Dato etiqueta="Puesto" valor={companero.descripcionPuesto} />
                    <Dato etiqueta="No. Empleado" valor={companero.empleado} mono />
                    <Dato etiqueta="Departamento" valor={companero.descripcionDepto} />
                    <Dato etiqueta="Supervisor" valor={companero.supervisor.nombre} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Paso 2: tipo de trámite */}
      <section className="border-b border-slate-200 p-6 sm:p-8">
        <Paso numero={2} titulo="Tipo de Trámite" nota="Selecciona uno" />
        {tipos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
            Tu usuario no tiene trámites asignados.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tipos.map((t) => {
              const activo = t.id === tipoId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipoId(t.id)}
                  aria-pressed={activo}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                    activo ? "border-primary-900 bg-primary-50/40 shadow-sm" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${COLORES_MODULO[t.color].catalogo.icono}`}
                  >
                    <Icono nombre={t.icono} />
                  </span>
                  <span className="text-xs font-bold text-slate-900">{t.nombre}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Paso 3: captura del tipo elegido, para el beneficiario del paso 1 */}
      {tipo && Captura && (
        <section className="p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-3">
            <Paso
              numero={3}
              titulo={
                <>
                  Datos del Trámite (<span className="text-slate-800">{tipo.nombre}</span>)
                </>
              }
              nota="El formato oficial se creará al guardar"
            />
          </div>
          <div className="pt-4">
            {beneficiario ? (
              <Captura key={`${tipo.id}-${beneficiario}`} empleado={beneficiario} />
            ) : (
              <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-6 py-8 text-center text-sm text-amber-900">
                Elige en el paso 1 al compañero para quien es el trámite.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
