export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price?: number; // Опциональное поле, так как в новом меню нет цен
  category: string; // Категории на русском языке
  image: string;
  image_format?: string;
  composition?: string | null;
  allergens?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
