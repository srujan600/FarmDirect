import { useCallback } from 'react';
import { useAgriStore } from './useAgriStore';
import { t as translate, isRTL } from '../services/i18n';
import { SUPPORTED_LANGUAGES, type PreferredLanguage, type LanguageMeta } from '@types';

export function useTranslation() {
  const language = useAgriStore((state) => state.language);
  const setLanguage = useAgriStore((state) => state.setLanguage);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(key, language, params);
    },
    [language]
  );

  return {
    t,
    language,
    setLanguage,
    isRtl: isRTL(language),
    currentLanguageMeta: SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.hi,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
