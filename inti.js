/* ============================================================
   DOJO FUNCTION A - INTI
   Kanvas, proyeksi perspektif, buffer adegan, antrean gambar,
   status konektor, komunikasi ESP32, dan loop utama.
   ============================================================ */

window.DOJO = (function () {

  var D = {};

  // ---------- pengaturan ----------
  D.ALAMAT = "http://192.168.4.1/status";
  D.JEDA_POLL = 150;
  D.BATAS_PUTUS = 1500;

  D.TINGGI_MATA = 1.35;
  D.POSISI_MATA = -1.45;
  D.LEBAR_LAJUR = 3.5;
  D.LAJU_DASAR = 21;

  // Tingkat kualitas. dpr = kerapatan piksel, adegan = skala buffer adegan,
  // tetes = jumlah maksimum butiran air di kaca.
  var KUALITAS = {
    tinggi: { dpr: 1.5,  adegan: 1.00, tetes: 1500 },
    sedang: { dpr: 1.15, adegan: 0.72, tetes: 900 },
    rendah: { dpr: 0.85, adegan: 0.55, tetes: 520 }
  };
  D.mutu = KUALITAS.sedang;

  // ---------- elemen ----------
  var el = {};
  D.el = el;

  // ---------- kanvas ----------
  var kanvas, ctxUtama, bufKanvas, ctxBuf;
  D.W = 1280; D.H = 720;
  D.VX = 640; D.HY = 310; D.F = 1100;
  D.cermin = false;
  D.ctx = null;

  D.px = function (u, z) {
    var x = (u - D.POSISI_MATA) * D.F / z;
    return D.VX + (D.cermin ? -x : x);
  };
  D.py = function (h, z) {
    return D.HY + (D.TINGGI_MATA - h) * D.F / z;
  };

  // ---------- gradien yang dipakai berulang ----------
  D.grad = {};
  function bangunGradien() {
    var W = D.W, H = D.H, g;

    g = ctxUtama.createRadialGradient(W / 2, H / 2, H * 0.40, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.5)");
    D.grad.vignetteDepan = g;

    g = ctxUtama.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 1.0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    D.grad.vignetteBelakang = g;

    g = ctxUtama.createLinearGradient(0, H * 0.83, 0, H);
    g.addColorStop(0, "rgba(9,10,12,0)");
    g.addColorStop(1, "rgba(9,10,12,0.97)");
    D.grad.dasbor = g;

    g = ctxUtama.createLinearGradient(0, H, 0, H * 0.42);
    g.addColorStop(0, "rgba(224,52,40,0.42)");
    g.addColorStop(1, "rgba(224,52,40,0)");
    D.grad.pendarRem = g;
  }

  // Gradien untuk buffer adegan dibuat ulang saat ukuran berubah.
  D.gradBuf = {};
  function bangunGradienBuf() {
    var W = D.W, H = D.H, HY = D.HY, g;

    g = ctxBuf.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, "#20252c"); g.addColorStop(1, "#4c5563");
    D.gradBuf.langitHujan = g;

    g = ctxBuf.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, "#171c24"); g.addColorStop(1, "#3d4654");
    D.gradBuf.langitSenja = g;

    g = ctxBuf.createLinearGradient(0, HY - H * 0.02, 0, HY + H * 0.07);
    g.addColorStop(0, "rgba(120,134,150,0.30)");
    g.addColorStop(1, "rgba(120,134,150,0)");
    D.gradBuf.kabut = g;
  }

  D.ukur = function () {
    var r = kanvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, D.mutu.dpr);
    D.W = Math.max(640, Math.round(r.width * dpr));
    D.H = Math.max(360, Math.round(r.height * dpr));
    kanvas.width = D.W;
    kanvas.height = D.H;
    D.VX = D.W * 0.5;
    D.HY = D.H * 0.43;
    D.F = D.W * 0.86;
    bangunGradien();
    siapkanBuffer(1);
    if (D.simAktif && D.daftarSim[D.simAktif].ukur) D.daftarSim[D.simAktif].ukur();
  };

  var skalaBufSaatIni = 0;
  function siapkanBuffer(skala) {
    var w = Math.max(320, Math.round(D.W * skala));
    var h = Math.max(180, Math.round(D.H * skala));
    if (bufKanvas.width !== w || bufKanvas.height !== h) {
      bufKanvas.width = w;
      bufKanvas.height = h;
      skalaBufSaatIni = skala;
      bangunGradienBuf();
    }
  }

  /* Menggambar adegan jalan ke buffer beresolusi lebih rendah, lalu
     menempelkannya ke kanvas utama. Semakin buram kacanya, semakin
     kecil buffer yang dipakai, jadi kaca yang buram justru lebih ringan. */
  D.mulaiAdegan = function (kekaburan) {
    var skala = D.mutu.adegan * (1 - Math.min(kekaburan, 1) * 0.55);
    skala = Math.max(0.22, Math.min(1, skala));
    // dibulatkan supaya buffer tidak dibuat ulang tiap frame
    skala = Math.round(skala * 12) / 12;
    siapkanBuffer(skala);
    ctxBuf.setTransform(bufKanvas.width / D.W, 0, 0, bufKanvas.height / D.H, 0, 0);
    ctxBuf.clearRect(0, 0, D.W, D.H);
    D.ctx = ctxBuf;
  };

  D.selesaiAdegan = function (kekaburan) {
    D.ctx = ctxUtama;
    ctxUtama.save();
    var b = kekaburan * 6.5;
    if (b > 0.3) ctxUtama.filter = "blur(" + b.toFixed(1) + "px)";
    ctxUtama.imageSmoothingEnabled = true;
    ctxUtama.imageSmoothingQuality = "low";
    ctxUtama.drawImage(bufKanvas, 0, 0, bufKanvas.width, bufKanvas.height, 0, 0, D.W, D.H);
    ctxUtama.restore();
  };

  // ---------- utilitas gambar ----------
  D.acak = function (i) {
    var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  D.bulat = function (x, y, w, h, r) {
    var c = D.ctx;
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  D.pitaJalan = function (u1, u2, z1, z2, warna) {
    var c = D.ctx;
    c.fillStyle = warna;
    c.beginPath();
    c.moveTo(D.px(u1, z1), D.py(0, z1));
    c.lineTo(D.px(u2, z1), D.py(0, z1));
    c.lineTo(D.px(u2, z2), D.py(0, z2));
    c.lineTo(D.px(u1, z2), D.py(0, z2));
    c.closePath();
    c.fill();
  };

  /* ---------- antrean gambar berurut jarak ----------
     Memakai kolam objek supaya tidak membuat objek baru tiap frame. */
  var kolam = [], isiAntrean = 0;
  D.penggambar = {};

  D.antre = function (z, jenis, u, warna, bendera, lebarMeter) {
    var it = kolam[isiAntrean];
    if (!it) { it = {}; kolam[isiAntrean] = it; }
    it.z = z; it.jenis = jenis; it.u = u;
    it.warna = warna; it.bendera = bendera; it.lebar = lebarMeter;
    isiAntrean++;
  };

  D.gambarAntrean = function () {
    var aktif = kolam.slice(0, isiAntrean);
    aktif.sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < aktif.length; i++) {
      var f = D.penggambar[aktif[i].jenis];
      if (f) f(aktif[i]);
    }
    isiAntrean = 0;
  };

  // ---------- status konektor ----------
  D.STATE = "LEPAS";                 // "TERPASANG" | "LEPAS"

  var pesanSim = {
    wiper: {
      TERPASANG: { nada: "aman", judul: "Konektor terpasang",
        pesan: "Motor wiper mendapat arus. Wiper menyapu terus, pandangan bersih, pengemudi sempat melihat antrean yang mengerem." },
      LEPAS: { nada: "bahaya", judul: "Konektor lepas",
        pesan: "Motor wiper tidak mendapat arus. Wiper diam, air menumpuk, dan pengemudi kehilangan pandangan ke jalan." }
    },
    stoplamp: {
      TERPASANG: { nada: "aman", judul: "Konektor terpasang",
        pesan: "Stop lamp switch terhubung. Begitu Anda menginjak rem, lampu belakang menyala dan pengemudi di belakang punya waktu untuk ikut mengerem." },
      LEPAS: { nada: "bahaya", judul: "Konektor lepas",
        pesan: "Stop lamp switch tidak terhubung. Anda mengerem, tetapi lampu belakang tetap mati dan pengemudi di belakang tidak tahu Anda melambat." }
    }
  };

  function perbaruiBilah() {
    if (!D.simAktif) {
      el.bilah.className = "";
      el.judulStatus.textContent = "Siap";
      el.pesanStatus.textContent = "Pilih simulasi untuk mulai.";
      return;
    }
    var k = pesanSim[D.simAktif][D.STATE];
    el.bilah.className = k.nada;
    el.judulStatus.textContent = k.judul;
    el.pesanStatus.textContent = k.pesan;
  }
  D.perbaruiBilah = perbaruiBilah;

  D.pasangState = function (s) {
    if (s === "TERKUNCI" || s === "HALF_LOCK") s = "TERPASANG";
    if (s !== "TERPASANG" && s !== "LEPAS") return;
    if (s === D.STATE) return;
    D.STATE = s;
    perbaruiPanel();
    perbaruiBilah();
    if (!D.simAktif) return;

    if (D.fase === "HASIL") {
      if (s === "TERPASANG") D.ulangi();
      return;
    }
    var sim = D.daftarSim[D.simAktif];
    if (D.fase === "JALAN" && sim.ubahState) sim.ubahState(s);
  };

  // ---------- indikator alat ----------
  var alatHidup = false, balasanTerakhir = 0, timerKabar = null;

  function tampilkanKabar(teks, putus) {
    el.kabar.textContent = teks;
    el.kabar.classList.toggle("putus", !!putus);
    el.kabar.classList.add("tampak");
    clearTimeout(timerKabar);
    timerKabar = setTimeout(function () { el.kabar.classList.remove("tampak"); }, 3600);
  }

  function perbaruiPanel() {
    if (alatHidup) {
      el.panelAlat.classList.add("hidup");
      el.menuStatus.classList.add("hidup");
      el.alatJudul.textContent = "ESP32 tersambung";
      el.alatRinci.textContent = "Konektor terbaca: " + (D.STATE === "TERPASANG" ? "terpasang" : "lepas");
      el.menuTeks.textContent = "ESP32 tersambung, alat siap dipakai";
    } else {
      el.panelAlat.classList.remove("hidup");
      el.menuStatus.classList.remove("hidup");
      el.alatJudul.textContent = "ESP32 belum tersambung";
      el.alatRinci.textContent = "Sementara pakai tombol 1 dan 2";
      el.menuTeks.textContent = "Alat belum terbaca, bisa pakai tombol 1 dan 2";
    }
  }

  function detak() {
    el.denyut.classList.add("pukul");
    setTimeout(function () { el.denyut.classList.remove("pukul"); }, 110);
  }

  function ambilStatus() {
    var batal = new AbortController();
    var waktu = setTimeout(function () { batal.abort(); }, 1200);

    fetch(D.ALAMAT, { signal: batal.signal, cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        clearTimeout(waktu);
        balasanTerakhir = performance.now();
        detak();
        if (!alatHidup) {
          alatHidup = true;
          tampilkanKabar("ESP32 tersambung, konektor siap dipakai", false);
        }
        D.pasangState(d.state);
        perbaruiPanel();
      })
      .catch(function () {
        clearTimeout(waktu);
        if (alatHidup && performance.now() - balasanTerakhir > D.BATAS_PUTUS) {
          alatHidup = false;
          tampilkanKabar("ESP32 terputus, kembali ke tombol 1 dan 2", true);
          perbaruiPanel();
        }
      })
      .finally(function () { setTimeout(ambilStatus, D.JEDA_POLL); });
  }

  // ---------- tabrakan ----------
  D.retak = [];
  var judulTabrak = "", sebabTabrak = "";
  D.tTabrak = 0;

  function buatRetak() {
    D.retak = [];
    var pxx = D.W * 0.5, pyy = D.H * 0.42;
    for (var i = 0; i < 16; i++) {
      var a = (i / 16) * 6.2832 + Math.random() * 0.3;
      var seg = [], x = pxx, y = pyy;
      var panjang = D.H * (0.22 + Math.random() * 0.55);
      var langkah = 6 + Math.floor(Math.random() * 5);
      for (var s = 0; s < langkah; s++) {
        a += (Math.random() - 0.5) * 0.55;
        x += Math.cos(a) * (panjang / langkah);
        y += Math.sin(a) * (panjang / langkah);
        seg.push(x, y);
      }
      D.retak.push({ x: pxx, y: pyy, seg: seg });
    }
  }

  function gambarRetak(alpha) {
    var c = D.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.lineCap = "round";
    for (var i = 0; i < D.retak.length; i++) {
      var r = D.retak[i];
      c.beginPath();
      c.moveTo(r.x, r.y);
      for (var s = 0; s < r.seg.length; s += 2) c.lineTo(r.seg[s], r.seg[s + 1]);
      c.strokeStyle = "rgba(120,140,160,0.35)"; c.lineWidth = 6; c.stroke();
      c.strokeStyle = "rgba(238,244,250,0.75)"; c.lineWidth = 2.4; c.stroke();
    }
    c.fillStyle = "rgba(226,238,248,0.30)";
    c.beginPath();
    c.arc(D.W * 0.5, D.H * 0.42, D.H * 0.055, 0, 6.2832);
    c.fill();
    c.restore();
  }

  D.mulaiTabrakan = function (now, judul, sebab) {
    D.fase = "TABRAK";
    D.tTabrak = now;
    judulTabrak = judul;
    sebabTabrak = sebab;
    buatRetak();
  };

  function tampilkanHasil() {
    D.fase = "HASIL";
    el.hasilJudul.textContent = judulTabrak;
    el.hasilSebab.textContent = sebabTabrak;
    el.hasil.classList.add("tampak");
  }

  // ---------- alur aplikasi ----------
  D.daftarSim = {};
  D.simAktif = null;
  D.fase = "MENU";
  D.jarakTempuh = 0;
  D.lajuKita = D.LAJU_DASAR;
  D.waktuJalan = 0;

  D.bukaMenu = function () {
    D.simAktif = null;
    D.fase = "MENU";
    el.menu.classList.add("tampak");
    el.hasil.classList.remove("tampak");
    el.tombolMenu.classList.remove("tampak");
    el.hud.classList.remove("tampak");
    perbaruiBilah();
  };

  D.pilihSimulasi = function (nama) {
    if (!D.daftarSim[nama]) return;
    D.simAktif = nama;
    el.menu.classList.remove("tampak");
    el.tombolMenu.classList.add("tampak");
    el.hud.classList.toggle("tampak", !!D.daftarSim[nama].pakaiHud);
    D.ukur();
    perbaruiBilah();
    D.ulangi();
  };

  D.ulangi = function () {
    el.hasil.classList.remove("tampak");
    D.fase = "JALAN";
    D.waktuJalan = 0;
    D.jarakTempuh = 0;
    D.lajuKita = D.LAJU_DASAR;
    D.retak = [];
    D.daftarSim[D.simAktif].reset();
  };

  // ---------- loop ----------
  var terakhir = 0, hitungFrame = 0, waktuFps = 0;

  function bingkai(now) {
    requestAnimationFrame(bingkai);
    if (D.fase === "MENU" || !D.simAktif) { terakhir = now; return; }

    var dt = Math.min((now - terakhir) / 1000, 0.05);
    terakhir = now;

    hitungFrame++;
    if (now - waktuFps > 500) {
      el.fps.textContent = Math.round(hitungFrame * 1000 / (now - waktuFps)) + " fps";
      hitungFrame = 0; waktuFps = now;
    }

    var sim = D.daftarSim[D.simAktif];
    if (D.fase === "JALAN") {
      D.waktuJalan += dt;
      sim.maju(now, dt);
    }

    var goyang = 0;
    if (D.fase === "TABRAK" || D.fase === "HASIL") {
      goyang = Math.max(0, 1 - (now - D.tTabrak) / 750) * D.H * 0.035;
    }

    D.ctx = ctxUtama;
    ctxUtama.save();
    if (goyang > 0) ctxUtama.translate((Math.random() - 0.5) * goyang, (Math.random() - 0.5) * goyang);

    sim.gambar(now);

    if (D.fase === "TABRAK" || D.fase === "HASIL") {
      var u = (now - D.tTabrak) / 1000;
      if (u < 0.18) {
        ctxUtama.fillStyle = "rgba(255,255,255," + (1 - u / 0.18).toFixed(3) + ")";
        ctxUtama.fillRect(0, 0, D.W, D.H);
      }
      if (u > 0.12) gambarRetak(Math.min((u - 0.12) / 0.25, 1));
      if (D.fase === "TABRAK" && u > 1.6) tampilkanHasil();
    }
    ctxUtama.restore();
  }

  // ---------- mulai ----------
  D.mulai = function () {
    kanvas = document.getElementById("kanvas");
    ctxUtama = kanvas.getContext("2d");
    bufKanvas = document.createElement("canvas");
    ctxBuf = bufKanvas.getContext("2d");
    D.ctx = ctxUtama;

    el.bilah = document.getElementById("bilah");
    el.judulStatus = document.getElementById("judul-status");
    el.pesanStatus = document.getElementById("pesan-status");
    el.menu = document.getElementById("menu");
    el.hasil = document.getElementById("hasil");
    el.hasilJudul = document.getElementById("hasilJudul");
    el.hasilSebab = document.getElementById("hasilSebab");
    el.tombolMenu = document.getElementById("tombolMenu");
    el.hud = document.getElementById("hud");
    el.hudPedal = document.getElementById("hudPedal");
    el.hudLampu = document.getElementById("hudLampu");
    el.hudJarak = document.getElementById("hudJarak");
    el.panelAlat = document.getElementById("panelAlat");
    el.denyut = document.getElementById("denyut");
    el.alatJudul = document.getElementById("alatJudul");
    el.alatRinci = document.getElementById("alatRinci");
    el.kabar = document.getElementById("kabar");
    el.menuStatus = document.getElementById("menuStatus");
    el.menuTeks = document.getElementById("menuTeks");
    el.fps = document.getElementById("fps");

    document.getElementById("ulang").addEventListener("click", function () { D.ulangi(); });
    document.getElementById("keMenu").addEventListener("click", D.bukaMenu);
    el.tombolMenu.addEventListener("click", D.bukaMenu);

    var kartu = document.querySelectorAll(".kartu");
    for (var i = 0; i < kartu.length; i++) {
      kartu[i].addEventListener("click", function () {
        D.pilihSimulasi(this.getAttribute("data-sim"));
      });
    }

    var pilih = document.getElementById("kualitas");
    pilih.addEventListener("change", function () {
      D.mutu = KUALITAS[this.value] || KUALITAS.sedang;
      D.ukur();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "1") D.pasangState("TERPASANG");
      if (e.key === "2" || e.key === "3") D.pasangState("LEPAS");
      if ((e.key === "r" || e.key === "R" || e.key === "0") && D.simAktif) D.ulangi();
      if (e.key === "m" || e.key === "M" || e.key === "Escape") D.bukaMenu();
      if (e.key === "f" || e.key === "F") el.fps.classList.toggle("tampak");
    });

    window.addEventListener("resize", D.ukur);

    D.ukur();
    perbaruiPanel();
    perbaruiBilah();
    requestAnimationFrame(bingkai);
    ambilStatus();
  };

  return D;
})();
