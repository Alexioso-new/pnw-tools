#!/usr/bin/env node
/* ===================================================================
   HOSANA YOUTH TOOLS / PNW TOOLS - SERVER LOKAL (Mode Lokal)
   -------------------------------------------------------------------
   Menjalankan seluruh web dari laptop tanpa internet sama sekali.
   Menggantikan Firebase Realtime Database dengan:
     - penyimpanan JSON di berkas pnw-data.json
     - siaran perubahan realtime lewat SSE (Server-Sent Events)

   Cara pakai:  node pnw-server.js  [port]
   Tanpa npm install. Hanya butuh Node.js.
   =================================================================== */
"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");
var os = require("os");

var ROOT = __dirname;
var PORT = Number(process.argv[2] || process.env.PORT || 8080);
var DATA_FILE = path.join(ROOT, "pnw-data.json");

/* ------------------------- penyimpanan ------------------------- */
var store = {};
try {
  store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) || {};
  console.log("  Data dimuat dari pnw-data.json");
} catch (e) {
  store = {};
}

var saveTimer = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    var tmp = DATA_FILE + ".tmp";
    try {
      fs.writeFileSync(tmp, JSON.stringify(store));
      fs.renameSync(tmp, DATA_FILE);
    } catch (e) {
      console.error("  ! Gagal menyimpan data:", e.message);
    }
  }, 400);
}

function splitPath(p) {
  return String(p || "")
    .split("/")
    .filter(function (x) {
      return x !== "" && x !== "." && x !== "..";
    });
}

function readPath(p) {
  var parts = splitPath(p);
  var cur = store;
  for (var i = 0; i < parts.length; i++) {
    if (cur === null || typeof cur !== "object") return null;
    cur = cur[parts[i]];
    if (cur === undefined) return null;
  }
  return cur === undefined ? null : cur;
}

function writePath(p, value) {
  var parts = splitPath(p);
  if (!parts.length) {
    store = value && typeof value === "object" ? value : {};
    return;
  }
  var cur = store;
  for (var i = 0; i < parts.length - 1; i++) {
    var k = parts[i];
    if (cur[k] === null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  var last = parts[parts.length - 1];
  if (value === null || value === undefined) delete cur[last];
  else cur[last] = value;
}

/* ------------------------- siaran SSE -------------------------- */
var clients = [];
function broadcast(msg) {
  var payload = "data: " + JSON.stringify(msg) + "\n\n";
  clients = clients.filter(function (res) {
    try {
      res.write(payload);
      return true;
    } catch (e) {
      return false;
    }
  });
}

setInterval(function () {
  // denyut supaya koneksi tidak diputus perangkat/router
  clients = clients.filter(function (res) {
    try {
      res.write(": ping\n\n");
      return true;
    } catch (e) {
      return false;
    }
  });
}, 25000);

/* ------------------------ berkas statis ------------------------ */
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".webmanifest": "application/manifest+json",
};

/* Menyajikan index.html versi Mode Lokal:
   - SDK Firebase dibuang (mustahil dihubungi tanpa internet)
   - CSS dari CDN dibuang supaya halaman tidak menggantung menunggu timeout
   - shim js/local-mode.js disuntikkan sebelum js/app.js */
function buildLocalIndex() {
  var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  html = html.replace(
    /[ \t]*<script\b[^>]*src="https:\/\/www\.gstatic\.com\/firebasejs[^"]*"[^>]*><\/script>\s*/g,
    "",
  );
  html = html.replace(
    /[ \t]*<link\b[^>]*href="https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn-uicons\.flaticon\.com)[^"]*"[^>]*\/?>\s*/g,
    "",
  );
  html = html.replace(
    /[ \t]*<script\b[^>]*src="https:\/\/cdnjs\.cloudflare\.com[^"]*lottie[^"]*"[^>]*><\/script>\s*/g,
    '    <script defer src="./lottie.min.js"></script>\n',
  );

  var inject =
    '    <script>window.__PNW_LOCAL = true;</script>\n' +
    '    <script src="./js/local-mode.js"></script>\n';
  if (html.indexOf('src="./js/app.js"') >= 0) {
    html = html.replace(
      /[ \t]*<script src="\.\/js\/app\.js"><\/script>/,
      inject + '    <script src="./js/app.js"></script>',
    );
  } else {
    html = html.replace("</body>", inject + "</body>");
  }
  return html;
}

function serveStatic(req, res, urlPath) {
  var rel = splitPath(decodeURIComponent(urlPath)).join(path.sep);
  var file = path.join(ROOT, rel);
  if (file.indexOf(ROOT) !== 0) {
    res.writeHead(403);
    return res.end("Terlarang");
  }
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Tidak ditemukan: " + urlPath);
    }
    var type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* --------------------------- server ---------------------------- */
