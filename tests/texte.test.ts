import { describe, expect, it } from 'vitest'
import { accord, nombre } from '../src/lib/texte'

describe('accord en nombre', () => {
  it('singulier pour 0 et 1, pluriel à partir de 2', () => {
    expect(nombre(0, 'mot')).toBe('0 mot')
    expect(nombre(1, 'mot juste')).toBe('1 mot juste')
    expect(nombre(45, 'mot juste')).toBe('45 mots justes')
    expect(nombre(2, 'mot vu', 'mots vus')).toBe('2 mots vus')
    expect(accord(3, 'raté')).toBe('ratés')
    expect(accord(1, 'raté')).toBe('raté')
  })
})
