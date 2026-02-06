'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { locales, Locale, Translations } from './locales'

interface I18nContextType {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = 'okx-scanner-locale'

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale
      if (stored && locales[stored]) return stored

      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Locale
      return locales[browserLang] ? browserLang : 'en'
    }
    return 'en'
  })

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }

  const t = locales[locale]

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
