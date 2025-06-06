
'use client';

import type { ProductCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Dictionary } from '@/lib/get-dictionary';

interface CategoryFilterProps {
  categories: ProductCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  allCategoriesText: string;
  categoryNames: Dictionary['productCategoryNames']; // Prop para os nomes traduzidos
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  allCategoriesText,
  categoryNames,
}: CategoryFilterProps) {
  return (
    <div className="mb-8">
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex space-x-3 pb-3">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => onSelectCategory(null)}
            className="rounded-full px-4 py-2 shadow-sm"
          >
            {allCategoriesText}
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => onSelectCategory(category.id)}
              className="rounded-full px-4 py-2 shadow-sm"
            >
              {category.icon && <category.icon className="mr-2 h-5 w-5" />}
              {categoryNames[category.id as keyof typeof categoryNames] || category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

    