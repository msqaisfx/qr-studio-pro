import { createContext, useContext } from 'react'
import type { TranslationKey } from '../locales'
import type { Language, Theme } from '../types/app'

export interface AppContextValue {
  language: Language
  theme: Theme
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  t: (key: TranslationKey) => string
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProviders')
  return context
}
