
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Globe2, ExternalLink, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import type { PreferredLocation } from '@/types';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';
import LoadingSpinner from '@/components/loading-spinner';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PreferredLocationFormProps {
  userId: string;
  dictionary: Dictionary['preferredLocationForm'];
  lang: Locale; // For potential future use within the component if needed
}

const fetchPreferredLocation = async (userId: string): Promise<PreferredLocation | null> => {
  const locationRef = ref(db, `userSettings/${userId}/preferredLocation`);
  const snapshot = await get(locationRef);
  if (snapshot.exists()) {
    return snapshot.val() as PreferredLocation;
  }
  return null;
};

export default function PreferredLocationForm({ userId, dictionary }: PreferredLocationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preferredLocationSchema = useMemo(() => z.object({
    address: z.string().min(5, { message: dictionary.addressMinLengthError.replace('{length}', '5') }),
    latitude: z.coerce.number().min(-90, {message: dictionary.latitudeInvalidError}).max(90, {message: dictionary.latitudeInvalidError}),
    longitude: z.coerce.number().min(-180, {message: dictionary.longitudeInvalidError}).max(180, {message: dictionary.longitudeInvalidError}),
  }), [dictionary]);

  type PreferredLocationFormValues = z.infer<typeof preferredLocationSchema>;

  const form = useForm<PreferredLocationFormValues>({
    resolver: zodResolver(preferredLocationSchema),
    defaultValues: {
      address: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  const { data: currentPreferredLocation, isLoading: isLoadingLocation } = useQuery<PreferredLocation | null>({
    queryKey: ['preferredLocation', userId],
    queryFn: () => fetchPreferredLocation(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (currentPreferredLocation) {
      form.reset(currentPreferredLocation);
    }
  }, [currentPreferredLocation, form]);

  const saveLocationMutation = useMutation({
    mutationFn: async (data: PreferredLocationFormValues) => {
      const locationRef = ref(db, `userSettings/${userId}/preferredLocation`);
      await set(locationRef, data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preferredLocation', userId] });
      queryClient.setQueryData(['preferredLocation', userId], data);
      toast({
        title: dictionary.saveSuccessTitle,
        description: dictionary.saveSuccessMessage,
      });
    },
    onError: (error: any) => {
      toast({
        title: dictionary.saveErrorTitle,
        description: error.message || dictionary.genericError,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });


  const handleFindOnMap = () => {
    const addressValue = form.getValues('address');
    if (addressValue) {
      const query = encodeURIComponent(addressValue);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    } else {
      toast({
        title: dictionary.fillAddressFirstTitle,
        description: dictionary.fillAddressFirstMessage,
        variant: "default",
      });
    }
  };

  async function onSubmit(data: PreferredLocationFormValues) {
    setIsSubmitting(true);
    saveLocationMutation.mutate(data);
  }

  if (!dictionary) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <LoadingSpinner size={32} /> <p className="ml-2">Loading form...</p>
      </div>
    );
  }

  if (isLoadingLocation) {
     return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <LoadingSpinner size={32} /> <p className="ml-2">{dictionary.loadingLocationText}</p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center text-xl font-headline">
          <MapPin className="mr-2 h-6 w-6 text-primary" />
          {dictionary.formTitle}
        </CardTitle>
        <CardDescription>
          {dictionary.formDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.addressLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dictionary.addressPlaceholder} {...field} />
                  </FormControl>
                  <FormDescription>{dictionary.addressHint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" onClick={handleFindOnMap} className="w-full sm:w-auto">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {dictionary.findOnMapButton}
                </Button>
              <FormDescription>{dictionary.coordinatesHint}</FormDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Globe2 className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.latitudeLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={dictionary.latitudePlaceholder} {...field} step="any" onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Globe2 className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.longitudeLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={dictionary.longitudePlaceholder} {...field} step="any" onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || saveLocationMutation.isPending}>
              {isSubmitting || saveLocationMutation.isPending ? <LoadingSpinner size={20} className="mr-2"/> : <Save className="mr-2 h-5 w-5" />}
              {isSubmitting || saveLocationMutation.isPending ? dictionary.savingButton : dictionary.saveButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
