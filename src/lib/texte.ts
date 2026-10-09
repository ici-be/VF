/**
 * « 1 mot », « 45 mots », « 0 mot » (en français, 0 et 1 sont au singulier).
 * Le pluriel par défaut ajoute un « s » à chaque mot : « mot raté » → « mots ratés ».
 */
export function nombre(n: number, singulier: string, pluriel = singulier.replace(/(\S+)/g, '$1s')): string {
  return `${n} ${Math.abs(n) >= 2 ? pluriel : singulier}`
}

/** Seulement le mot accordé, sans le nombre : « juste » / « justes ». */
export const accord = (n: number, singulier: string, pluriel = singulier.replace(/(\S+)/g, '$1s')) =>
  Math.abs(n) >= 2 ? pluriel : singulier
