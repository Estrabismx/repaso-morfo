# Repaso Morfo

Web interactiva para estudiar Morfología (Histología y Anatomía), pensada primero para el celular.
Es HTML, CSS y JavaScript sin compilación: GitHub Pages la publica tal como está en el repositorio.

**Sitio:** <https://estrabismx.github.io/repaso-morfo/>

## Publicar en GitHub Pages

1. En GitHub: **Settings → Pages**.
2. En *Build and deployment*, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
3. Guarda. Cada `git push` a `main` actualiza el sitio en uno o dos minutos.

## Probar en el computador

Los navegadores bloquean los módulos JavaScript si abres `index.html` con doble clic.
Usa un servidor local, por ejemplo la extensión **Live Server** de VS Code (clic derecho en `index.html` → *Open with Live Server*),
o desde una terminal: `python -m http.server` y abre <http://localhost:8000>.

## Estructura

```text
index.html                  Página única (la navegación usa #/rutas)
css/styles.css              Estilos mobile-first
js/
  main.js                   Arranque, enrutado y menú
  datos.js                  Carga de los JSON
  progreso.js               Progreso guardado en el navegador (localStorage)
  ui.js                     Utilidades
  vistas/                   Páginas: inicio, módulo, tema/región, actividades, créditos
  actividades/              visor, flashcards, quiz, pareados, diagrama
data/
  web_estudio_morfologia.json   Estructura del sitio (módulos, temas, regiones)
  imagenes.json                 Imágenes con autoría y licencia
  temas/<modulo>/<tema>.json    Contenido de cada tema
  regiones/<region>.json        Contenido de cada región (Fases 2 y 3)
img/                        Microfotografías (WebP) y esquemas SVG
```

## Editar contenido

Cada tema es un archivo JSON. Una pestaña aparece solo si su sección tiene contenido:

```jsonc
{
  "titulo": "Tejido Óseo",
  "intro": "Texto breve bajo el título",
  "secciones": [
    { "titulo": "…", "claves": ["…"], "texto": ["párrafo", "…"], "puntos": ["viñeta"], "clave": "dato clave" }
  ],
  "visor":    { "imagen": "id en imagenes.json", "puntos": [{ "x": 50, "y": 40, "titulo": "…", "descripcion": "…" }] },
  "diagrama": { "imagen": "id", "marcadores": [{ "n": 1, "x": 50, "y": 40, "respuestas": ["Nombre oficial", "sinónimo"] }] },
  "flashcards": [{ "frente": "…", "categoria": "…", "reverso": { "Función": "…" } }],
  "quiz":     [{ "tipo": "multiple | vf", "pregunta": "…", "opciones": ["…"], "correcta": 0, "explicacion": "…" }],
  "pareados": [{ "termino": "…", "definicion": "…" }]
}
```

- `x` e `y` son porcentajes del ancho y alto de la imagen.
- `correcta` es la posición de la opción correcta, contando desde 0.
- Las regiones usan el mismo formato en `data/regiones/<region>.json`, por ejemplo `extremidad-inferior.json`.

## Créditos

Las microfotografías provienen de Wikimedia Commons, con licencias CC0 y CC BY-SA 4.0. El detalle está en la página **Créditos** del sitio y en `data/imagenes.json`.
Los textos son de elaboración propia a partir de bibliografía estándar (Ross, Junqueira, Latarjet, Moore).
