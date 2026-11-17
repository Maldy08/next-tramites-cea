"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  IoAddOutline,
  IoChevronBack,
  IoChevronForward,
  IoCloseOutline,
  IoDownloadOutline,
  IoLayersOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { EXPEDIENTES } from "@/modules/expedientes";
import { Icono } from "@/shared/components/Iconos";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { COLORES_MODULO } from "@/shared/components/coloresModulo";
import type { FilaExpediente, TonoEstatus } from "@/shared/expedientes";
import type { ColorModulo, IconoModulo } from "@/shared/modulos";
import { useEjercicioStore } from "@/shared/store/useEjercicioStore";

export interface TipoBandeja {
  id: string;
  nombre: string;
  icono: IconoModulo;
  color: ColorModulo;
}

type Fila = FilaExpediente & { tipoId: string; tipo: string };
type Columna = "folio" | "fecha" | "titulo" | "beneficiario" | "estatus";

const TODOS = "todos";
const POR_PAGINA = [5, 10, 25];

const TONOS: Record<TonoEstatus, string> = {
  info: "bg-sky-100 text-sky-800",
  alerta: "bg-amber-100 text-amber-900",
  violeta: "bg-violet-100 text-violet-900",
  exito: "bg-emerald-100 text-emerald-800",
  peligro: "bg-rose-100 text-rose-900",
  neutro: "bg-slate-100 text-slate-700",
};

const valorOrden = (f: Fila, c: Columna) =>
  c === "beneficiario" ? f.beneficiario.nombre : c === "estatus" ? f.estatus.etiqueta : f[c];

/** "2026-03-04" → "04/03/2026". */
const ddmmaaaa = (f: string) => (f ? f.split("-").reverse().join("/") : "");

const csv = (filas: Fila[]) => {
  const celda = (v: string | number | undefined) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const encabezado = ["Folio", "Fecha", "Tipo", "Trámite", "Detalle", "Beneficiario", "No. Empleado", "Estatus"];
  const renglones = filas.map((f) =>
    [f.folio, ddmmaaaa(f.fecha), f.tipo, f.titulo, f.detalle, f.beneficiario.nombre, f.beneficiario.numero, f.estatus.etiqueta]
      .map(celda)
      .join(",")
  );
  // BOM para que Excel abra bien los acentos.
  return "﻿" + [encabezado.map(celda).join(","), ...renglones].join("\r\n");
};

