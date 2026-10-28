// Punto de entrada: navegación, enrutado por hash y menú.
import { h, montar } from './ui.js'
import { cargarEstructura, cargarTema, cargarRegion } from './datos.js'
import { vistaUnidad } from './vistas/unidad.js'
import { vistaInicio, vistaModulo, vistaActividades, vistaPendiente, vistaCreditos, claveTema, claveRegion } from './vistas/paginas.js'

const contenido = document.getElementById('contenido')
const lateral = document.getElementById('lateral')
const menu = document.getElementById('menu')
const menuCuerpo = document.getElementById('menu-cuerpo')
const botonMenu = document.getElementById('abrir-menu')

let estructura

// ---------- Temario (lateral en escritorio y hoja en móvil) ----------

function temario() {
  return h(
    'div',
    { class: 'temario' },
    h('ul', {}, h('li', {}, h('a', { href: '#/' }, 'Inicio'))),
    estructura.modulos.map((m) => [
      h('h2', {}, m.nombre),
      h('ul', {}, m.temas.map((t) => h('li', {}, h('a', { href: `#/t/${m.slug}/${t.slug}` }, t.nombre)))),
      m.regiones.length > 0 && [
        h('h3', {}, 'Regiones'),
        h('ul', {}, m.regiones.map((r) => h('li', {}, h('a', { href: `#/r/${r.slug}` }, r.nombre)))),
      ],
    ]),
    h('h2', {}, 'Más'),
    h(
      'ul',
      {},
      h('li', {}, h('a', { href: '#/actividades' }, 'Actividades')),
      h('li', {}, h('a', { href: '#/creditos' }, 'Créditos y fuentes')),
    ),
  )
}

function abrirMenu() {
  menu.hidden = false
  botonMenu.setAttribute('aria-expanded', 'true')
  document.body.style.overflow = 'hidden'
  menu.querySelector('[data-cerrar].btn-icono').focus()
}

function cerrarMenu() {
  if (menu.hidden) return
  menu.hidden = true
  botonMenu.setAttribute('aria-expanded', 'false')
  document.body.style.overflow = ''
}

botonMenu.addEventListener('click', abrirMenu)
menu.addEventListener('click', (e) => {
  if (e.target.closest('[data-cerrar]') || e.target.closest('a')) cerrarMenu()
})
document.addEventListener('keydown', (e) => e.key === 'Escape' && cerrarMenu())

// ---------- Enrutado ----------
// #/                         inicio
// #/m/<modulo>               módulo
// #/t/<modulo>/<tema>[/tab]  tema
// #/r/<region>[/tab]         región
// #/actividades, #/creditos

async function resolver(partes) {
  const [tipo, a, b, c] = partes

  if (tipo === 'm') {
    const modulo = estructura.modulos.find((m) => m.slug === a)
    if (modulo) return { titulo: modulo.nombre, tab: modulo.slug, vista: vistaModulo(modulo) }
  }

  if (tipo === 't') {
    const modulo = estructura.modulos.find((m) => m.slug === a)
    const tema = modulo?.temas.find((t) => t.slug === b)
    if (tema) {
      const datos = await cargarTema(modulo.slug, tema.slug)
      const vista = datos
        ? await vistaUnidad({ datos, base: `#/t/${a}/${b}`, clave: claveTema(tema), antetitulo: modulo.nombre, pestana: c })
        : vistaPendiente(tema.nombre, modulo.nombre, 'El contenido de este tema está en preparación.')
      return { titulo: tema.nombre, tab: modulo.slug, vista }
    }
  }

  if (tipo === 'r') {
    const region = estructura.modulos.flatMap((m) => m.regiones).find((r) => r.slug === a)
    if (region) {
      const datos = await cargarRegion(region.slug)
      const vista = datos
        ? await vistaUnidad({ datos, base: `#/r/${a}`, clave: claveRegion(region), antetitulo: 'Anatomía · Región', pestana: b })
        : vistaPendiente(region.nombre, 'Anatomía · Región', 'El contenido de esta región está en preparación. Mientras tanto, repasa Osteología, Artrología y Miología.')
      return { titulo: region.nombre, tab: 'anatomia', vista }
    }
  }

  if (tipo === 'actividades') return { titulo: 'Actividades', tab: 'actividades', vista: await vistaActividades(estructura) }
  if (tipo === 'creditos') return { titulo: 'Créditos', tab: null, vista: await vistaCreditos() }

  return { titulo: null, tab: 'inicio', vista: vistaInicio(estructura) }
}

function marcarActual(hash, tab) {
  const ruta = hash === '#' ? '#/' : hash
  const fijar = (a, activo) => (activo ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'))
  for (const a of document.querySelectorAll('.temario a')) {
    const href = a.getAttribute('href')
    // Un tema sigue marcado mientras se navega por sus pestañas (#/t/.../quiz).
    fijar(a, ruta === href || (href !== '#/' && ruta.startsWith(href + '/')))
  }
  for (const a of document.querySelectorAll('.barra-inferior a')) fijar(a, a.dataset.tab === tab)
}

let ultimaRuta = null

async function navegar() {
  const hash = location.hash || '#/'
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  // Cambiar de pestaña dentro de la misma unidad no debe saltar al inicio de la página.
  const mismaUnidad = ultimaRuta && partes.slice(0, 3).join('/') === ultimaRuta.slice(0, 3).join('/')
  ultimaRuta = partes

  try {
    const { titulo, tab, vista } = await resolver(partes)
    montar(contenido, vista)
    document.title = titulo ? `${titulo} · Repaso Morfo` : 'Repaso Morfo'
    marcarActual(hash.replace(/\/$/, ''), tab)
    if (!mismaUnidad) {
      window.scrollTo(0, 0)
      contenido.focus({ preventScroll: true })
    }
  } catch (err) {
    console.error(err)
    montar(contenido, h('p', { class: 'aviso' }, 'No se pudo cargar el contenido. Revisa tu conexión y vuelve a intentarlo.'))
  }
}

async function iniciar() {
  try {
    estructura = await cargarEstructura()
  } catch (err) {
    console.error(err)
    montar(
      contenido,
      h('p', { class: 'aviso' }, 'No se pudieron cargar los datos. Si abriste el archivo directamente, usa un servidor local (por ejemplo, Live Server).'),
    )
    return
  }
  montar(lateral, temario())
  montar(menuCuerpo, temario())
  window.addEventListener('hashchange', navegar)
  navegar()
}

iniciar()
