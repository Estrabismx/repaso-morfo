// Progreso del estudiante guardado en el navegador (localStorage).
// Si el almacenamiento no está disponible (modo privado, bloqueado), la web funciona igual sin guardar.

const CLAVE = 'repaso-morfo:v1'

const vacio = () => ({ leidos: {}, quiz: {}, pareados: {}, diagrama: {}, tarjetas: {} })

function leer() {
  try {
    return { ...vacio(), ...JSON.parse(localStorage.getItem(CLAVE)) }
  } catch {
    return vacio()
  }
}

function guardar(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    /* sin almacenamiento disponible */
  }
}

function actualizar(fn) {
  const estado = leer()
  fn(estado)
  guardar(estado)
}

export const progreso = {
  obtener: leer,

  marcarLeido: (clave, valor = true) =>
    actualizar((e) => {
      if (valor) e.leidos[clave] = Date.now()
      else delete e.leidos[clave]
    }),

  /** Guarda el mejor puntaje de una actividad ('quiz' | 'pareados' | 'diagrama'). */
  registrarPuntaje: (tipo, clave, aciertos, total) =>
    actualizar((e) => {
      const previo = e[tipo][clave]
      const mejor = Math.max(previo?.mejor ?? 0, aciertos)
      e[tipo][clave] = { mejor, total, ultimo: aciertos, fecha: Date.now() }
    }),

  /** Tarjetas marcadas como "la sé" en un tema. */
  tarjetasSabidas: (clave) => new Set(leer().tarjetas[clave] ?? []),
  marcarTarjeta: (clave, id, sabida) =>
    actualizar((e) => {
      const set = new Set(e.tarjetas[clave] ?? [])
      sabida ? set.add(id) : set.delete(id)
      e.tarjetas[clave] = [...set]
    }),

  reiniciar: () => guardar(vacio()),
}
