"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoLockClosedOutline,
  IoSaveOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import type { CatalogosViaticos, Empleado, GuardarViaticoRequest, GuardarViaticoResponse, Viatico } from "@/modules/viaticos/dtos";
import {
  createViatico,
  getCatalogos,
  getEmpleadoById,
  getViatico,
  updateViatico,
} from "@/modules/viaticos/data-access";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { MenuFormatos } from "./MenuFormatos";
import { EstatusBadge } from "./EstatusBadge";
import {
  CIUDADES_ORIGEN,
  clasificarDestino,
  estadoDeCiudad,
  folioViatico,
  formatoMoneda,
  getDias,
  hoyISO,
  importePorDias,
  esNivelAdmin,
  origenPorOficina,
  soloFecha,
} from "@/modules/viaticos/lib/reglas";
import { useEmpleadoActivo } from "@/modules/viaticos/lib/useEmpleadoActivo";
import { useViaticosStore } from "@/modules/viaticos/store/useViaticosStore";
import { useEjercicioStore } from "@/shared/store/useEjercicioStore";
import { toast } from "@/shared/store/useToast";

export interface FolioViatico {
  oficina: number;
  ejercicio: number;
  noviat: number;
}

interface Valores {
  fecha: string;
  fechaSal: string;
  fechaReg: string;
  origenId: number;
  destinoId: number;
  motivo: string;
  inforAct: string;
}

const SIN_LUGAR_TRABAJO =
  "El empleado no cuenta con lugar de trabajo asignado, favor de verificarlo con el área de Recursos Humanos.";

const fechaInicial = (ejercicio: number) => {
  const hoy = hoyISO();
  return hoy.startsWith(`${ejercicio}-`) ? hoy : `${ejercicio}-01-01`;
};

const esquema = (ejercicio: number) =>
  Yup.object({
    fecha: Yup.string()
      .required("* Requerido")
      .test("ejercicio", `* Debe ser del ejercicio ${ejercicio}`, (v) => !!v?.startsWith(`${ejercicio}-`)),
    fechaSal: Yup.string().required("* Requerido"),
    fechaReg: Yup.string()
      .required("* Requerido")
      .test("orden", "* No puede ser anterior a la salida", function (v) {
        return !v || !this.parent.fechaSal || v >= this.parent.fechaSal;
      }),
    destinoId: Yup.number().notOneOf([0], "* Seleccione una opción"),
    motivo: Yup.string().trim().max(300, "* Máximo 300 caracteres").required("* Este campo es requerido"),
    inforAct: Yup.string().trim().max(500, "* Máximo 500 caracteres").required("* Este campo es requerido"),
  });

/**
 * `empleadoId`: captura para ese empleado dentro de Generar Nuevo Trámite (/nuevo, paso 3): el usuario o el compañero
 * a su cargo que eligió en el paso 1. Ahí no se monta el layout de /viaticos: no se espera su store, no se ofrece
 * "Cambiar de empleado" y el título lo pone el paso.
 */
