
import ImageAnalysisTool from '@/components/image-analysis-tool';
import type { Locale } from '@/i18n-config';

// TODO: Internationalize this page content using getDictionary
export default function AnalyzePage({ params: { lang } }: { params: { lang: Locale } }) {
  return (
    <div className="animate-fadeIn">
      <ImageAnalysisTool /> {/* This component will need lang/dictionary for its text */}
    </div>
  );
}
