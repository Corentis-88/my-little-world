import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/my-little-world/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["robots.txt", "assets/logo.svg"],
      manifest: {
        name: "My Little World",
        short_name: "Little World",
        description: "A little place made just for you.",
        theme_color: "#f7ead2",
        background_color: "#f7ead2",
        display: "standalone",
        orientation: "portrait",
        start_url: "/my-little-world/",
        scope: "/my-little-world/",
        icons: [
          {
            src: "/my-little-world/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  build: {
    target: "es2020"
  }
});
