import { DEFAULT_ADMIN_SETTINGS } from '@/lib/admin/constants';
import { supabaseService } from '@/lib/supabase/service';
import type { AdminSettingRecord } from '@/types/admin';

export async function getAdminSettingsMap() {
  if (!supabaseService) return new Map<string, string>(DEFAULT_ADMIN_SETTINGS.map(([key, value]) => [key, value]));
  const { data } = await supabaseService.from('admin_settings').select('*');
  const map = new Map<string, string>(DEFAULT_ADMIN_SETTINGS.map(([key, value]) => [key, value]));
  for (const row of data || []) {
    map.set(String(row.key), String(row.value || ''));
  }
  return map;
}

export async function listAdminSettings(): Promise<AdminSettingRecord[]> {
  if (!supabaseService) return [];
  const { data } = await supabaseService.from('admin_settings').select('*').order('key');
  return (data || []).map((row: any) => ({
    key: String(row.key),
    value: String(row.value || ''),
    description: typeof row.description === 'string' ? row.description : null,
    updated_at: String(row.updated_at || new Date().toISOString()),
  }));
}

export function getSettingValue(settingsMap: Map<string, string>, key: string, fallback = '') {
  return settingsMap.get(key) ?? fallback;
}

export function getBooleanSetting(settingsMap: Map<string, string>, key: string, fallback = false) {
  const value = settingsMap.get(key);
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}
