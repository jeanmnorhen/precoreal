'use client';

import ProductListingForm from '@/components/product-listing-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, LogIn, PackagePlus, ShoppingBag, UserPlus, Edit, List, AlertTriangle } from 'lucide-react';
import type { Locale } from '@/i18n-config';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import LoadingSpinner from '@/components/loading-spinner';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import type { Store, ListedProduct } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

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

const fetchStoreAdvertisements = async (storeId: string | undefined): Promise<ListedProduct[]> => {
  if (!storeId) return [];
  const adsRef = ref(db, 'advertisements');
  const storeAdsQuery = query(adsRef, orderByChild('storeId'), equalTo(storeId));
  
  const snapshot = await get(storeAdsQuery);
  let advertisements: ListedProduct[] = [];
  if (snapshot.exists()) {
    const adsData = snapshot.val();
    advertisements = Object.entries(adsData)
      .map(([id, ad]) => ({
        id,
        ...(ad as Omit<ListedProduct, 'id'>),
      }))
      .filter(ad => !ad.archived); // Filter out archived ads
  }
  return advertisements.sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first
};


export default function StoreProductsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const { user, loading: authLoading } = useAuth();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const { data: userStore, isLoading: isLoadingUserStore, error: userStoreError } = useQuery<Store | null>({
    queryKey: ['userStore', user?.uid],
    queryFn: () => fetchUserStore(user?.uid),
    enabled: !!user && !authLoading,
  });

  const { data: storeAdvertisements, isLoading: isLoadingAdvertisements, error: advertisementsError } = useQuery<ListedProduct[]>({
    queryKey: ['storeAdvertisements', userStore?.id],
    queryFn: () => fetchStoreAdvertisements(userStore?.id),
    enabled: !!userStore,
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
                  {dictionary.productListingForm.formDescription.replace('{storeName}', userStore.name || userStore.id.substring(0,8))}
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
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <List className="mr-2 h-6 w-6 text-primary" />
            {dictionary.productListingPage.currentAdvertisementsTitle || "Your Current Advertisements"}
          </CardTitle>
          <CardDescription>
            {dictionary.productListingPage.currentAdvertisementsDescription || "View your products currently advertised on RealPrice Finder."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAdvertisements && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size={32} />
              <p className="ml-2">{dictionary.productListingPage.loadingProductsText || "Loading your products..."}</p>
            </div>
          )}
          {advertisementsError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{dictionary.productListingPage.errorLoadingProductsTitle || "Error Loading Products"}</AlertTitle>
              <AlertDescription>{dictionary.productListingPage.errorLoadingProductsMessage || "Could not fetch your advertised products."} {(advertisementsError as Error).message}</AlertDescription>
            </Alert>
          )}
          {!isLoadingAdvertisements && !advertisementsError && storeAdvertisements && storeAdvertisements.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.productListingPage.productNameColumn || "Product Name"}</TableHead>
                  <TableHead>{dictionary.productListingPage.priceColumn || "Price"}</TableHead>
                  <TableHead>{dictionary.productListingPage.categoryColumn || "Category"}</TableHead>
                  <TableHead>{dictionary.productListingPage.validUntilColumn || "Valid Until"}</TableHead>
                  {/* <TableHead>{dictionary.productListingPage.actionsColumn || "Actions"}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {storeAdvertisements.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.name}</TableCell>
                    <TableCell>R${ad.price.toFixed(2)}</TableCell>
                    <TableCell>{dictionary.productCategoryNames[ad.category as keyof typeof dictionary.productCategoryNames] || ad.category}</TableCell>
                    <TableCell>{format(new Date(ad.validUntil), 'dd/MM/yyyy')}</TableCell>
                    {/* 
                    <TableCell>
                      <Button variant="outline" size="sm">
                        {dictionary.productListingPage.editProductButton || "Edit"}
                      </Button>
                    </TableCell>
                    */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoadingAdvertisements && !advertisementsError && (!storeAdvertisements || storeAdvertisements.length === 0) && (
            <p className="text-muted-foreground text-center py-8">
              {dictionary.productListingPage.noProductsAdvertised || "You have not advertised any products yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
