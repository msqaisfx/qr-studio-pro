import { ar } from './ar'
import { en } from './en'
import type { Language } from '../types/app'

export const translations = { ar, en }
export type TranslationKey = keyof typeof ar
export const languageDirection = (language: Language) => (language === 'ar' ? 'rtl' : 'ltr')
