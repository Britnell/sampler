import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      include: ["**/react/*.tsx"],
    }),
    tailwind(),
    vue({
      include: ["**/vue/*.vue"],
    }),
  ],
  output: "hybrid",
  adapter: vercel(),
});
