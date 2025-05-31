
'use client';

import React, { useState, useMemo, useEffect, use } from 'react';
import OfferCard from '@/components/offer-card';
import CategoryFilter from '@/components/category-filter';
import { productCategories } from '@/lib/mock-data'; // Keep for category filter UI
import type { Offer, ListedProduct } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Tag } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, endAt } from 'firebase/database';

interface HomePageProps {
  params: Promise<{ lang: Locale }>;
}

const fetchAdvertisements = async (): Promise<Offer[]> => {
  const advertisementsRef = ref(db, 'advertisements');
  // Query to fetch only active advertisements (validUntil >= now)
  // Firebase RTDB does not support direct >= on timestamp for filtering like Firestore.
  // We fetch all and filter client-side, or structure data to allow limited server-side filtering (e.g. by day).
  // For simplicity here, fetch all and filter client-side.
  // For more complex scenarios, consider Cloud Functions or Firestore with better querying.
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
          storeName: `Loja: ${listedProduct.storeId.substring(0,6)}...`, // Placeholder for store name
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


export default function HomePage(props: HomePageProps) {
  const { lang } = use(props.params);

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

  const { data: fetchedOffers, isLoading: isLoadingOffers, error: offersError } = useQuery<Offer[]>({
    queryKey: ['advertisements'],
    queryFn: fetchAdvertisements,
  });

  const displayedOffers = fetchedOffers || [];

  const filteredAndSortedOffers = useMemo(() => {
    let offers = [...displayedOffers];

    if (selectedCategory) {
      offers = offers.filter(
        (offer) => productCategories.find(cat => cat.id === selectedCategory)?.name === offer.category
      );
    }

    if (searchTerm) {
      offers = offers.filter((offer) =>
        offer.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || // May need adjustment if storeName changes
        offer.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'distance') {
      offers.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'price') {
      offers.sort((a, b) => a.price - b.price);
    }

    return offers;
  }, [selectedCategory, searchTerm, sortBy, displayedOffers]);


  if (!dictionary || isLoadingOffers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-xl text-muted-foreground">{dictionary?.loadingOffersText || 'Loading offers...'}</p>
      </div>
    );
  }

  if (offersError) {
     return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Search className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
        <h3 className="text-xl font-semibold text-destructive">{dictionary.errorLoadingOffersTitle || 'Error Loading Offers'}</h3>
        <p className="text-muted-foreground">
          {dictionary.errorLoadingOffersMessage || 'Could not fetch offers. Please try again later.'}
          <br />
          <span className="text-xs">{(offersError as Error)?.message}</span>
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
            {dictionary.noOffersAdvice}
          </p>
        </div>
      )}
    </div>
  );
}