/** Bandeja de Trámites y Seguimiento (mockup): los trámites propios de todos los módulos en una sola tabla. */
export const BandejaTramites = ({ tipos }: { tipos: TipoBandeja[] }) => {
  const { data: session } = useSession();
  const { ejercicio, hidratado } = useEjercicioStore();
  const empleadoId = session?.user?.idUsuario;
  const empleadoNombre = session?.user?.nombrecompleto ?? "";

  const [tab, setTab] = useState(TODOS);
  const [busqueda, setBusqueda] = useState("");
  const [estatus, setEstatus] = useState("");
  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState<{ columna: Columna; asc: boolean }>({ columna: "fecha", asc: false });

  // Resultado etiquetado con la consulta que lo produjo: si la clave cambió, se muestra "cargando".
  const clave = `${ejercicio}-${empleadoId}`;
  // Sube cuando una acción de fila cambia un trámite: vuelve a cargar sin vaciar la tabla (la clave no cambia).
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState<{ clave: string; filas: Fila[]; errores: string[] } | null>(null);
  const filas = resultado?.clave === clave ? resultado.filas : null;
  const errores = resultado?.clave === clave ? resultado.errores : [];

  useEffect(() => {
    if (!hidratado || !empleadoId) return;
    let vigente = true;
    Promise.allSettled(
      tipos.map((t) =>
        EXPEDIENTES[t.id]
          .cargar(ejercicio, { id: empleadoId, nombre: empleadoNombre }, () => setVersion((v) => v + 1))
          .then((lista) => lista.map((f) => ({ ...f, tipoId: t.id, tipo: t.nombre })))
      )
    ).then((res) => {
      if (!vigente) return;
      setResultado({
        clave,
        filas: res.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
        errores: res.flatMap((r, i) => (r.status === "rejected" ? [`${tipos[i].nombre}: ${(r.reason as Error).message}`] : [])),
      });
    });
    return () => {
      vigente = false;
    };
  }, [hidratado, ejercicio, empleadoId, empleadoNombre, tipos, clave, version]);

  const conteo = useMemo(() => {
    const c: Record<string, number> = { [TODOS]: filas?.length ?? 0 };
    for (const f of filas ?? []) c[f.tipoId] = (c[f.tipoId] ?? 0) + 1;
    return c;
  }, [filas]);

  const delTab = useMemo(() => (filas ?? []).filter((f) => tab === TODOS || f.tipoId === tab), [filas, tab]);
  const opcionesEstatus = useMemo(() => [...new Set(delTab.map((f) => f.estatus.etiqueta))].sort(), [delTab]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = delTab.filter(
      (f) =>
        (!estatus || f.estatus.etiqueta === estatus) &&
        (!q || [f.folio, f.titulo, f.detalle, f.beneficiario.nombre, f.beneficiario.numero].some((v) => String(v ?? "").toLowerCase().includes(q)))
    );
    const dir = orden.asc ? 1 : -1;
    return [...lista].sort((a, b) => String(valorOrden(a, orden.columna)).localeCompare(String(valorOrden(b, orden.columna)), "es", { numeric: true }) * dir);
  }, [delTab, busqueda, estatus, orden]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = filtradas.slice(inicio, inicio + porPagina);
  // Hasta 5 números de página alrededor de la actual.
  const primera = Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4));
  const paginas = Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => primera + i);

  const cambiarTab = (id: string) => {
    setTab(id);
    setEstatus("");
    setPagina(1);
  };
  const ordenarPor = (columna: Columna) => setOrden((o) => ({ columna, asc: o.columna === columna ? !o.asc : true }));

  const exportar = () => {
    const url = URL.createObjectURL(new Blob([csv(filtradas)], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tramites_CEA_${ejercicio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const encabezado = (columna: Columna, texto: string) => (
    <Encabezado columna={columna} orden={orden} onOrdenar={ordenarPor}>
      {texto}
    </Encabezado>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-0.5 text-xs font-bold uppercase text-primary-900">
              Ejercicio: <span className="font-mono">{ejercicio}</span>
            </span>
            <span className="text-xs text-slate-400">Expedientes Digitales CEA</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Bandeja de Trámites y Seguimiento</h1>
          <p className="text-xs text-slate-500">Historial completo con filtros por tipo de trámite, búsqueda en vivo y exportación a Excel.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={exportar}
            disabled={!filtradas.length}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-40"
          >
            <IoDownloadOutline className="text-emerald-200" /> Exportar a Excel
          </button>
          <Link
            href="/nuevo"
            prefetch={false}
            className="flex items-center gap-1.5 rounded-xl bg-primary-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-950"
          >
            <IoAddOutline /> Nuevo Trámite
          </Link>
        </div>
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Pestañas por tipo de trámite */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <PestanaTipo activa={tab === TODOS} onClick={() => cambiarTab(TODOS)} icono={<IoLayersOutline />} etiqueta="Todos los Trámites" cuenta={conteo[TODOS]} />
            {tipos.map((t) => (
              <PestanaTipo
                key={t.id}
                activa={tab === t.id}
                onClick={() => cambiarTab(t.id)}
                icono={<Icono nombre={t.icono} className={tab === t.id ? "" : COLORES_MODULO[t.color].catalogo.texto} />}
                etiqueta={t.nombre}
                cuenta={conteo[t.id] ?? 0}
              />
            ))}
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-6">
            <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por Folio, Empleado, Asunto o No. de Viático..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-900"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setBusqueda("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <IoCloseOutline />
              </button>
            )}
          </div>
          <select
            value={estatus}
            onChange={(e) => {
              setEstatus(e.target.value);
              setPagina(1);
            }}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 sm:col-span-3"
          >
            <option value="">Todos los estatus</option>
            {opcionesEstatus.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <label className="flex items-center justify-end gap-2 text-xs text-slate-500 sm:col-span-3">
            Mostrar:
            <select
              value={porPagina}
              onChange={(e) => {
                setPorPagina(Number(e.target.value));
                setPagina(1);
              }}
              className="rounded-xl border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700"
            >
              {POR_PAGINA.map((n) => (
                <option key={n} value={n}>
                  {n} filas
                </option>
              ))}
            </select>
          </label>
        </div>

        {errores.map((e) => (
          <p key={e} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {e}
          </p>
        ))}

        {/* Tabla */}
        {!filas ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  {encabezado("folio", "Folio Oficial")}
                  {encabezado("fecha", "Fecha Trámite")}
                  {encabezado("titulo", "Trámite & Detalle")}
                  {encabezado("beneficiario", "Beneficiario")}
                  {encabezado("estatus", "Estatus")}
                  <th className="px-4 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Sin trámites registrados con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  visibles.map((f) => (
                    <tr key={`${f.tipoId}-${f.clave}`} className="align-top transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono font-black text-slate-900">{f.folio}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-500">{ddmmaaaa(f.fecha)}</td>
                      <td className="min-w-64 max-w-md px-4 py-3.5">
                        {tab === TODOS && (
                          <span className="mb-0.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{f.tipo}</span>
                        )}
                        <span className="block break-words font-bold text-slate-900">{f.titulo}</span>
                        {f.detalle && <span className="block text-[11px] font-semibold text-primary-900">{f.detalle}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block font-bold text-slate-900">{f.beneficiario.nombre}</span>
                        {f.beneficiario.numero !== undefined && (
                          <span className="block font-mono text-[10px] text-slate-400">No. {f.beneficiario.numero}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold ${TONOS[f.estatus.tono]}`}>
                          {f.estatus.etiqueta}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-center gap-2">{f.acciones}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {filas && (
          <div className="flex flex-col justify-between gap-3 pt-2 text-xs text-slate-500 sm:flex-row sm:items-center">
            <span>
              {filtradas.length === 0
                ? `Sin trámites (${ejercicio})`
                : `Mostrando ${inicio + 1} a ${inicio + visibles.length} de ${filtradas.length} trámites (${ejercicio})`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="rounded-lg border px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                <IoChevronBack />
              </button>
              {paginas.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPagina(p)}
                  className={`rounded-lg px-3 py-1 font-bold ${p === paginaActual ? "bg-primary-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="rounded-lg border px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                <IoChevronForward />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Encabezado = ({
  columna,
  orden,
  onOrdenar,
  children,
}: {
  columna: Columna;
  orden: { columna: Columna; asc: boolean };
  onOrdenar: (c: Columna) => void;
  children: React.ReactNode;
}) => {
  const activa = orden.columna === columna;
  return (
    <th
      onClick={() => onOrdenar(columna)}
      aria-sort={activa ? (orden.asc ? "ascending" : "descending") : undefined}
      className="cursor-pointer select-none px-4 py-3.5 transition-colors hover:bg-slate-100"
    >
      <span className="flex items-center gap-1.5">
        {children}
        <span className={`font-mono text-[10px] ${activa ? "text-primary-900" : "text-slate-400"}`}>
          {activa ? (orden.asc ? "▲" : "▼") : "▲▼"}
        </span>
      </span>
    </th>
  );
};

const PestanaTipo = ({
  activa,
  onClick,
  icono,
  etiqueta,
  cuenta,
}: {
  activa: boolean;
  onClick: () => void;
  icono: React.ReactNode;
  etiqueta: string;
  cuenta: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={activa}
    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 ${activa ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
  >
    {icono}
    <span>{etiqueta}</span>
    <span className={`rounded-full px-1.5 font-mono text-[10px] ${activa ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
      {cuenta}
    </span>
  </button>
);
