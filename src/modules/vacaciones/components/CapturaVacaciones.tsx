"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IoAlertCircleOutline,
  IoCalculatorOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoSaveOutline,
} from "react-icons/io5";
import Link from "next/link";
import type { CapturaTramite } from "@/shared/modulos";
import { hoySysdate } from "@/shared/fechas";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ESTATUS_TRAMITE } from "@/shared/tramites";
import { AccionesSolicitud } from "@/modules/vacaciones/components/AccionesSolicitud";
import type { ConsultaVacaciones, DiaFestivo, PeriodoSimulado, Relevo, SaldoEmpleado, SolicitudCreada } from "@/modules/vacaciones/dtos";
import { getConsulta, getFestivos, getRelevos, getSaldo, guardarSolicitud } from "@/modules/vacaciones/data-access";
import { diasDeDescanso, nombrePeriodo, siguienteDiaHabil, textoDias } from "@/modules/vacaciones/lib/dias";

interface Desglose {
  solicitados: number;
  periodos: PeriodoSimulado[];
}

/** Respuesta de FN_CONSULTA_VACACIONES para el rango `rango` ("inicio|fin"); se descarta si el rango cambió. */
interface Consulta {
  rango: string;
  datos?: ConsultaVacaciones;
  error?: string;
}

/**
 * Paso 3 de Generar Nuevo Trámite (/nuevo) cuando el tipo es Vacaciones (mockup "Solicitud de Periodo Vacacional").
 * Fase 1: consulta el saldo oficial (F_SALDO_VACACIONES); al elegir el rango, FN_CONSULTA_VACACIONES da los días
 * hábiles (sin fines de semana ni festivos del empleado), los festivos que no se contaron y el reparto entre periodos,
 * que "Calcular" muestra. La fecha de regreso se sugiere aquí con los festivos de NOM_DIAS_FESTIVOS.
 * "Guardar solicitud" genera el trámite (estatus 1, folio VAC-NNNN-AAAA); el backend recalcula días y reparto.
 */
