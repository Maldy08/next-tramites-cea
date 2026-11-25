# Contexto del Sistema de Trámites CEA

Documento para retomar el trabajo sin depender del historial de conversaciones. La arquitectura del front y sus reglas
están en [CLAUDE.md](../CLAUDE.md); aquí van las reglas de negocio, el modelo en Oracle, el backend y los pendientes.
**No poner aquí contraseñas, cadenas de conexión ni datos personales.**

Última actualización: 2026-11-25.

## 1. Qué es

Portal único de trámites de personal de la CEA (Next.js 16, puerto 3004) con backend C# compartido en el repo `CEA`
(Clean Architecture + EF Core sobre Oracle). Módulos actuales: **viáticos**, **vacaciones**, **permisos**,
**justificantes**; además las vistas de **firmas** (jefes/directores) y **RH** (administración y saldos).
Pendiente: **incapacidades** (la tabla ya existe).

- El backend `CEA` es compartido con otros sistemas (bitácoras, oficios, indicadores, checador): cualquier cambio global
  (filtros, middleware) afecta a todos.
- El backend lo publica el usuario (no publicar ni tocar la carpeta de publicación desde Claude). Al publicar, revisar que
  `CEA.Persistence.dll` y `CEA.Application.dll` también cambien de fecha, no solo `CEA.WebAPI.dll`.
- Los servidores no tienen salida a internet: nada de CDNs en el front.

## 2. Roles (`USUARIOS.TRAMITES_NIVEL`)

Rol **exacto**, nunca comparar con `>=`.

| Nivel | Rol | Qué puede hacer |
|---|---|---|
| 0 / 1 | Empleado | Sus propios trámites |
| 2 | Supervisor | Además representa a su personal a cargo (`EMPLEADOS.SUPERVISOR_ID` = él) y a otros del mismo depto (suplencia); Bandeja "Mi personal a cargo" y "Capturados por mí". Opera (enviar, cancelar, editar), no autoriza |
| 3 | Firmante (jefe/director) | Representa como el 2 y firma en `/firmas` los trámites donde es `VALIDA_1` (estatus 2) o `VALIDA_2` (estatus 3). No tiene la vista de personal a cargo |
| 9 | Administrador RH | `/rh/tramites` (todos los trámites, modificar/autorizar/cancelar) y `/rh/saldos` |

- `USUARIOS.TRAMITES = 1` es obligatorio para entrar al portal.
- Criterio acordado para firmantes: `EMPLEADOS.NIVEL >= 17` y activo → `TRAMITES_NIVEL = 3`.
- Los cambios de nivel exigen volver a iniciar sesión (los permisos se calculan en el login).
- `USUARIOS` puede tener varios renglones por empleado.

## 3. Flujo de estatus (`RH_CAT_ESTATUS`)

```
1 Creado ──Enviar──► 2 Revisión Jefe ──Firma VALIDA_1──► 3 Revisión Director ──Firma VALIDA_2──► 4 Revisión RH ──RH──► 100 Autorizado
   ▲                     │                                    │
   └──── 98 Regresado ◄──┴────────── Regresar (con motivo) ───┘
99 Cancelado · 101 Reprogramado (reservado) · 5 Finanzas / 110 Pagado (reservados)
```

- **Enviar** (1/98): normal → 2. Si quien envía es `VALIDA_1` → directo a 3. Si es `VALIDA_1` y `VALIDA_2` → directo a 4.
- **Firmar**: si `VALIDA_1 = VALIDA_2`, firma una sola vez 2 → 4 ("VALIDADO POR EL JEFE Y DIRECTOR").
- **RH autoriza** desde 2, 3 o 4 → 100 aunque falten firmas. No desde 1 ni 98 (98 sin confirmar con el usuario).
- **Cancelar**: el empleado/supervisor en 1, 2 o 98; RH en cualquier estatus. En vacaciones se borra `NOM_VACAEMP_D`
  (los días regresan al saldo) y se conserva el encabezado `M`.
