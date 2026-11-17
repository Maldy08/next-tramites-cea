// Días hábiles de un permiso para mostrarlos en la captura. El backend los recalcula al guardar con la misma regla
// (lunes a viernes sin los festivos de día completo del empleado; FN_DIAS_HABILES_EMP en el formato).

const desdeISO = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

const aISO = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

export interface ConteoDias {
  habiles: number;
  /** Festivos de día completo que cayeron en lunes a viernes del rango (no se cuentan). */
  festivos: { fecha: string; descripcion: string }[];
}

export const contarDiasHabiles = (
  inicio: string,
  fin: string,
  festivos: { fechaFestivo: string; descripcion: string; horaEntrada: string | null; horaSalida: string | null }[]
): ConteoDias => {
  const descanso = new Map(
    festivos.filter((f) => !f.horaEntrada && !f.horaSalida).map((f) => [f.fechaFestivo, f.descripcion] as const)
  );
  const conteo: ConteoDias = { habiles: 0, festivos: [] };
  for (const d = desdeISO(inicio); aISO(d) <= fin; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const iso = aISO(d);
    const festivo = descanso.get(iso);
    if (festivo !== undefined) conteo.festivos.push({ fecha: iso, descripcion: festivo });
    else conteo.habiles++;
  }
  return conteo;
};

/** "AAAA-MM-DD" → "DD/MM/AAAA". */
export const fechaCorta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
