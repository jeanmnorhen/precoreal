'use client';

import type { ProductCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface CategoryFilterProps {
  categories: ProductCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-xl font-semibold">Filter by Category</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex space-x-3 pb-3">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => onSelectCategory(null)}
            className="rounded-full px-4 py-2 shadow-sm"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => onSelectCategory(category.id)}
              className="rounded-full px-4 py-2 shadow-sm"
            >
              {category.icon && <category.icon className="mr-2 h-5 w-5" />}
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
