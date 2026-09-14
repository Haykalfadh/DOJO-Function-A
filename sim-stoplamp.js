/* ============================================================
   DOJO FUNCTION A - SIMULASI STOP LAMP
   Pandangan ke arah belakang. Konektor stop lamp switch
   menentukan apakah pengemudi di belakang tahu kita mengerem.
   ============================================================ */

(function (D) {

  var pedalRem = false;
  var lampuNyala = false;
  var jarakBelakang = 30;
  var lajuBelakang = 21;
  var remBelakang = false;
  var waktuLihat = 0;
  var siklus = 0;
  var fasa = "jalan";          // jalan | rem | pulih
  var skid = [];

  function reset() {
    pedalRem = false;
    lampuNyala = false;
    jarakBelakang = 30;
    lajuBelakang = D.LAJU_DASAR;
    D.lajuKita = D.LAJU_DASAR;
    remBelakang = false;
    waktuLihat = 0;
    siklus = 0;
    fasa = "jalan";
    skid = [];
  }

  function maju(now, dt) {
    siklus += dt;
    D.jarakTempuh += D.lajuKita * dt;

    // siklus berkendara: melaju 5 detik, mengerem 5 detik, pulih 4 detik
    if (fasa === "jalan" && siklus > 5) { fasa = "rem"; siklus = 0; pedalRem = true; }
    else if (fasa === "rem" && siklus > 5) { fasa = "pulih"; siklus = 0; pedalRem = false; }
    else if (fasa === "pulih" && siklus > 4) {
      fasa = "jalan"; siklus = 0;
      remBelakang = false; waktuLihat = 0;
    }

    lampuNyala = pedalRem && (D.STATE === "TERPASANG");

    if (pedalRem) D.lajuKita = Math.max(4, D.lajuKita - 3.4 * dt);
    else D.lajuKita = Math.min(D.LAJU_DASAR, D.lajuKita + 2.2 * dt);

    // pengemudi di belakang bereaksi setelah melihat lampu
    if (lampuNyala) {
      waktuLihat += dt;
      if (waktuLihat > 0.8) remBelakang = true;
    } else if (!pedalRem) {
      remBelakang = false;
    }

    // tanpa lampu, dia baru sadar saat jaraknya sudah terlalu dekat
    if (!lampuNyala && pedalRem && jarakBelakang < 7) remBelakang = true;

    if (remBelakang) {
      var sebelum = lajuBelakang;
      lajuBelakang = Math.max(3, lajuBelakang - 4.2 * dt);
      if (sebelum - lajuBelakang > 0.01 && Math.random() < dt * 30) {
        skid.push({ z: jarakBelakang, umur: 0 });
      }
    } else {
      lajuBelakang = Math.min(D.LAJU_DASAR, lajuBelakang + 2.0 * dt);
    }

    jarakBelakang = Math.min(jarakBelakang + (D.lajuKita - lajuBelakang) * dt, 48);

    for (var i = skid.length - 1; i >= 0; i--) {
      skid[i].umur += dt;
      if (skid[i].umur > 2.5) skid.splice(i, 1);
    }

    if (jarakBelakang <= 3.2) {
      jarakBelakang = 3.2;
      D.mulaiTabrakan(now,
        "Anda ditabrak dari belakang",
        "Konektor stop lamp switch tidak tersambung. Anda menginjak rem, tetapi lampu belakang tetap mati, sehingga pengemudi di belakang tidak punya alasan untuk melambat.");
    }

    D.el.hudPedal.textContent = pedalRem ? "Diinjak" : "Lepas";
    D.el.hudPedal.className = pedalRem ? "nyala" : "padam";
    D.el.hudLampu.textContent = lampuNyala ? "Menyala" : "Mati";
    D.el.hudLampu.className = lampuNyala ? "nyala" : "padam";
    D.el.hudJarak.textContent = Math.round(jarakBelakang) + " m";
  }

  function kabinBelakang() {
    var c = D.ctx, W = D.W, H = D.H;

    c.fillStyle = "#0a0b0d";

    // tepi atap
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H * 0.07);
    c.quadraticCurveTo(W * 0.5, H * 0.13, 0, H * 0.07);
    c.closePath(); c.fill();

    // dek belakang
    c.beginPath();
    c.moveTo(0, H); c.lineTo(W, H); c.lineTo(W, H * 0.80);
    c.quadraticCurveTo(W * 0.5, H * 0.72, 0, H * 0.80);
    c.closePath(); c.fill();

    // pilar samping
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(W * 0.13, 0);
    c.lineTo(W * 0.05, H); c.lineTo(0, H);
    c.closePath(); c.fill();

    c.beginPath();
    c.moveTo(W, 0); c.lineTo(W * 0.87, 0);
    c.lineTo(W * 0.95, H); c.lineTo(W, H);
    c.closePath(); c.fill();

    // sandaran kepala kursi belakang
    c.fillStyle = "#101418";
    D.bulat(W * 0.17, H * 0.74, W * 0.15, H * 0.16, W * 0.03); c.fill();
    D.bulat(W * 0.68, H * 0.74, W * 0.15, H * 0.16, W * 0.03); c.fill();

    // kawat pemanas kaca
    c.strokeStyle = "rgba(190,160,110,0.13)";
    c.lineWidth = Math.max(1, H * 0.004);
    c.beginPath();
    for (var i = 1; i <= 7; i++) {
      var y = H * (0.16 + i * 0.082);
      c.moveTo(W * 0.10, y);
      c.lineTo(W * 0.90, y);
    }
    c.stroke();

    c.fillStyle = D.grad.vignetteBelakang;
    c.fillRect(0, 0, W, H);
  }

  function gambar(now) {
    var c, L = D.LEBAR_LAJUR;

    D.cermin = true;
    D.mulaiAdegan(0);
    c = D.ctx;

    D.dunia.aspal(true, D.gradBuf.langitSenja);

    // bekas ban di aspal
    for (var s = 0; s < skid.length; s++) {
      var zz = skid[s].z;
      if (zz < 5) continue;
      var alpha = (0.30 * (1 - skid[s].umur / 2.5)).toFixed(2);
      D.pitaJalan(-L * 0.5 - 0.75, -L * 0.5 - 0.55, zz, zz + 1.2, "rgba(12,12,14," + alpha + ")");
      D.pitaJalan(-L * 0.5 + 0.55, -L * 0.5 + 0.75, zz, zz + 1.2, "rgba(12,12,14," + alpha + ")");
    }

    D.dunia.antreObjekPinggir(true);
    D.antre(jarakBelakang, "mobilDepan", -L * 0.5, "#37414c", false, 1.82);
    D.gambarAntrean();

    D.dunia.kabutHorizon();
    D.dunia.hujanUdara(0.5);

    // cahaya lampu rem kita menyapu aspal di belakang
    if (lampuNyala) {
      c.save();
      c.globalCompositeOperation = "lighter";
      var g = c.createLinearGradient(0, D.H, 0, D.H * 0.42);
      g.addColorStop(0, "rgba(224,52,40,0.42)");
      g.addColorStop(1, "rgba(224,52,40,0)");
      c.fillStyle = g;
      c.fillRect(0, D.H * 0.42, D.W, D.H * 0.58);
      c.restore();
    }

    D.selesaiAdegan(0);
    c = D.ctx;

    kabinBelakang();

    c.textAlign = "center";
    if (!lampuNyala && pedalRem) {
      var a = 0.55 + 0.45 * Math.sin(now / 230);
      c.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
      c.font = "600 " + Math.round(D.H * 0.046) + "px system-ui, sans-serif";
      c.fillText("Anda mengerem, lampu belakang tetap mati", D.W / 2, D.H * 0.20);
    } else if (lampuNyala && remBelakang && jarakBelakang > 9) {
      c.fillStyle = "rgba(140,226,172,0.92)";
      c.font = "600 " + Math.round(D.H * 0.040) + "px system-ui, sans-serif";
      c.fillText("Pengemudi di belakang melihat dan ikut mengerem", D.W / 2, D.H * 0.20);
    }
  }

  D.daftarSim.stoplamp = {
    pakaiHud: true,
    reset: reset,
    maju: maju,
    gambar: gambar
  };

})(window.DOJO);
