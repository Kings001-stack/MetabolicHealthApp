import DatabaseService from '@/database/DatabaseService';

// Minimal nutrition API service for USDA FoodData Central (FDC)
// Reads API key from environment (process.env.FDC_API_KEY) or from app_settings table
// Provides helper to persist the key to app_settings for runtime configuration

export interface NutritionSearchItem {
  fdcId: string;
  description: string;
  brandOwner?: string;
  dataType?: string;
}

export interface NutritionFoodDetails {
  fdcId: string;
  description: string;
  brandOwner?: string;
  labelNutrients?: {
    calories?: { value: number };
    protein?: { value: number };
    fat?: { value: number };
    carbohydrates?: { value: number };
  };
}

const APP_SETTING_KEY = 'FDC_API_KEY';

async function getApiKey(): Promise<string | null> {
  // Try environment variable first (if wired via react-native-config or Metro constants)
  // @ts-ignore
  const envKey: string | undefined = (typeof process !== 'undefined' && process?.env?.FDC_API_KEY) || undefined;
  if (envKey) return envKey;

  // Fallback to app_settings table
  try {
    const rows = await DatabaseService.executeQuery<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ? LIMIT 1',
      [APP_SETTING_KEY]
    );
    if (rows && rows.length > 0) return rows[0].value;
  } catch (e) {
    // ignore and return null
  }
  return null;
}

export async function setApiKey(key: string): Promise<void> {
  await DatabaseService.executeUpdate(
    'INSERT OR REPLACE INTO app_settings (key, value, updated_at, created_at) VALUES (?, ?, CURRENT_TIMESTAMP, COALESCE((SELECT created_at FROM app_settings WHERE key = ?), CURRENT_TIMESTAMP))',
    [APP_SETTING_KEY, key, APP_SETTING_KEY]
  );
}

export async function searchFoods(query: string): Promise<NutritionSearchItem[]> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('FDC API key is not set. Please add FDC_API_KEY to your .env or set it in app settings.');

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&pageSize=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Food search failed: ${res.status}`);
  const data = await res.json();
  const items: NutritionSearchItem[] = (data?.foods || []).map((f: any) => ({
    fdcId: String(f.fdcId),
    description: f.description,
    brandOwner: f.brandOwner,
    dataType: f.dataType,
  }));
  return items;
}

export async function getFoodDetails(fdcId: string): Promise<NutritionFoodDetails> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('FDC API key is not set. Please add FDC_API_KEY to your .env or set it in app settings.');

  const url = `https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(fdcId)}?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Food details failed: ${res.status}`);
  const f = await res.json();

  const details: NutritionFoodDetails = {
    fdcId: String(f.fdcId),
    description: f.description,
    brandOwner: f.brandOwner,
    labelNutrients: f.labelNutrients,
  };
  return details;
}

export default {
  searchFoods,
  getFoodDetails,
  setApiKey,
};
