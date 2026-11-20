"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoPersonOutline,
  IoPrintOutline,
  IoSaveOutline,
} from "react-icons/io5";
import type { CapturaTramite } from "@/shared/modulos";
import { hoySysdate } from "@/shared/fechas";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ESTATUS_TRAMITE } from "@/shared/tramites";
import { AccionesSolicitud } from "@/modules/justificantes/components/AccionesSolicitud";
import { INCIDENCIAS_JUSTIFICANTE, type EmpleadoJustificante, type JustificanteCreado } from "@/modules/justificantes/dtos";
import { getEmpleado, guardarJustificante } from "@/modules/justificantes/data-access";

const MAX_MOTIVO = 500;

/** "AAAA-MM-DD" → "DD/MM/AAAA". */
const fechaCorta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Paso 3 de Generar Nuevo Trámite (/nuevo) cuando el tipo es Justificantes (mockup "Justificantes"): tipo de
 * incidencia (TIPO_INCIDENCIA 3-7), fecha y hora según la incidencia y explicación. Genera el trámite tipo 4
 * (folio JUS-NNNN-AAAA). Justificación de entrada/salida: un día con hora de inicio y fin; no checada de
 * entrada/salida: un día y la hora; no checada de todo el día: uno o varios días sin hora.
 */
export const CapturaJustificantes: CapturaTramite = ({ empleado: noEmp }) => {
  const [empleado, setEmpleado] = useState<EmpleadoJustificante | null>(null);
  const [error, setError] = useState("");

  const [tipo, setTipo] = useState(INCIDENCIAS_JUSTIFICANTE[0].id);
  const [fecha, setFecha] = useState(hoySysdate());
  const [fechaFin, setFechaFin] = useState(hoySysdate());
  const [rangoDias, setRangoDias] = useState(false);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [creado, setCreado] = useState<JustificanteCreado | null>(null);
  const [estatusCreado, setEstatusCreado] = useState<number>(ESTATUS_TRAMITE.creado);

  useEffect(() => {
    let vigente = true;
    getEmpleado(noEmp)
      .then((e) => vigente && setEmpleado(e))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [noEmp]);

  const incidencia = INCIDENCIAS_JUSTIFICANTE.find((i) => i.id === tipo)!;
  const captura = incidencia.captura;
  const finDia = captura === "dia" && rangoDias ? fechaFin : fecha;

  // Fecha/hora que se mandan ("AAAA-MM-DDTHH:MI"); 00:00 en los de día completo.
  const inicioEnvio = `${fecha}T${captura === "dia" ? "00:00" : horaInicio}`;
  const finEnvio = captura === "dia" ? `${finDia}T00:00` : `${fecha}T${captura === "rango" ? horaFin : horaInicio}`;

  const faltante = !fecha
    ? "Selecciona la fecha de la incidencia."
    : captura !== "dia" && !horaInicio
      ? captura === "rango" ? "Captura la hora de inicio." : "Captura la hora que no se registró en el reloj."
      : captura === "rango" && !horaFin
        ? "Captura la hora de fin."
        : captura === "rango" && horaFin <= horaInicio
          ? "La hora de fin debe ser posterior a la de inicio."
          : captura === "dia" && rangoDias && (!fechaFin || fechaFin < fecha)
            ? "La fecha de fin no puede ser anterior a la de inicio."
            : !motivo.trim()
              ? "Escribe la explicación de la incidencia."
              : "";

  const guardar = async () => {
    if (faltante || guardando) return;
    setErrorGuardar("");
    setGuardando(true);
    try {
      setCreado(
        await guardarJustificante({
          noEmp,
          tipoIncidencia: tipo,
          fechaInicio: inicioEnvio,
          fechaFin: finEnvio,
          justificacionMotivo: motivo.trim(),
        })
      );
    } catch (e) {
      setErrorGuardar((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const resumen =
    captura === "dia"
      ? finDia === fecha
        ? fechaCorta(fecha)
        : `Del ${fechaCorta(fecha)} al ${fechaCorta(finDia)}`
      : captura === "rango"
        ? `${fechaCorta(fecha)} de ${horaInicio} a ${horaFin} hrs`
        : `${fechaCorta(fecha)} a las ${horaInicio} hrs`;

  if (error) return <Aviso tipo="error">{error}</Aviso>;
  if (creado)
    return (
      <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
        <IoCheckmarkCircleOutline className="mx-auto h-12 w-12 text-amber-700" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-900">Justificante generado</p>
          <p className="mt-1 text-3xl font-black text-amber-800">{creado.folio}</p>
          <p className="mt-2 text-sm text-amber-900">
            {incidencia.nombre} · {resumen}
          </p>
        </div>
        {estatusCreado === ESTATUS_TRAMITE.creado ? (
          <p className="text-sm text-amber-900">Quedó como <strong>Creado</strong>. Envíalo a firma cuando esté listo.</p>
        ) : (
          <p className="text-sm font-semibold text-amber-900">
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
            className="inline-flex items-center gap-2 rounded-md border border-amber-700 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-50"
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
          <Campo label="Tipo de incidencia *">
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(Number(e.target.value));
                setRangoDias(false);
              }}
              className={inputCls}
            >
              {INCIDENCIAS_JUSTIFICANTE.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <div className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Fecha *</span>
              {captura === "dia" && (
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                  <input
                    type="checkbox"
                    checked={rangoDias}
                    onChange={(e) => {
                      setRangoDias(e.target.checked);
                      setFechaFin(fecha);
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-amber-600"
                  />
                  Rango de días
                </label>
              )}
            </div>
            <div className={`grid gap-2 ${captura === "dia" && rangoDias ? "grid-cols-2" : "grid-cols-1"}`}>
              <input
                type="date"
                value={fecha}
                aria-label="Fecha de la incidencia"
                onChange={(e) => {
                  setFecha(e.target.value);
                  if (fechaFin < e.target.value) setFechaFin(e.target.value);
                }}
                className={inputCls}
              />
              {captura === "dia" && rangoDias && (
                <input
                  type="date"
                  value={fechaFin}
                  min={fecha || undefined}
                  aria-label="Fecha de fin"
                  onChange={(e) => setFechaFin(e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          </div>
        </div>

        {captura !== "dia" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label={captura === "rango" ? "Hora de inicio *" : "Hora a justificar *"}>
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={inputCls} />
            </Campo>
            {captura === "rango" && (
              <Campo label="Hora de fin *">
                <input type="time" value={horaFin} min={horaInicio || undefined} onChange={(e) => setHoraFin(e.target.value)} className={inputCls} />
              </Campo>
            )}
          </div>
        )}
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <IoInformationCircleOutline className="mt-0.5 h-4 w-4 shrink-0" />
          {captura === "rango"
            ? "Periodo del día que se justifica (p. ej. llegada a las 10:30 por una cita: de 08:00 a 10:30)."
            : captura === "hora"
              ? "Hora en que debió registrarse la checada que no quedó en el reloj."
              : "Día o días completos en que no hay ninguna checada registrada."}
        </p>

        <Campo label="Explicación *">
          <textarea
            value={motivo}
            maxLength={MAX_MOTIVO}
            rows={3}
            placeholder="Detalla el motivo de la incidencia..."
            onChange={(e) => setMotivo(e.target.value)}
            className={inputCls}
          />
          <span className="mt-1 block text-right text-[11px] text-slate-400">
            {motivo.length}/{MAX_MOTIVO}
          </span>
        </Campo>

        {errorGuardar && <Aviso tipo="error">{errorGuardar}</Aviso>}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {faltante && <span className="text-xs text-slate-500">{faltante}</span>}
          <button
            type="button"
            onClick={guardar}
            disabled={!!faltante || guardando}
            className="inline-flex items-center gap-2 rounded-md bg-[#691c32] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#4f1526] disabled:opacity-50"
          >
            <IoSaveOutline className="h-4 w-4" />
            {guardando ? "Guardando…" : "Guardar justificante"}
          </button>
        </div>
      </section>

      <p className="flex items-start gap-2 pb-6 text-xs text-slate-500">
        <IoInformationCircleOutline className="mt-0.5 h-4 w-4 shrink-0" />
        Al guardar, el justificante queda generado (estatus Creado); el envío al jefe es un paso posterior.
      </p>
    </div>
  );
};

const inputCls =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

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
      tipo === "error" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-800"
    }`}
  >
    <IoAlertCircleOutline className="mt-0.5 h-5 w-5 shrink-0" />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);
