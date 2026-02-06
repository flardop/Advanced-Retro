import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sampleCategories, sampleProducts } from '@/lib/sampleData';

export async function getFeaturedProducts(limit = 8) {
  if (!supabaseAdmin) {
    return sampleProducts.slice(0, limit);
  }
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getProducts() {
  if (!supabaseAdmin) {
    return sampleProducts;
  }
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProductById(id: string) {
  if (!supabaseAdmin) {
    return sampleProducts.find((p) => p.id === id);
  }
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getCategories() {
  if (!supabaseAdmin) {
    return sampleCategories;
  }
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}
