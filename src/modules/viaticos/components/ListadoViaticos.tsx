"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IoAddOutline, IoCreateOutline, IoRefreshOutline, IoSearchOutline } from "react-icons/io5";
import type { ViaticoListado } from "@/modules/viaticos/dtos";
import { getViaticosByEmpleado } from "@/modules/viaticos/data-access";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { EstatusBadge } from "./EstatusBadge";
import { MenuFormatos } from "./MenuFormatos";
import { ESTATUS_CANCELADO, folioViatico, formatoFecha } from "@/modules/viaticos/lib/reglas";
import { useEmpleadoActivo } from "@/modules/viaticos/lib/useEmpleadoActivo";
import { useViaticosStore } from "@/modules/viaticos/store/useViaticosStore";
import { useEjercicioStore } from "@/shared/store/useEjercicioStore";

const POR_PAGINA = [10, 25, 50];

const puedeEditar = (v: ViaticoListado) => Number(v.estatus) <= 1;
const cancelado = (v: ViaticoListado) => Number(v.estatus) === ESTATUS_CANCELADO;
const urlEditar = (v: ViaticoListado) => `/viaticos/capturar/${v.oficina}/${v.ejercicio}/${v.viatico}`;

export const ListadoViaticos = () => {
  const ejercicio = useEjercicioStore((s) => s.ejercicio);
  // Esperar a que ejercicio (global) y empleado activo (módulo) se lean de sessionStorage.
  const ejercicioHidratado = useEjercicioStore((s) => s.hidratado);
  const viaticosHidratado = useViaticosStore((s) => s.hidratado);
  const hidratado = ejercicioHidratado && viaticosHidratado;
  const empleado = useEmpleadoActivo();
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [recarga, setRecarga] = useState(0);

  // Resultado etiquetado con la consulta que lo produjo: si la clave cambió, se muestra "cargando".
  const clave = `${ejercicio}-${empleado.id}-${recarga}`;
  const [resultado, setResultado] = useState<{ clave: string; viaticos: ViaticoListado[]; error: string } | null>(null);
  const viaticos = resultado?.clave === clave ? resultado.viaticos : null;
  const error = resultado?.clave === clave ? resultado.error : "";

  useEffect(() => {
    if (!hidratado || !empleado.id) return;
    let vigente = true;
    getViaticosByEmpleado(ejercicio, empleado.id)
      .then((data) => {
        if (vigente) setResultado({ clave, viaticos: [...(data ?? [])].sort((a, b) => b.viatico - a.viatico), error: "" });
      })
      .catch((e: Error) => {
        if (vigente) setResultado({ clave, viaticos: [], error: e.message });
      });
    return () => {
      vigente = false;
    };
  }, [hidratado, ejercicio, empleado.id, clave]);

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return viaticos ?? [];
    return (viaticos ?? []).filter((v) =>
      [v.viatico, v.origen, v.destino, v.motivo, formatoFecha(v.fecha)].some((c) => String(c).toLowerCase().includes(q))
    );
  }, [viaticos, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Listado de viáticos</h1>
          <p className="break-words text-sm text-slate-600">
            Ejercicio <strong>{ejercicio}</strong> · Empleado <strong>{empleado.id}</strong> {empleado.nombre}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRecarga((n) => n + 1)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <IoRefreshOutline className="h-4 w-4" /> Actualizar
          </button>
          <Link
            href="/viaticos/capturar"
            className="inline-flex items-center gap-2 rounded-md bg-primary-900 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-800"
          >
            <IoAddOutline className="h-4 w-4" /> Nuevo viático
          </Link>
        </div>
      </div>

      <div className="relative max-w-md">
        <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar por número, destino, motivo…"
          className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
        />
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {!viaticos ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          {viaticos.length === 0 ? "No hay viáticos capturados en este ejercicio." : "Ningún viático coincide con la búsqueda."}
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="space-y-3 md:hidden">
            {visibles.map((v) => (
              <article key={`${v.oficina}-${v.viatico}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-primary-900">{folioViatico(v.oficina, v.viatico, v.ejercicio)}</p>
                    <p className="text-xs text-slate-500">
                      {formatoFecha(v.fecha)} · {v.origen} → {v.destino}
                    </p>
                  </div>
                  <EstatusBadge estatus={v.estatus} />
                </div>
                <p className="mt-2 break-words text-sm text-slate-800">{v.motivo}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Salida {formatoFecha(v.salida)} · Regreso {formatoFecha(v.regreso)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <MenuFormatos ejercicio={v.ejercicio} oficina={v.oficina} noViat={v.viatico} disabled={cancelado(v)} />
                  <BotonEditar v={v} />
                </div>
              </article>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Origen / Destino</th>
                    <th className="px-4 py-3">Motivo</th>
                    <th className="px-4 py-3">Salida</th>
                    <th className="px-4 py-3">Regreso</th>
                    <th className="px-4 py-3">Estatus</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibles.map((v) => (
                    <tr key={`${v.oficina}-${v.viatico}`} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-primary-900">{v.viatico}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatoFecha(v.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className="block text-slate-500">{v.origen}</span>
                        <span className="block font-medium text-slate-800">{v.destino}</span>
                      </td>
                      <td className="max-w-md break-words px-4 py-3 text-slate-700">{v.motivo}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatoFecha(v.salida)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatoFecha(v.regreso)}</td>
                      <td className="px-4 py-3">
                        <EstatusBadge estatus={v.estatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <MenuFormatos ejercicio={v.ejercicio} oficina={v.oficina} noViat={v.viatico} disabled={cancelado(v)} />
                          <BotonEditar v={v} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación compartida */}
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
            <label className="flex items-center gap-2">
              Registros por página
              <select
                value={porPagina}
                onChange={(e) => {
                  setPorPagina(Number(e.target.value));
                  setPagina(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              >
                {POR_PAGINA.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <span>
                {(paginaActual - 1) * porPagina + 1}–{Math.min(paginaActual * porPagina, filtrados.length)} de {filtrados.length}
              </span>
              <button
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** También lo usa la Bandeja de Trámites (viaticos/expediente.tsx). */
export const BotonEditar = ({ v }: { v: ViaticoListado }) =>
  puedeEditar(v) ? (
    <Link
      href={urlEditar(v)}
      prefetch={false}
      title="Modificar viático"
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <IoCreateOutline className="h-4 w-4" /> Editar
    </Link>
  ) : (
    <span
      title="El viático ya fue procesado y no se puede modificar"
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-400"
    >
      <IoCreateOutline className="h-4 w-4" /> Editar
    </span>
  );
