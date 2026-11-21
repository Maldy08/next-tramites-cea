"use client";

import { useState } from "react";
import { IoBanOutline, IoCreateOutline, IoPaperPlaneOutline } from "react-icons/io5";
import { ModificarTramite } from "@/shared/components/ModificarTramite";
import { getDetalleTramite, modificarTramite } from "@/shared/edicion";
import { toast } from "@/shared/store/useToast";
import { EDITABLES_EMPLEADO, ESTATUS_TRAMITE } from "@/shared/tramites";
import { accionSolicitud } from "@/modules/vacaciones/data-access";

// Mismas reglas que el backend (EnviarTramiteCommand / CancelarTramiteCommand).
const PUEDE_ENVIAR: number[] = [ESTATUS_TRAMITE.creado, ESTATUS_TRAMITE.regresado];
const PUEDE_CANCELAR: number[] = [ESTATUS_TRAMITE.creado, ESTATUS_TRAMITE.revisionJefe, ESTATUS_TRAMITE.regresado];

const botonCls =
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50";

/**
 * Acciones de una solicitud de vacaciones (Bandeja y pantalla de éxito de la captura): "Editar" (1/98), "Enviar a firma" (1/98 → 2)
 * y "Cancelar" (1/2/98 → 99, pide motivo). `alCambiar` recibe el estatus nuevo.
 */
export const AccionesSolicitud = ({
  idTramite,
  folio,
  estatus,
  alCambiar,
  soloEnviar = false,
}: {
  idTramite: number;
  folio: string;
  estatus: number;
  alCambiar: (estatus: number) => void;
  soloEnviar?: boolean;
}) => {
  const [ocupado, setOcupado] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [motivo, setMotivo] = useState("");

  const ejecutar = async (accion: "enviar" | "cancelar") => {
    setOcupado(true);
    try {
      const nuevo = await accionSolicitud(idTramite, { accion, comentarios: accion === "cancelar" ? motivo.trim() : null });
      toast.success(
        accion === "cancelar"
          ? `${folio} cancelado`
          : nuevo === ESTATUS_TRAMITE.revisionRh
            ? `${folio} enviado a Recursos Humanos`
            : nuevo === ESTATUS_TRAMITE.revisionDirector
              ? `${folio} enviado a firma del director`
              : `${folio} enviado a firma del jefe`
      );
      setCancelando(false);
      alCambiar(nuevo);
    } catch (e) {
      toast.error((e as Error).message, 8000);
    } finally {
      setOcupado(false);
    }
  };

  const enviar = PUEDE_ENVIAR.includes(estatus);
  const cancelar = !soloEnviar && PUEDE_CANCELAR.includes(estatus);
  // Editar: antes de enviarlo a firma o si se lo regresaron (mismo candado en el backend).
  const editar = !soloEnviar && EDITABLES_EMPLEADO.includes(estatus);
  if (!enviar && !cancelar && !editar) return null;

  return (
    <>
      {editar && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => setEditando(true)}
          title="Modificar fechas o datos del trámite"
          className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
        >
          <IoCreateOutline className="h-4 w-4" /> Editar
        </button>
      )}
      {enviar && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => ejecutar("enviar")}
          title="Enviar al jefe para su autorización"
          className={`${botonCls} border-[#691c32] bg-[#691c32] text-white hover:bg-[#4f1526]`}
        >
          <IoPaperPlaneOutline className="h-4 w-4" /> {ocupado && !cancelando ? "Enviando…" : "Enviar a firma"}
        </button>
      )}
      {cancelar && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setMotivo("");
            setCancelando(true);
          }}
          title="Cancelar el trámite"
          className={`${botonCls} border-red-300 bg-white text-red-700 hover:bg-red-50`}
        >
          <IoBanOutline className="h-4 w-4" /> Cancelar
        </button>
      )}

      {editando && (
        <ModificarTramite
          idTramite={idTramite}
          cargar={getDetalleTramite}
          guardar={modificarTramite}
          motivoObligatorio={false}
          alCerrar={() => setEditando(false)}
          alGuardar={() => {
            setEditando(false);
            alCambiar(estatus);
          }}
        />
      )}

      {cancelando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => !ocupado && setCancelando(false)}
        >
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cancelar {folio}</h3>
              <p className="mt-1 text-sm text-slate-600">Los días solicitados regresan al saldo. Esta acción no se puede deshacer.</p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Motivo *</span>
              <textarea
                autoFocus
                rows={3}
                maxLength={1000}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setCancelando(false)}
                className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
              >
                Regresar
              </button>
              <button
                type="button"
                disabled={ocupado || !motivo.trim()}
                onClick={() => ejecutar("cancelar")}
                className={`${botonCls} border-red-700 bg-red-700 text-white hover:bg-red-800`}
              >
                <IoBanOutline className="h-4 w-4" /> {ocupado ? "Cancelando…" : "Cancelar trámite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
