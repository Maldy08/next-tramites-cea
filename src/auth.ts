import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";
import { permisosDesdeLogin } from "@/modules/registry";
import type { Permisos, UserDataLogin } from "@/shared/modulos";

// Igual que la duración del JWT del backend CEA (DurationInMinutes = 720).
const SESSION_MAX_AGE = 60 * 60 * 12;

/** Credenciales válidas pero sin acceso al portal (USUARIOS.TRAMITES <> 1). FormLogin lo lee de `res.code`. */
class NoPermissions extends CredentialsSignin {
  code = "NoPermissions";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const user = encodeURIComponent(String(credentials.email ?? ""));
        const password = encodeURIComponent(String(credentials.password ?? ""));
        const { data } = await axios.post(`${process.env.URL_API_CEA}Auth/login?user=${user}&password=${password}`);

        if (!data?.token || !data.userData) return null;

        const u = data.userData as UserDataLogin;
        if (u.tramites !== 1) throw new NoPermissions();
        return {
          id: String(u.usuario),
          token: data.token,
          name: data.username,
          email: data.email,
          idUsuario: u.noEmpleado,
          idDepartamento: u.depto,
          nombrecompleto: u.nombreCompleto,
          deptoDescripcion: u.deptoDescripcion,
          descripcionPuesto: u.descripcion,
          oficina: u.oficina,
          municipio: u.municipio,
          permisos: permisosDesdeLogin(u),
          tramitesNivel: u.tramitesNivel ?? 0,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.COOKIE_SECURE === "true",
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.token = user.token;
        token.idUsuario = user.idUsuario;
        token.idDepartamento = user.idDepartamento;
        token.nombrecompleto = user.nombrecompleto;
        token.deptoDescripcion = user.deptoDescripcion;
        token.descripcionPuesto = user.descripcionPuesto;
        token.oficina = user.oficina;
        token.municipio = user.municipio;
        token.permisos = user.permisos;
        token.tramitesNivel = user.tramitesNivel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.token = token.token as string | undefined;
        session.user.idUsuario = token.idUsuario as number | undefined;
        session.user.idDepartamento = token.idDepartamento as number | undefined;
        session.user.nombrecompleto = token.nombrecompleto as string | undefined;
        session.user.deptoDescripcion = token.deptoDescripcion as string | undefined;
        session.user.descripcionPuesto = token.descripcionPuesto as string | undefined;
        session.user.oficina = token.oficina as number | undefined;
        session.user.municipio = token.municipio as number | undefined;
        session.user.permisos = (token.permisos ?? {}) as Permisos;
        session.user.tramitesNivel = token.tramitesNivel as number | undefined;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/`;
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