function readBody(req) {
  return new Promise(function (resolve) {
    var buf = "";
    req.on("data", function (c) {
      buf += c;
      if (buf.length > 12 * 1024 * 1024) req.destroy();
    });
    req.on("end", function () {
      try {
        resolve(JSON.parse(buf || "{}"));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, obj, code) {
  var body = JSON.stringify(obj);
  res.writeHead(code || 200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

var server = http.createServer(function (req, res) {
  var u = new URL(req.url, "http://localhost");
  var p = u.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  /* ---- API ---- */
  if (p === "/api/ping") {
    return sendJson(res, { ok: true, server: "pnw-local", time: Date.now() });
  }

  if (p === "/api/state") {
    return sendJson(res, store);
  }

  if (p === "/api/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    });
    res.write("retry: 2000\n\n");
    res.write("data: " + JSON.stringify({ type: "hello" }) + "\n\n");
    clients.push(res);
    req.on("close", function () {
      clients = clients.filter(function (c) {
        return c !== res;
      });
    });
    return;
  }

  if (p === "/api/set" && req.method === "POST") {
    return readBody(req).then(function (b) {
      writePath(b.path, b.value === undefined ? null : b.value);
      persist();
      broadcast({ type: "set", path: b.path, value: readPath(b.path), from: b.from || "" });
      sendJson(res, { ok: true });
    });
  }

  if (p === "/api/update" && req.method === "POST") {
    return readBody(req).then(function (b) {
      var cur = readPath(b.path);
      if (cur === null || typeof cur !== "object") cur = {};
      var v = b.value || {};
      Object.keys(v).forEach(function (k) {
        if (v[k] === null) delete cur[k];
        else cur[k] = v[k];
      });
      writePath(b.path, cur);
      persist();
      broadcast({ type: "set", path: b.path, value: readPath(b.path), from: b.from || "" });
      sendJson(res, { ok: true });
    });
  }

  if (p === "/api/incr" && req.method === "POST") {
    return readBody(req).then(function (b) {
      var cur = Number(readPath(b.path) || 0);
      var next = cur + Number(b.delta || 0);
      if (next < 0) next = 0;
      writePath(b.path, next);
      persist();
      broadcast({ type: "set", path: b.path, value: next, from: b.from || "" });
      sendJson(res, { ok: true, value: next });
    });
  }

  /* ---- berkas ---- */
  if (p === "/" || p === "/index.html") {
    try {
      var html = buildLocalIndex();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      return res.end(html);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("index.html tidak terbaca: " + e.message);
    }
  }

  // service worker sengaja dimatikan di Mode Lokal
  if (p === "/sw.js") {
    res.writeHead(200, { "Content-Type": MIME[".js"], "Cache-Control": "no-store" });
    return res.end("/* Mode Lokal: service worker dinonaktifkan */\n");
  }

  return serveStatic(req, res, p);
});

/* --------------------------- start ----------------------------- */
function lanAddresses() {
  var out = [];
  var ifs = os.networkInterfaces();
  Object.keys(ifs).forEach(function (name) {
    (ifs[name] || []).forEach(function (a) {
      if (a.family === "IPv4" && !a.internal) out.push({ name: name, address: a.address });
    });
  });
  return out;
}

server.on("error", function (e) {
  if (e.code === "EADDRINUSE") {
    console.error("\n  ! Port " + PORT + " sedang dipakai program lain.");
    console.error("    Coba port lain, misalnya:  node pnw-server.js 8090\n");
  } else {
    console.error("\n  ! Server gagal jalan:", e.message, "\n");
  }
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", function () {
  var addrs = lanAddresses();
  console.log("");
  console.log("  ============================================");
  console.log("   HOSANA YOUTH TOOLS - SERVER LOKAL AKTIF");
  console.log("  ============================================");
  console.log("");
  console.log("   Di laptop ini      :  http://localhost:" + PORT);
  if (addrs.length) {
    console.log("");
    console.log("   Bagikan alamat ini ke yang lain:");
    addrs.forEach(function (a) {
      console.log("     http://" + a.address + ":" + PORT + "   (" + a.name + ")");
    });
  } else {
    console.log("");
    console.log("   ! Belum tersambung ke jaringan apa pun.");
    console.log("     Sambungkan laptop ke hotspot dulu, lalu jalankan ulang.");
  }
  console.log("");
  console.log("   Data tersimpan di  :  pnw-data.json");
  console.log("   Hentikan server    :  tekan Ctrl + C");
  console.log("");
});
