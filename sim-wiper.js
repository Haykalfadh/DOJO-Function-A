/* ============================================================
   DOJO FUNCTION A - SIMULASI WIPER
   Hujan deras, air di kaca, wiper tandem, tabrakan depan.
   ============================================================ */

(function (D) {

  var PARKIR = -0.80, UJUNG = 0.44, PERIODE_SAPUAN = 1.45;

  var basah = 0.16, wiperHidup = false;
  var majuSapuan = 0, sudut = PARKIR, sudutSebelum = PARKIR;
  var tetes = [], jejak = [];
  var intensitas = 1, sisaHembusan = 0, jedaHembusan = 5;
  var dekat = 0.16, remDepan = false;
  var lawan = [], searah = [];
  var pivot = [];

  // kisi untuk mempercepat penyerapan butiran
  var kisi = {}, UKURAN_KISI = 40;

  function hitungPivot() {
    pivot = [
      { x: D.W * 0.25, y: D.H * 1.06, panjang: D.H * 0.86, tebal: 0.85 },
      { x: D.W * 0.63, y: D.H * 1.06, panjang: D.H * 1.00, tebal: 1.00 }
    ];
  }

  function isiLaluLintas() {
    var L = D.LEBAR_LAJUR;
    lawan = [];
    for (var i = 0; i < 9; i++) {
      lawan.push({
        z: 25 + i * 22 + D.acak(i) * 14,
        u: L * 0.5 + (D.acak(i + 90) - 0.5) * 0.5,
        laju: 17 + D.acak(i + 40) * 9,
        warna: ["#2f3944", "#3c3a3a", "#26313c", "#453f38", "#2b3b36"][i % 5],
        besar: D.acak(i + 7) < 0.22
      });
    }
    searah = [];
    for (var j = 0; j < 3; j++) {
      searah.push({
        z: 78 + j * 30 + D.acak(j + 200) * 16,
        u: -L * 0.5 + (D.acak(j + 300) - 0.5) * 0.4,
        laju: 19 + D.acak(j + 11) * 4,
        warna: ["#333c46", "#3e3a35", "#2a3540"][j % 3]
      });
    }
  }

  function majuLaluLintas(dt) {
    var i;
    for (i = 0; i < lawan.length; i++) {
      lawan[i].z -= (D.lajuKita + lawan[i].laju) * dt;
      if (lawan[i].z < 4) {
        lawan[i].z += 190 + Math.random() * 60;
        lawan[i].besar = Math.random() < 0.22;
      }
    }
    for (i = 0; i < searah.length; i++) {
      searah[i].z -= (D.lajuKita - searah[i].laju) * dt;
      if (searah[i].z > 200) searah[i].z = 70 + Math.random() * 20;
      if (searah[i].z < 62) searah[i].z = 62;
    }
  }

  // ---------------------------------------------------------
  //  RITME HUJAN
  // ---------------------------------------------------------
  function ritmeHujan(dt, now) {
    var t = now / 1000;
    var dasar = 0.62 + 0.30 * Math.sin(t * 0.52) + 0.22 * Math.sin(t * 0.21 + 1.7);
    jedaHembusan -= dt;
    if (jedaHembusan <= 0) {
      sisaHembusan = 1.4 + Math.random() * 2.2;
      jedaHembusan = 6 + Math.random() * 9;
    }
    if (sisaHembusan > 0) {
      sisaHembusan -= dt;
      dasar += 0.85 * Math.min(1, sisaHembusan / 0.6);
    }
    intensitas = Math.max(0.28, dasar);
  }

  function tambahTetes(dt) {
    var batasTetes = D.mutu.tetes;
    var n = Math.round(dt * 260 * intensitas * (batasTetes / 1500));
    for (var i = 0; i < n; i++) {
      if (tetes.length >= batasTetes) break;
      tetes.push({
        x: Math.random() * D.W, y: Math.random() * D.H,
        r: 0.8 + Math.random() * 1.7,
        v: 0, lari: false, sisa: 0,
        goyang: Math.random() * 6.28
      });
    }
    var batasJejak = Math.round(batasTetes * 0.6);
    if (jejak.length > batasJejak) jejak.splice(0, jejak.length - batasJejak);
  }

  function bangunKisi() {
    kisi = {};
    for (var i = 0; i < tetes.length; i++) {
      var t = tetes[i];
      if (t.lari) continue;
      var kx = (t.x / UKURAN_KISI) | 0;
      var ky = (t.y / UKURAN_KISI) | 0;
      var kunci = kx + "," + ky;
      if (!kisi[kunci]) kisi[kunci] = [];
      kisi[kunci].push(i);
    }
  }

  function majuAir(dt) {
    var skalaR = Math.max(0.8, D.W / 1280);
    var adaYangLari = false;
    var i, t;

    for (i = 0; i < tetes.length; i++) {
      t = tetes[i];
      if (!t.lari) {
        t.r += dt * intensitas * (0.55 + Math.random() * 0.85);
        if (t.r > (4.2 + Math.random() * 3.4) * skalaR) {
          t.lari = true;
          t.v = 12 + Math.random() * 18;
        }
      }
      if (t.lari) adaYangLari = true;
    }

    if (adaYangLari) bangunKisi();
    var buang = null;

    for (i = 0; i < tetes.length; i++) {
      t = tetes[i];
      if (!t.lari) continue;

      t.v = Math.min(t.v + 260 * dt, 460);
      t.y += t.v * dt;
      t.x += Math.sin(t.y * 0.02 + t.goyang) * 0.7;
      t.sisa += t.v * dt;

      if (t.sisa > 5) {
        t.sisa = 0;
        jejak.push({ x: t.x + (Math.random() - 0.5) * t.r, y: t.y, r: t.r * (0.24 + Math.random() * 0.2) });
        t.r = Math.max(2.4 * skalaR, t.r - 0.035);
      }

      // hanya periksa sel kisi di sekitar butiran, bukan seluruh butiran
      var kx = (t.x / UKURAN_KISI) | 0, ky = (t.y / UKURAN_KISI) | 0;
      var batas = t.r + 3;
      for (var ax = -1; ax <= 1; ax++) {
        for (var ay = -1; ay <= 1; ay++) {
          var sel = kisi[(kx + ax) + "," + (ky + ay)];
          if (!sel) continue;
          for (var s = 0; s < sel.length; s++) {
            var o = tetes[sel[s]];
            if (!o || o.lari || o === t) continue;
            if (Math.abs(o.x - t.x) > batas || Math.abs(o.y - t.y) > batas) continue;
            t.r += o.r * 0.12;
            o.hapus = true;
            if (!buang) buang = true;
          }
        }
      }

      if (t.y > D.H + 20) { t.hapus = true; buang = true; }
    }

    if (buang) {
      var sisa = [];
      for (i = 0; i < tetes.length; i++) if (!tetes[i].hapus) sisa.push(tetes[i]);
      tetes = sisa;
    }
  }

  function sapuAir(a1, a2) {
    var lo = Math.min(a1, a2), hi = Math.max(a1, a2);
    if (hi - lo < 0.0005) return;
    var adaHapus = false;

    for (var p = 0; p < pivot.length; p++) {
      var pv = pivot[p], i, dx, dy, a, r2 = pv.panjang * pv.panjang;
      for (i = 0; i < tetes.length; i++) {
        if (tetes[i].hapus) continue;
        dx = tetes[i].x - pv.x; dy = pv.y - tetes[i].y;
        if (dy <= 0 || dx * dx + dy * dy > r2) continue;
        a = Math.atan2(dx, dy);
        if (a >= lo - 0.035 && a <= hi + 0.035) { tetes[i].hapus = true; adaHapus = true; }
      }
      for (i = jejak.length - 1; i >= 0; i--) {
        dx = jejak[i].x - pv.x; dy = pv.y - jejak[i].y;
        if (dy <= 0 || dx * dx + dy * dy > r2) continue;
        a = Math.atan2(dx, dy);
        if (a >= lo - 0.035 && a <= hi + 0.035) jejak.splice(i, 1);
      }
    }

    if (adaHapus) {
      var sisa = [];
      for (var k = 0; k < tetes.length; k++) if (!tetes[k].hapus) sisa.push(tetes[k]);
      tetes = sisa;
    }
  }

  function gambarAir() {
    var c = D.ctx, i;

    c.fillStyle = "rgba(216,231,244,0.13)";
    c.beginPath();
    for (i = 0; i < jejak.length; i++) {
      c.moveTo(jejak[i].x + jejak[i].r, jejak[i].y);
      c.arc(jejak[i].x, jejak[i].y, jejak[i].r, 0, 6.2832);
    }
    c.fill();

    // badan butiran, digambar sebagai satu jalur per warna
    c.fillStyle = "rgba(220,233,245,0.20)";
    c.beginPath();
    for (i = 0; i < tetes.length; i++) {
      var t = tetes[i];
      c.moveTo(t.x + t.r, t.y);
      c.arc(t.x, t.y, t.r, 0, 6.2832);
    }
    c.fill();

    // ekor butiran yang meleleh
    c.strokeStyle = "rgba(214,230,244,0.16)";
    c.lineCap = "round";
    for (i = 0; i < tetes.length; i++) {
      var q = tetes[i];
      if (!q.lari) continue;
      c.lineWidth = q.r * 1.15;
      c.beginPath();
      c.moveTo(q.x, q.y);
      c.lineTo(q.x - 1.2, q.y - Math.min(q.r * 5.5, q.v * 0.09));
      c.stroke();
    }

    // kilau dan bayangan
    c.fillStyle = "rgba(255,255,255,0.34)";
    c.beginPath();
    for (i = 0; i < tetes.length; i++) {
      var u = tetes[i], rr = Math.max(0.5, u.r * 0.28);
      c.moveTo(u.x - u.r * 0.33 + rr, u.y - u.r * 0.35);
      c.arc(u.x - u.r * 0.33, u.y - u.r * 0.35, rr, 0, 6.2832);
    }
    c.fill();

    c.fillStyle = "rgba(80,100,120,0.16)";
    c.beginPath();
    for (i = 0; i < tetes.length; i++) {
      var v = tetes[i], rb = Math.max(0.4, v.r * 0.34);
      c.moveTo(v.x + v.r * 0.26 + rb, v.y + v.r * 0.30);
      c.arc(v.x + v.r * 0.26, v.y + v.r * 0.30, rb, 0, 6.2832);
    }
    c.fill();
  }

  // ---------------------------------------------------------
  //  WIPER
  // ---------------------------------------------------------
  function gambarSatuWiper(pv) {
    var c = D.ctx;
    var L = pv.panjang, skala = Math.max(1, D.W / 1280) * pv.tebal;

    c.save();
    c.translate(pv.x, pv.y);
    c.rotate(sudut);

    c.fillStyle = "#0b0d10";
    c.beginPath(); c.arc(0, 0, 11 * skala, 0, 6.2832); c.fill();

    c.fillStyle = "#15181c";
    c.beginPath();
    c.moveTo(-7.5 * skala, 0); c.lineTo(7.5 * skala, 0);
    c.lineTo(3.6 * skala, -L * 0.46); c.lineTo(-3.6 * skala, -L * 0.46);
    c.closePath(); c.fill();

    c.strokeStyle = "rgba(150,160,172,0.30)";
    c.lineWidth = 1.3 * skala;
    c.beginPath();
    c.moveTo(-2.2 * skala, -6 * skala);
    c.lineTo(-1.2 * skala, -L * 0.44);
    c.stroke();

    c.save();
    c.translate(0, -L * 0.44);
    c.rotate(0.05);

    c.fillStyle = "#0d1013";
    c.beginPath(); c.arc(0, 0, 5 * skala, 0, 6.2832); c.fill();

    c.strokeStyle = "#16191d"; c.lineCap = "round"; c.lineWidth = 7.5 * skala;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -L * 0.56); c.stroke();

    c.fillStyle = "#1c2025";
    for (var i = 1; i <= 3; i++) {
      var y = -L * 0.56 * (i / 3.6);
      c.fillRect(-5.5 * skala, y - 2.5 * skala, 11 * skala, 5 * skala);
    }

    c.strokeStyle = "#0a0c0e"; c.lineWidth = 3.4 * skala;
    c.beginPath(); c.moveTo(1.8 * skala, -2 * skala); c.lineTo(1.8 * skala, -L * 0.565); c.stroke();

    c.strokeStyle = "rgba(228,240,250,0.26)"; c.lineWidth = 2 * skala;
    c.beginPath(); c.moveTo(4.6 * skala, -3 * skala); c.lineTo(4.6 * skala, -L * 0.55); c.stroke();

    c.restore();
    c.restore();
  }

  function kabinDepan() {
    var c = D.ctx;
    c.fillStyle = D.grad.dasbor;
    c.fillRect(0, D.H * 0.83, D.W, D.H * 0.17);
    c.fillStyle = D.grad.vignetteDepan;
    c.fillRect(0, 0, D.W, D.H);
  }

  // ---------------------------------------------------------
  //  MODUL SIMULASI
  // ---------------------------------------------------------
  D.daftarSim.wiper = {
    pakaiHud: false,

    ukur: hitungPivot,

    reset: function () {
      basah = 0.16; dekat = 0.16; remDepan = false;
      tetes = []; jejak = [];
      majuSapuan = 0; sudut = PARKIR;
      sisaHembusan = 0; jedaHembusan = 5;
      hitungPivot();
      isiLaluLintas();
      wiperHidup = (D.STATE === "TERPASANG");
    },

    ubahState: function (s) { wiperHidup = (s === "TERPASANG"); },

    maju: function (now, dt) {
      ritmeHujan(dt, now);
      D.jarakTempuh += D.lajuKita * dt;

      if (wiperHidup) {
        sudutSebelum = sudut;
        majuSapuan = (majuSapuan + (2 / PERIODE_SAPUAN) * dt) % 2;
        var p = majuSapuan <= 1 ? majuSapuan : 2 - majuSapuan;
        sudut = PARKIR + (UJUNG - PARKIR) * (0.5 - 0.5 * Math.cos(Math.PI * p));
        sapuAir(sudutSebelum, sudut);
        basah = Math.max(0.02, basah - Math.abs(sudut - sudutSebelum) * 1.5);
      }

      basah = Math.min(1, basah + 0.30 * intensitas * dt);
      tambahTetes(dt);
      majuAir(dt);
      majuLaluLintas(dt);

      var pandangan = 1 - basah;
      if (D.waktuJalan > 4 || D.STATE === "LEPAS") remDepan = true;

      if (remDepan) {
        if (pandangan > 0.45) dekat = Math.max(0.14, dekat - dt * 0.30);
        else dekat += dt * (0.13 + (0.45 - pandangan) * 0.62);
      } else {
        dekat = Math.max(0.14, dekat - dt * 0.05);
      }

      if (dekat >= 1) {
        dekat = 1;
        D.mulaiTabrakan(now,
          "Anda mengalami kecelakaan",
          "Konektor motor wiper tidak tersambung. Wiper tidak bekerja, kaca tertutup air, dan pengemudi tidak melihat antrean yang mengerem di depannya.");
      }
    },

    gambar: function (now) {
      var i, L = D.LEBAR_LAJUR;

      D.cermin = false;
      D.mulaiAdegan(basah);

      D.dunia.aspal(false, D.gradBuf.langitHujan);
      D.dunia.antreObjekPinggir(false);

      for (i = 0; i < lawan.length; i++) {
        if (lawan[i].z > 5) {
          D.antre(lawan[i].z, "mobilDepan", lawan[i].u, lawan[i].warna,
                  lawan[i].besar, lawan[i].besar ? 2.4 : 1.8);
        }
      }
      for (i = 0; i < searah.length; i++) {
        if (searah[i].z > 5) {
          D.antre(searah[i].z, "mobilBelakang", searah[i].u, searah[i].warna, remDepan, 1.8);
        }
      }
      var zDepan = 5 + 52 * (1 - dekat);
      D.antre(zDepan, "mobilBelakang", -L * 0.5, "#3a4450", remDepan, 1.82);

      D.gambarAntrean();
      D.dunia.kabutHorizon();
      D.dunia.hujanUdara(intensitas);

      D.selesaiAdegan(basah);

      var c = D.ctx;
      c.fillStyle = "rgba(178,192,206," + (basah * 0.30).toFixed(3) + ")";
      c.fillRect(0, 0, D.W, D.H);

      gambarAir();
      for (i = 0; i < pivot.length; i++) gambarSatuWiper(pivot[i]);
      kabinDepan();

      if (basah >= 0.84) {
        var a = Math.min((basah - 0.84) / 0.10, 1) * (0.6 + 0.4 * Math.sin(now / 240));
        c.fillStyle = "rgba(198,63,55," + (a * 0.20).toFixed(3) + ")";
        c.fillRect(0, 0, D.W, D.H);
        c.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
        c.textAlign = "center";
        c.font = "600 " + Math.round(D.H * 0.05) + "px system-ui, sans-serif";
        c.fillText("Pandangan tertutup air", D.W / 2, D.H * 0.26);
      }
    }
  };

})(window.DOJO);
