import { NextRequest, NextResponse } from "next/server";
import type { ViaticoCapturado } from "@/modules/viaticos/dtos";
import { tienePersonalACargo } from "@/shared/empleados";
import { ceaData, errorResponse, fail, forbidden, ok, toInt } from "@/shared/server/cea";
import { usuarioViaticos } from "./acceso";

// GET /api/viaticos/capturados/[ejercicio]: viáticos que el supervisor (TRAMITES_NIVEL 2) capturó para otros
// empleados (NOEMP_CREA = él). Bandeja → "Capturados por mí".
export async function GET(_: NextRequest, { params }: { params: Promise<{ ejercicio: string }> }) {
  const { user, error } = await usuarioViaticos();
  if (error) return error;
  if (!tienePersonalACargo(user.tramitesNivel)) return forbidden("No tienes personal a tu cargo");

  const ejercicio = toInt((await params).ejercicio);
  if (Number.isNaN(ejercicio)) return NextResponse.json(fail("Ejercicio no válido"), { status: 400 });
  try {
    const lista = await ceaData<ViaticoCapturado[]>(user, `Viatico/Capturados/${ejercicio}`);
    return NextResponse.json(ok(lista ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
