import Image from "next/image";
import { Suspense } from "react";
import { FormLogin } from "./FormLogin";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-secondary-500" />
      <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full border border-secondary-500/20" />
      <div className="pointer-events-none absolute -left-28 bottom-10 h-64 w-64 rounded-full border border-white/10" />

      <section className="relative mx-auto flex min-h-full w-full max-w-[18rem] flex-col items-center justify-center sm:max-w-sm md:max-w-md">
        <div className="mb-7 text-center sm:mb-8">
          <Image
            src="/logo-blanco.png"
            alt="Logo CEA"
            width={220}
            height={90}
            className="mx-auto mb-4 h-auto w-52 sm:w-56"
            priority
          />
          <p className="text-sm font-medium text-white/90 sm:text-base">Sistema de Trámites</p>
        </div>

        <Suspense>
          <FormLogin titulo="Iniciar Sesión" />
        </Suspense>
      </section>
    </main>
  );
}
