# PROJEKT DOKUMENTATION - SCHACHMATT

## Inhaltsverzeichnis

1. [Projektbeschreibung](#Projektbeschreibung)
2. [Hardware-Setup und Code](#hardware-setup-und-Code)
3. [Kapitel 0](#Kapitel)
4. [Kapitel 1](#Kapitel-1)  
5. [Kapitel 2](#Kapitel-2)  
6. [Kapitel 3](#Kapitel-3)  


## Projektbeschreibung

In diesem Projekt entwickeln wir einen Geocache unter dem Motto Schachpartie, der sowohl physische als auch digitale Elemente miteinander verbindet. Der Cache wird zunächst über einen QR-Code aktiviert, den die Finder vor Ort scannen. Dieser führt auf eine Website, auf der vier interaktive Rätsel gelöst werden müssen. Jedes dieser Rätsel verlangt zum Abschluss eine konkrete Aktion auf einem physischen Schachbrett. Diese Aktionen werden mithilfe verschiedener Sensoren erfasst und in einer Datenbank gespeichert. Die gespeicherten Daten werden anschliessend ausgewertet, um die Korrektheit der Eingaben zu überprüfen. Der finale Cache öffnet sich nur dann, wenn alle Rätsel korrekt gelöst und alle zugehörigen physischen Eingaben richtig ausgeführt wurden.

![Kommunikationsplan der Komponenten](/Bilder%20für%20Dokumentation/IMG_0827.jpg)

## Hardware-Setup und Code

### Lichtsensor
Der Lichtsensor wurde gebraucht um einen Schachzug zu erkennen. Wenn eine Figur auf den Sensor gestellt wird, ändern sich die Lichtverhältnisse und der Lichtsensor überliefert andere Daten. Dabei brauchen wir nur zwei verschiedene Status also entweder Licht auf dem Sensor oder kein Licht (weniger Licht) auf dem Sensor. Die Daten werden in 0 (Licht) und 1 (kein Licht) angegeben. Zudem geht bei keinem licht das LED des ESP32 an. So konnten wir bei der Programmierung einfacher überprüfen welcher Status nun aktiv ist. Dies half uns vor allem beim Problem welches später noch beschrieben wird. Der Sensor war relativ schnell funktionstüchtig und sendete zuverlässig die Signale an die Datenbank. (Alle 5 Sekunden wird eine HTTP Anfrage an den Server geschickt.) Was wir nicht bedacht hatten. Da wir unsere Sensoren unter einem Schachbrett, also einem Blatt Papier verstecken, musste der Lichtsensor nochmal angepasst werden. Dafür veränderten wir den physischen Regler direkt am Sensor. Dies war ein heikles Unterfangen, da unter dem Papier der Unterschied zwischen Hell und Dunkel nochmal weniger ist. Unter dem Laminierten Blatt Papier brachte dies ein weiteres mal eine Herausforderung mit sich, welche wir aber schlussendlich lösen konnten.

---

### Distanzsensor
Der Distanzsensor ist ein wenig komplexer wie der Lichtsensor, da dort genaue Daten gesendet werden (von 0-250). Da der Sensor SDA und SCL braucht, konnten wir den Distanzsensor nicht am gleichen ESP32 anschliessen wie den NFC Reader, da das Board nur jeweils ein SDA und ein SCL Anschluss besitzt und der NFC Reader diese Anschlüsse auch braucht. Zum Glück hatten wir zwei ESP32 zur Verfügung. Der Distanzsensor gibt uns zuverlässig Daten heraus. Gemessen beziehungsweise gelesen werden die Daten ca. alle 0.5 Sekunden. Dies ist eine Vorsichtsmassnahme, weil der ESP32 sonst Probleme bekommt. Diese Daten werden alle 5 Sekunden an den Server gesendet und dort geupdatet wenn ein anderer Wert erkannt wird wie der, welcher schon in der Datenbank steht.

---

### NFC Reader
Lorem Ipsum

---

### Drehregler

Funktionsweise:
1. Der Rotary Encoder wird via Interrupt abgefragt.
2. Die Bewegung wird als relative Position (von 0 bis `NUM_POSITIONS - 1`) interpretiert.
3. Nach einer kurzen Stabilitätsverzögerung (5 Sekunden ohne weitere Bewegung) wird die Position via HTTP POST als JSON an den Server gesendet.

Hardware-Setup

| Komponente       | Anschluss ESP32 |
|------------------|-----------------|
| Rotary Encoder A | GPIO 2 (ENC_A)  |
| Rotary Encoder B | GPIO 3 (ENC_B)  |


### Kapitel 0

Screenflow/Flussdiagram:
Vor der technischen Umsetzung des Projekts haben wir ein Screenflow des gesamten Projekts erstellt. Dieser ist im Figma ersichtlich https://www.figma.com/design/QBwLGvlgNTSYOOGi4WRb6m/IM4-MockUp?node-id=71-450&t=LwzLWQJTbZL3t7zy-1. Dieser Screenflow zeigt den ganzen Prozess auf, welcher durchlaufen wird damit alles richtig funktioniert und die richtige Logik hat.

Steckschema:
How to: Beim ersten ESP32 schlossen wir den Distanzsensor und den Lichtsensor an. Den Distanzsensor schlossen wir an den 3 Volt an und erdeten den Sensor. Dann schlossen wir noch die Datenübermittlung/Kommunikation über SDA und SCL an. Dies funktioniert über die Ports 4 und 5 auf dem ESP32. Der Lichtsensor benötigt nur ein Kabel für die Datenübertragung. Dieses belegt Port 6 des Microcontrollers. Hier noch das Bild unseres Microcontrollers mit allen Anschlüssen.
![Steckplan des ersten ESP32](/Bilder%20für%20Dokumentation/esp32_distanzsensor_lichtsensor.jpg)

Beim zweiten ESP32 sind der Drehregler und der NFC-Reader angehängt. Wie bereits erwähnt braucht der NFC-Reader eine SDA und SCL Kommunikation und ist daher auf den Ports 4 und 5 angeschlossen. Dazu natürlich wieder eine Stromversorgung und eine Erdung. Der Drehregler ist am Port 6 angeschlossen und natürlich ebenfalls mit Strom versogt und geerdet. Alle Sensoren sind für eine gängigere Handhabung mit Verlängerungen versehen. Dies könnte jedoch zu Wackelkontakten und bei defekten Kabeln, zu Fehlern führen. 
![Steckplan des zweiten ESP32](/Bilder%20für%20Dokumentation/esp32_distanzsensor_lichtsensor.jpg)

Learnings: Die ganze Verkabelung der Microcontroller mit den Sensoren stellte uns immer wieder vor Herausforderungen. Teilweise dauerte es sogar einen halben Tag voller Frustration und Fehlersuche, bis bemerkt wurde, dass ein Kabel einfach nicht funktionierte. Da beim Drehregler die Kabel selbst nicht gut an der Verbindung halten, haben wir diese dort angelötet. So haben wir Fehler bei der physischen Verbindung minimiert. Jedoch ist der Regler nicht mehr so modular und somit auch nicht so einfach austauschbar, falls der Sensor kaputt gehen sollte. Dann müssten wir die Kabel auch ersetzen. Das Verkabeln bereitete uns jedoch auch sehr viel Freude. Das phsyische Herumtüfteln und Umstecken ist sehr erfüllend, vor allem in Verbindung mit einem am Schluss funktionierenden Microcontroller und funktionierenden Sensoren.


Merken für Carina:
Erfolg pop ups noch auf die anderen Rätselseiten hinzufügen!!!!




