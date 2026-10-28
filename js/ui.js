// Utilidades de interfaz sin dependencias.

/**
 * Crea un elemento DOM.
 * h('button', { class: 'btn', onclick: fn }, 'Texto', otroNodo)
 * Atributos que empiezan con "on" se registran como eventos; `null`/`false` se omiten.
 */
export function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v)
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v)
    else if (k === 'html') el.innerHTML = v
    else el.setAttribute(k, v === true ? '' : v)
  }
  agregar(el, hijos)
  return el
}

function agregar(el, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo == null || hijo === false) continue
    el.append(hijo instanceof Node ? hijo : String(hijo))
  }
}

/** Reemplaza el contenido de un elemento. */
export function montar(el, ...hijos) {
  el.replaceChildren()
  agregar(el, hijos)
  return el
}

/** "Tejido Óseo" -> "tejido-oseo" */
export const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Compara textos ignorando mayúsculas, tildes y signos. */
export const normalizar = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Copia barajada (Fisher-Yates). */
export function barajar(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const barraProgreso = (fraccion, etiqueta) =>
  h(
    'div',
    {
      class: 'barra-progreso',
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': Math.round(fraccion * 100),
      'aria-label': etiqueta,
    },
    h('span', { style: { width: `${Math.round(fraccion * 100)}%` } }),
  )
