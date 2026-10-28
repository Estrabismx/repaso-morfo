// Mazo de flashcards: una tarjeta a la vez, giro 3D al tocar y deslizamiento para avanzar.
import { h, montar, barajar, barraProgreso } from '../ui.js'
import { progreso } from '../progreso.js'

/**
 * @param {object} opciones
 * @param {{frente: string, categoria?: string, reverso: Record<string, string>}[]} opciones.tarjetas
 * @param {string} opciones.clave  identificador del tema para guardar el progreso
 */
export function crearFlashcards({ tarjetas, clave }) {
  // El id de cada tarjeta es su texto de frente: estable aunque se reordene el JSON.
  let orden = tarjetas.map((t) => ({ ...t, id: t.frente }))
  let indice = 0
  let volteada = false
  let soloPendientes = false
  let sabidas = progreso.tarjetasSabidas(clave)

  const raiz = h('div', { class: 'mazo' })

  const visibles = () => (soloPendientes ? orden.filter((t) => !sabidas.has(t.id)) : orden)

  function ir(delta) {
    const n = visibles().length
    if (!n) return
    indice = (indice + delta + n) % n
    volteada = false
    pintar()
  }

  function pintar() {
    const lista = visibles()
    indice = Math.min(indice, Math.max(lista.length - 1, 0))
    const t = lista[indice]

    const estado = h(
      'div',
      { class: 'mazo-estado' },
      h('span', {}, lista.length ? `Tarjeta ${indice + 1} de ${lista.length}` : 'Sin tarjetas'),
      h('span', {}, `✓ ${sabidas.size}/${orden.length} sabidas`),
    )

    if (!t) {
      montar(
        raiz,
        estado,
        barraProgreso(sabidas.size / orden.length, 'Tarjetas sabidas'),
        h(
          'div',
          { class: 'tarjeta', style: { marginTop: '14px', textAlign: 'center' } },
          h('p', {}, '¡Marcaste todas las tarjetas como sabidas! 🎉'),
          h('button', { type: 'button', class: 'btn btn-secundario', onclick: () => ((soloPendientes = false), pintar()) }, 'Ver todas'),
        ),
      )
      return
    }

    const tarjeta = h(
      'button',
      {
        type: 'button',
        class: `flip-tarjeta${volteada ? ' volteada' : ''}`,
        'aria-label': volteada ? `${t.frente}: reverso. Toca para ver el frente.` : `${t.frente}. Toca para ver la respuesta.`,
        onclick: () => {
          volteada = !volteada
          tarjeta.classList.toggle('volteada', volteada)
        },
      },
      h(
        'div',
        { class: 'flip-cara flip-frente', 'aria-hidden': String(volteada) },
        h('span', { class: 'categoria' }, t.categoria ?? 'Concepto'),
        h('h3', {}, t.frente),
        h('small', {}, 'Toca para voltear ↻ · Desliza para cambiar'),
      ),
      h(
        'div',
        { class: 'flip-cara flip-reverso', 'aria-hidden': String(!volteada) },
        h('h3', {}, t.frente),
        h('dl', {}, Object.entries(t.reverso).map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
      ),
    )

    const escena = h('div', { class: 'flip-escena' }, tarjeta)
    activarDeslizamiento(escena)

    const sabida = sabidas.has(t.id)

    montar(
      raiz,
      estado,
      barraProgreso(sabidas.size / orden.length, 'Tarjetas sabidas'),
      h('div', { style: { height: '14px' } }),
      escena,
      h(
        'div',
        { class: 'mazo-acciones' },
        h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Anterior', onclick: () => ir(-1) }, '←'),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-secundario btn-sabida',
            'aria-pressed': String(sabida),
            onclick: () => {
              progreso.marcarTarjeta(clave, t.id, !sabida)
              sabidas = progreso.tarjetasSabidas(clave)
              // En modo "pendientes" la tarjeta desaparece; el índice ya apunta a la siguiente.
              if (!soloPendientes && !sabida) ir(1)
              else pintar()
            },
          },
          sabida ? '✓ La sé' : 'La sé',
        ),
        h('button', { type: 'button', class: 'btn btn-secundario', onclick: () => ir(1) }, 'Repasar'),
        h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Siguiente', onclick: () => ir(1) }, '→'),
      ),
      h(
        'div',
        { class: 'fila-botones', style: { marginTop: '12px', justifyContent: 'space-between' } },
        h(
          'label',
          { class: 'interruptor' },
          h('input', { type: 'checkbox', checked: soloPendientes, onchange: (e) => ((soloPendientes = e.target.checked), (indice = 0), pintar()) }),
          'Solo pendientes',
        ),
        h('button', { type: 'button', class: 'btn btn-secundario', onclick: () => ((orden = barajar(orden)), (indice = 0), (volteada = false), pintar()) }, 'Barajar'),
      ),
    )
  }

  // Deslizar horizontalmente cambia de tarjeta; el scroll vertical sigue funcionando.
  function activarDeslizamiento(el) {
    let x0 = null
    let y0 = null
    el.addEventListener('touchstart', (e) => ((x0 = e.touches[0].clientX), (y0 = e.touches[0].clientY)), { passive: true })
    el.addEventListener(
      'touchend',
      (e) => {
        if (x0 == null) return
        const dx = e.changedTouches[0].clientX - x0
        const dy = e.changedTouches[0].clientY - y0
        x0 = null
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          e.preventDefault() // evita que el toque final voltee la tarjeta
          ir(dx < 0 ? 1 : -1)
        }
      },
      { passive: false },
    )
  }

  pintar()
  return raiz
}
