
import ProductListingForm from '@/components/product-listing-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function StoreProductsPage() {
  // In a real app, you'd check if the user is a logged-in store owner
  // and fetch their storeId.
  const isStoreOwner = true; // Placeholder
  const mockStoreId = "store_123_abc"; // Placeholder for actual store ID

  if (!isStoreOwner) {
    return (
      <div className="animate-fadeIn flex items-center justify-center min-h-[50vh]">
        <Alert variant="destructive" className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be a registered store owner to access this page. Please register or log in.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Here you could also list existing products/advertisements for management */}
      <ProductListingForm storeId={mockStoreId} />
    </div>
  );
}
