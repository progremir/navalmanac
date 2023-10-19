import translationsEn from 'translations/en'; // Import the translations file
import translationsJa from 'translations/ja';

export function translate(key: string, language: string): string[] {
  // Use the selected language to determine which translations to use
  const selectedTranslations = language === 'ja' ? translationsJa : translationsEn;

  // Return the translated text based on the key
  return selectedTranslations[key] 
}
