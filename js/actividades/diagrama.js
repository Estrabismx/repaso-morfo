// Diagrama numerado: escribir (o elegir) el nombre de cada estructura, con validación en tiempo real.
import { h, montar, normalizar, barraProgreso } from '../ui.js'
import { progreso } from '../progreso.js'

// Palabras que no cambian la respuesta: "Cabeza del fémur" == "cabeza femur".
const RELLENO = /\b(el|la|los|las|de|del)\b/g
const comparable = (s) => normalizar(s).replace(RELLENO, ' ').replace(/\s+/g, ' ').trim()

/**
 * @param {object} opciones
 * @param {{src: string, alt: string, ancho: number, alto: number}} opciones.imagen
 * @param {{n: number, x: number, y: number, respuestas: string[]}[]} opciones.marcadores  la primera respuesta es la oficial
 * @param {string} opciones.clave
 */
export function crearDiagrama({ imagen, marcadores, clave }) {
  const valores = {}
  const tocados = {}
  let lista = false
  let solucion = false
  let registrado = false

  const raiz = h('div', { class: 'diagrama' })
  const esCorrecta = (m) => m.respuestas.some((r) => comparable(r) === comparable(valores[m.n] ?? ''))
  const opciones = marcadores.map((m) => m.respuestas[0]).sort((a, b) => a.localeCompare(b, 'es'))

  const puntos = marcadores.map((m) =>
    h('span', { class: 'marcador', style: { left: `${m.x}%`, top: `${m.y}%` }, 'aria-hidden': 'true' }, String(m.n)),
  )
  const figura = h(
    'figure',
    { class: 'diagrama-figura', style: { aspectRatio: `${imagen.ancho} / ${imagen.alto}`, margin: 0 } },
    h('img', { src: imagen.src, alt: imagen.alt, width: imagen.ancho, height: imagen.alto }),
    puntos,
  )

  const panel = h('div', {})
  const estado = h('div', {})
  const filas = marcadores.map((m) => crearFila(m))

  function crearFila(m) {
    const icono = h('span', { class: 'estado-icono', 'aria-hidden': 'true' })
    const nota = h('p', { class: 'solucion', hidden: true })
    const campoId = `campo-${clave}-${m.n}`.replace(/[^a-z0-9-]/gi, '-')

    const alCambiar = (e) => {
      valores[m.n] = e.target.value
      if (lista) tocados[m.n] = true
      actualizar()
    }
    const alSalir = () => {
      tocados[m.n] = true
      actualizar()
    }

    const entrada = h('input', {
      id: campoId,
      class: 'campo',
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: 'Nombre de la estructura',
      oninput: alCambiar,
      onblur: alSalir,
    })
    const selector = h(
      'select',
      { id: campoId, class: 'campo', onchange: alCambiar, onblur: alSalir },
      h('option', { value: '' }, 'Selecciona…'),
      opciones.map((o) => h('option', {}, o)),
    )
    const li = h('li', {}, h('label', { class: 'n', for: campoId }, String(m.n)), entrada, icono, nota)
    return { m, li, entrada, selector, icono, nota }
  }

  function actualizar() {
    let bien = 0
    for (const f of filas) {
      const control = lista ? f.selector : f.entrada
      if (!f.li.contains(control)) (lista ? f.entrada : f.selector).replaceWith(control)
      control.value = valores[f.m.n] ?? ''
      control.disabled = solucion

      const ok = esCorrecta(f.m)
      const error = !ok && Boolean(tocados[f.m.n]) && (valores[f.m.n] ?? '') !== ''
      if (ok) bien++
      control.classList.toggle('bien', ok)
      control.classList.toggle('mal', error)
      control.setAttribute('aria-invalid', String(error))
      f.icono.className = `estado-icono${ok ? ' bien' : error ? ' mal' : ''}`
      f.icono.textContent = ok ? '✓' : error ? '✗' : ''
      f.nota.hidden = !(solucion && !ok)
      f.nota.textContent = `Respuesta: ${f.m.respuestas[0]}`
      puntos[filas.indexOf(f)].classList.toggle('bien', ok)
    }

    if (bien === marcadores.length && !solucion && !registrado) {
      registrado = true
      progreso.registrarPuntaje('diagrama', clave, bien, marcadores.length)
    }

    montar(
      estado,
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: '6px' } },
        h('strong', {}, 'Progreso'),
        h('span', {}, `${bien}/${marcadores.length}`),
      ),
      barraProgreso(bien / marcadores.length, 'Estructuras identificadas'),
      bien === marcadores.length && h('p', { role: 'status', style: { color: 'var(--ok)', fontWeight: 600, margin: '8px 0 0' } }, '¡Identificaste todas las estructuras!'),
    )
  }

  montar(
    panel,
    estado,
    h(
      'label',
      { class: 'interruptor' },
      h('input', { type: 'checkbox', onchange: (e) => ((lista = e.target.checked), actualizar()) }),
      'Elegir de una lista',
    ),
    h('ol', { class: 'respuestas' }, filas.map((f) => f.li)),
    h(
      'div',
      { class: 'fila-botones' },
      h('button', { type: 'button', class: 'btn btn-secundario', onclick: () => ((solucion = true), actualizar()) }, 'Ver solución'),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secundario',
          onclick: () => {
            for (const k of Object.keys(valores)) delete valores[k]
            for (const k of Object.keys(tocados)) delete tocados[k]
            solucion = false
            registrado = false
            actualizar()
          },
        },
        'Reiniciar',
      ),
    ),
  )

  actualizar()
  return montar(raiz, figura, panel)
}
