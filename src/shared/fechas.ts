// Fechas del portal. El servidor puede correr en otra zona: siempre se calcula con la hora de Baja California.
const ZONA = "America/Tijuana";

/** Fecha de hoy como AAAA-MM-DD ("Sysdate" del mockup; en-CA da ese formato). */
export const hoySysdate = () => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
