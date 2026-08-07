// Konfigurasi Vite untuk build produksi HOSANA YOUTH TOOLS.
// Jalankan di komputer lokal (butuh internet untuk npm install):
//   npm install
//   npm run build    -> menghasilkan folder dist/ yang siap deploy
//
// CATATAN: proyek ini memakai script biasa (bukan ES module) yang saling
// bergantung lewat urutan <script defer> di index.html. Karena itu build
// memakai pendekatan "minify + salin", BUKAN bundling jadi satu file,
// supaya urutan eksekusi dan variabel global (firebase, lottie, gsap,
// window.PNWRec, window.PNWGuide, window.PNWProjector) tetap utuh.
import { defineConfig } from "vite";

export default defineConfig({
  // akar proyek = folder ini
  root: ".",
  build: {
    outDir: "dist",
    // target browser yang agak lama agar HP jemaat tetap bisa
    target: "es2017",
    // minify agresif + hilangkan komentar legal
    minify: "esbuild",
    // jangan inline aset besar sebagai base64 (tetap file terpisah)
    assetsInlineLimit: 0,
    // laporkan ukuran chunk setelah gzip
    reportCompressedSize: true,
    // pisahkan vendor berat ke chunk sendiri supaya bisa di-cache lama
    rollupOptions: {
      output: {
        manualChunks: {
          lottie: ["lottie.min.js"],
          gsap: ["js/gsap/gsap.min.js", "js/gsap/CustomEase.min.js"],
        },
      },
    },
  },
});
