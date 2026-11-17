// Reglas de fechas de vacaciones. Los días hábiles a descontar los calcula Oracle (FN_CONSULTA_VACACIONES); aquí
// solo se sugiere la fecha de regreso, para la que hacen falta los festivos de día completo del empleado.

const desdeISO = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

const aISO = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

/** Fechas AAAA-MM-DD de los festivos que son día completo de descanso (con hora de entrada/salida sí se trabaja). */
export const diasDeDescanso = (festivos: { fechaFestivo: string; horaEntrada: string | null; horaSalida: string | null }[]) =>
  new Set(festivos.filter((f) => !f.horaEntrada && !f.horaSalida).map((f) => f.fechaFestivo));

/** Primer día hábil después de `fin` (fecha de regreso sugerida): se brinca fines de semana y festivos. */
export const siguienteDiaHabil = (fin: string, festivos: ReadonlySet<string>) => {
  const d = desdeISO(fin);
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6 || festivos.has(aISO(d)));
  return aISO(d);
};

export const nombrePeriodo = (periodo: number | null) => (periodo === 1 ? "1er periodo" : periodo === 2 ? "2do periodo" : "—");

/** "1 día", "12.5 días" (NOM_VACAPRIMA.DIAS / 2 puede dar medios días). */
export const textoDias = (dias: number | null | undefined) => {
  const n = dias ?? 0;
  return `${n.toLocaleString("es-MX", { maximumFractionDigits: 1 })} ${n === 1 ? "día" : "días"}`;
};
