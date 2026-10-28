// Páginas generales: inicio, módulo, actividades, región sin contenido y créditos.
import { h } from '../ui.js'
import { cargarTema, cargarImagenes } from '../datos.js'
import { progreso } from '../progreso.js'
import { PESTANAS, credito } from './unidad.js'

const ICONOS_MODULO = { histologia: '🔬', anatomia: '🦴' }

export const claveTema = (t) => `t:${t.modulo}/${t.slug}`
export const claveRegion = (r) => `r:${r.slug}`

function estadoTema(t) {
  const p = progreso.obtener()
  const k = claveTema(t)
  const partes = []
  if (p.leidos[k]) partes.push('✓ Leído')
  if (p.quiz[k]) partes.push(`Quiz ${p.quiz[k].mejor}/${p.quiz[k].total}`)
  return partes.join(' · ')
}

function enlaceTema(t, icono = '📘') {
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'enlace-tarjeta', href: `#/t/${t.modulo}/${t.slug}` },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, icono),
      h('span', { class: 'texto' }, t.nombre, h('small', {}, estadoTema(t) || 'Sin empezar')),
      h('span', { class: 'flecha', 'aria-hidden': 'true' }, '›'),
    ),
  )
}

export function vistaInicio(estructura) {
  const p = progreso.obtener()
  const temas = estructura.modulos.flatMap((m) => m.temas)
  const leidos = temas.filter((t) => p.leidos[claveTema(t)]).length
  const quizzes = Object.keys(p.quiz).length
  const tarjetas = Object.values(p.tarjetas).reduce((s, a) => s + a.length, 0)

  return [
    h(
      'section',
      { class: 'portada' },
      h('h1', {}, 'Repaso de Morfología'),
      h('p', {}, estructura.descripcion),
      h('a', { class: 'btn', href: '#/m/histologia' }, 'Empezar a estudiar'),
    ),
    h(
      'div',
      { class: 'resumen-progreso', 'aria-label': 'Tu progreso' },
      h('div', {}, h('strong', {}, `${leidos}/${temas.length}`), h('span', {}, 'temas leídos')),
      h('div', {}, h('strong', {}, String(quizzes)), h('span', {}, 'quizzes hechos')),
      h('div', {}, h('strong', {}, String(tarjetas)), h('span', {}, 'tarjetas sabidas')),
    ),
    estructura.modulos.map((m) => [
      h('h2', { class: 'seccion-titulo' }, m.nombre),
      h('ul', { class: 'lista-enlaces dos-columnas' }, m.temas.map((t) => enlaceTema(t, ICONOS_MODULO[m.slug]))),
    ]),
    h('h2', { class: 'seccion-titulo' }, 'Actividades'),
    h(
      'ul',
      { class: 'lista-enlaces' },
      h(
        'li',
        {},
        h(
          'a',
          { class: 'enlace-tarjeta', href: '#/actividades' },
          h('span', { class: 'ico', 'aria-hidden': 'true' }, '✎'),
          h('span', { class: 'texto' }, 'Ver todas las actividades', h('small', {}, 'Visor, flashcards, quiz, pareados y diagramas')),
          h('span', { class: 'flecha', 'aria-hidden': 'true' }, '›'),
        ),
      ),
    ),
  ]
}

export function vistaModulo(modulo) {
  return [
    h('header', { class: 'cabecera-pagina' }, h('p', { class: 'antetitulo' }, 'Módulo'), h('h1', {}, modulo.nombre)),
    h('h2', { class: 'seccion-titulo', style: { marginTop: 0 } }, 'Temas'),
    h('ul', { class: 'lista-enlaces' }, modulo.temas.map((t) => enlaceTema(t, ICONOS_MODULO[modulo.slug]))),
    modulo.regiones.length > 0 && [
      h('h2', { class: 'seccion-titulo' }, 'Regiones'),
      h(
        'ul',
        { class: 'lista-enlaces dos-columnas' },
        modulo.regiones.map((r) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'enlace-tarjeta', href: `#/r/${r.slug}` },
              h('span', { class: 'ico', 'aria-hidden': 'true' }, '📍'),
              h('span', { class: 'texto' }, r.nombre),
              h('span', { class: 'flecha', 'aria-hidden': 'true' }, '›'),
            ),
          ),
        ),
      ),
    ],
  ]
}

