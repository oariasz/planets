# Deploy — planets · demo.estratekdata.com/planets

App **100% estática**. No requiere Docker, ni runtime, ni puerto dedicado. Apache la sirve directamente.

---

## 1. Pre-flight

Confirmar antes de tocar producción:

- [ ] Acceso SSH a `etk-web`.
- [ ] Apache activo y sirviendo `demo.estratekdata.com` con SSL (Let's Encrypt).
- [ ] El vhost actual de `demo.estratekdata.com` no tiene ya un Alias `/planets/`.
- [ ] Mod headers habilitado:  `sudo a2enmod headers`.
- [ ] Repo GitHub publicado vía `create_repo.sh`.

---

## 2. Pasos de despliegue

```bash
# 1. En el servidor etk-web
sudo mkdir -p /opt/estratek
cd /opt/estratek

# 2. Clonar (HTTPS público) o deploy key si es privado
sudo git clone https://github.com/<TU_USER>/planets.git planets

# 3. Ajustar permisos para que Apache (www-data) pueda leer
sudo chown -R root:www-data /opt/estratek/planets
sudo find /opt/estratek/planets -type d -exec chmod 755 {} \;
sudo find /opt/estratek/planets -type f -exec chmod 644 {} \;

# 4. Backup del vhost actual ANTES de tocarlo
VHOST=/etc/apache2/sites-available/demo.estratekdata.com-le-ssl.conf
sudo cp "$VHOST" "${VHOST}.bak.$(date +%Y%m%d-%H%M%S)"

# 5. Editar el vhost e insertar el snippet de apache-vhost.conf
#    dentro del bloque <VirtualHost *:443> de demo.estratekdata.com
sudo nano "$VHOST"

# 6. Validar sintaxis
sudo apache2ctl configtest
#    Debe responder: "Syntax OK"

# 7. Reload Apache (no restart — para no caer el resto)
sudo systemctl reload apache2

# 8. Smoke test
curl -I https://demo.estratekdata.com/planets/
#    Esperado: 200 OK + Content-Type: text/html
```

---

## 3. Smoke tests post-deploy

```bash
# Página principal
curl -s -o /dev/null -w "%{http_code}\n" https://demo.estratekdata.com/planets/
# 200

# Assets críticos
curl -s -o /dev/null -w "%{http_code}\n" https://demo.estratekdata.com/planets/css/styles.css
# 200
curl -s -o /dev/null -w "%{http_code}\n" https://demo.estratekdata.com/planets/js/main.js
# 200
curl -s -o /dev/null -w "%{http_code}\n" https://demo.estratekdata.com/planets/assets/estratek-logo.svg
# 200

# Headers de cache
curl -sI https://demo.estratekdata.com/planets/assets/estratek-logo.svg | grep -i cache
# Cache-Control: public, max-age=2592000, immutable
```

Verificar visualmente en navegador:

- Pantalla de carga con logo Estratek aparece.
- Sistema solar se renderiza, planetas orbitan.
- Scroll = zoom funciona.
- Click+drag = rotación funciona.
- Click sobre la Tierra abre ficha con día/noche visible.
- Botones de Halley / Lluvia de cometas / Lanzar satélite responden.

---

## 4. Rollback

Si algo va mal:

```bash
# 1. Restaurar el vhost
VHOST=/etc/apache2/sites-available/demo.estratekdata.com-le-ssl.conf
BACKUP=$(ls -t ${VHOST}.bak.* | head -n1)
sudo cp "$BACKUP" "$VHOST"

# 2. Validar y recargar
sudo apache2ctl configtest && sudo systemctl reload apache2

# 3. (Opcional) eliminar el deploy
sudo rm -rf /opt/estratek/planets

# 4. Smoke test: demo.estratekdata.com sigue sirviendo lo que servía antes
curl -I https://demo.estratekdata.com/
```

Punto de retorno: el vhost original (`*.bak.<fecha>`) restaura el estado previo. No hay base de datos ni runtime que revertir.

---

## 5. Actualizaciones

```bash
cd /opt/estratek/planets
sudo git pull --ff-only origin main
# No requiere reload de Apache — los archivos cambian en disco directamente.
# Para limpiar cache del navegador del usuario, basta con cambios en js/css
# (los hashes de archivo no cambian; si quieres cache-busting fuerte, agregar
# ?v=YYYYMMDD a los <link>/<script> en index.html antes del commit).
```

---

## 6. Rutas protegidas

Esta app NO debe interferir con:

- `https://app.estratekdata.com/invoicer/`
- `https://api.estratekdata.com/news_scraper/`
- `https://ai.estratekdata.com`
- `https://demo.estratekdata.com` (rutas existentes — solo añadimos `/planets/`)
- `https://omararias.com`

El Alias `/planets/` es aditivo y no captura nada fuera de ese prefijo.

---

## 7. Recursos

- App estática, ~20 KB de código propio + ~600 KB de Three.js (CDN).
- Texturas: cargadas desde CDNs externos (jsdelivr, threejs.org) — no consumen banda de etk-web.
- Sin uso de memoria persistente, sin procesos en background.
- Compatible con el límite de memoria de etk-web (no añade huella).
