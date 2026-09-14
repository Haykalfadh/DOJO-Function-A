/* ============================================================
   DOJO FUNCTION A - DUNIA
   Semua yang digambar di luar kabin: aspal, marka, gedung,
   pohon, lampu jalan, dan kendaraan.
   ============================================================ */

(function (D) {

  var dunia = {};
  D.dunia = dunia;

  // ---------------------------------------------------------
  //  KENDARAAN
  // ---------------------------------------------------------
  function lampuBelakang(x, y, w, h, terang) {
    var c = D.ctx;
    c.fillStyle = "rgba(28,16,16,0.9)";
    D.bulat(x, y, w, h, w * 0.25); c.fill();

    c.fillStyle = "rgba(" + Math.round(200 + 55 * terang) + "," +
                  Math.round(40 * terang) + "," + Math.round(32 * terang) + "," +
                  (0.45 + 0.55 * terang) + ")";
    D.bulat(x + w * 0.14, y + h * 0.10, w * 0.72, h * 0.80, w * 0.2); c.fill();

    if (terang > 0.8 && w > 5) {
      c.save();
      c.globalCompositeOperation = "lighter";
      var g = c.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 2);
      g.addColorStop(0, "rgba(255,90,70,0.5)");
      g.addColorStop(1, "rgba(255,90,70,0)");
      c.fillStyle = g;
      c.fillRect(x - w * 2, y - w * 2, w * 5, h + w * 4);
      c.restore();
    }
  }

  function lampuDepan(x, y, w, h) {
    var c = D.ctx;
    c.fillStyle = "rgba(255,248,224,0.95)";
    D.bulat(x, y, w, h, h * 0.4); c.fill();
    if (w > 4) {
      c.save();
      c.globalCompositeOperation = "lighter";
      var g = c.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 2.6);
      g.addColorStop(0, "rgba(255,240,200,0.5)");
      g.addColorStop(1, "rgba(255,240,200,0)");
      c.fillStyle = g;
      c.fillRect(x - w * 2.6, y - w * 2.6, w * 6, h + w * 5.2);
      c.restore();
    }
  }

  // tampak belakang, dipakai untuk kendaraan searah
  dunia.mobilBelakang = function (cx, dasar, lebar, warna, rem) {
    var c = D.ctx;
    var tb = lebar * 0.48, ta = lebar * 0.35;
    var kiri = cx - lebar / 2, atasBadan = dasar - tb, atasAtap = atasBadan - ta;
    var r = lebar * 0.06;

    c.fillStyle = "rgba(0,0,0,0.42)";
    c.beginPath();
    c.ellipse(cx, dasar + lebar * 0.015, lebar * 0.55, lebar * 0.06, 0, 0, 6.2832);
    c.fill();

    c.fillStyle = "#0b0c0e";
    c.fillRect(kiri + lebar * 0.04, dasar - lebar * 0.11, lebar * 0.15, lebar * 0.11);
    c.fillRect(kiri + lebar * 0.81, dasar - lebar * 0.11, lebar * 0.15, lebar * 0.11);

    c.fillStyle = warna;
    D.bulat(kiri + lebar * 0.06, atasAtap, lebar * 0.88, ta + r * 2, r * 1.5); c.fill();

    c.fillStyle = "#10151b";
    D.bulat(kiri + lebar * 0.12, atasAtap + lebar * 0.045, lebar * 0.76, ta * 0.62, r); c.fill();
    c.fillStyle = "rgba(150,175,200,0.10)";
    D.bulat(kiri + lebar * 0.12, atasAtap + lebar * 0.045, lebar * 0.76, ta * 0.22, r); c.fill();

    c.fillStyle = warna;
    D.bulat(kiri, atasBadan, lebar, tb, r); c.fill();

    c.strokeStyle = "rgba(0,0,0,0.32)";
    c.lineWidth = Math.max(1, lebar * 0.007);
    c.beginPath();
    c.moveTo(kiri + lebar * 0.07, atasBadan + tb * 0.5);
    c.lineTo(kiri + lebar * 0.93, atasBadan + tb * 0.5);
    c.stroke();

    var lw = lebar * 0.12, lh = tb * 0.5, terang = rem ? 1 : 0.4;
    lampuBelakang(kiri + lebar * 0.03, atasBadan + tb * 0.11, lw, lh, terang);
    lampuBelakang(kiri + lebar * 0.85, atasBadan + tb * 0.11, lw, lh, terang);

    if (rem) {
      c.fillStyle = "rgba(255,80,66,0.95)";
      c.fillRect(cx - lebar * 0.10, atasAtap - lebar * 0.012, lebar * 0.20, lebar * 0.021);
    }

    c.fillStyle = "rgba(255,255,255,0.10)";
    D.bulat(kiri + lebar * 0.02, dasar - tb * 0.24, lebar * 0.96, tb * 0.22, r * 0.6); c.fill();
    c.fillStyle = "#d9d9d2";
    c.fillRect(cx - lebar * 0.09, dasar - tb * 0.20, lebar * 0.18, tb * 0.12);

    if (rem) {
      var g = c.createLinearGradient(0, dasar, 0, dasar + lebar * 0.5);
      g.addColorStop(0, "rgba(220,60,48,0.32)");
      g.addColorStop(1, "rgba(220,60,48,0)");
      c.fillStyle = g;
      c.fillRect(kiri, dasar, lebar, lebar * 0.5);
    }
  };

  // tampak depan, dipakai untuk arus berlawanan dan kendaraan di belakang
  dunia.mobilDepan = function (cx, dasar, lebar, warna, truk) {
    var c = D.ctx;
    var tb = lebar * (truk ? 0.72 : 0.48), ta = lebar * (truk ? 0.30 : 0.35);
    var kiri = cx - lebar / 2, atasBadan = dasar - tb, atasAtap = atasBadan - ta;
    var r = lebar * 0.06;

    c.fillStyle = "rgba(0,0,0,0.42)";
    c.beginPath();
    c.ellipse(cx, dasar + lebar * 0.015, lebar * 0.55, lebar * 0.06, 0, 0, 6.2832);
    c.fill();

    c.fillStyle = "#0b0c0e";
    c.fillRect(kiri + lebar * 0.04, dasar - lebar * 0.11, lebar * 0.15, lebar * 0.11);
    c.fillRect(kiri + lebar * 0.81, dasar - lebar * 0.11, lebar * 0.15, lebar * 0.11);

    c.fillStyle = warna;
    D.bulat(kiri + lebar * 0.07, atasAtap, lebar * 0.86, ta + r * 2, r * 1.4); c.fill();
    c.fillStyle = "#151b22";
    D.bulat(kiri + lebar * 0.12, atasAtap + lebar * 0.04, lebar * 0.76, ta * 0.66, r); c.fill();

    c.fillStyle = warna;
    D.bulat(kiri, atasBadan, lebar, tb, r); c.fill();

    c.fillStyle = "rgba(0,0,0,0.45)";
    c.fillRect(kiri + lebar * 0.24, atasBadan + tb * 0.16, lebar * 0.52, tb * 0.16);
    c.fillStyle = "rgba(255,255,255,0.09)";
    D.bulat(kiri + lebar * 0.02, dasar - tb * 0.26, lebar * 0.96, tb * 0.24, r * 0.6); c.fill();
    c.fillStyle = "#d9d9d2";
    c.fillRect(cx - lebar * 0.09, dasar - tb * 0.22, lebar * 0.18, tb * 0.13);

    var hw = lebar * 0.15, hh = tb * 0.20;
    lampuDepan(kiri + lebar * 0.05, atasBadan + tb * 0.14, hw, hh);
    lampuDepan(kiri + lebar * 0.80, atasBadan + tb * 0.14, hw, hh);

    var g = c.createLinearGradient(0, dasar, 0, dasar + lebar * 0.7);
    g.addColorStop(0, "rgba(255,236,190,0.28)");
    g.addColorStop(1, "rgba(255,236,190,0)");
    c.fillStyle = g;
    c.fillRect(kiri, dasar, lebar, lebar * 0.7);
  };

  // ---------------------------------------------------------
  //  LINGKUNGAN
  // ---------------------------------------------------------
  dunia.pohon = function (u, z) {
    var c = D.ctx;
    var xb = D.px(u, z), yb = D.py(0, z), skala = D.F / z;
    c.fillStyle = "#2a2118";
    c.fillRect(xb - 0.16 * skala, D.py(2.6, z), 0.32 * skala, yb - D.py(2.6, z));
    var warna = ["#1f3b26", "#25462c", "#1b3421"];
    for (var i = 0; i < 3; i++) {
      c.fillStyle = warna[i];
      c.beginPath();
      c.ellipse(xb + (i - 1) * 0.85 * skala, D.py(3.7 + i * 0.5, z),
                1.5 * skala, 1.2 * skala, 0, 0, 6.2832);
      c.fill();
    }
  };

  dunia.lampuJalan = function (u, z) {
    var c = D.ctx;
    var skala = D.F / z;
    var xTiang = D.px(u, z);
    var xLampu = D.px(u + (u < 0 ? 2.2 : -2.2), z);

    c.strokeStyle = "#2d3238";
    c.lineWidth = Math.max(1, 0.16 * skala);
    c.beginPath();
    c.moveTo(xTiang, D.py(0, z));
    c.lineTo(xTiang, D.py(8.2, z));
    c.lineTo(xLampu, D.py(8.6, z));
    c.stroke();

    var ly = D.py(8.6, z);
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(xLampu, ly, 0, xLampu, ly, 2.6 * skala);
    g.addColorStop(0, "rgba(255,224,160,0.5)");
    g.addColorStop(1, "rgba(255,224,160,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(xLampu, ly, 2.6 * skala, 0, 6.2832);
    c.fill();
    c.restore();
  };

  dunia.gedung = function (mundur) {
    var c = D.ctx;
    var arah = mundur ? 1 : -1;
    for (var sisi = -1; sisi <= 1; sisi += 2) {
      var jarakSisi = sisi < 0 ? -14 : 14;
      for (var i = 0; i < 12; i++) {
        var z = 30 + i * 24 + arah * (D.jarakTempuh % 24);
        if (z < 18) continue;

        var id = i + (sisi > 0 ? 500 : 0) + Math.floor(D.jarakTempuh / 24) * 7;
        var tinggi = 9 + D.acak(id) * 20;
        var lebarM = 13 + D.acak(id + 3) * 8;
        var u1 = jarakSisi - (sisi < 0 ? lebarM : 0);
        var u2 = jarakSisi + (sisi < 0 ? 0 : lebarM);
        var zb = z + 12;

        var xa = D.px(u1, z), xb = D.px(u2, z);
        var yBawah = D.py(0, z), yAtas = D.py(tinggi, z);
        var xa2 = D.px(u1, zb), xb2 = D.px(u2, zb);
        var yBawah2 = D.py(0, zb), yAtas2 = D.py(tinggi, zb);

        var kabut = Math.min(0.7, z / 210);

        c.fillStyle = "rgb(" + Math.round(30 + kabut * 52) + "," +
                      Math.round(34 + kabut * 56) + "," + Math.round(41 + kabut * 60) + ")";
        c.beginPath();
        c.moveTo(xa2, yAtas2); c.lineTo(xb2, yAtas2);
        c.lineTo(xb2, yBawah2); c.lineTo(xa2, yBawah2);
        c.closePath(); c.fill();

        c.fillStyle = "rgb(" + Math.round(24 + kabut * 50) + "," +
                      Math.round(28 + kabut * 54) + "," + Math.round(34 + kabut * 58) + ")";
        c.beginPath();
        c.moveTo(xa, yAtas); c.lineTo(xb, yAtas);
        c.lineTo(xb, yBawah); c.lineTo(xa, yBawah);
        c.closePath(); c.fill();

        // jendela hanya digambar untuk gedung yang cukup dekat
        if (z > 110) continue;
        var baris = Math.floor(tinggi / 3.2);
        for (var b = 0; b < baris; b++) {
          for (var k = 0; k < 4; k++) {
            if (D.acak(id * 31 + b * 7 + k) < 0.45) continue;
            var uu1 = u1 + (u2 - u1) * (0.12 + k * 0.21);
            var uu2 = uu1 + (u2 - u1) * 0.12;
            var h1 = 1.6 + b * 3.2, h2 = h1 + 1.6;
            var xw1 = D.px(uu1, z), xw2 = D.px(uu2, z);
            c.fillStyle = "rgba(255,214,140," + (0.20 + D.acak(id + b + k) * 0.36).toFixed(2) + ")";
            c.fillRect(Math.min(xw1, xw2), D.py(h2, z), Math.abs(xw2 - xw1), D.py(h1, z) - D.py(h2, z));
          }
        }
      }
    }
  };

  // ---------------------------------------------------------
  //  ASPAL DAN MARKA
  // ---------------------------------------------------------
  dunia.aspal = function (mundur, gradLangit) {
    var c = D.ctx, L = D.LEBAR_LAJUR;

    c.fillStyle = gradLangit;
    c.fillRect(0, 0, D.W, D.HY + 2);

    c.fillStyle = "#1a1e23";
    c.fillRect(0, D.HY, D.W, D.H - D.HY);

    dunia.gedung(mundur);

    D.pitaJalan(-9.5, -L - 0.15, 5, 220, "#31363c");
    D.pitaJalan(L + 0.15, 9.5, 5, 220, "#31363c");
    D.pitaJalan(-L - 0.15, L + 0.15, 5, 220, "#292c31");
    D.pitaJalan(-L + 0.05, -L + 0.22, 5, 220, "rgba(226,226,220,0.55)");
    D.pitaJalan(L - 0.22, L - 0.05, 5, 220, "rgba(226,226,220,0.55)");

    var periode = 9, arah = mundur ? 1 : -1;
    for (var i = 0; i < 26; i++) {
      var z1 = 5 + i * periode + arah * (D.jarakTempuh % periode);
      if (z1 < 5) continue;
      D.pitaJalan(-0.09, 0.09, z1, z1 + 3.2, "rgba(232,232,226,0.78)");
    }
  };

  dunia.antreObjekPinggir = function (mundur) {
    var arah = mundur ? 1 : -1, i, z;
    for (i = 0; i < 16; i++) {
      z = 12 + i * 15 + arah * (D.jarakTempuh % 15);
      if (z > 6) {
        D.antre(z, "pohon", -7.6);
        D.antre(z + 7, "pohon", 7.6);
      }
    }
    for (i = 0; i < 7; i++) {
      z = 20 + i * 34 + arah * (D.jarakTempuh % 34);
      if (z > 6) D.antre(z, "lampuJalan", -8.6);
    }
  };

  dunia.kabutHorizon = function () {
    var c = D.ctx;
    c.fillStyle = D.gradBuf.kabut;
    c.fillRect(0, D.HY - D.H * 0.03, D.W, D.H * 0.11);
  };

  dunia.hujanUdara = function (kuat) {
    var c = D.ctx;
    var garis = Math.round((70 + 150 * kuat) * (D.mutu.adegan > 0.6 ? 1 : 0.6));
    c.strokeStyle = "rgba(205,220,236," + (0.14 + 0.16 * kuat).toFixed(2) + ")";
    c.lineWidth = 1.5;
    c.beginPath();
    for (var j = 0; j < garis; j++) {
      var x = (j * 89 + D.jarakTempuh * 27) % D.W;
      var y = (j * 137 + D.jarakTempuh * 61) % D.H;
      c.moveTo(x, y);
      c.lineTo(x - 11, y + 44);
    }
    c.stroke();
  };

  // ---------------------------------------------------------
  //  PENDAFTARAN KE ANTREAN
  // ---------------------------------------------------------
  D.penggambar.pohon = function (it) { dunia.pohon(it.u, it.z); };
  D.penggambar.lampuJalan = function (it) { dunia.lampuJalan(it.u, it.z); };
  D.penggambar.mobilBelakang = function (it) {
    dunia.mobilBelakang(D.px(it.u, it.z), D.py(0, it.z), it.lebar * D.F / it.z, it.warna, it.bendera);
  };
  D.penggambar.mobilDepan = function (it) {
    dunia.mobilDepan(D.px(it.u, it.z), D.py(0, it.z), it.lebar * D.F / it.z, it.warna, it.bendera);
  };

})(window.DOJO);
