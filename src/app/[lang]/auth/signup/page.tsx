
import SignUpForm from '@/components/auth/signup-form';
import type { Locale } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';

export default async function SignUpPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(lang);
  return (
    <div className="animate-fadeIn py-8">
      <SignUpForm lang={lang} dictionary={dictionary.authForms} />
    </div>
  );
}
