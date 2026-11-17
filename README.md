# Sistema de Trámites CEA (Next.js)

Portal único de trámites de la Comisión Estatal del Agua de Baja California. Cada trámite es un
módulo independiente (`src/modules/<id>`) registrado en `src/modules/registry.ts`; el portal, el menú
y el control de acceso se arman desde ese registro. Ver **CLAUDE.md** para la arquitectura y cómo agregar un trámite.

- **Stack:** Next.js 16 (App Router, Turbopack), React 19, next-auth v5 (JWT 12 h), Tailwind v4, formik + yup, zustand.
- **Backend:** el proyecto C# compartido `CEA`.
- **Puerto:** 3004 (`npm run dev` y `server.js`).

## Módulos

| Módulo | Ruta | Reemplaza a |
|---|---|---|
| Viáticos | `/viaticos` | `viaticos-cea-frontend` (React + Vite) |

## Configuración

```bash
cp .env.example .env   # y llenar NEXTAUTH_SECRET
npm install
npm run dev            # http://localhost:3004
```

## Módulo Viáticos

- Páginas: `/viaticos`, `/viaticos/capturar`, `/viaticos/capturar/[oficina]/[ejercicio]/[noviat]`, `/viaticos/listado`.
- APIs (`/api/viaticos/...`): `catalogos`, `empleados/[id]`, `empleados/departamento`, `registros` (POST/PUT),
  `registros/[ejercicio]/[oficina]/[noviat]`, `registros/empleado/[ejercicio]/[empleado]`, `pdf/[formato]/...`.
- Backend: `CEA.WebAPI/Controllers/Viaticos`.

### Reglas de negocio de viáticos (portadas del sistema anterior)

- **Importe** = tarifa diaria × días (salida y regreso incluidos). Tarifas en `src/modules/viaticos/lib/reglas.ts`
  (nivel < 17 / 17–19 / ≥ 20, dentro o fuera del estado).
- **Fuera del estado:** `idEstado > 2`, salvo las ciudades 1–6.
- **Partida:** 37501 "VIATICOS EN EL PAIS"; 37601 "VIATICOS FUERA DEL PAIS" si `idPais > 1`.
- **Folio:** `GetNoViat(ejercicio, oficina) + 1`, por oficina del empleado.
- **Origen:** oficinas 1, 2 y 5 → Mexicali; 3 → Tijuana.
- **Modificar:** solo estatus 1 (Creado). Estatus 9 (Cancelado) no imprime formatos.
- **Nivel 9 (`viaticosNivel`):** puede capturar o consultar a nombre de empleados de su departamento (`deptoComi`).

## Despliegue (IIS + iisnode)

Igual que bitácoras: `npm run build`, copiar el proyecto con `.next`, `node_modules`, `server.js` y `web.config`.
`server.js` ajusta el keep-alive hacia el backend (ver la nota sobre NAT al inicio del archivo).

Notas heredadas de bitácoras (ver memoria del proyecto):
- `web.config` lleva `<httpProtocol allowKeepAlive="false" />`: el Checkpoint corta conexiones idle y Next 16 se colgaba ~57 s.
- `NEXT_PUBLIC_API_URL="/api/"` es relativo a propósito: las `NEXT_PUBLIC_*` se hornean al compilar.
- El servidor usa Node 20: no usar `instrumentation.ts` y mantener `undici@^6`.
- Al desplegar, borrar `.next` en el servidor y copiarlo limpio.
