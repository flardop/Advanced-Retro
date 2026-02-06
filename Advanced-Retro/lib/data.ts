import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sampleCategories, sampleProducts } from '@/lib/sampleData';

export async function getFeaturedProducts(limit = 8) {
  if (!supabaseAdmin) {
    return sampleProducts.slice(0, limit);
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('Error fetching featured products:', error);
      return sampleProducts.slice(0, limit);
    }
    return data && data.length > 0 ? data : sampleProducts.slice(0, limit);
  } catch (error) {
    console.warn('Exception fetching featured products:', error);
    return sampleProducts.slice(0, limit);
  }
}

export async function getProducts() {
  if (!supabaseAdmin) {
    return sampleProducts;
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching products:', error);
      return sampleProducts;
    }
    return data && data.length > 0 ? data : sampleProducts;
  } catch (error) {
    console.warn('Exception fetching products:', error);
    return sampleProducts;
  }
}

export async function getProductById(id: string) {
  if (!supabaseAdmin) {
    return sampleProducts.find((p) => p.id === id);
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.warn('Error fetching product by id:', error);
      return sampleProducts.find((p) => p.id === id) || null;
    }
    return data;
  } catch (error) {
    console.warn('Exception fetching product by id:', error);
    return sampleProducts.find((p) => p.id === id) || null;
  }
}

export async function getCategories() {
  if (!supabaseAdmin) {
    return sampleCategories;
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');
    if (error) {
      console.warn('Error fetching categories:', error);
      return sampleCategories;
    }
    return data && data.length > 0 ? data : sampleCategories;
  } catch (error) {
    console.warn('Exception fetching categories:', error);
    return sampleCategories;
  }
}
