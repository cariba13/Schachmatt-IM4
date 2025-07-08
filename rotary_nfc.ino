#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <Wire.h>
#include <Adafruit_PN532.h>

TaskHandle_t nfcTaskHandle;

unsigned long _lastIncReadTime = micros();
unsigned long _lastDecReadTime = micros();
int _pauseLength = 25000;
int _fastIncrement = 10;

// --- WLAN ---
const char* ssid = "tinkergarden";
const char* pass = "strenggeheim";
const char* serverURL = "https://geocache.rotweissbunt.com/php/load.php";

// --- Rotary Encoder ---
#define ENC_A 2
#define ENC_B 3
#define NUM_POSITIONS 20

volatile int encoderSteps = 0;
int originOffset = 0;
int lastSentPosition = -1;
int lastDisplayedPosition = -1;
bool rotaryMoved = false;
unsigned long lastRotaryChangeTime = 0;
const unsigned long stabilityDelay = 5000;

// --- PN532 NFC Reader ---
#define SDA_PIN 6
#define SCL_PIN 7
#define PN532_IRQ   (2)  // nicht genutzt bei I2C
#define PN532_RESET (3)  // nicht genutzt bei I2C

Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET, &Wire);
unsigned long lastNFCTime = 0;
const unsigned long nfcDelay = 1000;

// nur jede nfcCheckInterval Millisekunden checken
const unsigned long nfcCheckInterval = 5000; // alle 5 Sekunden
unsigned long lastNFCCheck = 0;


// --- Drehregler ---
void IRAM_ATTR read_encoder() {
  static uint8_t old_AB = 3;
  static int8_t encval = 0;
  static const int8_t enc_states[]  = {0,-1,1,0,1,0,0,-1,-1,0,0,1,0,1,-1,0};

  old_AB <<= 2;

  if (digitalRead(ENC_A)) old_AB |= 0x02;
  if (digitalRead(ENC_B)) old_AB |= 0x01;

  encval += enc_states[(old_AB & 0x0F)];

  if (encval > 3) {
    int changevalue = 1;
    if ((micros() - _lastIncReadTime) < _pauseLength) {
      changevalue *= _fastIncrement;
    }
    _lastIncReadTime = micros();
    encoderSteps += changevalue;
    encval = 0;
    rotaryMoved = true;
    lastRotaryChangeTime = millis();
  } else if (encval < -3) {
    int changevalue = -1;
    if ((micros() - _lastDecReadTime) < _pauseLength) {
      changevalue *= _fastIncrement;
    }
    _lastDecReadTime = micros();
    encoderSteps += changevalue;
    encval = 0;
    rotaryMoved = true;
    lastRotaryChangeTime = millis();
  }
}


// --- Rotary Position berechnen ---
int getDisplayPosition() {
  int pos = (encoderSteps - originOffset) % NUM_POSITIONS;
  if (pos < 0) pos += NUM_POSITIONS;
  return pos;
}

// --- JSON Senden ---
void sendJSON(const String& key, const JSONVar& value) {
  if (WiFi.status() == WL_CONNECTED) {
    JSONVar data;
    data[key] = value;
    String jsonString = JSON.stringify(data);

    Serial.println("Sende JSON:");
    Serial.println(jsonString);

    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    int responseCode = http.POST(jsonString);
    if (responseCode > 0) {
      String response = http.getString();
      Serial.printf("HTTP %d\n", responseCode);
      Serial.println("Antwort: " + response);
    } else {
      Serial.printf("POST fehlgeschlagen: %d\n", responseCode);
    }
    http.end();
  } else {
    Serial.println("WLAN getrennt – kein POST möglich.");
  }
}

void setup() {
  Serial.begin(115200);

  // --- WLAN verbinden ---
  WiFi.begin(ssid, pass);
  Serial.println("Verbinde mit WLAN...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nWLAN verbunden: SSID: %s, IP: %s\n", ssid, WiFi.localIP().toString().c_str());

  // --- Rotary Encoder ---
  pinMode(ENC_A, INPUT_PULLUP);
  pinMode(ENC_B, INPUT_PULLUP);
 attachInterrupt(digitalPinToInterrupt(ENC_A), read_encoder, CHANGE);
 attachInterrupt(digitalPinToInterrupt(ENC_B), read_encoder, CHANGE);
  originOffset = encoderSteps;
  Serial.println("Drehregler Startposition fixiert (oben = 0)");

  // --- PN532 starten ---
  Wire.begin(SDA_PIN, SCL_PIN);
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("Kein PN532 gefunden – Verbindung prüfen.");
    while (1);  // bleibt hängen
  }

  Serial.print("PN532 Chip gefunden: PN5");
  Serial.println((versiondata >> 24) & 0xFF, HEX);
  Serial.print("Firmware Version: ");
  Serial.print((versiondata >> 16) & 0xFF, DEC);
  Serial.print('.');
  Serial.println((versiondata >> 8) & 0xFF, DEC);

  nfc.SAMConfig();
  Serial.println("Warte auf ein RFID/NFC Tag...");
    // --- NFC Task starten ---
  xTaskCreatePinnedToCore(
    nfcTask,          // Funktion
    "NFCTask",        // Name
    4096,             // Stack-Grösse
    NULL,             // Parameter
    1,                // Priorität
    &nfcTaskHandle,   // Task-Handle
    0                 // Core 0 (loop() läuft meist auf Core 1)
  );

}


void nfcTask(void * parameter) {
  for (;;) {
    uint8_t uid[7];
    uint8_t uidLength;

    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
      Serial.print("NFC Tag erkannt, UID: ");

      String uidString = "";
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) uidString += "0";
        uidString += String(uid[i], HEX);
        Serial.print(uid[i], HEX); Serial.print(" ");
      }

      uidString.toUpperCase();

      Serial.println();
      Serial.println("UID-String: " + uidString);

      sendJSON("nfc", uidString);

      // NFC Tag nur alle 2 Sekunden erneut lesen
      delay(2000);
    }

    delay(100); // CPU nicht überlasten
  }
}


void loop() {
  // --- Rotary Encoder ---
  int currentDisplayPosition = getDisplayPosition();
  currentDisplayPosition = currentDisplayPosition % 20;

  if (currentDisplayPosition != lastDisplayedPosition) {
    lastDisplayedPosition = currentDisplayPosition;
    Serial.printf("Aktuelle Position (0 fix oben): %d\n", currentDisplayPosition);
  }

  if (rotaryMoved && (millis() - lastRotaryChangeTime > stabilityDelay)) {
    rotaryMoved = false;
    if (currentDisplayPosition != lastSentPosition) {
      lastSentPosition = currentDisplayPosition;
      sendJSON("rotary", currentDisplayPosition);
    }
  }

  // --- NFC Reader ---
// if (!rotaryMoved && millis() - lastNFCCheck >= nfcCheckInterval) {
//   lastNFCCheck = millis();

//   uint8_t uid[7];
//   uint8_t uidLength;
//   if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
//     Serial.print("NFC Tag erkannt, UID: ");

//     String uidString = "";
//     for (uint8_t i = 0; i < uidLength; i++) {
//       if (uid[i] < 0x10) uidString += "0";
//       uidString += String(uid[i], HEX);
//       Serial.print(uid[i], HEX); Serial.print(" ");
//     }

//     uidString.toUpperCase();

//     Serial.println();
//     Serial.println("UID-String: " + uidString);

//     sendJSON("wert", uidString);
//     lastNFCTime = millis();
//   }
// }


  delay(10);
}