// Une icône par exercice (Lucide : traits fins, mêmes sur tous les appareils).
import {
  BookOpen, GraduationCap, Headphones, History, Keyboard, ListChecks, MessageCircleQuestion,
  Mic, Puzzle, Table2, Tag, TextCursorInput, Timer,
} from 'lucide-preact'
import type { ExerciceId } from '../lib/reglages'

const ICONES: Record<ExerciceId, typeof Timer> = {
  defilement: Timer,
  oral: Mic,
  qcm: ListChecks,
  ecrit: Keyboard,
  dictee: Headphones,
  definitions: BookOpen,
  trous: TextCursorInput,
  conjugaison: Table2,
  primitifs: History,
  interrogatif: MessageCircleQuestion,
  motscroises: Puzzle,
  dehet: Tag,
  questions: GraduationCap,
}

export function IconeExercice({ id, taille = 20 }: { id: ExerciceId; taille?: number }) {
  const I = ICONES[id]
  return <I class="icone-ex" size={taille} strokeWidth={2} aria-hidden="true" />
}
