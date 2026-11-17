import { NextRequest, NextResponse } from "next/server";
import type { Ciudad, Empleado, Estado, GuardarViaticoRequest, GuardarViaticoResponse } from "@/modules/viaticos/dtos";
import {
  aFechaBackend,
  clasificarDestino,
  getDias,
  importePorDias,
  INFOR_RESUL,
} from "@/modules/viaticos/lib/reglas";
import { CeaError, ceaData, ceaJson, errorResponse, fail, forbidden, ok, type SessionUser } from "@/shared/server/cea";
import { getViatico, puedeOperarEmpleado, usuarioViaticos } from "./acceso";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const validar = (b: GuardarViaticoRequest): string | null => {
  if (!b || !Number.isInteger(b.ejercicio) || !Number.isInteger(b.noEmp)) return "Datos incompletos";
  if (![b.fecha, b.fechaSal, b.fechaReg].every((f) => FECHA.test(f ?? ""))) return "Fechas inválidas";
  if (!b.fecha.startsWith(`${b.ejercicio}-`)) return "La fecha debe pertenecer al ejercicio";
  if (b.fechaReg < b.fechaSal) return "La fecha de regreso no puede ser anterior a la de salida";
  if (!b.destinoId) return "Seleccione la ciudad de destino";
  if (![1, 2].includes(b.origenId)) return "Ciudad de origen inválida";
  if (!b.motivo?.trim() || b.motivo.length > 300) return "El título de la comisión es requerido (máx. 300 caracteres)";
  if (!b.inforAct?.trim() || b.inforAct.length > 500) return "Las actividades son requeridas (máx. 500 caracteres)";
  return null;
};

/** Partida e importe se calculan aquí con datos del backend, no con lo que mande el navegador. */
const calcularPartida = async (user: SessionUser, b: GuardarViaticoRequest, empleado: Empleado) => {
  const ciudad = await ceaData<Ciudad | null>(user, `Viaticos/Ciudades/${b.destinoId}`);
  if (!ciudad) throw new CeaError("Ciudad de destino no encontrada", 422);
  const estado = await ceaJson<Estado | null>(user, `Estados/ByIdEstado/${ciudad.idEstado}`);
  const dias = getDias(b.fechaSal, b.fechaReg);
  const { partida, fueraDelEstado } = clasificarDestino(b.destinoId, estado);
  return { dias, partida, importe: importePorDias(dias, empleado.nivel, fueraDelEstado) };
};

const fechasBackend = (b: GuardarViaticoRequest) => ({
  fecha: aFechaBackend(b.fecha),
  fechaSal: aFechaBackend(b.fechaSal),
  fechaReg: aFechaBackend(b.fechaReg),
  inforFecha: aFechaBackend(b.fechaReg),
  motivo: b.motivo.trim().toUpperCase(),
  inforAct: b.inforAct.trim().toUpperCase(),
  inforResul: INFOR_RESUL,
  origenId: b.origenId,
  destinoId: b.destinoId,
});

// Crear: folio consecutivo + viático + partida.
export async function POST(req: NextRequest) {
  const { user, error } = await usuarioViaticos();
  if (error) return error;

  const body = (await req.json()) as GuardarViaticoRequest;
  const invalido = validar(body);
  if (invalido) return NextResponse.json(fail(invalido), { status: 400 });

  try {
    if (!(await puedeOperarEmpleado(user, body.noEmp))) return forbidden();

    const empleado = await ceaData<Empleado>(user, `Empleados/GetEmpleadoById/${body.noEmp}`);
    if (!empleado?.oficina) {
      return NextResponse.json(
        fail("El empleado no cuenta con lugar de trabajo asignado, favor de verificarlo con el área de Recursos Humanos."),
        { status: 422 }
      );
    }

    const oficina = empleado.oficina;
    const { dias, partida, importe } = await calcularPartida(user, body, empleado);
    const ultimo = await ceaData<number>(user, `Viatico/GetNoViat/${body.ejercicio}/${oficina}`);
    const noViat = ultimo + 1;
    const f = fechasBackend(body);

    await ceaData<number>(user, "Viatico", {
      method: "POST",
      body: JSON.stringify({
        ...f,
        oficina,
        ejercicio: body.ejercicio,
        noViat,
        noEmp: body.noEmp,
        dias,
        nota: "nada",
        estatus: 1,
        fechaMod: f.fecha,
        pol: 0,
        polMes: 0,
        caja: 0,
        cajaVale: 0,
        cajaRepo: 0,
        noEmpCrea: user.idUsuario,
      }),
    });

    try {
      await ceaData<number>(user, "Viatico/ViaticosPart", {
        method: "POST",
        body: JSON.stringify({ oficina, ejercicio: body.ejercicio, noViat, partida, importe }),
      });
    } catch (e) {
      throw new CeaError(
        `El viático V${oficina}-${noViat}/${body.ejercicio} se creó, pero falló el registro de su partida: ${(e as Error).message}`
      );
    }

    const data: GuardarViaticoResponse = { oficina, ejercicio: body.ejercicio, noViat, importe };
    return NextResponse.json(ok(data, `Viático generado con el número ${noViat}`));
  } catch (e) {
    return errorResponse(e);
  }
}

// Modificar: solo viáticos en estatus "Creado".
export async function PUT(req: NextRequest) {
  const { user, error } = await usuarioViaticos();
  if (error) return error;

  const body = (await req.json()) as GuardarViaticoRequest;
  const invalido = validar(body) ?? (!body.oficina || !body.noViat ? "Falta el folio del viático" : null);
  if (invalido) return NextResponse.json(fail(invalido), { status: 400 });

  try {
    const actual = await getViatico(user, body.ejercicio, body.oficina!, body.noViat!);
    if (!actual) return NextResponse.json(fail("Viático no encontrado"), { status: 404 });
    if (!(await puedeOperarEmpleado(user, actual.noEmp))) return forbidden();
    if (actual.estatus > 1) {
      return NextResponse.json(fail("El viático ya fue procesado y no se puede modificar"), { status: 409 });
    }

    const empleado = await ceaData<Empleado>(user, `Empleados/GetEmpleadoById/${actual.noEmp}`);
    const { dias, partida, importe } = await calcularPartida(user, body, empleado);
    const ids = { oficina: actual.oficina, ejercicio: actual.ejercicio, noViat: actual.noViat };

    await ceaData<number>(user, "Viatico", {
      method: "PUT",
      body: JSON.stringify({ ...fechasBackend(body), ...ids, dias }),
    });
    await ceaData<number>(user, "Viatico/ViaticosPart", {
      method: "PUT",
      body: JSON.stringify({ ...ids, partida, importe }),
    });

    const data: GuardarViaticoResponse = { ...ids, importe };
    return NextResponse.json(ok(data, "Viático actualizado correctamente"));
  } catch (e) {
    return errorResponse(e);
  }
}
