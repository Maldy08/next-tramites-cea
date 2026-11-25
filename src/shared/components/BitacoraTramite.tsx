"use client";

import { useEffect, useState } from "react";
import {
  IoBanOutline,
  IoCheckmark,
  IoCheckmarkDoneOutline,
  IoChatbubblesOutline,
  IoClose,
  IoGitNetworkOutline,
  IoHourglassOutline,
  IoPrintOutline,
  IoReturnUpBackOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { getDetalleTramite } from "@/shared/edicion";
import {
  type DetalleTramite,
  ESTATUS_TRAMITE,
  INCIDENCIAS,
  type MovimientoTramite,
  TIPO_TRAMITE,
  estatusTramite,
} from "@/shared/tramites";

const ddmmaaaa = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const fechaHora = (iso: string) => `${ddmmaaaa(iso)} ${iso.slice(11, 16)}`;
/** "No. 7148 · NOMBRE COMPLETO" (solo el número si el backend no trae el nombre). */
const conNombre = (noEmp: number, nombre?: string | null) => (nombre ? `No. ${noEmp} · ${nombre}` : `No. ${noEmp}`);
const quien = (m: MovimientoTramite) => conNombre(m.idEmpleado, m.nombreEmpleado);

const NOMBRE_TIPO: Record<number, string> = {
  [TIPO_TRAMITE.vacaciones]: "Vacaciones",
  [TIPO_TRAMITE.permisos]: "Permisos",
  [TIPO_TRAMITE.justificantes]: "Justificantes",
};

/** Movimientos de NOM_TRAMITES_BITACORA en orden (la misma lista que ve RH en Modificar). */
export const ListaBitacora = ({ bitacora }: { bitacora: MovimientoTramite[] }) => (
  <ul className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
    {bitacora.map((b) => (
      <li key={b.idBitacora}>
        <span className="font-mono text-slate-500">{fechaHora(b.fechaMovimiento)}</span> · <b>{b.accion}</b> · {quien(b)}
        {b.comentarios && <span className="block pl-4 text-slate-500">{b.comentarios}</span>}
      </li>
    ))}
  </ul>
);

// ---- Cadena de firmas: 1 empleado genera → 2 jefe (VALIDA_1) → 3 director (VALIDA_2) → 4 RH ----

type EstadoPaso = "hecho" | "espera" | "pendiente" | "omitido" | "noAplica";

interface Paso {
  titulo: string;
  descripcion: string;
  estado: EstadoPaso;
  movimiento?: MovimientoTramite;
  /** Quién debe firmar (pendiente / en espera). */
  responsable?: string;
}

/**
 * Arma los 4 pasos desde la bitácora (ID_ESTATUS = estatus en que quedó el trámite). Si se regresó (98), las firmas
 * se vuelven a pedir: solo cuentan los movimientos posteriores al último regreso. Los "MODIFICADO …" no son firmas.
 */
const cadenaDeFirmas = ({ tramite: t }: DetalleTramite): Paso[] => {
  const movs = t.bitacora.filter((m) => !m.accion.startsWith("MODIFICADO"));
  const ultimoRegreso = movs.map((m) => m.idEstatus).lastIndexOf(ESTATUS_TRAMITE.regresado);
  const ciclo = movs.slice(ultimoRegreso + 1);

  const generada = movs.find((m) => m.idEstatus === ESTATUS_TRAMITE.creado);
  // Jefe: VALIDADO POR EL JEFE (→3), JEFE Y DIRECTOR (→4) o envío directo del jefe (→3/→4).
  const jefe = ciclo.find((m) => m.accion.includes("JEFE") && (m.idEstatus === 3 || m.idEstatus === 4));
  // Director: cualquier movimiento que lo deja en Revisión RH mencionando al director.
  const director = ciclo.find((m) => m.accion.includes("DIRECTOR") && m.idEstatus === ESTATUS_TRAMITE.revisionRh);
  const rh = ciclo.find((m) => m.idEstatus === ESTATUS_TRAMITE.autorizado);

  const cerrado = t.estatus === ESTATUS_TRAMITE.cancelado || t.estatus === ESTATUS_TRAMITE.regresado;
  const enEspera = (estatus: number) => t.estatus === estatus;
  const sinFirma = (m?: MovimientoTramite): EstadoPaso =>
    m ? "hecho" : rh ? "omitido" : cerrado ? "noAplica" : "pendiente";

  return [
    {
      titulo: "1. Empleado genera solicitud",
      descripcion: "Solicitud formal capturada y emitida con folio oficial.",
      estado: generada ? "hecho" : "pendiente",
      movimiento: generada,
    },
    {
      titulo: "2. Autorización del jefe de área",
      descripcion: "Vo.Bo. inmediato de la jefatura.",
      estado: enEspera(ESTATUS_TRAMITE.revisionJefe) ? "espera" : sinFirma(jefe),
      movimiento: jefe,
      responsable: t.valida1 ? conNombre(t.valida1, t.nombreValida1) : undefined,
    },
    {
      titulo: "3. Autorización del director de área",
      descripcion: "Visto bueno del director.",
      estado: enEspera(ESTATUS_TRAMITE.revisionDirector) ? "espera" : sinFirma(director),
      movimiento: director,
      responsable: t.valida2 ? conNombre(t.valida2, t.nombreValida2) : undefined,
    },
    {
      titulo: "4. Aprobación de Recursos Humanos",
      descripcion: "Revisión final y autorización de la Coordinación de Recursos Humanos.",
      estado: enEspera(ESTATUS_TRAMITE.revisionRh) ? "espera" : rh ? "hecho" : cerrado ? "noAplica" : "pendiente",
      movimiento: rh,
      responsable: "Recursos Humanos",
    },
  ];
};

const ESTILO_PASO: Record<EstadoPaso, { circulo: string; tarjeta: string }> = {
  hecho: { circulo: "bg-emerald-500 text-white", tarjeta: "border-emerald-200 bg-emerald-50/60" },
  espera: { circulo: "bg-amber-400 text-white", tarjeta: "border-amber-300 bg-amber-50" },
  pendiente: { circulo: "border-2 border-slate-300 bg-white text-slate-400", tarjeta: "border-slate-200 bg-white" },
  omitido: { circulo: "border-2 border-slate-300 bg-slate-100 text-slate-400", tarjeta: "border-slate-200 bg-slate-50" },
  noAplica: { circulo: "border-2 border-slate-200 bg-slate-50 text-slate-300", tarjeta: "border-slate-200 bg-slate-50 opacity-70" },
};

const PasoFirma = ({ paso, numero, ultimo }: { paso: Paso; numero: number; ultimo: boolean }) => {
  const estilo = ESTILO_PASO[paso.estado];
  return (
    <li className="relative flex gap-4 pb-4">
      {!ultimo && <span className="absolute left-[15px] top-8 h-full w-0.5 bg-slate-200" aria-hidden />}
      <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${estilo.circulo}`}>
        {paso.estado === "hecho" ? <IoCheckmark className="h-5 w-5" /> : paso.estado === "espera" ? <IoHourglassOutline className="h-4 w-4" /> : numero}
      </span>
      <div className={`min-w-0 flex-1 rounded-xl border px-4 py-3 ${estilo.tarjeta}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm font-bold text-slate-900">{paso.titulo}</p>
          {paso.movimiento && <span className="font-mono text-[11px] text-slate-500">{fechaHora(paso.movimiento.fechaMovimiento)}</span>}
        </div>
        <p className="mt-0.5 text-xs text-slate-600">{paso.descripcion}</p>
        {paso.estado === "hecho" && paso.movimiento && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-emerald-700">
            <IoCheckmarkDoneOutline className="h-4 w-4" /> {numero === 1 ? "Generada por" : "Firmado por"}: {quien(paso.movimiento)}
          </p>
        )}
        {paso.estado === "espera" && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-amber-800">
            <IoTimeOutline className="h-4 w-4" /> En espera de firma{paso.responsable ? `: ${paso.responsable}` : ""}
          </p>
        )}
        {paso.estado === "pendiente" && paso.responsable && (
          <p className="mt-1.5 text-xs font-semibold text-slate-500">Pendiente: {paso.responsable}</p>
        )}
        {paso.estado === "omitido" && (
          <p className="mt-1.5 text-xs font-semibold text-slate-500">Sin firma: Recursos Humanos autorizó directamente.</p>
        )}
        {paso.estado === "noAplica" && <p className="mt-1.5 text-xs font-semibold text-slate-400">No aplica.</p>}
      </div>
    </li>
  );
};

