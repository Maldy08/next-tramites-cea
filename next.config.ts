import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En C:\...\repos hay otro package-lock.json; sin esto Turbopack toma esa carpeta como raíz.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Solo `next dev`: Next 16 bloquea los recursos de desarrollo (JS, HMR) pedidos desde otro origen que no sea
  // localhost. Sin esto, quien entra por la IP de este equipo no hidrata React y el login se envía como GET
  // nativo con usuario y contraseña en la URL.
  allowedDevOrigins: ["172.31.74.10"],
};

export default nextConfig;