export async function vistaActividades(estructura) {
  const temas = estructura.modulos.flatMap((m) => m.temas)
  const datos = await Promise.all(temas.map((t) => cargarTema(t.modulo, t.slug)))
  const descripciones = {
    visor: estructura.actividades.find((a) => a.tipo.startsWith('Visor'))?.descripcion,
    tarjetas: estructura.actividades.find((a) => a.tipo.includes('Flashcards'))?.descripcion,
    quiz: estructura.actividades.find((a) => a.tipo.startsWith('Quiz'))?.descripcion,
    pareados: estructura.actividades.find((a) => a.tipo.includes('Pareados'))?.descripcion,
    diagrama: estructura.actividades.find((a) => a.tipo.includes('Diagramas'))?.descripcion,
  }

  return [
    h('header', { class: 'cabecera-pagina' }, h('h1', {}, 'Actividades'), h('p', {}, 'Elige un tipo de actividad y luego el tema.')),
    PESTANAS.filter((p) => p.id !== 'leer').map((tipo) => {
      const conActividad = temas.filter((t, i) => datos[i] && tipo.hay(datos[i]))
      return [
        h('h2', { class: 'seccion-titulo' }, h('span', { 'aria-hidden': 'true' }, `${tipo.ico} `), tipo.nombre),
        descripciones[tipo.id] && h('p', { style: { margin: '-6px 0 12px', color: 'var(--texto-tenue)', fontSize: '.92rem' } }, descripciones[tipo.id]),
        conActividad.length
          ? h(
              'ul',
              { class: 'lista-enlaces dos-columnas' },
              conActividad.map((t) =>
                h(
                  'li',
                  {},
                  h(
                    'a',
                    { class: 'enlace-tarjeta', href: `#/t/${t.modulo}/${t.slug}/${tipo.id}` },
                    h('span', { class: 'texto' }, t.nombre),
                    h('span', { class: 'flecha', 'aria-hidden': 'true' }, '›'),
                  ),
                ),
              ),
            )
          : h('p', { class: 'aviso' }, 'Próximamente.'),
      ]
    }),
  ]
}

export function vistaPendiente(titulo, antetitulo, mensaje) {
  return [
    h('header', { class: 'cabecera-pagina' }, h('p', { class: 'antetitulo' }, antetitulo), h('h1', {}, titulo)),
    h('p', { class: 'aviso' }, mensaje),
    h('p', {}, h('a', { href: '#/m/anatomia' }, '← Volver a Anatomía')),
  ]
}

export async function vistaCreditos() {
  const imagenes = await cargarImagenes()
  return [
    h('header', { class: 'cabecera-pagina' }, h('h1', {}, 'Créditos y fuentes'), h('p', {}, 'Imágenes usadas en el sitio y sus licencias.')),
    h(
      'ul',
      { class: 'tarjeta creditos', style: { listStyle: 'none' } },
      Object.values(imagenes).map((img) => h('li', {}, h('strong', {}, img.titulo), h('br'), h('small', {}, credito(img)))),
    ),
    h(
      'p',
      { style: { color: 'var(--texto-tenue)', fontSize: '.9rem' } },
      'Los textos son de elaboración propia a partir de bibliografía estándar de Histología (Ross; Junqueira) y Anatomía (Latarjet; Moore). Contrástalos siempre con el material de tu curso.',
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'btn btn-secundario',
        onclick: (e) => {
          if (confirm('¿Borrar todo tu progreso guardado en este dispositivo?')) {
            progreso.reiniciar()
            e.target.textContent = 'Progreso borrado'
          }
        },
      },
      'Borrar mi progreso',
    ),
  ]
}
