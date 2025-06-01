
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import PreferredLocationForm from '@/components/profile/preferred-location-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/loading-spinner';
import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n-config';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function ProfilePage({ params: { lang } }: { params: { lang: Locale } }) {
  const { user, loading: authLoading } = useAuth();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  useEffect(() => {
    const fetchDict = async () => {
      try {
        const d = await getDictionary(lang);
        setDictionary(d);
      } catch (e) {
        console.error("Failed to load dictionary for profile page", e);
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
        <p className="ml-2">{dictionary?.profilePage?.loadingText || "Loading page..."}</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="default" className="max-w-md mb-6">
          <LogIn className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary.profilePage?.mustBeLoggedInTitle || "Access Restricted"}</AlertTitle>
          <AlertDescription>
            {dictionary.profilePage?.mustBeLoggedInMessage || "You must be logged in to view your profile. Please sign in or sign up."}
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button asChild>
            <Link href={`/${lang}/auth/signin?redirect=/${lang}/profile`}>
              <LogIn className="mr-2 h-4 w-4" /> {dictionary.auth?.signInLink || "Sign In"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${lang}/auth/signup`}>
              <UserPlus className="mr-2 h-4 w-4" /> {dictionary.auth?.signUpLink || "Sign Up"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn py-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <UserCircle className="mr-2 h-7 w-7 text-primary" />
            {dictionary.profilePage?.title || "My Profile"}
          </CardTitle>
          <CardDescription>{dictionary.profilePage?.description || "Manage your account settings and preferences."}</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferredLocationForm 
            userId={user.uid} 
            dictionary={dictionary.preferredLocationForm} 
            lang={lang}
          />
          {/* Future sections for other profile settings can be added here */}
        </CardContent>
      </Card>
    </div>
  );
}
