"use client";

import { useEffect, useMemo, useState } from "react";
import { IoChevronBack, IoChevronForward, IoSaveOutline, IoSearchOutline, IoTrashOutline, IoWalletOutline } from "react-icons/io5";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { toast } from "@/shared/store/useToast";
import { estatusTramite } from "@/shared/tramites";
import { borrarRegistroVacaciones, getRegistrosVacaciones, getSaldos, guardarSaldoInicial } from "@/modules/rh/data-access";
import type { RegistroVacacionesRh, SaldoVacacionesRh } from "@/modules/rh/dtos";

const POR_PAGINA = 15;

const botonCls =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50";
const campoCls =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#691c32] focus:ring-2 focus:ring-[#691c32]/20";
const etiquetaCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600";

const ddmmaaaa = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const dias = (n: number | null) => (n == null ? "" : `${Number(n).toLocaleString("es-MX")} ${n === 1 ? "día" : "días"}`);

type Filtro = "sin" | "rh" | "tramite" | "todos";

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: "sin", nombre: "Sin saldo capturado" },
  { id: "rh", nombre: "Capturado por RH" },
  { id: "tramite", nombre: "Desde un trámite" },
  { id: "todos", nombre: "Todos los activos" },
];

const coincideFiltro = (s: SaldoVacacionesRh, f: Filtro) =>
  f === "todos" || (f === "sin" ? s.ultimoOrigen == null : f === "rh" ? s.ultimoOrigen === "R" : s.ultimoOrigen === "T");

/** Origen del punto de partida que usa F_SALDO_VACACIONES. */
const OrigenBadge = ({ origen }: { origen: SaldoVacacionesRh["ultimoOrigen"] }) =>
  origen == null ? (
    <span className="inline-block whitespace-nowrap rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
      Sin saldo capturado
    </span>
  ) : origen === "R" ? (
    <span className="inline-block whitespace-nowrap rounded bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-900">Capturado por RH</span>
  ) : (
    <span className="inline-block whitespace-nowrap rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">Trámite</span>
  );

/**
 * Saldos de vacaciones (RH, TRAMITES_NIVEL 9). F_SALDO_VACACIONES calcula a partir del último registro del empleado
 * en NOM_VACAEMP_M/_D; si no tiene ninguno cuenta desde el año de alta y el saldo sale inflado. Aquí RH captura ese
 * punto de partida (último periodo + días que le quedan) como registro de origen R, sin trámite, con la fecha del día.
 */
