// Vista de una unidad de estudio (tema o región): pestañas de lectura y actividades.
import { h, montar } from '../ui.js'
import { cargarImagenes } from '../datos.js'
import { progreso } from '../progreso.js'
import { crearVisor } from '../actividades/visor.js'
import { crearFlashcards } from '../actividades/flashcards.js'
import { crearQuiz } from '../actividades/quiz.js'
import { crearPareados } from '../actividades/pareados.js'
import { crearDiagrama } from '../actividades/diagrama.js'

// Orden y nombre de las pestañas. Solo se muestran las que tienen contenido en el JSON.
export const PESTANAS = [
  { id: 'leer', nombre: 'Lectura', ico: '📖', hay: (d) => d.secciones?.length },
  { id: 'visor', nombre: 'Visor', ico: '🔬', hay: (d) => d.visor },
  { id: 'diagrama', nombre: 'Diagrama', ico: '🔢', hay: (d) => d.diagrama },
  { id: 'tarjetas', nombre: 'Flashcards', ico: '🗂️', hay: (d) => d.flashcards?.length },
  { id: 'quiz', nombre: 'Quiz', ico: '✅', hay: (d) => d.quiz?.length },
  { id: 'pareados', nombre: 'Pareados', ico: '🧩', hay: (d) => d.pareados?.length },
]

/**
 * @param {object} p
 * @param {object} p.datos       contenido JSON de la unidad
 * @param {string} p.base        hash base, p. ej. "#/t/histologia/tejido-oseo"
 * @param {string} p.clave       clave de progreso
 * @param {string} p.antetitulo
 * @param {string} p.pestana     pestaña activa
 */
export async function vistaUnidad({ datos, base, clave, antetitulo, pestana }) {
  const disponibles = PESTANAS.filter((t) => t.hay(datos))
  const actual = disponibles.find((t) => t.id === pestana) ?? disponibles[0]

  const cabecera = h(
    'header',
    { class: 'cabecera-pagina' },
    h('p', { class: 'antetitulo' }, antetitulo),
    h('h1', {}, datos.titulo),
    // En las actividades se omite la introducción para que quepan sin desplazarse en el celular.
    actual?.id === 'leer' && datos.intro && h('p', {}, datos.intro),
  )

  const pestanas = h(
    'nav',
    { class: 'pestanas', 'aria-label': 'Secciones del tema' },
    disponibles.map((t) =>
      h('a', { href: `${base}/${t.id}`, 'aria-current': t === actual ? 'page' : null }, h('span', { 'aria-hidden': 'true' }, t.ico), t.nombre),
    ),
  )

  const cuerpo = h('div', {})
  const imagenes = datos.visor || datos.diagrama ? await cargarImagenes() : {}

  switch (actual?.id) {
    case 'leer':
      montar(cuerpo, lectura(datos, clave, base, disponibles))
      break
    case 'visor': {
      const img = imagenes[datos.visor.imagen]
      montar(
        cuerpo,
        datos.visor.instrucciones && h('p', { style: { marginTop: 0, color: 'var(--texto-suave)' } }, datos.visor.instrucciones),
        crearVisor({ imagen: img, puntos: datos.visor.puntos, credito: credito(img) }),
      )
      break
    }
    case 'diagrama': {
      const img = imagenes[datos.diagrama.imagen]
      montar(
        cuerpo,
        datos.diagrama.instrucciones && h('p', { style: { marginTop: 0, color: 'var(--texto-suave)' } }, datos.diagrama.instrucciones),
        crearDiagrama({ imagen: img, marcadores: datos.diagrama.marcadores, clave }),
      )
      break
    }
    case 'tarjetas':
      montar(cuerpo, crearFlashcards({ tarjetas: datos.flashcards, clave }))
      break
    case 'quiz':
      montar(cuerpo, crearQuiz({ preguntas: datos.quiz, clave, porRonda: 10 }))
      break
    case 'pareados':
      montar(cuerpo, h('p', { style: { marginTop: 0, color: 'var(--texto-suave)' } }, 'Une cada término con su definición. En el celular: toca un término y luego la caja.'), crearPareados({ pares: datos.pareados, clave }))
      break
  }

  return [cabecera, pestanas, cuerpo]
}

function lectura(datos, clave, base, disponibles) {
  const leido = !!progreso.obtener().leidos[clave]
  const siguiente = disponibles.find((t) => t.id !== 'leer')

  const boton = h(
    'button',
    {
      type: 'button',
      class: `btn ${leido ? 'btn-secundario' : 'btn-primario'} btn-bloque`,
      onclick: () => {
        const ahora = !progreso.obtener().leidos[clave]
        progreso.marcarLeido(clave, ahora)
        boton.textContent = ahora ? '✓ Leído' : 'Marcar como leído'
        boton.className = `btn ${ahora ? 'btn-secundario' : 'btn-primario'} btn-bloque`
      },
    },
    leido ? '✓ Leído' : 'Marcar como leído',
  )

  return [
    datos.secciones.map((s, i) =>
      h(
        'section',
        { class: 'tarjeta bloque-lectura' },
        h('h2', {}, h('span', { class: 'num' }, String(i + 1)), h('span', {}, s.titulo)),
        s.claves?.length && h('ul', { class: 'chips' }, s.claves.map((c) => h('li', { class: 'etiqueta' }, c))),
        (s.texto ?? []).map((p) => h('p', {}, p)),
        s.puntos?.length && h('ul', { class: 'puntos' }, s.puntos.map((p) => h('li', {}, p))),
        s.clave && h('div', { class: 'clave-clinica' }, h('strong', {}, 'Clave: '), s.clave),
      ),
    ),
    datos.pendiente && h('p', { class: 'aviso' }, datos.pendiente),
    h('div', { class: 'marcar-leido' }, boton),
    siguiente &&
      h(
        'a',
        { class: 'btn btn-secundario btn-bloque', href: `${base}/${siguiente.id}`, style: { marginTop: '10px' } },
        `Practicar: ${siguiente.nombre} →`,
      ),
    datos.fuentes?.length &&
      h('p', { style: { marginTop: '24px', fontSize: '.8rem', color: 'var(--texto-tenue)' } }, 'Referencias: ', datos.fuentes.join('; '), '.'),
  ]
}

export function credito(img) {
  if (!img) return null
  return [
    'Imagen: ',
    img.fuente ? h('a', { href: img.fuente, target: '_blank', rel: 'noopener' }, img.autor) : img.autor,
    img.licencia && [' · ', img.licenciaUrl ? h('a', { href: img.licenciaUrl, target: '_blank', rel: 'noopener' }, img.licencia) : img.licencia],
    img.modificacion && ` · ${img.modificacion}`,
  ]
}
