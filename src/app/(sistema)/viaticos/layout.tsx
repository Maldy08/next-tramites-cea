import { auth } from "@/auth";
import { BarraContexto } from "@/modules/viaticos/components/BarraContexto";
import { ModalEmpleados } from "@/modules/viaticos/components/ModalEmpleados";
import { StoreHydrator } from "@/modules/viaticos/components/StoreHydrator";
import { esNivelAdmin } from "@/modules/viaticos/lib/reglas";

export default async function ViaticosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const esAdmin = esNivelAdmin(session?.user?.permisos?.viaticos);

  return (
    <>
      <StoreHydrator userId={session?.user?.idUsuario} />
      {esAdmin && <BarraContexto />}
      {children}
      {esAdmin && <ModalEmpleados />}
    </>
  );
}
