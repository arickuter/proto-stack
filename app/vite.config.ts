/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { wasp } from "wasp/client/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [wasp(), tailwindcss()],
  server: {
    open: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
  },
});
