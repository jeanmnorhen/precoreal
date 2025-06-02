
'use client';

import ProductListingForm from '@/components/product-listing-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, LogIn, PackagePlus, ShoppingBag, UserPlus, Edit } from 'lucide-react'; // Added Edit icon
import type { Locale } from '@/i18n-config';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import LoadingSpinner from '@/components/loading-spinner';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import type { Store } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


const fetchUserStore = async (userId: string | undefined): Promise<Store | null> => {
  if (!userId) return null;
  const storesRef = ref(db, 'stores');
  const userStoreQuery = query(storesRef, orderByChild('ownerId'), equalTo(userId));
  
  const snapshot = await get(userStoreQuery);
  if (snapshot.exists()) {
    const storesData = snapshot.val();
    // Assuming one store per user for now, take the first one
    const storeId = Object.keys(storesData)[0];
    if (storeId) {
        const store = storesData[storeId] as Omit<Store, 'id'>;
        return { ...store, id: storeId };
    }
  }
  return null;
};


export default function StoreProductsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const { user, loading: authLoading } = useAuth();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const { data: userStore, isLoading: isLoadingUserStore, error: userStoreError } = useQuery<Store | null>({
    queryKey: ['userStore', user?.uid],
    queryFn: () => fetchUserStore(user?.uid),
    enabled: !!user && !authLoading, // Only run query if user is loaded and available
  });

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


  const totalLoading = isLoadingPage || authLoading || (!!user && isLoadingUserStore) || !dictionary;

  if (totalLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-2">{dictionary?.productListingPage.loadingProductPageText || "Loading..."}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="default" className="max-w-md mb-6">
          <LogIn className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary.auth.mustBeLoggedInProductListingTitle}</AlertTitle>
          <AlertDescription>
            {dictionary.auth.mustBeLoggedInProductListingMessage}
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button asChild>
            <Link href={`/${lang}/auth/signin?redirect=/${lang}/stores/products`}>
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

  if (userStoreError) {
     return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="destructive" className="max-w-md mb-6">
          <Info className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary.productListingPage.errorFetchingStoreTitle}</AlertTitle>
          <AlertDescription>
            {dictionary.productListingPage.errorFetchingStoreMessage} {(userStoreError as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userStore) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Alert variant="default" className="max-w-lg mb-6">
          <ShoppingBag className="h-5 w-5 mr-2" />
          <AlertTitle>{dictionary.productListingPage.noStoreFoundTitle}</AlertTitle>
          <AlertDescription>
            {dictionary.productListingPage.noStoreFoundMessage}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/${lang}/stores/register`}>
            <PackagePlus className="mr-2 h-4 w-4" /> {dictionary.productListingPage.registerStoreButton}
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="animate-fadeIn space-y-8 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center text-2xl font-headline">
                  <PackagePlus className="mr-2 h-7 w-7 text-primary" />
                  {dictionary.productListingForm.formTitle}
              </CardTitle>
              <CardDescription>
                  {dictionary.productListingForm.formDescription.replace('{storeId}', userStore.name || userStore.id.substring(0,8))}
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href={`/${lang}/stores/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {dictionary.productListingPage.editStoreButton || "Edit Store Details"}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProductListingForm storeId={userStore.id} dictionary={dictionary.productListingForm} lang={lang} />
        </CardContent>
      </Card>
      
      {/* Placeholder for listing existing products for the store - Future Feature */}
      {/* 
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <ShoppingBag className="mr-2 h-6 w-6 text-primary" />
            {dictionary.productListingPage.manageProductsTitle || "Manage Your Advertised Products"}
          </CardTitle>
          <CardDescription>
            {dictionary.productListingPage.manageProductsDescription || "View, edit, or remove your current product advertisements."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {dictionary.productListingPage.featureComingSoon || "Listing existing products for management is coming soon!"}
          </p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}

