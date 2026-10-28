// Quiz de opción múltiple y verdadero/falso con retroalimentación inmediata y puntaje final.
import { h, montar, barajar, barraProgreso } from '../ui.js'
import { progreso } from '../progreso.js'

/**
 * @param {object} opciones
 * @param {{tipo: 'multiple'|'vf', pregunta: string, opciones: string[], correcta: number, explicacion: string}[]} opciones.preguntas
 * @param {string} opciones.clave
 * @param {number} [opciones.porRonda]  cantidad de preguntas por intento (por defecto, todas)
 */
export function crearQuiz({ preguntas, clave, porRonda }) {
  const raiz = h('div', { class: 'quiz' })
  let ronda, indice, respuestas

  // Las opciones de opción múltiple se barajan en cada intento para que la posición no delate la respuesta.
  function mezclarOpciones(p) {
    if (p.tipo === 'vf') return p
    const orden = barajar(p.opciones.map((_, i) => i))
    return { ...p, opciones: orden.map((i) => p.opciones[i]), correcta: orden.indexOf(p.correcta) }
  }

  function nuevaRonda() {
    ronda = barajar(preguntas)
      .slice(0, porRonda ?? preguntas.length)
      .map(mezclarOpciones)
    indice = 0
    respuestas = []
    pintarPregunta()
  }

  const aciertos = () => respuestas.filter((r, i) => r === ronda[i].correcta).length

  function pintarPregunta() {
    const p = ronda[indice]
    const elegida = respuestas[indice]
    const respondida = elegida !== undefined
    const esVF = p.tipo === 'vf'

    const opciones = p.opciones.map((texto, i) => {
      let clase = 'opcion'
      let marca = null
      if (respondida) {
        if (i === p.correcta) ((clase += ' correcta'), (marca = '✓'))
        else if (i === elegida) ((clase += ' incorrecta'), (marca = '✗'))
        else clase += ' atenuada'
      }
      return h(
        'button',
        {
          type: 'button',
          class: clase,
          disabled: respondida,
          onclick: () => {
            respuestas[indice] = i
            pintarPregunta()
          },
        },
        h('span', {}, texto),
        marca && h('span', { 'aria-hidden': 'true' }, marca),
      )
    })

    const correcta = respondida && elegida === p.correcta
    const ultima = indice === ronda.length - 1

    montar(
      raiz,
      h(
        'div',
        { class: 'tarjeta' },
        h(
          'div',
          { class: 'quiz-cabecera' },
          h('span', {}, `Pregunta ${indice + 1} de ${ronda.length}`),
          h('span', { class: 'etiqueta' }, esVF ? 'Verdadero / Falso' : 'Opción múltiple'),
        ),
        barraProgreso((indice + (respondida ? 1 : 0)) / ronda.length, 'Avance del quiz'),
        h('h2', { class: 'quiz-pregunta' }, p.pregunta),
        h('div', { class: `opciones${esVF ? ' vf' : ''}` }, opciones),
        respondida &&
          h(
            'div',
            { class: `retro ${correcta ? 'ok' : 'mal'}`, role: 'status' },
            h('strong', {}, correcta ? '¡Correcto!' : `Incorrecto. La respuesta es: ${p.opciones[p.correcta]}`),
            p.explicacion,
          ),
        h(
          'div',
          { class: 'quiz-pie' },
          h('span', {}, 'Puntaje: ', h('strong', {}, `${aciertos()}`)),
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn-primario',
              disabled: !respondida,
              onclick: () => {
                if (ultima) return pintarResultado()
                indice++
                pintarPregunta()
                raiz.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
              },
            },
            ultima ? 'Ver resultado' : 'Siguiente →',
          ),
        ),
      ),
    )
  }

  function pintarResultado() {
    const ok = aciertos()
    const total = ronda.length
    const pct = Math.round((ok / total) * 100)
    const previo = progreso.obtener().quiz[clave]?.mejor
    progreso.registrarPuntaje('quiz', clave, ok, total)

    montar(
      raiz,
      h(
        'div',
        { class: 'tarjeta resultado' },
        h('p', { class: 'antetitulo' }, 'Resultado final'),
        h('p', { class: 'puntaje' }, `${ok}`, h('small', {}, `/${total}`)),
        h('p', {}, `${pct}% de respuestas correctas`),
        previo != null && ok > previo && h('p', { class: 'etiqueta' }, '¡Nuevo récord personal!'),
        h(
          'p',
          { style: { color: 'var(--texto-suave)' } },
          pct === 100
            ? 'Excelente: dominas este tema.'
            : pct >= 60
              ? 'Buen trabajo. Revisa las preguntas que fallaste.'
              : 'Vuelve a la lectura del tema y repite el quiz.',
        ),
        h(
          'ul',
          {},
          ronda.map((p, i) => {
            const bien = respuestas[i] === p.correcta
            return h(
              'li',
              {},
              h('span', { class: bien ? 'si' : 'no', 'aria-label': bien ? 'Correcta' : 'Incorrecta' }, bien ? '✓' : '✗'),
              h('span', {}, p.pregunta, !bien && h('small', { style: { display: 'block', color: 'var(--texto-tenue)' } }, `Respuesta: ${p.opciones[p.correcta]}`)),
            )
          }),
        ),
        h('button', { type: 'button', class: 'btn btn-primario btn-bloque', onclick: nuevaRonda }, 'Reintentar (preguntas en otro orden)'),
      ),
    )
  }

  nuevaRonda()
  return raiz
}
