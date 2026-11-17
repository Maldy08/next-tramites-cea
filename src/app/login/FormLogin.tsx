"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { AlertCircle, LoaderCircle, LockKeyhole, UserRound, X } from "lucide-react";

interface Props {
  titulo: string;
}

export const FormLogin = ({ titulo }: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().required("Campo obligatorio"),
      password: Yup.string().required("Campo obligatorio"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email: values.email,
          password: values.password,
          callbackUrl,
        });

        if (res && !res.error) {
          router.push(callbackUrl);
        } else {
          handleAuthError(
            res?.code === "NoPermissions"
              ? "No tienes permisos para acceder a esta aplicación."
              : "Usuario y/o contraseña incorrectos."
          );
          setLoading(false);
        }
      } catch (error: unknown) {
        handleAuthError(error instanceof Error ? error.message : "Error desconocido");
        setLoading(false);
      }
    },
  });

  const handleAuthError = (msg: string) => {
    setError(msg);
    setOpen(true);
    setTimeout(() => setOpen(false), 5000);
  };

  return (
    <div className="relative flex w-full min-w-0 flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-lg border border-white/80 bg-white shadow-2xl shadow-primary-950/30">
        <div className="h-1 bg-secondary-500" />
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 text-center sm:px-8">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-800">Acceso institucional</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-950">{titulo}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Accede con tu usuario institucional para continuar.
          </p>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          {/* method="post": si el JS no llega a cargar, el envío nativo no pone las credenciales en la URL. */}
          <form className="space-y-5" method="post" onSubmit={formik.handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
                Usuario
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="email"
                  name="email"
                  autoComplete="username"
                  value={formik.values.email}
                  onChange={(e) => formik.setFieldValue("email", e.target.value.toUpperCase())}
                  onBlur={formik.handleBlur}
                  className={`block h-11 w-full rounded-md border bg-white px-10 text-sm uppercase text-slate-950 shadow-sm outline-none transition
                    placeholder:text-slate-400 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20
                    ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-slate-300"}`}
                />
              </div>
              <div className="min-h-[1.25rem]">
                {formik.touched.email && formik.errors.email && (
                  <div className="mt-1 text-xs font-medium text-red-600">{formik.errors.email}</div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                Contraseña
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  {...formik.getFieldProps("password")}
                  placeholder="********"
                  className={`block h-11 w-full rounded-md border bg-white px-10 text-sm text-slate-950 shadow-sm outline-none transition
                    placeholder:text-slate-400 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20
                    ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-slate-300"}`}
                />
              </div>
              <div className="min-h-[1.25rem]">
                {formik.touched.password && formik.errors.password && (
                  <div className="mt-1 text-xs font-medium text-red-600">{formik.errors.password}</div>
                )}
              </div>
            </div>

            {open && (
              <div className="relative animate-openmodal rounded-md border border-red-200 bg-red-50 px-4 py-3 pr-10 text-sm text-red-800">
                <AlertCircle className="absolute left-4 top-3.5 h-4 w-4" />
                <p className="pl-6 font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 rounded-sm text-red-700 transition hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  aria-label="Cerrar alerta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className={`flex h-11 w-full items-center justify-center gap-3 rounded-md bg-primary-900 px-5 text-sm font-semibold text-white shadow-sm transition
                hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 active:bg-primary-950
                ${loading ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {loading ? "Procesando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
