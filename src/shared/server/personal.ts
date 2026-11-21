import { NextRequest, NextResponse } from "next/server";
import { tienePersonalACargo } from "@/shared/empleados";
import type { Tramite } from "@/shared/tramites";
import { ceaData, errorResponse, fail, forbidden, getUser, ok, toInt, unauthorized } from "./cea";

// Bandeja del supervisor (solo TRAMITES_NIVEL 2; el backend vuelve a validar con el claim userid). ?ano=AAAA&tipo=N
// - /api/personal/tramites: trámites de NOM_TRAMITES de su personal a cargo (EMPLEADOS.SUPERVISOR_ID = él);
// - /api/personal/capturados: los que capturó para otros (ID_EMPLEADO_SUPERVISOR = él), p. ej. en suplencia.
const listar = (recurso: "Personal" | "Capturados") =>
  async function GET(req: NextRequest) {
    const user = await getUser();
    if (!user) return unauthorized();
    if (!tienePersonalACargo(user.tramitesNivel)) return forbidden("No tienes personal a tu cargo");

    const ano = toInt(req.nextUrl.searchParams.get("ano") ?? "");
    if (Number.isNaN(ano)) return NextResponse.json(fail("Año no válido"), { status: 400 });
    const tipo = toInt(req.nextUrl.searchParams.get("tipo") ?? "");

    try {
      const tramites = await ceaData<Tramite[]>(user, `NomTramites/${recurso}/${ano}${Number.isNaN(tipo) ? "" : `?tipo=${tipo}`}`);
      return NextResponse.json(ok(tramites ?? []));
    } catch (error) {
      return errorResponse(error);
    }
  };

export const GET_PERSONAL = listar("Personal");
export const GET_CAPTURADOS = listar("Capturados");
