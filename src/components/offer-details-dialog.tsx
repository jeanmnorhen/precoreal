
'use client';

import Image from 'next/image';
import type { Offer } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShoppingCart, TagIcon, Info } from 'lucide-react';
import type { Dictionary } from '@/lib/get-dictionary';

interface OfferDetailsDialogProps {
  offer: Offer;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dictionary: Dictionary['homePage']; // Using homePage dictionary for relevant texts
}

export default function OfferDetailsDialog({ offer, isOpen, onOpenChange, dictionary }: OfferDetailsDialogProps) {
  if (!offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{offer.productName}</DialogTitle>
          {offer.category && (
            <div className="pt-2">
              <Badge variant="secondary">{offer.category}</Badge>
            </div>
          )}
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="relative h-64 w-full rounded-md overflow-hidden border">
            <Image
              src={offer.productImage}
              alt={offer.productName}
              layout="fill"
              objectFit="contain"
              data-ai-hint={offer.dataAiHint || 'product image'}
            />
          </div>
          
          <div className="space-y-3">
            <p className="text-3xl font-bold text-primary">R${offer.price.toFixed(2)}</p>
            
            {offer.description && (
              <div>
                <h4 className="font-semibold text-muted-foreground flex items-center mb-1">
                  <Info className="mr-2 h-4 w-4" />
                  {dictionary?.offerDetailsDialog?.descriptionLabel || "Description"}
                </h4>
                <p className="text-sm text-foreground">{offer.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-muted-foreground flex items-center mb-1">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {dictionary?.offerDetailsDialog?.storeLabel || "Store"}
              </h4>
              <p className="text-sm text-foreground">{offer.storeName}</p>
            </div>

            {offer.distance !== null && (
              <div>
                <h4 className="font-semibold text-muted-foreground flex items-center mb-1">
                  <MapPin className="mr-2 h-4 w-4" />
                  {dictionary?.offerDetailsDialog?.distanceLabel || "Distance"}
                </h4>
                <p className="text-sm text-foreground">
                  {offer.distance.toFixed(1)} km {dictionary.distanceAway || 'away'}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {dictionary?.offerDetailsDialog?.closeButton || "Close"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
