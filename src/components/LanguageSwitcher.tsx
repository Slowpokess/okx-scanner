'use client'

import { Globe } from 'lucide-react'
import { useI18n, Locale } from '@/lib/i18n'
import { Button } from './Button'

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ]

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-400" />
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              locale === lang.code
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            title={lang.label}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    </div>
  )
}
