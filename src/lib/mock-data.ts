import type { ProductCategory, Offer } from '@/types';
import { Package, Shirt, Laptop, Popcorn, Home, BookOpen } from 'lucide-react';

export const productCategories: ProductCategory[] = [
  { id: 'electronics', name: 'Electronics', icon: Laptop },
  { id: 'clothing', name: 'Clothing', icon: Shirt },
  { id: 'home-kitchen', name: 'Home & Kitchen', icon: Home },
  { id: 'books', name: 'Books', icon: BookOpen },
  { id: 'groceries', name: 'Groceries', icon: Popcorn },
  { id: 'other', name: 'Other', icon: Package },
];

export const mockOffers: Offer[] = [
  {
    id: '1',
    productName: 'Wireless Noise-Cancelling Headphones',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'headphones audio',
    price: 199.99,
    storeName: 'Tech World',
    distance: 0.5,
    category: 'Electronics',
    description: 'High-quality sound with active noise cancellation.'
  },
  {
    id: '2',
    productName: 'Organic Cotton T-Shirt',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'shirt fashion',
    price: 25.00,
    storeName: 'Eco Threads',
    distance: 1.2,
    category: 'Clothing',
    description: 'Comfortable and sustainably sourced t-shirt.'
  },
  {
    id: '3',
    productName: 'Smart Coffee Maker',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'coffee maker',
    price: 79.50,
    storeName: 'Home Goods Central',
    distance: 0.8,
    category: 'Home & Kitchen',
    description: 'Brew your perfect coffee with app control.'
  },
  {
    id: '4',
    productName: 'The Art of Programming Vol. 1',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'book code',
    price: 45.99,
    storeName: 'Readers Nook',
    distance: 2.5,
    category: 'Books',
    description: 'Classic computer science literature.'
  },
  {
    id: '5',
    productName: 'Fresh Avocados (3-pack)',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'avocado food',
    price: 4.99,
    storeName: 'Green Grocer',
    distance: 0.3,
    category: 'Groceries',
    description: 'Ripe and ready-to-eat avocados.'
  },
  {
    id: '6',
    productName: 'Gaming Laptop RTX 4070',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'laptop gaming',
    price: 1299.00,
    storeName: 'Power Up PCs',
    distance: 1.5,
    category: 'Electronics',
    description: 'High-performance gaming laptop for serious gamers.'
  },
  {
    id: '7',
    productName: 'Running Shoes - Men\'s',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'shoes sport',
    price: 89.99,
    storeName: 'Fit Feet',
    distance: 0.9,
    category: 'Clothing',
    description: 'Lightweight and comfortable running shoes.'
  },
  {
    id: '8',
    productName: 'Stainless Steel Cookware Set',
    productImage: 'https://placehold.co/600x400.png',
    dataAiHint: 'cookware kitchen',
    price: 149.00,
    storeName: 'Kitchen Essentials',
    distance: 2.1,
    category: 'Home & Kitchen',
    description: 'Durable 10-piece cookware set.'
  },
];
