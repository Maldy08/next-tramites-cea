import { NextResponse } from "next/server";
import type { Ciudad, Estado, Oficina, Pais } from "@/modules/viaticos/dtos";
import { ceaData, ceaJson, errorResponse, ok } from "@/shared/server/cea";
import { usuarioViaticos } from "./acceso";

// Los cuatro catálogos de la captura en una sola llamada.
export async function GET() {
  const { user, error } = await usuarioViaticos();
  if (error) return error;

  try {
    const [oficinas, ciudades, estados, paises] = await Promise.all([
      ceaData<Oficina[]>(user, "Oficinas"),
      ceaData<Ciudad[]>(user, "Viaticos/Ciudades"),
      // api/Estados no viene envuelto en Result: devuelve el arreglo directo.
      ceaJson<Estado[]>(user, "Estados"),
      ceaData<Pais[]>(user, "Paises"),
    ]);
    return NextResponse.json(ok({ oficinas, ciudades, estados, paises }));
  } catch (error) {
    return errorResponse(error);
  }
}
