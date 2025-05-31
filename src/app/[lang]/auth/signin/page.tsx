
import SignInForm from '@/components/auth/signin-form';
import type { Locale } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';

export default async function SignInPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(lang);
  return (
    <div className="animate-fadeIn py-8">
      <SignInForm lang={lang} dictionary={dictionary.authForms} />
    </div>
  );
}
