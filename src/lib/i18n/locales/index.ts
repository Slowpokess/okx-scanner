import { en } from './en'
import { ru } from './ru'

export const locales = {
  en,
  ru,
} as const

export type Locale = keyof typeof locales
export type Translations = typeof en
