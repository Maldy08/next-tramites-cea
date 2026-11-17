import { NextRequest, NextResponse } from "next/server";
import type { FormatoViatico } from "@/modules/viaticos/dtos";
import { ceaFetch, errorResponse, fail, forbidden, toInt } from "@/shared/server/cea";
import { getViatico, puedeOperarEmpleado, usuarioViaticos } from "./acceso";

// OJO: en el backend FormatoComision recibe {oficina}/{ejercicio}/{noviat}; los demás {ejercicio}/{oficina}/{noviat}.
const RUTAS: Record<FormatoViatico, (e: number, o: number, n: number) => string> = {
  TresFormatos: (e, o, n) => `Viatico/TresFormatos/${e}/${o}/${n}`,
  FormatoComision: (e, o, n) => `Viatico/FormatoComision/${o}/${e}/${n}`,
  ReciboViatico: (e, o, n) => `Viatico/ReciboViatico/${e}/${o}/${n}`,
  InformeActividades: (e, o, n) => `Viatico/InformeActividades/${e}/${o}/${n}`,
};

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ formato: string; ejercicio: string; oficina: string; noviat: string }> }
) {
  const { user, error } = await usuarioViaticos();
  if (error) return error;

  const p = await params;
  const ruta = RUTAS[p.formato as FormatoViatico];
  if (!ruta) return NextResponse.json(fail("Formato desconocido"), { status: 404 });

  const ejercicio = toInt(p.ejercicio);
  const oficina = toInt(p.oficina);
  const noviat = toInt(p.noviat);

  try {
    const viatico = await getViatico(user, ejercicio, oficina, noviat);
    if (!viatico) return NextResponse.json(fail("Viático no encontrado"), { status: 404 });
    if (!(await puedeOperarEmpleado(user, viatico.noEmp))) return forbidden();

    const res = await ceaFetch(user, ruta(ejercicio, oficina, noviat));
    if (!res.ok || !res.body) {
      return NextResponse.json(fail(`No se pudo generar el formato (${res.status})`), { status: 502 });
    }

    return new NextResponse(res.body, {
      headers: {
        "Content-Type": "application/pdf",
        // inline: se abre en el visor del navegador en lugar de descargarse.
        "Content-Disposition": `inline; filename="${p.formato}-V${oficina}-${noviat}-${ejercicio}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
