// lib/languageDetector.ts
import { NextRequest } from 'next/server';

export function getLocaleFromRequest(req: NextRequest): string {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  
  // Path segments after splitting would be like ['', 'en', 'path', 'to', 'resource']
  // The locale would be the second element if it exists and is a valid locale
  const possibleLocale = pathSegments[1];
  
  // Check if the possible locale is one of our supported locales
  if (possibleLocale && ['tr', 'en'].includes(possibleLocale)) {
    return possibleLocale;
  }
  
  // Default to 'tr' if no locale found
  return 'tr';
}