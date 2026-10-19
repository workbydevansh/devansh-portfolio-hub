import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party source (Bklit UI charts, Kokonut UI), kept as
    // upstream ships it so future updates stay a clean copy.
    "src/components/charts/**",
    "src/components/kokonutui/**",
  ]),
]);

export default eslintConfig;
