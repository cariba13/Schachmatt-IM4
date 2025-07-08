#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <Wire.h>
#include "Adafruit_VL6180X.h"

// WLAN-Zugangsdaten
const char* ssid     = "tinkergarden";
const char* pass     = "strenggeheim";

// Server-URL
const char* serverURL = "https://geocache.rotweissbunt.com/php/load.php";

// Sensor-Pins
const int digitalSensorPin = 7;        // z. B. Lichtsensor, Taster
const int ledPin = BUILTIN_LED;        // LED zur Anzeige

// I2C für VL6180X (GPIO6 = SDA, GPIO7 = SCL)
Adafruit_VL6180X vl = Adafruit_VL6180X();

// Zeitsteuerung
unsigned long lastTime = 0;
unsigned long timerDelay = 5000;      // 5 Sekunden Intervall

int digitalValue = 0;
int lastDigitalValue = -1;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // I2C starten und Distanzsensor initialisieren
  Wire.begin(5, 6); // SDA = GPIO5, SCL = GPIO6 (wie im ursprünglichen Code)
  if (!vl.begin()) {
    Serial.println("VL6180X Sensor nicht gefunden!");
    while (1);  // Wartet, falls der Sensor nicht gefunden wird
  }
  Serial.println("VL6180X Sensor gefunden.");

  // Pins konfigurieren
  pinMode(digitalSensorPin, INPUT);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);  // LED aus zu Beginn

  // WLAN verbinden
  Serial.print("Verbinde mit WLAN");
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nVerbunden mit %s, IP: %s\n", ssid, WiFi.localIP().toString().c_str());
}

void loop() {
  // Digitalen Sensor einlesen
  digitalValue = digitalRead(digitalSensorPin);
  if (digitalValue != lastDigitalValue) {
    lastDigitalValue = digitalValue;
    digitalWrite(ledPin, digitalValue);
    Serial.printf("Digitalwert: %d\n", digitalValue);
  }

  // Distanzsensor einlesen
  uint8_t range = vl.readRange();
  uint8_t status = vl.readRangeStatus();
  if (status == VL6180X_ERROR_NONE) {
    Serial.printf("Distanzwert: %d mm\n", range);
  } else {
    Serial.println("Fehler beim Lesen des Distanzsensors");
    range = 255; // ungültiger Wert
  }

  // Alle 15 Sekunden an Server senden
  if ((millis() - lastTime) > timerDelay) {
    lastTime = millis();

    JSONVar dataObject;
    dataObject["licht"] = digitalValue;
    dataObject["distanz"] = range;
    String jsonString = JSON.stringify(dataObject);

    // DEBUG: Zeige, was gesendet wird
    Serial.println("--------------- DEBUG JSON ---------------");
    Serial.println("JSON wird gesendet:");
    Serial.println(jsonString);
    Serial.println("------------------------------------------");

    // Prüfe WLAN-Verbindung und sende HTTP-Anfrage
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverURL);
      http.addHeader("Content-Type", "application/json");
      int httpResponseCode = http.POST(jsonString);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("HTTP Antwort: %d\n", httpResponseCode);
        Serial.println("Serverantwort: " + response);
      } else {
        Serial.printf("Fehler beim Senden: %d\n", httpResponseCode);
      }

      http.end();
    } else {
      Serial.println("WLAN getrennt");
    }
  }

  delay(500); // etwas Zeit für den Sensor
}
