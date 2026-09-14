/* ====================================================================
   DOJO FUNCTION A - ESP32 CONNECTOR FIRMWARE
   Mengirimkan status konektor (TERPASANG / LEPAS) ke Firebase Realtime Database
   sehingga website yang dihosting di Vercel dapat menerimanya secara real-time.
   ==================================================================== */

#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Provide the RTDB payload printing info and other helper functions.
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// ==================== KONFIGURASI PENGGUNA ====================
// 1. Masukkan Wi-Fi Anda (Gunakan jaringan Wi-Fi 2.4 GHz)
#define WIFI_SSID     "K2-TRAINING-5G2"
#define WIFI_PASSWORD "Tr@ining-K2"

// 2. Masukkan Kredensial Firebase Anda dari Firebase Console
// Web API Key dari Project Settings -> General
#define API_KEY       "AIzaSyDp__oskQIEBXcajrCWFHK_NcQb4wwNRYo"

// Database URL dari Realtime Database Console
#define DATABASE_URL  "https://dojo-function-a-default-rtdb.asia-southeast1.firebasedatabase.app/"

// 3. Pin Fisik Konektor pada ESP32 (Default: Pin 4)
// Menggunakan INPUT_PULLUP: 
// - Ketika konektor TERPASANG (terhubung ke GND) -> Digital Read LOW (0)
// - Ketika konektor DILEPAS (terbuka)           -> Digital Read HIGH (1)
#define CONNECTOR_PIN 4

// ==============================================================

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
int lastState = -1;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50; // Delay debounce 50ms

void setupWiFi() {
  Serial.print("Menghubungkan ke Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("Wi-Fi Terhubung!");
  Serial.print("IP Address ESP32: ");
  Serial.println(WiFi.localIP());
}

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Sign up anonim ke Firebase
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Berhasil daftar anonim ke Firebase");
  } else {
    Serial.printf("Gagal daftar ke Firebase: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void setup() {
  Serial.begin(115200);
  pinMode(CONNECTOR_PIN, INPUT_PULLUP);

  setupWiFi();
  setupFirebase();

  Serial.println("Firmware ESP32 Dojo Siap!");
}

void loop() {
  // Pembacaan status pin fisik konektor
  int reading = digitalRead(CONNECTOR_PIN);

  // Cek apakah ada perubahan status fisik
  if (reading != lastState) {
    lastDebounceTime = millis();
  }

  // Jika kondisi stabil melebihi jeda debounceDelay
  if ((millis() - lastDebounceTime) > debounceDelay) {
    // Status konektor: LOW = TERPASANG, HIGH = LEPAS
    String currentStatus = (reading == LOW) ? "TERPASANG" : "LEPAS";

    // Kirim data ke Firebase jika status berubah atau secara berkala tiap 10 detik sebagai heartbeat
    static String lastSentStatus = "";
    if (currentStatus != lastSentStatus || (millis() - sendDataPrevMillis > 10000)) {
      sendDataPrevMillis = millis();
      lastSentStatus = currentStatus;

      if (Firebase.ready()) {
        Serial.print("Mengirim status ke Firebase -> ");
        Serial.println(currentStatus);

        // Update path "connector_status" di Realtime Database
        if (Firebase.RTDB.setString(&fbdo, "/connector_status", currentStatus)) {
          Serial.println("Berhasil memperbarui Firebase!");
        } else {
          Serial.print("Gagal memperbarui Firebase: ");
          Serial.println(fbdo.errorReason());
        }
      }
    }
  }

  lastState = reading;
}
