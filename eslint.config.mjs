import fs from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Límites de la arquitectura modular (ver CLAUDE.md):
//  - shared/ no depende de ningún módulo ni de app/.
//  - un módulo no importa de otro módulo ni de app/ (solo de shared/ y de sí mismo).
const modulos = fs
  .readdirSync("src/modules", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const limitesModulos = modulos.map((modulo) => ({
  files: [`src/modules/${modulo}/**`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/app/*", ...modulos.filter((m) => m !== modulo).map((m) => `@/modules/${m}/*`), "@/modules/registry"],
            message: `El módulo "${modulo}" solo puede importar de @/shared y de @/modules/${modulo}.`,
          },
        ],
      },
    ],
  },
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/modules/*", "@/app/*"], message: "shared/ no puede depender de módulos ni de app/." }] },
      ],
    },
  },
  ...limitesModulos,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
