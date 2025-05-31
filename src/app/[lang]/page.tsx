
'use client';

import React, { useState, useMemo, useEffect, use } from 'react'; // Added 'use'
import OfferCard from '@/components/offer-card';
import CategoryFilter from '@/components/category-filter';
import { mockOffers, productCategories } from '@/lib/mock-data';
import type { Offer } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Tag } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';


// This page is now a server component by default if we fetch dictionary server-side.
// However, to keep existing client-side logic, we'll fetch dictionary in a client component,
// or pass it as prop from a server component wrapper if needed.
// For simplicity in this refactor, we'll assume `dictionary` is passed or fetched appropriately.
// Let's make it a client component that receives the dictionary.

interface HomePageProps {
  params: Promise<{ lang: Locale }>; // params is a Promise
}


export default function HomePage(props: HomePageProps) { // Accept props
  const { lang } = use(props.params); // Unwrap params using React.use()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [isLoading, setIsLoading] = useState(true);
  const [displayedOffers, setDisplayedOffers] = useState<Offer[]>([]);
  const [dictionary, setDictionary] = useState<Dictionary['homePage'] | null>(null);

  useEffect(() => {
    const fetchDictionary = async () => {
      const dict = await getDictionary(lang);
      setDictionary(dict.homePage);
    };
    fetchDictionary();

    // Simulate data fetching
    setTimeout(() => {
      setDisplayedOffers(mockOffers);
      setIsLoading(false);
    }, 1000);
  }, [lang]);

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
        offer.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  if (isLoading || !dictionary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pt-8"> {/* Added pt-8 for spacing after removing header */}
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
        categories={productCategories} // Categories are not yet internationalized
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        allCategoriesText={dictionary.allCategories}
        // filterByCategoryText={dictionary.filterByCategory} // Removed this prop
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