export const SaldosVacaciones = () => {
  const [lista, setLista] = useState<SaldoVacacionesRh[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [filtro, setFiltro] = useState<Filtro>("sin");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [seleccionado, setSeleccionado] = useState<SaldoVacacionesRh | null>(null);

  useEffect(() => {
    let vigente = true;
    getSaldos()
      .then((l) => {
        if (!vigente) return;
        setLista(l ?? []);
        setError(null);
        // El modal abierto muestra el saldo recién calculado.
        setSeleccionado((s) => (s ? ((l ?? []).find((x) => x.empleado === s.empleado) ?? s) : s));
      })
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [version]);

  const conteos = useMemo(
    () => Object.fromEntries(FILTROS.map((f) => [f.id, (lista ?? []).filter((s) => coincideFiltro(s, f.id)).length])) as Record<Filtro, number>,
    [lista]
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (lista ?? []).filter(
      (s) =>
        coincideFiltro(s, filtro) &&
        (!q || [s.nombreCompleto, s.empleado, s.departamento].some((v) => String(v ?? "").toLowerCase().includes(q)))
    );
  }, [lista, filtro, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtradas.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Mesa Control RH</span>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Saldos de Vacaciones</h1>
        <p className="text-xs text-slate-500">
          Punto de partida del saldo de cada empleado: último periodo y días que le quedan. Mientras no se capture, el saldo se
          calcula desde el año de alta y sale de más.
        </p>
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFiltro(f.id);
                setPagina(1);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                filtro === f.id ? "border-primary-900 bg-primary-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f.nombre} <span className="ml-1 font-mono opacity-80">{lista ? conteos[f.id] : "…"}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por Empleado, No. de Empleado o Departamento..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary-900"
          />
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        {!lista && !error ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Empleado</th>
                  <th className="px-4 py-3.5">Alta</th>
                  <th className="px-4 py-3.5">Punto de partida</th>
                  <th className="px-4 py-3.5 text-right">Saldo actual</th>
                  <th className="px-4 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Sin empleados con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  visibles.map((s) => (
                    <tr key={s.empleado} className="align-top transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <span className="block font-bold text-slate-900">{s.nombreCompleto}</span>
                        <span className="block font-mono text-[10px] text-slate-400">No. {s.empleado}</span>
                        {s.departamento && <span className="block text-[10px] text-slate-500">{s.departamento}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="block font-mono text-[11px] text-slate-700">{ddmmaaaa(s.fechaAlta)}</span>
                        <span className="block text-[10px] text-slate-500">{s.antiguedadAnos} años</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <OrigenBadge origen={s.ultimoOrigen} />
                        {s.ultimoOrigen && (
                          <span className="mt-1 block text-[11px] text-slate-600">
                            {s.ultimoFolio && <span className="font-mono font-bold">{s.ultimoFolio} · </span>}
                            {s.ultimoPerVac}: le quedan {dias(s.ultimoDiasXDisf)} · al {ddmmaaaa(s.ultimaFecha)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <span className={`block font-mono text-sm font-black ${s.ultimoOrigen ? "text-slate-900" : "text-amber-700"}`}>
                          {dias(s.diasTotales)}
                        </span>
                        {s.anoDisponible && (
                          <span className="block text-[10px] text-slate-500">
                            desde {s.anoDisponible}-{s.periodoDisponible}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSeleccionado(s)}
                          className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                        >
                          <IoWalletOutline className="h-4 w-4" /> {s.ultimoOrigen ? "Ver / Ajustar" : "Capturar saldo"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {lista && (
          <div className="flex flex-col justify-between gap-3 pt-2 text-xs text-slate-500 sm:flex-row sm:items-center">
            <span>
              {filtradas.length === 0
                ? "Sin empleados"
                : `Mostrando ${inicio + 1} a ${inicio + visibles.length} de ${filtradas.length} empleados`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                className="rounded-lg border px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
              >
                <IoChevronBack />
              </button>
              <span className="font-bold text-slate-700">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                className="rounded-lg border px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
              >
                <IoChevronForward />
              </button>
            </div>
          </div>
        )}
      </div>

      {seleccionado && (
        <CapturaSaldo saldo={seleccionado} alCerrar={() => setSeleccionado(null)} alCambiar={() => setVersion((v) => v + 1)} />
      )}
    </div>
  );
};

/** Modal: historial del empleado + captura de saldo inicial / ajuste. */
const CapturaSaldo = ({
  saldo,
  alCerrar,
  alCambiar,
}: {
  saldo: SaldoVacacionesRh;
  alCerrar: () => void;
  alCambiar: () => void;
}) => {
  const anoAlta = Number(saldo.fechaAlta.slice(0, 4));
  const anoMax = anoAlta + saldo.antiguedadAnos;

  const [registros, setRegistros] = useState<RegistroVacacionesRh[] | null>(null);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [ano, setAno] = useState(String(anoMax));
  const [periodo, setPeriodo] = useState("1");
  const [diasXDisf, setDiasXDisf] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vigente = true;
    getRegistrosVacaciones(saldo.empleado)
      .then((r) => vigente && setRegistros(r ?? []))
      .catch((e: Error) => vigente && setErrorHistorial(e.message));
    return () => {
      vigente = false;
    };
  }, [saldo.empleado, version]);

  const anoNum = Number(ano);
  const diasNum = Number(diasXDisf);
  const valido =
    Number.isInteger(anoNum) && anoNum >= anoAlta && anoNum <= anoMax && diasXDisf.trim() !== "" && Number.isInteger(diasNum) && diasNum >= 0;

  const guardar = async () => {
    setOcupado(true);
    try {
      await guardarSaldoInicial(saldo.empleado, { perVac: `${anoNum}-${periodo}`, diasXDisf: diasNum });
      toast.success(`Saldo registrado para ${saldo.nombreCompleto}`);
      setDiasXDisf("");
      setVersion((v) => v + 1);
      alCambiar();
    } catch (e) {
      toast.error((e as Error).message, 10000);
    } finally {
      setOcupado(false);
    }
  };

  const borrar = async (r: RegistroVacacionesRh) => {
    setOcupado(true);
    try {
      await borrarRegistroVacaciones(r.idVacaemp);
      toast.success("Registro eliminado");
      setVersion((v) => v + 1);
      alCambiar();
    } catch (e) {
      toast.error((e as Error).message, 8000);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !ocupado && alCerrar()}>
      <div
        className="max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-xl bg-white p-5 text-left shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{saldo.nombreCompleto}</h3>
            <p className="text-xs text-slate-500">
              No. {saldo.empleado} · Alta {ddmmaaaa(saldo.fechaAlta)} · {saldo.antiguedadAnos} años
            </p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Saldo actual</span>
            <span className={`block font-mono text-lg font-black ${saldo.ultimoOrigen ? "text-slate-900" : "text-amber-700"}`}>
              {dias(saldo.diasTotales)}
            </span>
          </div>
        </div>

        {!saldo.ultimoOrigen && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            No tiene saldo capturado: el saldo actual se está contando desde su año de alta ({anoAlta}).
          </p>
        )}

        <section className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-900">Capturar saldo</h4>
          <p className="text-xs text-slate-500">
            Indique el último periodo del que se tiene el dato y cuántos días le quedan de ese periodo (0 si ya los tomó todos). Los
            periodos siguientes se suman completos según el tabulador.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={etiquetaCls}>Año</span>
              <input type="number" min={anoAlta} max={anoMax} value={ano} onChange={(e) => setAno(e.target.value)} className={campoCls} />
            </label>
            <label className="block">
              <span className={etiquetaCls}>Periodo</span>
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={campoCls}>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </label>
            <label className="block">
              <span className={etiquetaCls}>Días que le quedan</span>
              <input type="number" min={0} value={diasXDisf} onChange={(e) => setDiasXDisf(e.target.value)} className={campoCls} />
            </label>
          </div>
          <p className="text-[11px] text-slate-400">
            Año entre {anoAlta} y {anoMax}. Se registra con la fecha de hoy y pasa a ser el punto de partida del saldo.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!valido || ocupado}
              onClick={guardar}
              className={`${botonCls} border-[#691c32] bg-[#691c32] text-white hover:bg-[#561727]`}
            >
              <IoSaveOutline className="h-4 w-4" /> {ocupado ? "Guardando…" : "Guardar saldo"}
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-900">Historial</h4>
          {errorHistorial && <p className="text-xs text-red-700">{errorHistorial}</p>}
          {!registros && !errorHistorial ? (
            <TableSkeleton rows={2} cols={4} />
          ) : registros && registros.length === 0 ? (
            <p className="text-xs text-slate-400">Sin registros.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Origen</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Último periodo</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(registros ?? []).map((r, i) => (
                    <tr key={r.idVacaemp} className={i === 0 ? "bg-emerald-50/50" : ""}>
                      <td className="px-3 py-2">
                        {r.origen === "R" ? (
                          <span className="font-bold text-violet-900">Captura RH</span>
                        ) : (
                          <span>
                            <span className="font-mono font-bold">{r.folio}</span>
                            {r.estatus != null && <span className="block text-[10px] text-slate-500">{estatusTramite(r.estatus).etiqueta}</span>}
                          </span>
                        )}
                        {i === 0 && <span className="block text-[10px] font-bold text-emerald-700">Vigente para el saldo</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">
                        {r.origen === "R" || r.fDesde === r.fHasta ? ddmmaaaa(r.fHasta) : `${ddmmaaaa(r.fDesde)} al ${ddmmaaaa(r.fHasta)}`}
                      </td>
                      <td className="px-3 py-2">
                        {r.perVac ? `${r.perVac}: le quedan ${dias(r.diasXDisf)}` : <span className="text-slate-400">Sin días (cancelado)</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.origen === "R" && (
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => borrar(r)}
                            className={`${botonCls} border-red-300 bg-white text-red-700 hover:bg-red-50`}
                          >
                            <IoTrashOutline className="h-4 w-4" /> Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={ocupado}
            onClick={alCerrar}
            className={`${botonCls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
