"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  IoAirplaneOutline,
  IoArrowForwardOutline,
  IoBanOutline,
  IoCheckmarkDoneOutline,
  IoCreateOutline,
  IoDocumentsOutline,
} from "react-icons/io5";
import type { ViaticoListado } from "@/modules/viaticos/dtos";
import { getViaticosByEmpleado } from "@/modules/viaticos/data-access";
import { ESTATUS_CANCELADO, folioViatico, formatoFecha } from "@/modules/viaticos/lib/reglas";
import { Skeleton } from "@/shared/components/Skeletons";
import { useEjercicioStore } from "@/shared/store/useEjercicioStore";
import { EstatusBadge } from "./EstatusBadge";
import { MenuFormatos } from "./MenuFormatos";

const ULTIMOS = 3;

/** Conteos por estatus: 1 = Creado; 2, 3 y 4 = pagado o en contabilidad; 9 = Cancelado. */
const contar = (lista: ViaticoListado[]) => {
  const estatus = lista.map((v) => Number(v.estatus));
  return {
    total: lista.length,
    creados: estatus.filter((e) => e === 1).length,
    procesados: estatus.filter((e) => e >= 2 && e <= 4).length,
    cancelados: estatus.filter((e) => e === ESTATUS_CANCELADO).length,
  };
};

const Indicador = ({
  icono,
  etiqueta,
  valor,
  nota,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: number;
  nota: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{etiqueta}</span>
      <span className="text-base text-slate-400">{icono}</span>
    </div>
    <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{valor}</p>
    <p className="text-[11px] text-slate-500">{nota}</p>
  </div>
);

/** Tarjeta del portal: viáticos propios del ejercicio activo. Usa el mismo endpoint que el listado. */
export const ResumenViaticos = () => {
  const { data: session } = useSession();
  const { ejercicio, hidratado } = useEjercicioStore();
  const empleado = session?.user?.idUsuario;

  const clave = `${ejercicio}-${empleado}`;
  const [resultado, setResultado] = useState<{ clave: string; lista: ViaticoListado[]; error: string } | null>(null);
  const lista = resultado?.clave === clave ? resultado.lista : null;
  const error = resultado?.clave === clave ? resultado.error : "";

  useEffect(() => {
    if (!hidratado || !empleado) return;
    let vigente = true;
    getViaticosByEmpleado(ejercicio, empleado)
      .then((data) => vigente && setResultado({ clave, lista: data ?? [], error: "" }))
      .catch((e: Error) => vigente && setResultado({ clave, lista: [], error: e.message }));
    return () => {
      vigente = false;
    };
  }, [hidratado, ejercicio, empleado, clave]);

  const conteo = lista ? contar(lista) : null;
  const ultimos = lista ? [...lista].sort((a, b) => b.viatico - a.viatico).slice(0, ULTIMOS) : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-xl bg-primary-50 p-2.5 text-xl text-primary-800">
            <IoAirplaneOutline />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900">Mis viáticos</h3>
            <p className="text-xs text-slate-500">Ejercicio {ejercicio}</p>
          </div>
        </div>
        <Link
          href="/viaticos/listado"
          prefetch={false}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-primary-800 hover:text-primary-900"
        >
          Ver todos <IoArrowForwardOutline />
        </Link>
      </div>

      <div className="space-y-5 p-5">
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {conteo ? (
            <>
              <Indicador icono={<IoDocumentsOutline />} etiqueta="Total" valor={conteo.total} nota="en el ejercicio" />
              <Indicador icono={<IoCreateOutline />} etiqueta="Creados" valor={conteo.creados} nota="aún se pueden editar" />
              <Indicador
                icono={<IoCheckmarkDoneOutline />}
                etiqueta="Procesados"
                valor={conteo.procesados}
                nota="pagados o en contabilidad"
              />
              <Indicador icono={<IoBanOutline />} etiqueta="Cancelados" valor={conteo.cancelados} nota="sin formatos" />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)
          )}
        </div>

        <div>
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Últimos viáticos</h4>
          {!lista ? (
            <div className="space-y-2">
              {Array.from({ length: ULTIMOS }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : ultimos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              Aún no tienes viáticos en {ejercicio}.
              <Link
                href="/viaticos/capturar"
                className="inline-flex items-center gap-2 rounded-md bg-primary-900 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-800"
              >
                <IoCreateOutline className="h-4 w-4" /> Capturar viático
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {ultimos.map((v) => (
                <li key={`${v.oficina}-${v.viatico}`} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary-900">
                        {folioViatico(v.oficina, v.viatico, v.ejercicio)}
                      </span>
                      <EstatusBadge estatus={v.estatus} />
                    </p>
                    <p className="truncate text-xs text-slate-600" title={v.motivo}>
                      {v.destino} · {formatoFecha(v.salida)} – {formatoFecha(v.regreso)} · {v.motivo}
                    </p>
                  </div>
                  <div className="self-start sm:self-auto">
                    <MenuFormatos
                      ejercicio={v.ejercicio}
                      oficina={v.oficina}
                      noViat={v.viatico}
                      disabled={Number(v.estatus) === ESTATUS_CANCELADO}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
