'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import ProductListingForm, { type ProductListingFormProps } from './product-listing-form';
import type { ListedProduct } from '@/types';
import type { Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';

interface EditProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit: ListedProduct | null;
  storeId: string;
  dictionary: Dictionary['productListingForm']; // Assuming general product form dictionary keys are relevant
  lang: Locale;
  onSuccessfulEdit: () => void;
}

export default function EditProductDialog({
  isOpen,
  onOpenChange,
  productToEdit,
  storeId,
  dictionary,
  lang,
  onSuccessfulEdit,
}: EditProductDialogProps) {
  if (!productToEdit) return null;

  const handleFormSubmitted = () => {
    onOpenChange(false); // Close the dialog
    onSuccessfulEdit(); // Call external handler (e.g., for query invalidation)
  };
  
  const dialogTitle = (dictionary.editFormTitle || "Edit Product: {productName}").replace('{productName}', productToEdit.name);
  const dialogDescription = (dictionary.editFormDescription || "Update the details for your product '{productName}'.")
    .replace('{productName}', productToEdit.name);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <ProductListingForm
          storeId={storeId} 
          dictionary={dictionary}
          lang={lang}
          mode="edit"
          existingProductData={productToEdit}
          onFormSubmitted={handleFormSubmitted}
        />
      </DialogContent>
    </Dialog>
  );
}
