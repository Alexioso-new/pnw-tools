import { defineConfig } from "vite";

export default defineConfig({
  // wrangler butuh array plugins ini ada (walau kosong) supaya bisa
  // otomatis suntik plugin @cloudflare/vite-plugin saat deploy
  plugins: [],
  // akar proyek = folder ini
  root: ".",
  build: {
    outDir: "dist",
    // target browser yang agak lama agar HP jemaat tetap bisa
    target: "es2017",
    // minify agresif + hilangkan komentar legal
    // pakai minifier bawaan Rolldown (Oxc), bukan esbuild — esbuild sudah
    // tidak otomatis ter-install sebagai dependency di Rolldown-Vite
    minify: true,
    // jangan inline aset besar sebagai base64 (tetap file terpisah)
    assetsInlineLimit: 0,
    // laporkan ukuran chunk setelah gzip
    reportCompressedSize: true,
    // pisahkan vendor berat ke chunk sendiri supaya bisa di-cache lama
    rollupOptions: {
      output: {
        // Rolldown cuma support manualChunks bentuk function, bukan object.
        // Logic-nya sama persis dengan versi object sebelumnya.
        manualChunks(id) {
          if (id.includes("lottie.min.js")) {
            return "lottie";
          }
          if (
            id.includes("js/gsap/gsap.min.js") ||
            id.includes("js/gsap/CustomEase.min.js")
          ) {
            return "gsap";
          }
        },
      },
    },
  },
});