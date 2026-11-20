"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoPrintOutline,
  IoSaveOutline,
} from "react-icons/io5";
import type { CapturaTramite } from "@/shared/modulos";
import { hoySysdate } from "@/shared/fechas";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ESTATUS_TRAMITE } from "@/shared/tramites";
import { AccionesSolicitud } from "@/modules/permisos/components/AccionesSolicitud";
import { INCIDENCIAS_PERMISO, type EmpleadoPermiso, type PermisoCreado, type Relevo } from "@/modules/permisos/dtos";
import { getEmpleado, getFestivos, getRelevos, guardarPermiso } from "@/modules/permisos/data-access";
import { contarDiasHabiles, fechaCorta, type ConteoDias } from "@/modules/permisos/lib/dias";

const MAX_MOTIVO = 500;

/** Conteo de días hábiles del rango `rango` ("inicio|fin"); se descarta si el rango cambió. */
interface Conteo {
  rango: string;
  datos?: ConteoDias;
  error?: string;
}

/**
 * Paso 3 de Generar Nuevo Trámite (/nuevo) cuando el tipo es Permisos (mockup "Permisos Laborales"): tipo de permiso
 * (con o sin goce, TIPO_INCIDENCIA 1-2), fecha o rango de días, justificación y relevo opcional. Los días hábiles se
 * muestran con los festivos del empleado; el backend los recalcula y genera el trámite tipo 3 (folio PER-NNNN-AAAA).
 */
