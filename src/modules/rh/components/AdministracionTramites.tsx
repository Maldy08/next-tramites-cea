"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IoBanOutline,
  IoCheckmarkDoneOutline,
  IoChevronBack,
  IoChevronForward,
  IoCreateOutline,
  IoPrintOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { TableSkeleton } from "@/shared/components/Skeletons";
import type { TonoEstatus } from "@/shared/expedientes";
import { useEjercicioStore } from "@/shared/store/useEjercicioStore";
import { toast } from "@/shared/store/useToast";
import { ESTATUS_TRAMITE, INCIDENCIAS, estatusTramite } from "@/shared/tramites";
import { accionTramite, getTramites } from "@/modules/rh/data-access";
import { TIPOS_RH, type TramiteRh } from "@/modules/rh/dtos";
import { ModificarTramite } from "./ModificarTramite";

const POR_PAGINA = 15;

/** RH autoriza en cuanto el empleado lo envió a firma (2, 3 o 4), falten o no firmas. No en Creado ni Regresado. */
const AUTORIZABLES: number[] = [ESTATUS_TRAMITE.revisionJefe, ESTATUS_TRAMITE.revisionDirector, ESTATUS_TRAMITE.revisionRh];

const TONOS: Record<TonoEstatus, string> = {
  info: "bg-sky-100 text-sky-800",
  alerta: "bg-amber-100 text-amber-900",
  violeta: "bg-violet-100 text-violet-900",
  exito: "bg-emerald-100 text-emerald-800",
  peligro: "bg-rose-100 text-rose-900",
  neutro: "bg-slate-100 text-slate-700",
};

const botonCls =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50";

const ddmmaaaa = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const hhmi = (iso: string | null) => (iso && iso.slice(11, 16) !== "00:00" ? ` ${iso.slice(11, 16)}` : "");

const nombreTipo = (tipo: number) => TIPOS_RH.find((t) => t.id === tipo)?.nombre ?? `Tipo ${tipo}`;

/** "Permiso con goce · 12/11/2026 al 14/11/2026". */
const detalleDe = (t: TramiteRh) => {
  const incidencia = INCIDENCIAS.find((i) => i.id === t.tipoIncidencia)?.nombre;
  const ini = `${ddmmaaaa(t.fechaInicio)}${hhmi(t.fechaInicio)}`;
  const fin = `${ddmmaaaa(t.fechaFin)}${hhmi(t.fechaFin)}`;
  const fechas = !t.fechaInicio ? "" : ini === fin ? ini : ddmmaaaa(t.fechaInicio) === ddmmaaaa(t.fechaFin) ? `${ini} a${hhmi(t.fechaFin)}` : `${ini} al ${fin}`;
  return [incidencia, fechas].filter(Boolean).join(" · ");
};

type Accion = { tramite: TramiteRh; tipo: "completar" | "cancelar" | "modificar" };

/**
 * Expedientes Institucionales CEA (perfil "Mesa Control RH" del mockup): todos los trámites de vacaciones, permisos y
 * justificantes del ejercicio, en cualquier estatus, con Modificar, Autorizar (2/3/4 → 100) y Cancelar (→ 99).
 */
