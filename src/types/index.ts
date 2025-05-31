
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
  storeName: string;
  distance: number; // in miles or km
  category: string; // Category name or ID
  description?: string;
  dataAiHint?: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  category: string; // Type of store
  description?: string;
}

export interface ListedProduct {
  id: string; // Firebase key
  storeId: string;
  name: string;
  description: string;
  price: number;
  category: string; // Category name
  imageUrl?: string;
  stock?: number;
  createdAt: number; // Timestamp
  validUntil: number; // Timestamp
  dataAiHint?: string; // Optional, not in form yet
}
