# PROJEKTDOKUMENTATION - SCHACHMATT

## Inhaltsverzeichnis

1. [Projektbeschreibung](#Projektbeschreibung)
2. [Hardware-Setup und Code](#hardware-setup-und-Code)
3. [Screenflow/Flussdiagramm](#Screenflow)
4. [Steckplan](#Steckplan)  
5. [Umsetzung](#Umsetzung)  
6. [Anleitung zum Nachbauen](#Anleitung)  


## Projektbeschreibung

In diesem Projekt entwickeln wir einen Geocache unter dem Motto Schachpartie, der sowohl physische als auch digitale Elemente miteinander verbindet. Der Cache wird zunächst über einen QR-Code aktiviert, den die Finder vor Ort scannen. Dieser führt auf eine Website, auf der vier interaktive Rätsel gelöst werden müssen. Jedes dieser Rätsel verlangt zum Abschluss eine konkrete Aktion auf einem physischen Schachbrett. Diese Aktionen werden mithilfe verschiedener Sensoren erfasst und in einer Datenbank gespeichert. Die gespeicherten Daten werden anschliessend ausgewertet, um die Korrektheit der Eingaben zu überprüfen. Der finale Cache öffnet sich nur dann, wenn alle Rätsel korrekt gelöst und alle zugehörigen physischen Eingaben richtig ausgeführt wurden.

![Kommunikationsplan der Komponenten](/Bilder%20für%20Dokumentation/IMG_0827.jpg)

## Hardware-Setup und Code

### Lichtsensor

**Funktionsweise:**

1. Der Lichtsensor misst die Helligkeit auf dem Sensorfeld.
2. Wird eine Figur auf das Feld gestellt, verändert sich die Lichtintensität (z. B. durch Abschattung).
3. Der ESP32 interpretiert diesen Unterschied als binären Zustand (0 = Licht vorhanden, 1 = kein Licht).
4. Alle 5 Sekunden wird eine HTTP POST-Anfrage mit dem aktuellen Wert als JSON an den Server gesendet, sofern sich der Status verändert hat.

**Hardware-Setup:**

| Komponente   | Anschluss ESP32 |
|--------------|-----------------|
| Lichtsensor  | GPIO 6          |


Der Lichtsensor wurde gebraucht um einen Schachzug zu erkennen. Wenn eine Figur auf den Sensor gestellt wird, ändern sich die Lichtverhältnisse und der Lichtsensor überliefert andere Daten. Dabei brauchen wir nur zwei verschiedene Status also entweder Licht auf dem Sensor oder kein Licht (weniger Licht) auf dem Sensor. Die Daten werden in 0 (Licht) und 1 (kein Licht) angegeben. Zudem geht bei keinem licht das LED des ESP32 an. So konnten wir bei der Programmierung einfacher überprüfen welcher Status nun aktiv ist. Dies half uns vor allem beim Problem welches später noch beschrieben wird. Der Sensor war relativ schnell funktionstüchtig und sendete zuverlässig die Signale an die Datenbank. (Alle 5 Sekunden wird eine HTTP Anfrage an den Server geschickt.) Was wir nicht bedacht hatten. Da wir unsere Sensoren unter einem Schachbrett, also einem Blatt Papier verstecken, musste der Lichtsensor nochmal angepasst werden. Dafür veränderten wir den physischen Regler direkt am Sensor. Dies war ein heikles Unterfangen, da unter dem Papier der Unterschied zwischen Hell und Dunkel nochmal weniger ist. Unter dem Laminierten Blatt Papier brachte dies ein weiteres mal eine Herausforderung mit sich, welche wir aber schlussendlich lösen konnten.

---

### Distanzsensor

**Funktionsweise:**

1. Der Distanzsensor misst kontinuierlich den Abstand zwischen Sensor und Objekt (z. B. einer Figur).
2. Der Wert liegt typischerweise zwischen 0 und 250 mm.
3. Zur Performance-Optimierung wird der Sensor nur ca. alle 0.5 Sekunden ausgelesen.
4. Alle 5 Sekunden wird der Wert per HTTP POST an den Server gesendet, falls sich der Wert gegenüber der Datenbank verändert hat.

**Hardware-Setup:**

| Komponente     | Anschluss ESP32 |
|----------------|-----------------|
| Distanzsensor  | SDA: GPIO 4     |
|                | SCL: GPIO 5     |


Der Distanzsensor ist ein wenig komplexer wie der Lichtsensor, da dort genaue Daten gesendet werden (von 0-250). Da der Sensor SDA und SCL braucht, konnten wir den Distanzsensor nicht am gleichen ESP32 anschliessen wie den NFC Reader, da das Board nur jeweils ein SDA und ein SCL Anschluss besitzt und der NFC Reader diese Anschlüsse auch braucht. Zum Glück hatten wir zwei ESP32 zur Verfügung. Der Distanzsensor gibt uns zuverlässig Daten heraus. Gemessen beziehungsweise gelesen werden die Daten ca. alle 0.5 Sekunden. Dies ist eine Vorsichtsmassnahme, weil der ESP32 sonst Probleme bekommt. Diese Daten werden alle 5 Sekunden an den Server gesendet und dort geupdatet wenn ein anderer Wert erkannt wird wie der, welcher schon in der Datenbank steht.

---

### NFC Reader

**Funktionsweise:**

1. Der NFC-Reader prüft fortlaufend, ob ein NFC-Tag in Reichweite ist.
2. Wird ein Tag erkannt, wird dessen eindeutige ID gelesen.
3. Der ESP32 vergleicht die ID mit einer vordefinierten Referenz-ID (z. B. FF0F53DE3F0000).
4. Nur bei Übereinstimmung gilt das Rätsel als gelöst.
5. Auch dieser Sensor überträgt den Status im 5-Sekunden-Takt an den Server.

**Hardware-Setup:**

| Komponente  | Anschluss ESP32 |
|-------------|-----------------|
| NFC-Reader  | SDA: GPIO 4     |
|             | SCL: GPIO 5     |


Der NFC Reader benötigt wie auch der Distanzsensor ein SDA und ein SCL Anschluss zur Kommunikation/Datenübertragung. Anfänglich haben wir den NFC-Reader noch so programmiert gehabt, dass die Bedingung immer erfüllt ist, bzw. das Rätsel gelöst, egal was für ein NFC-Tag an den Reader gehalten wird. Dies haben wir zu einem späteren Zeitpunkt dann noch verbessert und eine zweite Schachfigur mit einem NFC-Tag versehen. Die meisten Geocache-Spielenden, sind relativ digital affin auch wenn sie über 50 jahre alt sind und verstehen, was NFC-Tags sind und wie diese funktionieren. Daher muss nun die Bedingung so erfüllt sein, dass der genau richtige NFC-Tag mit der richtigen ID verwendet werden muss. In unser Schachspiel übersetzt heisst das, genau die eine Figur muss auf dieses Feld stehen. Ansonsten ist die Bedingung nicht erfüllt und das Rätsel nicht gelöst.

---

### Drehregler

Funktionsweise:
1. Der Rotary Encoder wird via Interrupt abgefragt.
2. Die Bewegung wird als relative Position (von 0 bis NUM_POSITIONS - 1) interpretiert.
3. Nach einer kurzen Stabilitätsverzögerung (5 Sekunden ohne weitere Bewegung) wird die Position via HTTP POST als JSON an den Server gesendet.

Hardware-Setup

| Komponente       | Anschluss ESP32 |
|------------------|-----------------|
| Drehregler       | SDA: GPIO 4  |
|                  | SCL: GPIO 5  |


Der Drehregler (Rotary Encoder) wurde eingesetzt, um eine Drehung einer Figur in ein Signal umzuwandeln. Er erkennt Drehbewegungen nach links oder rechts und gibt dabei eine definierte Position aus. Diese Position wird getrackt und nach ca. 5 Sekunden ohne weitere Bewegung an den Server übermittelt beziehungsweise in die Datenbank geschrieben. Wenn die Bedingung erfüllt ist und der Drehregler einer der richtigen Werte ausgibt, zählt das Rätsel als gelöst. Wir haben die Bedingung beziehungsweise die Werte welche in der Datenbank stehen müssen damit das Rätsel als gelöst gilt einigermassen breit definiert, so dass nicht genau eine Stellung zur Lösung des Rätsels führt, sondern mehrere welche etwa gleich sind wie die Lösung welche wir wollen. Dies bietet Raum für kleine Ungenauigkeiten. Der Drehregler hat zuverlässig funktioniert, jedoch mussten wir aufgrund schlechter Steckverbindungen die Kabel direkt anlöten. Dies führte zu einer stabileren Verbindung, schränkte jedoch die Modularität ein. Auch bei diesem Sensor wird der Status alle 5 Sekunden an den Server gesendet.


## Screenflow

Vor der technischen Umsetzung des Projekts haben wir ein Screenflow des gesamten Projekts erstellt. Dieser ist im Figma ersichtlich https://www.figma.com/design/QBwLGvlgNTSYOOGi4WRb6m/IM4-MockUp?node-id=71-450&t=LwzLWQJTbZL3t7zy-1. Dieser Screenflow zeigt den ganzen Prozess auf, welcher durchlaufen wird damit alles richtig funktioniert und die richtige Logik hat.

## Steckplan

Beim ersten ESP32 schlossen wir den Distanzsensor und den Lichtsensor an. Den Distanzsensor schlossen wir an den 3 Volt an und erdeten den Sensor. Dann schlossen wir noch die Datenübermittlung/Kommunikation über SDA und SCL an. Dies funktioniert über die Ports 4 und 5 auf dem ESP32. Der Lichtsensor benötigt nur ein Kabel für die Datenübertragung. Dieses belegt Port 6 des Microcontrollers. Hier noch das Bild unseres Microcontrollers mit allen Anschlüssen.

![Steckplan des ersten ESP32](/Bilder%20für%20Dokumentation/esp32_distanzsensor_lichtsensor.jpg)

Beim zweiten ESP32 sind der Drehregler und der NFC-Reader angehängt. Wie bereits erwähnt braucht der NFC-Reader eine SDA und SCL Kommunikation und ist daher auf den Ports 4 und 5 angeschlossen. Dazu natürlich wieder eine Stromversorgung und eine Erdung. Der Drehregler ist am Port 6 angeschlossen und natürlich ebenfalls mit Strom versogt und geerdet. Alle Sensoren sind für eine gängigere Handhabung mit Verlängerungen versehen. Dies könnte jedoch zu Wackelkontakten und bei defekten Kabeln, zu Fehlern führen. 

![Steckplan des zweiten ESP32](/Bilder%20für%20Dokumentation/esp32_distanzsensor_lichtsensor.jpg)

**Learnings**

Die ganze Verkabelung der Microcontroller mit den Sensoren stellte uns immer wieder vor Herausforderungen. Teilweise dauerte es sogar einen halben Tag voller Frustration und Fehlersuche, bis bemerkt wurde, dass ein Kabel einfach nicht funktionierte. Da beim Drehregler die Kabel selbst nicht gut an der Verbindung halten, haben wir diese dort angelötet. So haben wir Fehler bei der physischen Verbindung minimiert. Jedoch ist der Regler nicht mehr so modular und somit auch nicht so einfach austauschbar, falls der Sensor kaputt gehen sollte. Dann müssten wir die Kabel auch ersetzen. Das Verkabeln bereitete uns jedoch auch sehr viel Freude. Das phsyische Herumtüfteln und Umstecken ist sehr erfüllend, vor allem in Verbindung mit einem am Schluss funktionierenden Microcontroller und funktionierenden Sensoren.

## Umsetzung

**Entwicklungsprozess**

Anfänglich war die Idee relativ schnell gegeben, dass wir ein Geocache machen wollten. Auch die Idee von mehreren Sensoren für die Öffnung des Geocaches bestand ziemlich früh. Damals wollten wir zur Öffnung des Geocaches also des Logbuchs noch den Drehmotor verwenden. Diese Idee verwarfen wir jedoch, da wir mit den vier Sensoren schon genug zu tun hatten. Ausserdem würde es dann keinen Sinn mehr ergeben, wieso man aus den Rätseln Zahlen erhält. Die Idee die ganze Geschichte in der Thematik Schach zu gestalten, kam erst später aber verleiht dem Ganzen eine schöne vereinende Story. Wir erstellten eine Projektübersicht und ein Screenflow, wie alles funktionieren könnte. Danach kreierten wir ein Mockup für die Webseite, also wie diese aussehen könnte. Ein erstes ganz simples Design welches vor allem für die Usability gedacht war, wurde verworfen, beziehungsweise weiterentwickelt und designt. Dieses Design haben wir schlussendlich ziemlich genau so umgesetzt.


**Verworfene Lösungsansätze**

Nicht alle Ideen welche wir ursprünglich hatten, waren schlussendlich auch umsetzbar und haben es in das finale Projekt geschafft. Ruhet in Frieden ihr Gedankenblitze, Designideen und kreativen Hirngespinste. Darunter war unter anderem der vorhin erwähnte Drehmotor oder auch die Idee alle Sensoren an einem einzigen ESP32 anzuhängen. Wir hatten auch die Idee in der Datenbank immer neue Einträge zu generieren, so dass überprüft werden muss ob jeweils der letzte Eintrag alle Bedingungen erfüllt. So hatten wir während dem testen am Anfang teilweise um die 300 Zeilen in unserer Datenbank und verloren auch ab und zu den Überblick. Die Daten als update in die Datenbank zu schreiben war hier die intelligentere und einfachere Lösung. Nun musste nur noch eine "Session" erstellt werden damit die Lösung beziehungsweise die falschen Lösungen nicht in der Webseite erhalten blieben. So wird nun bei 15 Minuten ohne neue Daten die Zeile nicht mehr geupdatet, sondern bei der nächsten Sensoränderung wird eine neue Zeile/Session erstellt.


**Design**

Speziell bei unserem Projekt ist die visuelle Gestaltung des Ganzen. Und dabei ist nicht nur das digitale sondern vor allem auch das physische gemeint. Da wir ein Schachbrett mit eingebauten Sensoren und modifizierten Schachfiguren benötigen, kamen wir nicht um grosse Bastellstunden herum. (Was für uns auch kein Problem sondern eher Freude bedeutete.) Für einen ersten Prototypen der jedoch schon voll ausgestaltet ist und alle Details beachtet wurde, verwendeten wir eine Styroporplatte als Schachbrettunterlage und darüber ein ausgedrucktes Blatt. Dieses stellte uns vor die nächste Problematik, dass wir dann den Lichtsensor neu kalibrieren musste, da nun weniger Licht vorhanden war. Dies änderte sich nochmals als wir unser Blatt upgradeten und es laminierten. Dies machte das Ganze noch schöner und verlieh dem Schachspiel mit dem Glanz des Plastiks einen edleren Touch. Doch kein Idee wahrt lange und schon war das laminierte A3 Blatt, für welches wir extra die Bibliothek der FHGR kontaktierten und zu anderen Standorten fuhren schon wieder verworfen und durch ein Fliesschachbrett ersetzt. Dieses vereinfachte uns die Integration der anderen Sensoren.

![Das Schachbrett während dem Arbeitsprozess](/Bilder%20für%20Dokumentation/arbeitsprozess.jpg)

---

## Anleitung zum Nachbauen

Diese Anleitung beschreibt in vereinfachter Form, wie du das Schachrätsel-Webprojekt mit physischer Eingabe umsetzen kannst. Ziel ist es, physische Sensorwerte (z. B. NFC, Licht, Distanz) mit digitalen Rätseln auf einer Webseite zu kombinieren. Die Sensorwerte werden in einer Datenbank gespeichert und von der Webseite regelmässig überprüft.

---

### 1. Vorbereitung der Datenbank

Erstelle in deiner MySQL-Datenbank zwei Tabellen:

**Schachdaten**: Für die Echtzeitwerte der Sensoren.
**sensordata**: (optional) Für allgemeine Tests mit Einfügen, Suchen und Löschen von Werten.

Beispielhafte Spalten für Schachdaten:

sql
id, nfc, licht, distanz, rotary, zeit


---

### 2. Zentrale PHP-Skripte

db_config.php
Legt die Zugangsdaten für die Datenbankverbindung fest (DSN, Benutzername, Passwort, Optionen).

load.php
Dieses Skript wird vom ESP32 oder Raspberry Pi aufgerufen. Es:

- Empfängt JSON-Daten mit den Sensorwerten.
- Entscheidet, ob ein neuer Eintrag gemacht oder der letzte aktualisiert wird.
- Speichert die Werte in die Datenbank Schachdaten.

**status_check.php**
Dieses Skript wird regelmässig von der Webseite aufgerufen. Es:

- Holt den neuesten Eintrag aus Schachdaten.
- Gibt die Sensorwerte als JSON zurück.

---

### 3. Webseite: HTML & CSS

**index.html**
Die Hauptseite mit vier Rätseln.

- Zeigt Buttons mit Icons für jedes Rätsel.
- Zeigt beim Start ein Overlay mit Einführungstext.
- Bei gelösten Rätseln erscheint ein vierstelliger Code.

**style.css**
Definiert das visuelle Design: Farben, Layouts, Buttons, Overlay.

---

## 4. Interaktivität: JavaScript

### script.js
Wird beim Laden der Seite gestartet.

- Ruft regelmässig status_check.php auf.
- Vergleicht die Sensorwerte mit den erwarteten Bedingungen.
- Aktualisiert die Anzeige (✔/✖ + Farbkreis) bei jedem Button.
- Wenn alle vier Rätsel korrekt gelöst sind, erscheint der Code.

---

## 5. Zusatzseite: website_form.php

Eine einfache Testseite zur Interaktion mit der Datenbank sensordata.

- Ermöglicht manuelles Einfügen, Löschen und Suchen von Werten.
- Zeigt die Daten auch als JSON an.
- Diese Seite dient zur Entwicklung und zum Debuggen.

---

## 6. Projektstruktur (vereinfacht)

```plaintext
Projektordner/
│
├── index.html
├── style.css
├── script.js
│
├── php/
│   ├── db_config.php
│   ├── load.php
│   └── status_check.php
│
├── website_form.php
├── Assets/
│   ├── Springer.png
│   ├── Laeufer.png
│   ├── Bauer.png
│   └── Turm.png
│
└── html/
    ├── raetsel1.html
    ├── raetsel2.html
    ├── raetsel3.html
    └── raetsel4.html
```

---

## 7. Hinweise

- Die Sensorwerte müssen korrekt benannt sein (z. B. "nfc", "licht", "distanz", "rotary").
- Alle Server-Skripte benötigen Zugriff auf db_config.php.
- Achte auf korrekte JSON-Struktur beim Senden von Daten.
- Regelmässige Datenbankabfragen durch das Frontend ermöglichen Live-Feedback.



Merken für Carina:
Erfolg pop ups noch auf die anderen Rätselseiten hinzufügen!!!!




