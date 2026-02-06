export type ProductStatus = 'new' | 'used' | 'special';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: ProductStatus;
  stock: number;
  category_id: string;
  description: string;
  long_description: string;
  curiosities: string[];
  tips: string[];
  images: string[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}
