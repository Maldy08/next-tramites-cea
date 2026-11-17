// Formato oficial impreso de cualquier trámite de RH (hoja carta vertical), basado en
// formato_oficial_de_vacaciones_y_tr_mites_rh_ceabc.html. Componente de servidor: pinta FormatoTramite según
// configFormato(tipo) (qué secciones y etiquetas salen).
import Image from "next/image";
import { configFormato, type ColumnaDetalle, type FormatoDetalle, type FormatoTramite } from "@/shared/formato";
import { ESTATUS_TRAMITE } from "@/shared/tramites";
import { BarraFormato } from "./BarraFormato";

const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

const partes = (iso: string | null) => {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-");
  return { a, m: MESES[Number(m) - 1], d };
};

/** "2026-05-02…" → "02 DE MAYO DE 2026" */
const fechaLarga = (iso: string | null) => {
  const p = partes(iso);
  return p ? `${p.d} DE ${p.m} DE ${p.a}` : "—";
};

/** "2026-11-05…" → "05 / NOV / 2026" */
const fechaCorta = (iso: string | null) => {
  const p = partes(iso);
  return p ? `${p.d} / ${p.m.slice(0, 3)} / ${p.a}` : "—";
};

/** "2026-11-19T08:00:00" → "08:00 HRS"; null si no trae hora o es 00:00 (no checada de todo el día). */
const hora = (iso: string | null) =>
  iso && iso.length >= 16 && iso.slice(11, 16) !== "00:00" ? `${iso.slice(11, 16)} HRS` : null;

/** Fecha grande de la sección II, con su hora debajo si el tipo la usa. */
const FechaTramite = ({ etiqueta, iso, nota, conHora, alinear = "" }: { etiqueta: string; iso: string | null; nota: string; conHora: boolean; alinear?: string }) => (
  <div className={`flex-1 ${alinear}`}>
    <span className="mb-1 inline-block rounded bg-neutral-700/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#691c32]">
      {etiqueta}
    </span>
    <p className="mt-0.5 text-[15px] font-normal uppercase leading-none tracking-tight">{fechaLarga(iso)}</p>
    {conHora && hora(iso) && <p className="mt-1 font-mono text-[13px] font-normal leading-none text-[#691c32]">{hora(iso)}</p>}
    <span className="mt-1 block text-[9px] font-medium text-neutral-500">{nota}</span>
  </div>
);

const nombreCompleto = (noEmp: number | null, nombre: string | null) => (nombre ? nombre : noEmp ? `EMPLEADO ${noEmp}` : "—");

const Etiqueta = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-neutral-500">{children}</span>
);

const Dato = ({ etiqueta, valor, className = "" }: { etiqueta: string; valor: string | null; className?: string }) => (
  <div className={className}>
    <Etiqueta>{etiqueta}</Etiqueta>
    <span className="block text-[11.5px] font-normal uppercase leading-snug text-neutral-800">{valor || "—"}</span>
  </div>
);

const TituloSeccion = ({ children, nota, acento = "bg-neutral-800" }: { children: React.ReactNode; nota: string; acento?: string }) => (
  <div className="mb-1.5 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3.5 w-1.5 rounded-full ${acento}`} />
      <h3 className="text-[10.5px] font-extrabold uppercase tracking-wider text-neutral-800">{children}</h3>
    </div>
    <span className="text-[8.5px] font-medium uppercase tracking-wide text-neutral-500">{nota}</span>
  </div>
);

const Firma = ({ titulo, nombre, puesto, pie }: { titulo: string; nombre: string; puesto: string | null; pie: string }) => (
  // Alturas fijas (título, espacio de firma y 2+2 renglones para nombre/puesto) para que la línea de firma
  // quede a la misma altura en los 4 recuadros aunque un nombre o puesto ocupe dos renglones.
  <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-2.5">
    <span className="px-2 py-1 text-[8.5px] font-extrabold uppercase tracking-wider text-neutral-600">{titulo}</span>
    <div className="h-10" />
    <div className="min-h-[48px] border-t border-neutral-800 pt-1.5">
      <p className="break-words text-[9.5px] font-bold uppercase leading-tight text-neutral-900">{nombre}</p>
      <p className="mt-0.5 break-words text-[8px] font-medium leading-tight text-neutral-500">{puesto || pie}</p>
    </div>
  </div>
);

const esValor = (c: ColumnaDetalle) => c.campo.startsWith("valor");
const celda = (r: FormatoDetalle, c: ColumnaDetalle) => r[c.campo] ?? "";

