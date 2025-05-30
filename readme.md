# PROJEKTDOKUMENTATION - SCHACHMATT

## Inhaltsverzeichnis

1. [Projektbeschreibung](#Projektbeschreibung)
2. [Hardware-Setup und Code](#hardware-setup-und-Code)
3. [Screenflow/Flussdiagramm](#Screenflow)
4. [Steckplan](#Steckplan)  
5. [Umsetzung](#Umsetzung)  
6. [Anleitung zum Nachbauen](#Anleitung-zum-Nachbauen)  


## 1. Projektbeschreibung

In diesem Projekt entwickeln wir einen Geocache unter dem Motto Schachpartie, der sowohl physische als auch digitale Elemente miteinander verbindet. Der Cache wird zunächst über einen QR-Code aktiviert, den die Finder vor Ort scannen. Dieser führt auf eine Website, auf der vier interaktive Rätsel gelöst werden müssen. Jedes dieser Rätsel verlangt zum Abschluss eine konkrete Aktion auf einem physischen Schachbrett. Diese Aktionen werden mithilfe verschiedener Sensoren erfasst und in einer Datenbank gespeichert. Die gespeicherten Daten werden anschliessend ausgewertet, um die Korrektheit der Eingaben zu überprüfen. Der finale Cache öffnet sich nur dann, wenn alle Rätsel korrekt gelöst und alle zugehörigen physischen Eingaben richtig ausgeführt wurden. Ein detaillierter Durchlauf mit einer Testperson kann unter diesem Link abgerufen werden: https://youtu.be/cHyVL7eJJzQ 

![Projektkonzept "Schachmatt"](/Bilder%20für%20Dokumentation/erstes_projektkonzept.PNG)
Erstes Projektkonzept für "Schachmatt" <br><br>
![Kommunikationsplan der Komponenten](/Bilder%20für%20Dokumentation/IMG_0827.jpg)
Kommunikationsplan der Komponenten <br><br>

## 2. Hardware-Setup und Code

### 2.1. Lichtsensor

**Funktionsweise:**

1. Der Lichtsensor misst die Helligkeit auf dem Sensorfeld.
2. Wird eine Figur auf das Feld gestellt, verändert sich die Lichtintensität (z. B. durch Abschattung).
3. Der ESP32 interpretiert diesen Unterschied als binären Zustand (0 = Licht vorhanden, 1 = kein Licht).
4. Alle 5 Sekunden wird eine HTTP POST-Anfrage mit dem aktuellen Wert als JSON an den Server und die Datenbank gesendet.

**Hardware-Setup:**

| Komponente   | Anschluss ESP32 |
|--------------|-----------------|
| Lichtsensor  | GPIO 6          |


Der Lichtsensor wurde gebraucht um einen Schachzug zu erkennen. Wenn eine Figur auf den Sensor gestellt wird, ändern sich die Lichtverhältnisse und der Lichtsensor überliefert andere Daten. Dabei brauchen wir nur zwei verschiedene Status also entweder Licht auf dem Sensor oder kein Licht (weniger Licht) auf dem Sensor. Die Daten werden in 0 (Licht) und 1 (kein Licht) angegeben. Zudem geht bei keinem licht das LED des ESP32 an. So konnten wir bei der Programmierung einfacher überprüfen welcher Status nun aktiv ist. Dies half uns vor allem beim Problem welches später noch beschrieben wird. Der Sensor war relativ schnell funktionstüchtig und sendete zuverlässig die Signale an die Datenbank. (Alle 5 Sekunden wird eine HTTP Anfrage an den Server geschickt.) Was wir nicht bedacht hatten: Da wir unsere Sensoren unter einem Schachbrett, also einem Blatt Papier verstecken, musste der Lichtsensor nochmals in seiner Empfindlichkeit angepasst werden. Dafür veränderten wir den physischen Regler direkt am Sensor. Dies war ein heikles Unterfangen, da unter dem Papier der Unterschied zwischen Hell und Dunkel sehr gering ist. Unter einem laminierten Blatt Papier brachte dies ein weiteres mal eine Herausforderung mit sich. Am Ende entschieden wir uns für ein Schachbrett aus lichtdurchlässigem Vlies, welches den Sensor versteckt, aber seine Funktionalität nicht beeinträchtigt.

---

### 2.2. Distanzsensor

**Funktionsweise:**

1. Der Distanzsensor misst kontinuierlich den Abstand zwischen Sensor und Objekt (z. B. einer Figur).
2. Der Wert liegt typischerweise zwischen 0 und 255 mm.
3. Zur Performance-Optimierung wird der Sensor nur ca. alle 0.5 Sekunden ausgelesen.
4. Alle 5 Sekunden wird eine HTTP POST-Anfrage mit dem aktuellen Wert als JSON an den Server und die Datenbank gesendet.

**Hardware-Setup:**

| Komponente     | Anschluss ESP32 |
|----------------|-----------------|
| Distanzsensor  | SDA: GPIO 4     |
|                | SCL: GPIO 5     |


Der Distanzsensor ist ein wenig komplexer als der Lichtsensor, da dort genaue Daten gesendet werden (von 0-255). Da der Sensor SDA und SCL braucht, konnten wir den Distanzsensor nicht am gleichen ESP32 anschliessen wie den NFC Reader, da das Board nur jeweils einen SDA und einen SCL Anschluss besitzt und der NFC Reader diese Anschlüsse auch braucht. Zum Glück hatten wir zwei ESP32 zur Verfügung. Der Distanzsensor gibt uns zuverlässig Daten heraus. Gemessen beziehungsweise gelesen werden die Daten ca. alle 0.5 Sekunden. Dies ist eine Vorsichtsmassnahme, weil der ESP32 sonst Probleme bereitet. Diese Daten werden alle 5 Sekunden an den Server gesendet und dort geupdatet wenn ein anderer Wert erkannt wird wie der, welcher schon in der Datenbank steht. Dieses Update passiert jedoch für alle Sensoren im Backend der Datenbank, im load.php, und nicht direkt auf dem ESP32. Die Distanzwerte, welche wir als korrekt definiert haben lassen sich mit 0 ≤ x < 75 beschreiben. 

---

### 2.3. NFC Reader

**Funktionsweise:**

1. Der NFC-Reader prüft im Abstand von 1 Sekunde, ob ein NFC-Tag in Reichweite ist.
2. Wird ein Tag erkannt, wird dessen eindeutige ID gelesen.
3. Die eindeutige ID wird im 5-Sekunden-Takt via HTTP POST als JSON an den Server und die Datenbank gesendet. 

**Hardware-Setup:**

| Komponente  | Anschluss ESP32 |
|-------------|-----------------|
| NFC-Reader  | SDA: GPIO 4     |
|             | SCL: GPIO 5     |


Der NFC Reader benötigt wie auch der Distanzsensor einen SDA und einen SCL Anschluss zur Kommunikation/Datenübertragung. Anfänglich haben wir den NFC-Reader noch so programmiert, dass die Bedingung immer erfüllt war, bzw. das Rätsel als gelöst galt, sobald überhaupt ein NFC-Tag erkannt wurde. Wir strukturierten diese Funktion allerdings zu einem späteren Zeitpunkt noch um und definierten eine bestimmte ID als die "Richtige". Für die Cacher ist die Funktionsweise der Tags nicht relevant, für die Progammierung jedoch bedeuten verschiedene Tags die Möglichkeit verschiedenen Figuren eindeutige Identitäten zuordnen zu können. Somit können wir über den Reader erkennen ob die richtige Figur am richtigen Feld steht. Die richtige Figur entspricht der eindeutigen ID: FF0F53DE3F0000
Das zeitliche Delay in der Abfrage verhindert, dass beim Umstellen der Figuren versehentlich ein falschen NFC-Tag gelesen wird. So wird nur der Tag jener Figur übertragen, welche auf dem betreffenden Feld auch wirklich stehen bleibt. 

---

### 2.4. Drehregler

**Funktionsweise:**
1. Der Rotary Encoder wird via Interrupt abgefragt.
2. Die Bewegung wird als absolute Position (von 0 bis 19) interpretiert. So bleiben die virtuellen Zahlen immer an der gleichen Position des physischen Schalters.
3. Nach einer kurzen Stabilitätsverzögerung (5 Sekunden ohne weitere Bewegung) wird die Position via HTTP POST als JSON an den Server und die Datenbank gesendet.

**Hardware-Setup**

| Komponente       | Anschluss ESP32 |
|------------------|-----------------|
| Drehregler       | SDA: GPIO 4  |
|                  | SCL: GPIO 5  |


Der Drehregler (Rotary Encoder) wurde eingesetzt, um eine Drehung einer Figur in ein Signal umzuwandeln und somit die genaue Ausrichtugn der Figur zu erkennen. Er erkennt Drehbewegungen nach links oder rechts und gibt dabei eine definierte Position aus. Diese Position wird getrackt und nach ca. 5 Sekunden ohne weitere Bewegung an den Server übermittelt beziehungsweise in die Datenbank geschrieben. Der Drehregler ist so programmiert, dass er Bewegungen erkennt aber erst nach 5 Sekunden Stillstand ein JSON sendet. Diese Zeitverzögerung stellt sicher dass die Position auch wirklich die vom Cacher gewünschte Endposition bedeutet und nicht eine Position ist, welche beim Drehen zufällig erreicht wurde.
Wenn die ausgelesenen Werte die gegebene Bedingung, 15 ≤ x ≤ 19, erfüllt, dann gilt das Rätsel als gelöst. Wir haben die Werte absichtlich relativ breit definiert, so dass nicht genau eine Stellung zur Lösung des Rätsels führt, sondern mehrere welche etwa gleich sind wie die perfekte Lösung. Dies bietet Raum für kleine Ungenauigkeiten oder Interpretationsspielraum in der Rätsellösung. Der Drehregler hat zuverlässig funktioniert, jedoch mussten wir aufgrund schlechter Steckverbindungen die Kabel direkt anlöten. Dies führte zu einer stabileren Verbindung, schränkte jedoch die Modularität ein.



## 3. Screenflow

Vor der technischen Umsetzung des Projekts haben wir ein Screenflow des gesamten Projekts erstellt. Dieser ist im Figma ersichtlich https://www.figma.com/design/QBwLGvlgNTSYOOGi4WRb6m/IM4-MockUp?node-id=71-450&t=LwzLWQJTbZL3t7zy-1. Dieser Screenflow zeigt den ganzen Prozess auf, welcher durchlaufen wird damit alles richtig funktioniert und die richtige Logik hat.



## 4. Steckplan

Beim ersten ESP32 schlossen wir den Distanzsensor und den Lichtsensor an. Den Distanzsensor schlossen wir an den 3 Volt an und erdeten den Sensor. Dann schlossen wir noch die Datenübermittlung/Kommunikation über SDA und SCL an. Dies funktioniert über die Ports 4 und 5 auf dem ESP32. Der Lichtsensor benötigt nur ein Kabel für die Datenübertragung. Dieses belegt Port 6 des Microcontrollers. Hier noch das Bild unseres Microcontrollers mit allen Anschlüssen.

![Steckplan des ersten ESP32](/Bilder%20für%20Dokumentation/esp32_distanzsensor_lichtsensor.jpg)
Steckplan des ersten ESP32 <br><br>

Beim zweiten ESP32 sind der Drehregler und der NFC-Reader angehängt. Wie bereits erwähnt braucht der NFC-Reader eine SDA und SCL Kommunikation und ist daher auf den Ports 4 und 5 angeschlossen. Dazu natürlich wieder eine Stromversorgung und eine Erdung. Der Drehregler ist am Port 6 angeschlossen und natürlich ebenfalls mit Strom versogt und geerdet. Alle Sensoren sind für eine gängigere Handhabung mit Verlängerungen versehen. Dies könnte jedoch zu Wackelkontakten und bei defekten Kabeln, zu Fehlern führen. 

![Steckplan des zweiten ESP32](/Bilder%20für%20Dokumentation/esp32_drehregler_nfcreader.jpg)
Steckplan des zweiten ESP32 <br><br>


**Learnings**

Die ganze Verkabelung der Microcontroller mit den Sensoren stellte uns immer wieder vor Herausforderungen. Teilweise dauerte es sogar einen halben Tag voller Frustration und Fehlersuche, bis bemerkt wurde, dass ein Kabel einfach nicht funktionierte. Da beim Drehregler die Kabel selbst nicht gut an der Verbindung halten, haben wir diese dort angelötet. So haben wir Fehler bei der physischen Verbindung minimiert. Jedoch ist der Regler nicht mehr so modular und somit auch nicht so einfach austauschbar, falls der Sensor kaputt gehen sollte. Dann müssten wir die Kabel auch ersetzen. Das Verkabeln bereitete uns jedoch auch sehr viel Freude. Das phsyische Herumtüfteln und Umstecken ist sehr erfüllend, vor allem in Verbindung mit einem am Schluss funktionierenden Microcontroller und funktionierenden Sensoren.



## 5. Umsetzung

**5.1. Entwicklungsprozess**

Anfänglich war die Idee relativ schnell gegeben, dass wir einen Geocache machen wollten. Auch die Idee von mehreren Sensoren für die Öffnung des Geocaches bestand ziemlich früh. Damals wollten wir zur Öffnung des Geocaches also des Logbuchs noch den Drehmotor verwenden. Die Idee auch noch Aktoren zu gebrauchen, verwarfen wir jedoch aus Zeitgründen und konzentrierten uns stattdessen auf die vier verschiedenen Sensoren. Die physische Öffnung des Caches passiert nun über ein normales Zahlenschloss, dessen Code man erhält, wenn man alle Rätsel richtig gelöst hat. 
Die Idee die ganze Geschichte in der Thematik Schach zu gestalten, kam erst später aber verleiht dem Ganzen eine schöne vereinende Story. Wir erstellten zu Beginn eine Projektübersicht und einen Screenflow, wie alles funktionieren könnte. Danach kreierten wir ein Mockup für die Webseite, also wie diese aussehen könnte. Ein erstes ganz simples Design welches vor allem für die Usability gedacht war, wurde wieder verworfen, beziehungsweise weiterentwickelt und umstrukturiert. Dieses neue Design haben wir schlussendlich doch wieder etwas vereinfacht umgesetzt. 

![Allererste Designansätze](/Bilder%20für%20Dokumentation/Verworfenes_Design.png)
Allererste Designansätze <br><br>


Bevor es jedoch an die fertige Gestaltung ging, mussten die physischen Bauteile noch funktionsfähig zusammengesetzt werden. Jeder arbeitete jeweils an einem ESP32, mit je zwei Sensoren. Das Ziel war: In logischen und regelmässigen Zeitintervallen, verwertbare Daten automatisch in die Datenbank zu schreiben. Dabei waren die genauen Werte erstmal wenig relevant, da wir erst später die "korrekten" Werte definieren mussten. 
Dann erst ging es an die Backendprogrammierung der Website und die Verarbeitung der Daten. Wir erstellten die Index-Seite und jeweils eine Unterseite für jedes Rätsel. Moritz kümmerte sich via script.js und raetsel.js vor allem darum, dass die verschiedenen Seiten auf die Werte aus der Datenbank und richtigen Rätsellösungen reagieren. Währenddessen war es Carinas Aufgabe die Rätsel zu erstellen und die Sensoren auch auf dem physischen Schachbrett zu verbauen und zu gestalten. 

![Erster Einbau der Sensoren im Styroporbrett. Die Figuren noch aus Stiften](/Bilder%20für%20Dokumentation/prototyp_prozess.jpg)
Erster Einbau der Sensoren im Styroporbrett. Die Figuren noch aus Stiften.<br><br>
![Lötstation und etwas genauerer Verbau der Sensoren am Brett](/Bilder%20für%20Dokumentation/loetstation.jpg)
Lötstation und etwas genauerer Verbau der Sensoren am Brett.<br><br>


Am Ende wurde überall noch Finetuning betrieben, das CSS dem Design entsprechend angepasst und einige User-Tests durchgeführt. Dadurch erkannten wir kleinere Ungenauigkeiten bei den Rätseln und nötige Aufforderungen, wie etwa eine "Bitte Spielbrett wieder auf die Startposition zurücksetzen" Nachricht am Ende des Spiels. Da der Cache über ein Listing in der offiziellen Geocache App gefunden wird, haben wir uns entschieden die Anleitung, bzw. ein Bild mit dem Start-Setup dort zu veröffentlichen. So können Cacher ganz am Anfang beim Auffinden des Caches bereits sicherstellen, dass alle Figuren richtig stehen, ohne dass sie die Rätsel angesehen haben und sich somit eine Lösung verraten könnten. Ausserdem gibt es in der Cacher-Community den Kodex jeden Cache wieder so zu hinterlassen wie er aufgefunden wurde. Diese Verhaltensregel wird sehr zuverlässig befolgt, daher haben wir keine grösseren Erinnerungsmassnahmen ergriffen.



<br>

**5.2. Known Bugs**

Wir wissen, dass der Drehregler aufgrund seiner Hardware ziemlich limitiert ist. Dreht man ihn zu schnell überspringt er einzelne Zahlenwerte, wodurch die Skala verändert wird. Somit wird eine andere Zahl an die Datenbank gesendet obwohl die Position exakt die selbe ist wie ursrpünglich korrekt. Wir wussten dieses Problem nicht anders zu lösen, als durch eine textliche Warnung unter dem Rätseltext. Wir formulierten eine klare Aufforderung, dass man die Figur nur langsam drehen darf. Dieser Hinweis ist mit einem Stern, einer fett gedruckten Semantik und der Farbe rot gekennzeichnet, um möglichst Barrierefrei erkennbar zu sein. Somit sollte für alle klar ersichtlich sein, dass dieser Text von hoher Wichtigkeit ist.


<br>

**5.3. Verworfene Lösungsansätze**

Nicht alle Ideen welche wir ursprünglich hatten, waren schlussendlich auch umsetzbar und haben es in das finale Projekt geschafft. Ruhet in Frieden ihr Gedankenblitze, Designideen und kreativen Hirngespinste. Darunter war unter anderem der vorhin erwähnte Drehmotor oder auch die Idee alle Sensoren an einem einzigen ESP32 anzuhängen. Wir hatten auch die Idee in der Datenbank immer neue Einträge zu generieren, so dass überprüft werden muss ob jeweils der letzte Eintrag alle Bedingungen erfüllt. So hatten wir während dem testen am Anfang teilweise um die 300 Zeilen in unserer Datenbank und verloren auch ab und zu den Überblick. Die Daten als Update in die Datenbank zu schreiben war hier die intelligentere und einfachere Lösung. Nun musste nur noch eine "Session" erstellt werden damit die Lösung beziehungsweise die falschen Lösungen nicht in der Webseite erhalten blieben. So wird nun bei 15 Minuten ohne neue Daten die Zeile nicht mehr geupdatet, sondern bei der nächsten Sensoränderung wird eine neue Zeile/Session erstellt.


<br>

**5.4. Design**

Speziell bei unserem Projekt ist die visuelle Gestaltung des Ganzen. Und dabei ist nicht nur das digitale sondern vor allem auch das physische gemeint. Da wir ein Schachbrett mit eingebauten Sensoren und modifizierten Schachfiguren benötigen, kamen wir nicht um grosse Bastelstunden herum. (Was für uns auch kein Problem sondern eher Freude bedeutete.) Für einen ersten Prototypen der jedoch schon voll ausgestaltet ist und alle Details beachtet wurde, verwendeten wir eine Styroporplatte als Schachbrettunterlage und darüber ein ausgedrucktes Blatt. Dieses stellte uns vor die nächste Problematik, dass wir dann den Lichtsensor neu kalibrieren musste, da nun weniger Licht vorhanden war. Dies änderte sich nochmals als wir unser Blatt upgradeten und es laminierten. Dies machte das Ganze noch schöner und verlieh dem Schachspiel mit dem Glanz des Plastiks einen edleren Touch. Doch kein Idee wahrt lange und schon war das laminierte A3 Blatt, für welches wir extra die Bibliothek der FHGR kontaktierten und zu anderen Standorten fuhren schon wieder verworfen und durch ein Vliesschachbrett aus dem Brocki ersetzt. Dieses vereinfachte uns die Integration der anderen Sensoren.

![Das Schachbrett während dem Arbeitsprozess](/Bilder%20für%20Dokumentation/arbeitsprozess.jpg)
Das Schachbrett während dem Arbeitsprozess mit den richtigen Figuren und der Vliesabdeckung. <br><br>


Das Design der digitalen Komponente lehnt sich stark an ein klassisches, hölzernes Schachspiel an. Die Bilder der Figuren sind KI generiert, die Farbpalette in sanften Holztönen gehalten. Diese Farben bieten die Möglichkeit eines Kontrastreichen Interface, welches möglichst viel Barrierefreiheit bietet. Zudem wurde nirgends nur auf Farben vertraut, sondern überall auch mit Icons oder lesbarem Text gearbeitet. 
Wir sind uns bewusst, dass die ✔ und ❌ Icons auf IOS Mobilgeräten nicht kontrastreich genug sind. (Dort sind beide grau auf dunklem Hintergrund.) Das liegt jedoch an der unterschiedlichen Darstellung dieser Emojis auf Android und IOS. Hier andere Icons zu verbauen ist sicher ein Learning für zukünftige Projekte, für diesen Cache haben wir aber entschieden uns auf andere Details zu fokussieren. 


<br>

**5.5. Zukunft des Geocaches**

Dieser Geocache ist wie vorhin erwähnt nur ein Prototyp (er ist z.B. auch noch nicht wasserfest/regengeschützt und man sieht z.B. auch den Distanzsensor noch sehr gut.) Die wirkliche Umsetzung ist bei Carina im Garten angedacht, da dort ein Stromanschluss vorhanden ist und auch guter WLAN Empfang. Aktuell braucht es auch noch das tinkergarden Wlan welches wir in der Schule extra aufgesetzt haben. Dies ist bei einer zukünftigen Verwendung dann noch anzupassen. Man könnte das ganze Projekt auch mit einem eigenen Router versehen und dann die kabelgebundene Stromzufuhr durch Solarpanele und kleine Akkus ersetzen um ein komplett modulares und überall einsetzbares Projekt zu haben. Dies ist ja eigentlich aber auch nicht Sinn und Zweck eines Geocaches. Die zwei Limitierungen Wland und Strom sind momentan die einzigen welche in unserem Projekt vorzufinden sind.
Noch ist der Cache nicht in der offiziellen Geocache App gelistet, da er noch nicht an seinem fixen Standort steht. Erst wenn die Koordinaten festgelegt werden können, kann auch das Listing eingereicht werden. 

![Beispiel eines offiziellen Cache Listings in der Geocache App](/Bilder%20für%20Dokumentation/beispiel_listing.JPEG)
Beispiel eines offiziellen Cache Listings in der Geocache App <br><br>


<br>

**5.6. Einsatz von KI**

Wir bedanken uns an dieser Stelle ganz herzlich bei ChatGPT sprich OpenAi. Ohne diese KI wäre unser Projekt nie zu dem geworden was es heute ist. Ob beim Finden von Fehlern im Code oder auch beim Erklären von gewissen Funktionen und Abläufen konnten wir immer auf ChatGPT zurückgreifen. Auch für das Aufräumen des Codes war die KI sehr nützlich, da wir irgendwann die Übersicht verloren haben, da wir häufig den Code von ChatGPT adaptierten und modifizierten und 5 mal umbauten, so dass am Schluss genau das herauskam, was wir wollten. Zudem sind die auf der Website verwendeten Bilder der Schachfiguren von Adobe Firefly generiert. Jedoch half die direkte Hilfe von Jasper, Jan, Siro oder Beni meist effektiver und direkter. Die vier sind jedoch nicht so künstlich intelligent, sondern eher real intelligent. Ein grosses Danke nochmals für die Hilfe und Geduld welche sie immer für uns aufbringen. 

---

## 6.Anleitung zum Nachbauen

Diese Anleitung beschreibt in vereinfachter Form, wie du das Schachrätsel-Webprojekt mit physischer Eingabe umsetzen kannst. Ziel ist es, physische Sensorwerte (z. B. NFC, Licht, Distanz) mit digitalen Rätseln auf einer Webseite zu kombinieren. Die Sensorwerte werden in einer Datenbank gespeichert und von der Webseite regelmässig überprüft.

---

### 6.1. Vorbereitung der Datenbank

Erstelle in deiner MySQL-Datenbank zwei Tabellen:

**Schachdaten**: Für die Echtzeitwerte der Sensoren.

**sensordata**: (optional) Für allgemeine Tests mit Einfügen, Suchen und Löschen von Werten, um die Funktion der Sensoren zu überprüfen und zu optimieren.

**Beispielhafte Spalten für Schachdaten:** 

| id |      nfc       | licht | distanz | rotary |         zeit        |
|----|----------------|-------|---------|--------|---------------------|
| 1  | FF0F53DE3F0000 |   1   |    42   |   17   | 2024-06-10 14:23:00 |
| 2  | FF0F53DE3F0000 |   0   |   120   |    5   | 2024-06-10 14:23:05 |
| 3  | FF0F53DE3F0000 |   1   |    60   |   10   | 2024-06-10 14:23:10 |


---

### 6.2. Zentrale PHP-Skripte

**db_config.php** <br>
Legt die Zugangsdaten für die Datenbankverbindung fest (DSN, Benutzername, Passwort, Optionen).

**load.php** <br>
Dieses Skript wird vom ESP32 oder Raspberry Pi aufgerufen. Es:
1. Empfängt JSON-Daten mit den Sensorwerten.
2. Entscheidet, ob ein neuer Eintrag gemacht oder der letzte aktualisiert wird.
3. Speichert die Werte in die Datenbank Schachdaten. <br>

**status_check.php** <br>
Dieses Skript wird regelmässig von der Webseite aufgerufen. Es:
1. Holt den neuesten Eintrag aus Schachdaten.
2. Gibt die Sensorwerte als JSON zurück.

---

### 6.3. Arduino IDE

**Hardware:**
Die Programmierung des ESP32 erfolgt über die Arduino IDE. Abhängig von der Anzahl und Art der eingesetzten Sensoren kann der Einsatz mehrerer Mikrocontroller erforderlich sein. Der Grund dafür liegt in der begrenzten Kompatibilität der einzelnen Ports – nicht alle Pins des ESP32 unterstützen alle Signaltypen. Eine präzise Planung der Signalzuweisungen ist deshalb unerlässlich. Für den Betrieb eines NFC-Readers und eines Distanzsensors werden beispielsweise je ein SDA- und ein SCL-Anschluss benötigt, wodurch bereits zwei Mikrocontroller erforderlich sein können.

**Grundaufbau des Codes für den MC:**
1. WLAN Verbindung einrichten
2. Sensor anschliessen und im setup() Pins definieren 
3. loop() erstellen und Sensorwerte verarbeiten: <br>
    **Rotary Encoder:** attachInterrupt() aktivieren um Drehbewegung zu erkennen, 
                    Zahlenwerte als absolute Positionen definieren, 
                    Delay einbauen um finalen Wert erst nach 5 Sekunden Stillstand an JSON weiterzugeben <br>
    **NFC Reader:** Jede Sekunde eindeutige ID auslesen und an JSON weitergeben <br>
    **Distanzsensor:** Alle 0,5 Sekunden Wert lesen und an JSON weitergeben <br>
    **Lichtsensor:** Wert 0 oder 1 auslesen und an JSON weitergeben <br>
4. Mit sendJSON() wird alle 5 Sekunden eine JSON Datei via HTTP an das load.php gesendet, welches die Daten effektiv in die Datenbank schreibt.

--> Das 5 Sekunden Delay stellt sicher, dass immer nur ein eindeutiger Wert in die Datenbank übermittelt wird und nicht ständig ein Neuer.

---

### 6.4. Webseite: HTML & CSS

**index.html**
Die Hauptseite mit vier Rätseln.
1. Zeigt Buttons mit Icons für jedes Rätsel.
2. Zeigt beim Start ein Overlay mit Einführungstext.
3. Sind alle Rätsel gelöst erscheint ein vierstelliger Code.

**style.css**
Definiert das visuelle Design: Farben, Layouts, Buttons, Overlay.

---

### 6.5. Interaktivität: JavaScript

**script.js**
Wird beim Laden der Seite gestartet.
1. Ruft regelmässig status_check.php auf.
2. Vergleicht die Sensorwerte mit den erwarteten Bedingungen.
3. Aktualisiert die Anzeige (✔/✖ + Farbkreis) bei jedem Button.
4. Wenn alle vier Rätsel korrekt gelöst sind, erscheint der Code.

**raetsel.js**
Dieses Skript greift nur auf die Unterseiten der einzelnen Rätsel zu.
1. Ruft regelmässig status_check.php auf.
2. Vergleicht die Sensorwerte mit den erwarteten Bedingungen.
3. Löst ein PopUp auf der Rätselseite aus, sobald eine richtige Eingabe getätigt wurde.

**Notiz:** Womöglich kann man die zwei JS Skripte auch in einer Datei verbinden. Jedoch arbeiteten wir zu zweit parallel an diesem Projekt und konnten so die Funktionen unabhängig voneinander aufbauen und auf korrektes Verhalten testen. Nun funktionieren die Skripte jeweils als Backup füreinander. Funktioniert eine Kontrolle der Werte und eine nicht, half uns das nämlich auch beim Debuggen.

---

### 6.6. Projektstruktur (vereinfacht)

```plaintext
Projektordner/
│
├── index.html
├── style.css
├── script.js      
├── .gitignore            
├── readme.md              
│
├── php/
│   ├── db_config.php
│   ├── load.php
│   └── status_check.php
│
├── Assets/
│   ├── Springer.png
│   ├── Laeufer.png
│   ├── Bauer.png
│   ├── Turm.png
│   └── fhgr-logo.png     
│
├── JS/                  
│   └── raetsel.js        
│
└── html/
    ├── raetsel1.html
    ├── raetsel2.html
    ├── raetsel3.html
    └── raetsel4.html
```

---

### 6.7. Hinweise

 Die Sensorwerte müssen korrekt benannt sein (z. B. "nfc", "licht", "distanz", "rotary").
 Alle Server-Skripte benötigen Zugriff auf db_config.php.
 Achte auf korrekte JSON-Struktur beim Senden von Daten.
 Regelmässige Datenbankabfragen durch das Frontend ermöglichen Live-Feedback.





