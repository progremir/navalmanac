interface TranslationProps {
  translate: (key: string) => string;
  key: string;
}

function Translation({ translate, key }: TranslationProps) {
  const translatedText = translate(key);

  return <span>{translatedText}</span>;
}

export default Translation;
