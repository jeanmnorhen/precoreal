
'use client';

import React, { useState, useMemo, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import OfferCard from '@/components/offer-card';
import CategoryFilter from '@/components/category-filter';
import { productCategories } from '@/lib/mock-data';
import type { Offer, ListedProduct, Store } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Tag } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

interface HomePageProps {
  params: Promise<{ lang: Locale }>;
}

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
          return null; // Filter out expired ads
        }
        const productNameWords = listedProduct.name.toLowerCase().split(' ').slice(0, 2);

        return {
          id: id,
          productName: listedProduct.name,
          productImage: listedProduct.imageUrl || `https://placehold.co/600x400.png`,
          dataAiHint: listedProduct.dataAiHint || productNameWords.join(' '),
          price: listedProduct.price,
          storeId: listedProduct.storeId, // Keep storeId for lookup
          storeName: `Lojista ID: ${listedProduct.storeId.substring(0,6)}...`, // Placeholder, will be updated
          distance: Math.round(Math.random() * 10 * 10)/10, // Mock distance
          category: listedProduct.category,
          description: listedProduct.description,
        };
      })
      .filter(offer => offer !== null) as Offer[];
    return mappedOffers;
  }
  return [];
};

const fetchStoresMap = async (): Promise<Record<string, string>> => {
  const storesRef = ref(db, 'stores');
  const snapshot = await get(storesRef);
  if (snapshot.exists()) {
    const storesData = snapshot.val() as Record<string, Omit<Store, 'id'>>;
    const map: Record<string, string> = {};
    for (const storeId in storesData) {
      map[storeId] = storesData[storeId].name;
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


  const { data: fetchedOffers, isLoading: isLoadingOffers, error: offersError } = useQuery<Offer[]>({
    queryKey: ['advertisements'],
    queryFn: fetchAdvertisements,
  });

  const { data: storesMap, isLoading: isLoadingStores, error: storesError } = useQuery<Record<string, string>>({
    queryKey: ['storesMap'],
    queryFn: fetchStoresMap,
    staleTime: 1000 * 60 * 15, // Cache stores data for 15 minutes
  });

  const displayedOffers = fetchedOffers || [];

  const filteredAndSortedOffers = useMemo(() => {
    let offersWithStoreNames = displayedOffers.map(offer => ({
      ...offer,
      storeName: (storesMap && storesMap[offer.storeId]) || offer.storeName,
    }));


    if (selectedCategory) {
      offersWithStoreNames = offersWithStoreNames.filter(
        (offer) => productCategories.find(cat => cat.id === selectedCategory)?.name === offer.category
      );
    }

    if (searchTerm) {
      offersWithStoreNames = offersWithStoreNames.filter((offer) =>
        offer.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.storeName && offer.storeName.toLowerCase().includes(searchTerm.toLowerCase())) || 
        offer.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'distance') {
      offersWithStoreNames.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'price') {
      offersWithStoreNames.sort((a, b) => a.price - b.price);
    }

    return offersWithStoreNames;
  }, [selectedCategory, searchTerm, sortBy, displayedOffers, storesMap]);


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
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{dictionary.sortBy}</span>
          <Select value={sortBy} onValueChange={(value: 'distance' | 'price') => setSortBy(value)}>
            <SelectTrigger className="w-[180px] rounded-full shadow-sm">
              <SelectValue placeholder={dictionary.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">
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
        </div>
      </div>
      
      <CategoryFilter
        categories={productCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        allCategoriesText={dictionary.allCategories}
      />

      {filteredAndSortedOffers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
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
