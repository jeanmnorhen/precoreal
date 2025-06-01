
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
  distance: number | null; // in km, can be null if not calculable
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
  category: string; // Category name of the product (e.g. "Electronics", "Clothing")
  imageUrl?: string;
  stock?: number; // Optional stock quantity
  createdAt: number; // Timestamp of when the ad was created
  validUntil: number; // Timestamp of when the ad expires
  archived?: boolean; // Flag to mark if the ad has been processed for history
  dataAiHint?: string; // Optional, for image search services if image URL is a placeholder
}

export interface PriceHistoryEntry {
  id: string; // Firebase key for the history entry
  advertisementId: string; // Original advertisement ID
  productId: string; // Could be the canonical product ID in the future, for now product name
  productName: string;
  price: number;
  storeId: string;
  storeName: string;
  archivedAt: number; // Timestamp when this entry was created
  originalValidUntil: number;
  category: string;
}

export interface CanonicalProduct {
  id: string; // Firebase key
  name: string; // Unique product name, e.g., "iPhone 15 Pro". This should be the English name.
  normalizedName?: string; // Lowercase, trimmed name for querying
  category: string; // Category ID, e.g., "electronics". Matches ProductCategory.id
  description?: string; // Detailed description (potentially multi-lingual in future or AI generated)
  defaultImageUrl?: string; // URL to a representative, high-quality image
  // Future fields: brand, averagePrice, attributes (Map<string, string>), etc.
}

export interface SuggestedNewProduct {
  id: string; // Firebase key
  productName: string; // Name identified (from image analysis) or searched by user
  normalizedName?: string; // Lowercase, trimmed name for querying
  source: 'image-analysis' | 'search-bar'; // Origin of the suggestion
  timestamp: number; // When the suggestion was made
  status: 'pending' | 'reviewed' | 'added-to-catalog' | 'rejected'; // For administrative review
  userId?: string; // Optional: UID of the user who triggered the suggestion
  lang?: string; // Optional: Language of the app when suggestion was made
  // Optional: notes from admin, etc.
}

export interface PreferredLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface UserSettings {
  id: string; // Corresponds to Firebase Auth User UID
  preferredLocation?: PreferredLocation;
  // Other future preferences can be added here
  // e.g., preferredCategories: string[];
  // e.g., notificationSettings: { ... };
}
