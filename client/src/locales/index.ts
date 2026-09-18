import type { PreferredLanguage } from '@types';
import type { TranslationSchema } from './types';
import { en } from './en';
import { hi } from './hi';
import { te } from './te';
import { mr } from './mr';
import { ta } from './ta';
import { kn } from './kn';
import { ur } from './ur';
import {
  bn,
  gu,
  pa,
  ml,
  or,
  as,
  ne,
  kok,
  sd,
  ks,
  mai,
  sa,
  sat,
  doi,
  mni,
  brx,
} from './other';

export * from './types';

export const LOCALES: Record<PreferredLanguage, TranslationSchema> = {
  en,
  hi,
  te,
  mr,
  ta,
  kn,
  ur,
  bn,
  gu,
  pa,
  ml,
  or,
  as,
  ne,
  kok,
  sd,
  ks,
  mai,
  sa,
  sat,
  doi,
  mni,
  brx,
};

export const DEFAULT_LANGUAGE: PreferredLanguage = 'hi';

/**
 * Resolves a translation string by dotted key path with parameter interpolation.
 * Falls back to Hindi (hi), then English (en) if missing.
 */
export function resolveTranslation(
  lang: PreferredLanguage,
  keyPath: string,
  params?: Record<string, string | number>
): string {
  const bundle = LOCALES[lang] || LOCALES[DEFAULT_LANGUAGE] || LOCALES.en;
  const parts = keyPath.split('.');

  let curr: any = bundle;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      curr = undefined;
      break;
    }
  }

  // Fallback to Hindi
  if (typeof curr !== 'string' && lang !== 'hi') {
    let fallbackCurr: any = LOCALES.hi;
    for (const part of parts) {
      if (fallbackCurr && typeof fallbackCurr === 'object' && part in fallbackCurr) {
        fallbackCurr = fallbackCurr[part];
      } else {
        fallbackCurr = undefined;
        break;
      }
    }
    if (typeof fallbackCurr === 'string') {
      curr = fallbackCurr;
    }
  }

  // Fallback to English
  if (typeof curr !== 'string' && lang !== 'en') {
    let fallbackCurr: any = LOCALES.en;
    for (const part of parts) {
      if (fallbackCurr && typeof fallbackCurr === 'object' && part in fallbackCurr) {
        fallbackCurr = fallbackCurr[part];
      } else {
        fallbackCurr = undefined;
        break;
      }
    }
    if (typeof fallbackCurr === 'string') {
      curr = fallbackCurr;
    }
  }

  if (typeof curr !== 'string') {
    return keyPath;
  }

  if (!params) return curr;

  return curr.replace(/{([^{}]+)}/g, (_, match) => {
    const trimmed = match.trim();
    return params[trimmed] !== undefined ? String(params[trimmed]) : `{${match}}`;
  });
}