export const FormatoTramiteHoja = ({ formato }: { formato: FormatoTramite }) => {
  const e = formato.encabezado;
  const cfg = configFormato(e.tipoTramite);
  const titulo = cfg.titulo || `Solicitud de ${e.descTipo ?? "trámite"}`;
  const cancelado = e.estatus === ESTATUS_TRAMITE.cancelado;
  const det = cfg.detalle;
  // Justificante de un solo momento (no checada): una sola fecha.
  const unaFecha = cfg.conHora && e.fechaInicio === e.fechaFin;
  const conSaldo = e.saldoTotal != null;
  const total = (c: ColumnaDetalle) => formato.detalle.reduce((s, r) => s + (Number(r[c.campo]) || 0), 0);

  return (
    <div className="min-h-screen bg-neutral-300 text-neutral-900 print:bg-white">
      {/* Hoja carta sin márgenes del navegador; el padding de la hoja hace de margen. */}
      <style>{`
        @page { size: letter portrait; margin: 0; }
        @media print { html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; } }
        .hoja-carta { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      <BarraFormato folio={e.folio} />

      <main className="hoja-carta relative mx-auto my-6 flex h-[279.4mm] w-[215.9mm] flex-col justify-between overflow-hidden bg-white px-[13mm] py-[11mm] shadow-xl print:m-0 print:shadow-none">
        {cancelado && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-30 select-none text-[90px] font-black uppercase tracking-widest text-red-600/15">Cancelado</span>
          </div>
        )}

        <div className="space-y-3.5">
          {/* Encabezado */}
          <header className="grid grid-cols-12 items-center gap-4 border-b-2 border-neutral-800 pb-3">
            <div className="col-span-3 flex h-[74px] items-center justify-center p-2">
              <Image src="/logo.png" alt="CEA" width={160} height={60} className="max-h-[58px] w-auto object-contain" priority />
            </div>
            <div className="col-span-6 flex flex-col justify-center text-center">
              <h1 className="text-[12px] font-extrabold uppercase leading-tight tracking-wide">Comisión Estatal del Agua de Baja California</h1>
              <h2 className="mt-0.5 text-[9.5px] font-bold uppercase tracking-widest text-neutral-600">
                Dirección Administrativa • Coordinación de Recursos Humanos
              </h2>
              <div className="mx-auto mt-2 inline-block rounded-md bg-[#691c32] px-5 py-1.5 text-white shadow-sm">
                <span className="block text-[14px] font-extrabold uppercase leading-none tracking-widest">{titulo}</span>
              </div>

            </div>
            <div className="col-span-3 flex min-h-[74px] flex-col justify-between gap-1 self-stretch rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <div className="flex items-baseline justify-between border-b border-neutral-200 pb-1">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-500">Folio:</span>
                <span className="font-mono text-[11px] font-extrabold text-[#691c32]">{e.folio}</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-neutral-200 pb-1">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-500">Fecha:</span>
                <span className="text-[10px] font-bold uppercase">{fechaCorta(e.fechaSolicitud)}</span>
              </div>
              {/* Permisos / justificantes: el tipo de incidencia va en lugar de la modalidad. */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="shrink-0 text-[8.5px] font-bold uppercase tracking-wider text-neutral-500">
                  {e.descIncidencia ? "Incidencia:" : "Modalidad:"}
                </span>
                <span className="text-right text-[8.5px] font-extrabold uppercase leading-tight text-neutral-700">
                  {e.descIncidencia || e.modalidad || "—"}
                </span>
              </div>
            </div>
          </header>

          {/* I. Empleado */}
          <section>
            <TituloSeccion nota="Expediente activo de personal">I. Datos Generales del Empleado</TituloSeccion>
            <div className="rounded-lg border border-neutral-200/90 bg-neutral-50/70 p-3.5">
              <div className="mb-2.5 grid grid-cols-12 items-center gap-4 border-b border-dashed border-neutral-200 pb-2.5">
                <div className="col-span-5">
                  <Etiqueta>Nombre completo del solicitante</Etiqueta>
                  <span className="block text-[13px] font-extrabold uppercase leading-snug tracking-tight">{e.nombre}</span>
                </div>
                <div className="col-span-2">
                  <Etiqueta>No. Empleado</Etiqueta>
                  <span className="inline-block font-mono text-[12px] font-extrabold">
                    {e.noEmp}
                  </span>
                </div>
                <div className="col-span-3">
                  <Etiqueta>R.F.C.</Etiqueta>
                  <span className="block font-mono text-xs font-bold uppercase text-neutral-800">{e.rfc || "—"}</span>
                </div>
                <div className="col-span-2">
                  <Etiqueta>Fecha de ingreso</Etiqueta>
                  <span className="block text-xs font-bold uppercase text-neutral-800">{fechaCorta(e.fechaIngreso)}</span>
                </div>
              </div>
              <div className="grid grid-cols-12 items-start gap-4">
                <Dato className="col-span-3" etiqueta="Dirección / Unidad" valor={e.direccion} />
                <Dato className="col-span-3" etiqueta="Departamento" valor={e.departamento} />
                <Dato className="col-span-3" etiqueta="Puesto funcional" valor={e.puesto} />
                <Dato className="col-span-3" etiqueta="Categoría / Nivel" valor={e.categoria} />
              </div>
            </div>
          </section>

          {/* II. Trámite */}
          <section>
            <TituloSeccion nota={cfg.notaTramite} acento="bg-neutral-700">
              {cfg.seccionTramite}
            </TituloSeccion>
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="grid grid-cols-12 items-stretch gap-3.5 p-3.5">
                <div
                  className={`${cfg.dias ? "col-span-8" : "col-span-12"} flex items-center justify-between rounded-lg border border-neutral-200/90 bg-neutral-50/90 px-4 py-2.5`}
                >
                  {unaFecha ? (
                    <FechaTramite etiqueta="Fecha de la incidencia" iso={e.fechaInicio} nota={cfg.notaInicio} conHora />
                  ) : (
                    <>
                      <FechaTramite etiqueta="Fecha de inicio (del)" iso={e.fechaInicio} nota={cfg.notaInicio} conHora={cfg.conHora} />
                      <div className="flex flex-col items-center px-3 text-neutral-400">
                        <span className="mb-0.5 text-[8px] font-bold uppercase tracking-widest">Hasta</span>
                        <span className="text-lg leading-none text-[#691c32]">→</span>
                      </div>
                      <FechaTramite etiqueta="Fecha de término (al)" iso={e.fechaFin} nota={cfg.notaFin} conHora={cfg.conHora} alinear="text-right" />
                    </>
                  )}
                </div>
                {cfg.dias && (
                  // Con saldo total (vacaciones) la parte izquierda va más chica para que quepa todo en col-span-4.
                  <div
                    className={`col-span-4 flex min-w-0 items-center justify-center rounded-lg bg-neutral-700/10 py-2.5 ${
                      conSaldo ? "gap-2 px-2.5" : "gap-3 px-3.5"
                    }`}
                  >
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-lg bg-[#691c32] text-white shadow-sm ${conSaldo ? "h-9 w-9" : "h-12 w-12"}`}
                    >
                      <span className={`font-black leading-none ${conSaldo ? "text-lg" : "text-2xl"}`}>{e.dias ?? "—"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className={`block font-extrabold uppercase leading-tight tracking-tight ${conSaldo ? "text-[9px]" : "text-[11px]"}`}>
                        {cfg.dias.etiqueta}
                      </span>
                      <span
                        className={`mt-0.5 block font-semibold uppercase leading-tight text-[#691c32] ${conSaldo ? "text-[7.5px] tracking-normal" : "text-[9.5px] tracking-wider"}`}
                      >
                        {cfg.dias.sub}
                      </span>
                      <span className={`mt-0.5 block font-medium leading-tight text-neutral-500 ${conSaldo ? "text-[6.5px]" : "text-[8px]"}`}>
                        Sujeto a calendario oficial
                      </span>
                    </div>
                    {/* Vacaciones: saldo total vigente del empleado (F_SALDO_VACACIONES al consultar). */}
                    {conSaldo && (
                      <div className="shrink-0 border-l border-neutral-700/50 pl-2 text-center">
                        <span className="block whitespace-nowrap text-[7.5px] font-semibold uppercase leading-tight text-neutral-500">Saldo total</span>
                        <span className="block text-lg font-black leading-tight text-[#691c32]">{e.saldoTotal}</span>
                        <span className="block text-[8px] font-medium uppercase leading-tight text-neutral-500">días</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {(cfg.muestraRegreso || cfg.muestraCubre) && (
                <div className="grid grid-cols-12 items-center gap-4 border-t border-neutral-200 bg-neutral-100/80 px-4 py-2.5">
                  {cfg.muestraRegreso && (
                    <div className="col-span-5">
                      <span className="mb-0.5 block text-[9px] font-semibold uppercase leading-none tracking-wider text-neutral-500">
                        Reanudación de labores (regresa el):
                      </span>
                      <span className="text-xs font-extrabold uppercase">{fechaLarga(e.fechaRegreso)}</span>
                    </div>
                  )}
                  {cfg.muestraCubre && (
                    <div className={`${cfg.muestraRegreso ? "col-span-7 border-l border-neutral-300 pl-4" : "col-span-12"} min-w-0`}>
                      <span className="mb-0.5 block text-[9px] font-semibold uppercase leading-none tracking-wider text-neutral-500">
                        Personal que cubre las funciones durante la ausencia:
                      </span>
                      <span className="block truncate text-xs font-extrabold uppercase tracking-tight">
                        {e.noEmpCubre ? `${e.noEmpCubre} - ${e.nombreCubre ?? ""}` : "SIN RELEVO DESIGNADO"}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {e.motivo && (
                <div className="border-t border-neutral-200 px-4 py-2.5">
                  <span className="mb-0.5 block text-[9px] font-semibold uppercase leading-none tracking-wider text-neutral-500">
                    Motivo / justificación:
                  </span>
                  <p className="text-[11px] font-bold uppercase leading-snug text-neutral-800">{e.motivo}</p>
                </div>
              )}
            </div>
          </section>

          {/* III. Desglose */}
          {det && (
            <section>
              <TituloSeccion nota={det.nota}>{det.titulo}</TituloSeccion>
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-100 text-[9px] font-bold uppercase tracking-wider text-neutral-600">
                      {det.columnas.map((c) => (
                        <th
                          key={c.campo}
                          className={`px-3 py-2 ${esValor(c) ? "" : "text-left"} ${c.destacada ? "bg-neutral-700/15 text-[#691c32]" : ""}`}
                        >
                          {c.titulo}
                          {c.sub && (
                            <>
                              <br />
                              <span className="text-[8px] font-normal">{c.sub}</span>
                            </>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white text-[11px]">
                    {formato.detalle.map((r) => (
                      <tr key={r.orden}>
                        {det.columnas.map((c) => (
                          <td
                            key={c.campo}
                            className={`px-3 py-2 ${
                              esValor(c)
                                ? c.destacada
                                  ? "bg-neutral-700/10 font-extrabold text-[#691c32]"
                                  : "font-semibold text-neutral-700"
                                : "text-left font-bold uppercase text-neutral-800"
                            }`}
                          >
                            {celda(r, c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {formato.detalle.length === 0 && (
                      <tr>
                        <td colSpan={det.columnas.length} className="px-3 py-2 text-neutral-500">
                          Sin renglones registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-300 bg-neutral-50 text-[10.5px] font-extrabold">
                      {det.columnas.map((c, i) =>
                        esValor(c) ? (
                          <td key={c.campo} className={`px-3 py-2 ${c.destacada ? "bg-neutral-700/20 text-[#691c32]" : ""}`}>
                            {total(c)} {det.sufijoTotal ?? ""}
                          </td>
                        ) : i === det.columnas.findIndex((x) => !esValor(x)) ? (
                          <td
                            key={c.campo}
                            colSpan={det.columnas.filter((x) => !esValor(x)).length}
                            className="px-3 py-2 text-right text-[9.5px] uppercase tracking-wider text-neutral-600"
                          >
                            Totales:
                          </td>
                        ) : null
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Firmas + pie */}
        <div className="pt-1">
          <section>
            <TituloSeccion nota="Flujo de 4 firmas requeridas">{det ? "IV" : "III"}. Firmas de Solicitud, Autorización y Validación</TituloSeccion>
            <div className="grid grid-cols-4 gap-3 text-center">
              <Firma titulo="1. Empleado solicitante" nombre={nombreCompleto(e.noEmp, e.nombre)} puesto={e.puesto} pie="Conformidad del solicitante" />
              <Firma titulo="2. Jefe inmediato" nombre={nombreCompleto(e.firma1NoEmp, e.firma1Nombre)} puesto={e.firma1Puesto} pie="Vo. Bo. jefe inmediato" />
              <Firma titulo="3. Director de área" nombre={nombreCompleto(e.firma2NoEmp, e.firma2Nombre)} puesto={e.firma2Puesto} pie="Autorización dirección" />
              <Firma titulo="4. Recursos Humanos" nombre={nombreCompleto(e.firma3NoEmp, e.firma3Nombre)} puesto={e.firma3Puesto} pie="Validación y registro RH" />
            </div>
          </section>
          <footer className="mt-2.5 flex items-end justify-between border-t border-neutral-200 pt-2 text-[8px] leading-tight text-neutral-500">
            <p>
              <span className="font-bold text-neutral-700">C.c.p.</span> Dirección Administrativa • Coordinación de Recursos Humanos
              (Expediente) • Interesado.
            </p>
            <p className="font-bold uppercase text-neutral-700">CEABC • Sistema de Trámites • Hoja 1 de 1</p>
          </footer>
        </div>
      </main>
    </div>
  );
};
