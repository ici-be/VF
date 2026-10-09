import { describe, expect, it } from 'vitest'
import { apparence } from '../src/lib/apparence'

describe('apparence des matières', () => {
  it('icône et nom français d’après l’onglet', () => {
    expect(apparence('HW Geschiedenis')).toEqual({ icone: '🏛️', titre: 'Geschiedenis', fr: 'Histoire', mascotte: 'chevalier' })
    expect(apparence('HW Aardrijkskunde')).toEqual({ icone: '🌍', titre: 'Aardrijkskunde', fr: 'Géographie', mascotte: 'colomb' })
    expect(apparence('NW Biologie')).toEqual({ icone: '🌱', titre: 'Biologie', fr: 'Biologie', mascotte: 'grenouille' })
    expect(apparence('Nederlands')).toEqual({ icone: '💬', titre: 'Nederlands', fr: 'Néerlandais', mascotte: 'renard' })
  })
  it('un emoji en tête du nom de l’onglet remplace l’icône', () => {
    expect(apparence('🦖 NW Biologie')).toMatchObject({ icone: '🦖', titre: 'Biologie' })
  })
  it('icône par défaut', () => {
    expect(apparence('Divers').icone).toBe('📚')
  })
})
