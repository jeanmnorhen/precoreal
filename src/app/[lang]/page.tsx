
'use client';

import React, { useState, useMemo, useEffect, use, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import OfferCard from '@/components/offer-card';
import CategoryFilter from '@/components/category-filter';
import { productCategories } from '@/lib/mock-data';
import type { Offer, ListedProduct, Store, PriceHistoryEntry, ProductCategory, CanonicalProduct, SuggestedNewProduct, PreferredLocation } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Tag, LocateFixed, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, get, update, push, serverTimestamp, query as firebaseQuery, orderByChild, equalTo, set } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';


interface HomePageProps {
  params: Promise<{ lang: Locale }>;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

type LocationError = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN_ERROR' | null;

const normalizeProductName = (name: string): string => {
  return name.trim().toLowerCase();
};

const checkAndSuggestProductFromSearch = async (
  productName: string,
  lang: Locale,
  toastFn: (options: any) => void,
  dictionary: Dictionary['homePage']
): Promise<{ existsInCanonical: boolean, suggested: boolean }> => {
  if (!productName) return { existsInCanonical: false, suggested: false };

  const normalizedName = normalizeProductName(productName);
  const canonicalProductsRef = ref(db, 'canonicalProducts');
  const q = firebaseQuery(canonicalProductsRef, orderByChild('normalizedName'), equalTo(normalizedName)); 

  try {
    const snapshot = await get(q);
    let productExistsInCanonical = false;
    if (snapshot.exists()) {
       snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val() as CanonicalProduct;
        if (normalizeProductName(product.name) === normalizedName) { 
          productExistsInCanonical = true;
        }
      });
    }

    if (productExistsInCanonical) {
      return { existsInCanonical: true, suggested: false };
    }

    const suggestedProductsRef = ref(db, 'suggestedNewProducts');
    const newSuggestionRef = push(suggestedProductsRef);
    const newSuggestion: Omit<SuggestedNewProduct, 'id'> = {
      productName: productName,
      normalizedName: normalizedName,
      source: 'search-bar',
      timestamp: serverTimestamp() as unknown as number,
      status: 'pending',
      lang: lang,
    };
    await set(newSuggestionRef, newSuggestion);
    
    if (dictionary.suggestionLoggedToastTitle && dictionary.suggestionLoggedToastDesc) {
        toastFn({
          title: dictionary.suggestionLoggedToastTitle,
          description: dictionary.suggestionLoggedToastDesc.replace('{productName}', productName),
          variant: 'default',
          duration: 5000,
        });
    }
    return { existsInCanonical: false, suggested: true };

  } catch (error) {
    console.error('Error checking/suggesting product from search:', error);
     if (dictionary.suggestionErrorToastTitle) {
        toastFn({
            title: dictionary.suggestionErrorToastTitle,
            description: (error as Error).message,
            variant: 'destructive',
        });
     }
    return { existsInCanonical: false, suggested: false };
  }
};


const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};


const fetchAdvertisementsAndStores = async (): Promise<{ advertisements: ListedProduct[], storesMap: Record<string, Store> }> => {
  const adsRef = ref(db, 'advertisements');
  const storesRef = ref(db, 'stores');

  const [adsSnapshot, storesSnapshot] = await Promise.all([get(adsRef), get(storesRef)]);

  let advertisements: ListedProduct[] = [];
  if (adsSnapshot.exists()) {
    const adsData = adsSnapshot.val();
    advertisements = Object.entries(adsData).map(([id, ad]) => ({
      id,
      ...(ad as Omit<ListedProduct, 'id'>),
    }));
  }

  let storesMap: Record<string, Store> = {};
  if (storesSnapshot.exists()) {
    const storesData = storesSnapshot.val();
     for (const storeId in storesData) {
      storesMap[storeId] = { id: storeId, ...storesData[storeId] };
    }
  }
  return { advertisements, storesMap };
};


