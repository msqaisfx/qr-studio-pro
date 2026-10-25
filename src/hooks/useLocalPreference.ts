import { useEffect, useState } from 'react'
import { readStoredValue, storeValue } from '../lib/storage'

export function useLocalPreference<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  const [value, setValue] = useState<T>(() => readStoredValue(key, allowed, fallback))

  useEffect(() => {
    storeValue(key, value)
  }, [key, value])

  return [value, setValue] as const
}
