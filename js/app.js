/* PNW-FILE-GUIDE
   js/app.js — inti aplikasi (daftar lagu, transpose, render chord, menu, dsb).
   Butuh: firebase (dimuat index.html), window.PNWMotion (js/motion.js), window.PNWRec (js/recorder.js).
   Fungsi penting: render(), transposeToken(), chordQuality(), buildCopyText(), initLottieIcons().
   Firebase RTDB: pujianYouth/songs, /songBank, /config/locked, /live.
 */

(function () {
  // ================= KONFIGURASI ONLINE (FIREBASE) =================
  // Biarkan KOSONG = mode lokal (edit hanya tersimpan di perangkat ini).
  // Isi dari Firebase Console (Project settings) + aktifkan Realtime Database
  // agar semua perubahan tampil real-time di semua perangkat.
  const firebaseConfig = {
    apiKey: "AIzaSyAj9FTRA3y_ZJQ3si-VU6doIV7OttTOpeM",
    authDomain: "chord-youth-hosana.firebaseapp.com",
    databaseURL:
      "https://chord-youth-hosana-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chord-youth-hosana",
    storageBucket: "chord-youth-hosana.firebasestorage.app",
    messagingSenderId: "692806682904",
    appId: "1:692806682904:web:dc50c1c97ea5c72797f66d",
  };
  // ==== FORM IZIN (Google Sheet) ==============================
  // Tempel URL Web App dari Google Apps Script kamu di antara tanda kutip.
  // Kalau kosong, form Izin akan meminta agar dikonfigurasi dulu.
  const IZIN_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxybNV64J0u8VrzeACTyAAB-KAbx67fKlzCY0fIXowsJyfp1gCKSUETKy9r3bVaPCIV/exec";
  // ================================================================
  // Data lagu bawaan (dipakai saat pertama kali dibuka / belum ada data tersimpan).
  const defaultSongs = [
    {
      id: "ada-kuasa",
      num: 1,
      title: "Ada Kuasa (Symphony Worship)",
      originalKey: "F",
      source: "Revisi PDF JRChord - Key F",
      lines: [
        "Intro :",
        "Bb F C Dm",
        "Bb F C",
        "Bb F C Dm",
        "Bb F C",
        "Bait :",
        "Bb F C Dm",
        "Nama-Nya Tuhanku, Menara Yang Teguh",
        "Bb F C",
        "Kota Benteng Perlindunganku",
        "Bb F C Dm",
        "Allah Yang Perkasa, Dia Bapa Yang Kekal",
        "Bb F C",
        "Gunung Batu Kes'lamatanku",
        "Reff :",
        "F F/A Bb F",
        "Engkau Yang Termulia Di Bumi Di Surga",
        "Dm Bb F",
        "Termahsyur, Perkasa Selamanya",
        "Dm C/E F Bb F/A",
        "Engkau Yang Berkua - sa Di Dalam S'gala Hal",
        "Gm C F",
        "Ada Kuasa Dalam Nama Yesusku",
        "Musik :",
        "Cm F Cm F",
        "Cm F Cm F",
        "Bridge :",
        "Cm F",
        "Nama Di Atas Segala Nama",
        "Cm F",
        "Nama Yang T'lah Membebaskanku",
        "Bb F/A Bb Dm",
        "S'gala Kuasa Tunduk Pada Nama Itu",
        "Bb Gm C",
        "Yesus Tuhan Segala Tuhan",
        "Cm F",
        "Nama Di Atas Segala Nama",
        "Cm F",
        "Nama Yang T'lah Membebaskanku",
        "Bb F/A Bb Dm",
        "S'gala Kuasa Tunduk, Pada Nama Itu",
        "Bb Gm C",
        "Yesus Raja Segala Raja",
      ],
    },
    {
      id: "di-badai",
      num: 2,
      title: "Di Badai Topan Dunia",
      originalKey: "G",
      source:
        "Chordify: Key G, chords D G C Bm. Susunan lirik dibuat ringkas untuk bacaan.",
      lines: [
        "Bait 1 :",
        "G",
        "Di badai topan dunia",
        "D",
        "Tuhanlah Perlindunganmu",
        "G",
        "Kendati goncang semesta",
        "D G",
        "Tuhanlah Perlindunganmu",
        "Reff :",
        "C G Bm",
        "Ya, Yesus Gunung Batu di dunia",
        "C D G",
        "Di dunia, di dunia",
        "C G Bm",
        "Ya, Yesus Gunung Batu di dunia",
        "C D G",
        "Tempat berlindung yang teguh",
        "Bait 2 :",
        "G",
        "Baik siang maupun malam g'lap",
        "D",
        "Tuhanlah Perlindunganmu",
        "G",
        "Niscaya takutmu lenyap",
        "D G",
        "Tuhanlah Perlindunganmu",
        "Reff :",
        "C G Bm",
        "Ya, Yesus Gunung Batu di dunia",
        "C D G",
        "Di dunia, di dunia",
        "C G Bm",
        "Ya, Yesus Gunung Batu di dunia",
        "C D G",
        "Tempat berlindung yang teguh",
      ],
    },
    {
      id: "tiada-terukur",
      num: 3,
      title: "Tiada Terukur (Welyar Kauntu)",
      originalKey: "D",
      source:
        "Chordify GSJS Worship Glady Febe: Key D, chords A D G Bm. Progression disusun dari chart umum dan ditranspose ke D.",
      lines: [
        "Bait :",
        "D G",
        "Tiada Terukur Besar",
        "A D G A",
        "Kasih SetiaMu Tuhan",
        "D",
        "Panjang Dan Lebarnya",
        "G A Bm",
        "Melebihi Lautan",
        "Em A",
        "Jauh Tinggi Mengatasi Langit",
        "Em A",
        "Dalamnya Tak Dapat Kuselami",
        "Em D/F#",
        "Kasih SetiaMu",
        "G A Bm",
        "Besar Selamanya",
        "Em D/F#",
        "Kasih SetiaMu",
        "G A D",
        "Besar Selamanya",
        "Reff :",
        "A D A D",
        "Hatiku Bersyukur Jiwaku Memuji",
        "A D",
        "Mulutku Pun Bersorak",
        "A G D/F# Em",
        "Memuji Engkau Yesus",
        "A D A D",
        "Ajaib PerbuatanMu Besar AnugrahMu",
        "A",
        "Tak Kan Berhenti",
        "D A G D/F# Em",
        "Ku Memuji NamaMu",
      ],
    },
    {
      id: "kami-perlu",
      num: 4,
      title: "Kami Perlu Kau Tuhan (Nikita)",
      originalKey: "G",
      source: "Revisi PDF JRChord - Key G",
      lines: [
        "Bait :",
        "G C/G",
        "Ke Manakah Kami Mencari",
        "D/F# C/G G",
        "Kasih Seja - ti",
        "G C/G",
        "Ke Manakah Kami Berseru",
        "B Em",
        "Saat Badai Datang Menderu",
        "C",
        "Yang Kami Tahu",
        "Bm Em",
        "Hanya Kau Yang Mampu",
        "Am D",
        "Pulihkan S’gala Sesuatu",
        "G C/G",
        "Ke Manakah Kami Mencari",
        "D/F# C/G G",
        "Kasih Seja - ti",
        "G C/G",
        "Ke Manakah Kami Berseru",
        "B Em",
        "Saat Badai Datang Menderu",
        "C",
        "Yang Kami Tahu",
        "Bm Em",
        "Hanya Kau Yang Mampu",
        "F C/E D",
        "Pulihkan S’gala Sesuatu",
        "Reff :",
        "G G/B C",
        "Kami Perlukan KeajaibanMu",
        "G/B Am A/C# D",
        "Kami Butuhkan Sentuhan TanganMu",
        "G G/B C G/B",
        "Kami Tak Dapat Berjalan Sendiri",
        "Am D G",
        "Kami Perlu Kau Tuhan",
      ],
    },
    {
      id: "ku-tak-akan-menyerah",
      num: 5,
      title: "Ku Tak Akan Menyerah (Medley)",
      originalKey: "F",
      source: "Chart user - Key F, modulasi ke G di Chorus 2",
      lines: [
        "Intro :",
        "F C Gm D | Bb F Bb C | F Bb F .",
        "Verse 1 :",
        "F Am",
        "Dalam s'gala perkara",
        "A Dm C",
        "Tuhan punya rencana",
        "Bb C/Bb Am",
        "yang lebih besar dari",
        "A Dm G C",
        "semua yang terpikirkan.",
        "Verse 2 :",
        "F C/E",
        "Apapun yang kau perbuat",
        "A C Dm C",
        "tak ada maksud jahat",
        "Bb C/Bb Am",
        "s'bab itu kulaku-kan",
        "A Dm G C",
        "semua denganMu Tuhan.",
        "Chorus :",
        "F C/E Gm Dm C Bb",
        "Ku tak akan menyerah, pada apapun ju-ga",
        "Am Gm C",
        "sebelum kucoba semua yang kubisa",
        "F C Gm Dm C Bb",
        "Tetapi ku berserah kepada kehen-dakMu",
        "F/A Gm C F",
        "hatiku percaya Tuhan punya rencana.",
        "Instrumen :",
        "Bb Dm F Gm | Am . Bb .",
        "Verse 2 :",
        "(ulang Verse 2)",
        "Chorus :",
        "(ulang Chorus)",
        "Interlude :",
        "Bb C Am Dm | Eb . Bb . | F . C .",
        "Chorus :",
        "(ulang Chorus)",
        "Transition :",
        "Dm D",
        "Chorus 2 (Modulasi ke G) :",
        "G D Am Em D C",
        "Ku tak akan menyerah, pada apapun ju-ga",
        "Bm Am D",
        "sebelum kucoba semua yang kubisa",
        "G D Am Em F C",
        "Tetapi ku berserah kepada kehen-dakMu",
        "G/B Am D G",
        "Hatiku percaya Tuhan punya rencana.",
        "Ending :",
        "C G/B Am D G",
        "Hatiku percaya Tuhan punya rencana.",
        "Outro :",
        "C Bm Am G",
      ],
    },
  ];
  const storageKey = "pujianYouthChordSongs.v3";
  const bankKey = "pujianYouthSongBank.v1";
  let songs = loadSongs();
  let bankSongs = loadBank();
  // --- Tabel nada & util untuk transpose chord ---
  const keyList = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];
  const noteToIndex = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };
  const sharpNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const flatNames = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];
  const sharpKeys = new Set(["G", "D", "A", "E", "B", "F#", "C#"]);
  const sectionWords =
    /^(Intro|Bait|Verse|Reff|Refrain|Chorus|Pre-?Chorus|Post-?Chorus|Breakdown|Modulation|Overtune|Key ?Change|Bridge|Musik|Instrumen(tal)?|Interlude|Transition|Transisi|Solo|Ending|Outro|Outtro|Coda)(\s|:|$)/i;
  let selectedSongId = songs[0]?.id || "song1";
  let selectedKey = songs[0]?.originalKey || "C";
  let numberMode = false;
  const degreeNames = [
    "1",
    "b2",
    "2",
    "b3",
    "3",
    "4",
    "b5",
    "5",
    "b6",
    "6",
    "b7",
    "7",
  ];
  const songButtons = document.getElementById("songButtons"),
    keyButtons = document.getElementById("keyButtons"),
    content = document.getElementById("content");
  function loadSongs() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaultSongs));
  }
  function loadBank() {
    try {
      const raw = localStorage.getItem(bankKey);
      if (raw) {
        var v = JSON.parse(raw);
        if (Array.isArray(v)) return v.filter(Boolean);
      }
    } catch (e) {}
    return [];
  }
  function ensureBankId(s) {
    if (!s.bankId)
      s.bankId =
        "bank-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
    return s.bankId;
  }
  function mirrorToBank(song) {
    var bid = ensureBankId(song);
    var master = {
      bankId: bid,
      title: song.title,
      num: song.num || "",
      originalKey: song.originalKey,
      source: song.source || "",
      youtube: song.youtube || "",
      bg: song.bg || "",
      lines: (song.lines || []).slice(),
    };
    var i = -1;
    for (var k = 0; k < bankSongs.length; k++) {
      if (bankSongs[k] && bankSongs[k].bankId === bid) {
        i = k;
        break;
      }
    }
    if (i >= 0) {
      master.cat = bankSongs[i].cat || song.cat || "other";
      bankSongs[i] = master;
    } else {
      master.cat = song.cat || "other";
      bankSongs.push(master);
    }
  }
  // ============ v62: PENGAMAN ANTI-TIMPA-KOSONG ============
  // Masalah lama: data kosong dari perangkat lain bisa menimpa Song Bank
  // di cloud sehingga seluruh lagu hilang. Sekarang setiap penerimaan /
  // pengiriman data melewati pemeriksaan jumlah minimum.
  var BANK_HWM_KEY = "pujianYouthBankHWM.v1";
  var SONGS_HWM_KEY = "pujianYouthSongsHWM.v1";
  function hwmGet(k) {
    try {
      return parseInt(localStorage.getItem(k) || "0", 10) || 0;
    } catch (e) {
      return 0;
    }
  }
  function hwmSet(k, n) {
    try {
      if (n > hwmGet(k)) localStorage.setItem(k, String(n));
    } catch (e) {}
  }
  function bankMarkHadData() {
    hwmSet(BANK_HWM_KEY, (bankSongs || []).length);
  }
  function songsMarkHadData() {
    hwmSet(SONGS_HWM_KEY, (songs || []).length);
  }
  // true = boleh diterapkan, false = tolak
  function guardAccept(incomingLen, localLen, hwmKey, label) {
    var hwm = Math.max(hwmGet(hwmKey), localLen);
    if (incomingLen === 0 && hwm > 0) {
      try {
        toast(
          "Data " +
            label +
            " kosong dari server ditolak - data di perangkat ini dipertahankan.",
          "error",
          6000,
        );
      } catch (e) {}
      return false;
    }
    if (hwm >= 5 && incomingLen > 0 && incomingLen < Math.ceil(hwm * 0.6)) {
      try {
        backupForce("menyusut: " + label);
      } catch (e) {}
      try {
        toast(
          label +
            " menyusut dari " +
            hwm +
            " ke " +
            incomingLen +
            " lagu. Cadangan otomatis dibuat.",
          "info",
          6000,
        );
      } catch (e) {}
    }
    return true;
  }
  // Boleh mengirim daftar kosong ke cloud? Hanya kalau memang belum pernah ada isi.
  function guardPush(arr, hwmKey, label) {
    var n = (arr || []).length;
    if (n > 0) return true;
    if (hwmGet(hwmKey) > 0) {
      try {
        console.warn("[v62] batal mengirim " + label + " kosong ke server");
      } catch (e) {}
      return false;
    }
    return true;
  }
  function saveBank() {
    try {
      localStorage.setItem(bankKey, JSON.stringify(bankSongs));
    } catch (e) {}
    bankMarkHadData();
    if (cloudReady && bankRef && !applyingRemote) {
      if (!guardPush(bankSongs, BANK_HWM_KEY, "Song Bank")) return;
      try {
        bankRef.set(bankSongs);
      } catch (e) {}
    }
  }
  function seedBankFromSongs() {
    if (bankSongs.length) return;
    songs.forEach(mirrorToBank);
    saveBank();
    if (cloudReady && dbRef && !applyingRemote) {
      try {
        dbRef.set(songs);
      } catch (e) {}
    }
    refreshLibrary();
  }
  // --- Sinkronisasi online (Firebase) + penyimpanan lokal ---
  let dbRef = null,
    bankRef = null,
    cloudReady = false,
    applyingRemote = false;
  function setCloudPill(t) {
    const p = document.getElementById("cloudPill");
    if (p) p.textContent = t;
  }
  function initCloud() {
    if (!firebaseConfig.databaseURL || typeof firebase === "undefined") {
      setCloudPill("Mode lokal (perangkat ini)");
      // v3.2 - status admin HARUS tetap dipulihkan walau Firebase gagal
      // dimuat (offline / CDN diblokir). Tanpa ini pengurus kehilangan
      // hak edit padahal sudah login.
      initAuthLock();
      return;
    }
    try {
      firebase.initializeApp(firebaseConfig);
      try {
        if (window.PNWLog) window.PNWLog.ready(firebase, { version: "3.9.2" });
      } catch (e) {}
      dbRef = firebase.database().ref("pujianYouth/songs");
      bankRef = firebase.database().ref("pujianYouth/songBank");
      bankRef.on("value", function (snap) {
        var val = snap.val();
        if (val) {
          var arr = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.values(val).filter(Boolean);
          // v62 - tolak data kosong dari perangkat lain
          if (
            !guardAccept(
              arr.length,
              (bankSongs || []).length,
              BANK_HWM_KEY,
              "Song Bank",
            )
          ) {
            if ((bankSongs || []).length && !applyingRemote) {
              try {
                bankRef.set(bankSongs);
              } catch (e) {}
            }
            return;
          }
          bankSongs = arr;
          bankMarkHadData();
          try {
            localStorage.setItem(bankKey, JSON.stringify(bankSongs));
          } catch (e) {}
          refreshLibrary();
          try {
            backupMaybe("bank");
          } catch (e) {}
        } else {
          setTimeout(seedBankFromSongs, 700);
        }
      });
      initAuthLock();
      initSpectate();
      cloudReady = true;
      // v2.4 - pasang sinkronisasi jadwal sejak awal, bukan hanya saat
      // halaman jadwal dibuka, supaya perubahan orang lain langsung masuk.
      try {
        initScheduleCloud();
      } catch (e) {}
      setCloudPill("Menghubungkan...");
      var _syncToast = toast("Menyinkronkan data...", "loading", 0);
      dbRef.on(
        "value",
        (snap) => {
          const val = snap.val();
          if (val) {
            const arr = Array.isArray(val)
              ? val.filter(Boolean)
              : Object.values(val);
            if (arr.length) {
              applyingRemote = true;
              songs = arr;
              try {
                localStorage.setItem(storageKey, JSON.stringify(songs));
              } catch (e) {}
              if (!songs.find((s) => s.id === selectedSongId)) {
                selectedSongId = songs[0].id;
                selectedKey = songs[0].originalKey;
              }
              makeButtons();
              render();
              applyingRemote = false;
              try {
                backupMaybe("songs");
              } catch (e) {}
            }
            setCloudPill("Online - tersinkron");
            if (_syncToast) {
              _syncToast.close();
              _syncToast = null;
            }
          } else {
            dbRef.set(songs);
            setCloudPill("Online - tersinkron");
            if (_syncToast) {
              _syncToast.close();
              _syncToast = null;
            }
          }
        },
        (err) => {
          console.error(err);
          cloudReady = false;
          dbRef = null;
          setCloudPill("Gagal konek - mode lokal");
          if (_syncToast) {
            _syncToast.close();
            _syncToast = null;
          }
        },
      );
    } catch (e) {
      console.error(e);
      setCloudPill("Mode lokal (perangkat ini)");
    }
  }
  var isAdmin = false,
    localAdmin = false,
    fbAdmin = false,
    locked = false,
    izinFormOpen = true,
    authRef = null,
    lockRef = null,
    izinRef = null,
    notesRef = null,
    noteOvRef = null,
    likesRef = null,
    noteLikes = {};
  var OWNER_UID = "l9U1ktYog2X3vSA81JdsjHln5qu1";
  var reqRef = null,
    pendingApproval = false,
    _reqInit = false;
  // ==== AKUN PENGURUS (login username & password) ====
  // Tambah / ubah akun di sini lalu bagikan ke pengurus.
  // Catatan: ini keamanan tingkat kenyamanan (client-side), bukan enkripsi.
  var LOCAL_ACCOUNTS = [
    { u: "admin", p: "hosana2026", name: "Admin Utama" },
    { u: "pengurus", p: "pnw2026", name: "Pengurus" },
  ];
  function findLocalAccount(u, p) {
    var uu = (u || "").trim().toLowerCase();
    for (var i = 0; i < LOCAL_ACCOUNTS.length; i++) {
      if (
        (LOCAL_ACCOUNTS[i].u || "").toLowerCase() === uu &&
        String(LOCAL_ACCOUNTS[i].p) === String(p)
      )
        return LOCAL_ACCOUNTS[i];
    }
    return null;
  }
  function recomputeAdmin() {
    isAdmin = localAdmin || fbAdmin;
    try {
      if (window.PNWLog) window.PNWLog.setContext({ isAdmin: isAdmin });
    } catch (e) {}
    applyAdminUI();
    applyIzinUI();
    updatePendingUI();
  }
  function canEdit() {
    return isAdmin || !locked;
  }
  function applyAdminUI() {
    document.body.classList.toggle("noEdit", !canEdit());
    var panel = document.getElementById("adminPanel");
    if (panel) panel.hidden = !isAdmin;
    try {
      initBackupUI();
    } catch (e) {}
    var loginBtn = document.getElementById("adminLoginBtn");
    if (loginBtn) loginBtn.style.display = isAdmin ? "none" : "";
    var schedSec = document.getElementById("schedMenuSec");
    if (schedSec) schedSec.style.display = "";
    var lt = document.getElementById("lockToggle");
    if (lt) lt.checked = locked;
    var ls = document.getElementById("lockStatus");
    if (ls)
      ls.textContent = locked
        ? isAdmin
          ? "Status: terkunci. Hanya admin yang bisa mengubah daftar lagu."
          : "Daftar lagu sedang dikunci oleh admin."
        : "Status: terbuka. Semua orang bisa mengubah daftar lagu.";
  }
  function initAuthLock() {
    try {
      var savedU = localStorage.getItem("ptAdminUser") || "";
      if (savedU) {
        var accOk = false;
        for (var i = 0; i < LOCAL_ACCOUNTS.length; i++)
          if (
            (LOCAL_ACCOUNTS[i].u || "").toLowerCase() === savedU.toLowerCase()
          )
            accOk = true;
        if (accOk) localAdmin = true;
        else localStorage.removeItem("ptAdminUser");
      }
    } catch (e) {}
    recomputeAdmin();
    try {
      if (firebase.auth) {
        authRef = firebase.auth();
        authRef.onAuthStateChanged(function (u) {
          try {
            if (window.PNWLog)
              window.PNWLog.setContext({ uid: u ? u.uid : null });
          } catch (e) {}
          if (u && !u.isAnonymous) {
            // Akun admin sungguhan: verifikasi lewat allowlist di DB.
            firebase
              .database()
              .ref("pujianYouth/admins")
              .child(u.uid)
              .once("value")
              .then(function (s) {
                fbAdmin = s.exists();
                if (fbAdmin) {
                  pendingApproval = false;
                } else {
                  pendingApproval = true;
                  ensureAdminRequest(u);
                }
                if (u.uid === OWNER_UID) initAdminRequests();
                recomputeAdmin();
              })
              .catch(function () {
                fbAdmin = false;
                recomputeAdmin();
              });
          } else {
            // Belum login / sesi anonim -> bukan admin. Pastikan ada
            // sesi anonim agar Rules bisa menuntut auth != null nanti.
            fbAdmin = false;
            pendingApproval = false;
            recomputeAdmin();
            if (!u) authRef.signInAnonymously().catch(function () {});
          }
        });
      }
    } catch (e) {}
    try {
      lockRef = firebase.database().ref("pujianYouth/config/locked");
      lockRef.on("value", function (s) {
        locked = s.val() === true;
        applyAdminUI();
      });
      notesRef = firebase.database().ref("pujianYouth/notes");
      notesRef.on("value", function (s) {
        var v = s.val();
        if (v) {
          var arr;
          if (Array.isArray(v)) {
            arr = [];
            v.forEach(function (it, i) {
              if (it) arr.push(Object.assign({ _key: String(i) }, it));
            });
          } else {
            arr = Object.keys(v).map(function (k) {
              return Object.assign({ _key: k }, v[k]);
            });
          }
          arr.sort(function (a, b) {
            return (b.t || 0) - (a.t || 0);
          });
          CLOUD_NOTES = arr;
        } else {
          CLOUD_NOTES = [];
        }
        refreshInfoUI();
      });
      // v3.2 - lapisan penimpa untuk catatan bawaan, supaya hasil edit
      // dan penghapusan ikut terbawa ke perangkat lain.
      noteOvRef = firebase.database().ref("pujianYouth/noteOverrides");
      noteOvRef.on("value", function (s) {
        var v = s.val();
        if (v && typeof v === "object") {
          Object.keys(v).forEach(function (k) {
            noteOv[k] = v[k];
          });
          try {
            localStorage.setItem(NOTE_OV_KEY, JSON.stringify(noteOv));
          } catch (e) {}
          refreshInfoUI();
        }
      });
      izinRef = firebase.database().ref("pujianYouth/config/izinOpen");
      izinRef.on("value", function (s) {
        var val = s.val();
        izinFormOpen = val === false ? false : true;
        applyIzinUI();
      });
      likesRef = firebase.database().ref("pujianYouth/noteLikes");
      likesRef.on("value", function (s) {
        noteLikes = s.val() || {};
        updateLikeCounts();
      });
    } catch (e) {}
  }
  function escReq(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function updatePendingUI() {
    var b = document.getElementById("pendingBanner");
    if (b) b.hidden = !(pendingApproval && !isAdmin);
  }
  function ensureAdminRequest(u) {
    if (!u || u.isAnonymous) return;
    try {
      var rr = firebase
        .database()
        .ref("pujianYouth/adminRequests")
        .child(u.uid);
      rr.once("value")
        .then(function (s) {
          if (!s.exists()) {
            rr.set({
              email: u.email || "",
              nama:
                u.displayName || (u.email || "").split("@")[0] || "Tanpa nama",
              status: "pending",
              ts: Date.now(),
            });
          }
        })
        .catch(function () {});
    } catch (e) {}
  }
  function initAdminRequests() {
    if (_reqInit) return;
    _reqInit = true;
    try {
      reqRef = firebase.database().ref("pujianYouth/adminRequests");
      reqRef.on("value", function (s) {
        renderAdminRequests(s.val() || {});
      });
    } catch (e) {}
  }
  function renderAdminRequests(v) {
    var sec = document.getElementById("adminReqSec");
    var list = document.getElementById("adminReqList");
    if (!sec || !list) return;
    var isOwner =
      authRef && authRef.currentUser && authRef.currentUser.uid === OWNER_UID;
    sec.hidden = !isOwner;
    if (!isOwner) return;
    var keys = Object.keys(v || {});
    var pend = keys.filter(function (k) {
      return (v[k] || {}).status === "pending";
    });
    var appr = keys.filter(function (k) {
      return (v[k] || {}).status === "approved";
    });
    var html = "";
    if (!pend.length && !appr.length) {
      html = '<p class="small">Belum ada permintaan admin.</p>';
    } else {
      if (pend.length) {
        html +=
          '<p class="small" style="font-weight:600">Menunggu persetujuan (' +
          pend.length +
          ")</p>";
        pend.forEach(function (k) {
          var r = v[k] || {};
          html +=
            '<div class="reqRow"><div class="reqInfo"><b>' +
            escReq(r.nama || "-") +
            "</b><span>" +
            escReq(r.email || "") +
            "</span></div>" +
            '<div class="reqBtns"><button class="actionBtn reqOk" data-uid="' +
            k +
            '" data-nama="' +
            escReq(r.nama || "") +
            '">Setujui</button>' +
            '<button class="actionBtn secondary reqNo" data-uid="' +
            k +
            '">Tolak</button></div></div>';
        });
      }
      if (appr.length) {
        html +=
          '<p class="small" style="font-weight:600;margin-top:8px">Admin aktif (' +
          appr.length +
          ")</p>";
        appr.forEach(function (k) {
          var r = v[k] || {};
          var own = k === OWNER_UID;
          html +=
            '<div class="reqRow"><div class="reqInfo"><b>' +
            escReq(r.nama || "-") +
            (own ? " (pemilik)" : "") +
            "</b><span>" +
            escReq(r.email || "") +
            "</span></div>" +
            (own
              ? ""
              : '<div class="reqBtns"><button class="actionBtn secondary reqRevoke" data-uid="' +
                k +
                '">Cabut</button></div>') +
            "</div>";
        });
      }
    }
    list.innerHTML = html;
    Array.prototype.forEach.call(list.querySelectorAll(".reqOk"), function (b) {
      b.onclick = function () {
        approveAdmin(b.getAttribute("data-uid"), b.getAttribute("data-nama"));
      };
    });
    Array.prototype.forEach.call(list.querySelectorAll(".reqNo"), function (b) {
      b.onclick = function () {
        rejectAdmin(b.getAttribute("data-uid"));
      };
    });
    Array.prototype.forEach.call(
      list.querySelectorAll(".reqRevoke"),
      function (b) {
        b.onclick = function () {
          revokeAdmin(b.getAttribute("data-uid"));
        };
      },
    );
  }
  function approveAdmin(uid, nama) {
    if (!uid) return;
    firebase
      .database()
      .ref("pujianYouth/admins")
      .child(uid)
      .set(nama || true)
      .then(function () {
        return firebase
          .database()
          .ref("pujianYouth/adminRequests")
          .child(uid)
          .child("status")
          .set("approved");
      })
      .then(function () {
        toast("Admin disetujui: " + (nama || uid), "success");
      })
      .catch(function (e) {
        toast("Gagal menyetujui: " + ((e && e.message) || ""), "error");
      });
  }
  function rejectAdmin(uid) {
    if (!uid) return;
    firebase
      .database()
      .ref("pujianYouth/adminRequests")
      .child(uid)
      .child("status")
      .set("rejected")
      .then(function () {
        toast("Permintaan ditolak.", "info");
      })
      .catch(function () {
        toast("Gagal menolak.", "error");
      });
  }
  function revokeAdmin(uid) {
    if (!uid) return;
    firebase
      .database()
      .ref("pujianYouth/admins")
      .child(uid)
      .remove()
      .then(function () {
        return firebase
          .database()
          .ref("pujianYouth/adminRequests")
          .child(uid)
          .child("status")
          .set("rejected");
      })
      .then(function () {
        toast("Akses admin dicabut.", "info");
      })
      .catch(function () {
        toast("Gagal mencabut.", "error");
      });
  }
  function openSignup() {
    var lf = document.getElementById("loginForms");
    var sf = document.getElementById("signupForms");
    if (lf) lf.hidden = true;
    if (sf) sf.hidden = false;
    var sm = document.getElementById("signupMsg");
    if (sm) sm.textContent = "";
  }
  function backToLogin() {
    var lf = document.getElementById("loginForms");
    var sf = document.getElementById("signupForms");
    if (lf) lf.hidden = false;
    if (sf) sf.hidden = true;
  }
  function doSignup() {
    var name = (document.getElementById("signupName").value || "").trim();
    var email = (document.getElementById("signupEmail").value || "").trim();
    var pass = document.getElementById("signupPass").value;
    var msg = document.getElementById("signupMsg");
    if (!name || !email || !pass) {
      if (msg) msg.textContent = "Isi nama, email, dan password.";
      return;
    }
    if (email.indexOf("@") < 0) {
      if (msg) msg.textContent = "Email tidak valid.";
      return;
    }
    if (pass.length < 6) {
      if (msg) msg.textContent = "Password minimal 6 karakter.";
      return;
    }
    if (!authRef) {
      if (msg) msg.textContent = "Koneksi Firebase belum siap.";
      return;
    }
    if (msg) msg.textContent = "Memproses...";
    showLoading("Mendaftar...");
    authRef
      .createUserWithEmailAndPassword(email, pass)
      .then(function (cred) {
        var u = cred.user;
        return u
          .updateProfile({ displayName: name })
          .catch(function () {})
          .then(function () {
            return firebase
              .database()
              .ref("pujianYouth/adminRequests")
              .child(u.uid)
              .set({
                email: email,
                nama: name,
                status: "pending",
                ts: Date.now(),
              });
          });
      })
      .then(function () {
        document.getElementById("signupPass").value = "";
        pendingApproval = true;
        closeLogin();
        loadingSuccess("Pendaftaran terkirim!", function () {
          toast(
            "Pendaftaran terkirim. Menunggu persetujuan pemilik.",
            "success",
          );
          updatePendingUI();
        });
      })
      .catch(function (err) {
        hideLoading();
        if (msg)
          msg.textContent = "Gagal: " + ((err && err.message) || "coba lagi");
        toast("Pendaftaran gagal.", "error");
      });
  }
  function doGoogleLogin() {
    if (!authRef || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
      toast("Login Google tidak tersedia.", "error");
      return;
    }
    var prov = new firebase.auth.GoogleAuthProvider();
    showLoading("Menghubungkan Google...");
    authRef
      .signInWithPopup(prov)
      .then(function () {
        closeLogin();
        hideLoading();
      })
      .catch(function (err) {
        hideLoading();
        var m = document.getElementById("loginMsg");
        if (m) m.textContent = "Gagal Google: " + ((err && err.message) || "");
        toast("Login Google gagal.", "error");
      });
  }
  function openLogin() {
    closeMenu();
    document.getElementById("loginMsg").textContent = "";
    backToLogin();
    document.getElementById("loginModal").classList.add("open");
  }
  function closeLogin() {
    document.getElementById("loginModal").classList.remove("open");
  }
  function doLogin() {
    var e = document.getElementById("loginEmail").value.trim();
    var p = document.getElementById("loginPass").value;
    var msg = document.getElementById("loginMsg");
    if (!e || !p) {
      if (msg) msg.textContent = "Isi username & password.";
      return;
    }
    var acc = findLocalAccount(e, p);
    if (acc) {
      if (msg) msg.textContent = "";
      document.getElementById("loginPass").value = "";
      showLoading("Masuk sebagai " + (acc.name || acc.u) + "...");
      setTimeout(function () {
        localAdmin = true;
        try {
          localStorage.setItem("ptAdminUser", acc.u);
        } catch (x) {}
        closeLogin();
        recomputeAdmin();
        loadingSuccess("Berhasil masuk!", function () {
          toast(
            "Login berhasil. Masuk sebagai " + (acc.name || acc.u) + ".",
            "success",
          );
        });
      }, 900);
      return;
    }
    if (!authRef || e.indexOf("@") < 0) {
      if (msg) msg.textContent = "Username atau password salah.";
      toast("Login gagal. Periksa username/password.", "error");
      return;
    }
    if (msg) msg.textContent = "Memproses...";
    showLoading("Memproses login...");
    authRef
      .signInWithEmailAndPassword(e, p)
      .then(function () {
        if (msg) msg.textContent = "";
        document.getElementById("loginPass").value = "";
        closeLogin();
        loadingSuccess("Berhasil masuk!", function () {
          toast("Login berhasil. Anda masuk sebagai admin.", "success");
        });
      })
      .catch(function (err) {
        hideLoading();
        if (msg)
          msg.textContent =
            "Gagal: " + ((err && err.message) || "cek username/password");
        toast("Login gagal. Periksa username/password.", "error");
      });
  }
  function doLogout() {
    localAdmin = false;
    fbAdmin = false;
    try {
      localStorage.removeItem("ptAdminUser");
    } catch (x) {}
    if (authRef) authRef.signOut();
    recomputeAdmin();
    closeMenu();
    toast("Anda keluar dari mode admin.", "info");
  }
  function toggleLock() {
    if (!isAdmin) {
      toast("Masuk sebagai admin dulu untuk membuka kunci.", "info");
      return;
    }
    if (!lockRef) {
      toast(
        "Cloud belum terhubung, jadi status kunci belum bisa diubah.",
        "error",
      );
      return;
    }
    var want = !locked;
    lockRef.set(want, function (err) {
      if (err) {
        console.error("ubah kunci gagal", err);
        toast(
          fbDenied(err)
            ? "Gagal mengubah kunci: akun ini belum punya izin admin di Firebase."
            : "Gagal mengubah kunci: cloud tidak bisa dihubungi.",
          "error",
          6000,
        );
        return;
      }
      toast(want ? "Daftar lagu dikunci." : "Daftar lagu dibuka.", "success");
    });
  }
  var noteEditKey = null,
    noteEditT = 0;
  // v3.8 - tanggal catatan rilis kini bisa diedit.
  //
  // Dulu ada DUA sumber yang tidak pernah bertemu: `d` hanya teks hiasan
  // yang dicetak saat menyimpan, sedangkan pengurutan daftar memakai `t`
  // (waktu simpan). Akibatnya mengedit tanggal tidak mungkin dan urutan
  // selalu mengikuti kapan tombol Simpan ditekan. Sekarang keduanya
  // dihitung dari satu tanggal yang sama, jadi daftar otomatis tersortir
  // mengikuti tanggal yang kamu isi.
  var NOTE_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  function noteFmtTanggal(ts) {
    var dt = new Date(ts);
    return (
      dt.getDate() + " " + NOTE_MONTHS[dt.getMonth()] + " " + dt.getFullYear()
    );
  }
  function noteInputVal(ts) {
    var dt = new Date(ts);
    var m = dt.getMonth() + 1,
      d = dt.getDate();
    return (
      dt.getFullYear() +
      "-" +
      (m < 10 ? "0" + m : m) +
      "-" +
      (d < 10 ? "0" + d : d)
    );
  }
  // Jamnya diwarisi dari catatan aslinya, bukan direset ke 00:00. Tanpa
  // ini dua catatan bertanggal sama akan bertukar posisi tiap disimpan.
  function noteTsDari(str, jamRef) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
    if (!m) return 0;
    var j = jamRef ? new Date(jamRef) : new Date();
    return new Date(
      +m[1],
      +m[2] - 1,
      +m[3],
      j.getHours(),
      j.getMinutes(),
      j.getSeconds(),
    ).getTime();
  }
  function openNoteModal(note) {
    if (!isAdmin) return;
    closeMenu();
    document.getElementById("noteMsg").textContent = "";
    var h = document.querySelector("#noteModal h2");
    var sb = document.getElementById("noteSubmit");
    if (note && note._key) {
      noteEditKey = note._key;
      noteEditT = note.t || 0;
      document.getElementById("noteVer").value = note.v || "";
      document.getElementById("noteItems").value = (note.items || []).join(
        "\n",
      );
      document.getElementById("noteDate").value = noteInputVal(
        note.t || Date.now(),
      );
      if (h) h.textContent = "Edit catatan rilis";
      if (sb) sb.textContent = "Simpan perubahan";
    } else {
      noteEditKey = null;
      noteEditT = 0;
      document.getElementById("noteVer").value = "";
      document.getElementById("noteItems").value = "";
      document.getElementById("noteDate").value = noteInputVal(Date.now());
      if (h) h.textContent = "Tambah catatan rilis";
      if (sb) sb.textContent = "Publikasikan";
    }
    document.getElementById("noteModal").classList.add("open");
  }
  function deleteNote(key) {
    if (!isAdmin || !key) return;
    // Catatan bawaan tidak bisa dihapus dari Firebase karena memang
    // tidak tersimpan di sana. Yang ditulis adalah penanda sembunyi.
    if (isSeedKey(key)) {
      saveNoteOv(key, { hidden: true });
      toast("Catatan rilis dihapus.", "success");
      return;
    }
    if (!notesRef) return;
    notesRef
      .child(key)
      .remove()
      .then(function () {
        toast("Catatan rilis dihapus.", "success");
      })
      .catch(function (err) {
        toast("Gagal menghapus: " + ((err && err.message) || ""), "error");
      });
  }
  function closeNoteModal() {
    document.getElementById("noteModal").classList.remove("open");
  }
  function submitNote() {
    if (!isAdmin) return;
    var ver = document.getElementById("noteVer").value.trim();
    var items = document
      .getElementById("noteItems")
      .value.split("\n")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var msg = document.getElementById("noteMsg");
    if (!ver || !items.length) {
      if (msg) msg.textContent = "Isi versi & minimal satu perubahan.";
      return;
    }
    var now = new Date();
    // v3.8 - tanggal diambil dari kolom Tanggal, bukan dari waktu simpan.
    // `d` (yang tampil) dan `t` (yang dipakai mengurutkan) dihitung dari
    // angka yang sama, jadi tampilan dan urutan tidak mungkin berbeda.
    var tglInp = document.getElementById("noteDate");
    var ts = noteTsDari(tglInp && tglInp.value, noteEditT || now.getTime());
    if (!ts) {
      if (msg) msg.textContent = "Tanggal belum diisi atau tidak valid.";
      return;
    }
    var d = noteFmtTanggal(ts);
    if (msg) msg.textContent = "Menyimpan...";
    var payload = { v: ver, d: d, items: items, t: ts };
    if (isSeedKey(noteEditKey)) {
      saveNoteOv(noteEditKey, payload);
      if (msg) msg.textContent = "";
      toast("Catatan rilis diperbarui.", "success");
      noteEditKey = null;
      noteEditT = 0;
      document.getElementById("noteVer").value = "";
      document.getElementById("noteItems").value = "";
      closeNoteModal();
      return;
    }
    if (!notesRef) {
      if (msg)
        msg.textContent = "Cloud belum siap. Tunggu sebentar lalu ulangi.";
      return;
    }
    var op = noteEditKey
      ? notesRef.child(noteEditKey).set(payload)
      : notesRef.push(payload);
    op.then(function () {
      if (msg) msg.textContent = "";
      toast(
        noteEditKey
          ? "Catatan rilis diperbarui."
          : "Catatan rilis dipublikasikan.",
        "success",
      );
      noteEditKey = null;
      noteEditT = 0;
      document.getElementById("noteVer").value = "";
      document.getElementById("noteItems").value = "";
      closeNoteModal();
    }).catch(function (err) {
      if (msg) msg.textContent = "Gagal: " + ((err && err.message) || "");
    });
  }
  var spectateOn = false,
    liveRef = null,
    applyingLive = false,
    liveThrottle = 0,
    liveShowChords = false,
    _lastLive = null,
    _dispSig = "",
    _wakeLock = null,
    DISPLAY_MODE = /[?&]mode=(display|stage|youthviews|youth-views|views)/.test(location.search);
  var STAGE_MODE = /[?&]mode=stage/.test(location.search);
  function initSpectate() {
    try {
      liveRef = firebase.database().ref("pujianYouth/live");
      liveRef.on("value", function (s) {
        var v = s.val();
        _lastLive = v;
        applyLive(v);
        if (DISPLAY_MODE) renderDisplay(v);
      });
    } catch (e) {}
  }
  function currentScrollFrac() {
    var el = document.getElementById("sheet");
    if (!el) return 0;
    var m = el.scrollHeight - el.clientHeight;
    return m > 0 ? el.scrollTop / m : 0;
  }
  function broadcastLive() {
    if (!spectateOn || !isAdmin || !liveRef || applyingLive) return;
    var now = Date.now();
    if (now - liveThrottle < 180) return;
    liveThrottle = now;
    try {
      liveRef.set({
        active: true,
        songId: selectedSongId,
        key: selectedKey,
        scroll: currentScrollFrac(),
        showChords: liveShowChords,
        bg: (currentSong() || {}).bg || "",
        songTitle: (currentSong() || {}).title || "",
        t: now,
      });
    } catch (e) {}
  }
  function applyLive(v) {
    var banner = document.getElementById("liveBanner");
    if (!v || !v.active || isAdmin) {
      if (banner) banner.hidden = true;
      document.body.classList.remove("spectating");
      return;
    }
    if (v.kind && v.kind !== "song") return;
    document.body.classList.add("spectating");
    if (banner) banner.hidden = false;
    applyingLive = true;
    try {
      if (v.songId && v.songId !== selectedSongId) {
        var s = songs.find(function (x) {
          return x.id === v.songId;
        });
        if (s) selectedSongId = v.songId;
      }
      if (v.key) selectedKey = v.key;
      makeButtons();
      render();
      var el = document.getElementById("sheet");
      if (el && typeof v.scroll === "number") {
        var m = el.scrollHeight - el.clientHeight;
        el.scrollTop = m * v.scroll;
      }
    } catch (e) {}
    applyingLive = false;
  }
  function toggleSpectate() {
    if (!isAdmin) return;
    spectateOn = !spectateOn;
    if (spectateOn) {
      broadcastLive();
    } else if (liveRef) {
      try {
        liveRef.set({ active: false, t: Date.now() });
      } catch (e) {}
    }
    var t = document.getElementById("spectateToggle");
    if (t) t.checked = spectateOn;
    var st = document.getElementById("spectateStatus");
    if (st)
      st.textContent = spectateOn
        ? "Spectate AKTIF - layar member mengikuti Anda."
        : "";
    var nv = document.getElementById("baitNav");
    if (nv) nv.hidden = !spectateOn;
  }
  function sheetSections() {
    var sh = document.getElementById("sheet");
    if (!sh) return { sh: null, tops: [] };
    var blocks = sh.querySelectorAll(".secBlock");
    var base = sh.getBoundingClientRect().top;
    var tops = [];
    for (var i = 0; i < blocks.length; i++) {
      if (!blocks[i].textContent || !blocks[i].textContent.trim()) continue;
      var r = blocks[i].getBoundingClientRect();
      tops.push(Math.max(0, Math.round(r.top - base + sh.scrollTop)));
    }
    return { sh: sh, tops: tops };
  }
  function gotoSection(dir) {
    var s = sheetSections();
    if (!s.sh || !s.tops.length) return;
    var max = s.sh.scrollHeight - s.sh.clientHeight;
    var cur = s.sh.scrollTop;
    var tol = 6;
    var target = null;
    if (dir > 0) {
      for (var i = 0; i < s.tops.length; i++) {
        if (s.tops[i] > cur + tol) {
          target = s.tops[i];
          break;
        }
      }
      if (target === null) target = max;
    } else {
      for (var j = s.tops.length - 1; j >= 0; j--) {
        if (s.tops[j] < cur - tol) {
          target = s.tops[j];
          break;
        }
      }
      if (target === null) target = 0;
    }
    target = Math.max(0, Math.min(target, max));
    try {
      s.sh.scrollTo({ top: target, behavior: "smooth" });
    } catch (e) {
      s.sh.scrollTop = target;
    }
    if (typeof broadcastLive === "function") {
      setTimeout(broadcastLive, 320);
      setTimeout(broadcastLive, 640);
    }
  }
  var _lastBg = "";
  // ---- youTh Views engine: bikin slide ala ProPresenter/EasyWorship ----
  var YV_CHORD_RE = /^[A-G](#|b)?(maj|min|m|M|sus|add|dim|aug|\+|°)?\d*(sus\d)?(\/[A-G](#|b)?)?$/;
  function yvStripChords(line) {
    return String(line || "").replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
  }
  function yvIsChordLine(line) {
    var t = String(line || "").trim();
    if (!t) return false;
    if (sectionWords.test(t)) return false;
    var toks = t.replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean);
    if (!toks.length) return true;
    for (var i = 0; i < toks.length; i++) {
      if (!YV_CHORD_RE.test(toks[i].replace(/[|,.]/g, ""))) return false;
    }
    return true;
  }
  function yvLabel(line) {
    return yvStripChords(line).replace(/[:\-—]+$/, "").replace(/\s*\+\s*\d+\s*$/, "").trim();
  }
  // Pecah lagu jadi slide kecil: lirik saja, maksimal N baris per slide,
  // baris kosong / ganti bagian = ganti slide. Lirik keluar berkala.
  function yvBuildSlides(song, maxLines) {
    var max = Math.max(1, parseInt(maxLines, 10) || 4);
    var out = [];
    var label = "";
    var buf = [];
    function flush() {
      if (buf.length) {
        out.push({ label: label, lines: buf.slice() });
        buf = [];
      }
    }
    ((song && song.lines) || []).forEach(function (raw) {
      var t = String(raw == null ? "" : raw);
      if (sectionWords.test(t.trim())) {
        flush();
        label = yvLabel(t);
        return;
      }
      if (yvIsChordLine(t)) return;
      var lyric = yvStripChords(t);
      if (!lyric) {
        flush();
        return;
      }
      buf.push(lyric);
      if (buf.length >= max) flush();
    });
    flush();
    if (!out.length) out.push({ label: "", lines: [(song && song.title) || ""] });
    return out;
  }
  function yvSongSlides(song) {
    return yvBuildSlides(song, 4);
  }
  function yvReadStyle() {
    var font = (document.getElementById("projFont") || {}).value || "Inter";
    var size = parseInt(((document.getElementById("projSize") || {}).value || "56"), 10) || 56;
    var sh = (document.getElementById("projShadow") || {}).value || "strong";
    var on = document.querySelector("#projAlign button.on");
    var align = (on && on.dataset.align) || "center";
    return { font: font, size: size, align: align, shadow: sh };
  }
  function yvReadBg() {
    var active = document.querySelector("#projPresets .projBgPreset.on, #projSolids .projBgPreset.on");
    var bgUrlEl = document.getElementById("projBgUrl");
    var url = bgUrlEl ? (bgUrlEl.value || "").trim() : "";
    return { url: url, preset: active ? active.getAttribute("data-bg") || "" : "" };
  }
  function applyViewStyle(style) {
    var screen = document.getElementById("displayScreen");
    if (!screen) return;
    var st = style || {};
    screen.style.setProperty("--yv-font", st.font ? '"' + st.font + '"' : "Inter");
    screen.style.setProperty("--yv-size", (parseInt(st.size, 10) || 56) + "px");
    screen.style.setProperty("--yv-align", st.align || "center");
    screen.classList.remove("yvShadowNone", "yvShadowSoft", "yvShadowStrong");
    screen.classList.add(st.shadow === "none" ? "yvShadowNone" : st.shadow === "soft" ? "yvShadowSoft" : "yvShadowStrong");
    if (st.font) yvEnsureFont(st.font);
  }
  var _yvFonts = {};
  function yvEnsureFont(name) {
    var f = String(name || "").trim();
    if (!f || _yvFonts[f] || f === "Inter" || f === "JetBrains Mono" || f === "Satoshi") return;
    _yvFonts[f] = true;
    try {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=" + f.replace(/ /g, "+") + ":wght@400;600;700;800&display=swap";
      document.head.appendChild(l);
    } catch (e) {}
  }
  // ---- lapisan animasi (canvas) + Lottie + media lokal ----
  var _yvMotion = null, _yvLottie = null;
  function yvMotionInst() {
    var cv = document.getElementById("dispMotion");
    if (!cv || !window.PNWMotion) return null;
    if (!_yvMotion) _yvMotion = window.PNWMotion.create(cv);
    return _yvMotion;
  }
  function yvStopMotion() {
    if (_yvMotion) { try { _yvMotion.stop(); } catch (e) {} }
    var cv = document.getElementById("dispMotion");
    if (cv) cv.classList.remove("on");
  }
  function yvStopLottie() {
    if (_yvLottie) { try { _yvLottie.destroy(); } catch (e) {} _yvLottie = null; }
    var host = document.getElementById("dispLottie");
    if (host) { host.classList.remove("on"); host.innerHTML = ""; }
  }
  function yvNeedLottie() {
    if (window.lottie) return Promise.resolve(window.lottie);
    return new Promise(function (res, rej) {
      var sc = document.createElement("script");
      sc.src = "./lottie.min.js";
      sc.onload = function () { res(window.lottie); };
      sc.onerror = function () { rej(new Error("lottie gagal dimuat")); };
      document.head.appendChild(sc);
    });
  }
  function yvPlayLottie(src) {
    var host = document.getElementById("dispLottie");
    if (!host) return;
    host.classList.add("on");
    yvNeedLottie()
      .then(function (lot) {
        return (window.PNWMedia ? window.PNWMedia.resolve(src) : Promise.resolve(src)).then(function (url) {
          yvStopLottie();
          host.classList.add("on");
          _yvLottie = lot.loadAnimation({ container: host, renderer: "svg", loop: true, autoplay: true, path: url });
        });
      })
      .catch(function (e) {
        window.PNWDiag.push({ feature: "youthviews.lottie", error: String((e && e.message) || e), at: Date.now() });
      });
  }
  // hentakan latar mengikuti alur lirik
  function yvMotionCue(label, strength) {
    if (!_yvMotion) return;
    try {
      if (label != null) _yvMotion.setMood(label);
      _yvMotion.pulse(typeof strength === "number" ? strength : 1);
    } catch (e) {}
  }
  // ---- latar belakang output: warna / gambar / video / animasi ----
  function yvBgFromLive(v, song) {
    if (v && v.bg && typeof v.bg === "object" && v.bg.kind) return v.bg;
    if (v && typeof v.bg === "string" && v.bg) return { kind: "image", value: v.bg };
    if (v && v.bgPreset) return { kind: "motion", value: v.bgPreset };
    if (song && song.bg) return { kind: "image", value: song.bg };
    return null;
  }
  function applyDispBackground(bg) {
    var layer = document.getElementById("dispBg");
    var vid = document.getElementById("dispVideo");
    if (!layer) return;
    var b = bg && bg.kind ? bg : null;
    var sig = b ? b.kind + "|" + b.value + "|" + (b.params ? JSON.stringify(b.params) : "") : "none";
    if (sig === _lastBg) return;
    _lastBg = sig;
    layer.className = "dispBg";
    layer.style.backgroundImage = "";
    layer.style.background = "";
    layer.removeAttribute("data-bg");
    if (vid) {
      try { vid.pause(); } catch (e) {}
      vid.classList.remove("on");
      try { vid.removeAttribute("src"); vid.load(); } catch (e) {}
    }
    if (!b || b.kind !== "studio") yvStopMotion();
    if (!b || b.kind !== "lottie") yvStopLottie();
    if (!b) return;
    if (b.kind === "studio") {
      var mo = yvMotionInst();
      var cvm = document.getElementById("dispMotion");
      if (mo && cvm) {
        layer.classList.add("on");
        layer.setAttribute("data-bg", "studio");
        cvm.classList.add("on");
        var base = window.PNWMotion ? window.PNWMotion.preset(b.value) : {};
        mo.start(Object.assign({}, base, b.params || {}));
      }
      return;
    }
    if (b.kind === "lottie") {
      layer.classList.add("on");
      layer.setAttribute("data-bg", "lottie");
      yvPlayLottie(b.value);
      return;
    }
    if (b.kind === "upload") {
      layer.classList.add("on");
      layer.setAttribute("data-bg", "custom");
      if (window.PNWMedia) {
        window.PNWMedia.resolve(b.value)
          .then(function (url) {
            var isVid = /video/i.test(b.mime || "") || /\.(mp4|webm|mov)(\?|$)/i.test(url);
            if (isVid && vid) {
              layer.setAttribute("data-bg", "video");
              vid.src = url;
              vid.classList.add("on");
              var pv = vid.play();
              if (pv && pv.catch) pv.catch(function () {});
            } else {
              layer.style.backgroundImage = 'url("' + url + '")';
            }
          })
          .catch(function (e) {
            window.PNWDiag.push({ feature: "youthviews.media", error: String((e && e.message) || e), at: Date.now() });
          });
      }
      return;
    }
    if (b.kind === "video" && vid) {
      layer.classList.add("on");
      layer.setAttribute("data-bg", "video");
      try {
        vid.src = b.value;
        vid.classList.add("on");
        var p = vid.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
      return;
    }
    if (b.kind === "motion") {
      layer.classList.add("on");
      layer.setAttribute("data-bg", b.value || "aurora");
      return;
    }
    if (b.kind === "color") {
      layer.classList.add("on");
      layer.setAttribute("data-bg", "solid");
      layer.style.background = b.value || "#0b0e14";
      return;
    }
    layer.classList.add("on");
    layer.setAttribute("data-bg", "custom");
    layer.style.backgroundImage = 'url("' + String(b.value || "").replace(/"/g, "%22") + '")';
  }
  function applyDispBg(url, preset) {
    applyDispBackground(url ? { kind: "image", value: url } : preset ? { kind: "motion", value: preset } : null);
  }
  // ---- render 1 slide output: lirik bertahap + auto-fit ----
  var _yvLastLines = null;
  function yvAutoFit(container, lines) {
    if (!container) return;
    var maxLen = 1;
    (lines || []).forEach(function (l) { maxLen = Math.max(maxLen, String(l).length); });
    var n = Math.max(1, (lines || []).length);
    var w = window.innerWidth || 1280;
    var h = window.innerHeight || 720;
    var byWidth = (w * 0.9) / (maxLen * 0.52);
    var byHeight = (h * 0.72) / (n * 1.34);
    var px = Math.max(22, Math.min(byWidth, byHeight, h * 0.2));
    container.style.setProperty("--yv-fit", Math.round(px) + "px");
  }
  function renderYvSlide(container, slide, opts) {
    if (!container) return;
    var o = opts || {};
    container.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "yvSlide";
    if (o.showLabel && slide && slide.label) {
      var lb = document.createElement("div");
      lb.className = "yvSlideLabel";
      lb.textContent = slide.label;
      wrap.appendChild(lb);
    }
    ((slide && slide.lines) || []).forEach(function (l, i) {
      var d = document.createElement("div");
      d.className = "yvLine";
      d.textContent = l;
      d.style.animationDelay = i * 110 + "ms";
      wrap.appendChild(d);
    });
    container.appendChild(wrap);
    _yvLastLines = (slide && slide.lines) || [];
    yvAutoFit(container, _yvLastLines);
    yvMotionCue(slide && slide.label, 1);
    ((slide && slide.lines) || []).forEach(function (l, i) {
      setTimeout(function () { yvMotionCue(null, 0.3); }, 140 + i * 110);
    });
  }
  // hitung ulang ukuran teks saat layar berubah (rotasi HP, resize / minimize di PC)
  var _yvFitTimer = 0;
  function yvRefit() {
    clearTimeout(_yvFitTimer);
    _yvFitTimer = setTimeout(function () {
      try {
        var c = document.getElementById("dispContent");
        if (c && _yvLastLines && _yvLastLines.length) yvAutoFit(c, _yvLastLines);
        if (_yvMotion) _yvMotion.resize();
      } catch (e) {}
    }, 120);
  }
  window.addEventListener("resize", yvRefit);
  window.addEventListener("orientationchange", yvRefit);
  try {
    if (window.visualViewport) window.visualViewport.addEventListener("resize", yvRefit);
  } catch (e) {}

  // === MODE PROYEKTOR / LIVE (Fitur 3) ===
  function renderDisplay(v) {
    try {
      return renderDisplayInner(v);
    } catch (e) {
      window.PNWDiag.push({ feature: "youthviews.output", error: String((e && e.message) || e), at: Date.now() });
      return null;
    }
  }
  function renderDisplayInner(v) {
    var screen = document.getElementById("displayScreen");
    if (!screen) return;
    var idle = document.getElementById("dispIdle");
    var stage = document.getElementById("dispStage");
    var titleEl = document.getElementById("dispTitle");
    var keyEl = document.getElementById("dispKey");
    var body = document.getElementById("dispContent");
    var wait = document.getElementById("dispWait");
    if (v && v.active) applyViewStyle(v.style || {});
    if (v && v.active && v.kind === "text") {
      if (idle) idle.hidden = true;
      if (stage) stage.hidden = false;
      applyDispBackground(yvBgFromLive(v, null));
      screen.classList.add("dispTextMode");
      screen.classList.add("hideChords");
      var _tsig = "text|" + (v.text || "");
      if (_tsig !== _dispSig) {
        _dispSig = _tsig;
        if (titleEl) titleEl.textContent = "";
        if (keyEl) keyEl.textContent = "";
        renderDispText(body, v.text || "");
        if (window.PNWMotion) window.PNWMotion.revealLines(body);
      }
      return;
    }
    if (v && v.active && v.kind === "verse") {
      if (idle) idle.hidden = true;
      if (stage) stage.hidden = false;
      applyDispBackground(yvBgFromLive(v, null));
      screen.classList.add("dispTextMode");
      screen.classList.add("hideChords");
      var _vsig = "verse|" + (v.ref || "") + "|" + (v.text || "");
      if (_vsig !== _dispSig) {
        _dispSig = _vsig;
        if (titleEl) titleEl.textContent = "";
        if (keyEl) keyEl.textContent = "";
        renderDispVerse(body, v.text || "", v.ref || "");
        if (window.PNWMotion) window.PNWMotion.revealLines(body);
      }
      return;
    }
    screen.classList.remove("dispTextMode");
    if (!v || !v.active || !v.songId) {
      _dispSig = "";
      applyDispBackground(null);
      applyViewStyle({});
      if (idle) idle.hidden = false;
      if (wait) wait.textContent = "Menunggu live dimulai\u2026";
      if (stage) stage.hidden = true;
      return;
    }
    var song = (songs || []).find(function (x) {
      return x.id === v.songId;
    });
    if (!song) {
      _dispSig = "";
      applyDispBackground(null);
      applyViewStyle({});
      if (idle) idle.hidden = false;
      if (wait)
        wait.textContent = v.songTitle
          ? "Memuat: " + v.songTitle
          : "Memuat lagu\u2026";
      if (stage) stage.hidden = true;
      return;
    }
    if (idle) idle.hidden = true;
    if (stage) stage.hidden = false;
    applyDispBackground(yvBgFromLive(v, song));
    var target = v.key || song.originalKey;
    var shift =
      (noteToIndex[target] || 0) - (noteToIndex[song.originalKey] || 0);
    var showCh = STAGE_MODE ? true : !!v.showChords;
    var useSlide = typeof v.slideIndex === "number";
    var sig = song.id + "|" + target + "|" + (showCh ? "1" : "0") + "|" + (useSlide ? "s" + v.slideIndex + "/" + (v.slideMax || 4) : "scroll") + "|" + JSON.stringify(v.style || {});
    if (sig !== _dispSig) {
      _dispSig = sig;
      screen.classList.toggle("yvSlideMode", useSlide);
      if (useSlide) {
        // Output presenter: satu halaman, lirik saja, keluar bertahap
        var deck = yvBuildSlides(song, v.slideMax || 4);
        var idx = Math.max(0, Math.min(deck.length - 1, parseInt(v.slideIndex, 10) || 0));
        var slide = deck[idx] || deck[0];
        if (titleEl) titleEl.textContent = v.showTitle === false ? "" : song.title || "";
        if (keyEl) keyEl.textContent = v.showMeta === false ? "" : "Slide " + (idx + 1) + " / " + deck.length + (slide.label ? " · " + slide.label : "");
        screen.classList.add("hideChords");
        renderYvSlide(body, slide, { showLabel: false });
      } else {
        if (titleEl) titleEl.textContent = (song.num || "") + ". " + song.title;
        if (keyEl)
          keyEl.textContent =
            target === song.originalKey
              ? "Nada " + target
              : "Nada " + target + " (asli " + song.originalKey + ")";
        renderLinesInto(body, song.lines || [], shift, target);
        screen.classList.toggle("hideChords", !showCh);
        if (window.PNWMotion) window.PNWMotion.revealLines(body);
      }
    }
    if (!useSlide && typeof v.scroll === "number" && stage) {
      var m = stage.scrollHeight - stage.clientHeight;
      if (m > 0) stage.scrollTop = m * v.scroll;
    }
  }
  function dispSetStatus(online) {
    var d = document.getElementById("dispDot");
    if (!d) return;
    d.className = "dispDot " + (online ? "on" : "off");
    d.title = online ? "Terhubung" : "Terputus \u2014 menyambung ulang\u2026";
  }
  function requestWake() {
    try {
      if (
        "wakeLock" in navigator &&
        navigator.wakeLock &&
        navigator.wakeLock.request
      ) {
        navigator.wakeLock
          .request("screen")
          .then(function (wl) {
            _wakeLock = wl;
            if (wl && wl.addEventListener)
              wl.addEventListener("release", function () {
                _wakeLock = null;
              });
          })
          .catch(function () {});
      }
    } catch (e) {}
  }
  function toggleLiveChords() {
    var c = document.getElementById("liveChordsToggle");
    liveShowChords = c ? !!c.checked : !liveShowChords;
    if (typeof broadcastLive === "function") broadcastLive();
  }
  function renderDispText(container, text) {
    if (!container) return;
    container.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "dispTextBlock";
    String(text || "")
      .replace(/\r/g, "")
      .split("\n")
      .forEach(function (line) {
        var d = document.createElement("div");
        d.className = "dispTextLine";
        d.textContent = line;
        wrap.appendChild(d);
      });
    container.appendChild(wrap);
  }
  function broadcastText() {
    if (!isAdmin || !liveRef) return;
    var ta = document.getElementById("liveTextInput");
    var txt = ta ? (ta.value || "").trim() : "";
    if (!txt) {
      if (typeof toast === "function") toast("Teks masih kosong.", "info");
      return;
    }
    try {
      var bg = yvReadBg();
      liveRef.set({ active: true, kind: "text", text: txt, style: yvReadStyle(), bg: bg.url, bgPreset: bg.preset, t: Date.now() });
      if (typeof toast === "function")
        toast("Teks ditampilkan di proyektor.", "success");
    } catch (e) {}
  }
  function clearText() {
    if (!isAdmin || !liveRef) return;
    try {
      liveRef.set({ active: false, t: Date.now() });
      if (typeof toast === "function") toast("Teks disembunyikan.", "info");
    } catch (e) {}
  }
  function renderDispVerse(container, text, ref) {
    if (!container) return;
    container.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "dispVerseBlock";
    var t = document.createElement("div");
    t.className = "dispVerseText";
    String(text || "")
      .replace(/\r/g, "")
      .split("\n")
      .forEach(function (line) {
        var d = document.createElement("div");
        d.className = "dispTextLine";
        d.textContent = line;
        t.appendChild(d);
      });
    wrap.appendChild(t);
    if (ref && String(ref).trim()) {
      var r = document.createElement("div");
      r.className = "dispVerseRef";
      r.textContent = "\u2014 " + String(ref).trim();
      wrap.appendChild(r);
    }
    container.appendChild(wrap);
  }
  function broadcastVerse() {
    if (!isAdmin || !liveRef) return;
    var ta = document.getElementById("liveVerseInput");
    var rf = document.getElementById("liveVerseRef");
    var txt = ta ? (ta.value || "").trim() : "";
    var ref = rf ? (rf.value || "").trim() : "";
    if (!txt) {
      if (typeof toast === "function") toast("Teks ayat masih kosong.", "info");
      return;
    }
    try {
      var bg = yvReadBg();
      liveRef.set({ active: true, kind: "verse", text: txt, ref: ref, style: yvReadStyle(), bg: bg.url, bgPreset: bg.preset, t: Date.now() });
      if (typeof toast === "function")
        toast("Ayat ditampilkan di proyektor.", "success");
    } catch (e) {}
  }
  function initDisplayMode() {
    if (!DISPLAY_MODE) return;
    document.body.classList.add("display-mode");
    if (STAGE_MODE) document.body.classList.add("stage-mode");
    var screen = document.getElementById("displayScreen");
    if (screen) screen.hidden = false;
    requestWake();
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        requestWake();
        renderDisplay(_lastLive);
      }
    });
    try {
      firebase
        .database()
        .ref(".info/connected")
        .on("value", function (s) {
          dispSetStatus(!!s.val());
        });
    } catch (e) {}
    renderDisplay(_lastLive);
    setInterval(function () {
      renderDisplay(_lastLive);
    }, 1500);
  }

  function toast(msg, type, ms) {
    var wrap = document.getElementById("toastWrap");
    if (!wrap) return null;
    var el = document.createElement("div");
    el.className = "toast " + (type || "info");
    var ico = document.createElement("span");
    if (type === "loading") {
      ico.className = "tSpin";
    } else {
      ico.className = "tIco";
      // ICON LOCATION #1 (toast): ganti SVG di bawah untuk icon success/error/info.
      ico.innerHTML =
        type === "success"
          ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
          : type === "error"
            ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>'
            : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>';
    }
    var tx = document.createElement("span");
    tx.textContent = msg;
    el.appendChild(ico);
    el.appendChild(tx);
    wrap.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("show");
    });
    var dur = ms == null ? 2600 : ms;
    var handle = {
      el: el,
      close: function () {
        if (!el.parentNode) return;
        el.classList.remove("show");
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 240);
      },
    };
    if (type !== "loading" && dur > 0) setTimeout(handle.close, dur);
    return handle;
  }
  // ===== FASE C: Penjadwal Pelayanan =====
  var SCHED_KEY = "pujianYouthSchedule.v4";
  var scheduleRef = null;
  var schedInited = false;
  var schedTab = "jadwal";
  var schedAutoWarned = false;
  var SCHED_TEAMS = [
    {
      key: "hosp",
      label: "Tim Hospitality",
      roles: [
        { key: "doaBuka", label: "Doa Pembuka", slots: 1, dbl: true },
        { key: "usher", label: "Usher", slots: 3, dbl: true },
        { key: "pengumuman", label: "Pengumuman", slots: 1, dbl: true },
        { key: "doaTutup", label: "Doa Penutup", slots: 1, dbl: true },
      ],
    },
    {
      key: "mm",
      label: "Sound & Multimedia",
      roles: [
        { key: "presenter", label: "Presenter", slots: 1 },
        { key: "streaming", label: "Streaming", slots: 1 },
        { key: "sound", label: "Sound", slots: 1 },
        { key: "camera", label: "Camera", slots: 1 },
        { key: "liveReport", label: "Live Report", slots: 1 },
      ],
    },
    {
      key: "wPNW",
      label: "Worship - Praise & Worship",
      roles: [
        { key: "wlPNW", label: "Worship Leader", slots: 2, dbl: true },
        { key: "singPNW", label: "Singers", slots: 3, dbl: true },
        {
          key: "kbPNW",
          label: "Pianist",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
        {
          key: "gtPNW",
          label: "Guitarist",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
        {
          key: "bsPNW",
          label: "Bassist",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
        {
          key: "drPNW",
          label: "Drummer",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
      ],
    },
    {
      key: "wPsb",
      label: "Worship - Persembahan",
      roles: [
        { key: "wlPsb", label: "Worship Leader", slots: 1, dbl: true },
        { key: "singPsb", label: "Singers", slots: 3, dbl: true },
        {
          key: "kbPsb",
          label: "Pianist",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
        {
          key: "gtPsb",
          label: "Guitarist",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
        {
          key: "bsPsb",
          label: "Bassist",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
        {
          key: "drPsb",
          label: "Drummer",
          slots: 1,
          dbl: true,
          group: "musik",
          groupLabel: "Pemusik",
        },
      ],
    },
    {
      key: "wUmum",
      label: "Worship - Tambourine & Banners",
      roles: [
        { key: "tamb", label: "Tambourine", slots: 3, dbl: true },
        { key: "ban", label: "Banners", slots: 2, dbl: true },
      ],
    },
  ];
  function allSchedRoles() {
    var out = [];
    SCHED_TEAMS.forEach(function (t) {
      t.roles.forEach(function (r) {
        out.push(r);
      });
    });
    return out;
  }
  function schedRole(key) {
    var f = null;
    allSchedRoles().forEach(function (r) {
      if (r.key === key) f = r;
    });
    return f;
  }
  // ===== Data prioritas pelayan (mudah diedit) =====
  // Tier: 1=Actual(hijau), 2=Secondary(kuning), 3=Third/putih(oranye).
  // Nama yang merah / tidak ada di daftar = tidak masuk pool role itu.
  var ROLE_PICKS = {
    wlsing: {
      t1: ["Erica", "Joshua", "Martin", "Selmia", "Yemima"],
      t2: ["Ester", "Gilberth", "Karin", "Tessa"],
      t3: ["Florie", "Grace", "Natha", "Shinta", "Daniel"],
    },
    keyboard: { t1: ["Alex", "Joshua"], t2: ["Billy"], t3: ["George"] },
    guitar: {
      t1: ["Jamie", "Ebenhaezer"],
      t2: ["George", "Gilberth"],
      t3: ["Alex", "Mishael", "Samuel"],
    },
    bass: {
      t1: ["Martin", "Selmia"],
      t2: ["Alex", "George", "Natha", "Samuel", "Jamie"],
      t3: [],
    },
    drum: {
      t1: ["Billy", "Mishael", "Sadrian", "Selmia", "Samuel"],
      t2: ["Ester", "Jamie"],
      t3: ["George", "Alex"],
    },
    banners: {
      t1: ["Amos", "Aurel", "Raisa", "Ressa", "Samuel", "Daniel", "Gio"],
      t2: ["Bunga", "Chintya"],
      t3: ["Christian", "Shinta", "Alex"],
    },
    tambourine: {
      t1: [
        "Aurel",
        "Bunga",
        "Cahya",
        "Dini",
        "Leora",
        "Neva",
        "Raisa",
        "Ressa",
        "Shinta",
      ],
      t2: [],
      t3: [],
    },
    usher: {
      t1: ["Adit", "Anugerah"],
      t2: [
        "Gilberth",
        "Ibrani",
        "Karin",
        "Kethrin",
        "Martin",
        "Nico",
        "Yesika",
      ],
      t3: ["Anggi"],
    },
    streaming: {
      t1: ["Alex", "Florie", "Shinta"],
      t2: ["Yesika"],
      t3: [],
    },
    sound: { t1: ["George", "Sadrian"], t2: ["Alex"], t3: ["Joshua"] },
  };
  // Role tanpa data prioritas baru -> pakai daftar lama sebagai tier 1.
  // v2.3 - tingkat & pool khusus (tabel senior/junior)
  var WL_SENIOR = ["Gilberth", "Joshua", "Natha", "Selmia", "Tessa", "Yemima"];
  var WL_JUNIOR = ["Erica", "Ester", "Florie", "Karin", "Martin"];
  var MUS_SENIOR = ["Alex", "George", "Jamie", "Mishael", "Ebenhaezer"];
  var MUS_JUNIOR = ["Samuel", "Gilberth", "Natha"];
  var PRESENTER_TETAP = ["Yemima", "Yesika"];
  var PRESENTER_TRIAL = ["Fingken", "Chintya", "Ester", "Joshua", "Florie"];
  var SOUND_SENIOR = ["George", "Sadrian"];
  var SOUND_JUNIOR = ["Alex", "Joshua"];
  var PENGURUS = ["Alex", "Selmia", "Tessa"];
  var SOUND_MM_ROLES = [
    "presenter",
    "streaming",
    "sound",
    "camera",
    "liveReport",
  ];
  var TECH_ROLES = ["streaming", "sound", "camera", "liveReport"];
  var MUS_PNW_ROLES = ["kbPNW", "gtPNW", "bsPNW", "drPNW"];
  var MUS_PSB_ROLES = ["kbPsb", "gtPsb", "bsPsb", "drPsb"];
  var MUS_ALL_ROLES = MUS_PNW_ROLES.concat(MUS_PSB_ROLES);
  // v3.3 - pemetaan role musik ke ALAT-nya. Satu orang boleh memegang
  // alat yang SAMA di dua sesi (Drum P&W + Drum Persembahan), tetapi
  // tidak boleh dua alat berbeda karena tangannya hanya sepasang.
  var MUS_INSTRUMEN = {
    keyboard: ["kbPNW", "kbPsb"],
    gitar: ["gtPNW", "gtPsb"],
    bass: ["bsPNW", "bsPsb"],
    drum: ["drPNW", "drPsb"],
  };
  function musInstrumen(rk) {
    for (var k in MUS_INSTRUMEN)
      if (MUS_INSTRUMEN[k].indexOf(rk) >= 0) return k;
    return null;
  }
  // Seluruh role tim Worship (kedua sesi). Dipakai aturan role mandiri.
  var WORSHIP_ALL_ROLES = ["wlPNW", "singPNW"]
    .concat(MUS_PNW_ROLES)
    .concat(["wlPsb", "singPsb"])
    .concat(MUS_PSB_ROLES);
  // ===== v3.0 - KELOMPOK EKSKLUSIF (datar) =====
  // Dalam satu kelompok, satu orang hanya boleh memegang SATU role per
  // minggu. Sesi P&W dan Persembahan sengaja DIPISAH, karena merangkap
  // antar sesi memang boleh - bahkan H5 mewajibkan WL Persembahan
  // diambil dari Singers P&W.
  var EXCLUSIVE_GROUPS = [
    {
      key: "vokalPNW",
      roles: ["wlPNW", "singPNW"],
      alasan: "Worship Leader tidak merangkap Singers di sesi P&W",
    },
    {
      key: "vokalPsb",
      roles: ["wlPsb", "singPsb"],
      alasan: "Worship Leader tidak merangkap Singers di sesi Persembahan",
    },
  ];
  // ===== v3.3 - PASANGAN SILANG =====
  // Bentuk aturan yang berbeda: tidak boleh memegang role dari sisi A
  // DAN sisi B sekaligus, sementara di dalam masing-masing sisi aturan
  // lain tetap berlaku. Kelompok datar tidak bisa menyatakan ini -
  // memaksakannya akan ikut melarang rangkap antar sesi yang justru
  // diwajibkan H5.
  var EXCLUSIVE_PAIRS = [
    // H12 - pemusik P&W tidak naik sebagai WL/Singers di Persembahan.
    {
      key: "musPNWvokalPsb",
      a: MUS_PNW_ROLES,
      b: ["wlPsb", "singPsb"],
      alasan: "pemusik P&W tidak merangkap WL atau Singers di Persembahan",
    },
    // H13 - Tambourine dan Banners adalah role mandiri: siapa pun yang
    // sudah melayani di tim Worship (sesi mana pun) tidak boleh masuk
    // ke sini, dan sebaliknya.
    {
      key: "mandiriTambBan",
      a: WORSHIP_ALL_ROLES,
      b: ["tamb", "ban"],
      alasan:
        "Tambourine dan Banners role mandiri, tidak merangkap tim Worship",
    },
  ];
  // Mengembalikan { rk, alasan } bila bentrok, atau null bila aman.
  // v3.5 - sesi dari sebuah role musik: "PNW", "Psb", atau null.
  function musSesi(rk) {
    if (MUS_PNW_ROLES.indexOf(rk) >= 0) return "PNW";
    if (MUS_PSB_ROLES.indexOf(rk) >= 0) return "Psb";
    return null;
  }
  // v3.5 - opts.musLintasSesi dipakai HANYA oleh pengisian manual dan
  // melonggarkan aturan alat SEBATAS kedua role berada di sesi berbeda.
  // Di dalam satu sesi larangan tetap mutlak, karena tangan memang hanya
  // sepasang. Penjadwal otomatis memanggil fungsi ini TANPA opts, jadi
  // logika penyusunan otomatis sama sekali tidak berubah.
  function konflikEksklusif(pid, wk, roleKey, opts) {
    opts = opts || {};
    // 1. Alat musik: alat sama di dua sesi boleh, alat berbeda tidak.
    var ins = musInstrumen(roleKey);
    if (ins) {
      for (var im = 0; im < MUS_ALL_ROLES.length; im++) {
        var rkm = MUS_ALL_ROLES[im];
        if (rkm === roleKey) continue;
        if (musInstrumen(rkm) === ins) continue;
        if (getAssign(wk, rkm).indexOf(pid) >= 0) {
          var sA = musSesi(rkm),
            sB = musSesi(roleKey);
          if (opts.musLintasSesi && sA && sB && sA !== sB) continue;
          return {
            rk: rkm,
            alasan: "satu orang hanya bisa memainkan satu alat musik",
          };
        }
      }
    }
    // 2. Kelompok datar.
    for (var ig = 0; ig < EXCLUSIVE_GROUPS.length; ig++) {
      var g = EXCLUSIVE_GROUPS[ig];
      if (g.roles.indexOf(roleKey) < 0) continue;
      for (var ir = 0; ir < g.roles.length; ir++) {
        var rk2 = g.roles[ir];
        if (rk2 === roleKey) continue;
        if (getAssign(wk, rk2).indexOf(pid) >= 0)
          return { rk: rk2, alasan: g.alasan };
      }
    }
    // 3. Pasangan silang.
    for (var ip = 0; ip < EXCLUSIVE_PAIRS.length; ip++) {
      var pr = EXCLUSIVE_PAIRS[ip];
      var sisi =
        pr.a.indexOf(roleKey) >= 0
          ? pr.b
          : pr.b.indexOf(roleKey) >= 0
            ? pr.a
            : null;
      if (!sisi) continue;
      for (var is = 0; is < sisi.length; is++) {
        if (sisi[is] === roleKey) continue;
        if (getAssign(wk, sisi[is]).indexOf(pid) >= 0)
          return { rk: sisi[is], alasan: pr.alasan };
      }
    }
    return null;
  }
  function musRoleLabel(rk) {
    var r = schedRole(rk);
    return r && r.label ? r.label : rk;
  }
  // ===== v2.9 - role yang ditutup per minggu =====
  // Bentuk data: sched.closed = { "w1": { "tamb": true } }
  // v3.6 - penutupan SATU MINGGU penuh. Disimpan terpisah dari
  // sched.closed (per role) supaya saat minggu dibuka kembali,
  // penutupan per role yang dipasang manual tidak ikut hilang.
  function isWeekClosed(wk) {
    return !!(sched.closedWeek && sched.closedWeek["w" + wk]);
  }
  function setWeekClosed(wk, on) {
    if (!sched.closedWeek) sched.closedWeek = {};
    if (on) sched.closedWeek["w" + wk] = true;
    else delete sched.closedWeek["w" + wk];
  }
  function weekReason(wk) {
    return (sched.closedNote && sched.closedNote["w" + wk]) || "";
  }
  function setWeekReason(wk, txt) {
    if (!sched.closedNote) sched.closedNote = {};
    sched.closedNote["w" + wk] = txt;
  }
  function isRoleClosed(wk, roleKey) {
    // Minggu yang ditutup penuh menutup SEMUA role minggu itu, termasuk
    // bagi penjadwal otomatis - fill() memakai fungsi ini.
    if (isWeekClosed(wk)) return true;
    var c = sched.closed && sched.closed["w" + wk];
    return !!(c && c[roleKey]);
  }
  function setRoleClosed(wk, roleKey, on) {
    if (!sched.closed) sched.closed = {};
    var k = "w" + wk;
    if (!sched.closed[k]) sched.closed[k] = {};
    if (on) sched.closed[k][roleKey] = true;
    else delete sched.closed[k][roleKey];
  }
  function buildTutupMingguBtn(wk) {
    var b = document.createElement("button");
    b.type = "button";
    var tutup = isWeekClosed(wk);
    b.className = "tutupBtn wkTutupBtn" + (tutup ? " on" : "");
    b.textContent = tutup ? "Buka minggu" : "Tutup minggu";
    b.title = tutup
      ? "Buka kembali seluruh pelayanan di minggu ini"
      : "Tutup seluruh pelayanan minggu ini, dari Doa Pembuka sampai Banners";
    b.style.cssText =
      "margin-top:5px;width:100%;padding:2px 7px;border-radius:7px;" +
      "border:1px solid " +
      (tutup ? "#0d9488" : "#d1d5db") +
      ";background:" +
      (tutup ? "#ccfbf1" : "transparent") +
      ";color:" +
      (tutup ? "#0f766e" : "#9ca3af") +
      ";font-size:10px;cursor:pointer";
    b.onclick = function () {
      var akan = !tutup;
      if (akan) {
        var jml = 0;
        allSchedRoles().forEach(function (r) {
          jml += getAssign(wk, r.key).length;
        });
        if (
          jml &&
          !confirm(
            "Tutup seluruh Minggu " +
              wk +
              "? " +
              jml +
              " nama yang sudah terpasang hanya disembunyikan, tidak dihapus - akan muncul lagi kalau minggu ini dibuka.",
          )
        )
          return;
      }
      setWeekClosed(wk, akan);
      if (akan && !weekReason(wk)) setWeekReason(wk, "Tidak ada ibadah");
      saveSched(true);
      schedHistPush();
      renderSchedule();
    };
    return b;
  }
  function buildWeekReason(wk, admin) {
    var box = document.createElement("div");
    box.className = "wkTutupBox";
    var tg = document.createElement("span");
    tg.className = "tutupTag";
    tg.textContent = "Minggu ditutup";
    tg.style.cssText =
      "display:inline-block;padding:2px 8px;border-radius:8px;" +
      "background:#e5e7eb;color:#6b7280;font-size:11px;font-style:italic";
    box.appendChild(tg);
    if (admin) {
      var ta = document.createElement("textarea");
      ta.className = "wkTutupInp";
      ta.rows = 3;
      ta.placeholder = "Alasan ditutup (dibaca semua member)...";
      ta.value = weekReason(wk);
      ta.onchange = function () {
        setWeekReason(wk, ta.value);
        saveSched(true);
      };
      box.appendChild(ta);
    } else {
      var pv = document.createElement("div");
      pv.className = "wkTutupTxt";
      pv.textContent = weekReason(wk) || "-";
      box.appendChild(pv);
    }
    return box;
  }
  function buildTutupBtn(wk, roleKey, tutup) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tutupBtn";
    b.textContent = tutup ? "Buka" : "Tutup";
    b.title = tutup
      ? "Buka kembali pelayanan ini di minggu ini"
      : "Tutup pelayanan ini di minggu ini";
    b.style.cssText =
      "display:block;margin-top:4px;padding:1px 7px;border-radius:7px;" +
      "border:1px solid " +
      (tutup ? "#0d9488" : "#d1d5db") +
      ";background:" +
      (tutup ? "#ccfbf1" : "transparent") +
      ";color:" +
      (tutup ? "#0f766e" : "#9ca3af") +
      ";font-size:10px;cursor:pointer";
    b.onclick = function () {
      var akan = !tutup;
      if (akan) {
        var isi = getAssign(wk, roleKey);
        if (
          isi.length &&
          !confirm(
            "Tutup pelayanan ini di minggu " +
              wk +
              "? " +
              isi.length +
              " nama yang sudah terisi akan dikosongkan.",
          )
        )
          return;
        setAssign(wk, roleKey, []);
      }
      setRoleClosed(wk, roleKey, akan);
      // saveSched penuh, bukan saveSchedCell: yang berubah bukan hanya
      // isi sel tapi juga peta sched.closed.
      saveSched();
      schedHistPush();
      renderSchedule();
    };
    return b;
  }
  var LEGACY_CAP = {
    doaBuka: [
      "Martin",
      "Yesika",
      "Anugerah",
      "Adit",
      "Ibrani",
      "Nico",
      "Kethrin",
      "Anggi",
    ],
    pengumuman: [
      "Adit",
      "Ibrani",
      "Martin",
      "Yesika",
      "Anugerah",
      "Nico",
      "Karin",
    ],
    doaTutup: PENGURUS,
    camera: ["Florie", "Chintya", "Grace"],
    liveReport: ["Mia", "Billy"],
  };
  // v2.5 - hanya ada satu role Presenter. Presenter tetap jadi pilihan
  // utama (tier 1), yang trial tetap dipakai sebagai cadangan (tier 2).
  ROLE_PICKS.presenter = {
    t1: PRESENTER_TETAP,
    t2: PRESENTER_TRIAL,
    t3: [],
  };
  // Peta role aktual -> sumber prioritas di ROLE_PICKS.
  var ROLE_SRC = {
    usher: "usher",
    presenter: "presenter",
    streaming: "streaming",
    sound: "sound",
    wlPNW: "wlsing",
    singPNW: "wlsing",
    wlPsb: "wlsing",
    singPsb: "wlsing",
    kbPNW: "keyboard",
    kbPsb: "keyboard",
    gtPNW: "guitar",
    gtPsb: "guitar",
    bsPNW: "bass",
    bsPsb: "bass",
    drPNW: "drum",
    drPsb: "drum",
    tamb: "tambourine",
    ban: "banners",
  };
  // Izin: alias menyatukan ejaan berbeda ke satu nama roster.
  var IZIN_ALIAS = {
    "Bill Stephen": "Billy",
    Yessica: "Yesika",
    Gilberto: "Gilberth",
    Gilbert: "Gilberth",
  };
  var RAW_IZIN_INPUT = [
    ["Bill Stephen", [1, 2, 3]],
    ["Florie", [1, 4]],
    ["Natha", [4]],
    ["Yemima", [1, 2, 3, 4, 5]],
    ["Gilberto", [1, 4, 5]],
    ["Chintya", [1, 2, 3, 4, 5]],
    ["Mishael", [1, 4, 5]],
    ["Adit", [1, 2, 3]],
    ["Joshua", [1, 4]],
    ["Amos", [1, 2]],
    ["Mia", [1, 2, 3, 4]],
    ["Tessa", [2]],
    ["Yessica", [1]],
    ["Gilbert", [1, 2, 3, 4, 5]],
    ["Florie", [1, 4, 5]],
    ["Martin", [3, 4]],
  ];
  // Request khusus (dikunci sebelum auto-fill).
  var REQUESTS = [{ name: "Natha", roleKey: "wlPNW", week: 2 }];
  function defaultSched() {
    var people = {};
    function addCap(name, roleKey, tier) {
      if (!people[name]) people[name] = {};
      if (!people[name][roleKey] || tier < people[name][roleKey])
        people[name][roleKey] = tier;
    }
    Object.keys(ROLE_SRC).forEach(function (rk) {
      var src = ROLE_PICKS[ROLE_SRC[rk]];
      if (!src) return;
      (src.t1 || []).forEach(function (n) {
        addCap(n, rk, 1);
      });
      (src.t2 || []).forEach(function (n) {
        addCap(n, rk, 2);
      });
      (src.t3 || []).forEach(function (n) {
        addCap(n, rk, 3);
      });
    });
    Object.keys(LEGACY_CAP).forEach(function (rk) {
      LEGACY_CAP[rk].forEach(function (n) {
        addCap(n, rk, 1);
      });
    });
    var izinByName = {};
    RAW_IZIN_INPUT.forEach(function (row) {
      var nm = IZIN_ALIAS[row[0]] || row[0];
      if (!izinByName[nm]) izinByName[nm] = [];
      row[1].forEach(function (wk) {
        if (izinByName[nm].indexOf(wk) < 0) izinByName[nm].push(wk);
      });
    });
    Object.keys(izinByName).forEach(function (nm) {
      if (!people[nm]) people[nm] = {};
    });
    var names = Object.keys(people).sort(function (a, b) {
      return a.localeCompare(b, "id", { sensitivity: "base" });
    });
    var roster = names.map(function (nm, i) {
      var tiers = people[nm];
      return {
        id: "p-" + i + "-" + Math.floor(Math.random() * 100000),
        name: nm,
        roles: Object.keys(tiers),
        tiers: tiers,
      };
    });
    var izin = {};
    roster.forEach(function (p) {
      if (izinByName[p.name]) {
        izinByName[p.name].sort(function (a, b) {
          return a - b;
        });
        izin[p.id] = izinByName[p.name].slice();
      }
    });
    return {
      weeks: 5,
      roster: roster,
      izin: izin,
      assign: {},
      auto: false,
      allowDouble: false,
      allowMusLintasSesi: false,
      weekLabels: {},
      startISO: "",
      requests: REQUESTS.slice(),
    };
  }
  function loadSched() {
    try {
      var raw = localStorage.getItem(SCHED_KEY);
      if (raw) {
        var v = JSON.parse(raw);
        if (v && v.roster) return v;
      }
    } catch (e) {}
    return defaultSched();
  }
  var sched = schedNormalize(loadSched());
  function saveSched(silent) {
    try {
      localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
    } catch (e) {}
    try {
      backupMaybe("sched");
    } catch (e) {}
    if (cloudReady && scheduleRef) {
      // v3.1 - catat cap waktu tulisan kita sendiri supaya gema
      // (echo) dari Firebase bisa dikenali dan diabaikan.
      window.__schedWriteAt = Date.now();
      sched.meta = { by: schedWho(), at: window.__schedWriteAt };
      try {
        scheduleRef.set(schedClean(sched), function (err) {
          if (err) {
            console.error("simpan jadwal gagal", err);
            var den = fbDenied(err);
            schedCloudStatus(
              den ? "Cloud: perlu masuk admin" : "Cloud tidak terhubung",
            );
            toast(
              den
                ? "Jadwal tersimpan di perangkat ini. Untuk ikut tersimpan ke cloud, masuk sebagai admin dulu."
                : "Jadwal tersimpan di perangkat ini. Cloud sedang tidak bisa dihubungi.",
              den ? "info" : "error",
              6000,
            );
          } else schedCloudStatus("Realtime aktif");
        });
      } catch (e) {
        console.error("simpan jadwal gagal", e);
        toast("Gagal menyimpan jadwal ke cloud.", "error");
      }
    } else {
      initScheduleCloud();
    }
    if (!silent) {
      var sp = document.getElementById("schedSaveStatus");
      if (sp) {
        sp.textContent = "Tersimpan";
        setTimeout(function () {
          if (sp) sp.textContent = "";
        }, 1500);
      }
    }
  }
  function schedWho() {
    try {
      return localStorage.getItem("ptAdminUser") || "pengurus";
    } catch (e) {
      return "pengurus";
    }
  }
  // v3.1 - tulis HANYA daftar pelayan, bukan seluruh objek jadwal.
  // Menulis seluruh objek membuat Firebase memantulkan balik data besar
  // yang lalu mengganti variabel `sched`, sehingga kartu pelayan yang
  // sedang dibuka menunjuk ke objek usang.
  function saveSchedRoster() {
    try {
      localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
    } catch (e) {}
    if (cloudReady && scheduleRef) {
      try {
        window.__schedWriteAt = Date.now();
        scheduleRef
          .child("meta")
          .set({ by: schedWho(), at: window.__schedWriteAt });
        scheduleRef.child("roster").set(schedClean(sched.roster));
        schedCloudStatus("Realtime aktif");
      } catch (e) {
        console.error("simpan pelayan gagal", e);
        schedCloudStatus("Gagal simpan ke cloud");
      }
    } else {
      initScheduleCloud();
    }
  }
  // v2.3 - tulis HANYA satu sel ke Firebase supaya beberapa pengurus bisa
  // mengedit bersamaan tanpa saling menimpa (penggabungan per-path).
  function saveSchedCell(wk, roleKey) {
    try {
      localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
    } catch (e) {}
    if (cloudReady && scheduleRef) {
      try {
        // v3.1 - meta ditulis LEBIH DULU supaya setiap gema yang
        // menyusul sudah membawa cap waktu kita dan bisa diabaikan.
        window.__schedWriteAt = Date.now();
        scheduleRef
          .child("meta")
          .set({ by: schedWho(), at: window.__schedWriteAt });
        scheduleRef
          .child("assign/w" + wk + "/" + roleKey)
          .set(schedClean(getAssign(wk, roleKey)), function (err) {
            if (err) {
              console.error("simpan sel gagal", err);
              schedCloudStatus("Gagal simpan ke cloud");
              toast("Gagal menyimpan perubahan ke cloud.", "error");
            } else schedCloudStatus("Realtime aktif");
          });
      } catch (e) {
        console.error("simpan sel gagal", e);
      }
    } else {
      initScheduleCloud();
    }
    var sp = document.getElementById("schedSaveStatus");
    if (sp) {
      sp.textContent = "Tersimpan";
      setTimeout(function () {
        if (sp) sp.textContent = "";
      }, 1500);
    }
  }
  // v2.4 - status sinkronisasi supaya kegagalan tidak lagi tersembunyi.
  function schedCloudStatus(txt) {
    window.__schedSyncTxt = txt;
    var sp = document.getElementById("schedSyncPill");
    if (sp) sp.textContent = txt;
  }
  // Firebase menolak nilai undefined; bersihkan dulu agar set() tidak gagal.
  function schedWeekDate(w) {
    var iso = sched && sched.startISO;
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var p = iso.split("-");
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + 7 * (w - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function reminderAssignHtml(w) {
    var out = "";
    SCHED_TEAMS.forEach(function (team) {
      var lines = "";
      team.roles.forEach(function (role) {
        try {
          if (isRoleClosed(w, role.key)) return;
        } catch (e) {}
        var names = (getAssign(w, role.key) || [])
          .map(personName)
          .filter(Boolean);
        if (!names.length) return;
        lines +=
          '<div class="remRole"><span class="remRoleName">' +
          escReq(role.label) +
          "</span> " +
          escReq(names.join(", ")) +
          "</div>";
      });
      if (lines)
        out +=
          '<div class="remTeam"><b>' +
          escReq(team.label) +
          "</b>" +
          lines +
          "</div>";
    });
    return (
      out ||
      '<p class="small">Belum ada petugas yang dijadwalkan untuk minggu ini.</p>'
    );
  }
  function buildReminder() {
    var card = document.getElementById("reminderCard");
    if (!card) return;
    var weeks = (sched && sched.weeks) || 0;
    var found = -1,
      foundDate = null,
      days = -1;
    for (var w = 1; w <= weeks; w++) {
      var dt = schedWeekDate(w);
      if (!dt) continue;
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var du = Math.round((dt.getTime() - today.getTime()) / 86400000);
      if (du === 0 || du === 1) {
        found = w;
        foundDate = dt;
        days = du;
        break;
      }
    }
    if (found < 0) {
      card.hidden = true;
      return;
    }
    var iso =
      foundDate.getFullYear() +
      "-" +
      ("0" + (foundDate.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + foundDate.getDate()).slice(-2);
    var dkey = "w" + found + "|" + iso;
    try {
      if (localStorage.getItem("pnwReminderDismiss") === dkey) {
        card.hidden = true;
        return;
      }
    } catch (e) {}
    card._dkey = dkey;
    var head = document.getElementById("reminderHead");
    var dl = document.getElementById("reminderDate");
    var body = document.getElementById("reminderBody");
    if (head)
      head.textContent =
        days === 1
          ? "\uD83D\uDD14 Besok ada ibadah!"
          : "\uD83D\uDD14 Hari ini ada ibadah!";
    if (dl) {
      try {
        dl.textContent = foundDate.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch (e) {
        dl.textContent = iso;
      }
    }
    if (body) body.innerHTML = reminderAssignHtml(found);
    card.hidden = false;
  }
  function dismissReminder() {
    var card = document.getElementById("reminderCard");
    if (card && card._dkey) {
      try {
        localStorage.setItem("pnwReminderDismiss", card._dkey);
      } catch (e) {}
    }
    if (card) card.hidden = true;
  }
  function syncStartDateInput() {
    var i = document.getElementById("schedStartDate");
    if (i) i.value = (sched && sched.startISO) || "";
  }
  function schedClean(v) {
    if (v === undefined || v === null) return null;
    if (Array.isArray(v)) {
      var a = [];
      v.forEach(function (x) {
        if (x !== undefined && x !== null) a.push(schedClean(x));
      });
      return a;
    }
    if (typeof v === "object") {
      var o = {};
      Object.keys(v).forEach(function (k) {
        if (v[k] === undefined) return;
        o[k] = schedClean(v[k]);
      });
      return o;
    }
    if (typeof v === "number" && !isFinite(v)) return 0;
    return v;
  }
  // Firebase mengembalikan array jarang sebagai objek berkunci angka.
  function schedToArr(v) {
    if (Array.isArray(v))
      return v.filter(function (x) {
        return x !== null && x !== undefined;
      });
    if (v && typeof v === "object")
      return Object.keys(v)
        .sort(function (a, b) {
          return Number(a) - Number(b);
        })
        .map(function (k) {
          return v[k];
        })
        .filter(function (x) {
          return x !== null && x !== undefined;
        });
    return [];
  }
  // Kembalikan data cloud ke bentuk yang diharapkan aplikasi.
  function schedNormalize(s) {
    if (!s || typeof s !== "object") return s;
    s.weeks = Number(s.weeks) || 5;
    s.roster = schedToArr(s.roster);
    s.roster.forEach(function (p) {
      if (!p.tiers || typeof p.tiers !== "object") p.tiers = {};
      p.roles = schedToArr(p.roles);
    });
    if (!s.izin || typeof s.izin !== "object") s.izin = {};
    Object.keys(s.izin).forEach(function (k) {
      s.izin[k] = schedToArr(s.izin[k]).map(Number);
    });
    if (!s.assign || typeof s.assign !== "object") s.assign = {};
    Object.keys(s.assign).forEach(function (wk) {
      var wa = s.assign[wk];
      if (!wa || typeof wa !== "object") {
        s.assign[wk] = {};
        return;
      }
      delete wa.mulmed; // v2.4 - Multimedia dilebur ke Presenter.
      Object.keys(wa).forEach(function (rk) {
        wa[rk] = schedToArr(wa[rk]);
      });
    });
    if (!s.weekLabels || typeof s.weekLabels !== "object") s.weekLabels = {};
    if (typeof s.startISO !== "string")
      s.startISO = s.startISO ? String(s.startISO) : "";
    if (!s.closed || typeof s.closed !== "object") s.closed = {};
    Object.keys(s.closed).forEach(function (wk) {
      if (!s.closed[wk] || typeof s.closed[wk] !== "object") s.closed[wk] = {};
    });
    return s;
  }
  // v2.9 - render ulang akibat sinkronisasi ditunda SELAMA pengurus masih
  // mengetik atau memilih di halaman jadwal. Versi lama memaksa render
  // setelah 4 detik, yang menghapus ketikan pencarian di tengah jalan.
  function schedRenderSaatSenggang() {
    var pg = document.getElementById("schedulePage");
    if (!pg || !pg.classList.contains("open")) return;
    var ae = document.activeElement;
    var sibuk =
      ae &&
      pg.contains(ae) &&
      ((ae.tagName === "INPUT" &&
        ae.type !== "checkbox" &&
        ae.type !== "radio") ||
        ae.tagName === "SELECT" ||
        ae.tagName === "TEXTAREA");
    if (sibuk) {
      clearTimeout(window.__schedRT);
      window.__schedRT = setTimeout(schedRenderSaatSenggang, 1500);
      return;
    }
    renderSchedule();
  }
  // ===== Rate limiting (v44+) =====
  var __rl = {};
  function rateLimited(key, ms) {
    var now = Date.now();
    var last = __rl[key] || 0;
    if (now - last < ms) return true;
    __rl[key] = now;
    return false;
  }
  var __wbursts = [];
  function writeBurstOk(limit, windowMs) {
    var now = Date.now();
    __wbursts = __wbursts.filter(function (t) {
      return now - t < windowMs;
    });
    if (__wbursts.length >= limit) return false;
    __wbursts.push(now);
    return true;
  }
  // ===== end rate limiting =====
  // ===== Backup & pemulihan data (v42+) =====
  var BACKUP_KEY = "pujianYouthBackups.v1";
  var BACKUP_MAX = 8;
  var BACKUP_MIN_GAP = 25000;
  var __lastBackupAt = 0;
  function schedHasContent(s) {
    try {
      if (!s || !s.roster) return false;
      var j = JSON.stringify(s.roster) || "";
      return /[A-Za-z0-9]/.test(j.replace(/[\[\]{}",:\s]/g, ""));
    } catch (e) {
      return false;
    }
  }
  function backupSnapshotObj() {
    return {
      app: "pnw-tools",
      kind: "backup",
      at: new Date().toISOString(),
      ts: Date.now(),
      counts: { songs: (songs || []).length, bank: (bankSongs || []).length },
      data: {
        songs: songs || [],
        songBank: bankSongs || [],
        schedule: sched || null,
      },
    };
  }
  function backupList() {
    try {
      var raw = localStorage.getItem(BACKUP_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function backupStore(list) {
    var copy = list.slice();
    while (copy.length) {
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(copy));
        return true;
      } catch (e) {
        copy.shift();
      }
    }
    try {
      localStorage.removeItem(BACKUP_KEY);
    } catch (e) {}
    return false;
  }
  function backupMaybe(reason) {
    var now = Date.now();
    if (now - __lastBackupAt < BACKUP_MIN_GAP) return;
    var snap = backupSnapshotObj();
    if (!snap.counts.songs && !snap.counts.bank && !schedHasContent(sched))
      return;
    snap.reason = reason || "auto";
    __lastBackupAt = now;
    var list = backupList();
    list.push(snap);
    while (list.length > BACKUP_MAX) list.shift();
    backupStore(list);
  }
  // v62 - cadangan paksa (abaikan jeda) untuk kejadian berisiko
  function backupForce(reason) {
    try {
      var snap = backupSnapshotObj();
      if (!snap.counts.songs && !snap.counts.bank) return;
      snap.reason = reason || "jaga-jaga";
      __lastBackupAt = Date.now();
      var list = backupList();
      list.push(snap);
      while (list.length > BACKUP_MAX) list.shift();
      backupStore(list);
    } catch (e) {}
  }
  function backupDownload(obj, name) {
    try {
      var blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json",
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    } catch (e) {
      console.error("unduh backup gagal", e);
    }
  }
  function backupExport() {
    var snap = backupSnapshotObj();
    var d = new Date();
    function p(n) {
      return (n < 10 ? "0" : "") + n;
    }
    var stamp =
      d.getFullYear() +
      p(d.getMonth() + 1) +
      p(d.getDate()) +
      "-" +
      p(d.getHours()) +
      p(d.getMinutes());
    backupDownload(snap, "pnw-backup-" + stamp + ".json");
    toast(
      "Backup diunduh (" +
        snap.counts.songs +
        " lagu, " +
        snap.counts.bank +
        " bank).",
      "success",
    );
  }
  function backupApply(obj, label) {
    if (!obj || !obj.data) {
      toast("File backup tidak valid.", "error");
      return;
    }
    if (!isAdmin) {
      toast("Hanya admin yang bisa memulihkan backup.", "error");
      return;
    }
    var d = obj.data;
    var msg =
      "Pulihkan dari " +
      (label || "backup") +
      "?\n\nLagu: " +
      ((d.songs && d.songs.length) || 0) +
      "\nBank: " +
      ((d.songBank && d.songBank.length) || 0) +
      "\n\nData saat ini akan DIGANTI (lokal & cloud).";
    if (!window.confirm(msg)) return;
    try {
      if (Array.isArray(d.songs)) {
        songs = d.songs.filter(Boolean);
        localStorage.setItem(storageKey, JSON.stringify(songs));
        if (cloudReady && dbRef) dbRef.set(songs);
      }
      if (Array.isArray(d.songBank)) {
        bankSongs = d.songBank.filter(Boolean);
        localStorage.setItem(bankKey, JSON.stringify(bankSongs));
        if (cloudReady && bankRef) bankRef.set(bankSongs);
      }
      if (d.schedule) {
        sched = schedNormalize(d.schedule);
        localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
        if (cloudReady && scheduleRef) scheduleRef.set(schedClean(sched));
      }
      try {
        makeButtons();
        render();
        refreshLibrary();
        renderSchedule();
      } catch (e) {}
      toast("Backup dipulihkan.", "success");
    } catch (e) {
      console.error("pulihkan backup gagal", e);
      toast("Gagal memulihkan backup.", "error");
    }
  }
  function backupImportFile() {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json,.json";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var obj = JSON.parse(String(rd.result));
          backupApply(obj, "file " + f.name);
        } catch (e) {
          toast("File backup tidak bisa dibaca.", "error");
        }
      };
      rd.readAsText(f);
    };
    inp.click();
  }
  function backupRestoreLocalMenu() {
    var list = backupList();
    if (!list.length) {
      toast("Belum ada snapshot lokal.");
      return;
    }
    var lines = list
      .map(function (s, i) {
        var t = new Date(s.ts || s.at);
        return (
          i +
          1 +
          ". " +
          t.toLocaleString() +
          " - " +
          ((s.counts && s.counts.songs) || 0) +
          " lagu, " +
          ((s.counts && s.counts.bank) || 0) +
          " bank (" +
          (s.reason || "auto") +
          ")"
        );
      })
      .join("\n");
    var pick = window.prompt(
      "Snapshot lokal (terbaru di bawah):\n\n" +
        lines +
        "\n\nKetik nomor untuk memulihkan:",
      String(list.length),
    );
    if (!pick) return;
    var idx = parseInt(pick, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= list.length) {
      toast("Nomor tidak valid.", "error");
      return;
    }
    var s = list[idx];
    backupApply(s, "snapshot " + new Date(s.ts || s.at).toLocaleString());
  }
  function initBackupUI() {
    var panel = document.getElementById("adminPanel");
    if (!panel || document.getElementById("backupSec")) return;
    var sec = document.createElement("div");
    sec.id = "backupSec";
    sec.style.marginTop = "14px";
    sec.style.paddingTop = "12px";
    sec.style.borderTop = "1px solid var(--line)";
    var h = document.createElement("div");
    h.textContent = "Backup & pemulihan data";
    h.style.fontWeight = "700";
    h.style.marginBottom = "8px";
    sec.appendChild(h);
    var row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.gap = "8px";
    function mkBtn(label, fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.padding = "8px 12px";
      b.style.borderRadius = "10px";
      b.style.border = "1px solid var(--line)";
      b.style.background = "var(--soft)";
      b.style.cursor = "pointer";
      b.onclick = fn;
      return b;
    }
    row.appendChild(mkBtn("Export backup", backupExport));
    row.appendChild(mkBtn("Import backup", backupImportFile));
    row.appendChild(mkBtn("Pulihkan snapshot lokal", backupRestoreLocalMenu));
    sec.appendChild(row);
    var note = document.createElement("div");
    note.style.fontSize = "12px";
    note.style.color = "var(--muted)";
    note.style.marginTop = "6px";
    note.textContent =
      "Snapshot lokal otomatis tersimpan di perangkat ini (maks " +
      BACKUP_MAX +
      "). Export untuk simpanan permanen.";
    sec.appendChild(note);
    panel.appendChild(sec);
  }
  // ===== end backup =====
  function schedApplyRemote(v) {
    if (v == null) {
      if (scheduleRef && schedHasContent(sched))
        scheduleRef.set(schedClean(sched));
      return;
    }
    if (!v.roster) return;
    var meta = v.meta || {};
    // v3.1 - INI gema tulisan kita sendiri. Kalau tetap diproses,
    // variabel `sched` diganti objek baru sehingga closure kartu
    // pelayan menunjuk ke objek usang, dan centang yang baru dilepas
    // muncul kembali. Keadaan lokal sudah benar, jadi berhenti di sini.
    if (meta.at && meta.at === window.__schedWriteAt) {
      schedCloudStatus("Realtime aktif");
      return;
    }
    sched = schedNormalize(v);
    try {
      syncStartDateInput();
      buildReminder();
    } catch (e) {}
    PIDX = null;
    // Kalau perubahan datang dari pengurus LAIN, riwayat undo lokal
    // dikosongkan. Tanpa ini, menekan Undo akan mengembalikan data lama
    // dan menimpa pekerjaan orang tersebut.
    if (meta.by && meta.by !== schedWho()) schedHistReset();
    else schedHistPush();
    try {
      localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
    } catch (e) {}
    schedCloudStatus("Realtime aktif");
    if (
      meta.by &&
      meta.by !== schedWho() &&
      Date.now() - (meta.at || 0) < 20000
    )
      toast("Jadwal diperbarui oleh " + meta.by, "info", 2600);
    var pg = document.getElementById("schedulePage");
    if (pg && pg.classList.contains("open")) {
      // Tidak ada lagi batas waktu 4 detik.
      schedRenderSaatSenggang();
    }
  }
  function initScheduleCloud() {
    if (schedInited) return;
    if (
      !cloudReady ||
      typeof firebase === "undefined" ||
      !firebase.apps ||
      !firebase.apps.length
    ) {
      // v2.4 - cloud belum siap: coba lagi, jangan berhenti diam-diam.
      schedCloudStatus("Menyambung...");
      clearTimeout(window.__schedInitRT);
      window.__schedInitRT = setTimeout(initScheduleCloud, 800);
      return;
    }
    try {
      scheduleRef = firebase.database().ref("pujianYouth/schedule4");
      schedInited = true;
      schedCloudStatus("Realtime aktif");
      scheduleRef.on(
        "value",
        function (snap) {
          try {
            schedApplyRemote(snap.val());
          } catch (e) {
            console.error("sinkron jadwal", e);
          }
        },
        function (err) {
          console.error("sinkron jadwal gagal", err);
          var code = (err && (err.code || err.message)) || "UNKNOWN";
          window.__schedErr = String(code);
          schedInited = false;
          scheduleRef = null;
          if (/permission|denied/i.test(String(code))) {
            // Aturan Realtime Database menolak akses. Mencoba lagi
            // tidak ada gunanya sampai aturannya diperbaiki.
            schedCloudStatus("Ditolak Firebase (izin akses)");
            if (!window.__schedPermToast) {
              window.__schedPermToast = 1;
              toast(
                "Firebase menolak akses jadwal (PERMISSION_DENIED). Aturan database harus mengizinkan pujianYouth/schedule4.",
                "error",
                9000,
              );
            }
            return;
          }
          schedCloudStatus("Sinkron gagal: " + code);
          clearTimeout(window.__schedInitRT);
          window.__schedInitRT = setTimeout(initScheduleCloud, 3000);
        },
      );
    } catch (e) {
      console.error(e);
      schedInited = false;
      schedCloudStatus("Sinkron gagal");
    }
  }
  // v2.5 - indeks roster: pencarian nama jadi O(1). Sebelumnya setiap
  // chip memindai seluruh roster, dan grid bisa berisi ratusan chip.
  var PIDX = null;
  function rebuildPidx() {
    PIDX = {};
    (sched.roster || []).forEach(function (p) {
      PIDX[p.id] = p;
    });
  }
  function personById(id) {
    if (!PIDX) rebuildPidx();
    return PIDX[id] || null;
  }
  function personName(id) {
    var p = personById(id);
    return p ? p.name : "?";
  }
  function isIzin(pid, wk) {
    return !!(sched.izin[pid] && sched.izin[pid].indexOf(wk) >= 0);
  }
  function weekAssignments(wk) {
    return sched.assign["w" + wk] || {};
  }
  function rolesOfPersonInWeek(pid, wk) {
    var wa = weekAssignments(wk);
    var out = [];
    Object.keys(wa).forEach(function (rk) {
      if ((wa[rk] || []).indexOf(pid) >= 0) out.push(rk);
    });
    return out;
  }
  function canDouble(roleKey) {
    var r = schedRole(roleKey);
    return !!(r && r.dbl);
  }
  function eligible(roleKey, wk, allowIzin) {
    return sched.roster.filter(function (p) {
      if (p.roles.indexOf(roleKey) < 0) return false;
      if (!allowIzin && isIzin(p.id, wk)) return false;
      return true;
    });
  }
  // ===== Riwayat Undo / Redo jadwal (v2.7) =====
  // Yang disimpan hanya cuplikan sched.assign, BUKAN seluruh sched.
  // Jadi Undo hanya membatalkan penempatan orang - data roster, izin,
  // dan label minggu tidak pernah ikut termundurkan.
  var schedHist = { stack: [], idx: -1, max: 40 };
  var schedHistBusy = false;
  function schedSnap() {
    // v2.9 - cuplikan mencakup penempatan DAN peta role tertutup,
    // supaya menutup/membuka role juga bisa dibatalkan.
    try {
      return JSON.stringify({
        a: sched.assign || {},
        c: sched.closed || {},
      });
    } catch (e) {
      return '{"a":{},"c":{}}';
    }
  }
  function schedHistReset() {
    schedHist.stack = [schedSnap()];
    schedHist.idx = 0;
    schedHistBtns();
  }
  function schedHistPush() {
    if (schedHistBusy) return;
    var snap = schedSnap();
    if (schedHist.idx >= 0 && schedHist.stack[schedHist.idx] === snap) return;
    // Setelah aksi baru, cabang "maju" yang lama tidak berlaku lagi.
    schedHist.stack = schedHist.stack.slice(0, schedHist.idx + 1);
    schedHist.stack.push(snap);
    if (schedHist.stack.length > schedHist.max) schedHist.stack.shift();
    schedHist.idx = schedHist.stack.length - 1;
    schedHistBtns();
  }
  function schedHistApply(snap) {
    schedHistBusy = true;
    try {
      var o = JSON.parse(snap) || {};
      sched.assign = o.a || {};
      sched.closed = o.c || {};
    } catch (e) {
      sched.assign = {};
      sched.closed = {};
    }
    // Undo mengubah banyak sel sekaligus, jadi simpan PENUH ke cloud;
    // saveSchedCell yang per-sel tidak cukup untuk kasus ini.
    saveSched(true);
    renderSchedule();
    schedHistBusy = false;
    schedHistBtns();
  }
  function schedUndo() {
    if (!isAdmin) return;
    if (schedHist.idx <= 0) {
      toast("Tidak ada lagi yang bisa dibatalkan.", "info", 2000);
      return;
    }
    schedHist.idx--;
    schedHistApply(schedHist.stack[schedHist.idx]);
    toast("Dibatalkan (undo).", "info", 1800);
  }
  function schedRedo() {
    if (!isAdmin) return;
    if (schedHist.idx >= schedHist.stack.length - 1) {
      toast("Tidak ada lagi yang bisa diulang.", "info", 2000);
      return;
    }
    schedHist.idx++;
    schedHistApply(schedHist.stack[schedHist.idx]);
    toast("Diulang (redo).", "info", 1800);
  }
  function schedHistBtns() {
    var u = document.getElementById("schedUndoBtn");
    var r = document.getElementById("schedRedoBtn");
    if (u) u.disabled = schedHist.idx <= 0;
    if (r) r.disabled = schedHist.idx >= schedHist.stack.length - 1;
  }
  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y - hanya saat halaman jadwal terbuka.
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    var pg = document.getElementById("schedulePage");
    if (!pg || !pg.classList.contains("open") || !isAdmin) return;
    var k = (e.key || "").toLowerCase();
    if (k === "z" && !e.shiftKey) {
      e.preventDefault();
      schedUndo();
    } else if ((k === "z" && e.shiftKey) || k === "y") {
      e.preventDefault();
      schedRedo();
    }
  });
  function setAssign(wk, roleKey, arr) {
    if (!sched.assign["w" + wk]) sched.assign["w" + wk] = {};
    sched.assign["w" + wk][roleKey] = arr;
  }
  function getAssign(wk, roleKey) {
    var wa = weekAssignments(wk);
    return (wa[roleKey] || []).slice();
  }
  // v3.6 (aturan A & B) - kuota LUNAK. Tiap role di Sound & Multimedia
  // dan di tim Worship idealnya diisi sesuai kuota, tapi admin boleh
  // menambah SATU orang lagi di atas kuota dengan peringatan.
  // Hospitality tetap keras (usher 3, doa, pengumuman).
  function bolehSlotLebih(rk) {
    return (
      SOUND_MM_ROLES.indexOf(rk) >= 0 ||
      WORSHIP_ALL_ROLES.indexOf(rk) >= 0 ||
      rk === "tamb" ||
      rk === "ban"
    );
  }
  function batasSlot(rk) {
    var r = schedRole(rk);
    var sl = (r && r.slots) || 1;
    return bolehSlotLebih(rk) ? sl + 1 : sl;
  }
  function assignPerson(wk, roleKey, pid) {
    var arr = getAssign(wk, roleKey);
    if (arr.indexOf(pid) >= 0) return false;
    var role = schedRole(roleKey);
    var slots = (role && role.slots) || 1;
    var batas = batasSlot(roleKey);
    // Ditandai SEBELUM push, tapi toastnya baru muncul setelah semua
    // gerbang aturan lolos - supaya tidak ada peringatan kuota untuk
    // penempatan yang ujungnya ditolak H9/H10/H11.
    var lebihKuota = arr.length >= slots;
    if (arr.length >= batas) {
      toast(
        "Slot " +
          (role ? role.label : roleKey) +
          " sudah penuh (" +
          batas +
          ").",
        "info",
      );
      return false;
    }
    // H9 - tim Sound & Multimedia tidak boleh merangkap ke tim lain pada
    // minggu yang sama, dan sebaliknya. Ini aturan KERAS, jadi pengisian
    // manual ikut diblokir - sebelumnya hanya penjadwal otomatis yang
    // memeriksanya, sehingga admin masih bisa melanggar lewat + tambah.
    var rpW9 = rolesOfPersonInWeek(pid, wk);
    var hasMM9 = false,
      hasOther9 = false;
    for (var i9 = 0; i9 < rpW9.length; i9++) {
      if (isSoundMMRole(rpW9[i9])) hasMM9 = true;
      else hasOther9 = true;
    }
    if (isSoundMMRole(roleKey) ? hasOther9 : hasMM9) {
      toast(
        personName(pid) +
          (isSoundMMRole(roleKey)
            ? " sudah bertugas di tim lain minggu ini, jadi tidak bisa masuk Sound & Multimedia."
            : " ada di tim Sound & Multimedia minggu ini, jadi tidak bisa merangkap tugas di tim lain."),
        "error",
        4200,
      );
      return false;
    }
    // H10/H11 - kelompok eksklusif. Diblokir keras, termasuk saat
    // opsi "Izinkan double role" sedang aktif.
    var kfl = konflikEksklusif(pid, wk, roleKey, {
      musLintasSesi: !!sched.allowMusLintasSesi,
    });
    if (kfl) {
      toast(
        personName(pid) +
          " sudah mengambil " +
          musRoleLabel(kfl.rk) +
          " minggu ini - " +
          kfl.alasan +
          ".",
        "error",
        4600,
      );
      return false;
    }
    // Double role: beri PERINGATAN saja (tidak memblokir). Bisa dimatikan
    // lewat opsi "Izinkan double role" (sched.allowDouble).
    var existingRoles = rolesOfPersonInWeek(pid, wk);
    if (existingRoles.length && !sched.allowDouble) {
      var whitelisted = canDouble(roleKey);
      existingRoles.forEach(function (rk) {
        if (!canDouble(rk)) whitelisted = false;
      });
      toast(
        personName(pid) +
          " sudah punya tugas lain minggu ini" +
          (whitelisted ? "" : " (di luar whitelist rangkap)") +
          ". Ditandai rangkap (kuning).",
        "info",
        3600,
      );
    }
    arr.push(pid);
    setAssign(wk, roleKey, arr);
    if (lebihKuota)
      toast(
        (role ? role.label : roleKey) +
          " minggu ini kini diisi " +
          arr.length +
          " orang - di atas kuota " +
          slots +
          ". Pastikan ini memang disengaja.",
        "info",
        5000,
      );
    if (sched.auto && !schedAutoWarned) {
      schedAutoWarned = true;
      toast(
        "Anda mengubah jadwal yang dibuat otomatis. Perubahan manual disimpan.",
        "info",
        4000,
      );
    }
    saveSchedCell(wk, roleKey);
    schedHistPush();
    return true;
  }
  function removeAssign(wk, roleKey, pid) {
    var arr = getAssign(wk, roleKey).filter(function (x) {
      return x !== pid;
    });
    setAssign(wk, roleKey, arr);
    saveSchedCell(wk, roleKey);
    schedHistPush();
  }
  // v3.4 - p.roles adalah SATU-SATUNYA sumber kebenaran untuk
  // "apakah orang ini boleh mengisi role tsb". Sebelumnya p.tiers
  // diperiksa LEBIH DULU, sehingga role yang baru dilepas centangnya di
  // tab Pelayan masih dianggap sah - centang hanya mengubah p.roles dan
  // tidak pernah menyentuh p.tiers. Itu sebabnya menghapus nama lalu
  // membuat ulang "berhasil" (orang baru tidak punya p.tiers sama
  // sekali), padahal melepas centang tidak berpengaruh.
  // p.tiers sengaja TIDAK dihapus: dia disimpan sebagai ingatan
  // prioritas, jadi kalau role dicentang lagi tingkat aslinya
  // (hijau/kuning/oranye) kembali seperti semula.
  function personTier(pid, roleKey) {
    var p = personById(pid);
    if (!p) return 0;
    var punya = !!p.roles && p.roles.indexOf(roleKey) >= 0;
    if (!punya) return 0;
    if (p.tiers && p.tiers[roleKey]) return p.tiers[roleKey];
    return 2;
  }
  function schedNameIn(list, pid) {
    return !!list && list.indexOf(personName(pid)) >= 0;
  }
  function isSoundMMRole(rk) {
    return SOUND_MM_ROLES.indexOf(rk) >= 0;
  }
  // v2.3 - penjadwal berbasis constraint (H1-H8) + fallback berjenjang.
  // mode "lanjut" (bawaan) = pertahankan semua nama yang sudah ada,
  // termasuk isian manual, dan hanya isi slot yang masih kosong.
  // mode "ulang" = susun dari nol.
  function autoSchedule(mode) {
    if (!canEdit()) {
      toast("Hanya admin yang bisa membuat jadwal.", "error");
      return;
    }
    mode = mode === "ulang" ? "ulang" : "lanjut";
    var weeks = sched.weeks;
    var adaIsi = false;
    for (var cw = 1; cw <= weeks; cw++) {
      allSchedRoles().forEach(function (r) {
        if (getAssign(cw, r.key).length) adaIsi = true;
      });
    }
    if (
      !confirm(
        mode === "ulang"
          ? "Susun ulang jadwal dari nol? SEMUA nama yang ada sekarang, termasuk isian manual, akan dihapus dan diganti."
          : adaIsi
            ? "Lengkapi jadwal otomatis? Nama yang sudah ada (termasuk isian manual) DIPERTAHANKAN di tempatnya, hanya kolom kosong yang diisi."
            : "Buat jadwal otomatis dengan aturan H1-H11 (hospitality, pengurus, presenter, senior/junior, selang-seling, satu alat musik, WL bukan singers)?",
      )
    )
      return;
    // v3.6 - jaring pembersih. Mode "lanjut" mempertahankan nama yang
    // sudah terpasang, jadi orang yang centang rolenya baru dilepas di
    // tab Pelayan (atau yang kini izin) akan bertahan di kolomnya karena
    // tidak pernah diperiksa lagi. Dibersihkan lebih dulu supaya tab
    // Pelayan dan jadwal selalu satu sumber kebenaran.
    var dibuang = 0;
    // v3.8.1 - doaBuka & pengumuman TIDAK dinilai dari centangan role.
    // eligible() mengisinya dari daftar usher minggu itu (H1), jadi
    // menghakiminya pakai personTier akan mengeluarkan orang yang sah.
    function bersihSah(pid, w, rk) {
      if (isIzin(pid, w)) return false;
      if (rk === "doaBuka" || rk === "pengumuman")
        return getAssign(w, "usher").indexOf(pid) >= 0;
      return personTier(pid, rk) !== 0;
    }
    // Dua tahap: usher dibersihkan lebih dulu supaya penilaian
    // doaBuka/pengumuman memakai daftar usher yang sudah bersih.
    var TAHAP_BERSIH = [
      function (rk) {
        return rk !== "doaBuka" && rk !== "pengumuman";
      },
      function (rk) {
        return rk === "doaBuka" || rk === "pengumuman";
      },
    ];
    TAHAP_BERSIH.forEach(function (pilih) {
      for (var pw = 1; pw <= weeks; pw++) {
        (function (w) {
          allSchedRoles().forEach(function (r) {
            if (!pilih(r.key)) return;
            var isi = getAssign(w, r.key);
            var sisa = isi.filter(function (pid) {
              return bersihSah(pid, w, r.key);
            });
            if (sisa.length !== isi.length) {
              dibuang += isi.length - sisa.length;
              setAssign(w, r.key, sisa);
            }
          });
        })(pw);
      }
    });
    if (dibuang)
      toast(
        dibuang +
          " nama dikeluarkan karena pelayanannya sudah tidak dicentang atau sedang izin.",
        "info",
        5000,
      );
    var lastServed = {};
    var roleUse = {};
    var load = {};
    if (mode === "ulang") {
      sched.assign = {};
    } else {
      // Hitung beban dari nama yang SUDAH terpasang. Tanpa ini penilaian
      // keadilan menganggap mereka belum pernah melayani, sehingga orang
      // yang sudah diisi manual bisa dipilih lagi berkali-kali.
      for (var sw = 1; sw <= weeks; sw++) {
        allSchedRoles().forEach(function (r) {
          getAssign(sw, r.key).forEach(function (pid) {
            roleUse[pid + "|" + r.key] = (roleUse[pid + "|" + r.key] || 0) + 1;
            load[pid] = (load[pid] || 0) + 1;
          });
        });
      }
    }
    var empties = [];
    var relaxed = [];

    function cntWeek(pid, w) {
      return rolesOfPersonInWeek(pid, w).length;
    }
    function place(w, rk, pid) {
      var arr = getAssign(w, rk);
      if (arr.indexOf(pid) >= 0) return false;
      // Jaring pengaman terakhir: request khusus tidak melewati
      // eligible(), jadi bentrok kelompok tetap harus ditolak di sini.
      if (konflikEksklusif(pid, w, rk)) return false;
      arr.push(pid);
      setAssign(w, rk, arr);
      roleUse[pid + "|" + rk] = (roleUse[pid + "|" + rk] || 0) + 1;
      load[pid] = (load[pid] || 0) + 1;
      return true;
    }
    function maxRole(rk, o) {
      // H1: usher boleh merangkap 1 role tambahan (doa pembuka / pengumuman)
      if (rk === "doaBuka" || rk === "pengumuman") return 2;
      return o && o.allowDouble ? 2 : 1;
    }
    function eligible(pid, w, rk, o) {
      o = o || {};
      if (isIzin(pid, w)) return false;
      if (getAssign(w, rk).indexOf(pid) >= 0) return false;
      if (cntWeek(pid, w) >= maxRole(rk, o)) return false;
      // H1 - doa pembuka & pengumuman wajib dari 3 usher minggu itu
      if (rk === "doaBuka" || rk === "pengumuman") {
        if (getAssign(w, "usher").indexOf(pid) < 0) return false;
        if (rk === "pengumuman" && getAssign(w, "doaBuka").indexOf(pid) >= 0)
          return false;
      } else if (personTier(pid, rk) === 0) {
        return false;
      }
      // H2 - doa penutup khusus pengurus, bukan usher
      if (rk === "doaTutup") {
        if (!schedNameIn(PENGURUS, pid)) return false;
        if (getAssign(w, "usher").indexOf(pid) >= 0) return false;
      }
      // H3 - presenter terkunci dari role teknis
      var isPres = getAssign(w, "presenter").indexOf(pid) >= 0;
      if (TECH_ROLES.indexOf(rk) >= 0 && isPres) return false;
      if (rk === "presenter") {
        for (var i = 0; i < TECH_ROLES.length; i++) {
          if (getAssign(w, TECH_ROLES[i]).indexOf(pid) >= 0) return false;
        }
        if (
          !o.crossPool &&
          !schedNameIn(PRESENTER_TETAP, pid) &&
          !schedNameIn(PRESENTER_TRIAL, pid)
        )
          return false;
      }
      // H9 - tim Sound & Multimedia terkunci penuh: tidak boleh merangkap
      // tugas di tim lain (P&W, Persembahan, Hospitality) pada minggu sama.
      var rpW = rolesOfPersonInWeek(pid, w);
      var hasMM = false,
        hasOther = false;
      for (var j9 = 0; j9 < rpW.length; j9++) {
        if (isSoundMMRole(rpW[j9])) hasMM = true;
        else hasOther = true;
      }
      if (isSoundMMRole(rk) ? hasOther : hasMM) return false;
      // H10/H11 - kelompok eksklusif. Sengaja ditulis tanpa cek
      // o.allowDouble / o.crossPool supaya tangga pelonggaran pun tidak
      // bisa menembusnya.
      if (konflikEksklusif(pid, w, rk)) return false;
      // H6 - musisi P&W senior, Persembahan junior
      if (MUS_PNW_ROLES.indexOf(rk) >= 0 && !schedNameIn(MUS_SENIOR, pid))
        return false;
      if (
        MUS_PSB_ROLES.indexOf(rk) >= 0 &&
        !o.crossPool &&
        !schedNameIn(MUS_JUNIOR, pid)
      )
        return false;
      // H5 - WL Persembahan wajib beda dengan WL P&W, diambil dari singers P&W
      if (rk === "wlPsb") {
        if (getAssign(w, "wlPNW").indexOf(pid) >= 0) return false;
        if (!o.crossPool && getAssign(w, "singPNW").indexOf(pid) < 0)
          return false;
      }
      // H8 - selang-seling (Sound & Multimedia dikecualikan)
      if (!o.relaxH8 && !isSoundMMRole(rk) && lastServed[pid] === w - 1)
        return false;
      return true;
    }
    function score(pid, w, rk) {
      var last = lastServed[pid];
      var gap = last ? w - last : 99;
      var s = gap * 10 - cntWeek(pid, w) * 5;
      // v3.3 - kalau orang ini sudah memegang alat yang sama di sesi
      // lain, dia masih SAH tetapi harus kalah dari siapa pun yang
      // belum bertugas. Penaltinya besar supaya benar-benar cadangan.
      var _ins = musInstrumen(rk);
      if (_ins) {
        var _pas = MUS_INSTRUMEN[_ins];
        for (var _ip = 0; _ip < _pas.length; _ip++) {
          if (_pas[_ip] === rk) continue;
          if (getAssign(w, _pas[_ip]).indexOf(pid) >= 0) s -= 40;
        }
      }
      s -= (roleUse[pid + "|" + rk] || 0) * 7;
      s -= (load[pid] || 0) * 2;
      var t = personTier(pid, rk);
      if (t) s += (4 - t) * 3;
      if (rk === "presenter" && schedNameIn(PRESENTER_TETAP, pid)) s += 4;
      return s;
    }
    function pickBest(w, rk, o) {
      var best = null,
        bs = -1e9;
      sched.roster.forEach(function (p) {
        if (!eligible(p.id, w, rk, o)) return;
        var s = score(p.id, w, rk) + Math.random();
        if (s > bs) {
          bs = s;
          best = p.id;
        }
      });
      return best;
    }
    // fallback 3.4: ideal -> longgarkan H8 -> lintas pool
    var LADDER = [
      {},
      { relaxH8: true },
      { relaxH8: true, crossPool: true },
      { relaxH8: true, crossPool: true, allowDouble: true },
    ];
    // Tangga khusus WL Persembahan. H5 mewajibkan orangnya diambil dari
    // Singers P&W, dan orang itu pasti sudah punya 1 tugas - jadi tanpa
    // allowDouble dia selalu tertahan cek cntWeek. Dengan tangga biasa,
    // tahap crossPool (yang membuang syarat singPNW) selalu berhasil
    // lebih dulu, sehingga H5 tidak pernah terpenuhi. Di sini
    // allowDouble sengaja didahulukan daripada crossPool.
    var LADDER_WLPSB = [
      { allowDouble: true },
      { relaxH8: true, allowDouble: true },
      { relaxH8: true, crossPool: true, allowDouble: true },
    ];
    function fill(w, rk, n, soft) {
      // Role yang ditutup tidak diisi dan tidak dihitung sebagai kosong.
      if (isRoleClosed(w, rk)) return;
      var LD = rk === "wlPsb" ? LADDER_WLPSB : LADDER;
      for (var k = getAssign(w, rk).length; k < n; k++) {
        var got = null,
          step = 0;
        for (var li = 0; li < LD.length && !got; li++) {
          got = pickBest(w, rk, LD[li]);
          step = li;
        }
        if (got) {
          place(w, rk, got);
          if (step > 0) relaxed.push("M" + w + " " + roleLabel(rk));
        } else {
          if (!soft) empties.push("M" + w + " " + roleLabel(rk));
          break;
        }
      }
    }
    function roleLabel(rk) {
      var r = schedRole(rk);
      return r && r.label ? r.label : rk;
    }

    var reqs =
      sched.requests && sched.requests.length ? sched.requests : REQUESTS || [];

    for (var w = 1; w <= weeks; w++) {
      // 1. request khusus dikunci lebih dulu
      reqs.forEach(function (rq) {
        if (!rq || rq.week !== w) return;
        var p = null;
        sched.roster.forEach(function (x) {
          if (x.name === rq.name) p = x;
        });
        if (p && !isIzin(p.id, w)) place(w, rq.roleKey, p.id);
      });
      // 2. Sound & Multimedia lebih dulu: pool terkecil & bebas H8 (H3)
      fill(w, "presenter", 1);
      TECH_ROLES.forEach(function (rk) {
        fill(w, rk, 1);
      });
      // 3. Hospitality (H1 + H2)
      fill(w, "usher", 3);
      fill(w, "doaBuka", 1);
      fill(w, "pengumuman", 1);
      fill(w, "doaTutup", 1);
      // 4. Praise & Worship (H4 + H6 + H7 urutan baris Piano-Gitar-Bass-Drum)
      fill(w, "wlPNW", 2, true);
      var nWL = getAssign(w, "wlPNW").length;
      if (nWL === 0) empties.push("M" + w + " " + roleLabel("wlPNW"));
      fill(w, "singPNW", nWL >= 2 ? 2 : 3);
      MUS_PNW_ROLES.forEach(function (rk) {
        fill(w, rk, 1);
      });
      // 5. Persembahan (H5 + H6)
      fill(w, "wlPsb", 1);
      fill(w, "singPsb", 2, true);
      MUS_PSB_ROLES.forEach(function (rk) {
        fill(w, rk, 1);
      });
      // 6. Tambourine & Banners (ikut selang-seling H8)
      fill(w, "tamb", 3);
      fill(w, "ban", 2);
      // 7. commit lastServedWeek
      sched.roster.forEach(function (p) {
        if (cntWeek(p.id, w) > 0) lastServed[p.id] = w;
      });
    }

    sched.auto = true;
    saveSched();
    schedHistPush();
    renderSchedule();
    if (empties.length) {
      toast(
        "Jadwal dibuat. " +
          empties.length +
          " slot belum terisi (stok orang kurang): " +
          empties.slice(0, 6).join(", ") +
          (empties.length > 6 ? ", ..." : "") +
          ".",
        "info",
        6000,
      );
    } else {
      toast(
        (mode === "ulang" ? "Jadwal disusun ulang" : "Jadwal dilengkapi") +
          " - semua aturan H1-H11 terpenuhi.",
        "success",
      );
    }
  }
  // v2.3 - garis penghubung 3D untuk Double Role (orthogonal, hindari box lain)
  // v2.3 - penanda Double Role ringan: warna tetap per orang + sorot terkait.
  // Menggantikan garis SVG 3D (path-finding) yang berat dan berantakan.
  function schedDblColor(pid) {
    var h = 0;
    for (var i = 0; i < pid.length; i++) h = (h * 31 + pid.charCodeAt(i)) % 12;
    return "hsl(" + h * 30 + ", 78%, 42%)";
  }
  function schedHotLines(pid, wk, on) {
    var wrap = document.querySelector("#schedulePage .schedScroll");
    if (!wrap) return;
    wrap.classList.toggle("dimOn", !!on);
    var list = wrap.querySelectorAll(".chip[data-pid]");
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var m =
        c.getAttribute("data-pid") === pid &&
        c.getAttribute("data-wk") === String(wk);
      c.classList.toggle("hot", !!on && m);
    }
  }
  function schedTeamPrintClass(key) {
    if (key === "hosp") return "hosp";
    if (key === "mm") return "mm";
    return "wor";
  }
  function buildSchedPrint() {
    var area = document.getElementById("schedPrintArea");
    if (!area) {
      area = document.createElement("div");
      area.id = "schedPrintArea";
      document.body.appendChild(area);
    }
    area.innerHTML = "";
    var h1 = document.createElement("h1");
    h1.className = "spTitle";
    h1.textContent = "HOSANA YOUTH";
    area.appendChild(h1);
    var table = document.createElement("table");
    table.className = "spTable";
    var thead = document.createElement("thead");
    var htr = document.createElement("tr");
    htr.className = "spHead";
    var c0 = document.createElement("th");
    c0.textContent = "SYNERGY";
    htr.appendChild(c0);
    for (var w = 1; w <= sched.weeks; w++) {
      var th = document.createElement("th");
      th.textContent =
        (sched.weekLabels && sched.weekLabels[w]) || "Minggu " + w;
      htr.appendChild(th);
    }
    thead.appendChild(htr);
    table.appendChild(thead);
    var tb = document.createElement("tbody");
    SCHED_TEAMS.forEach(function (team) {
      var band = document.createElement("tr");
      band.className = "spBand " + schedTeamPrintClass(team.key);
      var bc = document.createElement("td");
      bc.colSpan = sched.weeks + 1;
      bc.textContent = team.label;
      band.appendChild(bc);
      tb.appendChild(band);
      team.roles.forEach(function (role) {
        var tr = document.createElement("tr");
        var rl = document.createElement("td");
        rl.className = "spRole";
        rl.textContent = role.label;
        tr.appendChild(rl);
        for (var w2 = 1; w2 <= sched.weeks; w2++) {
          var td = document.createElement("td");
          td.textContent = isRoleClosed(w2, role.key)
            ? "-"
            : getAssign(w2, role.key).map(personName).join(", ");
          tr.appendChild(td);
        }
        tb.appendChild(tr);
      });
    });
    table.appendChild(tb);
    area.appendChild(table);
  }
  function printSchedule() {
    buildSchedPrint();
    document.body.classList.add("printing-sched");
    var done = function () {
      document.body.classList.remove("printing-sched");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    setTimeout(function () {
      window.print();
    }, 60);
    setTimeout(done, 60000);
  }
  function openSchedulePage() {
    closeMenu();
    if (!isAdmin)
      toast(
        "Mode lihat saja. Login pengurus untuk mengubah jadwal.",
        "info",
        3000,
      );
    initScheduleCloud();
    document.getElementById("schedulePage").classList.add("open");
    renderSchedule();
  }
  function closeSchedulePage() {
    var pg = document.getElementById("schedulePage");
    if (pg) pg.classList.remove("open");
  }
  function schedSetTab(t) {
    schedTab = t;
    renderSchedule();
  }
  function renderSchedule() {
    var pg = document.getElementById("schedulePage");
    if (!pg) return;
    ["jadwal", "pelayan", "izin"].forEach(function (t) {
      var b = document.getElementById("schedTab_" + t);
      if (b) b.classList.toggle("on", schedTab === t);
    });
    rebuildPidx();
    // v2.3 - hak edit jadwal mengikuti status pengurus, bukan gembok lagu.
    var admin = isAdmin;
    var wc = document.getElementById("schedWeekCount");
    if (wc) wc.value = String(sched.weeks);
    var body = document.getElementById("schedBody");
    if (!body) return;
    // v2.9 - simpan keadaan UI supaya render ulang (mis. dari realtime)
    // tidak menghapus ketikan pencarian atau melompatkan posisi gulir.
    var _cariEl = document.getElementById("rosterSearch");
    var _cariVal = _cariEl ? _cariEl.value : "";
    var _gulir = body.scrollTop;
    body.innerHTML = "";
    if (schedTab === "jadwal") {
      renderSchedGrid(body, admin);
      applyGridFilter();
    } else if (schedTab === "pelayan") renderSchedRoster(body, admin);
    else renderSchedIzin(body, admin);
    if (_cariVal) {
      var _c2 = document.getElementById("rosterSearch");
      if (_c2) {
        _c2.value = _cariVal;
        _c2.dispatchEvent(new Event("input"));
      }
    }
    if (_gulir) body.scrollTop = _gulir;
  }
  var gridNameFilter = "";
  // v2.9 - keadaan urutan & saringan daftar pelayan.
  var rosterSort = "az";
  var rosterRoleFilter = "";
  function applyGridFilter() {
    var q = (gridNameFilter || "").trim().toLowerCase();
    document
      .querySelectorAll("#schedBody select.cellSel")
      .forEach(function (sel) {
        Array.prototype.forEach.call(sel.options, function (o) {
          if (!o.value) return;
          o.hidden = q ? o.textContent.toLowerCase().indexOf(q) < 0 : false;
        });
      });
  }
  // v2.5 - pemilih nama dengan pencarian sendiri. <datalist> tidak bisa
  // diandalkan di HP (Safari iOS tidak mendukungnya sama sekali), dan
  // membangun daftar penuh di setiap sel juga memberatkan halaman.
  function buildAddPicker(wk, roleKey, arr) {
    var wrap = document.createElement("span");
    wrap.className = "cellPick";
    var inp = document.createElement("input");
    inp.type = "text";
    inp.className = "cellPickInp";
    inp.placeholder = "+ tambah / cari";
    inp.autocomplete = "off";
    inp.setAttribute("autocapitalize", "off");
    inp.setAttribute("autocorrect", "off");
    var panel = document.createElement("div");
    panel.className = "pickList";
    panel.style.display = "none";
    function marksFor(p) {
      var m = [];
      if (isIzin(p.id, wk)) m.push("IZIN");
      if ((p.roles || []).indexOf(roleKey) < 0) m.push("di luar kemampuan");
      if (rolesOfPersonInWeek(p.id, wk).length) m.push("sudah bertugas");
      return m.join(" - ");
    }
    function hidePanel() {
      panel.style.display = "none";
      panel.innerHTML = "";
    }
    function choose(p) {
      if (isIzin(p.id, wk)) {
        var reason = prompt(
          p.name +
            " sedang IZIN minggu " +
            wk +
            ". Ketik alasan urgent untuk tetap menugaskan (kosongkan untuk batal):",
          "",
        );
        if (!reason) {
          inp.value = "";
          hidePanel();
          return;
        }
      }
      inp.value = "";
      hidePanel();
      if (assignPerson(wk, roleKey, p.id)) renderSchedule();
    }
    function refresh() {
      var q = (inp.value || "").trim().toLowerCase();
      var hits = [];
      for (var i = 0; i < sched.roster.length; i++) {
        var p = sched.roster[i];
        if (arr.indexOf(p.id) >= 0) continue;
        if (q && (p.name || "").toLowerCase().indexOf(q) < 0) continue;
        hits.push(p);
      }
      hits.sort(function (a, b) {
        var ta = personTier(a.id, roleKey) || 9;
        var tb = personTier(b.id, roleKey) || 9;
        if (ta !== tb) return ta - tb;
        return (a.name || "").localeCompare(b.name || "", "id", {
          sensitivity: "base",
        });
      });
      panel.innerHTML = "";
      if (!hits.length) {
        var no = document.createElement("div");
        no.className = "pickEmpty";
        no.textContent = "Tidak ada nama cocok";
        panel.appendChild(no);
      }
      hits.slice(0, 12).forEach(function (p) {
        var o = document.createElement("div");
        o.className = "pickOpt t" + (personTier(p.id, roleKey) || 0);
        var nm = document.createElement("b");
        nm.textContent = p.name;
        o.appendChild(nm);
        var mk = marksFor(p);
        if (mk) {
          var s = document.createElement("i");
          s.className = "pickMark";
          s.textContent = mk;
          o.appendChild(s);
        }
        o.onmousedown = function (e) {
          if (e && e.preventDefault) e.preventDefault();
          choose(p);
        };
        panel.appendChild(o);
      });
      panel.style.display = "block";
    }
    inp.onfocus = refresh;
    inp.oninput = refresh;
    inp.onblur = function () {
      setTimeout(hidePanel, 200);
    };
    inp.onkeydown = function (e) {
      if (e.key === "Escape") {
        inp.value = "";
        hidePanel();
        return;
      }
      if (e.key === "Enter") {
        var first = panel.querySelector(".pickOpt");
        if (first && first.onmousedown) first.onmousedown(e);
      }
    };
    wrap.appendChild(inp);
    wrap.appendChild(panel);
    return wrap;
  }
  // v2.4 - satu tempat pembuatan chip nama, dipakai semua baris.
  function schedBuildChip(pid, wk, roleKey, admin) {
    var chip = document.createElement("span");
    var myRoles = rolesOfPersonInWeek(pid, wk);
    var isDbl = myRoles.length >= 2;
    chip.className =
      "chip" + (isIzin(pid, wk) ? " warn" : "") + (isDbl ? " dbl" : "");
    chip.textContent = personName(pid);
    chip.setAttribute("data-pid", pid);
    chip.setAttribute("data-wk", wk);
    if (isDbl) {
      chip.style.setProperty("--dblc", schedDblColor(pid));
      chip.title =
        personName(pid) +
        " - Double Role (" +
        myRoles.length +
        " tugas): " +
        myRoles
          .map(function (rk2) {
            var r2 = schedRole(rk2);
            return r2 ? r2.label : rk2;
          })
          .join(", ");
      var tag = document.createElement("i");
      tag.className = "dblTag";
      tag.textContent = String(myRoles.length);
      chip.appendChild(tag);
    }
    chip.onmouseenter = function () {
      schedHotLines(pid, wk, true);
    };
    chip.onmouseleave = function () {
      schedHotLines(pid, wk, false);
    };
    chip.onclick = function () {
      schedHotLines(pid, wk, true);
      clearTimeout(window.__hotRT);
      window.__hotRT = setTimeout(function () {
        schedHotLines(pid, wk, false);
      }, 2200);
    };
    if (admin) {
      var x = document.createElement("b");
      x.className = "chipX";
      x.textContent = "x";
      x.onclick = function () {
        removeAssign(wk, roleKey, pid);
        renderSchedule();
      };
      chip.appendChild(x);
    }
    return chip;
  }
  // v2.5 - ekspor Excel memakai tabel HTML ber-gaya. Excel dan Google
  // Sheets membukanya mulus, dan tidak perlu pustaka tambahan sama sekali.
  function schedExcelHtml() {
    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
    var COL = {
      hosp: "#f6c445",
      mm: "#7ec8f2",
      wPNW: "#f2a2c0",
      wPsb: "#c3a6e0",
      wUmum: "#a8d5a2",
    };
    var n = sched.weeks;
    var h =
      '<tr><td colspan="' +
      (n + 1) +
      '" style="background:#1f3864;color:#ffffff;font-size:16pt;font-weight:bold;text-align:center;height:34px">HOSANA YOUTH SYNERGY</td></tr>';
    h +=
      '<tr><td style="background:#1f3864;color:#ffffff;font-weight:bold;text-align:center">SYNERGY</td>';
    for (var w = 1; w <= n; w++)
      h +=
        '<td style="background:#1f3864;color:#ffffff;font-weight:bold;text-align:center">' +
        esc((sched.weekLabels && sched.weekLabels[w]) || "Minggu " + w) +
        "</td>";
    h += "</tr>";
    SCHED_TEAMS.forEach(function (team) {
      var c = COL[team.key] || "#dddddd";
      h +=
        '<tr><td colspan="' +
        (n + 1) +
        '" style="background:' +
        c +
        ';font-weight:bold;text-align:center">' +
        esc(team.label) +
        "</td></tr>";
      team.roles.forEach(function (role) {
        h +=
          '<tr><td style="background:' +
          c +
          ';font-weight:bold">' +
          esc(role.label) +
          "</td>";
        for (var w2 = 1; w2 <= n; w2++)
          h +=
            '<td style="text-align:center">' +
            esc(getAssign(w2, role.key).map(personName).join(", ")) +
            "</td>";
        h += "</tr>";
      });
    });
    return (
      '<html xmlns:x="urn:schemas-microsoft-com:office:excel">' +
      '<head><meta charset="utf-8">' +
      "<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>" +
      "<x:ExcelWorksheet><x:Name>Jadwal Youth</x:Name><x:WorksheetOptions>" +
      "<x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>" +
      "</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->" +
      "</head><body>" +
      '<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:Calibri,Arial;font-size:11pt">' +
      h +
      "</table></body></html>"
    );
  }
  function exportSchedExcel() {
    try {
      var blob = new Blob(["\ufeff" + schedExcelHtml()], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "Jadwal-Youth.xls";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 800);
      toast("Berkas Excel diunduh.", "success");
    } catch (e) {
      console.error(e);
      toast("Gagal membuat berkas Excel.", "error");
    }
  }
  // v2.6 - kirim jadwal jadi ke Google Sheets lewat Apps Script yang
  // sudah dipakai form izin & saran. Muatan dikirim per blok tim supaya
  // Apps Script bisa menulis ulang sheet lengkap dengan warnanya.
  function schedSheetPayload() {
    var COL = {
      hosp: "#f6c445",
      mm: "#7ec8f2",
      wPNW: "#f2a2c0",
      wPsb: "#c3a6e0",
      wUmum: "#a8d5a2",
    };
    var n = sched.weeks;
    var head = ["SYNERGY"];
    for (var w = 1; w <= n; w++)
      head.push((sched.weekLabels && sched.weekLabels[w]) || "Minggu " + w);
    var blocks = [];
    SCHED_TEAMS.forEach(function (team) {
      var b = {
        tim: team.label,
        warna: COL[team.key] || "#dddddd",
        baris: [],
      };
      team.roles.forEach(function (role) {
        var sel = [];
        for (var w2 = 1; w2 <= n; w2++)
          sel.push(
            isRoleClosed(w2, role.key)
              ? "-"
              : getAssign(w2, role.key).map(personName).join(", "),
          );
        b.baris.push({ role: role.label, sel: sel });
      });
      blocks.push(b);
    });
    return {
      type: "jadwal",
      sheet: "Jadwal Youth",
      judul: "HOSANA YOUTH SYNERGY",
      minggu: n,
      head: head,
      blocks: blocks,
      oleh: schedWho(),
      waktu: new Date().toLocaleString("id-ID"),
    };
  }
  function sendSchedToSheets() {
    if (!IZIN_ENDPOINT) {
      toast("Alamat Google Sheets belum diatur.", "error", 6000);
      return;
    }
    var btn = document.getElementById("schedSheetBtn");
    function busy(on) {
      if (!btn) return;
      btn.disabled = on;
      btn.textContent = on ? "Mengirim..." : "Kirim ke Sheets";
    }
    function done(ok, msg) {
      busy(false);
      toast(msg, ok ? "success" : "error", ok ? 3600 : 8000);
    }
    busy(true);
    var body = JSON.stringify(schedSheetPayload());
    fetch(IZIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body,
    })
      .then(function (r) {
        return r.text();
      })
      .then(function (t) {
        if (/ok/i.test(t)) done(true, "Jadwal masuk ke Google Sheets.");
        else
          done(false, "Apps Script menolak: " + String(t || "").slice(0, 140));
      })
      .catch(function () {
        // Sebagian browser memblokir pembacaan balasan Apps Script.
        // Kirim ulang tanpa membaca balasan. Apps Script menulis ulang
        // sheet yang sama, jadi kiriman ganda tidak menggandakan data.
        fetch(IZIN_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: body,
        })
          .then(function () {
            done(
              true,
              "Jadwal dikirim. Silakan cek Google Sheets untuk memastikan.",
            );
          })
          .catch(function () {
            done(false, "Gagal mengirim ke Google Sheets.");
          });
      });
  }
  // v3.6 - toolbar dirapikan TANPA mengubah tombolnya: anak-anak
  // toolbar dipindah ke gugus (aksi / riwayat / aturan / bagikan /
  // status) supaya tidak berderet panjang jadi satu baris membingungkan.
  // Gugus bagikan + status didorong ke kanan.
  function schedRapikanToolbar(tb) {
    var anak = [].slice.call(tb.children);
    var urut = ["aksi", "riwayat", "aturan", "bagikan", "status"];
    var g = {};
    urut.forEach(function (k) {
      g[k] = document.createElement("div");
      g[k].className = "tbGrp" + (k === "bagikan" ? " tbShare" : "");
    });
    anak.forEach(function (el) {
      var id = el.id || "";
      var t = (el.textContent || "").trim();
      var grup = "status";
      if (id === "schedUndoBtn" || id === "schedRedoBtn") grup = "riwayat";
      else if (el.classList && el.classList.contains("dblToggle"))
        grup = "aturan";
      else if (
        id === "schedXlsBtn" ||
        id === "schedSheetBtn" ||
        t === "Cetak / PDF"
      )
        grup = "bagikan";
      else if (el.tagName === "BUTTON") grup = "aksi";
      g[grup].appendChild(el);
    });
    urut.forEach(function (k) {
      if (g[k].children.length) tb.appendChild(g[k]);
    });
  }
  function renderSchedGrid(body, admin) {
    if (!schedHist.stack.length) schedHistReset();
    var toolbar = document.createElement("div");
    toolbar.className = "schedToolbar";
    if (admin) {
      var autoBtn = document.createElement("button");
      autoBtn.className = "actionBtn";
      autoBtn.textContent = "Buat jadwal otomatis";
      autoBtn.title =
        "Isi kolom yang masih kosong. Nama yang sudah ada dipertahankan.";
      // Dibungkus fungsi: kalau dipasang langsung, objek event terkirim
      // sebagai argumen mode.
      autoBtn.onclick = function () {
        autoSchedule("lanjut");
      };
      toolbar.appendChild(autoBtn);
      var ulangBtn = document.createElement("button");
      ulangBtn.className = "actionBtn secondary";
      ulangBtn.id = "schedUlangBtn";
      ulangBtn.textContent = "Susun ulang";
      ulangBtn.title = "Hapus semua nama lalu susun jadwal dari nol.";
      ulangBtn.onclick = function () {
        autoSchedule("ulang");
      };
      toolbar.appendChild(ulangBtn);
      var clearBtn = document.createElement("button");
      clearBtn.className = "actionBtn secondary";
      clearBtn.textContent = "Kosongkan";
      clearBtn.onclick = function () {
        if (confirm("Kosongkan semua jadwal?")) {
          sched.assign = {};
          sched.auto = false;
          saveSched();
          schedHistPush();
          renderSchedule();
        }
      };
      toolbar.appendChild(clearBtn);
      var undoBtn = document.createElement("button");
      undoBtn.className = "actionBtn secondary";
      undoBtn.id = "schedUndoBtn";
      undoBtn.textContent = "\u21B6 Undo";
      undoBtn.title = "Batalkan perubahan terakhir (Ctrl+Z)";
      undoBtn.onclick = schedUndo;
      // Status mati/hidup dipasang LANGSUNG di sini. Memakai
      // schedHistBtns() belum bisa, karena toolbar baru masuk ke DOM
      // setelah fungsi ini selesai - getElementById masih null.
      undoBtn.disabled = schedHist.idx <= 0;
      toolbar.appendChild(undoBtn);
      var redoBtn = document.createElement("button");
      redoBtn.className = "actionBtn secondary";
      redoBtn.id = "schedRedoBtn";
      redoBtn.textContent = "Maju \u21B7";
      redoBtn.title = "Ulangi perubahan (Ctrl+Shift+Z)";
      redoBtn.onclick = schedRedo;
      redoBtn.disabled = schedHist.idx >= schedHist.stack.length - 1;
      toolbar.appendChild(redoBtn);
      var dblLab = document.createElement("label");
      dblLab.className = "dblToggle";
      var dblCb = document.createElement("input");
      dblCb.type = "checkbox";
      dblCb.checked = !!sched.allowDouble;
      dblCb.onchange = function () {
        sched.allowDouble = dblCb.checked;
        saveSched(true);
        toast(
          dblCb.checked
            ? "Double role diizinkan (tanpa peringatan)."
            : "Double role akan diberi peringatan.",
          "info",
        );
        renderSchedule();
      };
      dblLab.appendChild(dblCb);
      dblLab.appendChild(document.createTextNode(" Izinkan double role"));
      toolbar.appendChild(dblLab);
      // v3.5 - sakelar terpisah dari "Izinkan double role" supaya bisa
      // dinyalakan tanpa ikut mematikan peringatan rangkap.
      var musLab = document.createElement("label");
      musLab.className = "dblToggle";
      musLab.title =
        "Hanya untuk pengisian manual. Jadwal otomatis tetap memakai aturan lama.";
      var musCb = document.createElement("input");
      musCb.type = "checkbox";
      musCb.id = "schedMusLintasCb";
      musCb.checked = !!sched.allowMusLintasSesi;
      musCb.onchange = function () {
        sched.allowMusLintasSesi = musCb.checked;
        saveSched(true);
        toast(
          musCb.checked
            ? "Pemusik P&W kini boleh mengisi alat berbeda di Persembahan (isi manual)."
            : "Pemusik kembali dibatasi satu alat per hari.",
          "info",
          4200,
        );
        renderSchedule();
      };
      musLab.appendChild(musCb);
      musLab.appendChild(document.createTextNode(" Pemusik lintas sesi"));
      toolbar.appendChild(musLab);
    } else {
      var note = document.createElement("span");
      note.className = "small";
      note.textContent = "Mode lihat. Login admin untuk mengubah jadwal.";
      toolbar.appendChild(note);
    }
    var printBtn = document.createElement("button");
    printBtn.className = "actionBtn secondary";
    printBtn.textContent = "Cetak / PDF";
    printBtn.onclick = printSchedule;
    toolbar.appendChild(printBtn);
    var xlsBtn = document.createElement("button");
    xlsBtn.className = "actionBtn secondary";
    xlsBtn.id = "schedXlsBtn";
    xlsBtn.textContent = "Ekspor Excel";
    xlsBtn.onclick = exportSchedExcel;
    toolbar.appendChild(xlsBtn);
    var shBtn = document.createElement("button");
    shBtn.className = "actionBtn";
    shBtn.id = "schedSheetBtn";
    shBtn.textContent = "Kirim ke Sheets";
    shBtn.onclick = sendSchedToSheets;
    toolbar.appendChild(shBtn);
    var syncPill = document.createElement("span");
    syncPill.id = "schedSyncPill";
    syncPill.textContent = window.__schedSyncTxt || "Menyambung...";
    toolbar.appendChild(syncPill);
    schedRapikanToolbar(toolbar);
    body.appendChild(toolbar);
    var legend = document.createElement("div");
    legend.className = "schedLegend";
    legend.innerHTML =
      '<span class="lgItem"><i class="lgSw dbl"></i>Double Role</span>' +
      '<span class="lgItem"><i class="lgSw warn"></i>Sedang izin</span>' +
      '<span class="lgItem">Angka kecil = jumlah tugas orang itu di minggu tersebut. Arahkan kursor atau ketuk nama untuk menyorot semua tugasnya.</span>' +
      (admin
        ? '<span class="lgItem">Perubahan tersimpan realtime untuk semua pengurus.</span>'
        : '<span class="schedRO">Mode lihat saja</span>');
    body.appendChild(legend);
    var wrap = document.createElement("div");
    wrap.className = "schedScroll";
    var table = document.createElement("table");
    table.className = "schedGrid";
    var thead = document.createElement("thead");
    var htr = document.createElement("tr");
    var corner = document.createElement("th");
    corner.textContent = "Pelayanan";
    htr.appendChild(corner);
    for (var w = 1; w <= sched.weeks; w++) {
      (function (wk) {
        var th = document.createElement("th");
        var cap = document.createElement("div");
        cap.textContent = "Minggu " + wk;
        th.appendChild(cap);
        if (admin) {
          var wi = document.createElement("input");
          wi.className = "wkLabel";
          wi.placeholder = "tanggal";
          wi.value = (sched.weekLabels && sched.weekLabels[wk]) || "";
          wi.onchange = function () {
            if (!sched.weekLabels) sched.weekLabels = {};
            sched.weekLabels[wk] = wi.value;
            saveSched(true);
          };
          th.appendChild(wi);
        } else if (sched.weekLabels && sched.weekLabels[wk]) {
          var wl = document.createElement("div");
          wl.className = "wkLabelText";
          wl.textContent = sched.weekLabels[wk];
          th.appendChild(wl);
        }
        // v3.6 - tutup/buka seluruh kolom minggu dari header.
        if (admin) th.appendChild(buildTutupMingguBtn(wk));
        else if (isWeekClosed(wk)) {
          var wt = document.createElement("div");
          wt.className = "wkLabelText";
          wt.textContent = "Ditutup";
          th.appendChild(wt);
        }
        htr.appendChild(th);
      })(w);
    }
    thead.appendChild(htr);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    SCHED_TEAMS.forEach(function (team) {
      var trh = document.createElement("tr");
      trh.className = "teamRow";
      var tdh = document.createElement("td");
      tdh.colSpan = sched.weeks + 1;
      tdh.textContent = team.label;
      tdh.style.textAlign = "center";
      trh.appendChild(tdh);
      tbody.appendChild(trh);
      // v2.4 - role bertanda group digabung jadi SATU baris, berjejer.
      var rows = [];
      team.roles.forEach(function (role) {
        var last = rows[rows.length - 1];
        if (role.group && last && last.group === role.group) {
          last.roles.push(role);
          return;
        }
        rows.push({
          group: role.group || null,
          label: role.group
            ? role.groupLabel || role.group
            : role.label + (role.slots > 1 ? " (x" + role.slots + ")" : ""),
          roles: [role],
        });
      });
      rows.forEach(function (row, ri) {
        var tr = document.createElement("tr");
        var rl = document.createElement("td");
        rl.className = "roleCell";
        rl.textContent = row.label;
        tr.appendChild(rl);
        for (var w2 = 1; w2 <= sched.weeks; w2++) {
          (function (wk) {
            // v3.6 - minggu yang ditutup dari header tidak digambar per
            // sel. Tiap blok tim memakai SATU sel gabungan (rowSpan)
            // berisi alasan yang bisa diedit admin. Digabung per tim,
            // bukan satu sel untuk seluruh tabel, karena baris judul tim
            // memakai colSpan penuh sehingga rowSpan tidak bisa
            // melewatinya.
            if (isWeekClosed(wk)) {
              if (ri !== 0) return;
              var tdW = document.createElement("td");
              tdW.className = "cell cellTutup weekTutup";
              tdW.rowSpan = rows.length;
              tdW.appendChild(buildWeekReason(wk, admin));
              tr.appendChild(tdW);
              return;
            }
            var td = document.createElement("td");
            td.className = "cell" + (row.group ? " musCell" : "");
            row.roles.forEach(function (role) {
              var box = td;
              if (row.group) {
                box = document.createElement("div");
                box.className = "musSlot";
                var lb = document.createElement("i");
                lb.className = "musLb";
                lb.textContent = role.label;
                box.appendChild(lb);
              }
              var tutup = isRoleClosed(wk, role.key);
              if (tutup) {
                box.classList.add("cellTutup");
                var tg = document.createElement("span");
                tg.className = "tutupTag";
                tg.textContent = "Ditutup";
                tg.style.cssText =
                  "display:inline-block;padding:2px 8px;border-radius:8px;" +
                  "background:#e5e7eb;color:#6b7280;font-size:11px;font-style:italic";
                box.appendChild(tg);
              } else {
                var arr = getAssign(wk, role.key);
                arr.forEach(function (pid) {
                  box.appendChild(schedBuildChip(pid, wk, role.key, admin));
                });
                if (admin && arr.length < batasSlot(role.key))
                  box.appendChild(buildAddPicker(wk, role.key, arr));
              }
              if (admin) box.appendChild(buildTutupBtn(wk, role.key, tutup));
              if (row.group) td.appendChild(box);
            });
            tr.appendChild(td);
          })(w2);
        }
        tbody.appendChild(tr);
      });
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);
  }
  // v3.7 - enam nama role muncul di dua sesi (Worship Leader, Singers,
  // Pianist, Guitarist, Bassist, Drummer). Di tab Pelayan tidak ada baris
  // judul tim seperti di tabel jadwal, jadi keterangan sesi ditempelkan
  // ke labelnya supaya tidak ada dua checkbox bernama sama.
  var ROLE_SESI_SUFFIX = { PNW: " (P&W)", Psb: " (Persembahan)" };
  function schedRoleLabelPenuh(rk) {
    var r = schedRole(rk);
    var lb = r ? r.label : rk;
    var m = /(PNW|Psb)$/.exec(rk);
    return lb + (m ? ROLE_SESI_SUFFIX[m[1]] : "");
  }
  // v3.7 - permintaan role dari member. Member TIDAK pernah menulis ke
  // roster: centangannya dikirim sebagai USULAN ke sched.roleReq, dan
  // baru masuk ke roster kalau pengurus menyetujui. Ini yang menahan
  // orang usil tanpa perlu sistem login untuk tiap member.
  function sayaPid() {
    return localStorage.getItem("ptSayaPid") || "";
  }
  function setSayaPid(v) {
    if (v) localStorage.setItem("ptSayaPid", v);
    else localStorage.removeItem("ptSayaPid");
  }
  function roleReqAll() {
    return sched.roleReq || {};
  }
  function roleReqOf(pid) {
    return roleReqAll()[pid] || null;
  }
  function roleReqDiff(pid, minta) {
    var p = personById(pid);
    var punya = (p && p.roles) || [];
    return {
      tambah: minta.filter(function (k) {
        return punya.indexOf(k) < 0;
      }),
      hapus: punya.filter(function (k) {
        return minta.indexOf(k) < 0;
      }),
    };
  }
  function reqAmbilCentang(kartu) {
    return [].slice
      .call(kartu.querySelectorAll(".roleCheck input[type=checkbox]"))
      .filter(function (c) {
        return c.checked;
      })
      .map(function (c) {
        return c.getAttribute("data-rk");
      });
  }
  // Panel pengurus: daftar permintaan + selisihnya, bukan sekadar daftar
  // role, supaya sekali lihat langsung paham apa yang berubah.
  function buildReqPanel() {
    var reqs = roleReqAll();
    var ids = Object.keys(reqs);
    var box = document.createElement("div");
    box.className = "reqPanel";
    var h = document.createElement("div");
    h.className = "reqPanelHead";
    h.textContent =
      "Permintaan pelayanan dari member" +
      (ids.length ? " (" + ids.length + " menunggu)" : "");
    box.appendChild(h);
    if (!ids.length) {
      var kos = document.createElement("div");
      kos.className = "reqStatus";
      kos.textContent =
        "Belum ada permintaan. Kalau member mengubah centangan pelayanannya, permintaannya muncul di sini untuk kamu setujui.";
      box.appendChild(kos);
      return box;
    }
    ids.forEach(function (pid) {
      var r = reqs[pid] || {};
      var p = personById(pid);
      var d = roleReqDiff(pid, r.roles || []);
      var it = document.createElement("div");
      it.className = "reqItem";
      var top = document.createElement("div");
      top.className = "reqItemHead";
      var nm = document.createElement("b");
      nm.textContent = (p && p.name) || r.name || pid;
      top.appendChild(nm);
      it.appendChild(top);
      var chips = document.createElement("div");
      chips.className = "reqChips";
      d.tambah.forEach(function (k) {
        var c = document.createElement("span");
        c.className = "reqChip add";
        c.textContent = "+ " + schedRoleLabelPenuh(k);
        chips.appendChild(c);
      });
      d.hapus.forEach(function (k) {
        var c = document.createElement("span");
        c.className = "reqChip del";
        c.textContent = "− " + schedRoleLabelPenuh(k);
        chips.appendChild(c);
      });
      if (!d.tambah.length && !d.hapus.length) {
        var c0 = document.createElement("span");
        c0.className = "reqChip";
        c0.textContent = "Tidak ada perubahan";
        chips.appendChild(c0);
      }
      it.appendChild(chips);
      if (r.note) {
        var nt = document.createElement("div");
        nt.className = "reqStatus";
        nt.textContent = "Catatan member: " + r.note;
        it.appendChild(nt);
      }
      var act = document.createElement("div");
      act.className = "reqRow";
      var ya = document.createElement("button");
      ya.className = "actionBtn";
      ya.textContent = "Setujui";
      ya.onclick = function () {
        var pv = personById(pid);
        if (pv) {
          pv.roles = (r.roles || []).slice();
          saveSchedRoster();
        }
        if (sched.roleReq) delete sched.roleReq[pid];
        saveSched(true);
        toast(
          ((pv && pv.name) || "Pelayan") +
            ": permintaan disetujui, pelayanannya sudah diperbarui.",
          "success",
          4600,
        );
        renderSchedule();
      };
      var no = document.createElement("button");
      no.className = "actionBtn secondary";
      no.textContent = "Tolak";
      no.onclick = function () {
        if (sched.roleReq) delete sched.roleReq[pid];
        saveSched(true);
        toast("Permintaan ditolak. Roster tidak diubah.", "info");
        renderSchedule();
      };
      act.appendChild(ya);
      act.appendChild(no);
      it.appendChild(act);
      box.appendChild(it);
    });
    return box;
  }
  // Panel member: pilih identitas dulu. Tanpa login per member, ini cara
  // paling sederhana yang tetap aman - efeknya hanya usulan.
  function buildSayaBar() {
    var box = document.createElement("div");
    box.className = "reqPanel";
    var h = document.createElement("div");
    h.className = "reqPanelHead";
    h.textContent = "Ubah pelayanan saya";
    box.appendChild(h);
    var st = document.createElement("div");
    st.className = "reqStatus";
    st.textContent =
      "Pilih namamu, centang pelayanan yang kamu bisa, lalu tekan Kirim permintaan. Perubahan baru berlaku setelah disetujui pengurus. Kartu orang lain tidak bisa kamu ubah.";
    box.appendChild(st);
    var row = document.createElement("div");
    row.className = "reqRow";
    var lb = document.createElement("span");
    lb.className = "small";
    lb.textContent = "Saya adalah:";
    var sel = document.createElement("select");
    var op0 = document.createElement("option");
    op0.value = "";
    op0.textContent = "- pilih nama -";
    sel.appendChild(op0);
    sched.roster
      .slice()
      .sort(function (a, b) {
        return (a.name || "").localeCompare(b.name || "");
      })
      .forEach(function (p) {
        var op = document.createElement("option");
        op.value = p.id;
        op.textContent = p.name;
        sel.appendChild(op);
      });
    sel.value = sayaPid();
    sel.onchange = function () {
      setSayaPid(sel.value);
      renderSchedule();
    };
    row.appendChild(lb);
    row.appendChild(sel);
    box.appendChild(row);
    var ada = roleReqOf(sayaPid());
    if (ada) {
      var pend = document.createElement("div");
      pend.className = "reqStatus pend";
      pend.textContent =
        "Permintaanmu sudah terkirim dan sedang menunggu persetujuan pengurus.";
      box.appendChild(pend);
    }
    return box;
  }
  function buildKirimReq(p, card) {
    var box = document.createElement("div");
    box.className = "reqBox";
    var ada = roleReqOf(p.id);
    var st = document.createElement("div");
    st.className = "reqStatus" + (ada ? " pend" : "");
    st.textContent = ada
      ? "Menunggu persetujuan pengurus. Kamu masih bisa mengubah centangan lalu mengirim ulang."
      : "Ubah centangan di atas, lalu kirim untuk ditinjau pengurus.";
    box.appendChild(st);
    var row = document.createElement("div");
    row.className = "reqRow";
    var note = document.createElement("input");
    note.className = "reqNote";
    note.placeholder = "Catatan untuk pengurus (opsional)";
    note.value = ada ? ada.note || "" : "";
    var btn = document.createElement("button");
    btn.className = "actionBtn reqSend";
    btn.textContent = "Kirim permintaan";
    // Mati sampai benar-benar ada perubahan, supaya tidak ada permintaan
    // kosong yang membebani pengurus.
    btn.disabled = true;
    btn.onclick = function () {
      if (rateLimited("req_" + p.id, 5000)) {
        toast(
          "Tunggu sebentar sebelum mengirim ulang permintaan.",
          "error",
          3000,
        );
        return;
      }
      var minta = reqAmbilCentang(card);
      if (!sched.roleReq) sched.roleReq = {};
      sched.roleReq[p.id] = {
        roles: minta,
        note: (note.value || "").trim(),
        at: Date.now(),
        name: p.name,
      };
      saveSched(true);
      toast(
        "Permintaan terkirim. Pengurus akan meninjau centanganmu.",
        "success",
        4600,
      );
      renderSchedule();
    };
    row.appendChild(note);
    row.appendChild(btn);
    box.appendChild(row);
    return box;
  }
  function renderSchedRoster(body, admin) {
    var info = document.createElement("p");
    info.className = "small";
    info.textContent = admin
      ? "Centang pelayanan yang bisa dilakukan tiap orang. Perubahan langsung dipakai oleh jadwal otomatis."
      : "Kamu bisa mengusulkan perubahan pelayanan untuk dirimu sendiri. Pengurus yang menyetujui.";
    body.appendChild(info);
    // v3.7 - pengurus melihat kotak persetujuan, member melihat pemilih
    // identitas untuk mengusulkan pelayanannya sendiri.
    body.appendChild(admin ? buildReqPanel() : buildSayaBar());
    var searchRow = document.createElement("div");
    searchRow.className = "schedToolbar";
    var searchInp = document.createElement("input");
    searchInp.type = "search";
    searchInp.placeholder = "Cari nama pelayan...";
    searchInp.id = "rosterSearch";
    searchRow.appendChild(searchInp);
    body.appendChild(searchRow);
    if (admin) {
      var addRow = document.createElement("div");
      addRow.className = "schedToolbar";
      var inp = document.createElement("input");
      inp.placeholder = "Nama pelayan baru";
      var addBtn = document.createElement("button");
      addBtn.className = "actionBtn";
      addBtn.textContent = "Tambah";
      addBtn.onclick = function () {
        var nm = (inp.value || "").trim();
        if (!nm) return;
        sched.roster.push({
          id: "p-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
          name: nm,
          roles: [],
        });
        saveSched();
        renderSchedule();
      };
      addRow.appendChild(inp);
      addRow.appendChild(addBtn);
      body.appendChild(addRow);
    }
    var urutRow = document.createElement("div");
    urutRow.className = "schedToolbar";
    var lbUrut = document.createElement("span");
    lbUrut.className = "small";
    lbUrut.textContent = "Urutkan:";
    var sortSel = document.createElement("select");
    [
      ["az", "Nama A-Z"],
      ["za", "Nama Z-A"],
    ].forEach(function (o) {
      var op = document.createElement("option");
      op.value = o[0];
      op.textContent = o[1];
      sortSel.appendChild(op);
    });
    sortSel.value = rosterSort;
    sortSel.onchange = function () {
      rosterSort = sortSel.value;
      drawRoster();
    };
    var lbRole = document.createElement("span");
    lbRole.className = "small";
    lbRole.textContent = "Pelayanan:";
    var roleSel = document.createElement("select");
    var opAll = document.createElement("option");
    opAll.value = "";
    opAll.textContent = "Semua pelayanan";
    roleSel.appendChild(opAll);
    allSchedRoles().forEach(function (r) {
      var op = document.createElement("option");
      op.value = r.key;
      op.textContent = schedRoleLabelPenuh(r.key);
      roleSel.appendChild(op);
    });
    roleSel.value = rosterRoleFilter;
    roleSel.onchange = function () {
      rosterRoleFilter = roleSel.value;
      drawRoster();
    };
    var jml = document.createElement("span");
    jml.className = "small";
    jml.id = "rosterCount";
    urutRow.appendChild(lbUrut);
    urutRow.appendChild(sortSel);
    urutRow.appendChild(lbRole);
    urutRow.appendChild(roleSel);
    urutRow.appendChild(jml);
    body.appendChild(urutRow);
    var listWrap = document.createElement("div");
    listWrap.className = "rosterList";
    // Daftar diurutkan dari SALINAN roster, bukan mengubah urutan aslinya,
    // supaya urutan tampilan tidak ikut tersimpan & tersebar ke pengurus lain.
    function rosterUrut() {
      var arr = sched.roster.slice();
      if (rosterRoleFilter)
        arr = arr.filter(function (p) {
          return p.roles.indexOf(rosterRoleFilter) >= 0;
        });
      arr.sort(function (a, b) {
        var x = (a.name || "").toLowerCase(),
          y = (b.name || "").toLowerCase();
        if (x < y) return rosterSort === "za" ? 1 : -1;
        if (x > y) return rosterSort === "za" ? -1 : 1;
        return 0;
      });
      return arr;
    }
    function terapkanCari() {
      var q = (searchInp.value || "").trim().toLowerCase();
      listWrap.querySelectorAll(".rosterCard").forEach(function (cd) {
        var nm = cd.getAttribute("data-name") || "";
        cd.style.display = !q || nm.indexOf(q) >= 0 ? "" : "none";
      });
    }
    function gambarKartu(p) {
      var card = document.createElement("div");
      card.className = "rosterCard";
      card.setAttribute("data-name", (p.name || "").toLowerCase());
      var head = document.createElement("div");
      head.className = "rosterHead";
      var nm = document.createElement("b");
      nm.textContent = p.name;
      head.appendChild(nm);
      if (admin) {
        var del = document.createElement("button");
        del.className = "scBtn danger";
        del.textContent = "Hapus";
        del.onclick = function () {
          if (confirm("Hapus " + p.name + "?")) {
            sched.roster = sched.roster.filter(function (x) {
              return x.id !== p.id;
            });
            delete sched.izin[p.id];
            saveSched();
            renderSchedule();
          }
        };
        head.appendChild(del);
      }
      card.appendChild(head);
      var rolesWrap = document.createElement("div");
      rolesWrap.className = "roleChecks";
      allSchedRoles().forEach(function (role) {
        var lab = document.createElement("label");
        lab.className = "roleCheck";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.setAttribute("data-rk", role.key);
        var akuSendiri = !admin && p.id === sayaPid();
        // Kalau sudah ada permintaan menunggu, yang ditampilkan ke member
        // adalah usulannya sendiri - bukan roster resmi - supaya dia tahu
        // apa yang sedang ditunggu.
        var reqSaya = akuSendiri ? roleReqOf(p.id) : null;
        var dasar = reqSaya && reqSaya.roles ? reqSaya.roles : p.roles;
        cb.checked = dasar.indexOf(role.key) >= 0;
        cb.disabled = !admin && !akuSendiri;
        cb.onchange = function () {
          if (!admin) {
            // Member: centangan TIDAK menyentuh roster sama sekali.
            // Hanya menyalakan tombol kirim kalau memang ada bedanya.
            var kartu = lab.parentElement && lab.parentElement.parentElement;
            if (!kartu) return;
            var kini = reqAmbilCentang(kartu).slice().sort().join(",");
            var asli = (kartu.getAttribute("data-asli") || "")
              .split(",")
              .filter(function (x) {
                return x;
              })
              .sort()
              .join(",");
            var b = kartu.querySelector(".reqSend");
            if (b) b.disabled = kini === asli;
            return;
          }
          // v3.1 - ambil ulang dari sched.roster. Objek `p` bisa jadi
          // salinan usang bila sempat ada pembaruan dari cloud.
          var pv = personById(p.id) || p;
          if (cb.checked) {
            if (pv.roles.indexOf(role.key) < 0) pv.roles.push(role.key);
          } else {
            pv.roles = pv.roles.filter(function (k) {
              return k !== role.key;
            });
          }
          p.roles = pv.roles;
          saveSchedRoster();
        };
        lab.appendChild(cb);
        lab.appendChild(
          document.createTextNode(" " + schedRoleLabelPenuh(role.key)),
        );
        rolesWrap.appendChild(lab);
      });
      card.appendChild(rolesWrap);
      if (!admin && p.id === sayaPid()) {
        card.classList.add("sayaCard");
        card.setAttribute(
          "data-asli",
          (p.roles || []).slice().sort().join(","),
        );
        var tag = document.createElement("span");
        tag.className = "sayaTag";
        tag.textContent = "Kartu saya";
        head.appendChild(tag);
        card.appendChild(buildKirimReq(p, card));
      }
      listWrap.appendChild(card);
    }
    function drawRoster() {
      listWrap.innerHTML = "";
      var arr = rosterUrut();
      if (!arr.length) {
        var kos = document.createElement("p");
        kos.className = "small";
        kos.textContent = "Tidak ada pelayan yang cocok.";
        listWrap.appendChild(kos);
      }
      arr.forEach(gambarKartu);
      var jc = document.getElementById("rosterCount");
      if (jc) jc.textContent = arr.length + " pelayan";
      terapkanCari();
    }
    drawRoster();
    body.appendChild(listWrap);
    searchInp.addEventListener("input", function () {
      var q = (searchInp.value || "").trim().toLowerCase();
      listWrap.querySelectorAll(".rosterCard").forEach(function (cd) {
        var nm = cd.getAttribute("data-name") || "";
        cd.style.display = !q || nm.indexOf(q) >= 0 ? "" : "none";
      });
    });
  }
  function renderSchedIzin(body, admin) {
    var info = document.createElement("p");
    info.className = "small";
    info.textContent =
      "Centang minggu di mana pelayan IZIN / tidak bisa melayani. Nama yang izin otomatis merah dan tidak bisa dijadwalkan (kecuali admin override dengan alasan).";
    body.appendChild(info);
    var wrap = document.createElement("div");
    wrap.className = "schedScroll";
    var table = document.createElement("table");
    table.className = "schedGrid";
    var thead = document.createElement("thead");
    var htr = document.createElement("tr");
    var c0 = document.createElement("th");
    c0.textContent = "Pelayan";
    htr.appendChild(c0);
    for (var w = 1; w <= sched.weeks; w++) {
      var th = document.createElement("th");
      th.textContent = "M" + w;
      htr.appendChild(th);
    }
    thead.appendChild(htr);
    table.appendChild(thead);
    var tb = document.createElement("tbody");
    sched.roster.forEach(function (p) {
      var tr = document.createElement("tr");
      var nmc = document.createElement("td");
      nmc.className = "roleCell";
      nmc.textContent = p.name;
      tr.appendChild(nmc);
      for (var w2 = 1; w2 <= sched.weeks; w2++) {
        (function (wk) {
          var td = document.createElement("td");
          td.style.textAlign = "center";
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = isIzin(p.id, wk);
          cb.disabled = !admin;
          cb.onchange = function () {
            if (!sched.izin[p.id]) sched.izin[p.id] = [];
            if (cb.checked) {
              if (sched.izin[p.id].indexOf(wk) < 0) sched.izin[p.id].push(wk);
            } else {
              sched.izin[p.id] = sched.izin[p.id].filter(function (x) {
                return x !== wk;
              });
            }
            saveSched(true);
          };
          td.appendChild(cb);
          tr.appendChild(td);
        })(w2);
      }
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    wrap.appendChild(table);
    body.appendChild(wrap);
  }
  function saveSongs() {
    songs.forEach(mirrorToBank);
    saveBank();
    songsMarkHadData();
    if (
      cloudReady &&
      dbRef &&
      !applyingRemote &&
      guardPush(songs, SONGS_HWM_KEY, "Daftar lagu")
    ) {
      try {
        dbRef.set(songs);
      } catch (e) {}
    } else {
      try {
        localStorage.setItem(storageKey, JSON.stringify(songs));
      } catch (e) {}
    }
    const sp = document.getElementById("savePill");
    if (sp) {
      sp.style.display = "";
      sp.textContent = "Tersimpan";
    }
  }
  function mod(n, m) {
    return ((n % m) + m) % m;
  }
  function currentSong() {
    return songs.find((s) => s.id === selectedSongId) || songs[0];
  }
  function namesForKey(k) {
    return sharpKeys.has(k) ? sharpNames : flatNames;
  }
  function leadingNote(s) {
    if (!s) return "";
    const c = s[0].toUpperCase();
    if (!"ABCDEFG".includes(c)) return "";
    if (s.length >= 2 && (s[1] === "#" || s[1] === "b")) return c + s[1];
    return c;
  }
  function transposeRoot(chord, shift, targetKey) {
    const root = leadingNote(chord);
    if (!root || noteToIndex[root] === undefined) return chord;
    const idx = mod(noteToIndex[root] + shift, 12);
    if (numberMode) {
      const deg = mod(idx - (noteToIndex[targetKey] ?? 0), 12);
      return degreeNames[deg] + chord.slice(root.length);
    }
    return namesForKey(targetKey)[idx] + chord.slice(root.length);
  }
  function transposeToken(token, shift, targetKey) {
    let prefix = "",
      suffix = "",
      core = token;
    while (core && "|()[]{}".includes(core[0])) {
      prefix += core[0];
      core = core.slice(1);
    }
    while (core && "|,.;:)]}".includes(core[core.length - 1])) {
      suffix = core[core.length - 1] + suffix;
      core = core.slice(0, -1);
    }
    if (!core || core === "." || /^[\u2013\u2014-]+$/.test(core)) return token;
    if (core.includes("/")) {
      const parts = core.split("/");
      core =
        parts.length === 2
          ? transposeRoot(parts[0], shift, targetKey) +
            "/" +
            transposeRoot(parts[1], shift, targetKey)
          : transposeRoot(core, shift, targetKey);
    } else {
      core = transposeRoot(core, shift, targetKey);
    }
    return prefix + core + suffix;
  }
  function transposeLine(line, shift, targetKey) {
    return line
      .split(/(\s+)/)
      .map((part) =>
        /^\s+$/.test(part) ? part : transposeToken(part, shift, targetKey),
      )
      .join("");
  }
  /* Klasifikasi kualitas chord: "maj" atau "min". Mengenali semua jenis
   * chord (Bb, sus, dim, aug, maj7, add9, dst) -> mayor biru, minor merah. */
  function chordQuality(token) {
    var t = String(token == null ? "" : token);
    t = t.replace(/^[|([{]+/, "").replace(/[|,.;:)\]}]+$/, "");
    if (!t || t === ".") return "";
    var root = leadingNote(t);
    if (!root) return "";
    var rest = t.slice(root.length);
    var slash = rest.indexOf("/");
    if (slash >= 0) rest = rest.slice(0, slash);
    var r = rest.toLowerCase();
    if (r === "" || r.indexOf("maj") === 0) return "maj";
    if (r.charAt(0) === "m") return "min";
    if (r.indexOf("dim") === 0) return "min";
    return "maj";
  }
  function transposeChordLine(line, shift, targetKey) {
    var re = /\S+/g,
      m,
      toks = [];
    while ((m = re.exec(line)) !== null) {
      toks.push({
        start: m.index,
        text: transposeToken(m[0], shift, targetKey),
      });
    }
    var out = "";
    for (var i = 0; i < toks.length; i++) {
      if (out.length < toks[i].start) {
        out += " ".repeat(toks[i].start - out.length);
      } else if (out.length > 0) {
        out += " ";
      }
      out += toks[i].text;
    }
    return out;
  }
  // ---- v57: Rapikan otomatis (lyric formatter + chord finder) ----
  var AF_SEC_MAP = [
    [/^intro\b/, "Intro"],
    [/^(pre[\s\-]?chorus|pre[\s\-]?reff?|prechorus)\b/, "Pre-Chorus"],
    [/^(reffrain|refrain|reff|ref|chorus|korus)\b/, "Chorus"],
    [/^(bait|verse|ayat)\b/, "Verse"],
    [/^bridge\b/, "Bridge"],
    [/^(interlude|inter)\b/, "Interlude"],
    [/^(instrumental|instrumen|musik|music|solo)\b/, "Instrumental"],
    [/^(outro|outtro|ending|penutup|coda)\b/, "Outro"],
  ];
  function afCleanLabel(line) {
    return String(line)
      .replace(/[\[\]\(\)\{\}\*_#>]/g, " ")
      .replace(/[:\-\u2013\u2014.]+\s*$/, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function afSectionLabel(line) {
    var c = afCleanLabel(line);
    if (!c || c.length > 26) return null;
    if (c.split(" ").length > 3) return null;
    var low = c.toLowerCase();
    for (var i = 0; i < AF_SEC_MAP.length; i++) {
      if (AF_SEC_MAP[i][0].test(low)) {
        var base = AF_SEC_MAP[i][1];
        var num = low.match(/(\d+)/);
        if (num && base !== "Pre-Chorus") return base + " " + num[1];
        return base;
      }
    }
    return null;
  }
  function afIsJunk(line) {
    var t = line.trim();
    if (!t) return false;
    if (/^[\-=_~*\u2022\u00b7\u2014\u2013\s]+$/.test(t)) return true;
    return /(chords?\s*(by|:)|kunci\s*gitar|lirik\s*lagu|copyright|all\s+rights|\u00a9|www\.|https?:\/\/|baca\s*juga|terpopuler|iklan|advertis|klik\s*di\s*sini|selengkapnya|share\s*this)/i.test(
      t,
    );
  }
  function afChordsIn(line) {
    var out = [];
    var inl = line.match(/\[([^\]]+)\]/g);
    if (inl) {
      for (var i = 0; i < inl.length; i++) {
        var v = inl[i].slice(1, -1).trim();
        if (v) out.push(v);
      }
      return out;
    }
    if (isChordLine(line)) {
      var m = line.match(/\S+/g) || [];
      for (var j = 0; j < m.length; j++) out.push(m[j]);
    }
    return out;
  }
  function afRootOf(chord) {
    var m = String(chord).match(/^([A-G])(#|b)?/);
    if (!m) return null;
    var n = m[1] + (m[2] || "");
    return noteToIndex[n] === undefined ? null : noteToIndex[n];
  }
  function afIsMinor(chord) {
    return /^[A-G](#|b)?m(?!aj)/.test(String(chord));
  }
  function afDetectKey(chords) {
    if (!chords || !chords.length) return "";
    var deg = [0, 2, 4, 5, 7, 9, 11];
    var isMinDeg = [0, 1, 1, 0, 0, 1, 2];
    var best = "",
      bestScore = -1;
    for (var k = 0; k < keyList.length; k++) {
      var root = noteToIndex[keyList[k]];
      var score = 0;
      for (var i = 0; i < chords.length; i++) {
        var r = afRootOf(chords[i]);
        if (r === null) continue;
        var w = i === 0 || i === chords.length - 1 ? 2 : 1;
        for (var d = 0; d < 7; d++) {
          if ((root + deg[d]) % 12 === r) {
            var mn = afIsMinor(chords[i]);
            if (isMinDeg[d] === 2) score += 0.5 * w;
            else if ((isMinDeg[d] === 1) === mn) score += 1 * w;
            else score += 0.3 * w;
            if (d === 0 && w === 2 && !mn) score += 1.5;
            break;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = keyList[k];
      }
    }
    return best;
  }
  function afSignature(lines) {
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (!l.trim() || isChordLine(l)) continue;
      var t = l
        .replace(/\[[^\]]*\]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (t) out.push(t);
    }
    return out.join(" | ");
  }
  function afAllChordLines(b) {
    for (var i = 0; i < b.lines.length; i++) {
      var l = b.lines[i];
      if (l.trim() && !isChordLine(l)) return false;
    }
    return true;
  }
  function afInferLabels(blocks) {
    var sigs = [],
      count = {};
    for (var i = 0; i < blocks.length; i++) {
      sigs.push(afSignature(blocks[i].lines));
      if (sigs[i]) count[sigs[i]] = (count[sigs[i]] || 0) + 1;
    }
    var chorusSig = "",
      bestN = 1;
    for (var s in count) {
      if (
        count[s] >= 2 &&
        (count[s] > bestN ||
          (count[s] === bestN && s.length > chorusSig.length))
      ) {
        bestN = count[s];
        chorusSig = s;
      }
    }
    var vn = 0,
      cn = 0,
      seenChorus = false,
      usedBridge = false;
    for (var j = 0; j < blocks.length; j++) {
      var b = blocks[j];
      if (!sigs[j] && afAllChordLines(b)) {
        b.label =
          j === 0 ? "Intro" : j === blocks.length - 1 ? "Outro" : "Interlude";
        continue;
      }
      if (chorusSig && sigs[j] === chorusSig) {
        cn++;
        b.label = cn > 1 ? "Chorus " + cn : "Chorus";
        seenChorus = true;
        continue;
      }
      if (
        seenChorus &&
        !usedBridge &&
        count[sigs[j]] === 1 &&
        j >= blocks.length - 2
      ) {
        usedBridge = true;
        b.label = "Bridge";
        continue;
      }
      vn++;
      b.label = "Verse " + vn;
    }
  }
  function autoFormatLyrics(raw) {
    var txt = String(raw || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/\t/g, "    ");
    var src = txt.split("\n"),
      lines = [];
    for (var i = 0; i < src.length; i++) {
      var l = src[i].replace(/\s+$/, "");
      if (afIsJunk(l)) continue;
      lines.push(l);
    }
    var blocks = [],
      cur = null,
      hadLabel = false;
    for (var j = 0; j < lines.length; j++) {
      var ln = lines[j],
        lbl = null;
      if (ln.trim() && !isChordLine(ln)) lbl = afSectionLabel(ln);
      if (lbl) {
        hadLabel = true;
        cur = { label: lbl, lines: [] };
        blocks.push(cur);
        continue;
      }
      if (!ln.trim()) {
        if (!hadLabel) cur = null;
        else if (cur) cur.lines.push("");
        continue;
      }
      if (!cur) {
        cur = { label: null, lines: [] };
        blocks.push(cur);
      }
      cur.lines.push(ln);
    }
    for (var b = 0; b < blocks.length; b++) {
      var L = blocks[b].lines;
      while (L.length && !L[0].trim()) L.shift();
      while (L.length && !L[L.length - 1].trim()) L.pop();
    }
    var kept = [];
    for (var c = 0; c < blocks.length; c++)
      if (blocks[c].lines.length) kept.push(blocks[c]);
    blocks = kept;
    if (!blocks.length) return null;
    if (!hadLabel) afInferLabels(blocks);
    else
      for (var d = 0; d < blocks.length; d++)
        if (!blocks[d].label)
          blocks[d].label = afAllChordLines(blocks[d]) ? "Intro" : "Verse 1";
    var outLines = [],
      allChords = [];
    for (var e = 0; e < blocks.length; e++) {
      if (e) outLines.push("");
      outLines.push(blocks[e].label);
      var BL = blocks[e].lines,
        prevBlank = false;
      for (var f = 0; f < BL.length; f++) {
        var ll = BL[f];
        if (!ll.trim()) {
          if (!prevBlank) {
            outLines.push("");
            prevBlank = true;
          }
          continue;
        }
        prevBlank = false;
        outLines.push(ll);
        var cc = afChordsIn(ll);
        for (var g = 0; g < cc.length; g++) allChords.push(cc[g]);
      }
    }
    var secCount = {};
    for (var h = 0; h < blocks.length; h++) {
      var bn = blocks[h].label.replace(/\s*\d+$/, "");
      secCount[bn] = (secCount[bn] || 0) + 1;
    }
    return {
      text: outLines.join("\n"),
      blocks: blocks.length,
      chords: allChords.length,
      key: afDetectKey(allChords),
      secCount: secCount,
    };
  }
  var afPrevText = null;
  function afUndo() {
    if (afPrevText === null) return;
    var ta = document.getElementById("editLines");
    if (ta) ta.value = afPrevText;
    afPrevText = null;
    var bar = document.getElementById("afBar");
    if (bar) bar.hidden = true;
    if (structMode) renderCanvas();
    updateEditPreview();
    toast("Dikembalikan ke teks semula", "info");
  }
  function runAutoFormat() {
    var ta = document.getElementById("editLines");
    if (!ta) return;
    try {
      replayIn(document.getElementById("autoFormatBtn"));
    } catch (e) {}
    if (structMode) serializeCanvas();
    var raw = ta.value || "";
    if (!raw.trim()) {
      toast("Tempel lirik dulu di kotak Chord & lirik", "error");
      return;
    }
    var res = autoFormatLyrics(raw);
    if (!res) {
      toast("Tidak ada lirik yang bisa dirapikan", "error");
      return;
    }
    afPrevText = raw;
    ta.value = res.text;
    var keyEl = document.getElementById("editOriginalKey"),
      keySet = false;
    if (keyEl && res.key && !keyEl.value.trim()) {
      keyEl.value = res.key;
      keySet = true;
    }
    var parts = [];
    for (var k in res.secCount) parts.push(res.secCount[k] + " " + k);
    var msg = "Terdeteksi: " + parts.join(" \u00b7 ");
    if (res.chords)
      msg +=
        " \u00b7 " +
        res.chords +
        " chord" +
        (res.key ? " \u00b7 nada dasar " + res.key : "");
    else msg += " \u00b7 tanpa chord (tempel dari situs chord agar terdeteksi)";
    if (keySet) msg += " \u2014 nada dasar diisi otomatis";
    var bar = document.getElementById("afBar"),
      mEl = document.getElementById("afMsg");
    if (bar && mEl) {
      mEl.textContent = msg;
      bar.hidden = false;
    }
    setStructMode(true);
    updateEditPreview();
    toast("Lirik dirapikan jadi " + res.blocks + " bagian", "info");
  }
  function formatChordSpacing(line) {
    return line.trim().split(/\s+/).join("      ");
  }
  function isChordLine(line) {
    const t = line.trim();
    if (!t) return false;
    if (sectionWords.test(t)) return false;
    const tokens = t.split(/\s+/);
    let chordLike = 0;
    for (const tok of tokens) {
      const c = tok.replace(/^[|([{]+|[|,.;:)\]}]+$/g, "");
      if (c === "." || c === "") continue;
      if (/^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|\d|\/|\(|\)|\+|-)*$/i.test(c))
        chordLike++;
      else return false;
    }
    return chordLike > 0;
  }
  // --- Membuat tombol lagu & nada, lalu menggambar lembar chord ---
  function makeButtons() {
    songButtons.innerHTML = "";
    songs.forEach((song, idx) => {
      song.num = idx + 1;
      const row = document.createElement("div");
      row.className = "songRow";
      row.dataset.id = song.id;
      const handle = document.createElement("span");
      handle.className = "dragHandle";
      handle.textContent = "⋮";
      handle.title = "Tahan lalu geser untuk mengubah urutan";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "songBtn";
      b.dataset.id = song.id;
      b.textContent = song.num + ". " + song.title;
      b.onclick = () => {
        if (selectedSongId !== song.id) stopYt();
        selectedSongId = song.id;
        selectedKey = song.originalKey;
        try {
          if (window.__pnwSemiUi)
            window.__pnwSemiUi(song.originalKey, song.originalKey);
        } catch (e) {}
        closeEditor();
        render();
      };
      row.appendChild(handle);
      row.appendChild(b);
      enableRowDrag(handle, row);
      songButtons.appendChild(row);
    });
    keyButtons.innerHTML = "";
    keyList.forEach((key) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "keyBtn";
      b.dataset.key = key;
      b.textContent = key;
      b.onclick = () => {
        selectedKey = key;
        render();
      };
      keyButtons.appendChild(b);
    });
    refreshLibrary();
    try {
      initV62();
    } catch (e) {}
    try {
      if (window.PNWRec) window.PNWRec.decorate();
    } catch (e) {}
  }
  function hasInlineChords(line) {
    return /\[[^\]]*\]/.test(line);
  }
  function parseInline(line) {
    var out = [];
    line.split(/(\[[^\]]*\])/).forEach(function (tk) {
      if (!tk) return;
      var mm = tk.match(/^\[([^\]]*)\]$/);
      if (mm) {
        out.push({ chord: mm[1].trim(), text: "" });
      } else if (
        out.length &&
        out[out.length - 1].chord !== "" &&
        out[out.length - 1].text === ""
      ) {
        out[out.length - 1].text = tk;
      } else {
        out.push({ chord: "", text: tk });
      }
    });
    return out;
  }
  function parseSecMod(line) {
    var off = 0;
    var clean = line.replace(/\(([+-]\d{1,2})\)/, function (m, g) {
      off = parseInt(g, 10) || 0;
      return "";
    });
    clean = clean.replace(/\s+$/, "");
    return { offset: off, clean: clean };
  }
  function secClass(line) {
    var t = line.trim().toLowerCase();
    if (/^intro/.test(t)) return "sec-intro";
    if (/^pre-?chorus/.test(t)) return "sec-pre";
    if (/^(reff|refrain|chorus)/.test(t)) return "sec-chorus";
    if (/^post-?chorus/.test(t)) return "sec-post";
    if (/^(bait|verse)/.test(t)) return "sec-verse";
    if (/^bridge/.test(t)) return "sec-bridge";
    if (/^(instrumen|musik|solo)/.test(t)) return "sec-inst";
    if (/^(interlude|transition|transisi)/.test(t)) return "sec-inter";
    if (/^breakdown/.test(t)) return "sec-break";
    if (/^(modulation|key ?change|overtune)/.test(t)) return "sec-mod";
    if (/^(ending|outro|outtro|coda)/.test(t)) return "sec-outro";
    return "sec-none";
  }
  function renderLineEl(line, shift, target) {
    var div = document.createElement("div");
    if (hasInlineChords(line)) {
      div.className = "line inlineChord";
      parseInline(line).forEach(function (sg) {
        var col = document.createElement("span");
        col.className = "ic";
        var ch = document.createElement("span");
        var _cq = chordQuality(sg.chord || "");
        ch.className = "ic-ch" + (_cq ? " chord-" + _cq : "");
        ch.textContent = sg.chord
          ? transposeToken(sg.chord, shift, target)
          : "";
        var tx = document.createElement("span");
        tx.className = "ic-tx";
        tx.textContent = sg.text;
        col.appendChild(ch);
        col.appendChild(tx);
        div.appendChild(col);
      });
    } else if (isChordLine(line)) {
      div.className = "line chord";
      var _re = /\S+/g,
        _m,
        _last = 0;
      while ((_m = _re.exec(line)) !== null) {
        if (_m.index > _last)
          div.appendChild(document.createTextNode(line.slice(_last, _m.index)));
        var _sp = document.createElement("span");
        var _q = chordQuality(_m[0]);
        _sp.className = "chTok" + (_q ? " chord-" + _q : "");
        _sp.textContent = transposeToken(_m[0], shift, target);
        div.appendChild(_sp);
        _last = _m.index + _m[0].length;
      }
      if (_last < line.length)
        div.appendChild(document.createTextNode(line.slice(_last)));
    } else if (sectionWords.test(line.trim())) {
      div.className = "line section";
      var pm = parseSecMod(line);
      div.textContent = pm.clean;
      if (pm.offset) {
        var mb = document.createElement("span");
        mb.className = "modBadge";
        mb.textContent = " (" + (pm.offset > 0 ? "+" : "") + pm.offset + ")";
        div.appendChild(mb);
      }
    } else {
      div.className = line.trim() ? "line" : "line blankLine";
      div.textContent = line;
    }
    return div;
  }
  function renderLinesInto(container, lines, shift, target) {
    container.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "secBlock sec-none";
    container.appendChild(wrap);
    var secMod = 0;
    lines.forEach(function (raw) {
      var ln = raw || "";
      if (sectionWords.test(ln.trim())) {
        var pm = parseSecMod(ln);
        secMod = pm.offset;
        wrap = document.createElement("div");
        wrap.className = "secBlock " + secClass(ln);
        container.appendChild(wrap);
        wrap.appendChild(renderLineEl(ln, shift, target));
      } else {
        wrap.appendChild(renderLineEl(ln, shift + secMod, target));
      }
    });
  }
  function updateEditPreview() {
    var body = document.getElementById("editPreviewBody");
    if (!body) return;
    var key = (document.getElementById("editOriginalKey").value || "C").trim();
    var target = noteToIndex[key] === undefined ? "C" : key;
    var text = document.getElementById("editLines").value || "";
    renderLinesInto(body, text.replace(/\r/g, "").split("\n"), 0, target);
  }
  function render() {
    if (!songs.length) {
      content.textContent = "Belum ada lagu.";
      return;
    }
    const song = currentSong();
    if (!song) return;
    const target = selectedKey || song.originalKey;
    const shift =
      (noteToIndex[target] ?? 0) - (noteToIndex[song.originalKey] ?? 0);
    document
      .querySelectorAll(".songBtn")
      .forEach((b) => b.classList.toggle("active", b.dataset.id === song.id));
    document
      .querySelectorAll(".keyBtn")
      .forEach((b) => b.classList.toggle("active", b.dataset.key === target));
    document.getElementById("currentSongPill").textContent =
      (song.num || "") + ". " + song.title;
    document.getElementById("currentKeyPill").textContent =
      target === song.originalKey
        ? "Nada " + target + " (asli)"
        : "Nada " + target + " (asli " + song.originalKey + ")";
    try {
      if (window.__pnwSemiUi) window.__pnwSemiUi(target, song.originalKey);
    } catch (e) {}
    document.getElementById("songTitle").textContent = song.title;
    document.getElementById("keyLine").textContent =
      "Nada asli " + song.originalKey + " \u2192 ditampilkan di " + target;
    document.getElementById("sourceLine").textContent = song.source
      ? "Keterangan: " + song.source
      : "";
    renderLinesInto(content, song.lines || [], shift, target);
    try {
      if (window.PNWRec && window.PNWRec.mountDock)
        window.PNWRec.mountDock(song.id, song.title);
    } catch (e) {}
    if (typeof broadcastLive === "function") broadcastLive();
  }
  // --- Editor lagu: ubah, tambah, duplikat, dan hapus ---
  function openEditor() {
    const song = currentSong();
    document.getElementById("editTitle").value = song.title;
    document.getElementById("editOriginalKey").value = song.originalKey;
    document.getElementById("editSource").value = song.source || "";
    document.getElementById("editYoutube").value = song.youtube || "";
    document.getElementById("editBg").value = song.bg || "";
    document.getElementById("editLines").value = (song.lines || []).join("\n");
    document.getElementById("editor").classList.add("open");
    document
      .getElementById("editor")
      .scrollIntoView({ behavior: "smooth", block: "start" });
    setStructMode(false);
    updateEditPreview();
  }
  function closeEditor() {
    document.getElementById("editor").classList.remove("open");
  }
  var SEC_TYPES = [
    {
      key: "Intro",
      desc: "Pembuka lagu; biasanya instrumen atau melodi utama.",
    },
    {
      key: "Verse",
      desc: "Menceritakan isi/alur lagu; lirik tiap verse berbeda.",
    },
    {
      key: "Pre-Chorus",
      desc: "Jembatan verse ke chorus; membangun ketegangan.",
    },
    {
      key: "Chorus",
      desc: "Bagian paling mudah diingat; sering diulang.",
    },
    {
      key: "Post-Chorus",
      desc: "Setelah chorus; hook tambahan / instrumental singkat.",
    },
    {
      key: "Bridge",
      desc: "Nuansa baru menjelang akhir; chord/melodi berbeda.",
    },
    {
      key: "Instrumental",
      desc: "Bagian tanpa vokal; solo gitar/piano/dll.",
    },
    {
      key: "Breakdown",
      desc: "Dibuat lebih kosong/pelan sebagai kontras.",
    },
    {
      key: "Interlude",
      desc: "Sisipan instrumental pendek antar bagian.",
    },
    {
      key: "Modulation",
      desc: "Perubahan nada dasar untuk menaikkan energi.",
    },
    { key: "Outro", desc: "Penutup lagu; fade out / ending tegas." },
  ];
  function secDesc(name) {
    var t = (name || "").toLowerCase();
    for (var i = 0; i < SEC_TYPES.length; i++) {
      if (t.indexOf(SEC_TYPES[i].key.toLowerCase()) === 0)
        return SEC_TYPES[i].desc;
    }
    return "";
  }
  function parseBlocks(text) {
    var lines = (text || "").replace(/\r/g, "").split("\n");
    var blocks = [];
    var cur = { header: "", mod: 0, body: [] };
    lines.forEach(function (ln) {
      if (sectionWords.test(ln.trim())) {
        if (cur.header !== "" || cur.body.length) blocks.push(cur);
        var pm = parseSecMod(ln);
        cur = { header: pm.clean.trim(), mod: pm.offset, body: [] };
      } else {
        cur.body.push(ln);
      }
    });
    blocks.push(cur);
    if (
      blocks.length > 1 &&
      blocks[0].header === "" &&
      blocks[0].body.join("").trim() === ""
    )
      blocks.shift();
    return blocks;
  }
  function serializeCanvas() {
    var canvas = document.getElementById("structCanvas");
    if (!canvas) return;
    var out = [];
    canvas.querySelectorAll(".structBlock").forEach(function (bl) {
      var header = bl.dataset.header || "";
      var mod = parseInt(bl.dataset.mod || "0", 10) || 0;
      var body = bl.querySelector("textarea").value.replace(/\r/g, "");
      if (header)
        out.push(header + (mod ? " (" + (mod > 0 ? "+" : "") + mod + ")" : ""));
      if (body.length)
        body.split("\n").forEach(function (l) {
          out.push(l);
        });
    });
    document.getElementById("editLines").value = out.join("\n");
    updateEditPreview();
  }
  var dragBlock = null;
  function attachBlockDrag(wrap, handle) {
    handle.addEventListener("dragstart", function (e) {
      dragBlock = wrap;
      wrap.classList.add("dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("text/plain", "b");
        } catch (x) {}
      }
    });
    handle.addEventListener("dragend", function () {
      if (dragBlock) dragBlock.classList.remove("dragging");
      dragBlock = null;
      serializeCanvas();
    });
    wrap.addEventListener("dragover", function (e) {
      if (!dragBlock || dragBlock === wrap) return;
      e.preventDefault();
      var canvas = document.getElementById("structCanvas");
      var rect = wrap.getBoundingClientRect();
      var after = e.clientY - rect.top > rect.height / 2;
      canvas.insertBefore(dragBlock, after ? wrap.nextSibling : wrap);
    });
  }
  function setBlockMod(wrap, delta) {
    var m = (parseInt(wrap.dataset.mod || "0", 10) || 0) + delta;
    if (m > 12) m = 12;
    if (m < -12) m = -12;
    wrap.dataset.mod = m;
    var v = wrap.querySelector(".sbModVal");
    if (v) v.textContent = m ? (m > 0 ? "+" + m : "" + m) : "0";
    serializeCanvas();
  }
  function sbCleanName(v) {
    return (v || "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\(\s*[+-]\d{1,2}\s*\)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  function sbApplyName(wrap, h) {
    wrap.dataset.header = h;
    var cls = "structBlock";
    if (h) cls += " " + secClass(h);
    if (wrap.classList.contains("dragging")) cls += " dragging";
    wrap.className = cls;
    var dp = wrap.querySelector(".sbDesc");
    if (dp) {
      var d = secDesc(h);
      dp.textContent = d;
      dp.hidden = !d;
    }
  }
  function sbRename(wrap, inp, isBlur) {
    var h = sbCleanName(inp.value);
    var ok = !!h && sectionWords.test(h);
    inp.classList.toggle("bad", !ok);
    if (ok) {
      sbApplyName(wrap, h);
      serializeCanvas();
      return;
    }
    if (isBlur) {
      inp.value = wrap.dataset.header || "";
      inp.classList.remove("bad");
      toast(
        "Nama bagian harus diawali kata baku: Intro, Verse, Chorus, Pre-Chorus, Bridge, Interlude, Instrumental, Outro. Contoh benar: Intro (Drum), Verse 2",
        "error",
        4800,
      );
    }
  }
  function nextSecName(base) {
    var canvas = document.getElementById("structCanvas");
    if (!canvas) return base;
    var b = base.toLowerCase(),
      n = 0;
    canvas.querySelectorAll(".structBlock").forEach(function (bl) {
      var h = (bl.dataset.header || "").toLowerCase();
      if (h === b || h.indexOf(b + " ") === 0) n++;
    });
    return n ? base + " " + (n + 1) : base;
  }
  function buildBlockEl(header, mod, bodyText) {
    var wrap = document.createElement("div");
    wrap.className = "structBlock";
    if (header) wrap.classList.add(secClass(header));
    wrap.dataset.header = header || "";
    wrap.dataset.mod = mod || 0;
    var head = document.createElement("div");
    head.className = "sbHead";
    var handle = document.createElement("span");
    handle.className = "sbHandle";
    handle.textContent = "\u2807";
    handle.setAttribute("draggable", "true");
    head.appendChild(handle);
    var name;
    if (header) {
      name = document.createElement("input");
      name.type = "text";
      name.className = "sbName sbNameIn";
      name.value = header;
      name.spellcheck = false;
      name.setAttribute("aria-label", "Nama bagian");
      name.title = "Klik untuk ubah nama bagian, mis. Intro (Drum), Verse 2";
      name.addEventListener("input", function () {
        sbRename(wrap, name, false);
      });
      name.addEventListener("blur", function () {
        sbRename(wrap, name, true);
      });
      name.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          name.blur();
        }
      });
    } else {
      name = document.createElement("span");
      name.className = "sbName";
      name.textContent = "(pembuka)";
    }
    head.appendChild(name);
    if (header) {
      var modWrap = document.createElement("span");
      modWrap.className = "sbMod";
      var down = document.createElement("button");
      down.type = "button";
      down.textContent = "\u25BC";
      var val = document.createElement("span");
      val.className = "sbModVal";
      val.textContent = mod ? (mod > 0 ? "+" + mod : "" + mod) : "0";
      var up = document.createElement("button");
      up.type = "button";
      up.textContent = "\u25B2";
      down.onclick = function () {
        setBlockMod(wrap, -1);
      };
      up.onclick = function () {
        setBlockMod(wrap, 1);
      };
      modWrap.appendChild(down);
      modWrap.appendChild(val);
      modWrap.appendChild(up);
      head.appendChild(modWrap);
    }
    var del = document.createElement("button");
    del.type = "button";
    del.className = "sbDel";
    del.textContent = "\u2715";
    del.onclick = function () {
      wrap.remove();
      serializeCanvas();
    };
    head.appendChild(del);
    wrap.appendChild(head);
    if (header) {
      var dp = document.createElement("p");
      dp.className = "sbDesc";
      var d = secDesc(header);
      dp.textContent = d;
      dp.hidden = !d;
      wrap.appendChild(dp);
    }
    var ta = document.createElement("textarea");
    ta.value = bodyText || "";
    ta.placeholder = "Tulis chord & lirik... mis. [G]Na-ma-[D]Nya";
    ta.addEventListener("input", serializeCanvas);
    wrap.appendChild(ta);
    attachBlockDrag(wrap, handle);
    return wrap;
  }
  function renderCanvas() {
    var canvas = document.getElementById("structCanvas");
    if (!canvas) return;
    canvas.innerHTML = "";
    parseBlocks(document.getElementById("editLines").value).forEach(
      function (b) {
        canvas.appendChild(buildBlockEl(b.header, b.mod, b.body.join("\n")));
      },
    );
  }
  function addSection(name) {
    var canvas = document.getElementById("structCanvas");
    var el = buildBlockEl(nextSecName(name), 0, "");
    canvas.appendChild(el);
    serializeCanvas();
    el.scrollIntoView({ block: "nearest" });
    var ta = el.querySelector("textarea");
    if (ta) ta.focus();
  }
  function buildPalette() {
    var pal = document.getElementById("structPalette");
    if (!pal) return;
    pal.innerHTML = "";
    SEC_TYPES.forEach(function (s) {
      var c = document.createElement("span");
      c.className = "palChip " + secClass(s.key);
      c.textContent = s.key;
      c.title = s.desc;
      c.setAttribute("draggable", "true");
      c.onclick = function () {
        addSection(s.key);
      };
      c.addEventListener("dragstart", function (e) {
        if (e.dataTransfer) {
          try {
            e.dataTransfer.setData("text/plain", "pal:" + s.key);
          } catch (x) {}
        }
      });
      pal.appendChild(c);
    });
    var canvas = document.getElementById("structCanvas");
    canvas.addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    canvas.addEventListener("drop", function (e) {
      var d = "";
      try {
        d = e.dataTransfer.getData("text/plain");
      } catch (x) {}
      if (d && d.indexOf("pal:") === 0) {
        e.preventDefault();
        addSection(d.slice(4));
      }
    });
  }
  var structMode = false;
  function setStructMode(on) {
    structMode = !!on;
    var wrap = document.getElementById("structWrap");
    var ta = document.getElementById("editLines");
    var hint = document.getElementById("editHint");
    var btn = document.getElementById("structToggleBtn");
    var sug = document.getElementById("chordSuggest");
    if (structMode) renderCanvas();
    if (wrap) wrap.hidden = !structMode;
    if (ta) ta.style.display = structMode ? "none" : "";
    if (hint) hint.style.display = structMode ? "none" : "";
    if (sug && structMode) sug.hidden = true;
    if (btn) {
      btn.classList.toggle("active", structMode);
      var lbl = document.getElementById("structBtnLbl");
      if (lbl) lbl.textContent = structMode ? "Mode teks" : "Mode struktur";
      else
        btn.innerHTML =
          '<span class="lottieIco btnIco" data-anim="struktur"></span>' +
          (structMode ? "Mode teks" : "Mode struktur");
      try {
        initLottieIcons();
        replayIn(btn);
      } catch (e) {}
    }
  }
  function toggleStructMode() {
    setStructMode(!structMode);
  }
  function saveEdit() {
    const song = currentSong();
    const key = document.getElementById("editOriginalKey").value.trim();
    if (noteToIndex[key] === undefined) {
      alert(
        "Nada dasar tidak dikenali. Pakai C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, atau B.",
      );
      return;
    }
    song.title =
      document.getElementById("editTitle").value.trim() || song.title;
    song.originalKey = key;
    song.source = document.getElementById("editSource").value.trim();
    song.youtube = document.getElementById("editYoutube").value.trim();
    song.bg = document.getElementById("editBg").value.trim();
    song.lines = document
      .getElementById("editLines")
      .value.replace(/\r/g, "")
      .split("\n");
    selectedKey = key;
    saveSongs();
    makeButtons();
    render();
    closeEditor();
  }
  function addSong() {
    const s = {
      id: "song-" + Date.now(),
      title: "Lagu Baru",
      originalKey: "C",
      source: "",
      youtube: "",
      bg: "",
      lines: [
        "Intro :",
        "[C] [G] [Am] [F]",
        "Bait :",
        "[C]Tulis lirik di sini, [G]ganti chord sebelum suku kata",
        "[Am]Baris lirik berikut[F]nya di sini",
        "Reff :",
        "[F]Tulis lirik [G]reff di [C]sini",
      ],
    };
    songs.push(s);
    selectedSongId = s.id;
    selectedKey = s.originalKey;
    saveSongs();
    makeButtons();
    render();
    openEditor();
  }
  function duplicateSong() {
    const song = currentSong();
    const copy = JSON.parse(JSON.stringify(song));
    copy.id = "song-" + Date.now();
    copy.title = copy.title + " (Salinan)";
    copy.bankId = "";
    songs.push(copy);
    selectedSongId = copy.id;
    selectedKey = copy.originalKey;
    saveSongs();
    makeButtons();
    render();
    openEditor();
  }
  function deleteSong() {
    if (songs.length <= 1) {
      alert("Minimal harus ada 1 lagu.");
      return;
    }
    const song = currentSong();
    if (!confirm('Hapus lagu \"' + song.title + '\"?')) return;
    songs = songs.filter((s) => s.id !== song.id);
    selectedSongId = songs[0].id;
    selectedKey = songs[0].originalKey;
    saveSongs();
    makeButtons();
    render();
    closeEditor();
  }
  // --- Cadangan: salin, muat, dan unduh data lagu ---
  function openBackup() {
    document.getElementById("backupText").value = JSON.stringify(
      songs,
      null,
      2,
    );
    document.getElementById("backupModal").classList.add("open");
  }
  function closeBackup() {
    document.getElementById("backupModal").classList.remove("open");
  }
  function importBackup() {
    try {
      const data = JSON.parse(document.getElementById("backupText").value);
      if (!Array.isArray(data)) throw new Error("Data bukan array");
      songs = data;
      selectedSongId = songs[0].id;
      selectedKey = songs[0].originalKey;
      saveSongs();
      makeButtons();
      render();
      closeBackup();
      alert("Berhasil dimuat.");
    } catch (e) {
      alert("Gagal memuat: " + e.message);
    }
  }
  function downloadBackup() {
    const blob = new Blob([JSON.stringify(songs, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cadangan-chord-pujian-youth.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  // --- Memasang aksi ke setiap tombol ---
  document.getElementById("printBtn").onclick = () => window.print();
  // --- Salin: susun teks rapi, bukan innerText mentah ---
  function buildCopyText() {
    const sheet = document.getElementById("sheet");
    if (!sheet) return "";
    const RULE = "=".repeat(44);
    const out = [];
    const txtOf = (id) => {
      const el = document.getElementById(id);
      return el ? (el.textContent || "").trim() : "";
    };
    const title = txtOf("songTitle") || "Tanpa judul";
    out.push(title.toUpperCase());
    const key = txtOf("keyLine");
    const src = txtOf("sourceLine");
    if (key) out.push(key);
    if (src) out.push(src);
    out.push(RULE);
    out.push("");
    let blank = true;
    sheet.querySelectorAll(".line").forEach((el) => {
      const raw = (el.innerText || "").replace(/[ \t]+$/g, "");
      if (el.classList.contains("section")) {
        if (!blank) out.push("");
        const name = raw.trim().replace(/^\[|\]$/g, "");
        out.push("[" + name.toUpperCase() + "]");
        blank = false;
        return;
      }
      if (!raw.trim()) {
        if (!blank) {
          out.push("");
          blank = true;
        }
        return;
      }
      out.push(raw);
      blank = false;
    });
    while (out.length && !out[out.length - 1].trim()) out.pop();
    out.push("", "-".repeat(44), "HOSANA YOUTH TOOLS");
    return out.join("\n");
  }
  document.getElementById("copyBtn").onclick = async () => {
    const t = buildCopyText();
    try {
      await navigator.clipboard.writeText(t);
      if (typeof toast === "function")
        toast("Lagu disalin dengan format rapi.");
      else alert("Lagu disalin dengan format rapi.");
    } catch (e) {
      alert("Penyalinan otomatis gagal. Blok teks lagu lalu salin manual.");
    }
  };
  document.getElementById("editBtn").onclick = openEditor;
  document.getElementById("saveEditBtn").onclick = saveEdit;
  document.getElementById("cancelEditBtn").onclick = closeEditor;
  document.getElementById("duplicateBtn").onclick = duplicateSong;
  document.getElementById("deleteSongBtn").onclick = deleteSong;
  document.getElementById("addBtn").onclick = addSong;
  document.getElementById("backupBtn").onclick = openBackup;
  document.getElementById("closeBackupBtn").onclick = closeBackup;
  document.getElementById("importBackupBtn").onclick = importBackup;
  document.getElementById("downloadBackupBtn").onclick = downloadBackup;
  document.getElementById("copyBackupBtn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(
        document.getElementById("backupText").value,
      );
      alert("Cadangan sudah disalin.");
    } catch (e) {
      alert("Penyalinan gagal. Blok teks cadangan lalu salin manual.");
    }
  };
  // --- Menu (laci kanan atas) ---
  function openMenu() {
    document.getElementById("menuBackdrop").classList.add("open");
  }
  function closeMenu() {
    document.getElementById("menuBackdrop").classList.remove("open");
  }
  function applyIzinUI() {
    var btn = document.getElementById("openIzinBtn");
    if (btn) {
      var izinTitle = btn.querySelector(".menuRowTitle");
      var izinDesc = btn.querySelector(".menuRowDesc");
      if (!izinFormOpen && !isAdmin) {
        btn.disabled = true;
        if (izinTitle) izinTitle.textContent = "Kirim Izin";
        if (izinDesc) izinDesc.textContent = "Form izin ditutup admin";
        btn.style.opacity = "0.55";
      } else {
        btn.disabled = false;
        if (izinTitle) izinTitle.textContent = "Kirim Izin";
        if (izinDesc) izinDesc.textContent = "Ajukan izin tidak hadir";
        btn.style.opacity = "";
      }
    }
    var tgl = document.getElementById("izinOpenToggle");
    if (tgl) tgl.checked = !!izinFormOpen;
  }
  function toggleIzinForm() {
    if (!isAdmin) return;
    var want = document.getElementById("izinOpenToggle").checked;
    izinFormOpen = want;
    if (izinRef) izinRef.set(want);
    applyIzinUI();
    toast(
      want
        ? "Form izin dibuka. Member bisa kirim izin."
        : "Form izin ditutup. Member tidak bisa kirim izin.",
      "success",
    );
  }
  function openIzin() {
    closeMenu();
    if (!izinFormOpen && !isAdmin) {
      toast("Form izin sedang ditutup oleh admin.", "info");
      return;
    }
    document.getElementById("izinStatus").textContent = "";
    document.getElementById("izinModal").classList.add("open");
  }
  function closeIzin() {
    document.getElementById("izinModal").classList.remove("open");
  }
  // --- Bantu saran ---
  function animData(key) {
    if (key === "chat") return window.__ANIM_CHAT;
    if (key === "saran") return window.__ANIM_SARAN;
    return (window.__ANIM && window.__ANIM[key]) || null;
  }
  var _io = null;
  function getIO() {
    if (_io || typeof IntersectionObserver === "undefined") return _io;
    _io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && en.target._lottie) {
            try {
              playLottieTwice(en.target._lottie);
            } catch (e) {}
          }
        });
      },
      { threshold: 0.2 },
    );
    return _io;
  }
  function playLottieTwice(anim) {
    if (!anim) return;
    anim._loops = 0;
    anim.loop = true;
    try {
      anim.goToAndPlay(0, true);
    } catch (e) {}
  }
  function loadLottieIcon(el, data) {
    var anim = lottie.loadAnimation({
      container: el,
      renderer: "svg",
      loop: true,
      autoplay: false,
      animationData: data,
    });
    anim._times = el.classList.contains("lkIco") ? 1 : 2;
    try {
      anim.setSpeed(0.75);
    } catch (e) {}
    anim.addEventListener("loopComplete", function () {
      anim._loops = (anim._loops || 0) + 1;
      if (anim._loops >= (anim._times || 2)) anim.loop = false;
    });
    el._lottie = anim;
    playLottieTwice(anim);
    var io = getIO();
    if (io) io.observe(el);
  }
  function loadSeqIcon(el, seq) {
    el.innerHTML = "";
    var intro = lottie.loadAnimation({
      container: el,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: seq.intro,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
    });
    try {
      intro.setSpeed(0.9);
    } catch (e) {}
    el._lottie = intro;
    el._seqPhase = "intro";
    intro.addEventListener("complete", function () {
      try {
        intro.destroy();
      } catch (e) {}
      el.innerHTML = "";
      var idle = lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: seq.idle,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      try {
        idle.setSpeed(0.8);
      } catch (e) {}
      el._lottie = idle;
      el._seqPhase = "idle";
    });
  }
  function initLottieIcons() {
    if (typeof lottie === "undefined") return;
    var list = document.querySelectorAll(".lottieIco");
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.getAttribute("data-loaded")) continue;
      var seqKey = el.getAttribute("data-seq");
      if (seqKey && window.__SEQ && window.__SEQ[seqKey]) {
        el.setAttribute("data-loaded", "1");
        el.innerHTML = "";
        try {
          loadSeqIcon(el, window.__SEQ[seqKey]);
        } catch (e) {}
        continue;
      }
      var data = animData(el.getAttribute("data-anim"));
      if (!data) continue;
      el.setAttribute("data-loaded", "1");
      el.innerHTML = "";
      try {
        loadLottieIcon(el, data);
      } catch (e) {}
    }
  }
  function replayLottie(el) {
    if (!el) return;
    var seqKey = el.getAttribute("data-seq");
    if (seqKey && window.__SEQ && window.__SEQ[seqKey]) {
      try {
        if (el._lottie) el._lottie.destroy();
      } catch (e) {}
      el.innerHTML = "";
      try {
        loadSeqIcon(el, window.__SEQ[seqKey]);
      } catch (e) {}
      return;
    }
    if (el._lottie) {
      try {
        playLottieTwice(el._lottie);
      } catch (e) {}
    }
  }
  function replayIn(container) {
    if (!container) return;
    var list = container.querySelectorAll(".lottieIco");
    for (var i = 0; i < list.length; i++) replayLottie(list[i]);
  }
  function ensureLottie(tries) {
    initLottieIcons();
    if (typeof lottie === "undefined" && (tries || 0) < 25) {
      setTimeout(function () {
        ensureLottie((tries || 0) + 1);
      }, 300);
    }
  }
  /* v66: dipanggil loader malas di index.html setelah animations.js siap */
  window.__pnwInitIcons = function () {
    ensureLottie(0);
  };
  // ---- Loading overlay (loading.json -> centang) ----
  var _loadInst = null;
  function showLoading(msg) {
    var ov = document.getElementById("loadOverlay");
    var host = document.getElementById("loadAnim");
    if (!ov || !host) return;
    var m = document.getElementById("loadMsg");
    if (m) m.textContent = msg || "Memuat...";
    ov.classList.add("on");
    host.innerHTML = "";
    host.style.opacity = "1";
    _loadInst = null;
    var data = animData("loadingbefore") || animData("loading");
    if (typeof lottie !== "undefined" && data) {
      try {
        _loadInst = lottie.loadAnimation({
          container: host,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        });
      } catch (e) {}
    }
  }
  function loadingSuccess(msg, done) {
    var ov = document.getElementById("loadOverlay");
    var host = document.getElementById("loadAnim");
    if (!ov || !host) {
      if (done) done();
      return;
    }
    var m = document.getElementById("loadMsg");
    if (m && msg) m.textContent = msg;
    if (_loadInst) {
      try {
        _loadInst.destroy();
      } catch (e) {}
      _loadInst = null;
    }
    host.style.opacity = "0";
    setTimeout(function () {
      if (_loadInst) {
        try {
          _loadInst.destroy();
        } catch (e) {}
        _loadInst = null;
      }
      host.innerHTML = "";
      var data =
        animData("loadingafter") || animData("centang") || animData("check");
      if (typeof lottie !== "undefined" && data) {
        try {
          var a = lottie.loadAnimation({
            container: host,
            renderer: "svg",
            loop: false,
            autoplay: true,
            animationData: data,
            rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
          });
          host.style.opacity = "1";
          a.addEventListener("complete", function () {
            setTimeout(function () {
              hideLoading();
              if (done) done();
            }, 500);
          });
          return;
        } catch (e) {}
      }
      host.innerHTML =
        '<i class="fi fi-sr-check" style="font-size:60px;color:var(--green);line-height:96px"></i>';
      host.style.opacity = "1";
      setTimeout(function () {
        hideLoading();
        if (done) done();
      }, 850);
    }, 220);
  }
  function hideLoading() {
    var ov = document.getElementById("loadOverlay");
    if (ov) ov.classList.remove("on");
    if (_loadInst) {
      try {
        _loadInst.destroy();
      } catch (e) {}
      _loadInst = null;
    }
    var host = document.getElementById("loadAnim");
    if (host) host.innerHTML = "";
  }
  function openSaran() {
    closeMenu();
    document.getElementById("saranStatus").textContent = "";
    document.getElementById("saranModal").classList.add("open");
    initLottieIcons();
  }
  function closeSaran() {
    document.getElementById("saranModal").classList.remove("open");
  }
  function readSaranFoto(cb) {
    var inp = document.getElementById("saranFoto");
    var f = inp && inp.files && inp.files[0];
    if (!f) {
      cb(null);
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var maxDim = 900;
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var cw = Math.round(img.width * scale);
        var ch = Math.round(img.height * scale);
        var cv = document.createElement("canvas");
        cv.width = cw;
        cv.height = ch;
        cv.getContext("2d").drawImage(img, 0, 0, cw, ch);
        try {
          cb(cv.toDataURL("image/jpeg", 0.7));
        } catch (er) {
          cb(null);
        }
      };
      img.onerror = function () {
        cb(null);
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      cb(null);
    };
    reader.readAsDataURL(f);
  }
  function submitSaran() {
    var nama = (document.getElementById("saranNama").value || "").trim();
    var teks = (document.getElementById("saranTeks").value || "").trim();
    var st = document.getElementById("saranStatus");
    if (!teks) {
      st.style.color = "var(--red)";
      st.textContent = "Tulis saran kamu dulu ya.";
      return;
    }
    if (rateLimited("saran", 12000)) {
      st.style.color = "var(--red)";
      st.textContent =
        "Sabar ya, tunggu beberapa detik sebelum mengirim saran lagi.";
      return;
    }
    st.style.color = "var(--muted)";
    st.textContent = "Menyiapkan...";
    var btn = document.getElementById("sendSaranBtn");
    btn.disabled = true;
    readSaranFoto(function (foto) {
      var payload = {
        type: "saran",
        nama: nama || "(tanpa nama)",
        saran: teks,
        foto: foto || "",
        waktu: new Date().toLocaleString("id-ID"),
      };
      var sentSomething = false;
      try {
        if (
          cloudReady &&
          typeof firebase !== "undefined" &&
          firebase.apps &&
          firebase.apps.length
        ) {
          firebase
            .database()
            .ref("pujianYouth/saran")
            .push({
              nama: payload.nama,
              saran: payload.saran,
              foto: foto || null,
              waktu: payload.waktu,
              t: Date.now(),
            });
          sentSomething = true;
        }
      } catch (e) {}
      function doDone() {
        st.style.color = "var(--green)";
        st.textContent = "Terima kasih! Saran kamu sudah terkirim.";
        document.getElementById("saranNama").value = "";
        document.getElementById("saranTeks").value = "";
        var fi = document.getElementById("saranFoto");
        if (fi) fi.value = "";
        var pv = document.getElementById("saranFotoPreview");
        if (pv) pv.innerHTML = "";
        btn.disabled = false;
      }
      if (IZIN_ENDPOINT) {
        st.textContent = "Mengirim...";
        fetch(IZIN_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        })
          .then(doDone)
          .catch(function () {
            if (sentSomething) {
              doDone();
              return;
            }
            st.style.color = "var(--red)";
            st.textContent = "Gagal mengirim. Coba lagi ya.";
            btn.disabled = false;
          });
      } else if (sentSomething) {
        doDone();
      } else {
        st.style.color = "var(--red)";
        st.textContent = "Belum ada tujuan pengiriman yang aktif.";
        btn.disabled = false;
      }
    });
  }
  // --- Info & pembaruan (release notes) ---
  var SEED_NOTES = [
    {
      v: "v3.0",
      d: "28 Jul 2026",
      items: [
        "Tombol Kirim ke Sheets: jadwal langsung tertulis ke Google Sheets Jadwal Youth.",
        "Ekspor Excel tetap ada sebagai cadangan bila sedang offline.",
      ],
      t: 1785293400000,
    },
    {
      v: "v3.0",
      d: "28 Jul 2026",
      items: [
        "Kolom + tambah kini bisa dicari di HP, lengkap dengan penanda tier.",
        "Role Presenter (Trial) dihapus, tinggal satu Presenter.",
        "Tampilan jadwal dioptimalkan untuk HP dan tablet.",
        "Tombol Ekspor Excel untuk jadwal yang sudah jadi.",
        "Halaman jadwal lebih ringan dan cepat dibuka.",
      ],
      t: 1785291600000,
    },
    {
      v: "v3.0",
      d: "28 Jul 2026",
      items: [
        "Pemusik jadi satu baris berjejer: Pianist - Guitarist - Bassist - Drummer.",
        "Role Multimedia dihapus dan dilebur ke Presenter.",
        "Perbaikan sinkronisasi realtime jadwal antar perangkat.",
        "Ada lencana status sinkron di halaman jadwal.",
        "Pesan error sinkron kini menyebut penyebab aslinya.",
        "Form izin menulis ke jalur data yang sama dengan jadwal.",
      ],
      t: 1785288000000,
    },
    {
      v: "v3.0",
      d: "28 Jul 2026",
      items: [
        "Tim Sound & Multimedia kini terkunci: tidak merangkap tugas di P&W, Persembahan, atau Hospitality pada minggu yang sama.",
        "Penanda Double Role diganti dari garis 3D menjadi warna tetap per orang + angka jumlah tugas.",
        "Arahkan kursor atau ketuk sebuah nama untuk menyorot semua tugasnya di minggu itu.",
        "Jadwal kini realtime: beberapa pengurus bisa mengedit bersamaan tanpa saling menimpa.",
        "Member sekarang bisa membuka jadwal dalam mode lihat saja.",
      ],
      t: 1785300000000,
    },
    {
      v: "v3.0",
      d: "28 Jul 2026",
      items: [
        "Jadwal otomatis memakai aturan resmi H1-H8 (bukan lagi coba-coba).",
        "Hospitality: 3 Usher, Doa Pembuka & Pengumuman diambil dari usher (Double Role).",
        "Doa Penutup khusus pengurus dan tidak boleh merangkap usher.",
        "Presenter dipisah tetap & trial, dan tidak boleh pegang role teknis.",
        "Musisi P&W dari pool senior, Persembahan dari pool junior.",
        "WL Persembahan wajib beda orang dengan WL P&W.",
        "Selang-seling: yang melayani minggu ini dilewati minggu depan.",
        "Garis 3D otomatis menghubungkan nama yang dobel dalam satu minggu.",
      ],
    },
    {
      v: "2.1",
      d: "28 Jul 2026",
      items: [
        "Jadwal otomatis kini pakai sistem prioritas sederhana (Actual -> Secondary -> Cadangan) sesuai daftar pelayan.",
        "Pemusik dipisah jadi Keyboard, Guitar, Bass, dan Drum.",
        "Data izin & permintaan khusus dipakai otomatis; semua role diusahakan terisi.",
      ],
    },
    {
      v: "2.0",
      d: "28 Jul 2026",
      items: [
        "Kotak cari nama dipindah ke tombol + tambah saat mengisi jadwal.",
        "Efek tap tombol dipercepat (60ms).",
      ],
    },
    {
      v: "1.9",
      d: "28 Jul 2026",
      items: [
        "Drag daftar lagu stabil: lagu lain tidak bergeser sampai lagu dilepas.",
        "Jadwal otomatis pakai algoritma genetik (belajar dari data, semua role terisi).",
        "Like pembaruan: animasi sekali, jumlah update real-time.",
        "Ikon saran & pembaruan diperbesar dan sedikit bersinar.",
        "Efek tap tombol dipercepat.",
      ],
    },
    {
      v: "1.8",
      d: "28 Jul 2026",
      items: [
        "Ikon kalender & centang animasi (Lottie) ditambahkan.",
        "Animasi ikon kini main 2x dengan kecepatan 0.75x lalu diam.",
        "Efek tap bouncy + kilau biru saat menekan tombol fitur.",
      ],
    },
    {
      v: "1.7",
      d: "28 Jul 2026",
      items: [
        "Ikon animasi (Lottie) untuk kirim izin, pembaruan, saran, like.",
        'Menu saran kini "Beri Saran & lapor bug".',
        "Animasi main sekali saat muncul (tidak loop).",
        "Loading beranimasi saat login, lalu tanda sukses.",
      ],
    },
    {
      v: "1.6",
      d: "28 Jul 2026",
      items: [
        "Ikon menu, info, dan pembaruan diganti ikon Flaticon.",
        "Ikon beri saran & fitur saran kini animasi (Lottie).",
        "Form saran bisa melampirkan foto (masuk ke Firebase/Sheet).",
        "Bisa memberi like pada catatan Info & pembaruan.",
      ],
    },
    {
      v: "1.5",
      d: "28 Jul 2026",
      items: [
        "Login username & password untuk pengurus.",
        "Penjadwalan khusus admin + admin bisa tutup form izin.",
        "Kotak cari + urut abjad saat mengisi kolom jadwal.",
        "Admin bisa edit/hapus catatan Info & pembaruan.",
        "Drag-and-drop daftar lagu lebih stabil (tidak sensitif).",
      ],
    },
    {
      v: "1.4",
      d: "28 Jul 2026",
      items: [
        "Izin member langsung masuk matriks jadwal (Firebase).",
        "Jadwal otomatis lebih variatif + hindari role sama berulang.",
        "Semua nama tampil saat menambah pelayan (termasuk Persembahan).",
        "Chip kuning untuk double role + opsi izinkan double role.",
        "Kotak cari pelayan, tampilan HP lebih pas, font Inter.",
      ],
    },
    {
      v: "1.3",
      d: "26 Jul 2026",
      items: [
        "Autocomplete chord canggih saat mengedit lagu.",
        "Mode chord jadi angka (Nashville 1-7).",
        "Kotak 'Bantu saran' untuk usulan fitur.",
        "Tampilan menu dirapikan agar lebih ringan.",
      ],
    },
    {
      v: "1.2",
      d: "Juli 2026",
      items: [
        "Metronome dengan aksen ketukan pertama + ketuk tempo.",
        "Eye saver untuk kenyamanan mata di panggung.",
        "Form izin pelayanan langsung dari aplikasi.",
      ],
    },
    {
      v: "1.1",
      d: "Juli 2026",
      items: [
        "Song Bank dengan pencarian & urutkan lagu.",
        "Pemutar YouTube dengan progress bar.",
        "Sinkronisasi realtime antar perangkat.",
      ],
    },
  ];
  // ===== v3.2 - KONTROL PENUH ATAS CATATAN RILIS =====
  // SEED_NOTES ditulis langsung di berkas ini setiap kali ada revisi,
  // jadi catatan baru muncul otomatis. Supaya tetap bisa diedit dan
  // dihapus dari web tanpa menyentuh berkas, setiap perubahan disimpan
  // sebagai LAPISAN PENIMPA (override) yang ditempel di atas catatan
  // bawaan saat digambar. Bawaan aslinya tidak pernah ikut berubah,
  // sehingga "Pulihkan bawaan" selalu mungkin dilakukan.
  var NOTE_OV_KEY = "ptNoteOverrides";
  var noteOv = {};
  var CLOUD_NOTES = [];
  var RELEASE_NOTES = [];
  function seedId(n) {
    return (
      "seed_" +
      String(n.v || "").replace(/[^a-zA-Z0-9]/g, "_") +
      "_" +
      (n.t || 0)
    );
  }
  function isSeedKey(k) {
    return typeof k === "string" && k.indexOf("seed_") === 0;
  }
  function loadNoteOv() {
    try {
      noteOv = JSON.parse(localStorage.getItem(NOTE_OV_KEY) || "{}") || {};
    } catch (e) {
      noteOv = {};
    }
  }
  function refreshInfoUI() {
    buildReleaseNotes();
    renderInfoList();
    updateNoteDot();
    syncRestoreBtn();
  }
  // Lokal ditulis lebih dulu supaya kontrol penuh tetap jalan walau
  // aturan Firebase menolak tulisan. Cloud sifatnya pelengkap agar
  // perubahan ikut terlihat di perangkat lain.
  function saveNoteOv(id, val) {
    if (val === null) delete noteOv[id];
    else noteOv[id] = val;
    try {
      localStorage.setItem(NOTE_OV_KEY, JSON.stringify(noteOv));
    } catch (e) {}
    if (noteOvRef) {
      try {
        if (val === null) noteOvRef.child(id).remove();
        else noteOvRef.child(id).set(val);
      } catch (e) {}
    }
    refreshInfoUI();
  }
  function buildReleaseNotes() {
    var out = CLOUD_NOTES.slice();
    SEED_NOTES.forEach(function (n) {
      var id = seedId(n);
      var o = noteOv[id];
      if (o && o.hidden) return;
      var base = o && o.items ? o : n;
      out.push({
        v: base.v,
        d: base.d,
        items: base.items || [],
        t: base.t || n.t || 0,
        _key: id,
        _seed: true,
        _edited: !!(o && o.items),
      });
    });
    // Terbaru di atas. Kalau tanggalnya sama persis, versi yang lebih
    // besar didahulukan supaya urutannya tidak berubah sendiri.
    out.sort(function (a, b) {
      var s = (b.t || 0) - (a.t || 0);
      if (s) return s;
      return String(b.v || "").localeCompare(String(a.v || ""), undefined, {
        numeric: true,
      });
    });
    RELEASE_NOTES = out;
  }
  function noteOvCount() {
    return Object.keys(noteOv || {}).length;
  }
  function syncRestoreBtn() {
    var b = document.getElementById("restoreNotesBtn");
    if (!b) return;
    b.style.display = isAdmin && noteOvCount() ? "" : "none";
  }
  function restoreSeedNotes() {
    if (!isAdmin) return;
    if (
      !confirm(
        "Pulihkan semua catatan rilis bawaan? Hasil edit dan penghapusan pada catatan bawaan akan dibatalkan.",
      )
    )
      return;
    var ids = Object.keys(noteOv || {});
    noteOv = {};
    try {
      localStorage.setItem(NOTE_OV_KEY, "{}");
    } catch (e) {}
    if (noteOvRef) {
      try {
        ids.forEach(function (id) {
          noteOvRef.child(id).remove();
        });
      } catch (e) {}
    }
    refreshInfoUI();
    toast("Catatan bawaan dipulihkan.", "success");
  }
  loadNoteOv();
  buildReleaseNotes();
  function latestNoteVersion() {
    return RELEASE_NOTES.length ? RELEASE_NOTES[0].v : "";
  }
  function likeKeyFor(n) {
    return n._key || "v" + String(n.v).replace(/[^a-zA-Z0-9]/g, "_");
  }
  function toggleNoteLike(n) {
    var key = likeKeyFor(n);
    if (rateLimited("like_" + key, 600) || !writeBurstOk(30, 10000)) return;
    var lk = "ptLike_" + key;
    var liked = false;
    try {
      liked = localStorage.getItem(lk) === "1";
    } catch (e) {}
    var delta = liked ? -1 : 1;
    try {
      localStorage.setItem(lk, liked ? "0" : "1");
    } catch (e) {}
    noteLikes[key] = Math.max(0, (noteLikes[key] || 0) + delta);
    updateLikeCounts();
    if (likesRef) {
      likesRef.child(key).transaction(function (cur) {
        return Math.max(0, (cur || 0) + delta);
      });
    }
  }
  function updateLikeCounts() {
    var host = document.getElementById("infoList");
    if (!host) return;
    var btns = host.querySelectorAll(".noteLike");
    Array.prototype.forEach.call(btns, function (btn) {
      var key = btn.dataset.lkey;
      if (!key) return;
      var cnt = (noteLikes && noteLikes[key]) || 0;
      var nEl = btn.querySelector(".lkN");
      if (nEl) nEl.textContent = cnt;
      var liked = false;
      try {
        liked = localStorage.getItem("ptLike_" + key) === "1";
      } catch (e) {}
      btn.classList.toggle("liked", liked);
    });
  }
  function renderInfoList() {
    var host = document.getElementById("infoList");
    if (!host) return;
    host.innerHTML = "";
    RELEASE_NOTES.forEach(function (n) {
      var item = document.createElement("div");
      item.className = "infoItem";
      var head = document.createElement("div");
      head.className = "iv";
      var b = document.createElement("b");
      b.textContent = "Versi " + n.v;
      var s = document.createElement("span");
      s.textContent = n.d;
      head.appendChild(b);
      head.appendChild(s);
      var likeWrap = document.createElement("button");
      likeWrap.type = "button";
      likeWrap.className = "noteLike";
      var _lkey = likeKeyFor(n);
      var _liked = false;
      try {
        _liked = localStorage.getItem("ptLike_" + _lkey) === "1";
      } catch (e) {}
      if (_liked) likeWrap.classList.add("liked");
      var _cnt = (noteLikes && noteLikes[_lkey]) || 0;
      likeWrap.dataset.lkey = _lkey;
      likeWrap.innerHTML =
        '<span class="lottieIco lkIco" data-anim="like"></span><span class="lkN">' +
        _cnt +
        "</span>";
      likeWrap.onclick = function () {
        toggleNoteLike(n);
      };
      head.appendChild(likeWrap);
      if (n._edited) {
        var em = document.createElement("span");
        em.className = "noteEditedTag";
        em.textContent = "diedit";
        head.appendChild(em);
      }
      if (isAdmin && n._key) {
        var act = document.createElement("span");
        act.className = "noteActs";
        var ed = document.createElement("button");
        ed.type = "button";
        ed.className = "noteAct";
        ed.textContent = "Edit";
        ed.onclick = function () {
          openNoteModal(n);
        };
        var dl = document.createElement("button");
        dl.type = "button";
        dl.className = "noteAct danger";
        dl.textContent = "Hapus";
        dl.onclick = function () {
          if (confirm("Hapus catatan versi " + n.v + "?")) deleteNote(n._key);
        };
        act.appendChild(ed);
        act.appendChild(dl);
        head.appendChild(act);
      }
      var ul = document.createElement("ul");
      n.items.forEach(function (t) {
        var li = document.createElement("li");
        li.textContent = t;
        ul.appendChild(li);
      });
      item.appendChild(head);
      item.appendChild(ul);
      host.appendChild(item);
    });
    initLottieIcons();
  }
  function updateNoteDot() {
    var dot = document.getElementById("menuDot");
    if (!dot) return;
    var seen = "";
    try {
      seen = localStorage.getItem("ptSeenNote") || "";
    } catch (e) {}
    if (seen !== latestNoteVersion()) dot.classList.add("on");
    else dot.classList.remove("on");
  }
  function markNotesSeen() {
    try {
      localStorage.setItem("ptSeenNote", latestNoteVersion());
    } catch (e) {}
    var dot = document.getElementById("menuDot");
    if (dot) dot.classList.remove("on");
  }
  function openInfo() {
    closeMenu();
    buildReleaseNotes();
    renderInfoList();
    syncRestoreBtn();
    markNotesSeen();
    document.getElementById("infoModal").classList.add("open");
  }
  function closeInfo() {
    document.getElementById("infoModal").classList.remove("open");
  }
  function izinSelectedWeeks() {
    var out = [];
    document.querySelectorAll("#izinWeeks .weekChip.on").forEach(function (b) {
      out.push(b.getAttribute("data-week"));
    });
    return out;
  }
  function findRosterByName(name) {
    var q = (name || "").trim().toLowerCase();
    var found = null;
    sched.roster.forEach(function (p) {
      if ((p.name || "").trim().toLowerCase() === q) found = p;
    });
    return found;
  }
  function mergeIzinWeeks(target, weeks) {
    weeks.forEach(function (wStr) {
      var wk = parseInt(wStr, 10);
      if (!wk) return;
      if (target.indexOf(wk) < 0) target.push(wk);
    });
    target.sort(function (a, b) {
      return a - b;
    });
  }
  // Simpan izin member langsung ke matriks penjadwalan (Firebase
  // pujianYouth/schedule4). Membaca data terbaru lebih dulu agar tidak
  // menimpa jadwal/roster admin.
  function saveIzinToCloud(nama, weeks, cb) {
    var online =
      cloudReady &&
      typeof firebase !== "undefined" &&
      firebase.apps &&
      firebase.apps.length;
    if (online) {
      var ref = firebase.database().ref("pujianYouth/schedule4");
      ref
        .once("value")
        .then(function (snap) {
          var cloud = snap.val();
          if (!cloud || !cloud.roster) cloud = sched;
          if (!cloud.izin) cloud.izin = {};
          var q = (nama || "").trim().toLowerCase();
          var person = null;
          cloud.roster.forEach(function (p) {
            if ((p.name || "").trim().toLowerCase() === q) person = p;
          });
          if (!person) {
            person = {
              id: "p-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
              name: nama,
              roles: [],
            };
            cloud.roster.push(person);
          }
          if (!cloud.izin[person.id]) cloud.izin[person.id] = [];
          mergeIzinWeeks(cloud.izin[person.id], weeks);
          return ref.set(cloud);
        })
        .then(function () {
          cb(true);
        })
        .catch(function () {
          cb(false);
        });
    } else {
      // Offline: simpan ke matriks lokal, akan tersinkron saat online.
      try {
        var person2 = findRosterByName(nama);
        if (!person2) {
          person2 = {
            id: "p-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
            name: nama,
            roles: [],
          };
          sched.roster.push(person2);
        }
        if (!sched.izin[person2.id]) sched.izin[person2.id] = [];
        mergeIzinWeeks(sched.izin[person2.id], weeks);
        localStorage.setItem(SCHED_KEY, JSON.stringify(sched));
      } catch (e) {}
      cb(false);
    }
  }
  function submitIzin() {
    var nama = (document.getElementById("izinNama").value || "").trim();
    var weeks = izinSelectedWeeks();
    var ket = (document.getElementById("izinKet").value || "").trim();
    var st = document.getElementById("izinStatus");
    if (!izinFormOpen && !isAdmin) {
      st.style.color = "var(--red)";
      st.textContent = "Form izin sedang ditutup oleh admin.";
      return;
    }
    if (!nama) {
      st.style.color = "var(--red)";
      st.textContent = "Isi nama dulu ya.";
      return;
    }
    if (weeks.length === 0) {
      st.style.color = "var(--red)";
      st.textContent = "Pilih minggu ke berapa kamu izin.";
      return;
    }
    var btn = document.getElementById("sendIzinBtn");
    btn.disabled = true;
    st.style.color = "var(--muted)";
    st.textContent = "Menyimpan izin ke jadwal...";
    initScheduleCloud();
    var resetForm = function () {
      document.getElementById("izinNama").value = "";
      document.getElementById("izinKet").value = "";
      document
        .querySelectorAll("#izinWeeks .weekChip.on")
        .forEach(function (b) {
          b.classList.remove("on");
        });
    };
    saveIzinToCloud(nama, weeks, function () {
      var finish = function () {
        st.style.color = "var(--green)";
        st.textContent =
          "Terima kasih! Izin kamu sudah tercatat di matriks jadwal.";
        resetForm();
        btn.disabled = false;
        setTimeout(closeIzin, 1500);
      };
      // Opsional: kirim juga ke Google Sheet sebagai log bila dikonfigurasi.
      if (!IZIN_ENDPOINT) {
        finish();
        return;
      }
      var payload = {
        nama: nama,
        minggu: weeks.join(", "),
        keterangan: ket,
        waktu: new Date().toLocaleString("id-ID"),
      };
      fetch(IZIN_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      })
        .then(finish)
        .catch(finish);
    });
  }
  function ytId(url) {
    if (!url) return "";
    var s = String(url).trim();
    var marks = [
      "watch?v=",
      "youtu.be/",
      "/shorts/",
      "/embed/",
      "/live/",
      "v=",
    ];
    for (var i = 0; i < marks.length; i++) {
      var k = s.indexOf(marks[i]);
      if (k < 0) continue;
      var rest = s.slice(k + marks[i].length),
        id = "";
      for (var j = 0; j < rest.length; j++) {
        var c = rest[j];
        if (
          (c >= "A" && c <= "Z") ||
          (c >= "a" && c <= "z") ||
          (c >= "0" && c <= "9") ||
          c === "_" ||
          c === "-"
        ) {
          id += c;
        } else {
          break;
        }
      }
      if (id.length >= 6) return id;
    }
    if (s.length === 11) {
      var ok = true;
      for (var m = 0; m < s.length; m++) {
        var cc = s[m];
        if (!(
          (cc >= "A" && cc <= "Z") ||
          (cc >= "a" && cc <= "z") ||
          (cc >= "0" && cc <= "9") ||
          cc === "_" ||
          cc === "-"
        )) {
          ok = false;
          break;
        }
      }
      if (ok) return s;
    }
    return "";
  }
  function openYouTube() {
    var song = currentSong();
    if (!song) return;
    var id = ytId(song.youtube);
    if (id) {
      loadYtApi();
      if (ytReady && window.YT && window.YT.Player) {
        startYtPlayer(id);
      } else {
        ytPending = id;
      }
    } else {
      var q = encodeURIComponent(
        (song.title || "") + " " + (song.source || ""),
      );
      window.open(
        "https://www.youtube.com/results?search_query=" + q,
        "_blank",
      );
    }
  }
  var ytPlayer = null,
    ytPoll = 0,
    ytReady = false,
    ytPending = null;
  function loadYtApi() {
    if (window.YT && window.YT.Player) {
      ytReady = true;
      return;
    }
    if (document.getElementById("ytApiScript")) return;
    var t = document.createElement("script");
    t.id = "ytApiScript";
    t.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(t);
  }
  window.onYouTubeIframeAPIReady = function () {
    ytReady = true;
    if (ytPending) {
      var v = ytPending;
      ytPending = null;
      startYtPlayer(v);
    }
  };
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60),
      r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }
  function startYtPlayer(id) {
    showYtBar();
    if (ytPlayer && ytPlayer.loadVideoById) {
      ytPlayer.loadVideoById(id);
      startYtPoll();
      return;
    }
    var host = document.getElementById("ytHost");
    host.innerHTML = '<div id="ytPlayerEl"></div>';
    ytPlayer = new YT.Player("ytPlayerEl", {
      videoId: id,
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        rel: 0,
        controls: 0,
        modestbranding: 1,
      },
      events: {
        onReady: function (e) {
          try {
            e.target.playVideo();
          } catch (_) {}
          startYtPoll();
        },
        onStateChange: onYtState,
      },
    });
  }
  function onYtState(e) {
    var pp = document.getElementById("ytPP");
    if (!pp) return;
    if (e.data === YT.PlayerState.PLAYING) {
      pp.innerHTML = "&#10074;&#10074;";
      startYtPoll();
    } else {
      pp.innerHTML = "&#9654;";
    }
  }
  function startYtPoll() {
    if (ytPoll) return;
    ytPoll = setInterval(updateYtBar, 250);
  }
  function stopYtPoll() {
    if (ytPoll) {
      clearInterval(ytPoll);
      ytPoll = 0;
    }
  }
  function updateYtBar() {
    if (!ytPlayer || !ytPlayer.getDuration) return;
    var d = ytPlayer.getDuration() || 0,
      c = ytPlayer.getCurrentTime() || 0;
    var pct = d > 0 ? Math.min(100, (c / d) * 100) : 0;
    var fill = document.getElementById("ytFill"),
      dot = document.getElementById("ytDot"),
      tm = document.getElementById("ytTime");
    if (fill) fill.style.width = pct + "%";
    if (dot) dot.style.left = pct + "%";
    if (tm) tm.textContent = fmtTime(c) + " / " + fmtTime(d);
  }
  function showYtBar() {
    var b = document.getElementById("ytBar");
    if (b) b.classList.add("open");
    var p = document.getElementById("ytPitch");
    if (p) p.classList.add("open");
  }
  function hideYtBar() {
    var b = document.getElementById("ytBar");
    if (b) b.classList.remove("open");
    var p = document.getElementById("ytPitch");
    if (p) p.classList.remove("open");
    try {
      ytRateSet(1);
    } catch (e) {}
  }
  function ytTogglePlay() {
    if (!ytPlayer || !ytPlayer.getPlayerState) return;
    if (ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  }
  function ytSeek(e) {
    if (!ytPlayer || !ytPlayer.getDuration) return;
    var tr = document.getElementById("ytTrack"),
      r = tr.getBoundingClientRect();
    var f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    ytPlayer.seekTo(f * (ytPlayer.getDuration() || 0), true);
    updateYtBar();
  }
  function stopYt() {
    stopYtPoll();
    if (ytPlayer && ytPlayer.stopVideo) {
      try {
        ytPlayer.stopVideo();
      } catch (_) {}
    }
    hideYtBar();
  }

  // --- Bank Lagu: lagu populer siap ditambahkan ---
  const songBank = [
    {
      title: "Bapa Yang Kekal",
      by: "Cover/asli: JPCC Worship",
      key: "C",
      link: "https://www.youtube.com/results?search_query=Bapa+Yang+Kekal+JPCC+Worship",
    },
    {
      title: "Kupilih Yesus",
      by: "Cover/asli: NDC Worship",
      key: "G",
      link: "https://www.youtube.com/results?search_query=Kupilih+Yesus+NDC+Worship",
    },
    {
      title: "Tak Terbatas",
      by: "Cover/asli: Symphony Worship",
      key: "D",
      link: "https://www.youtube.com/results?search_query=Tak+Terbatas+Symphony+Worship",
    },
    {
      title: "Kaulah Harapan",
      by: "Cover/asli: JPCC Worship",
      key: "A",
      link: "https://www.youtube.com/results?search_query=Kaulah+Harapan+JPCC+Worship",
    },
    {
      title: "Cinta Paling Berharga",
      by: "Cover/asli: True Worshippers",
      key: "G",
      link: "https://www.youtube.com/results?search_query=Cinta+Paling+Berharga+True+Worshippers",
    },
    {
      title: "Besar SetiaMu",
      by: "Cover/asli: Franky Sihombing",
      key: "D",
      link: "https://www.youtube.com/results?search_query=Besar+SetiaMu",
    },
    {
      title: "Mujizat Itu Nyata",
      by: "Cover/asli: NDC Worship",
      key: "E",
      link: "https://www.youtube.com/results?search_query=Mujizat+Itu+Nyata+NDC+Worship",
    },
    {
      title: "Seperti Yang Kau Ingini",
      by: "Cover/asli: Nikita",
      key: "F",
      link: "https://www.youtube.com/results?search_query=Seperti+Yang+Kau+Ingini",
    },
  ];
  function addFromBank(item) {
    const s = {
      id: "song-" + Date.now(),
      title: item.title,
      originalKey: item.key,
      source: item.by + " - " + item.link,
      link: item.link,
      youtube: "",
      lines: [
        "Intro :",
        "(isi chord di sini)",
        "Verse :",
        "(tulis chord lalu liriknya)",
      ],
    };
    songs.push(s);
    selectedSongId = s.id;
    selectedKey = s.originalKey;
    saveSongs();
    makeButtons();
    render();
    closeMenu();
    openEditor();
  }
  function renderBank() {
    const box = document.getElementById("songBank");
    if (!box) return;
    box.innerHTML = "";
    songBank.forEach((item) => {
      const row = document.createElement("div");
      row.className = "bankItem";
      const grip = document.createElement("span");
      grip.className = "bankGrip";
      grip.textContent = "☰";
      grip.title = "Tarik ke Daftar lagu";
      const info = document.createElement("div");
      info.className = "bankInfo";
      const b = document.createElement("b");
      b.textContent = item.title;
      const meta = document.createElement("span");
      meta.textContent = item.by + " • Nada " + item.key;
      const a = document.createElement("a");
      a.href = item.link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Buka referensi chord";
      info.appendChild(b);
      info.appendChild(meta);
      info.appendChild(a);
      const add = document.createElement("button");
      add.type = "button";
      add.className = "bankAdd";
      add.textContent = "Tambah";
      add.onclick = () => addFromBank(item);
      row.appendChild(grip);
      row.appendChild(info);
      row.appendChild(add);
      enableBankDrag(grip, item);
      box.appendChild(row);
    });
  }

  // --- Song Bank: pencarian, lompat lagu, dan halaman database ---
  function gotoSong(id) {
    if (selectedSongId !== id) stopYt();
    var s = songs.find(function (x) {
      return x.id === id;
    });
    if (!s) return;
    selectedSongId = id;
    selectedKey = s.originalKey;
    closeMenu();
    closeBankPage();
    closeEditor();
    render();
    var sh = document.getElementById("sheet");
    if (sh) sh.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function renderSongJump() {
    var sel = document.getElementById("songJump");
    if (!sel) return;
    sel.innerHTML = '<option value="">Pilih lagu…</option>';
    songs.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = (s.num || "") + ". " + s.title;
      sel.appendChild(o);
    });
    sel.value = "";
  }
  function renderSearch(q) {
    var box = document.getElementById("searchResults");
    if (!box) return;
    box.innerHTML = "";
    q = (q || "").trim().toLowerCase();
    if (!q) return;
    songs
      .filter(function (s) {
        return (s.title || "").toLowerCase().indexOf(q) >= 0;
      })
      .slice(0, 8)
      .forEach(function (s) {
        var it = document.createElement("div");
        it.className = "srItem";
        var b = document.createElement("b");
        b.textContent = (s.num || "") + ". " + s.title;
        var tag = document.createElement("span");
        tag.className = "srTag";
        tag.textContent = "Buka";
        it.appendChild(b);
        it.appendChild(tag);
        it.onclick = function () {
          gotoSong(s.id);
        };
        box.appendChild(it);
      });
    songBank
      .filter(function (item) {
        return (
          item.title.toLowerCase().indexOf(q) >= 0 &&
          !songs.find(function (s) {
            return (s.title || "").toLowerCase() === item.title.toLowerCase();
          })
        );
      })
      .slice(0, 6)
      .forEach(function (item) {
        var it = document.createElement("div");
        it.className = "srItem";
        var b = document.createElement("b");
        b.textContent = item.title;
        var tag = document.createElement("span");
        tag.className = "srTag";
        tag.textContent = "+ Tambah";
        it.appendChild(b);
        it.appendChild(tag);
        it.onclick = function () {
          addFromBank(item);
        };
        box.appendChild(it);
      });
  }
  // ===== Cari lagu online (iTunes + lyrics.ovh) — v48 =====
  var _olAudio = null,
    _olBtn = null;
  function openOnlineSearch() {
    closeMenu();
    var box = document.getElementById("onlineResults");
    if (box) box.innerHTML = "";
    var qi = document.getElementById("onlineQuery");
    if (qi) qi.value = "";
    var pg = document.getElementById("onlinePage");
    if (pg) pg.classList.add("open");
    if (qi)
      setTimeout(function () {
        qi.focus();
      }, 80);
  }
  function closeOnlineSearch() {
    if (_olAudio) {
      try {
        _olAudio.pause();
      } catch (e) {}
    }
    if (_olBtn) _olBtn.textContent = "▶";
    var pg = document.getElementById("onlinePage");
    if (pg) pg.classList.remove("open");
  }
  function itunesSearch(term, cb) {
    var url =
      "https://itunes.apple.com/search?media=music&entity=song&limit=24&term=" +
      encodeURIComponent(term);
    var done = false;
    function finish(results, err) {
      if (done) return;
      done = true;
      cb(results, err);
    }
    // 1) Coba CORS fetch dulu (iTunes kirim Access-Control-Allow-Origin: *)
    var ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var to = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, 8000);
    fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) {
        return r && r.ok ? r.json() : null;
      })
      .then(function (j) {
        clearTimeout(to);
        if (j && j.results) finish(j.results, null);
        else jsonp();
      })
      .catch(function () {
        clearTimeout(to);
        jsonp();
      });
    // 2) Fallback JSONP kalau fetch gagal/diblokir
    function jsonp() {
      if (done) return;
      var cbName = "__itunesCb" + Date.now();
      var sc = document.createElement("script");
      var timer = setTimeout(function () {
        cleanup();
        finish(null, "timeout");
      }, 10000);
      function cleanup() {
        clearTimeout(timer);
        try {
          delete window[cbName];
        } catch (e) {
          window[cbName] = undefined;
        }
        if (sc.parentNode) sc.parentNode.removeChild(sc);
      }
      window[cbName] = function (data) {
        cleanup();
        finish(data && data.results ? data.results : [], null);
      };
      sc.onerror = function () {
        cleanup();
        finish(null, "network");
      };
      sc.src = url + "&callback=" + cbName;
      document.body.appendChild(sc);
    }
  }
  function fetchLyrics(artist, title) {
    return new Promise(function (resolve) {
      var url =
        "https://api.lyrics.ovh/v1/" +
        encodeURIComponent(artist) +
        "/" +
        encodeURIComponent(title);
      var ctrl =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      var to = setTimeout(function () {
        if (ctrl) ctrl.abort();
        resolve(null);
      }, 8000);
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) {
          return r && r.ok ? r.json() : null;
        })
        .then(function (j) {
          clearTimeout(to);
          resolve(j && j.lyrics ? j.lyrics : null);
        })
        .catch(function () {
          clearTimeout(to);
          resolve(null);
        });
    });
  }
  function olPlay(url, btn) {
    if (!url) {
      toast("Pratinjau tidak tersedia untuk lagu ini.", "info");
      return;
    }
    if (_olAudio && _olBtn === btn) {
      if (_olAudio.paused) {
        _olAudio.play();
        btn.textContent = "⏸";
      } else {
        _olAudio.pause();
        btn.textContent = "▶";
      }
      return;
    }
    if (_olAudio) {
      try {
        _olAudio.pause();
      } catch (e) {}
      if (_olBtn) _olBtn.textContent = "▶";
    }
    _olAudio = new Audio(url);
    _olBtn = btn;
    _olAudio.onended = function () {
      btn.textContent = "▶";
    };
    var p = _olAudio.play();
    if (p && p.then)
      p.then(function () {
        btn.textContent = "⏸";
      }).catch(function () {
        toast("Gagal memutar pratinjau.", "error");
      });
    else btn.textContent = "⏸";
  }
  function olAddToBank(item, btn) {
    var title =
      (item.trackName || "Lagu") +
      (item.artistName ? " (" + item.artistName + ")" : "");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Menambahkan...";
    }
    var master = {
      bankId: "bank-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      title: title,
      num: "",
      originalKey: "C",
      source:
        "iTunes: " +
        (item.artistName || "") +
        (item.collectionName ? " — " + item.collectionName : ""),
      youtube: "",
      lines: ["(Lirik sedang diambil...)"],
      cat: "other",
    };
    bankSongs.push(master);
    saveBank();
    fetchLyrics(item.artistName || "", item.trackName || "").then(
      function (lyr) {
        var i = bankSongs.findIndex(function (x) {
          return x && x.bankId === master.bankId;
        });
        if (i < 0) return;
        if (lyr) {
          var lines = lyr.split(/\r?\n/).map(function (x) {
            return x.replace(/\s+$/, "");
          });
          while (lines.length && !lines[0].trim()) lines.shift();
          while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
          bankSongs[i].lines = lines.length
            ? lines
            : ["(Lirik kosong — isi manual)"];
        } else {
          bankSongs[i].lines = [
            "Bait :",
            "(Lirik tidak ditemukan otomatis — isi manual di sini)",
          ];
        }
        saveBank();
        try {
          backupMaybe("bank");
        } catch (e) {}
        refreshLibrary();
        toast(
          "'" + title + "' ditambahkan ke Bank (folder Lainnya).",
          "success",
        );
        if (btn) {
          btn.textContent = "Ditambahkan";
        }
      },
    );
  }
  function renderOnlineResults(list) {
    var box = document.getElementById("onlineResults");
    if (!box) return;
    box.innerHTML = "";
    if (list === null) {
      var e0 = document.createElement("p");
      e0.className = "small bankEmpty";
      e0.textContent =
        "Gagal terhubung ke sumber pencarian. Periksa koneksi lalu coba lagi.";
      box.appendChild(e0);
      return;
    }
    if (!list.length) {
      var e1 = document.createElement("p");
      e1.className = "small bankEmpty";
      e1.textContent = "Tidak ada hasil.";
      box.appendChild(e1);
      return;
    }
    list.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "olCard";
      if (item.artworkUrl100) {
        var img = document.createElement("img");
        img.className = "olArt";
        img.src = item.artworkUrl100;
        img.alt = "";
        img.loading = "lazy";
        card.appendChild(img);
      }
      var info = document.createElement("div");
      info.className = "olInfo scInfo";
      var t = document.createElement("b");
      t.textContent = item.trackName || "(Tanpa judul)";
      var m = document.createElement("span");
      m.textContent =
        (item.artistName || "") +
        (item.collectionName ? " • " + item.collectionName : "");
      info.appendChild(t);
      info.appendChild(m);
      var btns = document.createElement("div");
      btns.className = "scBtns";
      var play = document.createElement("button");
      play.type = "button";
      play.className = "scBtn";
      play.textContent = "▶";
      play.onclick = function () {
        olPlay(item.previewUrl, play);
      };
      var add = document.createElement("button");
      add.type = "button";
      add.className = "scBtn primary";
      add.textContent = "+ Bank";
      add.onclick = function () {
        olAddToBank(item, add);
      };
      btns.appendChild(play);
      btns.appendChild(add);
      card.appendChild(info);
      card.appendChild(btns);
      box.appendChild(card);
    });
  }
  function onlineSearchGo() {
    var qi = document.getElementById("onlineQuery");
    if (!qi) return;
    var term = (qi.value || "").trim();
    var box = document.getElementById("onlineResults");
    if (!term) {
      if (box) box.innerHTML = "";
      return;
    }
    if (box) box.innerHTML = "<p class='small bankEmpty'>Mencari...</p>";
    itunesSearch(term, function (results, err) {
      if (err) {
        renderOnlineResults(null);
        return;
      }
      renderOnlineResults(results);
    });
  }
  function addSongFromBank() {
    registerNewBankSong();
  }
  function openBankPage() {
    closeMenu();
    currentBankFolder = null;
    var si = document.getElementById("bankPageSearch");
    if (si) si.value = "";
    renderBankPage("");
    document.getElementById("bankPage").classList.add("open");
  }
  function closeBankPage() {
    var pg = document.getElementById("bankPage");
    if (pg) pg.classList.remove("open");
  }
  // ===== Bank lagu berbentuk folder (v47) =====
  var BANK_CATS = [
    { key: "worship", label: "Worship", img: "./img/worship.jpg" },
    { key: "praise", label: "Praise", img: "./img/praise.jpg" },
    { key: "other", label: "Lainnya", img: "" },
  ];
  var currentBankFolder = null;
  function bankCatOf(s) {
    var c = s && s.cat;
    return c === "worship" || c === "praise" ? c : "other";
  }
  function bankCatLabel(key) {
    for (var i = 0; i < BANK_CATS.length; i++)
      if (BANK_CATS[i].key === key) return BANK_CATS[i].label;
    return "Lainnya";
  }
  function setBankCat(master, cat) {
    if (!isAdmin) {
      toast("Hanya admin yang bisa memindahkan folder.", "error");
      return;
    }
    var i = -1;
    for (var k = 0; k < bankSongs.length; k++)
      if (bankSongs[k] && bankSongs[k].bankId === master.bankId) {
        i = k;
        break;
      }
    if (i < 0) return;
    bankSongs[i].cat = cat === "worship" || cat === "praise" ? cat : "other";
    master.cat = bankSongs[i].cat;
    saveBank();
    try {
      backupMaybe("bank");
    } catch (e) {}
    var si = document.getElementById("bankPageSearch");
    renderBankPage(si ? si.value : "");
    toast(
      "Dipindahkan ke folder " + bankCatLabel(bankSongs[i].cat) + ".",
      "success",
    );
  }
  var SEC_ALIGN_KEY = "pnwSecAlign";
  function applySecAlign(v) {
    var b = document.body;
    b.classList.remove("secAlignLeft", "secAlignCenter", "secAlignRight");
    b.classList.add(
      v === "center"
        ? "secAlignCenter"
        : v === "right"
          ? "secAlignRight"
          : "secAlignLeft",
    );
    var map = { left: "secAlignL", center: "secAlignC", right: "secAlignR" };
    ["secAlignL", "secAlignC", "secAlignR"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle("isOn", id === map[v]);
    });
  }
  function setSecAlign(v) {
    try {
      localStorage.setItem(SEC_ALIGN_KEY, v);
    } catch (e) {}
    applySecAlign(v);
  }
  function initSecAlign() {
    var v = "left";
    try {
      v = localStorage.getItem(SEC_ALIGN_KEY) || "left";
    } catch (e) {}
    applySecAlign(v);
    var L = document.getElementById("secAlignL");
    var C = document.getElementById("secAlignC");
    var R = document.getElementById("secAlignR");
    if (L)
      L.onclick = function () {
        setSecAlign("left");
      };
    if (C)
      C.onclick = function () {
        setSecAlign("center");
      };
    if (R)
      R.onclick = function () {
        setSecAlign("right");
      };
  }
  var bankMoveMode = false;
  var bankMoveSel = {};
  function bankRerender() {
    var si = document.getElementById("bankPageSearch");
    renderBankPage(si ? si.value : "");
  }
  function moveSelectedBank(cat) {
    if (!isAdmin) {
      toast("Hanya admin yang bisa memindahkan folder.", "error");
      return;
    }
    var ids = Object.keys(bankMoveSel).filter(function (k) {
      return bankMoveSel[k];
    });
    if (!ids.length) {
      toast("Pilih dulu lagu yang mau dipindahkan.", "info");
      return;
    }
    if (
      !confirm(
        "Pindahkan " +
          ids.length +
          " lagu ke folder " +
          bankCatLabel(cat) +
          "?\n\nLagu TIDAK dihapus, hanya berpindah folder.",
      )
    )
      return;
    try {
      backupForce("sebelum pindah folder");
    } catch (e) {}
    var n = 0;
    for (var k = 0; k < bankSongs.length; k++) {
      var b = bankSongs[k];
      if (!b || ids.indexOf(String(b.bankId)) < 0) continue;
      b.cat = cat === "worship" || cat === "praise" ? cat : "other";
      n++;
    }
    if (!n) return;
    saveBank();
    try {
      backupMaybe("bank");
    } catch (e) {}
    bankMoveSel = {};
    bankMoveMode = false;
    bankRerender();
    toast(
      n + " lagu dipindahkan ke folder " + bankCatLabel(cat) + ".",
      "success",
    );
  }
  function buildBankMoveBar() {
    var bar = document.createElement("div");
    bar.className = "bankMoveBar";
    var t = document.createElement("button");
    t.type = "button";
    t.className = "bmBtn" + (bankMoveMode ? " isOn" : "");
    t.textContent = bankMoveMode ? "Batal" : "Pindahkan lagu";
    t.onclick = function () {
      bankMoveMode = !bankMoveMode;
      bankMoveSel = {};
      bankRerender();
    };
    bar.appendChild(t);
    if (bankMoveMode) {
      var lb = document.createElement("span");
      lb.className = "bmLbl";
      lb.textContent = "Pindahkan ke";
      bar.appendChild(lb);
      BANK_CATS.forEach(function (c) {
        if (c.key === currentBankFolder) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "bmBtn go";
        b.textContent = c.label;
        b.onclick = function () {
          moveSelectedBank(c.key);
        };
        bar.appendChild(b);
      });
    }
    return bar;
  }
  function buildBankCard(s) {
    var setSong = songs.find(function (x) {
      return x.bankId === s.bankId;
    });
    var inSet = !!setSong;
    var card = document.createElement("div");
    card.className = "songCard";
    if (bankMoveMode && isAdmin) {
      card.classList.add("selectable");
      var chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "bmChk";
      chk.checked = !!bankMoveSel[s.bankId];
      chk.onchange = function () {
        bankMoveSel[s.bankId] = chk.checked;
      };
      card.appendChild(chk);
    }
    var info = document.createElement("div");
    info.className = "scInfo";
    var t = document.createElement("b");
    t.textContent = s.title;
    if (inSet) {
      var tag = document.createElement("span");
      tag.className = "inSet";
      tag.textContent = " · di daftar";
      t.appendChild(tag);
    }
    var meta = document.createElement("span");
    meta.textContent =
      "Nada dasar " + s.originalKey + (s.source ? " • " + s.source : "");
    info.appendChild(t);
    info.appendChild(meta);
    var btns = document.createElement("div");
    btns.className = "scNav";
    var pull = document.createElement("button");
    pull.type = "button";
    pull.className = "scBtn primary";
    pull.textContent = inSet ? "Buka" : "Tarik";
    pull.onclick = function () {
      if (inSet) gotoSong(setSong.id);
      else pullFromBank(s);
    };
    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "scBtn";
    edit.textContent = "Ubah";
    edit.onclick = function () {
      editBankSong(s);
    };
    btns.appendChild(pull);
    btns.appendChild(edit);
    if (isAdmin) {
      var sel = document.createElement("select");
      sel.className = "scBtn bankCatSel";
      BANK_CATS.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c.key;
        o.textContent = c.label;
        if (bankCatOf(s) === c.key) o.selected = true;
        sel.appendChild(o);
      });
      sel.onchange = function () {
        setBankCat(s, sel.value);
      };
      btns.appendChild(sel);
      var del = document.createElement("button");
      del.type = "button";
      del.className = "scBtn danger";
      del.textContent = "Hapus";
      del.onclick = function () {
        removeFromBank(s);
      };
      btns.appendChild(del);
    }
    card.appendChild(info);
    card.appendChild(btns);
    return card;
  }
  function buildFolderCard(c) {
    var n = bankSongs.filter(function (s) {
      return bankCatOf(s) === c.key;
    }).length;
    var f = document.createElement("button");
    f.type = "button";
    f.className = "folderCard" + (c.img ? "" : " noPhoto");
    if (c.img) {
      var im = document.createElement("img");
      im.className = "fcImg";
      im.src = c.img;
      im.alt = "";
      im.loading = "lazy";
      im.decoding = "async";
      f.appendChild(im);
    }
    var sh = document.createElement("span");
    sh.className = "fcShade";
    f.appendChild(sh);
    var meta = document.createElement("span");
    meta.className = "fcMeta";
    var nm = document.createElement("b");
    nm.className = "fcName";
    nm.textContent = c.label;
    var ct = document.createElement("span");
    ct.className = "fcCount";
    ct.textContent = n + " lagu";
    meta.appendChild(nm);
    meta.appendChild(ct);
    f.appendChild(meta);
    f.addEventListener(
      "touchstart",
      function () {
        f.classList.add("isOn");
      },
      { passive: true },
    );
    f.addEventListener("touchend", function () {
      setTimeout(function () {
        f.classList.remove("isOn");
      }, 450);
    });
    f.onclick = function () {
      currentBankFolder = c.key;
      renderBankPage("");
    };
    return f;
  }
  function renderBankEmpty(box, msg) {
    var e = document.createElement("p");
    e.className = "small bankEmpty";
    e.textContent = msg;
    box.appendChild(e);
  }
  function renderBankCrumb(box, label, isSearch) {
    var bar = document.createElement("div");
    bar.className = "bankCrumb";
    if (isSearch) {
      var hint = document.createElement("span");
      hint.className = "small";
      hint.textContent = "Hasil pencarian di semua folder";
      bar.appendChild(hint);
    } else {
      var back = document.createElement("button");
      back.type = "button";
      back.className = "scBtn";
      back.textContent = "← Semua folder";
      back.onclick = function () {
        currentBankFolder = null;
        bankMoveMode = false;
        bankMoveSel = {};
        renderBankPage("");
      };
      bar.appendChild(back);
      var lb = document.createElement("b");
      lb.textContent = " " + label;
      bar.appendChild(lb);
    }
    box.appendChild(bar);
  }
  function renderBankPage(q) {
    var box = document.getElementById("bankPageList");
    if (!box) return;
    box.innerHTML = "";
    q = (q || "").trim().toLowerCase();
    var emptyMsg =
      "Bank lagu masih kosong. Tekan tombol Daftarkan lagu untuk menambah.";
    if (q) {
      var results = bankSongs.filter(function (s) {
        return s && (s.title || "").toLowerCase().indexOf(q) >= 0;
      });
      renderBankCrumb(box, null, true);
      if (!results.length) {
        renderBankEmpty(
          box,
          bankSongs.length ? "Tidak ada lagu yang cocok." : emptyMsg,
        );
        return;
      }
      results.forEach(function (s) {
        box.appendChild(buildBankCard(s));
      });
      if (window.PNWMotion) window.PNWMotion.stagger(box);
      return;
    }
    if (!currentBankFolder) {
      if (!bankSongs.length) {
        renderBankEmpty(box, emptyMsg);
        return;
      }
      BANK_CATS.forEach(function (c) {
        box.appendChild(buildFolderCard(c));
      });
      if (window.PNWMotion) window.PNWMotion.stagger(box);
      return;
    }
    renderBankCrumb(box, bankCatLabel(currentBankFolder), false);
    if (isAdmin) box.appendChild(buildBankMoveBar());
    var inFolder = bankSongs.filter(function (s) {
      return bankCatOf(s) === currentBankFolder;
    });
    if (!inFolder.length) {
      renderBankEmpty(box, "Folder ini masih kosong.");
      return;
    }
    inFolder.forEach(function (s) {
      box.appendChild(buildBankCard(s));
    });
    if (window.PNWMotion) window.PNWMotion.stagger(box);
  }
  function pullFromBank(master) {
    if (
      songs.find(function (x) {
        return x.bankId === master.bankId;
      })
    ) {
      toast("Lagu sudah ada di daftar.", "info");
      return;
    }
    var s = {
      id: "song-" + Date.now(),
      bankId: master.bankId,
      num: master.num || "",
      title: master.title,
      originalKey: master.originalKey,
      source: master.source || "",
      youtube: master.youtube || "",
      lines: (master.lines || []).slice(),
    };
    songs.push(s);
    selectedSongId = s.id;
    selectedKey = s.originalKey;
    saveSongs();
    makeButtons();
    render();
    refreshLibrary();
    toast("'" + master.title + "' ditarik ke daftar lagu.", "success");
  }
  function editBankSong(master) {
    var ex = songs.find(function (x) {
      return x.bankId === master.bankId;
    });
    closeBankPage();
    if (ex) {
      gotoSong(ex.id);
      setTimeout(openEditor, 90);
    } else {
      pullFromBank(master);
      setTimeout(openEditor, 140);
    }
  }
  function removeFromBank(master) {
    if (!isAdmin) {
      toast("Hanya admin yang bisa menghapus dari bank.", "error");
      return;
    }
    if (
      !confirm(
        "Hapus '" + master.title + "' dari BANK lagu? Tindakan ini permanen.",
      )
    )
      return;
    bankSongs = bankSongs.filter(function (x) {
      return x.bankId !== master.bankId;
    });
    saveBank();
    var si = document.getElementById("bankPageSearch");
    renderBankPage(si ? si.value : "");
    toast("Lagu dihapus dari bank.", "info");
  }
  function registerNewBankSong() {
    var master = {
      bankId: "bank-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      title: "Lagu Baru",
      num: "",
      originalKey: "C",
      source: "",
      youtube: "",
      lines: [
        "Intro :",
        "[C] [G] [Am] [F]",
        "Bait :",
        "[C]Tulis lirik di sini, [G]ganti chord sebelum suku kata",
        "Reff :",
        "[F]Tulis lirik [G]reff di [C]sini",
      ],
    };
    bankSongs.push(master);
    saveBank();
    toast("Lagu baru terdaftar di bank.", "success");
    pullFromBank(master);
    setTimeout(openEditor, 140);
    closeBankPage();
  }
  /* ================= v62: semitone + rekaman ================= */
  var SEMI_MAP = {
    C: 0,
    "B#": 0,
    "C#": 1,
    Db: 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    Fb: 4,
    "E#": 5,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
    Cb: 11,
  };
  // v63: kenali penolakan izin Firebase supaya pesannya jujur
  function fbDenied(err) {
    var s = "";
    try {
      s = ((err && (err.code || err.message)) || String(err)).toLowerCase();
    } catch (e) {}
    return s.indexOf("permission") >= 0 || s.indexOf("denied") >= 0;
  }
  function semiOf(k) {
    var s = String(k == null ? "" : k).trim();
    if (SEMI_MAP[s] != null) return SEMI_MAP[s];
    var m = s.match(/^([A-Ga-g])([#b]?)/);
    if (!m) return 0;
    var key = m[1].toUpperCase() + (m[2] || "");
    return SEMI_MAP[key] != null ? SEMI_MAP[key] : 0;
  }
  function v62Song() {
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].id === selectedSongId) return songs[i];
    }
    return null;
  }
  function updateSemiUi(target, orig) {
    var el = document.getElementById("semiVal");
    if (!el) return;
    var d = (((semiOf(target) - semiOf(orig)) % 12) + 12) % 12;
    if (d > 6) d -= 12;
    el.classList.remove("up", "down");
    if (d > 0) {
      el.textContent = "+" + d;
      el.classList.add("up");
    } else if (d < 0) {
      el.textContent = String(d);
      el.classList.add("down");
    } else {
      el.textContent = "0 asli";
    }
    var rs = document.getElementById("semiReset");
    if (rs) rs.disabled = d === 0;
  }
  function semiShift(step) {
    var song = v62Song();
    if (!song) {
      toast("Pilih lagu dulu.", "info");
      return;
    }
    var cur = selectedKey || song.originalKey || "C";
    selectedKey = keyList[(((semiOf(cur) + step) % 12) + 12) % 12];
    render();
    updateSemiUi(selectedKey, song.originalKey);
    var el = document.getElementById("semiVal");
    if (el) {
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  }
  function semiReset() {
    var song = v62Song();
    if (!song) return;
    selectedKey = song.originalKey || "C";
    render();
    updateSemiUi(selectedKey, song.originalKey);
  }
  // --- v63: nada acuan (pitch pipe) lewat Web Audio ---
  var __ac = null;
  function playRefTone(key) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        toast("Peramban ini tidak mendukung nada acuan.", "error");
        return;
      }
      if (!__ac) __ac = new AC();
      if (__ac.state === "suspended") __ac.resume();
      var base = 261.63 * Math.pow(2, semiOf(key) / 12);
      var t0 = __ac.currentTime;
      [base, base * 2].forEach(function (f, i) {
        var o = __ac.createOscillator();
        var g = __ac.createGain();
        o.type = i ? "sine" : "triangle";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(i ? 0.06 : 0.16, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
        o.connect(g);
        g.connect(__ac.destination);
        o.start(t0);
        o.stop(t0 + 1.6);
      });
    } catch (e) {
      toast("Nada acuan gagal dibunyikan.", "error");
    }
  }
  function semiToneRef() {
    var song = v62Song();
    if (!song) {
      toast("Pilih lagu dulu.", "info");
      return;
    }
    var k = selectedKey || song.originalKey || "C";
    playRefTone(k);
    toast("Nada acuan: " + k, "info", 1800);
  }

  // --- v63: kecepatan pemutar YouTube ---
  var YT_RATES = [0.5, 0.75, 1, 1.25, 1.5];
  var __ytRate = 1;
  function ytRateSet(r) {
    __ytRate = r;
    var el = document.getElementById("ytRateVal");
    if (el) el.textContent = String(r) + "\u00d7";
    try {
      if (ytPlayer && ytPlayer.setPlaybackRate) {
        ytPlayer.setPlaybackRate(r);
      }
    } catch (e) {}
  }
  function ytRateStep(d) {
    var i = YT_RATES.indexOf(__ytRate);
    if (i < 0) i = 2;
    i = Math.min(YT_RATES.length - 1, Math.max(0, i + d));
    ytRateSet(YT_RATES[i]);
  }

  function openRecorderForCurrent() {
    if (!window.PNWRec) {
      toast("Fitur rekaman belum siap.", "error");
      return;
    }
    var song = v62Song();
    if (!song) {
      toast("Pilih lagu dulu untuk menyimpan rekaman.", "info");
      return;
    }
    window.PNWRec.open(song.id, song.title);
  }
  var __v62Ready = false;
  function initV62() {
    if (__v62Ready) return;
    __v62Ready = true;
    window.__pnwSemiUi = updateSemiUi;
    window.pnwToast = function (m, t, ms) {
      try {
        toast(m, t, ms);
      } catch (e) {}
    };
    var up = document.getElementById("semiUp");
    var dn = document.getElementById("semiDown");
    var rs = document.getElementById("semiReset");
    var rb = document.getElementById("recBtn");
    if (up)
      up.onclick = function () {
        semiShift(1);
      };
    if (dn)
      dn.onclick = function () {
        semiShift(-1);
      };
    if (rs) rs.onclick = semiReset;
    var st = document.getElementById("semiTone");
    if (st) st.onclick = semiToneRef;
    var ru = document.getElementById("ytRateUp");
    if (ru)
      ru.onclick = function () {
        ytRateStep(1);
      };
    var rd2 = document.getElementById("ytRateDown");
    if (rd2)
      rd2.onclick = function () {
        ytRateStep(-1);
      };
    if (rb) rb.onclick = openRecorderForCurrent;
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target || {};
      var tag = (t.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        semiShift(1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        semiShift(-1);
      }
    });
  }
  /* =============== akhir blok v62 =============== */
  function refreshLibrary() {
    renderSongJump();
    var ss = document.getElementById("songSearch");
    if (ss && ss.value) renderSearch(ss.value);
    var bp = document.getElementById("bankPage");
    if (bp && bp.classList.contains("open")) {
      var si = document.getElementById("bankPageSearch");
      renderBankPage(si ? si.value : "");
    }
  }
  // --- Metronome (bantuan musik) ---
  var metroCtx = null,
    metroTimer = 0,
    bpm = 80,
    bpmStep = 5,
    metroBeat = 0,
    metroOn = false,
    tapTimes = [];
  function ensureCtx() {
    if (!metroCtx) {
      try {
        metroCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return metroCtx;
  }
  function metroClick() {
    var ctx = ensureCtx();
    if (!ctx) return;
    var accent = metroBeat % 4 === 0;
    var o = ctx.createOscillator(),
      g = ctx.createGain();
    o.frequency.value = accent ? 1600 : 1000;
    o.connect(g);
    g.connect(ctx.destination);
    var t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.7 : 0.35, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.start(t);
    o.stop(t + 0.06);
    metroBeat = (metroBeat + 1) % 4;
  }
  function startMetro() {
    if (metroOn) return;
    var ctx = ensureCtx();
    if (ctx && ctx.state === "suspended") {
      try {
        ctx.resume();
      } catch (e) {}
    }
    metroOn = true;
    metroBeat = 0;
    var b = document.getElementById("metroToggle");
    if (b) {
      b.textContent = "Stop";
      b.classList.add("active");
    }
    metroClick();
    metroTimer = setInterval(metroClick, 60000 / bpm);
  }
  function stopMetro() {
    metroOn = false;
    if (metroTimer) {
      clearInterval(metroTimer);
      metroTimer = 0;
    }
    var b = document.getElementById("metroToggle");
    if (b) {
      b.textContent = "Mulai";
      b.classList.remove("active");
    }
  }
  function toggleMetro() {
    metroOn ? stopMetro() : startMetro();
  }
  function fmtBpm(v) {
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  }
  function setBpm(v) {
    v = Number(v) || 0;
    bpm = Math.min(240, Math.max(30, Math.round(v * 100) / 100));
    var el = document.getElementById("bpmVal");
    if (el) el.textContent = fmtBpm(bpm);
    if (metroOn) {
      clearInterval(metroTimer);
      metroTimer = setInterval(metroClick, 60000 / bpm);
    }
    try {
      localStorage.setItem("ptBpm", String(bpm));
    } catch (e) {}
  }
  function editBpm() {
    var ans = window.prompt(
      "Masukkan BPM (30-240, boleh koma, mis. 90,5):",
      fmtBpm(bpm),
    );
    if (ans == null) return;
    var n = parseFloat(String(ans).replace(",", ".").trim());
    if (!isNaN(n)) setBpm(n);
  }
  function setStep(s) {
    bpmStep = s === 1 ? 1 : 5;
    var b1 = document.getElementById("step1"),
      b5 = document.getElementById("step5");
    if (b1) b1.classList.toggle("on", bpmStep === 1);
    if (b5) b5.classList.toggle("on", bpmStep === 5);
    try {
      localStorage.setItem("ptStep", String(bpmStep));
    } catch (e) {}
  }
  function tapTempo() {
    var now = Date.now();
    tapTimes.push(now);
    tapTimes = tapTimes.filter(function (t) {
      return now - t < 3000;
    });
    if (tapTimes.length >= 2) {
      var iv = [];
      for (var i = 1; i < tapTimes.length; i++)
        iv.push(tapTimes[i] - tapTimes[i - 1]);
      var avg =
        iv.reduce(function (a, b) {
          return a + b;
        }, 0) / iv.length;
      if (avg > 0) setBpm(Math.round(60000 / avg));
    }
  }
  // --- Bantuan capo untuk gitar ---
  // --- Geser untuk mengubah urutan Daftar lagu ---
  let dragRow = null,
    pendingRow = null,
    pendStartX = 0,
    pendStartY = 0,
    DRAG_THRESHOLD = 8,
    dragGhostEl = null,
    dragStartOrder = "",
    dragGX = 0,
    dragGY = 0,
    ghostOX = 0,
    ghostOY = 0,
    rowRaf = 0,
    activePid = null,
    dropTargetRow = null,
    dropAfter = false;
  function enableRowDrag(handle, row) {
    handle.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      if (dragRow || pendingRow) return;
      activePid = e.pointerId;
      pendingRow = row;
      pendStartX = e.clientX;
      pendStartY = e.clientY;
      window.addEventListener("pointermove", onPendMove, {
        passive: false,
      });
      window.addEventListener("pointerup", onPendUp);
      window.addEventListener("pointercancel", onPendUp);
    });
  }
  function onPendMove(e) {
    if (!pendingRow) return;
    if (activePid !== null && e.pointerId !== activePid) return;
    var dx = e.clientX - pendStartX,
      dy = e.clientY - pendStartY;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    var row = pendingRow;
    clearPend();
    startRowDrag(row, e);
  }
  function onPendUp() {
    clearPend();
  }
  function clearPend() {
    pendingRow = null;
    window.removeEventListener("pointermove", onPendMove);
    window.removeEventListener("pointerup", onPendUp);
    window.removeEventListener("pointercancel", onPendUp);
  }
  function startRowDrag(row, e) {
    if (dragRow) return;
    if (e.cancelable) e.preventDefault();
    activePid = e.pointerId;
    dragRow = row;
    dragStartOrder = Array.from(songButtons.children)
      .map((r) => r.dataset.id)
      .join(",");
    const rect = row.getBoundingClientRect();
    dragGX = pendStartX - rect.left;
    dragGY = pendStartY - rect.top;
    ghostOX = rect.left;
    ghostOY = rect.top;
    dragGhostEl = row.cloneNode(true);
    dragGhostEl.className = "songRow rowGhost";
    dragGhostEl.style.width = rect.width + "px";
    dragGhostEl.style.height = rect.height + "px";
    dragGhostEl.style.left = rect.left + "px";
    dragGhostEl.style.top = rect.top + "px";
    dragGhostEl.style.transform = "translate(0px,0px) scale(1.04)";
    document.body.appendChild(dragGhostEl);
    row.classList.add("placeholder");
    document.body.style.touchAction = "none";
    window.addEventListener("pointermove", onRowMove, { passive: false });
    window.addEventListener("pointerup", onRowUp);
    window.addEventListener("pointercancel", onRowUp);
    positionGhost(e.clientX, e.clientY);
    updateDropIndicator(e.clientX, e.clientY);
  }
  function positionGhost(x, y) {
    if (!dragGhostEl) return;
    dragGhostEl.style.transform =
      "translate(" +
      (x - dragGX - ghostOX) +
      "px," +
      (y - dragGY - ghostOY) +
      "px) scale(1.04)";
  }
  function onRowMove(e) {
    if (!dragRow) return;
    if (activePid !== null && e.pointerId !== activePid) return;
    if (e.cancelable) e.preventDefault();
    const x = e.clientX,
      y = e.clientY;
    if (rowRaf) cancelAnimationFrame(rowRaf);
    rowRaf = requestAnimationFrame(() => {
      rowRaf = 0;
      positionGhost(x, y);
      updateDropIndicator(x, y);
    });
  }
  function clearDropIndicator() {
    Array.from(songButtons.children).forEach((r) => {
      r.classList.remove("dropBefore", "dropAfter");
    });
  }
  function updateDropIndicator(x, y) {
    if (!dragRow) return;
    const rows = Array.from(songButtons.children).filter((r) => r !== dragRow);
    let best = null,
      bestDist = Infinity,
      after = false;
    rows.forEach((r) => {
      const rect = r.getBoundingClientRect();
      const cy = rect.top + rect.height / 2;
      const d = Math.abs(y - cy);
      if (d < bestDist) {
        bestDist = d;
        best = r;
        after = y > cy;
      }
    });
    clearDropIndicator();
    dropTargetRow = best;
    dropAfter = after;
    if (best) best.classList.add(after ? "dropAfter" : "dropBefore");
  }
  function flipMove(mutate) {
    const rows = Array.from(songButtons.children);
    const first = new Map();
    rows.forEach((r) => first.set(r, r.getBoundingClientRect()));
    mutate();
    Array.from(songButtons.children).forEach((r) => {
      if (r === dragRow) return;
      const f = first.get(r);
      if (!f) return;
      const l = r.getBoundingClientRect();
      const dx = f.left - l.left,
        dy = f.top - l.top;
      if (dx || dy) {
        r.style.transition = "none";
        r.style.transform = "translate(" + dx + "px," + dy + "px)";
        requestAnimationFrame(() => {
          r.style.transition = "transform .2s cubic-bezier(.2,.9,.25,1.25)";
          r.style.transform = "";
        });
      }
    });
  }
  function onRowUp(e) {
    if (activePid !== null && e.pointerId !== activePid) return;
    window.removeEventListener("pointermove", onRowMove);
    window.removeEventListener("pointerup", onRowUp);
    window.removeEventListener("pointercancel", onRowUp);
    document.body.style.touchAction = "";
    activePid = null;
    if (rowRaf) {
      cancelAnimationFrame(rowRaf);
      rowRaf = 0;
    }
    if (!dragRow) return;
    const row = dragRow,
      ghost = dragGhostEl;
    dragRow = null;
    dragGhostEl = null;
    row.classList.remove("placeholder");
    clearDropIndicator();
    if (dropTargetRow && dropTargetRow !== row) {
      if (dropAfter) dropTargetRow.after(row);
      else dropTargetRow.before(row);
    }
    dropTargetRow = null;
    const slot = row.getBoundingClientRect();
    if (ghost) {
      ghost.classList.add("landing");
      ghost.style.transform =
        "translate(" +
        (slot.left - ghostOX) +
        "px," +
        (slot.top - ghostOY) +
        "px) scale(1)";
      setTimeout(() => {
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      }, 210);
    }
    const order = Array.from(songButtons.children).map((r) => r.dataset.id);
    if (order.join(",") === dragStartOrder) return;
    songs.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    songs.forEach((s, i) => {
      s.num = i + 1;
    });
    Array.from(songButtons.children).forEach((r) => {
      const btn = r.querySelector(".songBtn");
      const s = songs.find((x) => x.id === r.dataset.id);
      if (btn && s) btn.textContent = s.num + ". " + s.title;
    });
    saveSongs();
    if (currentSong()) render();
  }

  // --- Tarik lagu dari Bank ke Daftar lagu ---
  let bankGhost = null,
    bankDragItem = null;
  function enableBankDrag(grip, item) {
    grip.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      bankDragItem = item;
      grip.setPointerCapture(e.pointerId);
      document.getElementById("menuBackdrop").classList.add("dragging-bank");
      bankGhost = document.createElement("div");
      bankGhost.className = "dragGhost";
      bankGhost.textContent = item.title;
      document.body.appendChild(bankGhost);
      moveGhost(e);
      grip.addEventListener("pointermove", onBankMove);
      grip.addEventListener("pointerup", onBankUp);
    });
  }
  function moveGhost(e) {
    if (bankGhost) {
      bankGhost.style.left = e.clientX + 12 + "px";
      bankGhost.style.top = e.clientY + 12 + "px";
    }
  }
  function overSongList(e) {
    const r = songButtons.getBoundingClientRect();
    return (
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    );
  }
  function onBankMove(e) {
    moveGhost(e);
    songButtons.classList.toggle("dropHint", overSongList(e));
  }
  function onBankUp(e) {
    const grip = e.currentTarget;
    grip.removeEventListener("pointermove", onBankMove);
    grip.removeEventListener("pointerup", onBankUp);
    try {
      grip.releasePointerCapture(e.pointerId);
    } catch (_) {}
    const drop = overSongList(e);
    if (bankGhost) {
      bankGhost.remove();
      bankGhost = null;
    }
    songButtons.classList.remove("dropHint");
    document.getElementById("menuBackdrop").classList.remove("dragging-bank");
    const item = bankDragItem;
    bankDragItem = null;
    if (drop && item) addFromBank(item);
  }

  // --- Gulir otomatis (mode manggung) ---
  let scrollTimer = null,
    scrollSpeed = 1.2;
  function startScroll() {
    if (scrollTimer) return;
    scrollTimer = setInterval(() => {
      window.scrollBy(0, scrollSpeed);
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2)
        stopScroll();
    }, 30);
    const b = document.getElementById("scrollToggle");
    if (b) {
      b.textContent = "⏸";
      b.classList.add("active");
    }
  }
  function stopScroll() {
    if (scrollTimer) {
      clearInterval(scrollTimer);
      scrollTimer = null;
    }
    const b = document.getElementById("scrollToggle");
    if (b) {
      b.textContent = "▶";
      b.classList.remove("active");
    }
  }
  function toggleScroll() {
    scrollTimer ? stopScroll() : startScroll();
  }

  // --- Mode gelap & ukuran teks ---
  function applyDark(on) {
    document.body.classList.toggle("stage", on);
    try {
      localStorage.setItem("ptStage", on ? "1" : "0");
    } catch (e) {}
    const b = document.getElementById("darkToggle");
    if (b) {
      b.textContent = on ? "Mode panggung: aktif" : "Mode panggung";
      b.classList.toggle("active", !!on);
    }
  }
  function toggleDark() {
    applyDark(!document.body.classList.contains("stage"));
  }
  function applyEye(on) {
    document.body.classList.toggle("eye", on);
    try {
      localStorage.setItem("ptEye", on ? "1" : "0");
    } catch (e) {}
    const b = document.getElementById("eyeToggle");
    if (b) {
      b.textContent = on ? "Eye saver: aktif" : "Eye saver";
      b.classList.toggle("active", !!on);
    }
  }
  function toggleEye() {
    applyEye(!document.body.classList.contains("eye"));
  }
  function applyNum(on) {
    numberMode = !!on;
    try {
      localStorage.setItem("ptNum", on ? "1" : "0");
    } catch (e) {}
    const b = document.getElementById("numToggle");
    if (b) {
      b.textContent = on ? "Chord jadi huruf (A-G)" : "Chord jadi angka (1-7)";
      b.classList.toggle("active", !!on);
    }
    render();
    var ed = document.getElementById("editor");
    if (ed && ed.classList.contains("open")) updateEditPreview();
  }
  function toggleNum() {
    applyNum(!numberMode);
  }
  const textSteps = ["xs", "sm", "", "big", "xl"];
  const textLabels = [
    "Sangat kecil",
    "Kecil",
    "Sedang",
    "Besar",
    "Sangat besar",
  ];
  let textIdx = 2;
  function applyText() {
    document.body.classList.remove("xs", "sm", "big", "xl");
    const c = textSteps[textIdx];
    if (c) document.body.classList.add(c);
    const lbl = document.getElementById("textSizeLabel");
    if (lbl) lbl.textContent = textLabels[textIdx];
    try {
      localStorage.setItem("ptTextName", c);
    } catch (e) {}
  }
  function textBigger() {
    textIdx = Math.min(textSteps.length - 1, textIdx + 1);
    applyText();
  }
  function textSmaller() {
    textIdx = Math.max(0, textIdx - 1);
    applyText();
  }
  function applyCompact(on) {
    document.body.classList.toggle("compact", !!on);
    var b = document.getElementById("compactToggle");
    if (b) b.classList.toggle("active", !!on);
    try {
      localStorage.setItem("ptCompact", on ? "1" : "0");
    } catch (e) {}
  }
  function toggleCompact() {
    applyCompact(!document.body.classList.contains("compact"));
  }
  function restorePrefs() {
    try {
      applyDark(localStorage.getItem("ptStage") === "1");
      applyEye(localStorage.getItem("ptEye") === "1");
      const nm = localStorage.getItem("ptTextName");
      const i = textSteps.indexOf(nm == null ? "" : nm);
      textIdx = i >= 0 ? i : 2;
      applyText();
      var sv = parseInt(localStorage.getItem("ptStep"), 10);
      setStep(sv === 1 ? 1 : 5);
      var bv = parseFloat(localStorage.getItem("ptBpm"));
      if (!isNaN(bv)) setBpm(bv);
      applyNum(localStorage.getItem("ptNum") === "1");
      applyCompact(localStorage.getItem("ptCompact") === "1");
    } catch (e) {}
  }

  // --- Pasang aksi menu & fitur baru ---

  // === Isolasi error per fitur: 1 fitur gagal tidak mematikan fitur lain ===
  window.PNWDiag = window.PNWDiag || [];
  window.PNWSafe = window.PNWSafe || {
    run: function (name, fn) {
      try {
        return { ok: true, value: fn() };
      } catch (e) {
        window.PNWDiag.push({ feature: name, error: String((e && e.message) || e), at: Date.now() });
        if (window.console && console.warn) console.warn("[PNW] fitur gagal:", name, e);
        return { ok: false, error: e };
      }
    },
  };
  try {
    window.addEventListener("error", function (ev) {
      window.PNWDiag.push({ feature: "window", error: String((ev && ev.message) || "error"), at: Date.now() });
    });
    window.addEventListener("unhandledrejection", function (ev) {
      window.PNWDiag.push({ feature: "promise", error: String((ev && ev.reason && ev.reason.message) || ev.reason || "rejection"), at: Date.now() });
    });
  } catch (e) {}

  // === Mesin youTh Views yang dipakai js/projector.js ===
  window.PNWYouthViews = {
    version: "v77",
    getSongs: function () {
      return Array.isArray(songs) ? songs : [];
    },
    getSong: function (id) {
      return (Array.isArray(songs) ? songs : []).find(function (s) {
        return s && String(s.id) === String(id);
      }) || null;
    },
    buildSlides: function (song, maxLines) {
      return yvBuildSlides(song, maxLines);
    },
    stripChords: yvStripChords,
    isAdmin: function () {
      return !!isAdmin;
    },
    canBroadcast: function () {
      return !!(isAdmin && liveRef);
    },
    broadcast: function (payload) {
      if (!isAdmin || !liveRef) return false;
      try {
        liveRef.set(Object.assign({ t: Date.now() }, payload || {}));
        return true;
      } catch (e) {
        window.PNWDiag.push({ feature: "youthviews.broadcast", error: String((e && e.message) || e), at: Date.now() });
        return false;
      }
    },
    clear: function () {
      if (!isAdmin || !liveRef) return false;
      try {
        liveRef.set({ active: false, t: Date.now() });
        return true;
      } catch (e) {
        return false;
      }
    },
    selectedKey: function () {
      return selectedKey;
    },
    ensureFont: yvEnsureFont,
    motion: function () { return _yvMotion; },
    cue: yvMotionCue,
    diagnostics: function () {
      return window.PNWDiag.slice(-50);
    },
  };

  function initExtras() {
    document.getElementById("menuBtn").onclick = openMenu;
    ensureLottie(0);
    document.getElementById("closeMenuBtn").onclick = closeMenu;
    document.getElementById("openIzinBtn").onclick = openIzin;
    document.getElementById("closeIzinBtn").onclick = closeIzin;
    document.getElementById("sendIzinBtn").onclick = submitIzin;
    document.getElementById("openSaranBtn").onclick = openSaran;
    document.getElementById("sendSaranBtn").onclick = submitSaran;
    var _sf = document.getElementById("saranFoto");
    if (_sf)
      _sf.onchange = function () {
        var pv = document.getElementById("saranFotoPreview");
        if (!pv) return;
        pv.innerHTML = "";
        var f = _sf.files && _sf.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function (e) {
          var im = document.createElement("img");
          im.src = e.target.result;
          pv.appendChild(im);
        };
        r.readAsDataURL(f);
      };
    document.getElementById("closeSaranBtn").onclick = closeSaran;
    document.getElementById("openInfoBtn").onclick = openInfo;
    document.getElementById("closeInfoBtn").onclick = closeInfo;
    document.getElementById("restoreNotesBtn").onclick = restoreSeedNotes;
    document.getElementById("adminLoginBtn").onclick = openLogin;
    document.getElementById("adminLogoutBtn").onclick = doLogout;
    document.getElementById("lockToggle").onclick = toggleLock;
    var izt = document.getElementById("izinOpenToggle");
    if (izt) izt.onclick = toggleIzinForm;
    document.getElementById("addNoteBtn").onclick = openNoteModal;
    document.getElementById("loginSubmit").onclick = doLogin;
    document.getElementById("loginClose").onclick = closeLogin;
    var _gbtn = document.getElementById("googleLoginBtn");
    if (_gbtn) _gbtn.onclick = doGoogleLogin;
    var _sbtn = document.getElementById("signupSubmit");
    if (_sbtn) _sbtn.onclick = doSignup;
    var _sopen = document.getElementById("toSignupBtn");
    if (_sopen)
      _sopen.onclick = function (ev) {
        ev.preventDefault();
        openSignup();
      };
    var _sback = document.getElementById("toLoginBtn");
    if (_sback)
      _sback.onclick = function (ev) {
        ev.preventDefault();
        backToLogin();
      };
    var _plo = document.getElementById("pendingLogout");
    if (_plo)
      _plo.onclick = function (ev) {
        ev.preventDefault();
        doLogout();
      };
    var _sd = document.getElementById("schedStartDate");
    if (_sd)
      _sd.onchange = function () {
        sched.startISO = _sd.value || "";
        try {
          saveSched();
        } catch (e) {}
        buildReminder();
      };
    var _rc = document.getElementById("reminderClose");
    if (_rc) _rc.onclick = dismissReminder;
    syncStartDateInput();
    try {
      buildReminder();
    } catch (e) {}
    document.getElementById("noteSubmit").onclick = submitNote;
    window.addEventListener("online", function () {
      toast("Kembali online - perubahan tersinkron.", "success");
    });
    window.addEventListener("offline", function () {
      toast(
        "Mode offline - perubahan disimpan, dikirim saat online.",
        "info",
        3500,
      );
    });
    setTimeout(function () { window.PNWSafe.run("song-bank-seed", seedBankFromSongs); }, 1800);
    var spx = document.getElementById("spectateToggle");
    if (spx) spx.onclick = toggleSpectate;
    var odb = document.getElementById("openDisplayBtn");
    if (odb)
      odb.onclick = function () {
        window.open(
          location.origin + location.pathname + "?mode=youthviews",
          "_blank",
        );
      };
    var osb = document.getElementById("openStageBtn");
    if (osb)
      osb.onclick = function () {
        window.open(
          location.origin + location.pathname + "?mode=stage",
          "_blank",
        );
      };
    var stb = document.getElementById("showTextBtn");
    if (stb) stb.onclick = broadcastText;
    var ctb = document.getElementById("clearTextBtn");
    if (ctb) ctb.onclick = clearText;
    var svb = document.getElementById("showVerseBtn");
    if (svb) svb.onclick = broadcastVerse;
    var pbb = document.getElementById("prevBaitBtn");
    if (pbb)
      pbb.onclick = function () {
        gotoSection(-1);
      };
    var nbb = document.getElementById("nextBaitBtn");
    if (nbb)
      nbb.onclick = function () {
        gotoSection(1);
      };
    var lct = document.getElementById("liveChordsToggle");
    if (lct) lct.onclick = toggleLiveChords;
    window.PNWSafe.run("display-mode", initDisplayMode);
    var shEl = document.getElementById("sheet");
    if (shEl)
      shEl.addEventListener("scroll", function () {
        if (typeof broadcastLive === "function") broadcastLive();
      });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("sw.js")
        .then(function (reg) {
          reg.update();
          setInterval(function () {
            reg.update();
          }, 60000);
          reg.addEventListener("updatefound", function () {
            var nw = reg.installing;
            if (!nw) return;
            nw.addEventListener("statechange", function () {
              if (
                nw.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                if (!window.__swReloaded) {
                  window.__swReloaded = true;
                  try {
                    toast("Versi baru dimuat, menyegarkan...", "info", 1400);
                  } catch (e) {}
                  setTimeout(function () {
                    window.location.reload();
                  }, 700);
                }
              }
            });
          });
        })
        .catch(function () {});
      var swRefreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (swRefreshing) return;
        swRefreshing = true;
        window.location.reload();
      });
    }
    document.getElementById("noteClose").onclick = closeNoteModal;
    var lgm = document.getElementById("loginModal");
    if (lgm)
      lgm.addEventListener("click", function (e) {
        if (e.target === lgm) closeLogin();
      });
    var ntm = document.getElementById("noteModal");
    if (ntm)
      ntm.addEventListener("click", function (e) {
        if (e.target === ntm) closeNoteModal();
      });
    var srm = document.getElementById("saranModal");
    if (srm)
      srm.addEventListener("click", function (e) {
        if (e.target === srm) closeSaran();
      });
    var ifm = document.getElementById("infoModal");
    if (ifm)
      ifm.addEventListener("click", function (e) {
        if (e.target === ifm) closeInfo();
      });
    updateNoteDot();
    document.querySelectorAll("#izinWeeks .weekChip").forEach(function (b) {
      b.onclick = function () {
        b.classList.toggle("on");
      };
    });
    var izm = document.getElementById("izinModal");
    if (izm)
      izm.addEventListener("click", function (e) {
        if (e.target === izm) closeIzin();
      });
    var mb = document.getElementById("menuBackdrop");
    mb.addEventListener("click", function (e) {
      if (e.target === mb) closeMenu();
    });
    document.getElementById("ytPlay").onclick = openYouTube;
    document.getElementById("ytPP").onclick = ytTogglePlay;
    document.getElementById("ytStop").onclick = stopYt;
    document.getElementById("ytTrack").addEventListener("click", ytSeek);
    document.getElementById("darkToggle").onclick = toggleDark;
    document.getElementById("eyeToggle").onclick = toggleEye;
    document.getElementById("numToggle").onclick = toggleNum;
    document.getElementById("textBigger").onclick = textBigger;
    document.getElementById("textSmaller").onclick = textSmaller;
    document.getElementById("compactToggle").onclick = toggleCompact;
    document
      .getElementById("songSearch")
      .addEventListener("input", function (e) {
        renderSearch(e.target.value);
      });
    document
      .getElementById("songJump")
      .addEventListener("change", function (e) {
        if (e.target.value) gotoSong(e.target.value);
      });
    document.getElementById("openBankBtn").onclick = openBankPage;
    document.getElementById("bankPageClose").onclick = closeBankPage;
    document.getElementById("openSchedBtn").onclick = openSchedulePage;
    (function () {
      function tapFx(btn) {
        if (!btn) return;
        btn.classList.remove("tapping");
        void btn.offsetWidth;
        btn.classList.add("tapping");
        setTimeout(function () {
          btn.classList.remove("tapping");
        }, 60);
      }
      document.addEventListener(
        "pointerdown",
        function (e) {
          var btn =
            e.target && e.target.closest
              ? e.target.closest(".actionBtn")
              : null;
          if (btn) tapFx(btn);
        },
        true,
      );
    })();
    document.getElementById("schedClose").onclick = closeSchedulePage;
    document.getElementById("schedTab_jadwal").onclick = function () {
      schedSetTab("jadwal");
    };
    document.getElementById("schedTab_pelayan").onclick = function () {
      schedSetTab("pelayan");
    };
    document.getElementById("schedTab_izin").onclick = function () {
      schedSetTab("izin");
    };
    document.getElementById("schedWeekCount").onchange = function (e) {
      var n = parseInt(e.target.value, 10) || 5;
      sched.weeks = n;
      saveSched(true);
      renderSchedule();
    };
    setTimeout(initScheduleCloud, 2200);
    document
      .getElementById("bankPageSearch")
      .addEventListener("input", function (e) {
        renderBankPage(e.target.value);
      });
    document.getElementById("metroToggle").onclick = toggleMetro;
    document.getElementById("bpmUp").onclick = function () {
      setBpm(bpm + bpmStep);
    };
    document.getElementById("bpmDown").onclick = function () {
      setBpm(bpm - bpmStep);
    };
    document.getElementById("bpmVal").onclick = editBpm;
    document.getElementById("step1").onclick = function () {
      setStep(1);
    };
    document.getElementById("step5").onclick = function () {
      setStep(5);
    };
    document.getElementById("tapTempo").onclick = tapTempo;
    document.getElementById("bankAddBtn").onclick = addSongFromBank;
    document.getElementById("onlineOpenBtn").onclick = openOnlineSearch;
    initSecAlign();
    document.getElementById("onlineClose").onclick = closeOnlineSearch;
    document.getElementById("onlineGo").onclick = onlineSearchGo;
    document
      .getElementById("onlineQuery")
      .addEventListener("keydown", function (e) {
        if (e.key === "Enter") onlineSearchGo();
      });
    document
      .getElementById("editLines")
      .addEventListener("input", updateEditPreview);
    document.getElementById("structToggleBtn").onclick = toggleStructMode;
    var afBtnEl = document.getElementById("autoFormatBtn");
    if (afBtnEl) afBtnEl.onclick = runAutoFormat;
    var afUndoEl = document.getElementById("afUndoBtn");
    if (afUndoEl) afUndoEl.onclick = afUndo;
    buildPalette();
    document
      .getElementById("editOriginalKey")
      .addEventListener("input", updateEditPreview);
    // --- Autocomplete / autocorrect chord canggih di editor ---
    var CHORD_SUFFIXES = [
      "",
      "m",
      "7",
      "m7",
      "maj7",
      "sus4",
      "sus2",
      "6",
      "m6",
      "9",
      "m9",
      "maj9",
      "add9",
      "madd9",
      "11",
      "m11",
      "13",
      "m13",
      "dim",
      "dim7",
      "m7b5",
      "aug",
      "+",
      "5",
      "6/9",
      "m6/9",
      "7sus4",
      "9sus4",
      "7b5",
      "7#5",
      "7b9",
      "7#9",
      "7#11",
      "7b13",
      "13sus4",
      "mmaj7",
      "maj7#11",
      "maj13",
      "sus4add9",
      "add11",
      "add13",
      "sus",
      "m7#5",
      "7sus2",
      "dim9",
      "aug7",
      "augmaj7",
      "maj7b5",
      "maj9#11",
      "13#11",
      "13b9",
      "9b5",
      "9#5",
      "6add9",
      "7sus",
      "sus2add9",
    ];
    function csIsBoundary(ch) {
      if (ch === undefined) return true;
      var c = ch.charCodeAt(0);
      return (
        c === 32 || c === 9 || c === 10 || c === 13 || ch === "[" || ch === "]"
      );
    }
    function csRootOf(tok) {
      if (!tok) return "";
      var c = tok[0].toUpperCase();
      if (!"ABCDEFG".includes(c)) return "";
      if (tok.length >= 2 && (tok[1] === "#" || tok[1] === "b"))
        return c + tok[1];
      return c;
    }
    function csTokenAtCursor(ta) {
      if (ta.selectionStart !== ta.selectionEnd) return null;
      var pos = ta.selectionStart;
      var val = ta.value;
      var start = pos;
      while (start > 0 && !csIsBoundary(val[start - 1])) start--;
      var tok = val.slice(start, pos);
      var root = csRootOf(tok);
      if (!root) return null;
      var inBracket = start > 0 && val[start - 1] === "[";
      return {
        start: start,
        end: pos,
        root: root,
        partial: tok.slice(root.length),
        inBracket: inBracket,
      };
    }
    function csBuild(root, partial) {
      var p = partial.toLowerCase();
      var out = [];
      var seen = {};
      for (var i = 0; i < CHORD_SUFFIXES.length; i++) {
        var suf = CHORD_SUFFIXES[i];
        if (p === "" || suf.toLowerCase().indexOf(p) === 0) {
          var full = root + suf;
          if (!seen[full]) {
            seen[full] = 1;
            out.push(full);
          }
        }
      }
      return out.slice(0, 16);
    }
    var csLastTok = null;
    function csHide() {
      var box = document.getElementById("chordSuggest");
      if (box) box.hidden = true;
      csLastTok = null;
    }
    function csApply(chord) {
      var ta = document.getElementById("editLines");
      var t = csLastTok || csTokenAtCursor(ta);
      if (!t) return;
      var val = ta.value;
      var before = val.slice(0, t.start);
      var after = val.slice(t.end);
      var addClose = t.inBracket && after[0] !== "]";
      ta.value = before + chord + (addClose ? "]" : "") + after;
      var np = (before + chord + (addClose ? "]" : "")).length;
      ta.focus();
      ta.setSelectionRange(np, np);
      csHide();
      updateEditPreview();
    }
    function csRefresh() {
      var ta = document.getElementById("editLines");
      var box = document.getElementById("chordSuggest");
      if (!ta || !box) return;
      var t = csTokenAtCursor(ta);
      if (!t || (!t.inBracket && t.partial === "")) {
        csHide();
        return;
      }
      var list = csBuild(t.root, t.partial);
      if (!list.length) {
        csHide();
        return;
      }
      csLastTok = t;
      box.innerHTML = "";
      list.forEach(function (ch) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "csChip";
        b.textContent = ch;
        b.addEventListener("mousedown", function (e) {
          e.preventDefault();
        });
        b.addEventListener("click", function () {
          csApply(ch);
        });
        box.appendChild(b);
      });
      box.hidden = false;
    }
    (function () {
      var ta = document.getElementById("editLines");
      if (!ta) return;
      ta.addEventListener("input", csRefresh);
      ta.addEventListener("click", csRefresh);
      ta.addEventListener("keyup", function (e) {
        if (
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "Home" ||
          e.key === "End"
        )
          csRefresh();
      });
      ta.addEventListener("keydown", function (e) {
        var box = document.getElementById("chordSuggest");
        if (box && !box.hidden && e.key === "Tab") {
          var first = box.querySelector(".csChip");
          if (first) {
            e.preventDefault();
            csApply(first.textContent);
          }
        } else if (e.key === "Escape") {
          csHide();
        }
      });
      ta.addEventListener("blur", function () {
        setTimeout(csHide, 200);
      });
    })();
    document.getElementById("dragInfoBtn").onclick = function () {
      var t = document.getElementById("dragTip");
      if (t) t.style.display = t.style.display === "none" ? "block" : "none";
    };
    loadYtApi();
    renderBank();
    refreshLibrary();
    restorePrefs();
  }

  /* ============ v60: Tombol melayang ala AssistiveTouch + Wheel ============ */
  var atBtnEl = null,
    atOvEl = null,
    atWheelEl = null,
    atItemsEl = null,
    atHubEl = null,
    atLevel = "root",
    atPage = 0,
    atIdleT = null;
  var AT_POS_KEY = "pnwWheelPos";
  var AT_PER_PAGE = 6;

  function atClamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function atSavePos(x, y) {
    try {
      localStorage.setItem(AT_POS_KEY, JSON.stringify({ x: x, y: y }));
    } catch (e) {}
  }
  function atPlaceBtn(x, y) {
    if (!atBtnEl) return { x: 0, y: 0 };
    var m = 8,
      w = atBtnEl.offsetWidth || 52,
      h = atBtnEl.offsetHeight || 52;
    x = atClamp(x, m, Math.max(m, window.innerWidth - w - m));
    y = atClamp(y, m, Math.max(m, window.innerHeight - h - m));
    atBtnEl.style.left = x + "px";
    atBtnEl.style.top = y + "px";
    atBtnEl.style.right = "auto";
    return { x: x, y: y };
  }
  function atSnapEdge() {
    if (!atBtnEl) return;
    var r = atBtnEl.getBoundingClientRect();
    var toLeft = r.left + r.width / 2 < window.innerWidth / 2;
    var x = toLeft ? 8 : window.innerWidth - r.width - 8;
    var p = atPlaceBtn(x, r.top);
    atSavePos(p.x, p.y);
  }
  function atWake() {
    if (!atBtnEl) return;
    atBtnEl.classList.remove("idle");
    clearTimeout(atIdleT);
    atIdleT = setTimeout(function () {
      if (atOvEl && atOvEl.hidden) atBtnEl.classList.add("idle");
    }, 3000);
  }

  /* ---- isi menu ---- */
  function atRootItems() {
    return [
      { k: "lagu", lbl: "Lagu", anim: "songbank", sub: true },
      { k: "metro", lbl: "Metronom", ico: "\u266A", sub: true },
      { k: "tampilan", lbl: "Tampilan", anim: "layer", sub: true },
      {
        k: "proyektor",
        lbl: "youTh Views",
        ico: "\u25A3",
        act: function () {
          var b = document.getElementById("openDisplayBtn");
          if (b) b.click();
          atClose();
        },
      },
    ];
  }
  function atSongItems() {
    var list = (songs || []).slice();
    var pages = Math.max(1, Math.ceil(list.length / AT_PER_PAGE));
    if (atPage >= pages) atPage = 0;
    var slice = list.slice(
      atPage * AT_PER_PAGE,
      atPage * AT_PER_PAGE + AT_PER_PAGE,
    );
    var out = slice.map(function (s) {
      return {
        k: "song:" + s.id,
        lbl: s.title || "(tanpa judul)",
        ico: String(s.num || "\u266B"),
        cur: s.id === selectedSongId,
        act: function () {
          gotoSong(s.id);
          atClose();
        },
      };
    });
    if (pages > 1) {
      out.push({
        k: "prev",
        lbl: "Sebelum",
        ico: "\u2039",
        keep: true,
        act: function () {
          atPage = (atPage - 1 + pages) % pages;
          atRender(true);
        },
      });
      out.push({
        k: "next",
        lbl: "Lanjut",
        ico: "\u203A",
        keep: true,
        act: function () {
          atPage = (atPage + 1) % pages;
          atRender(true);
        },
      });
    }
    return out;
  }
  function atMetroItems() {
    return [
      {
        k: "mstart",
        lbl: metroOn ? "Stop" : "Mulai",
        ico: metroOn ? "\u25A0" : "\u25B6",
        on: metroOn,
        keep: true,
        act: function () {
          toggleMetro();
          atRender(false);
        },
      },
      {
        k: "mminus",
        lbl: "BPM \u2212",
        ico: "\u2212",
        keep: true,
        act: function () {
          setBpm(bpm - 5);
          atRender(false);
        },
      },
      {
        k: "mplus",
        lbl: "BPM +",
        ico: "+",
        keep: true,
        act: function () {
          setBpm(bpm + 5);
          atRender(false);
        },
      },
      {
        k: "mtap",
        lbl: "Tap",
        ico: "\u25CE",
        keep: true,
        act: function () {
          tapTempo();
          atRender(false);
        },
      },
    ];
  }
  function atViewItems() {
    return [
      {
        k: "vdark",
        lbl: "Gelap",
        ico: "\u25D1",
        on: document.body.classList.contains("dark"),
        keep: true,
        act: function () {
          toggleDark();
          atRender(false);
        },
      },
      {
        k: "vnum",
        lbl: "Nomor",
        ico: "#",
        on: document.body.classList.contains("num"),
        keep: true,
        act: function () {
          toggleNum();
          atRender(false);
        },
      },
      {
        k: "vcomp",
        lbl: "Ringkas",
        ico: "\u2263",
        on: document.body.classList.contains("compact"),
        keep: true,
        act: function () {
          toggleCompact();
          atRender(false);
        },
      },
      {
        k: "vbig",
        lbl: "Teks +",
        ico: "A",
        keep: true,
        act: function () {
          textBigger();
        },
      },
      {
        k: "vsmall",
        lbl: "Teks \u2212",
        ico: "a",
        keep: true,
        act: function () {
          textSmaller();
        },
      },
    ];
  }
  function atItemsFor(level) {
    if (level === "lagu") return atSongItems();
    if (level === "metro") return atMetroItems();
    if (level === "tampilan") return atViewItems();
    return atRootItems();
  }
  function atHubText(level) {
    if (level === "lagu") return { lbl: "Pilih lagu", sub: "kembali" };
    if (level === "metro") return { lbl: fmtBpm(bpm) + " BPM", sub: "kembali" };
    if (level === "tampilan") return { lbl: "Tampilan", sub: "kembali" };
    return { lbl: "Menu", sub: "" };
  }

  /* ---- gambar wheel ---- */
  function atRender(spin) {
    if (!atItemsEl) return;
    var items = atItemsFor(atLevel);
    var ht = atHubText(atLevel);
    var lbl = atHubEl.querySelector(".atHubLbl");
    if (lbl) lbl.textContent = ht.lbl;
    var sub = atHubEl.querySelector(".atHubSub");
    if (!sub) {
      sub = document.createElement("span");
      sub.className = "atHubSub";
      atHubEl.appendChild(sub);
    }
    sub.textContent = ht.sub;

    atItemsEl.innerHTML = "";
    var n = items.length;
    var R = n > 6 ? 108 : 100;
    items.forEach(function (it, i) {
      var ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "atItem" + (it.on ? " on" : "") + (it.cur ? " cur" : "");
      b.style.setProperty("--x", (Math.cos(ang) * R).toFixed(1) + "px");
      b.style.setProperty("--y", (Math.sin(ang) * R).toFixed(1) + "px");
      b.style.setProperty("--d", i * 42 + "ms");
      var ico;
      if (it.anim) {
        ico = document.createElement("span");
        ico.className = "lottieIco";
        ico.setAttribute("data-anim", it.anim);
      } else {
        ico = document.createElement("span");
        ico.className = "atIco";
        ico.textContent = it.ico || "\u2022";
      }
      var tx = document.createElement("span");
      tx.className = "atLbl";
      tx.textContent = it.lbl;
      b.appendChild(ico);
      b.appendChild(tx);
      b.onclick = function (ev) {
        ev.stopPropagation();
        b.classList.remove("pressed");
        void b.offsetWidth;
        b.classList.add("pressed");
        if (it.sub) {
          atPage = 0;
          atGoLevel(it.k);
        } else if (it.act) {
          setTimeout(it.act, it.keep ? 0 : 120);
        }
      };
      atItemsEl.appendChild(b);
    });

    try {
      initLottieIcons();
    } catch (e) {}
    if (spin !== false) {
      try {
        replayIn(atHubEl);
      } catch (e) {}
    }
  }

  function atGoLevel(level) {
    atLevel = level;
    atItemsEl.classList.add("leaving");
    setTimeout(function () {
      atItemsEl.classList.remove("leaving");
      atRender(true);
    }, 150);
  }

  function atOpen() {
    if (!atOvEl) return;
    atLevel = "root";
    atPage = 0;
    atOvEl.hidden = false;
    atWheelEl.classList.remove("closing");
    atBtnEl.classList.remove("idle");
    clearTimeout(atIdleT);
    atRender(true);
  }
  function atClose() {
    if (!atOvEl || atOvEl.hidden) return;
    atWheelEl.classList.add("closing");
    setTimeout(function () {
      atOvEl.hidden = true;
      atWheelEl.classList.remove("closing");
      atWake();
    }, 150);
  }
  function atToggle() {
    if (atOvEl && atOvEl.hidden) atOpen();
    else atClose();
  }

  function initWheel() {
    atBtnEl = document.getElementById("atBtn");
    atOvEl = document.getElementById("atOverlay");
    atWheelEl = document.getElementById("atWheel");
    if (!atBtnEl || !atOvEl || !atWheelEl) return;
    atItemsEl = atWheelEl.querySelector(".atItems");
    atHubEl = atWheelEl.querySelector(".atHub");

    // posisi tersimpan
    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(AT_POS_KEY) || "null");
    } catch (e) {}
    if (saved && typeof saved.x === "number") atPlaceBtn(saved.x, saved.y);
    else
      atPlaceBtn(
        window.innerWidth - (atBtnEl.offsetWidth || 52) - 14,
        Math.round(window.innerHeight * 0.6),
      );

    // geser bebas ala iPhone
    var sx = 0,
      sy = 0,
      ox = 0,
      oy = 0,
      moved = false,
      downT = 0,
      pid = null;
    atBtnEl.addEventListener("pointerdown", function (e) {
      pid = e.pointerId;
      moved = false;
      downT = Date.now();
      var r = atBtnEl.getBoundingClientRect();
      sx = e.clientX;
      sy = e.clientY;
      ox = r.left;
      oy = r.top;
      try {
        atBtnEl.setPointerCapture(pid);
      } catch (err) {}
      atBtnEl.classList.add("dragging");
      atWake();
    });
    atBtnEl.addEventListener("pointermove", function (e) {
      if (pid === null) return;
      var dx = e.clientX - sx,
        dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (moved) {
        e.preventDefault();
        atPlaceBtn(ox + dx, oy + dy);
      }
    });
    function atUp() {
      if (pid === null) return;
      atBtnEl.classList.remove("dragging");
      try {
        atBtnEl.releasePointerCapture(pid);
      } catch (err) {}
      pid = null;
      if (!moved && Date.now() - downT < 700) atToggle();
      else atSnapEdge();
    }
    atBtnEl.addEventListener("pointerup", atUp);
    atBtnEl.addEventListener("pointercancel", atUp);

    // tutup bila tap di luar lingkaran wheel
    atOvEl.addEventListener("pointerdown", function (e) {
      var r = atWheelEl.getBoundingClientRect();
      var cx = r.left + r.width / 2,
        cy = r.top + r.height / 2;
      var dx = e.clientX - cx,
        dy = e.clientY - cy;
      if (Math.sqrt(dx * dx + dy * dy) > r.width / 2) atClose();
    });

    // hub: kembali satu tingkat, atau tutup bila sudah di akar
    atHubEl.onclick = function (e) {
      e.stopPropagation();
      if (atLevel === "root") atClose();
      else {
        atPage = 0;
        atGoLevel("root");
      }
    };

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && atOvEl && !atOvEl.hidden) atClose();
    });
    window.addEventListener("resize", function () {
      var r = atBtnEl.getBoundingClientRect();
      atPlaceBtn(r.left, r.top);
    });

    atWake();
  }

  // Jalankan aplikasi: gambar tampilan, lalu coba sambungkan ke server online.
  window.PNWSafe.run("buttons", makeButtons);
  window.PNWSafe.run("render", render);
  window.PNWSafe.run("extras", initExtras);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWheel);
  } else {
    initWheel();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCloud);
  } else {
    initCloud();
  }
})();
