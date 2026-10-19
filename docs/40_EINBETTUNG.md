# Einbettung

Die Seite ist dafür gebaut, in einem fremden iframe zu laufen, im normalen Browser ebenso wie in
der CEF-Oberfläche eines Spiel-Clients wie FiveM. Sie liefert dafür
`Content-Security-Policy: frame-ancestors *` und **kein** `X-Frame-Options`, ist also von jeder
Herkunft einbettbar.

## Adresse

```
https://minigames.dmn-software.com/?kiosk=1&game=snake&name=Max%20Mustermann&board=0
```

Ohne `game` und mit `kiosk=1` wird ein Spiel zufällig gewählt. Ohne `kiosk` erscheint das Menü
mit allen zwölf Kacheln. Das ist die richtige Wahl, wenn der Spieler selbst aussuchen soll.

Alle Parameter stehen in der README.

## Was die einbettende Seite leisten muss

**1. Eingabefokus halten.** In einem Spiel-Client kommen Tastendrücke nur im iframe an, wenn
der Host den Fokus dorthin gibt, in FiveM per `SetNuiFocus(true, true)`, solange das iframe
sichtbar ist. Das kann die Website nicht selbst erzwingen. Fehlt der Fokus, bleiben alle
tastengesteuerten Spiele unbedienbar. Als Ausweg lässt sich das Bildschirmpad mit `&pad=1`
erzwingen, dann reicht die Maus.

**2. Fokus im iframe auslösen.** Die Startkarte ist kein Zierrat: Der Lauf beginnt erst nach
einer echten Geste **innerhalb** des iframes, und genau dieser Klick holt den Fokus. Deshalb ist
`autostart=1` nicht der Standard. Wer es setzt, muss den Fokus anders sicherstellen.

**3. Größe.** Das Layout funktioniert ab etwa 320 × 240 und klappt bei 760 px Breite von der
seitlichen Bestenliste auf eine untere um. Unter 480 px Breite oder 360 px Höhe verschwindet die
Bestenliste ganz; für sehr kleine Fenster besser gleich `board=0` setzen.

**4. Ausfall.** Es gibt bewusst kein lokal mitgeliefertes Bundle. Ist die Domain nicht
erreichbar, bleibt das iframe leer. Die einbettende Seite sollte darauf einen eigenen Hinweis
zeigen und das iframe schließen können.

## Was die Seite nicht tut

Sie schickt **keine** `postMessage` an das Elternfenster. Wenn der Host wissen soll, dass ein
Lauf vorbei ist oder welcher Score erreicht wurde, ist das ein Dreizeiler in `GameHost`, dann
aber mit einer festgelegten Nachrichtenform, statt es auf Verdacht einzubauen.

Sie kennt auch keinen Spieler. `name=` füllt nur das Namensfeld der Bestenliste vor; eingetragen
wird erst nach einem Klick, und der Eintrag ist nicht an eine Identität gebunden.
