
'use client';

import StoreRegistrationForm from '@/components/store-registration-form';
import type { Locale } from '@/i18n-config';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/loading-spinner';
import { useEffect, useState } from 'react';

export default function StoreRegistrationPage({ params: { lang } }: { params: { lang: Locale } }) {
  const { user, loading: authLoading } = useAuth();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  useEffect(() => {
    const fetchDict = async () => {
      try {
        const d = await getDictionary(lang);
        setDictionary(d);
      } catch (e) {
        console.error("Failed to load dictionary", e);
      } finally {
        setIsLoadingPage(false);
      }
    };
    fetchDict();
  }, [lang]);

  if (isLoadingPage || authLoading || !dictionary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="default" className="max-w-md mb-6">
          <LogIn className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary.auth.mustBeLoggedInStoreRegistrationTitle}</AlertTitle>
          <AlertDescription>
            {dictionary.auth.mustBeLoggedInStoreRegistrationMessage}
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button asChild>
            <Link href={`/${lang}/auth/signin`}>
              <LogIn className="mr-2 h-4 w-4" /> {dictionary.auth.signInLink}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${lang}/auth/signup`}>
              <UserPlus className="mr-2 h-4 w-4" /> {dictionary.auth.signUpLink}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <StoreRegistrationForm userId={user.uid} dictionary={dictionary.storeRegistrationForm} lang={lang}/>
    </div>
  );
}
