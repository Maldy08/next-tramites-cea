@AGENTS.md

# Sistema de Trámites CEA

Portal único (Next.js 16) donde se van incorporando los subsistemas de trámites de la CEA.
Backend: proyecto C# compartido `CEA` (`../CEA`). Puerto 3004.
Reglas de negocio, roles, flujo de estatus, Oracle, endpoints y pendientes: [docs/CONTEXTO.md](docs/CONTEXTO.md) (leerlo al retomar).

## Arquitectura modular (respetarla siempre)

```
src/
  auth.ts / proxy.ts      login único; proxy.ts exige sesión y el permiso del módulo de la ruta
  shared/                 lo común: componentes del shell, adapters, Result, server/cea.ts, modulos.ts (tipos),
                          tramites.ts (NOM_TRAMITES: tipos, catálogos de tipo/estatus de los trámites de RH)
  modules/
    registry.ts           MODULOS = [...]: de aquí salen portal, "Generar Nuevo Trámite", permisos y control de acceso
    expedientes.ts        trámites de cada módulo como FilaExpediente (shared/expedientes.ts) para la Bandeja (/expedientes)
    capturas.ts           captura de cada módulo en el paso 3 de Generar Nuevo Trámite (/nuevo)
    <modulo>/             TODO lo del módulo: modulo.ts, components, lib, store, dtos, data-access.ts, server/
  app/                    SOLO cableado: páginas y route handlers delgados que importan del módulo
    (sistema)/layout.tsx  shell (sidebar + header)
    (sistema)/page.tsx    Tablero Principal: Catálogo Oficial de Trámites de Personal (una tarjeta por módulo)
    (sistema)/nuevo/      Generar Nuevo Trámite: 1) para quién, 2) tipo (módulos con captura), 3) captura del módulo
    (sistema)/expedientes/ Mis Trámites Solicitados: Bandeja de Trámites y Seguimiento (una tabla, pestaña por módulo)
    (sistema)/<modulo>/   páginas del módulo (+ layout propio si necesita contexto)
    api/<modulo>/...      `export { GET } from "@/modules/<modulo>/server/..."`
```

Reglas (las hace cumplir ESLint, ver eslint.config.mjs):
- `shared/` no importa de `modules/` ni de `app/`.
- Un módulo no importa de otro módulo, ni de `app/`, ni de `registry.ts`.
- Las APIs de un módulo viven bajo `/api/<id>/...` y empiezan con `usuarioDeModulo("<id>")` (shared/server/cea.ts).
  Excepción del portal: `/api/companeros` (shared/server/empleados.ts) = empleados con `SUPERVISOR_ID` = el usuario,
  solo para `TRAMITES_NIVEL 2 o 3` (supervisor, ver shared/empleados.ts). Los módulos dejan operar a esos empleados
  con `puedeOperarEmpleado`/`supervisaA` de shared/server/empleados.ts (viaticos/server/acceso.ts le suma su nivel 9).
  Otra excepción: `/api/personal/{tramites,capturados}` (shared/server/personal.ts), solo `TRAMITES_NIVEL 2`
  (`tienePersonalACargo`): en la Bandeja el supervisor elige "Ver trámites de": Mis trámites / su personal a cargo
  (`ExpedienteModulo.cargarPersonal`, o `cargar` por empleado) / "Capturados por mí" (`cargarCapturados`:
  NOM_TRAMITES.ID_EMPLEADO_SUPERVISOR o VIATICOS.NOEMP_CREA = él, p. ej. suplencia). Opera (enviar, cancelar, editar),
  no autoriza. El nivel 3 no tiene esta vista.
  Editar (vacaciones/permisos/justificantes): el empleado o su supervisor, solo en Creado (1) o Regresado (98), botón en
  `AccionesSolicitud` → modal compartido `shared/components/ModificarTramite.tsx` (el mismo de RH) → `/api/tramites/[idTramite]`
  (shared/server/tramites.ts) → CEA `NomTramites/{id}/Detalle|Vacaciones|PermisoJustificante` (comandos de RH con PorEmpleado).