export const CapturaPermisos: CapturaTramite = ({ empleado: noEmp }) => {
  const [empleado, setEmpleado] = useState<EmpleadoPermiso | null>(null);
  const [relevos, setRelevos] = useState<Relevo[] | null>(null);
  const [error, setError] = useState("");

  const [tipo, setTipo] = useState<number>(INCIDENCIAS_PERMISO[0].id);
  const [rangoDias, setRangoDias] = useState(false);
  const [inicio, setInicio] = useState(hoySysdate());
  const [finCaptura, setFinCaptura] = useState(hoySysdate());
  const [motivo, setMotivo] = useState("");
  const [relevo, setRelevo] = useState(0);
  const [soloDepto, setSoloDepto] = useState(true);
  const [conteo, setConteo] = useState<Conteo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [creado, setCreado] = useState<PermisoCreado | null>(null);
  const [estatusCreado, setEstatusCreado] = useState<number>(ESTATUS_TRAMITE.creado);

  useEffect(() => {
    let vigente = true;
    getEmpleado(noEmp)
      .then((e) => vigente && setEmpleado(e))
      .catch((e: Error) => vigente && setError(e.message));
    getRelevos(noEmp)
      .then((r) => vigente && setRelevos(r))
      .catch(() => vigente && setRelevos([]));
    return () => {
      vigente = false;
    };
  }, [noEmp]);

  // Un solo día: fin = inicio.
  const fin = rangoDias ? finCaptura : inicio;
  const rango = inicio && fin && fin >= inicio ? `${inicio}|${fin}` : "";
  useEffect(() => {
    if (!rango) return;
    let vigente = true;
    const [desde, hasta] = rango.split("|");
    getFestivos(noEmp, desde, hasta)
      .then((f) => vigente && setConteo({ rango, datos: contarDiasHabiles(desde, hasta, f) }))
      .catch((e: Error) => vigente && setConteo({ rango, error: e.message }));
    return () => {
      vigente = false;
    };
  }, [noEmp, rango]);

  const actual = conteo && conteo.rango === rango ? conteo : null;
  const contando = !!rango && !actual;
  const dias = actual?.datos?.habiles;

  const opcionesRelevo = useMemo(
    () => (relevos ?? []).filter((r) => !soloDepto || !empleado || r.deptoComi === empleado.deptoComi),
    [relevos, soloDepto, empleado]
  );

  const faltante = !inicio
    ? "Selecciona la fecha del permiso."
    : rangoDias && (!finCaptura || finCaptura < inicio)
      ? "La fecha de fin no puede ser anterior a la de inicio."
      : dias === 0
        ? "El rango no contiene días hábiles (solo fines de semana o días festivos)."
        : !motivo.trim()
          ? "Escribe la justificación del permiso."
          : "";

  const guardar = async () => {
    if (faltante || contando || guardando) return;
    setErrorGuardar("");
    setGuardando(true);
    try {
      setCreado(
        await guardarPermiso({
          noEmp,
          tipoIncidencia: tipo,
          fechaInicio: inicio,
          fechaFin: fin,
          justificacionMotivo: motivo.trim(),
          idEmpleadoCubre: relevo || null,
        })
      );
    } catch (e) {
      setErrorGuardar((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  if (error) return <Aviso tipo="error">{error}</Aviso>;
  if (creado)
    return (
      <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
        <IoCheckmarkCircleOutline className="mx-auto h-12 w-12 text-blue-700" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-900">Permiso generado</p>
          <p className="mt-1 text-3xl font-black text-blue-800">{creado.folio}</p>
          <p className="mt-2 text-sm text-blue-900">
            {inicio === fin ? fechaCorta(inicio) : `Del ${fechaCorta(inicio)} al ${fechaCorta(fin)}`}
            {creado.diasHabiles !== null && ` · ${creado.diasHabiles} ${creado.diasHabiles === 1 ? "día hábil" : "días hábiles"}`}
          </p>
        </div>
        {estatusCreado === ESTATUS_TRAMITE.creado ? (
          <p className="text-sm text-blue-900">Quedó como <strong>Creado</strong>. Envíalo a firma cuando esté listo.</p>
        ) : (
          <p className="text-sm font-semibold text-blue-900">
            {estatusCreado === ESTATUS_TRAMITE.revisionRh
              ? "Enviado a Recursos Humanos."
              : estatusCreado === ESTATUS_TRAMITE.revisionDirector
                ? "Enviado a firma del director."
                : "Enviado a firma del jefe."}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <AccionesSolicitud
            idTramite={creado.idTramite}
            folio={creado.folio}
            estatus={estatusCreado}
            alCambiar={setEstatusCreado}
            soloEnviar
          />
          <a
            href={`/formato/${creado.idTramite}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <IoPrintOutline className="h-4 w-4" /> Formato
          </a>
          <Link
            href="/expedientes"
            className="inline-flex items-center gap-2 rounded-md border border-blue-700 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-sm hover:bg-blue-50"
          >
            Ver en Mis Trámites Solicitados
          </Link>
        </div>
      </section>
    );
  if (!empleado) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <IoPersonOutline className="h-4 w-4" /> Datos del Empleado Solicitante
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <Dato label="Nombre empleado" valor={`${empleado.nombreCompleto} (${empleado.empleado})`} fuerte />
          <Dato label="Puesto" valor={empleado.descripcionPuesto} />
          <Dato label="Departamento" valor={empleado.descripcionDepto} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Tipo de permiso *">
            <select value={tipo} onChange={(e) => setTipo(Number(e.target.value))} className={inputCls}>
              {INCIDENCIAS_PERMISO.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <div className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Fecha del permiso *</span>
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                <input
                  type="checkbox"
                  checked={rangoDias}
                  onChange={(e) => {
                    setRangoDias(e.target.checked);
                    setFinCaptura(inicio);
                  }}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-700"
                />
                Rango de varios días
              </label>
            </div>
            <div className={`grid gap-2 ${rangoDias ? "grid-cols-2" : "grid-cols-1"}`}>
              <input
                type="date"
                value={inicio}
                aria-label="Fecha de inicio"
                onChange={(e) => {
                  setInicio(e.target.value);
                  if (finCaptura < e.target.value) setFinCaptura(e.target.value);
                }}
                className={inputCls}
              />
              {rangoDias && (
                <input
                  type="date"
                  value={finCaptura}
                  min={inicio || undefined}
                  aria-label="Fecha de fin"
                  onChange={(e) => setFinCaptura(e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
          <span className="text-xs font-bold uppercase tracking-wide">Días hábiles solicitados:</span>
          <span className="text-xl font-black">{contando ? "…" : (dias ?? "--")}</span>
          <span className="text-xs text-blue-800">Lunes a viernes; no se cuentan sábados, domingos ni días festivos.</span>
        </div>
        {actual?.datos && actual.datos.festivos.length > 0 && (
          <Aviso tipo="info">
            No se cuentan los días festivos:{" "}
            {actual.datos.festivos.map((f) => `${fechaCorta(f.fecha)} (${f.descripcion})`).join(", ")}.
          </Aviso>
        )}
        {actual?.error && <Aviso tipo="error">{actual.error}</Aviso>}

        <Campo label="Justificación *">
          <textarea
            value={motivo}
            maxLength={MAX_MOTIVO}
            rows={3}
            placeholder="Describe el motivo del permiso..."
            onChange={(e) => setMotivo(e.target.value)}
            className={inputCls}
          />
          <span className="mt-1 block text-right text-[11px] text-slate-400">
            {motivo.length}/{MAX_MOTIVO}
          </span>
        </Campo>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="perRelevo" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <IoPeopleOutline className="h-4 w-4" /> Persona que cubre / relevo (opcional)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={soloDepto}
                onChange={(e) => {
                  setSoloDepto(e.target.checked);
                  setRelevo(0);
                }}
                className="h-4 w-4 rounded border-slate-300 accent-blue-700"
              />
              Únicamente del departamento
            </label>
          </div>
          <select id="perRelevo" value={relevo} onChange={(e) => setRelevo(Number(e.target.value))} className={inputCls}>
            <option value={0}>{relevos === null ? "Cargando…" : "Sin relevo"}</option>
            {opcionesRelevo.map((r) => (
              <option key={r.empleado} value={r.empleado}>
                {r.nombreCompleto} ({r.empleado} · {r.descripcionPuesto})
              </option>
            ))}
          </select>
        </div>

        {errorGuardar && <Aviso tipo="error">{errorGuardar}</Aviso>}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {faltante && !contando && <span className="text-xs text-slate-500">{faltante}</span>}
          <button
            type="button"
            onClick={guardar}
            disabled={!!faltante || contando || guardando}
            className="inline-flex items-center gap-2 rounded-md bg-[#691c32] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#4f1526] disabled:opacity-50"
          >
            <IoSaveOutline className="h-4 w-4" />
            {guardando ? "Guardando…" : "Guardar permiso"}
          </button>
        </div>
      </section>

      <p className="flex items-start gap-2 pb-6 text-xs text-slate-500">
        <IoInformationCircleOutline className="mt-0.5 h-4 w-4 shrink-0" />
        Al guardar, el permiso queda generado (estatus Creado); el envío al jefe es un paso posterior.
      </p>
    </div>
  );
};

const inputCls =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20";

const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block min-w-0">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
    {children}
  </label>
);

const Dato = ({ label, valor, fuerte }: { label: string; valor: string; fuerte?: boolean }) => (
  <div className="min-w-0">
    <span className="block text-[10px] font-bold uppercase text-slate-400">{label}</span>
    <span className={`block break-words text-sm ${fuerte ? "font-bold text-slate-900" : "text-slate-700"}`}>{valor || "—"}</span>
  </div>
);

const Aviso = ({ tipo, children }: { tipo: "error" | "info"; children: React.ReactNode }) => (
  <div
    className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${
      tipo === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"
    }`}
  >
    <IoAlertCircleOutline className="mt-0.5 h-5 w-5 shrink-0" />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);
