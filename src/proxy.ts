import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { moduloDeRuta } from "@/modules/registry";
import { esAdministradorRh } from "@/shared/empleados";
import { nivelEnModulo } from "@/shared/modulos";

// Toda página (menos login) requiere sesión, y cada módulo requiere su permiso.
// Las APIs se protegen en su propio handler (shared/server/cea.ts → usuarioDeModulo).
export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (!req.auth) {
    const callbackUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  // Administración de RH (/rh/...): solo TRAMITES_NIVEL 9.
  if ((pathname === "/rh" || pathname.startsWith("/rh/")) && !esAdministradorRh(req.auth.user?.tramitesNivel)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const modulo = moduloDeRuta(pathname);
  if (modulo && nivelEnModulo(req.auth.user?.permisos, modulo.id) === null) {
    return NextResponse.redirect(new URL(`/?sinAcceso=${modulo.id}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
