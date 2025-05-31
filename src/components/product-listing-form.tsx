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
import { PackagePlus, Tag, DollarSign, Image as ImageIcon, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productCategories } from '@/lib/mock-data';

const productListingSchema = z.object({
  productName: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  category: z.string({ required_error: 'Please select a product category.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }).optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, { message: 'Stock quantity cannot be negative.' }).optional(),
});

type ProductListingFormValues = z.infer<typeof productListingSchema>;

export default function ProductListingForm() {
  const { toast } = useToast();
  const form = useForm<ProductListingFormValues>({
    resolver: zodResolver(productListingSchema),
    defaultValues: {
      productName: '',
      description: '',
      price: 0,
      imageUrl: '',
      stock: 0,
    },
  });

  async function onSubmit(data: ProductListingFormValues) {
    // Here you would typically send data to your backend associated with the logged-in store
    console.log('Product listing data:', data);
    toast({
      title: 'Product Listed!',
      description: `${data.productName} has been successfully listed.`,
    });
    form.reset(); // Reset form after submission
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <PackagePlus className="mr-2 h-7 w-7 text-primary" />
          List a New Product
        </CardTitle>
        <CardDescription>
          Add products to your store's inventory on RealPrice Finder.
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
                  <FormLabel>Product Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your product in detail..." {...field} rows={4} />
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
                           <SelectItem key={category.id} value={category.name}>
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
                    <Input type="url" placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormDescription>Link to an image of your product.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Number of items currently in stock.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
              List Product
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
