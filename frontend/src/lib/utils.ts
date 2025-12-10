/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Escapes a string to be used in a regular expression
 * @param string - String to escape
 * @returns Escaped string
 */
export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extracts all unique placeholders from a text matching {{content}}
 * @param text - Text to parse
 * @returns Sorted array of unique placeholders inside braces
 */
export function extractPlaceholders(text: string): string[] {
  if (!text) return []
  const regex = /\{\{([^}]+)\}\}/g
  const matches = [...text.matchAll(regex)]
  const keys = matches.map((m) => m[1].trim())
  return Array.from(new Set(keys)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  )
}
