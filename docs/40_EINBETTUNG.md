# Einbettung

Die Seite ist dafür gebaut, in einem fremden iframe zu laufen — in FiveM-CEF ebenso wie in einem
normalen Browser. Sie liefert dafür `Content-Security-Policy: frame-ancestors *` und **kein**
`X-Frame-Options`, ist also von jeder Herkunft einbettbar.

## Adresse

```
https://minigames.dmn-software.com/?kiosk=1&game=snake&name=Max%20Mustermann&board=0
```

Ohne `game` und mit `kiosk=1` wird ein Spiel zufällig gewählt. Ohne `kiosk` erscheint das Menü
mit allen zwölf Kacheln — das ist die richtige Wahl für den Bewusstlos-Bildschirm, weil der
Spieler dann selbst aussuchen kann.

Alle Parameter stehen in der README.

## Was die einbettende Seite leisten muss

**1. NUI-Fokus halten.** In FiveM kommen Tastendrücke nur im iframe an, wenn die Resource
`SetNuiFocus(true, true)` hält, solange es sichtbar ist. Das kann die Website nicht selbst
erzwingen. Fehlt der Fokus, bleiben alle tastengesteuerten Spiele unbedienbar — als Ausweg
lässt sich das Bildschirmpad mit `&pad=1` erzwingen, dann reicht die Maus.

**2. Fokus im iframe auslösen.** Die Startkarte ist kein Zierrat: Der Lauf beginnt erst nach
einer echten Geste **innerhalb** des iframes, und genau dieser Klick holt den Fokus. Deshalb ist
`autostart=1` nicht der Standard. Wer es setzt, muss den Fokus anders sicherstellen.

**3. Größe.** Das Layout funktioniert ab etwa 320 × 240 und klappt bei 760 px Breite von der
seitlichen Bestenliste auf eine untere um. Unter 480 px Breite oder 360 px Höhe verschwindet die
Bestenliste ganz; für sehr kleine Fenster besser gleich `board=0` setzen.

**4. Ausfall.** Es gibt bewusst kein lokal mitgeliefertes Bundle. Ist die Domain nicht
erreichbar, bleibt das iframe leer — die einbettende Seite sollte darauf einen eigenen Hinweis
zeigen und das iframe schließen können.

## Was die Seite nicht tut

Sie schickt **keine** `postMessage` an das Elternfenster. Wenn die Resource wissen soll, dass
ein Lauf vorbei ist oder welcher Score erreicht wurde, ist das ein Dreizeiler im Host — dann
aber bitte mit einer festgelegten Nachrichtenform, statt es auf Verdacht einzubauen.

Sie kennt auch keinen Spieler. `name=` füllt nur das Namensfeld der Bestenliste vor; eingetragen
wird erst nach einem Klick, und der Eintrag ist nicht an eine Identität gebunden.

## Anknüpfungspunkte in sky_ambulancejob

Falls doch eine kleine Resource gebaut wird, die das iframe öffnet, sind das die dokumentierten
Stellen:

| Was | Wie |
|---|---|
| Bewusstlos-Bildschirm geht auf | Client-Event `sky_ambulancejob:deathscreen:started` |
| Bewusstlos-Bildschirm geht zu | Client-Event `sky_ambulancejob:deathscreen:closed` |
| Vollständiger Zustand inkl. Timer | Client-Event `sky_ambulancejob:deathStateChanged`, Export `getDeathState()` |
| Liegt der Spieler? | Export `isDead()` |
| Notruf, früher Respawn, KI-Sanitäter | Export `requestDeathAction(action, payload?)` |
| Eigenen Bildschirm statt sky zeichnen | `/jobconfig` → Ambulance Jobs → Settings → Death Screen → General → Integration → Screen Mode → External |

Der mitgelieferte Bildschirm von sky nimmt standardmäßig den NUI-Fokus. Ein Overlay daneben muss
sich den Fokus beim Öffnen holen und beim Schließen zurückgeben.
