
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
import { PackagePlus, Tag, DollarSign, Image as ImageIcon, Layers, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productCategories } from '@/lib/mock-data';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import type { ListedProduct } from '@/types';
import type { Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import LoadingSpinner from './loading-spinner';
import { useState } from 'react';

interface ProductListingFormProps {
  storeId: string; 
  dictionary: Dictionary['productListingForm'];
  lang: Locale;
}

export default function ProductListingForm({ storeId, dictionary, lang }: ProductListingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productListingSchema = z.object({
    productName: z.string().min(3, { message: dictionary.productNameMinLengthError.replace('{length}', '3') }),
    description: z.string().min(10, { message: dictionary.descriptionMinLengthError.replace('{length}', '10') }).optional(),
    price: z.coerce.number().positive({ message: dictionary.pricePositiveError }),
    category: z.string({ required_error: dictionary.categoryRequiredError }),
    imageUrl: z.string().url({ message: dictionary.imageUrlInvalidError }).optional().or(z.literal('')),
    dataAiHint: z.string().max(30, {message: dictionary.dataAiHintMaxLengthError.replace('{length}', '30')}).optional(),
    stock: z.coerce.number().int().min(0, { message: dictionary.stockNonNegativeError }).optional(),
    validityDurationDays: z.coerce.number().int().min(1, {message: dictionary.validityMinDaysError.replace('{days}', '1')}).max(7, { message: dictionary.validityMaxDaysError.replace('{days}', '7') }),
  });

  type ProductListingFormValues = z.infer<typeof productListingSchema>;


  const form = useForm<ProductListingFormValues>({
    resolver: zodResolver(productListingSchema),
    defaultValues: {
      productName: '',
      description: '',
      price: undefined,
      imageUrl: '',
      dataAiHint: '',
      stock: undefined, 
      validityDurationDays: 7, 
    },
  });

  async function onSubmit(data: ProductListingFormValues) {
    setIsSubmitting(true);
    const { validityDurationDays, ...productData } = data;
    const createdAt = Date.now();
    const validUntil = createdAt + validityDurationDays * 24 * 60 * 60 * 1000; 

    const advertisementPayload: Omit<ListedProduct, 'id'> = {
      storeId: storeId,
      name: productData.productName,
      description: productData.description || '',
      price: productData.price,
      category: productData.category,
      createdAt,
      validUntil,
    };

    if (productData.imageUrl) {
      advertisementPayload.imageUrl = productData.imageUrl;
    }
     if (productData.dataAiHint) {
      advertisementPayload.dataAiHint = productData.dataAiHint;
    }
    if (productData.stock !== undefined && productData.stock !== null) {
      advertisementPayload.stock = productData.stock;
    }
    
    try {
      const advertisementsRef = ref(db, 'advertisements');
      const newAdvertisementRef = push(advertisementsRef); 
      await set(newAdvertisementRef, advertisementPayload);

      toast({
        title: dictionary.productAdvertisedTitle,
        description: dictionary.productAdvertisedMessage.replace('{productName}', data.productName),
      });
      form.reset();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast({
        title: dictionary.advertisingFailedTitle,
        description: dictionary.advertisingFailedMessage,
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
          <PackagePlus className="mr-2 h-7 w-7 text-primary" />
          {dictionary.formTitle}
        </CardTitle>
        <CardDescription>
          {dictionary.formDescription.replace('{storeId}', storeId.substring(0,8))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.productNameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dictionary.productNamePlaceholder} {...field} />
                  </FormControl>
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
                    <Textarea placeholder={dictionary.descriptionPlaceholder} {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.priceLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} step="0.01" onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Layers className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.categoryLabel}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dictionary.categoryPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productCategories.map(category => (
                           <SelectItem key={category.id} value={category.name}>
                             {category.icon && <category.icon className="mr-2 h-4 w-4 inline-block" />}
                             {category.name} {/* TODO: Internationalize category names */}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.imageUrlLabel}</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://placehold.co/600x400.png" {...field} />
                  </FormControl>
                  <FormDescription>{dictionary.imageUrlHint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="dataAiHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Layers className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.dataAiHintLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dictionary.dataAiHintPlaceholder} {...field} />
                  </FormControl>
                   <FormDescription>{dictionary.dataAiHintDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.stockLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={dictionary.stockPlaceholder} {...field} onChange={e => field.onChange(parseInt(e.target.value))} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>{dictionary.stockHint}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validityDurationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.validityLabel}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dictionary.validityPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...Array(7)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1} { (i + 1) > 1 ? dictionary.days : dictionary.day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{dictionary.validityHint.replace('{minDays}', '1').replace('{maxDays}', '7')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
