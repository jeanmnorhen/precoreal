
import StoreRegistrationForm from '@/components/store-registration-form';
import type { Locale } from '@/i18n-config';

// TODO: Internationalize this page content using getDictionary
export default function StoreRegistrationPage({ params: { lang } }: { params: { lang: Locale } }) {
  return (
    <div className="animate-fadeIn">
      <StoreRegistrationForm /> {/* This component will need lang/dictionary for its text */}
    </div>
  );
}
