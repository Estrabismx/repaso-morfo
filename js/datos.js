// Carga de datos JSON (rutas relativas: funcionan en GitHub Pages bajo /repaso-morfo/).
import { slug } from './ui.js'

const cache = new Map()

async function cargarJSON(ruta) {
  if (!cache.has(ruta)) {
    cache.set(
      ruta,
      fetch(ruta).then((r) => {
        if (r.status === 404) return null
        if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`)
        return r.json()
      }),
    )
  }
  return cache.get(ruta)
}

/** Estructura de navegación tomada de web_estudio_morfologia.json */
export async function cargarEstructura() {
  const base = await cargarJSON('data/web_estudio_morfologia.json')
  const modulos = base.arquitectura_navegacion.map((m) => ({
    nombre: m.modulo,
    slug: slug(m.modulo),
    temas: m.temas.map((t) => ({ nombre: t, slug: slug(t), modulo: slug(m.modulo) })),
    regiones: (m.regiones ?? []).map((r) => ({ nombre: r, slug: slug(r) })),
  }))
  return { proyecto: base.proyecto, descripcion: base.descripcion, modulos, actividades: base.actividades_didacticas_interactivas }
}

/** Contenido de un tema: data/temas/<modulo>/<tema>.json (null si aún no existe) */
export const cargarTema = (modulo, tema) => cargarJSON(`data/temas/${modulo}/${tema}.json`)

/** Contenido de una región anatómica: data/regiones/<region>.json (null si aún no existe) */
export const cargarRegion = (region) => cargarJSON(`data/regiones/${region}.json`)

/** Registro de imágenes con su autoría y licencia */
export const cargarImagenes = () => cargarJSON('data/imagenes.json')
