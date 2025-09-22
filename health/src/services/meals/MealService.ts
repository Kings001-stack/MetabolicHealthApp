import DatabaseService from '@/database/DatabaseService';

function genId(): string {
  // Simple unique-ish ID for client-side inserts
  return 'id_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
}

export interface Meal {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  name: string;
  total_calories?: number;
  total_carbs?: number;
  total_protein?: number;
  total_fat?: number;
  created_at?: string;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_name: string;
  brand_name?: string | null;
  serving_qty?: number | null;
  serving_unit?: string | null;
  calories?: number | null;
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
}

export interface HydrationLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  amount_ml: number;
  created_at?: string;
}

function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getHydrationByDate(userId: string, dateKey?: string): Promise<number> {
  const date = dateKey || toDateKey();
  const rows = await DatabaseService.executeQuery<{ amount_ml: number }>(
    'SELECT amount_ml FROM hydration_logs WHERE user_id = ? AND date = ? ORDER BY created_at DESC LIMIT 1',
    [userId, date]
  );
  if (rows && rows.length > 0) return rows[0].amount_ml || 0;
  return 0;
}

export async function saveHydration(userId: string, amountMl: number, dateKey?: string): Promise<void> {
  const date = dateKey || toDateKey();
  // Upsert by inserting a new row with the latest amount_ml; simplest approach
  await DatabaseService.executeUpdate(
    'INSERT INTO hydration_logs (id, user_id, date, amount_ml) VALUES (?, ?, ?, ?)',
    [genId(), userId, date, amountMl]
  );
}

export async function addMeal(meal: Omit<Meal, 'id'>): Promise<string> {
  const id = genId();
  await DatabaseService.executeUpdate(
    `INSERT INTO meals (id, user_id, date, name, total_calories, total_carbs, total_protein, total_fat) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, meal.user_id, meal.date, meal.name, meal.total_calories ?? null, meal.total_carbs ?? null, meal.total_protein ?? null, meal.total_fat ?? null]
  );
  return id;
}

export async function addMealItem(item: Omit<MealItem, 'id'>): Promise<string> {
  const id = genId();
  await DatabaseService.executeUpdate(
    `INSERT INTO meal_items (id, meal_id, food_name, brand_name, serving_qty, serving_unit, calories, carbs, protein, fat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, item.meal_id, item.food_name, item.brand_name ?? null, item.serving_qty ?? null, item.serving_unit ?? null, item.calories ?? null, item.carbs ?? null, item.protein ?? null, item.fat ?? null]
  );
  return id;
}

export async function listMealsByDate(userId: string, dateKey?: string): Promise<Meal[]> {
  const date = dateKey || toDateKey();
  const rows = await DatabaseService.executeQuery<Meal>(
    'SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
    [userId, date]
  );
  return rows;
}

export async function deleteMeal(mealId: string): Promise<void> {
  await DatabaseService.executeTransaction([
    async () => {
      await DatabaseService.executeUpdate('DELETE FROM meal_items WHERE meal_id = ?', [mealId]);
    },
    async () => {
      await DatabaseService.executeUpdate('DELETE FROM meals WHERE id = ?', [mealId]);
    },
  ]);
}

export async function getOrCreateDailyMeal(userId: string, name = 'Today\'s Log', dateKey?: string): Promise<string> {
  const date = dateKey || toDateKey();
  const existing = await DatabaseService.executeQuery<{ id: string }>(
    'SELECT id FROM meals WHERE user_id = ? AND date = ? AND name = ? LIMIT 1',
    [userId, date, name]
  );
  if (existing.length > 0) return existing[0].id;
  const id = await addMeal({ user_id: userId, date, name });
  return id;
}

export interface DailyTotals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export async function getDailyTotals(userId: string, dateKey?: string): Promise<DailyTotals> {
  const date = dateKey || toDateKey();
  const rows = await DatabaseService.executeQuery<{
    calories: number | null;
    carbs: number | null;
    protein: number | null;
    fat: number | null;
  }>(
    `SELECT 
       SUM(mi.calories) as calories,
       SUM(mi.carbs) as carbs,
       SUM(mi.protein) as protein,
       SUM(mi.fat) as fat
     FROM meal_items mi
     JOIN meals m ON mi.meal_id = m.id
     WHERE m.user_id = ? AND m.date = ?`,
    [userId, date]
  );
  const r = rows[0] || { calories: 0, carbs: 0, protein: 0, fat: 0 };
  return {
    calories: Number(r.calories || 0),
    carbs: Number(r.carbs || 0),
    protein: Number(r.protein || 0),
    fat: Number(r.fat || 0),
  };
}

export default {
  toDateKey,
  getHydrationByDate,
  saveHydration,
  addMeal,
  addMealItem,
  listMealsByDate,
  deleteMeal,
  getOrCreateDailyMeal,
  getDailyTotals,
};
