"use client";

import { useEffect, useMemo, useState } from "react";
import { IoArrowUndoOutline, IoCheckmarkCircleOutline, IoPrintOutline, IoRefreshOutline, IoSearchOutline } from "react-icons/io5";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { toast } from "@/shared/store/useToast";
import { ESTATUS_TRAMITE, INCIDENCIAS, TIPO_TRAMITE } from "@/shared/tramites";
import { accionFirma, getPorFirmar } from "@/modules/firmas/data-access";
import type { TramitePorFirmar } from "@/modules/firmas/dtos";

const botonCls =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50";

const ddmmaaaa = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const hhmi = (iso: string | null) => (iso && iso.slice(11, 16) !== "00:00" ? ` ${iso.slice(11, 16)}` : "");

const NOMBRE_TIPO: Record<number, string> = {
  [TIPO_TRAMITE.vacaciones]: "Vacaciones",
  [TIPO_TRAMITE.permisos]: "Permiso",
  [TIPO_TRAMITE.justificantes]: "Justificante",
};

/** "Permiso con goce · 12/11/2026 al 14/11/2026". */
const detalleDe = (t: TramitePorFirmar) => {
  const incidencia = INCIDENCIAS.find((i) => i.id === t.tipoIncidencia)?.nombre;
  const ini = `${ddmmaaaa(t.fechaInicio)}${hhmi(t.fechaInicio)}`;
  const fin = `${ddmmaaaa(t.fechaFin)}${hhmi(t.fechaFin)}`;
  const fechas = !t.fechaInicio
    ? ""
    : ini === fin
      ? ini
      : ddmmaaaa(t.fechaInicio) === ddmmaaaa(t.fechaFin)
        ? `${ini} a${hhmi(t.fechaFin)}`
        : `${ini} al ${fin}`;
  return [incidencia, fechas].filter(Boolean).join(" · ");
};

/** Jefe y director son la misma persona: una sola firma (2 → 4). */
const firmaAmbos = (t: TramitePorFirmar) => t.estatus === ESTATUS_TRAMITE.revisionJefe && t.valida1 === t.valida2;

/** En qué paso firma el usuario: estatus 2 = jefe (VALIDA_1), 3 = director (VALIDA_2). */
const comoFirma = (t: TramitePorFirmar) =>
  firmaAmbos(t) ? "Jefe y Director" : t.estatus === ESTATUS_TRAMITE.revisionJefe ? "Jefe inmediato" : "Director";

type Accion = { tramite: TramitePorFirmar; tipo: "firmar" | "regresar" };

/**
 * Trámites por Firmar (jefes y directores, TRAMITES_NIVEL 3): los que esperan su firma, de cualquier año.
 * El jefe (VALIDA_1) firma primero (2 → 3), luego el director (VALIDA_2, 3 → 4) y al final RH autoriza (4 → 100).
 * En su turno cualquiera de los dos puede regresarlo al empleado (98) con motivo.
 */
