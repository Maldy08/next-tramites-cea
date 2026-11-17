import type { IconType } from "react-icons";
import {
  IoAirplaneOutline,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoFolderOpenOutline,
  IoHomeOutline,
  IoPeopleOutline,
  IoSettingsOutline,
  IoUmbrellaOutline,
} from "react-icons/io5";
import type { IconoModulo } from "@/shared/modulos";

const ICONOS: Record<IconoModulo, IconType> = {
  inicio: IoHomeOutline,
  viaticos: IoAirplaneOutline,
  vacaciones: IoUmbrellaOutline,
  capturar: IoCreateOutline,
  listado: IoFolderOpenOutline,
  documento: IoDocumentTextOutline,
  usuarios: IoPeopleOutline,
  ajustes: IoSettingsOutline,
};

export const Icono = ({ nombre, className }: { nombre: IconoModulo; className?: string }) => {
  const Componente = ICONOS[nombre] ?? IoDocumentTextOutline;
  return <Componente className={className} />;
};
