import Image from 'next/image';
import type { Offer } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';

interface OfferCardProps {
  offer: Offer;
}

export default function OfferCard({ offer }: OfferCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={offer.productImage}
            alt={offer.productName}
            layout="fill"
            objectFit="cover"
            data-ai-hint={offer.dataAiHint || 'product image'}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col p-4">
        <Badge variant="secondary" className="mb-2 w-fit bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">{offer.category}</Badge>
        <CardTitle className="mb-1 text-lg font-semibold">{offer.productName}</CardTitle>
        {offer.description && <CardDescription className="mb-2 text-sm text-muted-foreground line-clamp-2">{offer.description}</CardDescription>}
        <div className="mt-auto">
          <p className="text-2xl font-bold text-primary">${offer.price.toFixed(2)}</p>
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            <span>{offer.storeName}</span>
          </div>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1.5 h-4 w-4" />
            <span>{offer.distance.toFixed(1)} miles away</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          View Deal
        </Button>
      </CardFooter>
    </Card>
  );
}
