import { auth } from "@/auth";
import { BotonMenu } from "./BotonMenu";
import { ButtonHeader } from "./ButtonHeader";
import { SelectorEjercicio } from "./SelectorEjercicio";

const sistema = process.env.NOMBRE_SISTEMA ?? "Sistema de Trámites";

/** Header institucional: franja vino con borde dorado, ejercicio activo y usuario. */
export const Header = async () => {
  const session = await auth();
  const u = session?.user;

  return (
    <header className="z-30 shrink-0 border-b-4 border-secondary-500 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800 text-white shadow-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BotonMenu />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="truncate text-base font-black leading-tight tracking-tight sm:text-lg">Comisión Estatal del Agua</h1>
              <SelectorEjercicio variante="pill" />
            </div>
            <p className="hidden truncate text-[11px] font-medium text-secondary-200 sm:block">
              Gobierno del Estado de Baja California · {sistema}
            </p>
          </div>
        </div>
        <ButtonHeader
          user={u?.name ?? ""}
          nombre={u?.nombrecompleto ?? ""}
          puesto={u?.descripcionPuesto ?? ""}
          departamento={u?.deptoDescripcion ?? ""}
        />
      </div>
    </header>
  );
};
