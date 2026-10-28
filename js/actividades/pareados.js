// Términos pareados: arrastrar y soltar (escritorio) o tocar término y luego caja (móvil).
import { h, montar, barajar } from '../ui.js'
import { progreso } from '../progreso.js'

/**
 * @param {object} opciones
 * @param {{termino: string, definicion: string}[]} opciones.pares
 * @param {string} opciones.clave
 * @param {number} [opciones.porRonda=6]
 */
export function crearPareados({ pares, clave, porRonda = 6 }) {
  const raiz = h('div', { class: 'pareados' })
  let ronda, fichas, ubicacion, seleccion, revisado

  function nuevaRonda() {
    ronda = barajar(pares)
      .slice(0, porRonda)
      .map((p, i) => ({ ...p, id: String(i) }))
    fichas = barajar(ronda)
    ubicacion = {} // idCaja -> idFicha
    seleccion = null
    revisado = false
    pintar()
  }

  const terminoDe = (id) => ronda.find((p) => p.id === id).termino
  const cajaDe = (idFicha) => Object.keys(ubicacion).find((c) => ubicacion[c] === idFicha)

  function colocar(idFicha, idCaja) {
    const anterior = cajaDe(idFicha)
    if (anterior) delete ubicacion[anterior]
    ubicacion[idCaja] = idFicha
    seleccion = null
    revisado = false
    pintar()
  }

  function devolver(idFicha) {
    const caja = cajaDe(idFicha)
    if (caja) delete ubicacion[caja]
    revisado = false
    pintar()
  }

  // Un <div role="button"> en vez de <button>: Firefox no permite arrastrar botones.
  function ficha(id) {
    const elegir = (e) => {
      e.stopPropagation()
      seleccion = seleccion === id ? null : id
      pintar()
    }
    return h(
      'div',
      {
        role: 'button',
        tabindex: '0',
        class: `ficha${seleccion === id ? ' seleccionada' : ''}`,
        draggable: 'true',
        'aria-pressed': String(seleccion === id),
        ondragstart: (e) => {
          e.dataTransfer.setData('text/plain', id)
          e.dataTransfer.effectAllowed = 'move'
        },
        onclick: elegir,
        onkeydown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            elegir(e)
          }
        },
      },
      terminoDe(id),
    )
  }

  function pintar() {
    const usadas = new Set(Object.values(ubicacion))
    const libres = fichas.filter((f) => !usadas.has(f.id))
    const aciertos = Object.entries(ubicacion).filter(([c, f]) => c === f).length

    const banco = h(
      'div',
      {
        class: 'banco',
        ondragover: (e) => e.preventDefault(),
        ondrop: (e) => {
          e.preventDefault()
          devolver(e.dataTransfer.getData('text/plain'))
        },
      },
      h('p', {}, seleccion ? 'Ahora toca la definición correcta' : 'Términos: arrastra o toca uno'),
      h('div', { class: 'fichas' }, libres.length ? libres.map((f) => ficha(f.id)) : h('span', { style: { color: 'var(--texto-tenue)' } }, 'Todos los términos están ubicados.')),
    )

    const cajas = ronda.map((def) => {
      const puesta = ubicacion[def.id]
      let clase = 'caja'
      if (revisado && puesta) clase += puesta === def.id ? ' bien' : ' mal'
      else if (seleccion) clase += ' destino-posible'

      const caja = h(
        'li',
        {
          class: clase,
          ondragover: (e) => {
            e.preventDefault()
            caja.classList.add('encima')
          },
          ondragleave: () => caja.classList.remove('encima'),
          ondrop: (e) => {
            e.preventDefault()
            colocar(e.dataTransfer.getData('text/plain'), def.id)
          },
          onclick: () => seleccion && colocar(seleccion, def.id),
        },
        h('p', {}, def.definicion),
        h(
          'div',
          { class: 'ranura' },
          puesta
            ? [
                ficha(puesta),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'btn-icono',
                    style: { border: 0 },
                    'aria-label': `Quitar ${terminoDe(puesta)}`,
                    onclick: (e) => {
                      e.stopPropagation()
                      devolver(puesta)
                    },
                  },
                  '×',
                ),
              ]
            : seleccion
              ? h('button', { type: 'button', class: 'btn btn-secundario', onclick: (e) => (e.stopPropagation(), colocar(seleccion, def.id)) }, `Colocar «${terminoDe(seleccion)}» aquí`)
              : 'Suelta aquí un término',
        ),
      )
      return caja
    })

    montar(
      raiz,
      banco,
      h('ul', { class: 'cajas' }, cajas),
      h(
        'div',
        { class: 'fila-botones', style: { marginTop: '16px' } },
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primario',
            disabled: Object.keys(ubicacion).length === 0,
            onclick: () => {
              revisado = true
              if (Object.keys(ubicacion).length === ronda.length) progreso.registrarPuntaje('pareados', clave, aciertos, ronda.length)
              pintar()
            },
          },
          'Revisar',
        ),
        h('button', { type: 'button', class: 'btn btn-secundario', onclick: nuevaRonda }, pares.length > porRonda ? 'Nueva ronda' : 'Reiniciar'),
        revisado &&
          h(
            'span',
            { role: 'status', style: { fontWeight: 600 } },
            `${aciertos} de ${ronda.length} correctos`,
            aciertos === ronda.length ? ' 🎉' : '',
          ),
      ),
    )
  }

  nuevaRonda()
  return raiz
}
