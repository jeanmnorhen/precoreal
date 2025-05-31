
export interface ProductCategory {
  id: string;
  name: string;
  icon?: React.ElementType; // For Lucide icons
}

export interface Offer {
  id: string;
  productName: string;
  productImage: string; // URL
  price: number;
  storeId: string; 
  storeName: string; 
  distance: number; // in miles or km
  category: string; // Category name or ID
  description?: string;
  dataAiHint?: string;
}

export interface Store {
  id: string; // Firebase key for the store
  ownerId: string; // Firebase Auth User UID of the store owner
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  category: string; // Type of store (e.g., "Restaurant", "Retail")
  description?: string;
  latitude?: number; 
  longitude?: number;
}

export interface ListedProduct {
  id: string; // Firebase key for the advertisement
  storeId: string; // ID of the Store document in Firebase
  name: string;
  description: string;
  price: number;
  category: string; // Category name of the product
  imageUrl?: string;
  stock?: number; // Optional stock quantity
  createdAt: number; // Timestamp of when the ad was created
  validUntil: number; // Timestamp of when the ad expires
  dataAiHint?: string; // Optional, for image search services if image URL is a placeholder
}
