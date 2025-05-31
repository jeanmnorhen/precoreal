
import ImageAnalysisTool from '@/components/image-analysis-tool';
import type { Locale } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';

export default async function AnalyzePage({ params: { lang } }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(lang);
  return (
    <div className="animate-fadeIn">
      <ImageAnalysisTool dictionary={dictionary.imageAnalysisTool} lang={lang} />
    </div>
  );
}