- Los controladores de `CEA` NO tienen `[Authorize]`: la autorización fina (qué registros puede ver cada usuario) va en `modules/<id>/server/`.
- El estado de trabajo del módulo va en zustand con sessionStorage y llave `tramites-cea:<id>`.
- El **ejercicio fiscal es global** (`shared/store/useEjercicioStore`, selector en header y pie del sidebar). Los módulos lo leen de ahí y esperan `hidratado` antes de pedir datos; no deben tener su propio ejercicio.
- Paleta institucional en `globals.css`: vino `#691c32` = `primary-900`, dorado `#bc955c` = `secondary-500`. Sidebar `slate-900`, header degradado vino con borde dorado.
- El sidebar es fijo (perfil Empleado del mockup): MÓDULOS → Tablero Principal, Generar Nuevo Trámite; EXPEDIENTES → Mis Trámites Solicitados. Los módulos NO agregan opciones al sidebar: entran por el Catálogo del Tablero (`accionesRapidas` `principal`), `capturas.ts` (/nuevo) y `expedientes.ts`.
  Excepción: `TRAMITES_NIVEL 9` (administrador de RH, `esAdministradorRh` de shared/empleados.ts) ve además
  "Expedientes Institucionales CEA" (/rh/tramites, `modules/rh`, NO está en MODULOS): todos los trámites de NOM_TRAMITES
  (sin viáticos) en cualquier estatus, con Modificar / Autorizar / Cancelar (backend api/NomTramitesRh, que revisa el
  nivel con el usuario del token). proxy.ts protege /rh; sus APIs /api/rh usan `usuarioRh`, no `usuarioDeModulo`.
  También "Saldos de Vacaciones" (/rh/saldos): punto de partida de F_SALDO_VACACIONES por empleado (último periodo +
  días que le quedan + fecha de corte), guardado en NOM_VACAEMP_M con ORIGEN_REGISTRO 'R' (sin trámite) + un D.
  Autorizar de RH aplica en 2, 3 o 4 (ya enviado a firma, falten o no firmas) → 100; no en Creado (1) ni Regresado (98).
  Igual, `TRAMITES_NIVEL 3` (jefes y directores, `esFirmante`) ve "Trámites por Firmar" (/firmas, `modules/firmas`, NO
  en MODULOS): trámites en estatus 2 con VALIDA_1 = él o 3 con VALIDA_2 = él; Firmar (2→3, 3→4) o Regresar (→98, motivo).
  Backend api/NomTramitesFirmas; proxy.ts protege /firmas; sus APIs /api/firmas usan `usuarioFirmante`.
- `TRAMITES_NIVEL` es un rol EXACTO (nunca comparar con >=): 0/1 empleado, 2 supervisor, 3 firmante, 9 admin RH.
  Representar a otros = 2 y 3 (`esSupervisor`); validar/autorizar = 3 (sus firmas) y 9 (RH).

## Cómo agregar un trámite nuevo

1. `src/modules/<id>/modulo.ts` exportando un `ModuloTramite` (nombre, ruta, ícono, color, acciones rápidas — una `principal` —, `nivelDesdeLogin`).
2. Agregarlo a `MODULOS` en `src/modules/registry.ts`.
   Su tarjeta en el Catálogo del Tablero sale sola (nombre, descripción, ícono, color y acción `principal`).
   Su captura en `src/modules/capturas.ts` (paso 3 de /nuevo; sin ella no aparece en "Tipo de Trámite") y su
   `ExpedienteModulo` en `src/modules/expedientes.ts` (convierte sus registros a `FilaExpediente`; ver viaticos/expediente.tsx). Son componentes cliente del módulo que usan el
   ejercicio global y el empleado de la sesión. Van aparte de `registry.ts` porque ése lo importan auth/proxy sin React.
3. Páginas en `src/app/(sistema)/<id>/` y handlers en `src/app/api/<id>/`.
4. Si necesita un ícono nuevo: agregarlo a `IconoModulo` (shared/modulos.ts) y a `shared/components/Iconos.tsx`.

## Permisos

La sesión guarda `permisos: { [moduloId]: nivel }` calculado en el login con `nivelDesdeLogin`.
Hoy cada módulo lo saca de las columnas del usuario que devuelve `api/Auth/login` (p. ej. `viaticosNivel`).
Pendiente: una tabla de permisos por módulo en Oracle para no agregar columnas por cada trámite.

## Gotchas de despliegue (IIS + iisnode, Node 20)

- `web.config` con `<httpProtocol allowKeepAlive="false" />` (Checkpoint corta conexiones idle).
- `NEXT_PUBLIC_API_URL="/api/"` relativo (se hornea al compilar).
- Sin `instrumentation.ts` (Node 20); `undici@^6` para el keep-alive de `server.js`.
- Next 16: `params`/`searchParams` son Promise; `proxy.ts` en lugar de `middleware.ts`.
