import { describe, expect, it } from 'vitest'
import { leconsDe } from '../src/lib/lecons'

describe('leçons', () => {
  it('donne les leçons d’une matière, avec leur adresse', () => {
    expect(leconsDe('NW Chemie', './')).toEqual([
      { chapitre: '1. Wat bevindt er zich onder onze voeten?', pages: '46–57', url: './lecons/chimie/ch01/' },
    ])
  })
  it('n’en donne aucune aux autres matières', () => {
    expect(leconsDe('NW Biologie', './')).toEqual([])
  })
})
