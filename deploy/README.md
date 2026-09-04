# Deployment

Die Minispiele laufen als eigenes Compose-Projekt (`dmn-minigame`) auf einem Server, auf dem
bereits ein anderer Stack die Ports 80 und 443 besitzt. Dessen Reverse Proxy (Caddy) ist der
einzige Eingang von außen und übernimmt auch TLS für `minigames.dmn-software.com`. Dieses
Projekt veröffentlicht deshalb **keine** eigenen Ports, sondern hängt nur im gemeinsamen Netz
`minigame_edge`.

Wichtig: Die Dienste heißen `minigames-web` und `minigames-api`, nicht `web` und `api`.
Compose vergibt den Dienstnamen immer zusätzlich als Netz-Alias; kurze Namen stünden im
gemeinsamen Netz doppelt, weil der fremde Stack sie dort schon führt, und das Docker-DNS
löste sie nichtdeterministisch auf — im schlechten Fall landet fremder Verkehr hier.

## Platzhalter

Die konkreten Werte stehen nicht in diesem öffentlichen Repo. Vor dem Ausrollen setzen:

```sh
SERVER=<server-ip-oder-host>
PROXY=<name-des-caddy-containers>
PROXY_DIR=<verzeichnis-mit-dessen-Caddyfile>
ZIEL=<zielverzeichnis-auf-dem-server>
```

## Erstinstallation

### 1. DNS (steht bereits)

Der A-Record ist gesetzt und löst ungeproxied auf, geprüft gegen 1.1.1.1 und 8.8.8.8:

```
minigames   A   $SERVER   (Proxy AUS, graue Wolke)
```

Der Proxy muss **dauerhaft** aus bleiben. Mit orangener Wolke bekommt Caddy keine
ACME-Challenge durch; die Erstausstellung schlägt sofort fehl und eine spätere Erneuerung
scheitert nach rund 60 Tagen still, bis das Zertifikat abläuft.

Bei einem Neuaufbau gegenprüfen, ob der Record steht:

```sh
dig +short minigames.dmn-software.com
```

### 2. Repo klonen

```sh
git clone <repo-url> $ZIEL
cd $ZIEL/deploy
```

### 3. `.env` anlegen

```sh
printf 'IP_SALT=%s\nADMIN_TOKEN=%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" > .env
chmod 600 .env
```

Die `.env` wird nie eingecheckt. `IP_SALT` später zu ändern entwertet alle gespeicherten
IP-Hashes.

### 4. Netz anlegen

```sh
docker network create minigame_edge
```

### 5. Stack bauen und starten

```sh
cd $ZIEL/deploy
docker compose build
docker compose up -d
docker compose ps
```

Beide Container müssen `healthy` melden, bevor es weitergeht.

### 6. Caddy ans Netz hängen

`docker network connect` wirkt auf den laufenden Container, ohne ihn neu zu starten —
der fremde Stack bleibt dabei online:

```sh
docker network connect minigame_edge $PROXY
```

### 7. Erreichbarkeit aus dem Caddy-Container prüfen

Erst testen, dann die Konfiguration anfassen. Wenn hier etwas fehlschlägt, ist noch nichts
kaputt:

```sh
docker exec $PROXY wget -qO- http://minigames-api:8090/api/v1/health
docker exec $PROXY wget -qO- -S http://minigames-web:8080/ >/dev/null
```

Gleichzeitig gegenprüfen, dass der fremde Stack seine eigenen Dienste weiterhin trifft — hier
ein Dienst, den er auf seinem eigenen Netz führt:

```sh
docker exec $PROXY wget -qO- -S http://web:3000/ >/dev/null
```

### 8. Caddy-Block anhängen

```sh
cp $PROXY_DIR/Caddyfile $PROXY_DIR/Caddyfile.bak
cat $ZIEL/deploy/caddy-block.txt >> $PROXY_DIR/Caddyfile
```

Die Domain steht im Block bewusst im Klartext und nicht als `{$VAR}`: Umgebungsvariablen
lassen sich einem laufenden Container nicht nachträglich mitgeben, das würde ein Recreate
und damit einen Ausfall des fremden Stacks erzwingen.

### 9. Validieren und neu laden

```sh
docker exec $PROXY caddy validate --config /etc/caddy/Caddyfile
docker exec -w /etc/caddy $PROXY caddy reload --config /etc/caddy/Caddyfile
```

`validate` muss sauber durchlaufen, bevor `reload` gestartet wird. `reload` tauscht die
Konfiguration im laufenden Prozess; bestehende Verbindungen brechen nicht ab.

### 10. Logs beobachten

```sh
docker logs -f --tail 50 $PROXY
```

Beim ersten Aufruf von `https://minigames.dmn-software.com` holt Caddy das Zertifikat. Im
Log muss `certificate obtained successfully` erscheinen. Danach:

```sh
curl -sI https://minigames.dmn-software.com | grep -i -e content-security -e x-frame
curl -s  https://minigames.dmn-software.com/api/v1/health
```

`Content-Security-Policy: frame-ancestors *` muss da sein, `X-Frame-Options` darf nicht
auftauchen.

## Dauerhaft machen

Schritt 6 überlebt kein `docker compose up -d` im fremden Compose-Projekt: Compose setzt die
Netz-Zugehörigkeit dann wieder auf das, was in seiner Datei steht. Deshalb in
`$PROXY_DIR/docker-compose.yml` beim Dienst `caddy` ergänzen:

```yaml
  caddy:
    networks: [<bisherige netze>, minigame_edge]
```

und unten bei den Netzen:

```yaml
networks:
  minigame_edge:
    external: true
```

Diese Änderung nur beim nächsten ohnehin geplanten Wartungsfenster ausrollen — sie wird
erst mit einem Recreate des Caddy-Containers wirksam und kostet dabei kurz Downtime für
alle Domains.

## Aktualisieren

```sh
cd $ZIEL
git pull
cd deploy
docker compose up -d --build
docker compose ps
```

Der Caddyfile-Block bleibt dabei unberührt, die Aliase ändern sich nicht. Alte Images
gelegentlich aufräumen: `docker image prune -f`.

## Zurückrollen

Nur die Minispiele stoppen, der fremde Stack läuft weiter:

```sh
cd $ZIEL/deploy
docker compose down
```

Caddy-Konfiguration zurücknehmen (Backup aus Schritt 8 einspielen, sonst zeigt der Block
ins Leere):

```sh
cp $PROXY_DIR/Caddyfile.bak $PROXY_DIR/Caddyfile
docker exec $PROXY caddy validate --config /etc/caddy/Caddyfile
docker exec -w /etc/caddy $PROXY caddy reload --config /etc/caddy/Caddyfile
```

Caddy wieder vom Netz trennen und das Netz entfernen:

```sh
docker network disconnect minigame_edge $PROXY
docker network rm minigame_edge
```

Auf eine ältere Version zurück statt komplett runter:

```sh
cd $ZIEL
git checkout <commit>
cd deploy && docker compose up -d --build
```

Die SQLite-Datei liegt im Volume `dmn-minigame_api-data` und überlebt `down` und
`up -d --build`. Sie verschwindet nur bei `docker compose down -v`.
