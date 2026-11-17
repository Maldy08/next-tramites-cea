import { auth } from "@/auth";
import { InicioViaticos } from "@/modules/viaticos/components/InicioViaticos";

export default async function ViaticosPage() {
  const session = await auth();
  return <InicioViaticos nombre={session?.user?.nombrecompleto ?? ""} />;
}