export const BandejaFirmas = () => {
  const [lista, setLista] = useState<TramitePorFirmar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [busqueda, setBusqueda] = useState("");

  const [accion, setAccion] = useState<Accion | null>(null);
  const [comentarios, setComentarios] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vigente = true;
    getPorFirmar()
      .then((l) => {
        if (!vigente) return;
        setLista(l ?? []);
        setError(null);
      })
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [version]);

  const recargar = () => setVersion((v) => v + 1);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (lista ?? []).filter(
      (t) => !q || [t.folio, t.nombreEmpleado, t.idEmpleado, t.descripcionDepto].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [lista, busqueda]);

  const abrir = (tramite: TramitePorFirmar, tipo: Accion["tipo"]) => {
    setComentarios("");
    setAccion({ tramite, tipo });
  };

  const ejecutar = async () => {
    if (!accion) return;
    setOcupado(true);
    try {
      await accionFirma(accion.tramite.idTramite, { accion: accion.tipo, comentarios: comentarios.trim() || null });
      toast.success(`${accion.tramite.folio} ${accion.tipo === "firmar" ? "firmado" : "regresado al empleado"}`);
      setAccion(null);
      recargar();
    } catch (e) {
      toast.error((e as Error).message, 8000);
      recargar();
    } finally {
      setOcupado(false);
    }
  };

  const firmar = accion?.tipo === "firmar";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Mesa de Firmas</span>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Trámites por Firmar</h1>
          <p className="text-xs text-slate-500">
            Trámites que esperan su firma como jefe inmediato o director. Al firmar pasan al siguiente paso; si algo no
            procede, regréselos al empleado con el motivo.
          </p>
        </div>
        <button
          type="button"
          onClick={recargar}
          className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
        >
          <IoRefreshOutline className="h-4 w-4" /> Actualizar
        </button>
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="relative">
          <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Folio, Empleado, No. de Empleado o Departamento..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-900"
          />
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        {!lista && !error ? (
          <TableSkeleton rows={4} cols={6} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Folio Oficial</th>
                  <th className="px-4 py-3.5">Fecha Trámite</th>
                  <th className="px-4 py-3.5">Trámite &amp; Detalle</th>
                  <th className="px-4 py-3.5">Empleado</th>
                  <th className="px-4 py-3.5">Firma como</th>
                  <th className="px-4 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {busqueda.trim() ? "Sin trámites con la búsqueda aplicada." : "No tiene trámites pendientes de firma."}
                    </td>
                  </tr>
                ) : (
                  filtradas.map((t) => (
                    <tr key={t.idTramite} className="align-top transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono font-black text-slate-900">{t.folio}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-500">{ddmmaaaa(t.fechaSolicitud)}</td>
                      <td className="min-w-56 px-4 py-3.5">
                        <span className="block font-bold text-slate-900">{NOMBRE_TIPO[t.tipoTramite] ?? `Tipo ${t.tipoTramite}`}</span>
                        <span className="block text-[11px] font-semibold text-primary-900">{detalleDe(t)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block font-bold text-slate-900">{t.nombreEmpleado ?? `Empleado ${t.idEmpleado}`}</span>
                        <span className="block font-mono text-[10px] text-slate-400">No. {t.idEmpleado}</span>
                        {t.descripcionDepto && <span className="block text-[10px] text-slate-500">{t.descripcionDepto}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold ${
                            t.estatus === ESTATUS_TRAMITE.revisionJefe ? "bg-sky-100 text-sky-800" : "bg-violet-100 text-violet-900"
                          }`}
                        >
                          {comoFirma(t)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-center gap-2">
                          <a
                            href={`/formato/${t.idTramite}`}
                            target="_blank"
                            rel="noopener"
                            title="Ver el formato oficial"
                            className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                          >
                            <IoPrintOutline className="h-4 w-4" /> Formato
                          </a>
                          <button
                            type="button"
                            onClick={() => abrir(t, "firmar")}
                            className={`${botonCls} border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800`}
                          >
                            <IoCheckmarkCircleOutline className="h-4 w-4" /> Firmar
                          </button>
                          <button
                            type="button"
                            onClick={() => abrir(t, "regresar")}
                            className={`${botonCls} border-amber-400 bg-white text-amber-800 hover:bg-amber-50`}
                          >
                            <IoArrowUndoOutline className="h-4 w-4" /> Regresar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {lista && (
          <p className="pt-2 text-xs text-slate-500">
            {lista.length === 0 ? "Sin pendientes" : `${filtradas.length} de ${lista.length} trámites pendientes de firma`}
          </p>
        )}
      </div>

      {accion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !ocupado && setAccion(null)}>
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {firmar ? "Firmar" : "Regresar"} {accion.tramite.folio}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {accion.tramite.nombreEmpleado ?? `Empleado ${accion.tramite.idEmpleado}`} ·{" "}
                {NOMBRE_TIPO[accion.tramite.tipoTramite] ?? ""} {detalleDe(accion.tramite)}.{" "}
                {firmar
                  ? firmaAmbos(accion.tramite)
                    ? "Firma como jefe inmediato y director; pasa a Recursos Humanos para su autorización."
                    : accion.tramite.estatus === ESTATUS_TRAMITE.revisionJefe
                      ? "Firma como jefe inmediato; pasa a firma del director."
                      : "Firma como director; pasa a Recursos Humanos para su autorización."
                  : "El empleado lo corrige y lo vuelve a enviar; empieza otra vez con la firma del jefe."}
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                {firmar ? "Comentarios" : "Motivo *"}
              </span>
              <textarea
                autoFocus
                rows={3}
                maxLength={1000}
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
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
                Cerrar
              </button>
              <button
                type="button"
                disabled={ocupado || (!firmar && !comentarios.trim())}
                onClick={ejecutar}
                className={`${botonCls} ${
                  firmar ? "border-emerald-700 bg-emerald-700 hover:bg-emerald-800" : "border-amber-600 bg-amber-600 hover:bg-amber-700"
                } text-white`}
              >
                {firmar ? <IoCheckmarkCircleOutline className="h-4 w-4" /> : <IoArrowUndoOutline className="h-4 w-4" />}
                {ocupado ? "Aplicando…" : firmar ? "Firmar trámite" : "Regresar al empleado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
