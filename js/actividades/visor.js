// Visor de imágenes con zoom (pellizco, rueda, doble toque, botones), paneo y puntos interactivos.
import { h, montar } from '../ui.js'

const ZOOM_MIN = 1
const ZOOM_MAX = 5
const limitar = (v, min, max) => Math.min(Math.max(v, min), max)

/**
 * @param {object} opciones
 * @param {{src: string, alt: string, ancho: number, alto: number}} opciones.imagen
 * @param {{x: number, y: number, titulo: string, descripcion: string}[]} opciones.puntos  x/y en % de la imagen
 * @param {Node} [opciones.credito]
 */
export function crearVisor({ imagen, puntos, credito }) {
  let zoom = 1
  let pos = { x: 0, y: 0 }
  let activo = -1
  let ocultarNombres = false

  const img = h('img', { src: imagen.src, alt: imagen.alt, width: imagen.ancho, height: imagen.alto, decoding: 'async' })
  const capaPuntos = puntos.map((p, i) =>
    h(
      'div',
      { class: `punto${p.x > 65 ? ' derecha' : ''}`, style: { left: `${p.x}%`, top: `${p.y}%` } },
      h(
        'button',
        {
          type: 'button',
          'aria-pressed': 'false',
          'aria-label': `Punto ${i + 1}`,
          onpointerdown: (e) => e.stopPropagation(),
          onclick: (e) => {
            e.stopPropagation()
            seleccionar(activo === i ? -1 : i)
          },
        },
        String(i + 1),
      ),
      h('span', { class: 'rotulo', 'aria-hidden': 'true' }, p.titulo),
    ),
  )
  const lienzo = h('div', { class: 'visor-lienzo' }, img, capaPuntos)
  const marco = h(
    'div',
    {
      class: 'visor-marco',
      style: { aspectRatio: `${imagen.ancho} / ${imagen.alto}` },
      role: 'group',
      'aria-label': `${imagen.alt}. Usa los botones de zoom o pellizca para ampliar.`,
    },
    lienzo,
  )

  const zoomValor = h('span', { class: 'zoom-valor', 'aria-live': 'polite' }, '100%')
  const btnMas = h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Acercar', onclick: () => zoomCentro(zoom * 1.5) }, '+')
  const btnMenos = h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Alejar', onclick: () => zoomCentro(zoom / 1.5) }, '−')
  const btnReset = h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Restablecer vista', onclick: () => aplicar(1, { x: 0, y: 0 }) }, '⤢')
  const chkOcultar = h('input', {
    type: 'checkbox',
    onchange: (e) => {
      ocultarNombres = e.target.checked
      marco.classList.toggle('sin-nombres', ocultarNombres)
      capaPuntos.forEach((n) => (n.querySelector('.rotulo').hidden = ocultarNombres))
      pintarInfo()
    },
  })

  const info = h('div', { class: 'tarjeta visor-info', 'aria-live': 'polite' })

  // ---------- Transformación ----------
  function aplicar(z, p) {
    zoom = limitar(z, ZOOM_MIN, ZOOM_MAX)
    const w = marco.clientWidth
    const hgt = marco.clientHeight
    pos = { x: limitar(p.x, w - w * zoom, 0), y: limitar(p.y, hgt - hgt * zoom, 0) }
    lienzo.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`
    // Los puntos mantienen su tamaño en pantalla.
    for (const n of capaPuntos) n.style.transform = `scale(${1 / zoom})`
    zoomValor.textContent = `${Math.round(zoom * 100)}%`
    btnMas.disabled = zoom >= ZOOM_MAX
    btnMenos.disabled = zoom <= ZOOM_MIN
    marco.classList.toggle('ampliado', zoom > 1)
  }

  // Zoom manteniendo fijo el punto (px, py) del marco.
  function zoomEn(nuevo, px, py) {
    const z = limitar(nuevo, ZOOM_MIN, ZOOM_MAX)
    const f = z / zoom
    aplicar(z, { x: px - (px - pos.x) * f, y: py - (py - pos.y) * f })
  }
  const zoomCentro = (nuevo) => zoomEn(nuevo, marco.clientWidth / 2, marco.clientHeight / 2)

  // ---------- Gestos ----------
  const punteros = new Map()
  let gesto = null
  let ultimoToque = 0

  const local = (e) => {
    const r = marco.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function iniciarGesto() {
    const pts = [...punteros.values()]
    if (pts.length === 1) {
      gesto = { tipo: 'pan', inicio: pts[0], pos0: { ...pos }, movido: false }
    } else if (pts.length === 2) {
      const [a, b] = pts
      gesto = {
        tipo: 'pellizco',
        dist0: Math.hypot(a.x - b.x, a.y - b.y),
        zoom0: zoom,
        centro0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        pos0: { ...pos },
      }
    }
  }

  marco.addEventListener('pointerdown', (e) => {
    marco.setPointerCapture(e.pointerId)
    punteros.set(e.pointerId, local(e))
    iniciarGesto()
  })

  marco.addEventListener('pointermove', (e) => {
    if (!punteros.has(e.pointerId) || !gesto) return
    punteros.set(e.pointerId, local(e))
    const pts = [...punteros.values()]

    if (gesto.tipo === 'pan' && pts.length === 1) {
      const dx = pts[0].x - gesto.inicio.x
      const dy = pts[0].y - gesto.inicio.y
      if (Math.hypot(dx, dy) > 6) gesto.movido = true
      if (zoom > 1 && gesto.movido) {
        marco.classList.add('arrastrando')
        aplicar(zoom, { x: gesto.pos0.x + dx, y: gesto.pos0.y + dy })
      }
    } else if (gesto.tipo === 'pellizco' && pts.length === 2) {
      const [a, b] = pts
      const z = limitar((gesto.zoom0 * Math.hypot(a.x - b.x, a.y - b.y)) / gesto.dist0, ZOOM_MIN, ZOOM_MAX)
      const centro = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const f = z / gesto.zoom0
      aplicar(z, {
        x: centro.x - (gesto.centro0.x - gesto.pos0.x) * f,
        y: centro.y - (gesto.centro0.y - gesto.pos0.y) * f,
      })
    }
  })

  function terminar(e) {
    if (!punteros.has(e.pointerId)) return
    const fueToque = gesto?.tipo === 'pan' && !gesto.movido && punteros.size === 1
    punteros.delete(e.pointerId)
    marco.classList.remove('arrastrando')

    if (fueToque) {
      const ahora = Date.now()
      if (ahora - ultimoToque < 300) {
        const p = local(e)
        zoom > 1.01 ? aplicar(1, { x: 0, y: 0 }) : zoomEn(2.5, p.x, p.y)
        ultimoToque = 0
      } else {
        ultimoToque = ahora
      }
    }
    // Si queda un dedo tras un pellizco, continúa como paneo.
    gesto = null
    if (punteros.size > 0) iniciarGesto()
  }
  marco.addEventListener('pointerup', terminar)
  marco.addEventListener('pointercancel', terminar)

  marco.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      const p = local(e)
      zoomEn(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y)
    },
    { passive: false },
  )

  // Mantiene los límites al rotar el teléfono o cambiar el tamaño de la ventana.
  new ResizeObserver(() => aplicar(zoom, pos)).observe(marco)

  // ---------- Selección ----------
  let revelado = false

  function seleccionar(i) {
    activo = i
    revelado = false
    capaPuntos.forEach((n, j) => {
      n.classList.toggle('activo', j === i)
      n.querySelector('button').setAttribute('aria-pressed', String(j === i))
    })
    pintarInfo()
  }

  function pintarInfo() {
    if (activo < 0) {
      montar(
        info,
        h('h3', {}, 'Explora la imagen'),
        h(
          'p',
          {},
          ocultarNombres
            ? 'Modo autoevaluación: toca un punto, intenta nombrar la estructura y luego revela la respuesta.'
            : 'Toca un punto numerado para ver qué estructura es. Pellizca o toca dos veces para ampliar.',
        ),
      )
      return
    }
    const p = puntos[activo]
    const oculto = ocultarNombres && !revelado
    montar(
      info,
      h('p', { class: 'antetitulo' }, `Punto ${activo + 1} de ${puntos.length}`),
      oculto
        ? [
            h('h3', {}, '¿Qué estructura es?'),
            h(
              'div',
              { class: 'fila-botones', style: { marginTop: '10px' } },
              h('button', { type: 'button', class: 'btn btn-primario', onclick: () => ((revelado = true), pintarInfo()) }, 'Mostrar respuesta'),
            ),
          ]
        : [h('h3', {}, p.titulo), h('p', {}, p.descripcion)],
      h(
        'div',
        { class: 'navegar' },
        h('button', { type: 'button', class: 'btn btn-secundario', onclick: () => seleccionar((activo - 1 + puntos.length) % puntos.length) }, '← Anterior'),
        h('button', { type: 'button', class: 'btn btn-secundario', onclick: () => seleccionar((activo + 1) % puntos.length) }, 'Siguiente →'),
      ),
    )
  }

  pintarInfo()
  requestAnimationFrame(() => aplicar(1, pos))

  return h(
    'div',
    { class: 'visor' },
    h(
      'div',
      { class: 'visor-herramientas' },
      btnMenos,
      btnMas,
      btnReset,
      zoomValor,
      h('label', { class: 'interruptor' }, chkOcultar, 'Ocultar nombres'),
    ),
    marco,
    credito && h('p', { class: 'visor-pie' }, credito),
    info,
  )
}
