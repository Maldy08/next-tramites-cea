import type { Permisos } from "@/shared/modulos";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      token?: string;
      idUsuario?: number;
      idDepartamento?: number;
      nombrecompleto?: string;
      deptoDescripcion?: string;
      descripcionPuesto?: string;
      oficina?: number;
      municipio?: number;
      permisos?: Permisos;
      tramitesNivel?: number;
    };
  }

  interface User {
    token?: string;
    idUsuario?: number;
    idDepartamento?: number;
    nombrecompleto?: string;
    deptoDescripcion?: string;
    descripcionPuesto?: string;
    oficina?: number;
    municipio?: number;
    permisos?: Permisos;
    tramitesNivel?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    token?: string;
    idUsuario?: number;
    idDepartamento?: number;
    nombrecompleto?: string;
    deptoDescripcion?: string;
    descripcionPuesto?: string;
    oficina?: number;
    municipio?: number;
    permisos?: Permisos;
    tramitesNivel?: number;
  }
}
