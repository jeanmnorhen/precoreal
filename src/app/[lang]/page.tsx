
'use client';

import React, { useState, useMemo, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import OfferCard from '@/components/offer-card';
import CategoryFilter from '@/components/category-filter';
import { productCategories } from '@/lib/mock-data';
import type { Offer, ListedProduct, Store } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Tag, LocateFixed, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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


const fetchAdvertisements = async (): Promise<Offer[]> => {
  const advertisementsRef = ref(db, 'advertisements');
  const snapshot = await get(advertisementsRef);
  if (snapshot.exists()) {
    const adsData = snapshot.val();
    const now = Date.now();
    const mappedOffers: Offer[] = Object.entries(adsData)
      .map(([id, ad]) => {
        const listedProduct = ad as Omit<ListedProduct, 'id'>;
        if (listedProduct.validUntil < now) {
          return null; 
        }
        const productNameWords = listedProduct.name.toLowerCase().split(' ').slice(0, 2);

        return {
          id: id,
          productName: listedProduct.name,
          productImage: listedProduct.imageUrl || `https://placehold.co/600x400.png`,
          dataAiHint: listedProduct.dataAiHint || productNameWords.join(' '),
          price: listedProduct.price,
          storeId: listedProduct.storeId,
          storeName: `Lojista ID: ${listedProduct.storeId.substring(0,6)}...`, 
          distance: null, // Will be calculated later
          category: listedProduct.category,
          description: listedProduct.description,
        };
      })
      .filter(offer => offer !== null) as Offer[];
    return mappedOffers;
  }
  return [];
};

const fetchStoresMap = async (): Promise<Record<string, Pick<Store, 'name' | 'latitude' | 'longitude'>>> => {
  const storesRef = ref(db, 'stores');
  const snapshot = await get(storesRef);
  if (snapshot.exists()) {
    const storesData = snapshot.val() as Record<string, Omit<Store, 'id'>>;
    const map: Record<string, Pick<Store, 'name' | 'latitude' | 'longitude'>> = {};
    for (const storeId in storesData) {
      map[storeId] = { 
        name: storesData[storeId].name,
        latitude: storesData[storeId].latitude,
        longitude: storesData[storeId].longitude,
      };
    }
    return map;
  }
  return {};
};


export default function HomePage(props: HomePageProps) {
  const { lang } = use(props.params);
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [dictionary, setDictionary] = useState<Dictionary['homePage'] | null>(null);
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<LocationError>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  useEffect(() => {
    const fetchDict = async () => {
      const d = await getDictionary(lang);
      setDictionary(d.homePage);
    };
    fetchDict();
  }, [lang]);

  useEffect(() => {
    const querySearchTerm = searchParams.get('search');
    if (querySearchTerm) {
      setSearchTerm(decodeURIComponent(querySearchTerm));
    }
  }, [searchParams]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('POSITION_UNAVAILABLE'); // Or a new error type for no geolocation support
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


  const { data: fetchedOffers, isLoading: isLoadingOffers, error: offersError } = useQuery<Offer[]>({
    queryKey: ['advertisements'],
    queryFn: fetchAdvertisements,
  });

  const { data: storesMap, isLoading: isLoadingStores, error: storesError } = useQuery<Record<string, Pick<Store, 'name' | 'latitude' | 'longitude'>>>({
    queryKey: ['storesMap'],
    queryFn: fetchStoresMap,
    staleTime: 1000 * 60 * 15, 
  });

  const displayedOffers = fetchedOffers || [];

  const filteredAndSortedOffers = useMemo(() => {
    let offersWithDetails = displayedOffers.map(offer => {
      const storeInfo = storesMap?.[offer.storeId];
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
        storeName: storeInfo?.name || offer.storeName,
        distance: calculatedDistance,
      };
    });


    if (selectedCategory) {
      offersWithDetails = offersWithDetails.filter(
        (offer) => productCategories.find(cat => cat.id === selectedCategory)?.name === offer.category
      );
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
        if (a.distance === null) return 1; // Sort null distances to the end
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === 'price') {
      offersWithDetails.sort((a, b) => a.price - b.price);
    }

    return offersWithDetails;
  }, [selectedCategory, searchTerm, sortBy, displayedOffers, storesMap, userLocation]);


  if (!dictionary || isLoadingOffers || isLoadingStores) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-xl text-muted-foreground">{dictionary?.loadingOffersText || 'Loading offers...'}</p>
      </div>
    );
  }

  const combinedError = offersError || storesError;
  if (combinedError) {
     return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Search className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
        <h3 className="text-xl font-semibold text-destructive">{dictionary.errorLoadingOffersTitle || 'Error Loading Offers'}</h3>
        <p className="text-muted-foreground">
          {dictionary.errorLoadingOffersMessage || 'Could not fetch offers. Please try again later.'}
          <br />
          <span className="text-xs">{(combinedError as Error)?.message}</span>
        </p>
      </div>
    );
  }


  return (
    <div className="animate-fadeIn pt-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={dictionary.searchPlaceholder}
            className="w-full rounded-full py-3 pl-10 pr-4 text-base shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">{dictionary.sortBy}</span>
          <Select value={sortBy} onValueChange={(value: 'distance' | 'price') => setSortBy(value)}>
            <SelectTrigger className="w-auto min-w-[160px] rounded-full shadow-sm">
              <SelectValue placeholder={dictionary.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance" disabled={!userLocation && !locationError}>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" /> {dictionary.proximity}
                </div>
              </SelectItem>
              <SelectItem value="price">
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" /> {dictionary.price}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={requestUserLocation} 
            variant="outline" 
            className="rounded-full shadow-sm"
            disabled={isRequestingLocation}
          >
            {isRequestingLocation ? <LoadingSpinner size={16} className="mr-2" /> : <LocateFixed className="mr-2 h-4 w-4" />}
            {userLocation ? dictionary.updateLocationButton : dictionary.getLocationButton}
          </Button>
        </div>
      </div>

      {locationError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{dictionary.locationErrorTitle}</AlertTitle>
          <AlertDescription>
            {locationError === 'PERMISSION_DENIED' && dictionary.locationPermissionDenied}
            {locationError === 'POSITION_UNAVAILABLE' && dictionary.locationUnavailable}
            {locationError === 'TIMEOUT' && dictionary.locationTimeout}
            {locationError === 'UNKNOWN_ERROR' && dictionary.locationUnknownError}
          </AlertDescription>
        </Alert>
      )}
      
      <CategoryFilter
        categories={productCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        allCategoriesText={dictionary.allCategories}
      />

      {filteredAndSortedOffers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} dictionary={dictionary}/>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold">{dictionary.noOffersFound}</h3>
          <p className="text-muted-foreground">
            {searchTerm ? dictionary.noOffersFoundForSearch?.replace('{searchTerm}', searchTerm) || `No offers found for "${searchTerm}". Try a different search.` : dictionary.noOffersAdvice}
          </p>
        </div>
      )}
    </div>
  );
}
