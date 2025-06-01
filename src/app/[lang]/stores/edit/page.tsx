
'use client';

import StoreRegistrationForm from '@/components/store-registration-form';
import type { Locale } from '@/i18n-config';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, UserPlus, Info, PackagePlus, Edit } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/loading-spinner';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import type { Store } from '@/types';

const fetchUserStore = async (userId: string | undefined): Promise<Store | null> => {
  if (!userId) return null;
  const storesRef = ref(db, 'stores');
  const userStoreQuery = query(storesRef, orderByChild('ownerId'), equalTo(userId));
  
  const snapshot = await get(userStoreQuery);
  if (snapshot.exists()) {
    const storesData = snapshot.val();
    const storeId = Object.keys(storesData)[0];
    if (storeId) {
        const store = storesData[storeId] as Omit<Store, 'id'>;
        return { ...store, id: storeId };
    }
  }
  return null;
};


export default function EditStorePage({ params: { lang } }: { params: { lang: Locale } }) {
  const { user, loading: authLoading } = useAuth();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const { data: userStore, isLoading: isLoadingUserStore, error: userStoreError } = useQuery<Store | null>({
    queryKey: ['userStore', user?.uid],
    queryFn: () => fetchUserStore(user?.uid),
    enabled: !!user && !authLoading, 
  });

  useEffect(() => {
    const fetchDict = async () => {
      try {
        const d = await getDictionary(lang);
        setDictionary(d);
      } catch (e) {
        console.error("Failed to load dictionary for edit store page", e);
      } finally {
        setIsLoadingPage(false);
      }
    };
    fetchDict();
  }, [lang]);

  const totalLoading = isLoadingPage || authLoading || (!!user && isLoadingUserStore) || !dictionary;

  if (totalLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-2">{dictionary?.storeRegistrationForm.loadingEditText || "Loading store details..."}</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="default" className="max-w-md mb-6">
          <LogIn className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary?.auth.mustBeLoggedInStoreRegistrationTitle}</AlertTitle>
          <AlertDescription>
            {dictionary?.auth.mustBeLoggedInStoreRegistrationMessage}
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button asChild>
            <Link href={`/${lang}/auth/signin?redirect=/${lang}/stores/edit`}>
              <LogIn className="mr-2 h-4 w-4" /> {dictionary?.auth.signInLink}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${lang}/auth/signup`}>
              <UserPlus className="mr-2 h-4 w-4" /> {dictionary?.auth.signUpLink}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (userStoreError) {
     return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="destructive" className="max-w-md mb-6">
          <Info className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary?.storeRegistrationForm.errorFetchingStoreTitle || "Error Fetching Store"}</AlertTitle>
          <AlertDescription>
            {dictionary?.storeRegistrationForm.errorFetchingStoreMessage || "Could not load your store data."} {(userStoreError as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userStore) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="default" className="max-w-lg mb-6">
          <Info className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary?.storeRegistrationForm.noStoreFoundTitle || "No Store Found"}</AlertTitle>
          <AlertDescription>
            {dictionary?.storeRegistrationForm.noStoreFoundMessage || "You don't seem to have a store registered. Please register one to edit it."}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/${lang}/stores/register`}>
            <PackagePlus className="mr-2 h-4 w-4" /> {dictionary?.storeRegistrationForm.registerStoreButtonText || "Register a Store"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn py-8">
      <StoreRegistrationForm 
        userId={user.uid} 
        dictionary={dictionary.storeRegistrationForm} 
        lang={lang}
        mode="edit"
        existingStoreData={userStore}
      />
    </div>
  );
}
