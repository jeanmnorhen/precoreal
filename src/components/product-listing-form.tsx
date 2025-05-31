
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

const productListingSchema = z.object({
  productName: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).optional(),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  category: z.string({ required_error: 'Please select a product category.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }).optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, { message: 'Stock quantity cannot be negative.' }).optional(),
  validityDurationDays: z.coerce.number().int().min(1, {message: 'Validity must be at least 1 day.'}).max(7, { message: 'Validity must be at most 7 days.' }),
});

type ProductListingFormValues = z.infer<typeof productListingSchema>;

interface ProductListingFormProps {
  storeId: string; // ID of the store listing this product
}

export default function ProductListingForm({ storeId }: ProductListingFormProps) {
  const { toast } = useToast();
  const form = useForm<ProductListingFormValues>({
    resolver: zodResolver(productListingSchema),
    defaultValues: {
      productName: '',
      description: '',
      price: 0,
      imageUrl: '',
      stock: undefined, // Optional, so undefined is better than 0 if not provided
      validityDurationDays: 7, // Default to 7 days
    },
  });

  async function onSubmit(data: ProductListingFormValues) {
    const { validityDurationDays, ...productData } = data;
    const createdAt = Date.now();
    const validUntil = createdAt + validityDurationDays * 24 * 60 * 60 * 1000; // days to ms

    const advertisementPayload: Omit<ListedProduct, 'id'> = {
      storeId: storeId,
      name: productData.productName,
      description: productData.description || '',
      price: productData.price,
      category: productData.category,
      createdAt,
      validUntil,
      // dataAiHint is not collected in this form yet
    };

    if (productData.imageUrl) {
      advertisementPayload.imageUrl = productData.imageUrl;
    }
    if (productData.stock !== undefined && productData.stock !== null) {
      advertisementPayload.stock = productData.stock;
    }
    

    try {
      const advertisementsRef = ref(db, 'advertisements');
      const newAdvertisementRef = push(advertisementsRef); // Generates a unique ID for the advertisement
      await set(newAdvertisementRef, advertisementPayload);

      toast({
        title: 'Product Advertised!',
        description: `${data.productName} has been successfully advertised.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast({
        title: 'Advertising Failed',
        description: 'There was an error posting your advertisement. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <PackagePlus className="mr-2 h-7 w-7 text-primary" />
          Advertise a New Product
        </CardTitle>
        <CardDescription>
          Add products to your store's advertisements on RealPrice Finder.
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
                  <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Handcrafted Leather Wallet" {...field} />
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
                  <FormLabel>Product Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your product in detail..." {...field} rows={3} />
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
                    <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} step="0.01" />
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
                    <FormLabel className="flex items-center"><Layers className="mr-2 h-4 w-4 text-muted-foreground" />Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productCategories.map(category => (
                           <SelectItem key={category.id} value={category.name}> {/* Saving category name for now */}
                             {category.icon && <category.icon className="mr-2 h-4 w-4 inline-block" />}
                             {category.name}
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
                  <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />Product Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://placehold.co/600x400.png" {...field} />
                  </FormControl>
                  <FormDescription>Link to an image of your product. Use https://placehold.co for placeholders.</FormDescription>
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
                    <FormLabel>Stock Quantity (Optional)</FormLabel>
                    <FormControl>
                      {/* Ensure field.value is correctly handled if it's undefined */}
                      <Input type="number" placeholder="Leave blank if not tracking" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>Number of items currently in stock.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validityDurationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" />Advertisement Validity</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select validity period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...Array(7)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1} day{i + 1 > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>How long this ad will be active (1-7 days).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Advertising...' : 'Advertise Product'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