- **Editar**: el empleado o su supervisor solo en 1 y 98; RH en cualquier estatus excepto cancelado (motivo obligatorio).
- Un trámite regresado (98) solo se edita, reenvía o cancela.
- Toda acción deja renglón en `NOM_TRAMITES_BITACORA`; `ID_ESTATUS` = estatus en que quedó el trámite. Textos de
  acción: SOLICITUD GENERADA, ENVIADO A FIRMA DEL JEFE / DEL DIRECTOR (LO ENVIA EL JEFE) / A RECURSOS HUMANOS (LO ENVIA
  EL JEFE Y DIRECTOR), VALIDADO POR EL JEFE / DIRECTOR / JEFE Y DIRECTOR, REGRESADO POR EL …, AUTORIZADO POR RH,
  CANCELADO …, MODIFICADO POR EL EMPLEADO / SUPERVISOR / RH. La cadena de firmas del front
  (`shared/components/BitacoraTramite.tsx`) se deriva de estos textos y de `ID_ESTATUS`.

## 4. Oracle (esquema CEA)

Scripts en `CEA/CEA.Persistence/Scripts/RecursosHumanos/`. El DDL en producción lo corre el usuario.
Oracle < 18c: no hay `ALTER SEQUENCE … RESTART` (usar `INCREMENT BY -n` + `NEXTVAL` + `INCREMENT BY 1`).

| Objeto | Contenido |
|---|---|
| `NOM_TRAMITES` | Encabezado de todo trámite de RH: `ANO`, `FOLIO` (UK con ANO), `TIPO_TRAMITE`, `ID_EMPLEADO` (beneficiario), `AMBITO` P/S, `ID_EMPLEADO_SUPERVISOR` (quién capturó por otro), `ESTATUS`, `VALIDA_1`/`VALIDA_2` (firmantes, de `FN_TRAMITES_CONSULTA_FIRMAS`), fechas |
| `NOM_TRAMITES_BITACORA` | Movimientos (ver §3) |
| `RH_CAT_TIPOS_TRAMITE` | 1 Vacaciones, 2 Viáticos, 3 Permisos, 4 Justificantes, 5 Incapacidades; `SIGLAS` VAC/PER/JUS/INC |
| `RH_CAT_ESTATUS` | Ver §3 |
| `NOM_VACAEMP_M` / `_D` | Solicitud de vacaciones (encabezado y reparto por periodo `PERVAC` 'AAAA-N'). `ORIGEN_REGISTRO` T (trámite) / R (saldo inicial capturado por RH, sin trámite) |
| `NOM_PERMISOS_JUSTIFICANTES` | `TIPO_INCIDENCIA` 1-7 (1-2 permisos → trámite 3; 3-7 justificantes → trámite 4), fechas, motivo, relevo |
| `NOM_INCAPACIDADES` | Creada y vacía; `TIPOENF` (FK `NOM_INCAPCAT`), `TIPOINCA` 1 inicial / 2 subsecuente, origen T/R |
| `NOM_DIAS_FESTIVOS` (+ `_OFICINAS`) | Festivos por tipo de empleado (B/C/T), sexo, oficina, horas (NULL = día completo) |
| `VS_TRAMITES_FORMATO` / `_DET` | Vistas del formato impreso por `ID_TRAMITE` (encabezado, firmas, desglose) |

Funciones (algunas las mantienen otras personas: **no modificarlas sin permiso**):
`F_SALDO_VACACIONES` (saldo vigente; toma el último renglón de `NOM_VACAEMP_M/D`), `F_SIMULA_VACACIONES`,
`FN_CONSULTA_VACACIONES` (días hábiles + reparto), `FN_TABLA_VACACIONES`, `FN_TRAMITES_CONSULTA_FIRMAS(noemp, depto)`,
`FN_DIAS_HABILES_EMP`.

