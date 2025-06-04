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
import { PackagePlus, Tag, DollarSign, Image as ImageIcon, Layers, Clock, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productCategories } from '@/lib/mock-data';
import { db } from '@/lib/firebase';
import { ref, push, set, update } from 'firebase/database';
import type { ListedProduct } from '@/types';
import type { Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import LoadingSpinner from './loading-spinner';
import { useState, useEffect, useMemo } from 'react';

export interface ProductListingFormProps {
  storeId: string;
  dictionary: Dictionary['productListingForm'];
  lang: Locale;
  mode?: 'create' | 'edit';
  existingProductData?: ListedProduct | null;
  onFormSubmitted?: () => void; // Callback for after successful submission
}

const productListingSchemaObject = (dictionary: Dictionary['productListingForm'], mode: 'create' | 'edit') => {
  const baseSchema = {
    productName: z.string().min(3, { message: dictionary.productNameMinLengthError.replace('{length}', '3') }),
    description: z.string().min(10, { message: dictionary.descriptionMinLengthError.replace('{length}', '10') }).optional(),
    price: z.coerce.number().positive({ message: dictionary.pricePositiveError }),
    category: z.string({ required_error: dictionary.categoryRequiredError }),
    imageUrl: z.string().url({ message: dictionary.imageUrlInvalidError }).optional().or(z.literal('')),
    dataAiHint: z.string().max(30, {message: dictionary.dataAiHintMaxLengthError.replace('{length}', '30')}).optional(),
    stock: z.coerce.number().int().min(0, { message: dictionary.stockNonNegativeError }).optional(),
  };

  if (mode === 'create') {
    return z.object({
      ...baseSchema,
      validityDurationDays: z.coerce.number().int().min(1, {message: dictionary.validityMinDaysError.replace('{days}', '1')}).max(7, { message: dictionary.validityMaxDaysError.replace('{days}', '7') }),
    });
  }
  return z.object(baseSchema);
};


export type ProductListingFormValues = z.infer<ReturnType<typeof productListingSchemaObject>>;

export default function ProductListingForm({
  storeId,
  dictionary,
  lang,
  mode = 'create',
  existingProductData,
  onFormSubmitted,
}: ProductListingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSchema = useMemo(() => productListingSchemaObject(dictionary, mode), [dictionary, mode]);

  const form = useForm<ProductListingFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: mode === 'edit' && existingProductData ? {
      productName: existingProductData.name,
      description: existingProductData.description || '',
      price: existingProductData.price,
      category: existingProductData.category,
      imageUrl: existingProductData.imageUrl || '',
      dataAiHint: existingProductData.dataAiHint || '',
      stock: existingProductData.stock,
      // validityDurationDays is not part of edit form
    } : {
      productName: '',
      description: '',
      price: undefined,
      imageUrl: '',
      dataAiHint: '',
      stock: undefined,
      validityDurationDays: mode === 'create' ? 7 : undefined, // Default for create mode
    },
  });
  
  useEffect(() => {
    if (mode === 'edit' && existingProductData) {
      form.reset({
        productName: existingProductData.name,
        description: existingProductData.description || '',
        price: existingProductData.price,
        category: existingProductData.category,
        imageUrl: existingProductData.imageUrl || '',
        dataAiHint: existingProductData.dataAiHint || '',
        stock: existingProductData.stock,
      });
    } else if (mode === 'create') {
      form.reset({
        productName: '',
        description: '',
        price: undefined,
        category: undefined,
        imageUrl: '',
        dataAiHint: '',
        stock: undefined,
        validityDurationDays: 7,
      });
    }
  }, [mode, existingProductData, form]);


  async function onSubmit(data: ProductListingFormValues) {
    setIsSubmitting(true);

    if (mode === 'create') {
      const createData = data as z.infer<ReturnType<typeof productListingSchemaObject>>; // Cast to include validityDurationDays
      if (createData.validityDurationDays === undefined) {
        toast({ title: dictionary.advertisingFailedTitle, description: "Validity duration is required.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const createdAt = Date.now();
      const validUntil = createdAt + createData.validityDurationDays * 24 * 60 * 60 * 1000;

      const advertisementPayload: Omit<ListedProduct, 'id' | 'archived'> = {
        storeId: storeId,
        name: createData.productName,
        description: createData.description || '',
        price: createData.price,
        category: createData.category,
        createdAt,
        validUntil,
        imageUrl: createData.imageUrl || undefined,
        dataAiHint: createData.dataAiHint || undefined,
        stock: createData.stock,
      };

      try {
        const advertisementsRef = ref(db, 'advertisements');
        const newAdvertisementRef = push(advertisementsRef);
        await set(newAdvertisementRef, advertisementPayload);
        toast({
          title: dictionary.productAdvertisedTitle,
          description: dictionary.productAdvertisedMessage.replace('{productName}', createData.productName),
        });
        form.reset();
        onFormSubmitted?.();
      } catch (error) {
        console.error('Error saving advertisement:', error);
        toast({
          title: dictionary.advertisingFailedTitle,
          description: (error as Error).message || dictionary.advertisingFailedMessage,
          variant: 'destructive',
        });
      }
    } else if (mode === 'edit' && existingProductData?.id) {
        const editData = data as z.infer<ReturnType<typeof productListingSchemaObject>>;
        const productRef = ref(db, `advertisements/${existingProductData.id}`);
        const updatePayload: Partial<Omit<ListedProduct, 'id' | 'storeId' | 'createdAt' | 'validUntil' | 'archived'>> = {
            name: editData.productName,
            description: editData.description || '',
            price: editData.price,
            category: editData.category,
            imageUrl: editData.imageUrl || undefined,
            dataAiHint: editData.dataAiHint || undefined,
            stock: editData.stock,
            // validUntil and createdAt are not updated here
        };
        try {
            await update(productRef, updatePayload);
            toast({
                title: dictionary.productEditedTitle || "Product Updated",
                description: (dictionary.productEditedMessage || "Product {productName} has been updated.").replace('{productName}', editData.productName),
            });
            onFormSubmitted?.();
        } catch (error) {
            console.error('Error updating advertisement:', error);
            toast({
                title: dictionary.editFailedTitle || "Update Failed",
                description: (error as Error).message || dictionary.advertisingFailedMessage,
                variant: 'destructive',
            });
        }
    }
    setIsSubmitting(false);
  }
  
  const cardTitleText = mode === 'edit' ? (dictionary.editFormTitle || "Edit Product") : dictionary.formTitle;
  const cardDescriptionText = mode === 'edit' 
    ? (dictionary.editFormDescription || "Update the details of your product: {productName}")
        .replace('{productName}', existingProductData?.name || '')
    : dictionary.formDescription.replace('{storeId}', storeId.substring(0,8));
  const submitButtonIcon = mode === 'edit' ? <Save className="mr-2 h-5 w-5"/> : <PackagePlus className="mr-2 h-7 w-7 text-primary" />;
  const submitButtonText = mode === 'edit' ? (dictionary.saveChangesButton || "Save Changes") : dictionary.submitButton;
  const submittingButtonText = mode === 'edit' ? (dictionary.savingChangesButton || "Saving...") : dictionary.submittingButton;


  if (!dictionary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={32} />
        <p className="ml-2">Form loading...</p>
      </div>
    );
  }

  return (
    <Card className="w-full mx-auto shadow-none border-none">
      {mode === 'create' && ( // Only show CardHeader/Title/Description for create mode, dialog handles it for edit
        <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline">
            {submitButtonIcon}
            {cardTitleText}
            </CardTitle>
            <CardDescription>
            {cardDescriptionText}
            </CardDescription>
        </CardHeader>
      )}
      <CardContent className={mode === 'edit' ? 'pt-0 px-0 pb-0' : ''}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dictionary.categoryPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productCategories.map(category => (
                           <SelectItem key={category.id} value={category.name}>
                             {category.icon && <category.icon className="mr-2 h-4 w-4 inline-block" />}
                             {dictionary.categoryNames[category.id as keyof typeof dictionary.categoryNames] || category.name}
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
              {mode === 'create' && (
                <FormField
                    control={form.control}
                    name="validityDurationDays"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" />{dictionary.validityLabel}</FormLabel>
                        <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={String(field.value || 7)}
                        >
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
              )}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={20} className="mr-2"/> : (mode === 'edit' ? <Save className="mr-2 h-5 w-5"/> : <PackagePlus className="mr-2 h-5 w-5"/>)}
              {isSubmitting ? submittingButtonText : submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

