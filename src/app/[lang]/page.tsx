
'use client';

import React, { useState, useMemo, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import OfferCard from '@/components/offer-card';
import CategoryFilter from '@/components/category-filter';
import { productCategories } from '@/lib/mock-data';
import type { Offer, ListedProduct, Store, PriceHistoryEntry, ProductCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Tag, LocateFixed, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, get, update, push, serverTimestamp } from 'firebase/database';
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


interface HomePageProps {
  params: Promise<{ lang: Locale }>;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

type LocationError = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN_ERROR' | null;


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
  const historyEntries: Record<string, Omit<PriceHistoryEntry, 'id'>> = {};
  const activeAds: ListedProduct[] = [];

  for (const ad of advertisements) {
    if (ad.validUntil < now && !ad.archived) {
      const priceHistoryEntry: Omit<PriceHistoryEntry, 'id'> = {
        advertisementId: ad.id,
        productId: ad.name, // Assuming name is unique enough for now, or use a dedicated productId if available
        productName: ad.name,
        price: ad.price,
        storeId: ad.storeId,
        storeName: storesMap[ad.storeId]?.name || 'Unknown Store',
        archivedAt: serverTimestamp() as unknown as number, // Firebase will set this
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
  return activeAds; // Return only active, non-archived ads
};


export default function HomePage(props: HomePageProps) {
  const { lang } = use(props.params);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<LocationError>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);


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
      // Optionally, invalidate queries if you want to refetch everything from scratch
      // queryClient.invalidateQueries({ queryKey: ['advertisementsAndStores'] });
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
      // This query initially returns an empty array or stale data
      // It will be populated by the onSuccess callback of the archiveMutation
      const currentActive = queryClient.getQueryData<ListedProduct[]>(['activeAdvertisements']);
      return currentActive || [];
    },
    enabled: !!fetchedData, // Only enable once initial data is fetched
  });


  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('POSITION_UNAVAILABLE'); 
      setIsRequestingLocation(false);
      return;
    }
    setIsRequestingLocation(true);
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
    if (!hasRequestedLocation && !userLocation) {
      setShowLocationDialog(true);
    } else {
      requestUserLocation();
    }
  };

  const proceedWithLocation = () => {
    setHasRequestedLocation(true);
    setShowLocationDialog(false);
    requestUserLocation();
  };

  const cancelLocationDialog = () => {
    setShowLocationDialog(false);
    setHasRequestedLocation(true); // User has made a choice
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
        distance: null, // Will be calculated in the next step
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
      // Find the English category name corresponding to the selectedCategory ID
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


  if (!dictionary || isLoadingData) {
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
          <p className="text-muted-foreground">
            {searchTerm ? dictionary.homePage.noOffersFoundForSearch?.replace('{searchTerm}', searchTerm) || `No offers found for "${searchTerm}". Try a different search.` : dictionary.homePage.noOffersAdvice}
          </p>
        </div>
      )}
    </div>
  );
}

    