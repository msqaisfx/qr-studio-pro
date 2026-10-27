import { useCallback, useEffect, type ReactNode } from 'react'
import { useLocalPreference } from '../hooks/useLocalPreference'
import { translations, languageDirection, type TranslationKey } from '../locales'
import { storageKeys } from '../lib/storage'
import type { Language, Theme } from '../types/app'
import { AppContext } from './appContext'

export function AppProviders({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalPreference<Language>(storageKeys.language, ['ar', 'en'], 'ar')
  const [theme, setTheme] = useLocalPreference<Theme>(storageKeys.theme, ['dark', 'light'], 'dark')

  useEffect(() => {
    const root = document.documentElement
    root.lang = language
    root.dir = languageDirection(language)
  }, [language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1b33' : '#f5f8fc')
  }, [theme])

  const t = useCallback((key: TranslationKey) => translations[language][key], [language])

  return <AppContext.Provider value={{ language, theme, setLanguage, setTheme, t }}>{children}</AppContext.Provider>
}