Folio: `<SIGLAS>-NNNN-AAAA` (p. ej. VAC-0001-2026), consecutivo por tipo y año, `ANO` = año de la fecha de solicitud.
Viáticos tiene su propio consecutivo y tablas.

## 5. Backend (`CEA`)

Controladores en `CEA.WebAPI/Controllers/Nomina/` (sin `[Authorize]` en la mayoría; el usuario sale del claim `userid` y
la autorización fina se valida en los handlers o en el front):

- `NomTramites`: `Empleado/{noemp}/{ano}`, `Personal/{ano}`, `Capturados/{ano}`, `{id}`, `{id}/Detalle`, `{id}/Formato`,
  `PUT {id}/Vacaciones`, `PUT {id}/PermisoJustificante`, `POST {id}/Enviar`, `POST {id}/Cancelar`, `Firmas/{noemp}/{depto}`.
- `NomVacaciones`: `POST Solicitud`, `ConsultaVacaciones`, `SaldoVacaciones`, `SimulaVacaciones`.
- `NomPermisosJustificantes`: `POST Solicitud`.
- `NomTramitesFirmas`: `PorFirmar`, `POST Tramite/{id}/Firmar|Regresar`.
- `NomTramitesRh`: `{ano}`, `Tramite/{id}`, `Completar`, `Cancelar`, `PUT Vacaciones|PermisoJustificante`, `SaldosVacaciones`.
- `[Mayusculas]` (`CEA.WebAPI/Filters/MayusculasAttribute.cs`) solo en controladores de trámites y viáticos, nunca global.

Reglas en el backend: candado de saldo contra `F_SALDO_VACACIONES` al crear y al modificar vacaciones; traslapes entre
solicitudes; sin medios días; fecha de regreso = siguiente hábil si no se indica.

## 6. Front: dónde está cada cosa

- Captura por módulo: `src/modules/<id>/components/Captura*.tsx`; filas de la Bandeja: `src/modules/<id>/expediente.tsx`.
- Acciones por fila (Editar/Enviar/Cancelar): `src/modules/<id>/components/AccionesSolicitud.tsx` (copiado en los 3 módulos).
- Comunes: `shared/components/ModificarTramite.tsx`, `BitacoraTramite.tsx`, `FormatoTramite.tsx`; `shared/tramites.ts`
  (catálogos copiados de Oracle); `shared/server/cea.ts` (`ceaFetch` pasa a mayúsculas todo string de POST/PUT/PATCH).
- Formato impreso: `/formato/[idTramite]`.
- Gotcha dev: si `tsc` marca errores raros, borrar `.next/dev/types`. Un 404 sin mensaje suele ser ruta de Next, no backend.

## 7. Pendientes

**Probar en vivo (ya publicado):** editar en 1/98 (empleado y supervisor); Bandeja del supervisor (Mi personal a cargo /
Capturados por mí, incluye viáticos); candado de saldo al modificar; flujo completo de firmas; `/rh/saldos`.

**Consultar con RH:**
- Vacaciones que cruzan diciembre → enero (el trámite queda en el año de la solicitud).
- Festivos 2027 en el catálogo.
- ¿Se pueden pedir en diciembre días del periodo que se gana en enero? (hoy el candado lo impide).
- ¿Carga masiva de saldos iniciales desde Excel?
- ¿Quién más tendrá nivel 9? ¿RH autoriza en 98?

**Desarrollo:**
- Incapacidades (front + backend).
- Evidencia adjunta en permisos; "hoja firmada escaneada" (no hay dónde guardarla).
- Mover `AccionesSolicitud` a `shared`.
- ¿Relevo editable al editar?
- Avisar a quien mantiene `F_SIMULA_VACACIONES`: reparte periodos aún no ganados.
- Empleados con departamento que no existe en `DEPTOS` (aparecen sin depto en Saldos).
- Tabla de permisos por módulo en Oracle en lugar de columnas por sistema en `USUARIOS`.