/** Aviso de cancelado o regresado con el motivo del último movimiento. */
const AvisoCierre = ({ detalle }: { detalle: DetalleTramite }) => {
  const t = detalle.tramite;
  if (t.estatus !== ESTATUS_TRAMITE.cancelado && t.estatus !== ESTATUS_TRAMITE.regresado) return null;
  const mov = [...t.bitacora].reverse().find((m) => m.idEstatus === t.estatus);
  const cancelado = t.estatus === ESTATUS_TRAMITE.cancelado;
  return (
    <div
      className={`flex gap-2 rounded-xl border px-4 py-3 text-xs ${
        cancelado ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      {cancelado ? <IoBanOutline className="mt-0.5 h-4 w-4 shrink-0" /> : <IoReturnUpBackOutline className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>
        <b>{mov?.accion ?? (cancelado ? "CANCELADO" : "REGRESADO")}</b>
        {mov && ` · ${fechaHora(mov.fechaMovimiento)} · ${quien(mov)}`}
        {mov?.comentarios && <span className="mt-0.5 block">Motivo: {mov.comentarios}</span>}
        {!cancelado && <span className="mt-0.5 block">Puede editarlo y volver a enviarlo a firma.</span>}
      </div>
    </div>
  );
};

/** "Permiso con goce de sueldo · 12/11/2026 al 14/11/2026" / "Vacaciones · 5 días · 01/12/2026 al 05/12/2026". */
const tituloDe = ({ tramite: t, vacaciones: v, permisoJustificante: p }: DetalleTramite) => {
  if (v) {
    const rango = ddmmaaaa(v.fDesde) === ddmmaaaa(v.fHasta) ? ddmmaaaa(v.fDesde) : `${ddmmaaaa(v.fDesde)} al ${ddmmaaaa(v.fHasta)}`;
    return `Vacaciones · ${v.diasSolicitados} ${v.diasSolicitados === 1 ? "día" : "días"} · ${rango}`;
  }
  if (p) {
    const incidencia = INCIDENCIAS.find((i) => i.id === p.tipoIncidencia)?.nombre ?? "Incidencia";
    const rango = ddmmaaaa(p.fechaInicio) === ddmmaaaa(p.fechaFin) ? ddmmaaaa(p.fechaInicio) : `${ddmmaaaa(p.fechaInicio)} al ${ddmmaaaa(p.fechaFin)}`;
    return `${incidencia} · ${rango}`;
  }
  return NOMBRE_TIPO[t.tipoTramite] ?? "Trámite";
};

/**
 * Botón "Bitácora" de la Bandeja: abre la cadena de firmas (empleado → jefe → director → RH) y la bitácora completa
 * con comentarios. Lee /api/tramites/[idTramite] (beneficiario o su supervisor, cualquier estatus).
 */
export const BotonBitacora = ({ idTramite, folio }: { idTramite: number; folio: string }) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="Ver la cadena de firmas y los movimientos del trámite"
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <IoTimeOutline className="h-4 w-4" /> Bitácora
      </button>
      {abierto && <ModalBitacora idTramite={idTramite} folio={folio} alCerrar={() => setAbierto(false)} />}
    </>
  );
};

type Pestana = "firmas" | "bitacora";

const ModalBitacora = ({ idTramite, folio, alCerrar }: { idTramite: number; folio: string; alCerrar: () => void }) => {
  const [detalle, setDetalle] = useState<DetalleTramite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>("firmas");

  useEffect(() => {
    let vigente = true;
    getDetalleTramite(idTramite)
      .then((d) => vigente && setDetalle(d))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [idTramite]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [alCerrar]);

  const t = detalle?.tramite;
  const est = t ? estatusTramite(t.estatus) : null;
  const pasos = detalle ? cadenaDeFirmas(detalle) : [];

  const pestanaCls = (p: Pestana) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
      pestana === p ? "bg-primary-900 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={alCerrar}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white text-left shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 pb-4 pt-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {t && (
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-900">
                  {NOMBRE_TIPO[t.tipoTramite] ?? "Trámite"}
                </span>
              )}
              <span className="font-mono text-xs font-bold text-slate-800">{folio}</span>
              {est && <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">{est.etiqueta}</span>}
            </div>
            <h3 className="mt-1.5 text-lg font-black text-slate-900">{detalle ? tituloDe(detalle) : "Bitácora del trámite"}</h3>
            {t && (
              <p className="text-xs text-slate-500">
                Beneficiario: {detalle?.nombreEmpleado ?? t.nombreEmpleado ?? `No. ${t.idEmpleado}`} · Fecha: {ddmmaaaa(t.fechaSolicitud)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
          >
            <IoClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-200 px-6 py-2">
          <button type="button" onClick={() => setPestana("firmas")} className={pestanaCls("firmas")}>
            <IoGitNetworkOutline className="h-4 w-4" /> Cadena de firmas
          </button>
          <button type="button" onClick={() => setPestana("bitacora")} className={pestanaCls("bitacora")}>
            <IoChatbubblesOutline className="h-4 w-4" /> Movimientos y comentarios
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          {!detalle && !error && <p className="text-sm text-slate-500">Cargando…</p>}

          {detalle && pestana === "firmas" && (
            <>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <b>Cadena oficial institucional:</b> 1. Empleado genera → 2. Jefe de área autoriza → 3. Director de área
                autoriza → 4. Recursos Humanos aprueba.
              </p>
              <AvisoCierre detalle={detalle} />
              <ol>
                {pasos.map((p, i) => (
                  <PasoFirma key={p.titulo} paso={p} numero={i + 1} ultimo={i === pasos.length - 1} />
                ))}
              </ol>
            </>
          )}

          {detalle && pestana === "bitacora" &&
            (t?.bitacora.length ? <ListaBitacora bitacora={t.bitacora} /> : <p className="text-sm text-slate-500">Sin movimientos.</p>)}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-6 py-4">
          <a
            href={`/formato/${idTramite}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
          >
            <IoPrintOutline className="h-4 w-4 text-primary-900" /> Imprimir formato oficial
          </a>
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