export const CapturaVacaciones: CapturaTramite = ({ empleado: noEmp }) => {
  const [datos, setDatos] = useState<SaldoEmpleado | null>(null);
  const [relevos, setRelevos] = useState<Relevo[] | null>(null);
  const [festivos, setFestivos] = useState<DiaFestivo[] | null>(null);
  const [error, setError] = useState("");

  const [relevo, setRelevo] = useState(0);
  const [soloDepto, setSoloDepto] = useState(true);
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [regreso, setRegreso] = useState("");
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [desglose, setDesglose] = useState<Desglose | null>(null);
  const [errorCalculo, setErrorCalculo] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState<SolicitudCreada | null>(null);
  const [estatusCreada, setEstatusCreada] = useState<number>(ESTATUS_TRAMITE.creado);
  const [errorGuardar, setErrorGuardar] = useState("");

  useEffect(() => {
    let vigente = true;
    getSaldo(noEmp)
      .then((d) => vigente && setDatos(d))
      .catch((e: Error) => vigente && setError(e.message));
    getRelevos(noEmp)
      .then((r) => vigente && setRelevos(r))
      .catch(() => vigente && setRelevos([]));
    // De hoy al cierre del año siguiente: cubre la fecha de regreso de cualquier rango que se capture.
    const desde = hoySysdate();
    getFestivos(noEmp, desde, `${Number(desde.slice(0, 4)) + 1}-12-31`)
      .then((f) => vigente && setFestivos(f))
      .catch((e: Error) => vigente && setError(`No se pudo cargar el catálogo de días festivos: ${e.message}`));
    return () => {
      vigente = false;
    };
  }, [noEmp]);

  // Cada rango completo se consulta a Oracle; la respuesta solo vale mientras el rango no cambie.
  const rango = inicio && fin && fin >= inicio ? `${inicio}|${fin}` : "";
  useEffect(() => {
    if (!rango) return;
    let vigente = true;
    const [desde, hasta] = rango.split("|");
    getConsulta(noEmp, desde, hasta)
      .then((d) => vigente && setConsulta({ rango, datos: d }))
      .catch((e: Error) => vigente && setConsulta({ rango, error: e.message }));
    return () => {
      vigente = false;
    };
  }, [noEmp, rango]);

  const actual = consulta && consulta.rango === rango ? consulta : null;
  const consultando = !!rango && !actual;
  const total = actual?.datos?.diasHabiles;
  // Días del rango que el saldo OFICIAL (F_SALDO_VACACIONES, la tarjeta verde) no cubre. No basta con el reparto de
  // FN_CONSULTA_VACACIONES/F_SIMULA: ése cuenta por año calendario periodos que el empleado aún no gana. También se
  // toma lo que el reparto no alcance. Se avisa al elegir las fechas, sin esperar a "Calcular"; el backend valida igual.
  const saldoOficial = datos?.saldo.diasTotalesPorDisfrutar ?? 0;
  const faltanDe = (solicitados: number, periodos: PeriodoSimulado[]) =>
    Math.max(
      solicitados - saldoOficial,
      solicitados - periodos.reduce((s, p) => s + p.dias, 0),
      0
    );
  const sinSaldo = actual?.datos ? faltanDe(actual.datos.diasHabiles, actual.datos.periodos) : 0;
  const descanso = useMemo(() => diasDeDescanso(festivos ?? []), [festivos]);
  const hoy = hoySysdate();

  const opcionesRelevo = useMemo(
    () => (relevos ?? []).filter((r) => !soloDepto || !datos || r.deptoComi === datos.empleado.deptoComi),
    [relevos, soloDepto, datos]
  );

  // Cambiar el rango invalida el desglose ya calculado.
  const cambiarFechas = (nuevoInicio: string, nuevoFin: string) => {
    setInicio(nuevoInicio);
    setFin(nuevoFin);
    setDesglose(null);
    setErrorCalculo("");
    setErrorGuardar("");
    if (nuevoFin) setRegreso(siguienteDiaHabil(nuevoFin, descanso));
  };

  // El reparto ya vino en la consulta del rango: "Calcular" solo lo muestra.
  const calcular = () => {
    setErrorCalculo("");
    if (!inicio || !fin) return setErrorCalculo("Selecciona la fecha de inicio y la de fin.");
    if (fin < inicio) return setErrorCalculo("La fecha de fin no puede ser anterior a la de inicio.");
    if (!actual?.datos) return;
    if (actual.datos.diasHabiles === 0)
      return setErrorCalculo("El rango no contiene días hábiles (solo fines de semana o días festivos).");
    setDesglose({ solicitados: actual.datos.diasHabiles, periodos: actual.datos.periodos });
  };

  const guardar = async () => {
    if (!desglose || guardando) return;
    setErrorGuardar("");
    setGuardando(true);
    try {
      setCreada(
        await guardarSolicitud({
          noEmp,
          desde: inicio,
          hasta: fin,
          fechaRegreso: regreso || null,
          idEmpleadoCubre: relevo || null,
          comentarios: comentarios.trim() || null,
        })
      );
    } catch (e) {
      setErrorGuardar((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  if (error) return <Aviso tipo="error">{error}</Aviso>;
  if (creada)
    return (
      <section className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
        <IoCheckmarkCircleOutline className="mx-auto h-12 w-12 text-emerald-700" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-900">Solicitud generada</p>
          <p className="mt-1 text-3xl font-black text-emerald-800">{creada.folio}</p>
          <p className="mt-2 text-sm text-emerald-900">
            Del {inicio} al {fin} · regreso {creada.fechaRegreso}
          </p>
        </div>
        {estatusCreada === ESTATUS_TRAMITE.creado ? (
          <p className="text-sm text-emerald-900">Quedó como <strong>Creado</strong>. Envíala a firma cuando esté lista.</p>
        ) : (
          <p className="text-sm font-semibold text-emerald-900">Enviada a firma del jefe.</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <AccionesSolicitud
            idTramite={creada.idTramite}
            folio={creada.folio}
            estatus={estatusCreada}
            alCambiar={setEstatusCreada}
            soloEnviar
          />
          <Link
            href="/expedientes"
            className="inline-flex items-center gap-2 rounded-md border border-emerald-700 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-50"
          >
            Ver en Mis Trámites Solicitados
          </Link>
        </div>
      </section>
    );
  if (!datos || !festivos) return <LoadingSpinner />;

  const { empleado, saldo } = datos;
  const faltantes = desglose ? faltanDe(desglose.solicitados, desglose.periodos) : 0;
  const cubiertos = desglose ? desglose.solicitados - faltantes : 0;

  return (
    <div className="space-y-4">
      {/* a) Datos del empleado y saldo oficial */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <IoPersonOutline className="h-4 w-4" /> Datos del Empleado Solicitante
          </h4>
          <Dato label="Nombre empleado" valor={`${empleado.nombreCompleto} (${empleado.empleado})`} fuerte />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Dato label="Puesto" valor={empleado.descripcionPuesto} />
            <Dato label="Departamento" valor={empleado.descripcionDepto} />
          </div>
        </section>

        <section className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-emerald-950">Saldo Oficial de Vacaciones</span>
            <span className="text-xs text-emerald-800">Periodos 1 y 2 registrados en nómina</span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-emerald-800">
              {saldo.diasTotalesPorDisfrutar.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
            <span className="mt-0.5 block text-[11px] font-bold text-emerald-700 sm:text-xs">
              {saldo.anoDisponible
                ? `${textoDias(saldo.diasPorDisfrutar)} disponibles | ${saldo.anoDisponible} ${nombrePeriodo(saldo.periodoDisponible)}`
                : "Sin periodos con saldo"}
            </span>
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* b) Persona que cubre */}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="vacRelevo" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
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
                className="h-4 w-4 rounded border-slate-300 accent-emerald-700"
              />
              Únicamente del departamento
            </label>
          </div>
          <select id="vacRelevo" value={relevo} onChange={(e) => setRelevo(Number(e.target.value))} className={inputCls}>
            <option value={0}>{relevos === null ? "Cargando…" : "Sin relevo"}</option>
            {opcionesRelevo.map((r) => (
              <option key={r.empleado} value={r.empleado}>
                {r.nombreCompleto} ({r.empleado} · {r.descripcionPuesto})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {soloDepto ? (
              <>
                Mostrando únicamente personal de <strong className="text-slate-700">{empleado.descripcionDepto}</strong>.
              </>
            ) : (
              "Mostrando personal de todos los departamentos."
            )}
          </p>
        </div>

        {/* c) Fechas, total de días hábiles y Calcular */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Fecha inicio *">
            <input type="date" value={inicio} min={hoy} onChange={(e) => cambiarFechas(e.target.value, fin && fin < e.target.value ? e.target.value : fin)} className={inputCls} />
          </Campo>
          <Campo label="Fecha fin *">
            <input type="date" value={fin} min={inicio || hoy} onChange={(e) => cambiarFechas(inicio, e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Total días solicitados" ayuda="Solo días hábiles (lunes a viernes). No se cuentan sábados, domingos ni días festivos.">
            <input
              type="text"
              readOnly
              value={consultando ? "Calculando…" : (total ?? "")}
              placeholder="--"
              className={`${inputCls} font-bold ${sinSaldo > 0 ? "border-red-400 bg-red-50 text-red-700" : "bg-slate-50"}`}
            />
          </Campo>
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Acción</span>
            <button
              type="button"
              onClick={calcular}
              disabled={consultando || !actual?.datos}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              <IoCalculatorOutline className="h-4 w-4" />
              {consultando ? "Calculando…" : "Calcular"}
            </button>
          </div>
        </div>

        <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,16rem)_1fr]">
          <Campo label="Fecha regreso *">
            <input type="date" value={regreso} min={fin || undefined} onChange={(e) => setRegreso(e.target.value)} className={inputCls} />
          </Campo>
          <p className="flex items-start gap-2 pb-2 text-xs text-slate-500">
            <IoCalendarOutline className="mt-0.5 h-4 w-4 shrink-0" />
            Fecha en la que el colaborador se reincorpora a sus labores (primer día de regreso al trabajo).
          </p>
        </div>

        {actual?.datos?.festivos && <Aviso tipo="info">No se cuentan los días festivos: {actual.datos.festivos}.</Aviso>}

        {(errorCalculo || actual?.error) && <Aviso tipo="error">{errorCalculo || actual?.error}</Aviso>}

        {!desglose && sinSaldo > 0 && actual?.datos && (
          <Aviso tipo="error">
            <strong>Saldo insuficiente.</strong> El rango tiene {textoDias(actual.datos.diasHabiles)} hábiles y el saldo de vacaciones
            solo alcanza para {textoDias(actual.datos.diasHabiles - sinSaldo)}: faltan {textoDias(sinSaldo)}. Ajusta la fecha de fin.
          </Aviso>
        )}

        {/* d) Desglose por periodo */}
        {!desglose ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center">
            <IoCalculatorOutline className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">Desglose por periodos pendiente</p>
            <p className="mt-1 text-xs text-slate-500">
              Presiona <strong>&quot;Calcular&quot;</strong> para repartir los días hábiles entre los periodos oficiales.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Desglose por periodo (días utilizados y restantes)</h4>
            {desglose.periodos.length === 0 ? (
              <Aviso tipo="error">No hay periodos con saldo para cubrir la solicitud.</Aviso>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {desglose.periodos.map((p) => (
                  <div key={`${p.ano}-${p.periodo}`} className="grid grid-cols-2 gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
                    <Dato label="Año" valor={String(p.ano)} fuerte />
                    <Dato label="Periodo" valor={nombrePeriodo(p.periodo)} />
                    <Dato label="Disponibles" valor={textoDias(p.dias + p.diasXDisfrutar)} />
                    <Dato label="A solicitar" valor={textoDias(p.dias)} fuerte />
                    <span className="col-span-2 text-right text-xs font-semibold text-emerald-800">{textoDias(p.diasXDisfrutar)} restantes</span>
                  </div>
                ))}
              </div>
            )}
            {faltantes > 0 ? (
              <Aviso tipo="error">
                Solicitaste {textoDias(desglose.solicitados)} hábiles, pero el saldo solo cubre {textoDias(cubiertos)}: faltan{" "}
                {textoDias(faltantes)}.
              </Aviso>
            ) : (
              <Aviso tipo="info">{textoDias(desglose.solicitados)} hábiles repartidos por periodo oficial.</Aviso>
            )}
          </div>
        )}
      </section>

      {desglose && faltantes <= 0 && desglose.periodos.length > 0 && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Campo label="Comentarios (opcional)">
            <textarea
              value={comentarios}
              maxLength={1000}
              rows={2}
              onChange={(e) => setComentarios(e.target.value)}
              className={inputCls}
            />
          </Campo>
          {errorGuardar && <Aviso tipo="error">{errorGuardar}</Aviso>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || !regreso}
              className="inline-flex items-center gap-2 rounded-md bg-[#691c32] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#4f1526] disabled:opacity-50"
            >
              <IoSaveOutline className="h-4 w-4" />
              {guardando ? "Guardando…" : "Guardar solicitud"}
            </button>
          </div>
        </section>
      )}

      <p className="flex items-start gap-2 pb-6 text-xs text-slate-500">
        <IoInformationCircleOutline className="mt-0.5 h-4 w-4 shrink-0" />
        Al guardar, la solicitud queda generada (estatus Creado); el envío al jefe es un paso posterior.
      </p>
    </div>
  );
};

const inputCls =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20";

const Campo = ({ label, ayuda, children }: { label: string; ayuda?: string; children: React.ReactNode }) => (
  <label className="block min-w-0" title={ayuda}>
    <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
      {label}
      {ayuda && <IoInformationCircleOutline className="h-3.5 w-3.5 text-slate-400" />}
    </span>
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
      tipo === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
    }`}
  >
    <IoAlertCircleOutline className="mt-0.5 h-5 w-5 shrink-0" />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);
