
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
import { Store as StoreIconLucide, Building, Mail, Phone, MapPin, Briefcase } from 'lucide-react'; // Renamed Store import
import { useToast } from '@/hooks/use-toast';
import { productCategories } from '@/lib/mock-data'; // Assuming store categories can reuse productCategories for now
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import type { Store } from '@/types';

const storeRegistrationSchema = z.object({
  storeName: z.string().min(2, { message: 'Store name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  city: z.string().min(2, { message: 'City must be at least 2 characters.' }),
  state: z.string().min(2, { message: 'State must be at least 2 characters.' }),
  zipCode: z.string().min(5, { message: 'Zip code must be at least 5 digits.' }).max(10), // Allow for zip+4
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  storeCategory: z.string({ required_error: "Please select a store category." }),
  description: z.string().optional(),
  // TODO: Add latitude/longitude fields, ideally auto-filled from address or map picker
});

type StoreRegistrationFormValues = z.infer<typeof storeRegistrationSchema>;

export default function StoreRegistrationForm() {
  const { toast } = useToast();
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
    },
  });

  async function onSubmit(data: StoreRegistrationFormValues) {
    try {
      const storesRef = ref(db, 'stores');
      const newStoreRef = push(storesRef); // Generates a unique ID
      const newStoreId = newStoreRef.key;

      if (!newStoreId) {
        throw new Error('Failed to generate store ID.');
      }

      const storeData: Omit<Store, 'id'> = { // id will be the Firebase key
        name: data.storeName,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        email: data.email,
        phone: data.phone,
        category: data.storeCategory,
        description: data.description || '',
        // In a real app, you'd get lat/lng here, possibly from a geocoding service
        // latitude: 0, // Placeholder
        // longitude: 0, // Placeholder
      };

      await set(newStoreRef, storeData);

      toast({
        title: 'Registration Submitted!',
        description: `Thank you, ${data.storeName}, for registering. Your store data has been saved.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error saving store registration data:', error);
      toast({
        title: 'Registration Failed',
        description: 'There was an error submitting your registration. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <StoreIconLucide className="mr-2 h-7 w-7 text-primary" />
          Register Your Store
        </CardTitle>
        <CardDescription>
          Join RealPrice Finder to list your products and reach more customers.
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
                  <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" />Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Corner Cafe" {...field} />
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
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                    <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Contact Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" {...field} />
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
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Anytown" {...field} />
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
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" {...field} />
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
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl>
                      <Input placeholder="90210" {...field} />
                    </FormControl>
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
                  <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Store Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category for your store" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Using productCategories for store types, consider a separate list for actual store types */}
                      {productCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.icon && <category.icon className="mr-2 h-4 w-4 inline-block" />}
                          {category.name}
                        </SelectItem>
                      ))}
                       <SelectItem value="Restaurant">Restaurant</SelectItem>
                       <SelectItem value="Retail">Retail</SelectItem>
                       <SelectItem value="Services">Services</SelectItem>
                       <SelectItem value="Other">Other</SelectItem>
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
                  <FormLabel>Store Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us a bit about your store..." {...field} />
                  </FormControl>
                  <FormDescription>A brief description of your store and what you offer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Registering...' : 'Register Store'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
