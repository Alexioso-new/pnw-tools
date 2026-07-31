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
          /^(Intro|Bait|Verse|Reff|Refrain|Chorus|Pre-?Chorus|Bridge|Musik|Instrumen(tal)?|Interlude|Transition|Transisi|Solo|Ending|Outro|Outtro|Coda)(\s|:|$)/i;
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
        function saveBank() {
          try {
            localStorage.setItem(bankKey, JSON.stringify(bankSongs));
          } catch (e) {}
          if (cloudReady && bankRef && !applyingRemote) {
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
              if (window.PNWLog)
                window.PNWLog.ready(firebase, { version: "3.9.2" });
            } catch (e) {}
            dbRef = firebase.database().ref("pujianYouth/songs");
            bankRef = firebase.database().ref("pujianYouth/songBank");
            bankRef.on("value", function (snap) {
              var val = snap.val();
              if (val) {
                var arr = Array.isArray(val)
                  ? val.filter(Boolean)
                  : Object.values(val).filter(Boolean);
                bankSongs = arr;
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
                  (LOCAL_ACCOUNTS[i].u || "").toLowerCase() ===
                  savedU.toLowerCase()
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
        function openLogin() {
          closeMenu();
          document.getElementById("loginMsg").textContent = "";
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
          if (!isAdmin || !lockRef) return;
          lockRef.set(!locked);
          toast(
            !locked ? "Daftar lagu dikunci." : "Daftar lagu dibuka.",
            "success",
          );
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
            dt.getDate() +
            " " +
            NOTE_MONTHS[dt.getMonth()] +
            " " +
            dt.getFullYear()
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
            document.getElementById("noteItems").value = (
              note.items || []
            ).join("\n");
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
            document.getElementById("noteDate").value = noteInputVal(
              Date.now(),
            );
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
              toast(
                "Gagal menghapus: " + ((err && err.message) || ""),
                "error",
              );
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
          var ts = noteTsDari(
            tglInp && tglInp.value,
            noteEditT || now.getTime(),
          );
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
              msg.textContent =
                "Cloud belum siap. Tunggu sebentar lalu ulangi.";
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
          liveThrottle = 0;
        function initSpectate() {
          try {
            liveRef = firebase.database().ref("pujianYouth/live");
            liveRef.on("value", function (s) {
              applyLive(s.val());
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
        var WL_SENIOR = [
          "Gilberth",
          "Joshua",
          "Natha",
          "Selmia",
          "Tessa",
          "Yemima",
        ];
        var WL_JUNIOR = ["Erica", "Ester", "Florie", "Karin", "Martin"];
        var MUS_SENIOR = ["Alex", "George", "Jamie", "Mishael", "Ebenhaezer"];
        var MUS_JUNIOR = ["Samuel", "Gilberth", "Natha"];
        var PRESENTER_TETAP = ["Yemima", "Yesika"];
        var PRESENTER_TRIAL = [
          "Fingken",
          "Chintya",
          "Ester",
          "Joshua",
          "Florie",
        ];
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
            alasan:
              "Worship Leader tidak merangkap Singers di sesi Persembahan",
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
            alasan:
              "pemusik P&W tidak merangkap WL atau Singers di Persembahan",
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
                  schedCloudStatus("Gagal simpan ke cloud");
                  toast("Gagal menyimpan jadwal ke cloud.", "error");
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
          if (!s.weekLabels || typeof s.weekLabels !== "object")
            s.weekLabels = {};
          if (!s.closed || typeof s.closed !== "object") s.closed = {};
          Object.keys(s.closed).forEach(function (wk) {
            if (!s.closed[wk] || typeof s.closed[wk] !== "object")
              s.closed[wk] = {};
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
        var BACKUP_MAX = 3;
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
            data: { songs: songs || [], songBank: bankSongs || [], schedule: sched || null },
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
          try { localStorage.removeItem(BACKUP_KEY); } catch (e) {}
          return false;
        }
        function backupMaybe(reason) {
          var now = Date.now();
          if (now - __lastBackupAt < 90000) return;
          var snap = backupSnapshotObj();
          if (!snap.counts.songs && !snap.counts.bank && !schedHasContent(sched)) return;
          snap.reason = reason || "auto";
          __lastBackupAt = now;
          var list = backupList();
          list.push(snap);
          while (list.length > BACKUP_MAX) list.shift();
          backupStore(list);
        }
        function backupDownload(obj, name) {
          try {
            var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
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
          function p(n) { return (n < 10 ? "0" : "") + n; }
          var stamp = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
          backupDownload(snap, "pnw-backup-" + stamp + ".json");
          toast("Backup diunduh (" + snap.counts.songs + " lagu, " + snap.counts.bank + " bank).", "success");
        }
        function backupApply(obj, label) {
          if (!obj || !obj.data) { toast("File backup tidak valid.", "error"); return; }
          if (!isAdmin) { toast("Hanya admin yang bisa memulihkan backup.", "error"); return; }
          var d = obj.data;
          var msg = "Pulihkan dari " + (label || "backup") + "?\n\nLagu: " + ((d.songs && d.songs.length) || 0) + "\nBank: " + ((d.songBank && d.songBank.length) || 0) + "\n\nData saat ini akan DIGANTI (lokal & cloud).";
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
            try { makeButtons(); render(); refreshLibrary(); renderSchedule(); } catch (e) {}
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
          if (!list.length) { toast("Belum ada snapshot lokal."); return; }
          var lines = list.map(function (s, i) {
            var t = new Date(s.ts || s.at);
            return (i + 1) + ". " + t.toLocaleString() + " - " + ((s.counts && s.counts.songs) || 0) + " lagu, " + ((s.counts && s.counts.bank) || 0) + " bank (" + (s.reason || "auto") + ")";
          }).join("\n");
          var pick = window.prompt("Snapshot lokal (terbaru di bawah):\n\n" + lines + "\n\nKetik nomor untuk memulihkan:", String(list.length));
          if (!pick) return;
          var idx = parseInt(pick, 10) - 1;
          if (isNaN(idx) || idx < 0 || idx >= list.length) { toast("Nomor tidak valid.", "error"); return; }
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
          note.textContent = "Snapshot lokal otomatis tersimpan di perangkat ini (maks " + BACKUP_MAX + "). Export untuk simpanan permanen.";
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
          if (schedHist.idx >= 0 && schedHist.stack[schedHist.idx] === snap)
            return;
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
                  roleUse[pid + "|" + r.key] =
                    (roleUse[pid + "|" + r.key] || 0) + 1;
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
              if (
                rk === "pengumuman" &&
                getAssign(w, "doaBuka").indexOf(pid) >= 0
              )
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
            sched.requests && sched.requests.length
              ? sched.requests
              : REQUESTS || [];

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
              (mode === "ulang"
                ? "Jadwal disusun ulang"
                : "Jadwal dilengkapi") + " - semua aturan H1-H11 terpenuhi.",
              "success",
            );
          }
        }
        // v2.3 - garis penghubung 3D untuk Double Role (orthogonal, hindari box lain)
        // v2.3 - penanda Double Role ringan: warna tetap per orang + sorot terkait.
        // Menggantikan garis SVG 3D (path-finding) yang berat dan berantakan.
        function schedDblColor(pid) {
          var h = 0;
          for (var i = 0; i < pid.length; i++)
            h = (h * 31 + pid.charCodeAt(i)) % 12;
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
                o.hidden = q
                  ? o.textContent.toLowerCase().indexOf(q) < 0
                  : false;
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
            if ((p.roles || []).indexOf(roleKey) < 0)
              m.push("di luar kemampuan");
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
            head.push(
              (sched.weekLabels && sched.weekLabels[w]) || "Minggu " + w,
            );
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
                done(
                  false,
                  "Apps Script menolak: " + String(t || "").slice(0, 140),
                );
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
            if (id === "schedUndoBtn" || id === "schedRedoBtn")
              grup = "riwayat";
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
                  : role.label +
                    (role.slots > 1 ? " (x" + role.slots + ")" : ""),
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
                        box.appendChild(
                          schedBuildChip(pid, wk, role.key, admin),
                        );
                      });
                      if (admin && arr.length < batasSlot(role.key))
                        box.appendChild(buildAddPicker(wk, role.key, arr));
                    }
                    if (admin)
                      box.appendChild(buildTutupBtn(wk, role.key, tutup));
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
                  var kartu =
                    lab.parentElement && lab.parentElement.parentElement;
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
                    if (sched.izin[p.id].indexOf(wk) < 0)
                      sched.izin[p.id].push(wk);
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
          if (cloudReady && dbRef && !applyingRemote) {
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
          if (!core || core === "." || /^[\u2013\u2014-]+$/.test(core))
            return token;
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
              /^\s+$/.test(part)
                ? part
                : transposeToken(part, shift, targetKey),
            )
            .join("");
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
            if (
              /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|\d|\/|\(|\)|\+|-)*$/i.test(
                c,
              )
            )
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
              ch.className = "ic-ch";
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
            div.textContent = formatChordSpacing(
              transposeLine(line, shift, target),
            );
          } else if (sectionWords.test(line.trim())) {
            div.className = "line section";
            var pm = parseSecMod(line);
            div.textContent = pm.clean;
            if (pm.offset) {
              var mb = document.createElement("span");
              mb.className = "modBadge";
              mb.textContent =
                " (" + (pm.offset > 0 ? "+" : "") + pm.offset + ")";
              div.appendChild(mb);
            }
          } else {
            div.className = "line";
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
          var key = (
            document.getElementById("editOriginalKey").value || "C"
          ).trim();
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
            .forEach((b) =>
              b.classList.toggle("active", b.dataset.id === song.id),
            );
          document
            .querySelectorAll(".keyBtn")
            .forEach((b) =>
              b.classList.toggle("active", b.dataset.key === target),
            );
          document.getElementById("currentSongPill").textContent =
            (song.num || "") + ". " + song.title;
          document.getElementById("currentKeyPill").textContent =
            target === song.originalKey
              ? "Nada " + target + " (asli)"
              : "Nada " + target + " (asli " + song.originalKey + ")";
          document.getElementById("songTitle").textContent = song.title;
          document.getElementById("keyLine").textContent =
            "Nada asli " +
            song.originalKey +
            " \u2192 ditampilkan di " +
            target;
          document.getElementById("sourceLine").textContent = song.source
            ? "Keterangan: " + song.source
            : "";
          renderLinesInto(content, song.lines || [], shift, target);
          if (typeof broadcastLive === "function") broadcastLive();
        }
        // --- Editor lagu: ubah, tambah, duplikat, dan hapus ---
        function openEditor() {
          const song = currentSong();
          document.getElementById("editTitle").value = song.title;
          document.getElementById("editOriginalKey").value = song.originalKey;
          document.getElementById("editSource").value = song.source || "";
          document.getElementById("editYoutube").value = song.youtube || "";
          document.getElementById("editLines").value = (song.lines || []).join(
            "\n",
          );
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
              out.push(
                header + (mod ? " (" + (mod > 0 ? "+" : "") + mod + ")" : ""),
              );
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
          var name = document.createElement("span");
          name.className = "sbName";
          name.textContent = header || "(pembuka)";
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
            var d = secDesc(header);
            if (d) {
              var dp = document.createElement("p");
              dp.className = "sbDesc";
              dp.textContent = d;
              wrap.appendChild(dp);
            }
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
              canvas.appendChild(
                buildBlockEl(b.header, b.mod, b.body.join("\n")),
              );
            },
          );
        }
        function addSection(name) {
          var canvas = document.getElementById("structCanvas");
          var el = buildBlockEl(name, 0, "");
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
            btn.innerHTML = structMode
              ? "\uD83D\uDCDD Mode teks"
              : "\uD83E\uDDE9 Mode struktur";
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
            const data = JSON.parse(
              document.getElementById("backupText").value,
            );
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
        document.getElementById("copyBtn").onclick = async () => {
          const t = document.getElementById("sheet").innerText;
          try {
            await navigator.clipboard.writeText(t);
            alert("Lagu sudah disalin.");
          } catch (e) {
            alert(
              "Penyalinan otomatis gagal. Blok teks lagu lalu salin manual.",
            );
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
            if (!izinFormOpen && !isAdmin) {
              btn.disabled = true;
              btn.textContent = "Form izin ditutup admin";
              btn.style.opacity = "0.6";
            } else {
              btn.disabled = false;
              btn.textContent = "Kirim izin";
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
          try { intro.setSpeed(0.9); } catch (e) {}
          el._lottie = intro;
          el._seqPhase = "intro";
          intro.addEventListener("complete", function () {
            try { intro.destroy(); } catch (e) {}
            el.innerHTML = "";
            var idle = lottie.loadAnimation({
              container: el,
              renderer: "svg",
              loop: true,
              autoplay: true,
              animationData: seq.idle,
              rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
            });
            try { idle.setSpeed(0.8); } catch (e) {}
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
              try { loadSeqIcon(el, window.__SEQ[seqKey]); } catch (e) {}
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
            try { if (el._lottie) el._lottie.destroy(); } catch (e) {}
            el.innerHTML = "";
            try { loadSeqIcon(el, window.__SEQ[seqKey]); } catch (e) {}
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
              try { _loadInst.destroy(); } catch (e) {}
              _loadInst = null;
            }
            host.innerHTML = "";
            var data = animData("loadingafter") || animData("centang") || animData("check");
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
            noteOv =
              JSON.parse(localStorage.getItem(NOTE_OV_KEY) || "{}") || {};
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
            return String(b.v || "").localeCompare(
              String(a.v || ""),
              undefined,
              {
                numeric: true,
              },
            );
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
                if (confirm("Hapus catatan versi " + n.v + "?"))
                  deleteNote(n._key);
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
          document
            .querySelectorAll("#izinWeeks .weekChip.on")
            .forEach(function (b) {
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
                    id:
                      "p-" +
                      Date.now() +
                      "-" +
                      Math.floor(Math.random() * 10000),
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
                  id:
                    "p-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
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
        }
        function hideYtBar() {
          var b = document.getElementById("ytBar");
          if (b) b.classList.remove("open");
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
                  return (
                    (s.title || "").toLowerCase() === item.title.toLowerCase()
                  );
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
          if (qi) setTimeout(function () { qi.focus(); }, 80);
        }
        function closeOnlineSearch() {
          if (_olAudio) { try { _olAudio.pause(); } catch (e) {} }
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
          var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
          fetch(url, ctrl ? { signal: ctrl.signal } : {})
            .then(function (r) { return r && r.ok ? r.json() : null; })
            .then(function (j) {
              clearTimeout(to);
              if (j && j.results) finish(j.results, null);
              else jsonp();
            })
            .catch(function () { clearTimeout(to); jsonp(); });
          // 2) Fallback JSONP kalau fetch gagal/diblokir
          function jsonp() {
            if (done) return;
            var cbName = "__itunesCb" + Date.now();
            var sc = document.createElement("script");
            var timer = setTimeout(function () { cleanup(); finish(null, "timeout"); }, 10000);
            function cleanup() {
              clearTimeout(timer);
              try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
              if (sc.parentNode) sc.parentNode.removeChild(sc);
            }
            window[cbName] = function (data) {
              cleanup();
              finish(data && data.results ? data.results : [], null);
            };
            sc.onerror = function () { cleanup(); finish(null, "network"); };
            sc.src = url + "&callback=" + cbName;
            document.body.appendChild(sc);
          }
        }
        function fetchLyrics(artist, title) {

          return new Promise(function (resolve) {
            var url =
              "https://api.lyrics.ovh/v1/" +
              encodeURIComponent(artist) + "/" + encodeURIComponent(title);
            var ctrl =
              typeof AbortController !== "undefined" ? new AbortController() : null;
            var to = setTimeout(function () { if (ctrl) ctrl.abort(); resolve(null); }, 8000);
            fetch(url, ctrl ? { signal: ctrl.signal } : {})
              .then(function (r) { return r && r.ok ? r.json() : null; })
              .then(function (j) { clearTimeout(to); resolve(j && j.lyrics ? j.lyrics : null); })
              .catch(function () { clearTimeout(to); resolve(null); });
          });
        }
        function olPlay(url, btn) {
          if (!url) { toast("Pratinjau tidak tersedia untuk lagu ini.", "info"); return; }
          if (_olAudio && _olBtn === btn) {
            if (_olAudio.paused) { _olAudio.play(); btn.textContent = "⏸"; }
            else { _olAudio.pause(); btn.textContent = "▶"; }
            return;
          }
          if (_olAudio) { try { _olAudio.pause(); } catch (e) {} if (_olBtn) _olBtn.textContent = "▶"; }
          _olAudio = new Audio(url);
          _olBtn = btn;
          _olAudio.onended = function () { btn.textContent = "▶"; };
          var p = _olAudio.play();
          if (p && p.then)
            p.then(function () { btn.textContent = "⏸"; }).catch(function () {
              toast("Gagal memutar pratinjau.", "error");
            });
          else btn.textContent = "⏸";
        }
        function olAddToBank(item, btn) {
          var title =
            (item.trackName || "Lagu") +
            (item.artistName ? " (" + item.artistName + ")" : "");
          if (btn) { btn.disabled = true; btn.textContent = "Menambahkan..."; }
          var master = {
            bankId: "bank-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
            title: title,
            num: "",
            originalKey: "C",
            source:
              "iTunes: " + (item.artistName || "") +
              (item.collectionName ? " — " + item.collectionName : ""),
            youtube: "",
            lines: ["(Lirik sedang diambil...)"],
            cat: "other",
          };
          bankSongs.push(master);
          saveBank();
          fetchLyrics(item.artistName || "", item.trackName || "").then(function (lyr) {
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
              bankSongs[i].lines = lines.length ? lines : ["(Lirik kosong — isi manual)"];
            } else {
              bankSongs[i].lines = [
                "Bait :",
                "(Lirik tidak ditemukan otomatis — isi manual di sini)",
              ];
            }
            saveBank();
            try { backupMaybe("bank"); } catch (e) {}
            refreshLibrary();
            toast("'" + title + "' ditambahkan ke Bank (folder Lainnya).", "success");
            if (btn) { btn.textContent = "✓ Ditambahkan"; }
          });
        }
        function renderOnlineResults(list) {
          var box = document.getElementById("onlineResults");
          if (!box) return;
          box.innerHTML = "";
          if (list === null) {
            var e0 = document.createElement("p");
            e0.className = "small bankEmpty";
            e0.textContent = "Gagal terhubung ke sumber pencarian. Periksa koneksi lalu coba lagi.";
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
            play.onclick = function () { olPlay(item.previewUrl, play); };
            var add = document.createElement("button");
            add.type = "button";
            add.className = "scBtn primary";
            add.textContent = "+ Bank";
            add.onclick = function () { olAddToBank(item, add); };
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
          if (!term) { if (box) box.innerHTML = ""; return; }
          if (box) box.innerHTML = "<p class='small bankEmpty'>Mencari...</p>";
          itunesSearch(term, function (results, err) {
            if (err) { renderOnlineResults(null); return; }
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
          { key: "worship", label: "Worship", icon: "🙏" },
          { key: "praise", label: "Praise", icon: "🎉" },
          { key: "other", label: "Lainnya", icon: "📁" },
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
          toast("Dipindahkan ke folder " + bankCatLabel(bankSongs[i].cat) + ".", "success");
        }
        function buildBankCard(s) {
          var setSong = songs.find(function (x) {
            return x.bankId === s.bankId;
          });
          var inSet = !!setSong;
          var card = document.createElement("div");
          card.className = "songCard";
          var info = document.createElement("div");
          info.className = "scInfo";
          var t = document.createElement("b");
          t.textContent = s.title;
          if (inSet) {
            var tag = document.createElement("span");
            tag.className = "inSet";
            tag.textContent = " ✓ di daftar";
            t.appendChild(tag);
          }
          var meta = document.createElement("span");
          meta.textContent =
            "Nada dasar " + s.originalKey + (s.source ? " • " + s.source : "");
          info.appendChild(t);
          info.appendChild(meta);
          var btns = document.createElement("div");
          btns.className = "scBtns";
          var pull = document.createElement("button");
          pull.type = "button";
          pull.className = "scBtn primary";
          pull.textContent = inSet ? "Buka" : "Tarik ke daftar";
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
          f.className = "folderCard";
          var ico = document.createElement("span");
          ico.className = "folderIco";
          ico.textContent = c.icon;
          var nm = document.createElement("b");
          nm.textContent = c.label;
          var ct = document.createElement("span");
          ct.className = "small";
          ct.textContent = n + " lagu";
          f.appendChild(ico);
          f.appendChild(nm);
          f.appendChild(ct);
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
              renderBankEmpty(box, bankSongs.length ? "Tidak ada lagu yang cocok." : emptyMsg);
              return;
            }
            results.forEach(function (s) {
              box.appendChild(buildBankCard(s));
            });
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
            return;
          }
          renderBankCrumb(box, bankCatLabel(currentBankFolder), false);
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
              "Hapus '" +
                master.title +
                "' dari BANK lagu? Tindakan ini permanen.",
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
            bankId:
              "bank-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
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
              metroCtx = new (
                window.AudioContext || window.webkitAudioContext
              )();
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
          return Number.isInteger(v)
            ? String(v)
            : String(Math.round(v * 100) / 100);
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
          const rows = Array.from(songButtons.children).filter(
            (r) => r !== dragRow,
          );
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
                r.style.transition =
                  "transform .2s cubic-bezier(.2,.9,.25,1.25)";
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
              if (ghost && ghost.parentNode)
                ghost.parentNode.removeChild(ghost);
            }, 210);
          }
          const order = Array.from(songButtons.children).map(
            (r) => r.dataset.id,
          );
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
            document
              .getElementById("menuBackdrop")
              .classList.add("dragging-bank");
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
          document
            .getElementById("menuBackdrop")
            .classList.remove("dragging-bank");
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
            if (
              window.innerHeight + window.scrollY >=
              document.body.scrollHeight - 2
            )
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
          document.body.classList.toggle("dark", on);
          try {
            localStorage.setItem("ptDark", on ? "1" : "0");
          } catch (e) {}
          const b = document.getElementById("darkToggle");
          if (b) b.textContent = on ? "Mode terang" : "Mode gelap";
        }
        function toggleDark() {
          applyDark(!document.body.classList.contains("dark"));
        }
        function applyEye(on) {
          document.body.classList.toggle("eye", on);
          try {
            localStorage.setItem("ptEye", on ? "1" : "0");
          } catch (e) {}
          const b = document.getElementById("eyeToggle");
          if (b) b.textContent = on ? "Eye saver: aktif" : "Eye saver";
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
            b.textContent = on
              ? "Chord jadi huruf (A-G)"
              : "Chord jadi angka (1-7)";
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
            applyDark(localStorage.getItem("ptDark") === "1");
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
          setTimeout(seedBankFromSongs, 1800);
          var spx = document.getElementById("spectateToggle");
          if (spx) spx.onclick = toggleSpectate;
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
                          toast(
                            "Versi baru dimuat, menyegarkan...",
                            "info",
                            1400,
                          );
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
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              function () {
                if (swRefreshing) return;
                swRefreshing = true;
                window.location.reload();
              },
            );
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
          document
            .querySelectorAll("#izinWeeks .weekChip")
            .forEach(function (b) {
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
          ];
          function csIsBoundary(ch) {
            if (ch === undefined) return true;
            var c = ch.charCodeAt(0);
            return (
              c === 32 ||
              c === 9 ||
              c === 10 ||
              c === 13 ||
              ch === "[" ||
              ch === "]"
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
            if (t)
              t.style.display = t.style.display === "none" ? "block" : "none";
          };
          loadYtApi();
          renderBank();
          refreshLibrary();
          restorePrefs();
        }

        // Jalankan aplikasi: gambar tampilan, lalu coba sambungkan ke server online.
        makeButtons();
        render();
        initExtras();
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", initCloud);
        } else {
          initCloud();
        }
      })();
