import { ESTATUS_VIATICO } from "@/modules/viaticos/lib/reglas";

const ESTILOS: Record<string, string> = {
  "1": "bg-sky-50 text-sky-700 ring-sky-200",
  "2": "bg-amber-50 text-amber-700 ring-amber-200",
  "3": "bg-violet-50 text-violet-700 ring-violet-200",
  "4": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "9": "bg-red-50 text-red-700 ring-red-200",
};

export const EstatusBadge = ({ estatus }: { estatus: string | number }) => {
  const clave = String(estatus).trim();
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        ESTILOS[clave] ?? "bg-slate-50 text-slate-600 ring-slate-200"
      }`}
    >
      {ESTATUS_VIATICO[clave] ?? (clave || "—")}
    </span>
  );
};
