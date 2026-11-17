"use client";

import { useEffect, useState } from "react";
import { IoSaveOutline } from "react-icons/io5";
import { toast } from "@/shared/store/useToast";
import { INCIDENCIAS, TIPO_TRAMITE, estatusTramite } from "@/shared/tramites";
import { getTramite, modificarTramite } from "@/modules/rh/data-access";
import type { DetalleTramiteRh } from "@/modules/rh/dtos";

const inputCls =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#691c32] focus:ring-2 focus:ring-[#691c32]/20";
const botonCls =
  "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition disabled:opacity-50";

const dia = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");
const hora = (iso: string | null | undefined) => (iso ? iso.slice(11, 16) : "");
const fechaHora = (iso: string) => `${iso.slice(0, 10).split("-").reverse().join("/")} ${iso.slice(11, 16)}`;

const Campo = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{etiqueta}</span>
    {children}
  </label>
);

/**
 * Modal de RH para modificar un trámite en cualquier estatus (menos cancelado). Vacaciones: periodo y fecha de regreso
 * (el backend recalcula días y reparto por periodo). Permisos/justificantes: incidencia del mismo tipo, fechas/horas y
 * justificación. El relevo se conserva. Pide el motivo de la modificación (va a la bitácora).
 */
export const ModificarTramite = ({
  idTramite,
  alCerrar,
  alGuardar,
}: {
  idTramite: number;
  alCerrar: () => void;
  alGuardar: () => void;
}) => {
  const [detalle, setDetalle] = useState<DetalleTramiteRh | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Vacaciones
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [regreso, setRegreso] = useState("");
  // Permisos y justificantes
  const [incidencia, setIncidencia] = useState(0);
  const [fecha, setFecha] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [justificacion, setJustificacion] = useState("");

  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    let vigente = true;
    getTramite(idTramite)
      .then((d) => {
        if (!vigente) return;
        setDetalle(d);
        if (d.vacaciones) {
          setDesde(dia(d.vacaciones.fDesde));
          setHasta(dia(d.vacaciones.fHasta));
          setRegreso(dia(d.vacaciones.fechaRegreso));
        }
        const p = d.permisoJustificante;
        if (p) {
          setIncidencia(p.tipoIncidencia);
          setFecha(dia(p.fechaInicio));
          setFechaFin(dia(p.fechaFin));
          setHoraInicio(hora(p.fechaInicio));
          setHoraFin(hora(p.fechaFin));
          setJustificacion(p.justificacionMotivo);
        }
      })
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [idTramite]);

  const t = detalle?.tramite;
  const esVacaciones = t?.tipoTramite === TIPO_TRAMITE.vacaciones;
  const opciones = INCIDENCIAS.filter((i) => i.tipoTramite === t?.tipoTramite);
  const captura = INCIDENCIAS.find((i) => i.id === incidencia)?.captura ?? "dia";

  const guardar = async () => {
    if (!t) return;
    setOcupado(true);
    try {
      if (esVacaciones) {
        await modificarTramite(t.idTramite, { tipo: "vacaciones", desde, hasta, fechaRegreso: regreso || null, comentarios: motivo });
      } else {
        const inicio = captura === "dia" ? `${fecha}T00:00` : `${fecha}T${horaInicio}`;
        const fin =
          captura === "dia" ? `${fechaFin || fecha}T00:00` : captura === "hora" ? inicio : `${fecha}T${horaFin}`;
        await modificarTramite(t.idTramite, {
          tipo: "permisoJustificante",
          tipoIncidencia: incidencia,
          fechaInicio: inicio,
          fechaFin: fin,
          justificacionMotivo: justificacion,
          comentarios: motivo,
        });
      }
      toast.success(`${t.folio} modificado`);
      alGuardar();
    } catch (e) {
      toast.error((e as Error).message, 8000);
    } finally {
      setOcupado(false);
    }
  };

  const completo =
    !!motivo.trim() &&
    (esVacaciones
      ? !!desde && !!hasta
      : !!fecha && !!justificacion.trim() && (captura === "dia" || !!horaInicio) && (captura !== "rango" || !!horaFin));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !ocupado && alCerrar()}>
      <div
        className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 text-left shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-base font-bold text-slate-900">Modificar {t?.folio ?? "trámite"}</h3>
          {t && (
            <p className="mt-1 text-sm text-slate-600">
              {detalle?.nombreEmpleado ?? `Empleado ${t.idEmpleado}`} · No. {t.idEmpleado} · {estatusTramite(t.estatus).etiqueta}
            </p>
          )}
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {!detalle && !error && <p className="text-sm text-slate-500">Cargando…</p>}

        {detalle && esVacaciones && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Campo etiqueta="Desde *">
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
            </Campo>
            <Campo etiqueta="Hasta *">
              <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
            </Campo>
            <Campo etiqueta="Regreso">
              <input type="date" value={regreso} min={hasta} onChange={(e) => setRegreso(e.target.value)} className={inputCls} />
            </Campo>
            <p className="text-xs text-slate-500 sm:col-span-3">
              Los días hábiles y el reparto por periodo se recalculan con el saldo del empleado (sin contar los de este
              trámite). Sin fecha de regreso se toma el siguiente día hábil.
            </p>
          </div>
        )}

        {detalle && !esVacaciones && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo etiqueta="Tipo de incidencia *">
                <select value={incidencia} onChange={(e) => setIncidencia(Number(e.target.value))} className={inputCls}>
                  {opciones.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <Campo etiqueta={captura === "dia" ? "Fecha inicial *" : "Fecha *"}>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
            </Campo>
            {captura === "dia" && (
              <Campo etiqueta="Fecha final">
                <input type="date" value={fechaFin} min={fecha} onChange={(e) => setFechaFin(e.target.value)} className={inputCls} />
              </Campo>
            )}
            {captura !== "dia" && (
              <Campo etiqueta={captura === "hora" ? "Hora *" : "Hora inicio *"}>
                <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={inputCls} />
              </Campo>
            )}
            {captura === "rango" && (
              <Campo etiqueta="Hora fin *">
                <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className={inputCls} />
              </Campo>
            )}
            <div className="sm:col-span-2">
              <Campo etiqueta="Justificación *">
                <textarea
                  rows={3}
                  maxLength={500}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  className={inputCls}
                />
              </Campo>
            </div>
          </div>
        )}

        {detalle && (
          <Campo etiqueta="Motivo de la modificación *">
            <textarea rows={2} maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls} />
          </Campo>
        )}

        {!!t?.bitacora?.length && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">Bitácora</p>
            <ul className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {t.bitacora.map((b) => (
                <li key={b.idBitacora}>
                  <span className="font-mono text-slate-500">{fechaHora(b.fechaMovimiento)}</span> · <b>{b.accion}</b> · No.{" "}
                  {b.idEmpleado}
                  {b.comentarios && <span className="block pl-4 text-slate-500">{b.comentarios}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={ocupado}
            onClick={alCerrar}
            className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            Regresar
          </button>
          <button
            type="button"
            disabled={ocupado || !detalle || !completo}
            onClick={guardar}
            className={`${botonCls} border-[#691c32] bg-[#691c32] text-white hover:bg-[#4f1526]`}
          >
            <IoSaveOutline className="h-4 w-4" /> {ocupado ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};
