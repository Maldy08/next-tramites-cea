import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { rutasNuevoTramite } from "@/modules/registry";
import { esAdministradorRh } from "@/shared/empleados";
import { EstadoSesion, Footer, Header, Sidebar, Toaster } from "@/shared/components";

// Shell común a todos los módulos: sidebar armado desde el registro, header institucional,
// ejercicio fiscal global y toasts.
export default async function SistemaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const u = session.user;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <EstadoSesion userId={u?.idUsuario} />
      <Sidebar rutasNuevoTramite={rutasNuevoTramite(u?.permisos)} administradorRh={esAdministradorRh(u?.tramitesNivel)} />
      {/* min-w-0 en toda la cadena flex: sin esto el contenido ancho desborda la página en móvil. */}
      <div className="flex h-screen min-w-0 flex-col lg:pl-72">
        <Header />
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          <Footer />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
