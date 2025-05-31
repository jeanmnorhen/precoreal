
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store as StoreIconLucide, Building, Mail, Phone, MapPin, Briefcase, Globe2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productCategories } from '@/lib/mock-data'; // Ensure this is consistent with category needs
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import type { Store } from '@/types';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';
import LoadingSpinner from './loading-spinner';
import { useState } from 'react';

interface StoreRegistrationFormProps {
  userId: string;
  dictionary: Dictionary['storeRegistrationForm'];
  lang: Locale;
}

export default function StoreRegistrationForm({ userId, dictionary, lang }: StoreRegistrationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!dictionary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={32} />
        <p className="ml-2">Form loading...</p>
      </div>
    );
  }

  const storeRegistrationSchema = z.object({
    storeName: z.string().min(2, { message: dictionary.storeNameMinLengthError.replace('{length}', '2') }),
    address: z.string().min(5, { message: dictionary.addressMinLengthError.replace('{length}', '5') }),
    city: z.string().min(2, { message: dictionary.cityMinLengthError.replace('{length}', '2') }),
    state: z.string().min(2, { message: dictionary.stateMinLengthError.replace('{length}', '2') }),
    zipCode: z.string().min(5, { message: dictionary.zipCodeMinLengthError.replace('{length}', '5') }).max(10),
    email: z.string().email({ message: dictionary.emailInvalidError }),
    phone: z.string().min(10, { message: dictionary.phoneMinLengthError.replace('{length}', '10') }),
    storeCategory: z.string({ required_error: dictionary.categoryRequiredError }),
    description: z.string().optional(),
    latitude: z.coerce.number().min(-90, {message: dictionary.latitudeInvalidError}).max(90, {message: dictionary.latitudeInvalidError}).optional(),
    longitude: z.coerce.number().min(-180, {message: dictionary.longitudeInvalidError}).max(180, {message: dictionary.longitudeInvalidError}).optional(),
  });

  type StoreRegistrationFormValues = z.infer<typeof storeRegistrationSchema>;

  const form = useForm<StoreRegistrationFormValues>({
    resolver: zodResolver(storeRegistrationSchema),
    defaultValues: {
      storeName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      email: '',
      phone: '',
      description: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  async function onSubmit(data: StoreRegistrationFormValues) {
    setIsSubmitting(true);
    try {
      const storesRef = ref(db, 'stores');
      const newStoreRef = push(storesRef);
      const newStoreId = newStoreRef.key;

      if (!newStoreId) {
        throw new Error(dictionary.genericError);
      }

      const storeData: Omit<Store, 'id'> = {
        ownerId: userId,
        name: data.storeName,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        email: data.email,
        phone: data.phone,
        category: data.storeCategory,
        description: data.description || '',
      };

      if (data.latitude !== undefined && data.longitude !== undefined) {
        storeData.latitude = data.latitude;
        storeData.longitude = data.longitude;
      }


      await set(newStoreRef, storeData);

      toast({
        title: dictionary.registrationSuccessTitle,
        description: dictionary.registrationSuccessMessage.replace('{storeName}', data.storeName),
      });
      form.reset();
    } catch (error) {
      console.error('Error saving store registration data:', error);
      toast({
        title: dictionary.registrationErrorTitle,
        description: dictionary.genericError,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <StoreIconLucide className="mr-2 h-7 w-7 text-primary" />
          {dictionary.formTitle}
        </CardTitle>
        <CardDescription>
          {dictionary.formDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.storeNameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dictionary.storeNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.emailLabel}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={dictionary.emailPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.phoneLabel}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder={dictionary.phonePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.addressLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dictionary.addressPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.cityLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={dictionary.cityPlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.stateLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={dictionary.statePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.zipCodeLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={dictionary.zipCodePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormDescription>{dictionary.coordinatesHint}</FormDescription>
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
                     <FormDescription>{dictionary.coordinatesHint}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <FormField
              control={form.control}
              name="storeCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.categoryLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={dictionary.categoryPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectItem value="Restaurant">{dictionary.categoryOptions.Restaurant}</SelectItem>
                       <SelectItem value="Retail">{dictionary.categoryOptions.Retail}</SelectItem>
                       <SelectItem value="Services">{dictionary.categoryOptions.Services}</SelectItem>
                       <SelectItem value="Other">{dictionary.categoryOptions.Other}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.descriptionLabel}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={dictionary.descriptionPlaceholder} {...field} />
                  </FormControl>
                  <FormDescription>{dictionary.descriptionHint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={20} className="mr-2"/> : null}
              {isSubmitting ? dictionary.submittingButton : dictionary.submitButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
