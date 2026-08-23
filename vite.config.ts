// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv, Plugin, PluginOption, UserConfig } from "vite";

const lovable = defineLovableConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "render-com",
    output: {
      dir: ".output",
      serverDir: ".output/server",
      publicDir: ".output/public",
    },
  },
  vite: {
    resolve: { tsconfigPaths: true },
    server: {
      proxy: {
        "/api": { target: "http://127.0.0.1:8787", changeOrigin: true },
        "/socket.io": {
          target: "http://127.0.0.1:8787",
          ws: true,
          changeOrigin: true,
        },
      },
    },
  },
});

function withoutViteTsconfigPaths(plugins: PluginOption[]): PluginOption[] {
  const kept: PluginOption[] = [];
  for (const plugin of plugins) {
    if (!plugin) continue;
    if (Array.isArray(plugin)) {
      kept.push(...withoutViteTsconfigPaths(plugin));
      continue;
    }
    if (plugin instanceof Promise) {
      kept.push(
        plugin.then((resolved) => {
          const list = withoutViteTsconfigPaths(Array.isArray(resolved) ? resolved : [resolved]);
          return list.length === 1 ? list[0]! : list;
        }),
      );
      continue;
    }
    if ((plugin as Plugin).name === "vite-tsconfig-paths") continue;
    kept.push(plugin);
  }
  return kept;
}

export default async function viteConfig(env: ConfigEnv): Promise<UserConfig> {
  const config = await lovable(env);
  return {
    ...config,
    resolve: { ...config.resolve, tsconfigPaths: true },
    plugins: withoutViteTsconfigPaths(config.plugins ?? []),
  };
}
