import { describe, expect, it } from 'vitest'
import { apparence } from '../src/lib/apparence'

describe('apparence des matières', () => {
  it('icône et nom français d’après l’onglet', () => {
    expect(apparence('HW Geschiedenis')).toEqual({ icone: '🏛️', titre: 'Geschiedenis', fr: 'Histoire' })
    expect(apparence('HW Aardrijkskunde')).toEqual({ icone: '🌍', titre: 'Aardrijkskunde', fr: 'Géographie' })
    expect(apparence('NW Biologie')).toEqual({ icone: '🌱', titre: 'Biologie', fr: undefined })
    expect(apparence('Néerlandais').icone).toBe('💬')
  })
  it('un emoji en tête du nom de l’onglet remplace l’icône', () => {
    expect(apparence('🦖 NW Biologie')).toMatchObject({ icone: '🦖', titre: 'Biologie' })
  })
  it('icône par défaut', () => {
    expect(apparence('Divers').icone).toBe('📚')
  })
})
