
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, get, update, push, set, serverTimestamp } from 'firebase/database';
import type { SuggestedNewProduct, CanonicalProduct, ProductCategory as ProductCategoryType } from '@/types';
import { productCategories } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ListChecks, PlusCircle, XCircle, Edit, Trash2, Info, BookOpen, CheckSquare } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';


const fetchSuggestedProducts = async (): Promise<SuggestedNewProduct[]> => {
  const suggestionsRef = ref(db, 'suggestedNewProducts');
  const snapshot = await get(suggestionsRef);
  if (snapshot.exists()) {
    const suggestionsData = snapshot.val();
    return Object.entries(suggestionsData).map(([id, suggestion]) => ({
      id,
      ...(suggestion as Omit<SuggestedNewProduct, 'id'>),
    }));
  }
  return [];
};

// Function to normalize product names for comparison/storage
const normalizeProductName = (name: string): string => {
  return name.trim().toLowerCase();
};


export default function AdminCatalogManagementPage({ params: { lang } }: { params: { lang: Locale } }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);

  const [isCreateCanonicalDialogOpen, setIsCreateCanonicalDialogOpen] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<SuggestedNewProduct | null>(null);

  useEffect(() => {
    const fetchDict = async () => {
      const d = await getDictionary(lang);
      setDictionary(d);
    };
    fetchDict();
  }, [lang]);

  const canonicalProductFormSchema = useMemo(() => {
    if (!dictionary) return z.object({}); // Return a dummy schema if dictionary is not loaded
    return z.object({
      productName: z.string().min(2, { message: dictionary.adminCatalogPage.productNameMinLengthError.replace('{length}', '2') }),
      category: z.string({ required_error: dictionary.adminCatalogPage.categoryRequiredError }),
      description: z.string().optional(),
      defaultImageUrl: z.string().url({ message: dictionary.adminCatalogPage.imageUrlInvalidError }).optional().or(z.literal('')),
    });
  }, [dictionary]);

  type CanonicalProductFormValues = z.infer<typeof canonicalProductFormSchema>;

  const {
    register: registerCanonical,
    handleSubmit: handleSubmitCanonical,
    control: controlCanonical,
    reset: resetCanonicalForm,
    setValue: setCanonicalValue,
    formState: { errors: canonicalErrors, isSubmitting: isSubmittingCanonical },
  } = useForm<CanonicalProductFormValues>({
    resolver: zodResolver(canonicalProductFormSchema as any), // Cast as any due to dynamic schema
    defaultValues: {
      productName: '',
      category: undefined,
      description: '',
      defaultImageUrl: '',
    },
  });

  const { data: suggestedProducts, isLoading: isLoadingSuggestions, error: suggestionsError } = useQuery<SuggestedNewProduct[]>({
    queryKey: ['suggestedProducts'],
    queryFn: fetchSuggestedProducts,
  });

  const updateSuggestionStatusMutation = useMutation({
    mutationFn: async ({ suggestionId, status }: { suggestionId: string, status: SuggestedNewProduct['status'] }) => {
      const suggestionRef = ref(db, `suggestedNewProducts/${suggestionId}/status`);
      await set(suggestionRef, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suggestedProducts'] });
      toast({
        title: dictionary?.adminCatalogPage.toastSuggestionStatusUpdatedTitle || 'Status Updated',
        description: dictionary?.adminCatalogPage.toastSuggestionStatusUpdatedDesc
          ?.replace('{status}', variables.status) || `Suggestion status updated to ${variables.status}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: dictionary?.adminCatalogPage.toastErrorTitle || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createCanonicalProductMutation = useMutation({
    mutationFn: async (data: CanonicalProductFormValues) => {
      const canonicalProductsRef = ref(db, 'canonicalProducts');
      const newCanonicalRef = push(canonicalProductsRef);
      const newProduct: Omit<CanonicalProduct, 'id'> = {
        name: data.productName,
        normalizedName: normalizeProductName(data.productName),
        category: data.category,
        description: data.description || '',
        defaultImageUrl: data.defaultImageUrl || '',
        // createdAt: serverTimestamp(), // Consider adding timestamps
      };
      await set(newCanonicalRef, newProduct);
      return newProduct;
    },
    onSuccess: (newProduct, variables) => {
      queryClient.invalidateQueries({ queryKey: ['canonicalProducts'] });
      if (currentSuggestion) {
        updateSuggestionStatusMutation.mutate({ suggestionId: currentSuggestion.id, status: 'added-to-catalog' });
      }
      toast({
        title: dictionary?.adminCatalogPage.toastCanonicalCreatedTitle || 'Product Created',
        description: dictionary?.adminCatalogPage.toastCanonicalCreatedDesc?.replace('{productName}', newProduct.name) || `${newProduct.name} added to catalog.`,
      });
      setIsCreateCanonicalDialogOpen(false);
      resetCanonicalForm();
      setCurrentSuggestion(null);
    },
    onError: (error: any) => {
      toast({
        title: dictionary?.adminCatalogPage.toastErrorTitle || 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });


  const handleDismissSuggestion = (suggestionId: string) => {
    updateSuggestionStatusMutation.mutate({ suggestionId, status: 'rejected' });
  };

  const handleOpenCreateCanonicalDialog = (suggestion: SuggestedNewProduct) => {
    setCurrentSuggestion(suggestion);
    setCanonicalValue('productName', suggestion.productName);
    // Attempt to pre-select category if suggestion lang and mock-data category name match (simple case)
    const suggestedCategory = productCategories.find(cat => cat.name.toLowerCase() === suggestion.normalizedName?.split(' ')[0]); // very naive
    if (suggestedCategory) {
        setCanonicalValue('category', suggestedCategory.name);
    } else {
        setCanonicalValue('category', '');
    }
    setCanonicalValue('description', '');
    setCanonicalValue('defaultImageUrl', '');
    setIsCreateCanonicalDialogOpen(true);
  };

  const onSubmitCanonicalProduct = (data: CanonicalProductFormValues) => {
    createCanonicalProductMutation.mutate(data);
  };


  if (isLoadingSuggestions || !dictionary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-2">{dictionary?.adminCatalogPage.loadingText || "Loading..."}</p>
      </div>
    );
  }

  if (suggestionsError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Info className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
        <h3 className="text-xl font-semibold text-destructive">{dictionary?.adminCatalogPage.errorLoadingTitle || 'Error Loading Suggestions'}</h3>
        <p className="text-muted-foreground">{(suggestionsError as Error)?.message}</p>
      </div>
    );
  }

  const pendingSuggestions = suggestedProducts?.filter(s => s.status === 'pending') || [];
  const reviewedSuggestions = suggestedProducts?.filter(s => s.status !== 'pending') || [];


  return (
    <div className="animate-fadeIn py-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <ListChecks className="mr-2 h-7 w-7 text-primary" />
            {dictionary.adminCatalogPage.suggestedProductsTitle}
          </CardTitle>
          <CardDescription>{dictionary.adminCatalogPage.suggestedProductsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingSuggestions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.adminCatalogPage.productNameLabel}</TableHead>
                  <TableHead>{dictionary.adminCatalogPage.sourceLabel}</TableHead>
                  <TableHead>{dictionary.adminCatalogPage.timestampLabel}</TableHead>
                  <TableHead>{dictionary.adminCatalogPage.languageLabel}</TableHead>
                  <TableHead>{dictionary.adminCatalogPage.statusLabel}</TableHead>
                  <TableHead>{dictionary.adminCatalogPage.actionsLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSuggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell className="font-medium">{suggestion.productName}</TableCell>
                    <TableCell>{suggestion.source}</TableCell>
                    <TableCell>{suggestion.timestamp ? format(new Date(suggestion.timestamp), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                    <TableCell>{suggestion.lang || '-'}</TableCell>
                    <TableCell><Badge variant={suggestion.status === 'pending' ? 'outline' : 'default'}>{suggestion.status}</Badge></TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCreateCanonicalDialog(suggestion)}
                        disabled={updateSuggestionStatusMutation.isPending || createCanonicalProductMutation.isPending}
                      >
                        <PlusCircle className="mr-1 h-4 w-4" /> {dictionary.adminCatalogPage.createCanonicalButton}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                        disabled={updateSuggestionStatusMutation.isPending || createCanonicalProductMutation.isPending}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> {dictionary.adminCatalogPage.dismissButton}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">{dictionary.adminCatalogPage.noPendingSuggestions}</p>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog for Creating Canonical Product from Suggestion */}
      <Dialog open={isCreateCanonicalDialogOpen} onOpenChange={(open) => {
          setIsCreateCanonicalDialogOpen(open);
          if (!open) {
            resetCanonicalForm();
            setCurrentSuggestion(null);
          }
        }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitCanonical(onSubmitCanonicalProduct)}>
            <DialogHeader>
              <DialogTitle>{dictionary.adminCatalogPage.createCanonicalDialogTitle}</DialogTitle>
              <DialogDescription>
                {dictionary.adminCatalogPage.createCanonicalDialogDescription.replace(
                  '{productName}', 
                  currentSuggestion?.productName || 'product'
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <label htmlFor="productName" className="text-sm font-medium">
                  {dictionary.adminCatalogPage.productNameFormLabel}
                </label>
                <Input
                  id="productName"
                  {...registerCanonical('productName')}
                  placeholder={dictionary.adminCatalogPage.productNamePlaceholder}
                  className={canonicalErrors.productName ? 'border-destructive' : ''}
                />
                {canonicalErrors.productName && (
                  <p className="text-xs text-destructive">{canonicalErrors.productName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="category" className="text-sm font-medium">
                  {dictionary.adminCatalogPage.categoryFormLabel}
                </label>
                 <Controller
                    name="category"
                    control={controlCanonical}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="category" className={canonicalErrors.category ? 'border-destructive' : ''}>
                            <SelectValue placeholder={dictionary.productListingForm.categoryPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {productCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                                {cat.icon && <cat.icon className="mr-2 h-4 w-4 inline-block" />}
                                {dictionary?.productCategoryNames[cat.id as keyof typeof dictionary.productCategoryNames] || cat.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                    />
                {canonicalErrors.category && (
                  <p className="text-xs text-destructive">{canonicalErrors.category.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label htmlFor="description" className="text-sm font-medium">
                  {dictionary.adminCatalogPage.descriptionFormLabel}
                </label>
                <Textarea
                  id="description"
                  {...registerCanonical('description')}
                  placeholder={dictionary.adminCatalogPage.descriptionPlaceholder}
                  rows={3}
                  className={canonicalErrors.description ? 'border-destructive' : ''}
                />
                 {canonicalErrors.description && (
                  <p className="text-xs text-destructive">{canonicalErrors.description.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="defaultImageUrl" className="text-sm font-medium">
                  {dictionary.adminCatalogPage.imageUrlFormLabel}
                </label>
                <Input
                  id="defaultImageUrl"
                  type="url"
                  {...registerCanonical('defaultImageUrl')}
                  placeholder="https://placehold.co/600x400.png"
                  className={canonicalErrors.defaultImageUrl ? 'border-destructive' : ''}
                />
                {canonicalErrors.defaultImageUrl && (
                  <p className="text-xs text-destructive">{canonicalErrors.defaultImageUrl.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => {
                    resetCanonicalForm();
                    setCurrentSuggestion(null);
                }}>
                  {dictionary.adminCatalogPage.cancelButton}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmittingCanonical || createCanonicalProductMutation.isPending}>
                {isSubmittingCanonical || createCanonicalProductMutation.isPending ? <LoadingSpinner size={16} className="mr-2" /> : null}
                {dictionary.adminCatalogPage.saveCanonicalButton}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Section for Reviewed Suggestions */}
      {reviewedSuggestions.length > 0 && (
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                    <CheckSquare className="mr-2 h-6 w-6 text-muted-foreground" />
                    {dictionary.adminCatalogPage.reviewedSuggestionsTitle}
                </CardTitle>
                 <CardDescription>{dictionary.adminCatalogPage.reviewedSuggestionsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>{dictionary.adminCatalogPage.productNameLabel}</TableHead>
                        <TableHead>{dictionary.adminCatalogPage.sourceLabel}</TableHead>
                        <TableHead>{dictionary.adminCatalogPage.statusLabel}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reviewedSuggestions.map((suggestion) => (
                        <TableRow key={suggestion.id}>
                            <TableCell>{suggestion.productName}</TableCell>
                            <TableCell>{suggestion.source}</TableCell>
                            <TableCell><Badge variant={suggestion.status === 'rejected' ? 'destructive' : 'default'}>{suggestion.status}</Badge></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
      
      {/* Placeholder for "Manage Canonical Products" - To be implemented next */}
      <Card className="shadow-lg opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <BookOpen className="mr-2 h-7 w-7 text-primary" />
            {dictionary.adminCatalogPage.manageCanonicalProductsTitle}
          </CardTitle>
          <CardDescription>{dictionary.adminCatalogPage.manageCanonicalProductsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">{dictionary.adminCatalogPage.toBeImplemented}</p>
        </CardContent>
      </Card>

       {/* Placeholder for "Add New Canonical Product Manually" - To be implemented next */}
        <Card className="shadow-lg opacity-50">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                    <PlusCircle className="mr-2 h-6 w-6 text-primary" />
                    {dictionary.adminCatalogPage.addManuallyTitle}
                </CardTitle>
                 <CardDescription>{dictionary.adminCatalogPage.addManuallyDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground text-center py-4">{dictionary.adminCatalogPage.toBeImplemented}</p>
            </CardContent>
        </Card>

    </div>
  );
}