const archiveExpiredAds = async ({ advertisements, storesMap }: { advertisements: ListedProduct[], storesMap: Record<string, Store> }) => {
  const now = Date.now();
  const updates: Record<string, any> = {};
  // const historyEntries: Record<string, Omit<PriceHistoryEntry, 'id'>> = {}; // Not used in this mutation logic
  const activeAds: ListedProduct[] = [];

  for (const ad of advertisements) {
    if (ad.validUntil < now && !ad.archived) {
      const priceHistoryEntry: Omit<PriceHistoryEntry, 'id'> = {
        advertisementId: ad.id,
        productId: ad.name, 
        productName: ad.name,
        price: ad.price,
        storeId: ad.storeId,
        storeName: storesMap[ad.storeId]?.name || 'Unknown Store',
        archivedAt: serverTimestamp() as unknown as number, 
        originalValidUntil: ad.validUntil,
        category: ad.category,
      };
      const historyRefKey = push(ref(db, 'priceHistory')).key;
      if (historyRefKey) {
        updates[`/priceHistory/${historyRefKey}`] = priceHistoryEntry;
      }
      updates[`/advertisements/${ad.id}/archived`] = true;
    } else if (ad.validUntil >= now && !ad.archived) {
      activeAds.push(ad);
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
  return activeAds;
};

const fetchUserPreferredLocation = async (userId: string | undefined): Promise<PreferredLocation | null> => {
  if (!userId) return null;
  const locationRef = ref(db, `userSettings/${userId}/preferredLocation`);
  const snapshot = await get(locationRef);
  if (snapshot.exists()) {
    return snapshot.val() as PreferredLocation;
  }
  return null;
};


export default function HomePage(props: HomePageProps) {
  const { lang } = use(props.params);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<LocationError>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasRequestedLocationThisSession, setHasRequestedLocationThisSession] = useState(false); // Track if GPS was requested in this session
  
  const [lastCheckedSearchTerm, setLastCheckedSearchTerm] = useState<string | null>(null);
  const [searchProductStatus, setSearchProductStatus] = useState<{term: string; existsInCanonical: boolean; suggested: boolean} | null>(null);


  useEffect(() => {
    const fetchDict = async () => {
      const d = await getDictionary(lang);
      setDictionary(d);
    };
    fetchDict();
  }, [lang]);

  useEffect(() => {
    const querySearchTerm = searchParams.get('search');
    if (querySearchTerm) {
      setSearchTerm(decodeURIComponent(querySearchTerm));
    }
  }, [searchParams]);

  const { data: fetchedData, isLoading: isLoadingData, error: dataError } = useQuery<{ advertisements: ListedProduct[], storesMap: Record<string, Store> }>({
    queryKey: ['advertisementsAndStores'],
    queryFn: fetchAdvertisementsAndStores,
  });

  const archiveMutation = useMutation({
    mutationFn: archiveExpiredAds,
    onSuccess: (activeAds) => {
      queryClient.setQueryData(['activeAdvertisements'], activeAds);
    },
    onError: (error) => {
      console.error("Error archiving ads:", error);
    }
  });

  useEffect(() => {
    if (fetchedData?.advertisements && fetchedData?.storesMap) {
      archiveMutation.mutate({ advertisements: fetchedData.advertisements, storesMap: fetchedData.storesMap });
    }
  }, [fetchedData, archiveMutation]);
  
  const { data: activeAdvertisements } = useQuery<ListedProduct[]>({
    queryKey: ['activeAdvertisements'],
    queryFn: () => {
      const currentActive = queryClient.getQueryData<ListedProduct[]>(['activeAdvertisements']);
      return currentActive || [];
    },
    enabled: !!fetchedData,
  });

  const { data: preferredLocation, isLoading: isLoadingPreferredLocation } = useQuery<PreferredLocation | null>({
    queryKey: ['userPreferredLocation', user?.uid],
    queryFn: () => fetchUserPreferredLocation(user?.uid),
    enabled: !!user && !authLoading,
  });

  useEffect(() => {
    // Only set from preferred location if GPS hasn't been tried yet in this session and preferred location is available
    if (user && !authLoading && preferredLocation && !userLocation && !hasRequestedLocationThisSession && !isRequestingLocation) {
      if (preferredLocation.latitude && preferredLocation.longitude) {
        setUserLocation({
          latitude: preferredLocation.latitude,
          longitude: preferredLocation.longitude,
        });
      }
    }
  }, [user, authLoading, preferredLocation, userLocation, hasRequestedLocationThisSession, isRequestingLocation]);


  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('POSITION_UNAVAILABLE'); 
      setIsRequestingLocation(false);
      return;
    }
    setIsRequestingLocation(true);
    setHasRequestedLocationThisSession(true); // Mark that GPS has been attempted
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
        setIsRequestingLocation(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('PERMISSION_DENIED');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('POSITION_UNAVAILABLE');
            break;
          case error.TIMEOUT:
            setLocationError('TIMEOUT');
            break;
          default:
            setLocationError('UNKNOWN_ERROR');
            break;
        }
        setIsRequestingLocation(false);
      }
    );
  };

  const handleLocationRequest = () => {
    // If user location is already set (either by GPS or preferred), this will re-fetch via GPS.
    // If no location is set, and it's the first time in the session, show dialog.
    if (!hasRequestedLocationThisSession && !userLocation && !preferredLocation) {
      setShowLocationDialog(true);
    } else {
      requestUserLocation();
    }
  };

  const proceedWithLocation = () => {
    setShowLocationDialog(false);
    requestUserLocation();
  };

  const cancelLocationDialog = () => {
    setShowLocationDialog(false);
    setHasRequestedLocationThisSession(true); // User explicitly cancelled, don't ask again this session via dialog
  };

  const displayedOffers = useMemo(() => {
    if (!activeAdvertisements || !fetchedData?.storesMap) return [];
    
    return activeAdvertisements.map(ad => {
      const storeInfo = fetchedData.storesMap[ad.storeId];
      const productNameWords = ad.name.toLowerCase().split(' ').slice(0, 2);
      return {
        id: ad.id,
        productName: ad.name,
        productImage: ad.imageUrl || `https://placehold.co/600x400.png`,
        dataAiHint: ad.dataAiHint || productNameWords.join(' '),
        price: ad.price,
        storeId: ad.storeId,
        storeName: storeInfo?.name || `Lojista ID: ${ad.storeId.substring(0,6)}...`,
        distance: null, // Will be calculated in filteredAndSortedOffers
        category: ad.category,
        description: ad.description,
      };
    });
  }, [activeAdvertisements, fetchedData?.storesMap]);

  const filteredAndSortedOffers = useMemo(() => {
    let offersWithDetails = displayedOffers.map(offer => {
      const storeInfo = fetchedData?.storesMap?.[offer.storeId];
      let calculatedDistance: number | null = null;
      if (userLocation && storeInfo?.latitude && storeInfo?.longitude) {
        calculatedDistance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          storeInfo.latitude,
          storeInfo.longitude
        );
      }
      return {
        ...offer,
        distance: calculatedDistance,
      };
    });

    if (selectedCategory) {
      const categoryDetails = productCategories.find(cat => cat.id === selectedCategory);
      if (categoryDetails) {
        offersWithDetails = offersWithDetails.filter(
          (offer) => offer.category === categoryDetails.name
        );
      }
    }

    if (searchTerm) {
      offersWithDetails = offersWithDetails.filter((offer) =>
        offer.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.storeName && offer.storeName.toLowerCase().includes(searchTerm.toLowerCase())) || 
        offer.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'distance') {
      offersWithDetails.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; 
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === 'price') {
      offersWithDetails.sort((a, b) => a.price - b.price);
    }

    return offersWithDetails;
  }, [selectedCategory, searchTerm, sortBy, displayedOffers, userLocation, fetchedData?.storesMap]);

  // Effect for checking canonical product when search yields no offers
  useEffect(() => {
    if (searchTerm && filteredAndSortedOffers.length === 0 && !isLoadingData && !dataError && dictionary && searchTerm !== lastCheckedSearchTerm) {
      setLastCheckedSearchTerm(searchTerm); 
      setSearchProductStatus(null); 

      checkAndSuggestProductFromSearch(searchTerm, lang, toast, dictionary.homePage)
        .then(status => {
          setSearchProductStatus({ term: searchTerm, ...status });
        });
    } else if (!searchTerm) {
      setLastCheckedSearchTerm(null); 
      setSearchProductStatus(null);
    }
  }, [searchTerm, filteredAndSortedOffers.length, isLoadingData, dataError, lang, dictionary, toast, lastCheckedSearchTerm]);

  const totalLoading = !dictionary || isLoadingData || authLoading || (!!user && isLoadingPreferredLocation);

  if (totalLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-xl text-muted-foreground">{dictionary?.homePage.loadingOffersText || 'Loading offers...'}</p>
      </div>
    );
  }

  if (dataError) {
     return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Search className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
        <h3 className="text-xl font-semibold text-destructive">{dictionary.homePage.errorLoadingOffersTitle || 'Error Loading Offers'}</h3>
        <p className="text-muted-foreground">
          {dictionary.homePage.errorLoadingOffersMessage || 'Could not fetch offers. Please try again later.'}
          <br />
          <span className="text-xs">{(dataError as Error)?.message}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pt-8">
      <AlertDialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dictionary.homePage.confirmLocationAccessTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {dictionary.homePage.confirmLocationAccessMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLocationDialog}>{dictionary.homePage.cancelLocationButton}</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithLocation}>{dictionary.homePage.allowLocationButton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={dictionary.homePage.searchPlaceholder}
            className="w-full rounded-full py-3 pl-10 pr-4 text-base shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">{dictionary.homePage.sortBy}</span>
          <Select value={sortBy} onValueChange={(value: 'distance' | 'price') => setSortBy(value)}>
            <SelectTrigger className="w-auto min-w-[160px] rounded-full shadow-sm">
              <SelectValue placeholder={dictionary.homePage.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance" disabled={!userLocation && !locationError}>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" /> {dictionary.homePage.proximity}
                </div>
              </SelectItem>
              <SelectItem value="price">
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" /> {dictionary.homePage.price}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleLocationRequest} 
            variant="outline" 
            className="rounded-full shadow-sm"
            disabled={isRequestingLocation}
          >
            {isRequestingLocation ? <LoadingSpinner size={16} className="mr-2" /> : <LocateFixed className="mr-2 h-4 w-4" />}
            {userLocation ? dictionary.homePage.updateLocationButton : dictionary.homePage.getLocationButton}
          </Button>
        </div>
      </div>

      {locationError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{dictionary.homePage.locationErrorTitle}</AlertTitle>
          <AlertDescription>
            {locationError === 'PERMISSION_DENIED' && dictionary.homePage.locationPermissionDenied}
            {locationError === 'POSITION_UNAVAILABLE' && dictionary.homePage.locationUnavailable}
            {locationError === 'TIMEOUT' && dictionary.homePage.locationTimeout}
            {locationError === 'UNKNOWN_ERROR' && dictionary.homePage.locationUnknownError}
          </AlertDescription>
        </Alert>
      )}
      
      <CategoryFilter
        categories={productCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        allCategoriesText={dictionary.homePage.allCategories}
        categoryNames={dictionary.productCategoryNames}
      />

      {filteredAndSortedOffers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} dictionary={dictionary.homePage}/>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold">{dictionary.homePage.noOffersFound}</h3>
          {searchTerm && searchProductStatus?.term === searchTerm && searchProductStatus.existsInCanonical && (
            <Alert variant="default" className="mt-4 max-w-md mx-auto text-left">
              <Info className="h-4 w-4" />
              <AlertTitle>{dictionary.homePage.productInCatalogTitle || "Product Information"}</AlertTitle>
              <AlertDescription>
                {dictionary.homePage.productInCatalogButNoOffers?.replace('{searchTerm}', searchTerm) || `No current offers for "${searchTerm}", but it's in our catalog!`}
              </AlertDescription>
            </Alert>
          )}
          <p className="text-muted-foreground mt-2">
            {searchTerm && (!searchProductStatus || searchProductStatus.term !== searchTerm || !searchProductStatus.existsInCanonical)
              ? dictionary.homePage.noOffersFoundForSearch?.replace('{searchTerm}', searchTerm) || `No offers found for "${searchTerm}". Try a different search.`
              : !searchTerm ? dictionary.homePage.noOffersAdvice : ''}
          </p>
        </div>
      )}
    </div>
  );
}

    
