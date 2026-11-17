import { notFound } from "next/navigation";
import { CapturaViatico } from "@/modules/viaticos/components/CapturaViatico";

export default async function ModificarViaticoPage({
  params,
}: {
  params: Promise<{ oficina: string; ejercicio: string; noviat: string }>;
}) {
  const p = await params;
  const folio = { oficina: Number(p.oficina), ejercicio: Number(p.ejercicio), noviat: Number(p.noviat) };
  if (!Object.values(folio).every((n) => Number.isInteger(n) && n > 0)) notFound();

  return <CapturaViatico folio={folio} />;
}