export const CapturaViatico = ({ folio, empleadoId }: { folio?: FolioViatico; empleadoId?: number }) => {
  const esEdicion = !!folio;
  const enTramite = empleadoId !== undefined;
  const router = useRouter();
  const { data: session } = useSession();
  const esAdmin = !enTramite && esNivelAdmin(session?.user?.permisos?.viaticos);
  const { hidratado: viaticosHidratado, setModalEmpleadosAbierto } = useViaticosStore();
  const { ejercicio: ejercicioStore, hidratado: ejercicioHidratado } = useEjercicioStore();
  const hidratado = (enTramite || viaticosHidratado) && ejercicioHidratado;
  const activo = useEmpleadoActivo();
  const empleadoActivo = enTramite ? { id: empleadoId } : activo;

  const [catalogos, setCatalogos] = useState<CatalogosViaticos | null>(null);
  const [viatico, setViatico] = useState<Viatico | null>(null);
  const [empleadoCargado, setEmpleadoCargado] = useState<Empleado | null>(null);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState<GuardarViaticoResponse | null>(null);

  const ejercicio = folio?.ejercicio ?? ejercicioStore;

  useEffect(() => {
    getCatalogos()
      .then(setCatalogos)
      .catch((e: Error) => setError(`No se pudieron cargar los catálogos: ${e.message}`));
  }, []);

  // Edición: el viático trae a su empleado. Captura: el empleado activo.
  const [fEjercicio, fOficina, fNoviat] = [folio?.ejercicio, folio?.oficina, folio?.noviat];
  useEffect(() => {
    if (!fEjercicio || !fOficina || !fNoviat) return;
    getViatico(fEjercicio, fOficina, fNoviat)
      .then(setViatico)
      .catch((e: Error) => setError(e.message));
  }, [fEjercicio, fOficina, fNoviat]);

  const noEmp = esEdicion ? viatico?.noEmp : hidratado ? empleadoActivo.id : undefined;

  useEffect(() => {
    if (!noEmp) return;
    let vigente = true;
    getEmpleadoById(noEmp)
      .then((e) => vigente && setEmpleadoCargado(e))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [noEmp]);
  // Mientras llega el nuevo empleado (p. ej. tras "Cambiar de empleado") no se muestra el anterior.
  const empleado = empleadoCargado && empleadoCargado.empleado === noEmp ? empleadoCargado : null;

  const bloqueado = esEdicion && !!viatico && viatico.estatus > 1;
  const sinLugarTrabajo = !!empleado && !empleado.oficina;

  const initialValues = useMemo<Valores>(() => {
    if (viatico) {
      return {
        fecha: soloFecha(viatico.fecha),
        fechaSal: soloFecha(viatico.fechaSal),
        fechaReg: soloFecha(viatico.fechaReg),
        origenId: viatico.origenId,
        destinoId: viatico.destinoId,
        motivo: viatico.motivo ?? "",
        inforAct: viatico.inforAct ?? "",
      };
    }
    const f = fechaInicial(ejercicio);
    return {
      fecha: f,
      fechaSal: f,
      fechaReg: f,
      origenId: empleado ? origenPorOficina(empleado.oficina, empleado.municipio) : 1,
      destinoId: 0,
      motivo: "",
      inforAct: "",
    };
  }, [viatico, empleado, ejercicio]);

  const formik = useFormik<Valores>({
    initialValues,
    enableReinitialize: true,
    validationSchema: esquema(ejercicio),
    onSubmit: async (values, { resetForm }) => {
      if (!empleado) return;
      if (sinLugarTrabajo) {
        toast.error(SIN_LUGAR_TRABAJO, 8000);
        return;
      }

      const request: GuardarViaticoRequest = {
        ...values,
        origenId: Number(values.origenId),
        destinoId: Number(values.destinoId),
        motivo: values.motivo.trim().toUpperCase(),
        inforAct: values.inforAct.trim().toUpperCase(),
        ejercicio,
        noEmp: empleado.empleado,
        ...(folio ? { oficina: folio.oficina, noViat: folio.noviat } : {}),
      };

      try {
        if (esEdicion) {
          await updateViatico(request);
          toast.success("Viático actualizado correctamente");
          router.push("/viaticos/listado");
        } else {
          const { data } = await createViatico(request);
          setGuardado(data);
          toast.success(`Viático generado con el número ${data.noViat}`, 6000);
          resetForm();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e) {
        toast.error((e as Error).message, 8000);
      }
    },
  });

  const { values, errors, touched, isSubmitting } = formik;
  const dias = getDias(values.fechaSal, values.fechaReg);
  const destinoId = Number(values.destinoId);
  const { partida, descripcion, fueraDelEstado } = clasificarDestino(
    destinoId,
    catalogos ? estadoDeCiudad(destinoId, catalogos.ciudades, catalogos.estados) : null
  );
  const importe = empleado ? importePorDias(dias, empleado.nivel, fueraDelEstado) : 0;
  const oficina = folio?.oficina ?? empleado?.oficina ?? 0;
  const nombreOficina = catalogos?.oficinas.find((o) => o.idOfi === oficina)?.nombre ?? (oficina ? `Oficina ${oficina}` : "—");

  // Destinos agrupados por estado (excepto la ciudad de origen).
  const destinos = useMemo(() => {
    if (!catalogos) return [];
    const nombreEstado = new Map(catalogos.estados.map((e) => [e.idEstado, e.estado]));
    const grupos = new Map<number, { estado: string; ciudades: { id: number; nombre: string }[] }>();
    for (const c of catalogos.ciudades) {
      if (c.idCiudad === Number(values.origenId)) continue;
      const g = grupos.get(c.idEstado) ?? { estado: nombreEstado.get(c.idEstado) ?? `Estado ${c.idEstado}`, ciudades: [] };
      g.ciudades.push({ id: c.idCiudad, nombre: c.ciudad });
      grupos.set(c.idEstado, g);
    }
    return [...grupos.values()];
  }, [catalogos, values.origenId]);

  const cargando = !catalogos || !empleado || (esEdicion && !viatico);

  if (error && cargando) {
    return <Aviso tipo="error">{error}</Aviso>;
  }
  if (cargando) return <LoadingSpinner />;

  const deshabilitado = isSubmitting || bloqueado;
  const finDeAnio = `${ejercicio}-12-31`;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {!enTramite && (
        <div>
          <h1 className="text-xl font-bold text-slate-900">{esEdicion ? "Modificar viático" : "Capturar viático"}</h1>
          <p className="text-sm text-slate-600">
            Ejercicio <strong>{ejercicio}</strong>
            {folio && (
              <>
                {" "}
                · Folio <strong className="font-mono">{folioViatico(folio.oficina, folio.noviat, folio.ejercicio)}</strong>
              </>
            )}
          </p>
        </div>
      )}

      {guardado && (
        <Aviso tipo="exito">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Viático generado con el número <strong>{guardado.noViat}</strong> (
              <span className="font-mono">{folioViatico(guardado.oficina, guardado.noViat, guardado.ejercicio)}</span>) por{" "}
              {formatoMoneda(guardado.importe)}.
            </span>
            <MenuFormatos ejercicio={guardado.ejercicio} oficina={guardado.oficina} noViat={guardado.noViat} />
          </div>
        </Aviso>
      )}

      {bloqueado && viatico && (
        <Aviso tipo="info">
          <span className="flex flex-wrap items-center gap-2">
            <IoLockClosedOutline className="h-4 w-4" /> Este viático está en estatus <EstatusBadge estatus={viatico.estatus} /> y ya no
            se puede modificar.
          </span>
        </Aviso>
      )}

      {sinLugarTrabajo && <Aviso tipo="error">{SIN_LUGAR_TRABAJO}</Aviso>}

      {/* Empleado */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="shrink-0 rounded-lg bg-primary-950 px-4 py-2 text-center text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Empleado</p>
          <p className="font-mono text-xl font-bold">{empleado.empleado}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words font-bold text-slate-900">{empleado.nombreCompleto}</p>
          <p className="break-words text-sm text-slate-600">{empleado.descripcionDepto}</p>
          <p className="break-words text-sm text-slate-500">{empleado.descripcionPuesto}</p>
        </div>
        {esAdmin && !esEdicion && (
          <button
            type="button"
            onClick={() => setModalEmpleadosAbierto(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-primary-200 px-3 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50"
          >
            <IoSwapHorizontalOutline className="h-4 w-4" /> Cambiar de empleado
          </button>
        )}
      </section>

      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Solo label="Oficina" valor={nombreOficina} />
            <Solo label="Ejercicio" valor={String(ejercicio)} />
            <Solo label="No. viático" valor={folio ? String(folio.noviat) : "Se asigna al guardar"} />
            <Campo label="Fecha" error={touched.fecha && errors.fecha}>
              <input
                type="date"
                {...formik.getFieldProps("fecha")}
                min={`${ejercicio}-01-01`}
                max={finDeAnio}
                disabled={deshabilitado}
                className={inputCls(touched.fecha && errors.fecha)}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_6rem_1fr]">
            <Campo label="Fecha de salida" error={touched.fechaSal && errors.fechaSal}>
              <input
                type="date"
                name="fechaSal"
                value={values.fechaSal}
                max={finDeAnio}
                disabled={deshabilitado}
                onBlur={formik.handleBlur}
                onChange={(e) => {
                  const salida = e.target.value;
                  formik.setFieldValue("fechaSal", salida);
                  if (!values.fechaReg || values.fechaReg < salida) formik.setFieldValue("fechaReg", salida);
                }}
                className={inputCls(touched.fechaSal && errors.fechaSal)}
              />
            </Campo>
            <Campo label="Fecha de regreso" error={touched.fechaReg && errors.fechaReg}>
              <input
                type="date"
                {...formik.getFieldProps("fechaReg")}
                min={values.fechaSal}
                max={finDeAnio}
                disabled={deshabilitado}
                className={inputCls(touched.fechaReg && errors.fechaReg)}
              />
            </Campo>
            <Solo label="Días" valor={String(dias)} />
            <Campo label="Ciudad de origen">
              <select
                {...formik.getFieldProps("origenId")}
                disabled={deshabilitado}
                onChange={(e) => {
                  const origen = Number(e.target.value);
                  formik.setFieldValue("origenId", origen);
                  if (Number(values.destinoId) === origen) formik.setFieldValue("destinoId", 0);
                }}
                className={inputCls()}
              >
                {CIUDADES_ORIGEN.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Ciudad de destino" error={touched.destinoId && errors.destinoId}>
            <select
              name="destinoId"
              value={values.destinoId}
              onBlur={formik.handleBlur}
              onChange={(e) => formik.setFieldValue("destinoId", Number(e.target.value))}
              disabled={deshabilitado}
              className={inputCls(touched.destinoId && errors.destinoId)}
            >
              <option value={0}>Seleccionar…</option>
              {destinos.map((g) => (
                <optgroup key={g.estado} label={g.estado}>
                  {g.ciudades.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Campo>

          <Campo
            label="Título de la comisión"
            error={touched.motivo && errors.motivo}
            contador={`${values.motivo.length}/300`}
          >
            <textarea
              {...formik.getFieldProps("motivo")}
              rows={2}
              maxLength={300}
              disabled={deshabilitado}
              className={`${inputCls(touched.motivo && errors.motivo)} uppercase`}
            />
          </Campo>

          <Campo
            label="Actividades"
            error={touched.inforAct && errors.inforAct}
            contador={`${values.inforAct.length}/500`}
          >
            <textarea
              {...formik.getFieldProps("inforAct")}
              rows={4}
              maxLength={500}
              disabled={deshabilitado}
              className={`${inputCls(touched.inforAct && errors.inforAct)} uppercase`}
            />
          </Campo>
        </section>

        {/* Partida */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 text-left">Partida</th>
                  <th className="px-4 py-2.5 text-left">Descripción</th>
                  <th className="px-4 py-2.5 text-right">Importe</th>
                  <th className="px-4 py-2.5 text-center">Ofi</th>
                  <th className="px-4 py-2.5 text-center">Año</th>
                  <th className="px-4 py-2.5 text-center">Viat</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-mono">{partida}</td>
                  <td className="whitespace-nowrap px-4 py-3">{descripcion}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-base font-bold text-primary-900">{formatoMoneda(importe)}</td>
                  <td className="px-4 py-3 text-center">{oficina}</td>
                  <td className="px-4 py-3 text-center">{ejercicio}</td>
                  <td className="px-4 py-3 text-center">{folio?.noviat ?? "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            {dias} día(s) · nivel {empleado.nivel} · {fueraDelEstado ? "fuera del estado" : "dentro del estado"}. El importe
            definitivo lo calcula el servidor al guardar.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 pb-6">
          {!bloqueado && (
            <button
              type="submit"
              disabled={isSubmitting || sinLugarTrabajo}
              className="inline-flex items-center gap-2 rounded-md bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IoSaveOutline className="h-4 w-4" />
              {isSubmitting ? "Procesando…" : esEdicion ? "Guardar cambios" : "Guardar"}
            </button>
          )}
          {esEdicion ? (
            <Link
              href="/viaticos/listado"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {bloqueado ? "Regresar" : "Cancelar"}
            </Link>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                formik.resetForm();
                setGuardado(null);
              }}
              className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const inputCls = (error?: string | false) =>
  `block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20 disabled:bg-slate-100 disabled:text-slate-500 ${
    error ? "border-red-500" : "border-slate-300"
  }`;

const Campo = ({
  label,
  error,
  contador,
  children,
}: {
  label: string;
  error?: string | false;
  contador?: string;
  children: React.ReactNode;
}) => (
  <label className="block min-w-0">
    <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600">
      {label}
      {contador && <span className="font-normal normal-case text-slate-400">{contador}</span>}
    </span>
    {children}
    {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
  </label>
);

const Solo = ({ label, valor }: { label: string; valor: string }) => (
  <div className="min-w-0">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
    <span className="block truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{valor}</span>
  </div>
);

const Aviso = ({ tipo, children }: { tipo: "error" | "exito" | "info"; children: React.ReactNode }) => {
  const estilos = {
    error: "border-red-200 bg-red-50 text-red-800",
    exito: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tipo];
  const Icono = tipo === "exito" ? IoCheckmarkCircleOutline : IoAlertCircleOutline;
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${estilos}`}>
      <Icono className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};
