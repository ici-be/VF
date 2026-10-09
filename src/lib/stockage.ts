// Mémoire de l'appli sur cet appareil (réglages, progression, copie du tableau).
// localStorage peut être indisponible (navigation privée) : l'appli marche quand même.
const PREFIXE = 'vocab-nl.'

export function lire<T>(cle: string, defaut: T): T {
  try {
    const v = localStorage.getItem(PREFIXE + cle)
    return v === null ? defaut : (JSON.parse(v) as T)
  } catch {
    return defaut
  }
}

export function ecrire(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur))
  } catch {
    /* plein ou interdit : tant pis, on garde la valeur en mémoire */
  }
}