export const AdministracionTramites = () => {
  const { ejercicio, hidratado } = useEjercicioStore();
  const [resultado, setResultado] = useState<{ ano: number; lista: TramiteRh[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [tipo, setTipo] = useState(0);
  const [estatus, setEstatus] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const [accion, setAccion] = useState<Accion | null>(null);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!hidratado) return;
    let vigente = true;
    getTramites(ejercicio)
      .then((lista) => {
        if (!vigente) return;
        setResultado({ ano: ejercicio, lista: lista ?? [] });
        setError(null);
      })
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [hidratado, ejercicio, version]);

  const lista = resultado?.ano === ejercicio ? resultado.lista : null;
  const recargar = () => setVersion((v) => v + 1);

  const opcionesEstatus = useMemo(() => [...new Set((lista ?? []).map((t) => t.estatus))].sort((a, b) => a - b), [lista]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (lista ?? []).filter(
      (t) =>
        (!tipo || t.tipoTramite === tipo) &&
        (!estatus || t.estatus === estatus) &&
        (!q || [t.folio, t.nombreEmpleado, t.idEmpleado, t.descripcionDepto].some((v) => String(v ?? "").toLowerCase().includes(q)))
    );
  }, [lista, tipo, estatus, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtradas.slice(inicio, inicio + POR_PAGINA);

  const abrir = (tramite: TramiteRh, tipoAccion: Accion["tipo"]) => {
    setMotivo("");
    setAccion({ tramite, tipo: tipoAccion });
  };

  const ejecutar = async () => {
    if (!accion || accion.tipo === "modificar") return;
    setOcupado(true);
    try {
      await accionTramite(accion.tramite.idTramite, { accion: accion.tipo, comentarios: motivo.trim() || null });
      toast.success(`${accion.tramite.folio} ${accion.tipo === "completar" ? "autorizado" : "cancelado"}`);
      setAccion(null);
      recargar();
    } catch (e) {
      toast.error((e as Error).message, 8000);
    } finally {
      setOcupado(false);
    }
  };

  const filtro = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(Number(e.target.value));
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-0.5 text-xs font-bold uppercase text-primary-900">
            Ejercicio: <span className="font-mono">{ejercicio}</span>
          </span>
          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Mesa Control RH</span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Expedientes Institucionales CEA</h1>
        <p className="text-xs text-slate-500">
          Trámites de vacaciones, permisos y justificantes de todos los empleados, en cualquier estatus.
        </p>
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-6">
            <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por Folio, Empleado, No. de Empleado o Departamento..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <select
            value={tipo}
            onChange={filtro(setTipo)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 sm:col-span-3"
          >
            <option value={0}>Todos los tipos</option>
            {TIPOS_RH.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <select
            value={estatus}
            onChange={filtro(setEstatus)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 sm:col-span-3"
          >
            <option value={0}>Todos los estatus</option>
            {opcionesEstatus.map((e) => (
              <option key={e} value={e}>
                {estatusTramite(e).etiqueta}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        {!lista && !error ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Folio Oficial</th>
                  <th className="px-4 py-3.5">Fecha Trámite</th>
                  <th className="px-4 py-3.5">Trámite &amp; Detalle</th>
                  <th className="px-4 py-3.5">Empleado</th>
                  <th className="px-4 py-3.5">Estatus</th>
                  <th className="px-4 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Sin trámites con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  visibles.map((t) => {
                    const est = estatusTramite(t.estatus);
                    const cancelado = t.estatus === ESTATUS_TRAMITE.cancelado;
                    return (
                      <tr key={t.idTramite} className="align-top transition-colors hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono font-black text-slate-900">{t.folio}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-500">{ddmmaaaa(t.fechaSolicitud)}</td>
                        <td className="min-w-56 px-4 py-3.5">
                          <span className="block font-bold text-slate-900">{nombreTipo(t.tipoTramite)}</span>
                          <span className="block text-[11px] font-semibold text-primary-900">{detalleDe(t)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="block font-bold text-slate-900">{t.nombreEmpleado ?? `Empleado ${t.idEmpleado}`}</span>
                          <span className="block font-mono text-[10px] text-slate-400">No. {t.idEmpleado}</span>
                          {t.descripcionDepto && <span className="block text-[10px] text-slate-500">{t.descripcionDepto}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold ${TONOS[est.tono]}`}>
                            {est.etiqueta}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-center gap-2">
                            <a
                              href={`/formato/${t.idTramite}`}
                              target="_blank"
                              rel="noopener"
                              title="Ver e imprimir el formato oficial"
                              className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                            >
                              <IoPrintOutline className="h-4 w-4" /> Formato
                            </a>
                            {!cancelado && (
                              <button
                                type="button"
                                onClick={() => abrir(t, "modificar")}
                                className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                              >
                                <IoCreateOutline className="h-4 w-4" /> Modificar
                              </button>
                            )}
                            {AUTORIZABLES.includes(t.estatus) && (
                              <button
                                type="button"
                                onClick={() => abrir(t, "completar")}
                                title="Autorizar (aunque falten firmas del jefe o del director)"
                                className={`${botonCls} border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800`}
                              >
                                <IoCheckmarkDoneOutline className="h-4 w-4" /> Autorizar
                              </button>
                            )}
                            {!cancelado && (
                              <button
                                type="button"
                                onClick={() => abrir(t, "cancelar")}
                                className={`${botonCls} border-red-300 bg-white text-red-700 hover:bg-red-50`}
                              >
                                <IoBanOutline className="h-4 w-4" /> Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {lista && (
          <div className="flex flex-col justify-between gap-3 pt-2 text-xs text-slate-500 sm:flex-row sm:items-center">
            <span>
              {filtradas.length === 0
                ? `Sin trámites (${ejercicio})`
                : `Mostrando ${inicio + 1} a ${inicio + visibles.length} de ${filtradas.length} trámites (${ejercicio})`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="rounded-lg border px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
              >
                <IoChevronBack />
              </button>
              <span className="font-bold text-slate-700">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="rounded-lg border px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
              >
                <IoChevronForward />
              </button>
            </div>
          </div>
        )}
      </div>

      {accion?.tipo === "modificar" && (
        <ModificarTramite
          idTramite={accion.tramite.idTramite}
          alCerrar={() => setAccion(null)}
          alGuardar={() => {
            setAccion(null);
            recargar();
          }}
        />
      )}

      {accion && accion.tipo !== "modificar" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !ocupado && setAccion(null)}>
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {accion.tipo === "completar" ? "Autorizar" : "Cancelar"} {accion.tramite.folio}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {accion.tramite.nombreEmpleado ?? `Empleado ${accion.tramite.idEmpleado}`} ·{" "}
                {estatusTramite(accion.tramite.estatus).etiqueta}.{" "}
                {accion.tipo === "completar"
                  ? accion.tramite.estatus === ESTATUS_TRAMITE.revisionRh
                    ? "Ya lo firmaron el jefe y el director; queda como Autorizado."
                    : "Queda como Autorizado sin esperar las firmas pendientes."
                  : accion.tramite.tipoTramite === 1
                    ? "Los días regresan al saldo del empleado. No se puede deshacer."
                    : "No se puede deshacer."}
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                {accion.tipo === "completar" ? "Comentarios" : "Motivo *"}
              </span>
              <textarea
                autoFocus
                rows={3}
                maxLength={1000}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#691c32] focus:ring-2 focus:ring-[#691c32]/20"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setAccion(null)}
                className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
              >
                Regresar
              </button>
              <button
                type="button"
                disabled={ocupado || (accion.tipo === "cancelar" && !motivo.trim())}
                onClick={ejecutar}
                className={`${botonCls} ${
                  accion.tipo === "completar"
                    ? "border-emerald-700 bg-emerald-700 hover:bg-emerald-800"
                    : "border-red-700 bg-red-700 hover:bg-red-800"
                } text-white`}
              >
                {accion.tipo === "completar" ? <IoCheckmarkDoneOutline className="h-4 w-4" /> : <IoBanOutline className="h-4 w-4" />}
                {ocupado ? "Aplicando…" : accion.tipo === "completar" ? "Autorizar trámite" : "Cancelar trámite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
