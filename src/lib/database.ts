import Database from 'better-sqlite3';
import { PART_CATEGORIES, MARK_LEVELS, getInventoryKey, type Inventory } from '$lib/types.js';

const DB_PATH = 'database.sqlite3';

let db: Database.Database;

export function initDatabase() {
  db = new Database(DB_PATH);
  
  // Create inventory table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      mark_level TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, mark_level)
    )
  `);

  // Create settings table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize with default values if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number };
  
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO inventory (category, mark_level, quantity) 
      VALUES (?, ?, 0)
    `);
    
    const insertMany = db.transaction(() => {
      for (const category of PART_CATEGORIES) {
        for (const markLevel of MARK_LEVELS) {
          insert.run(category, markLevel);
        }
      }
    });
    
    insertMany();
  }

  // Initialize default settings if they don't exist
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('recommendedStockLevel', '10');
  }

  return db;
}

export function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

export function getAllInventory(): Inventory {
  const db = getDatabase();
  const rows = db.prepare('SELECT category, mark_level, quantity FROM inventory').all() as Array<{
    category: string;
    mark_level: string;
    quantity: number;
  }>;
  
  const inventory: Inventory = {};
  
  for (const row of rows) {
    const key = getInventoryKey(row.category as any, row.mark_level as any);
    inventory[key] = row.quantity;
  }
  
  return inventory;
}

export function updateInventoryItem(category: string, markLevel: string, quantity: number): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE inventory 
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE category = ? AND mark_level = ?
  `);
  
  stmt.run(quantity, category, markLevel);
}

export function getInventoryItem(category: string, markLevel: string): number {
  const db = getDatabase();
  const stmt = db.prepare('SELECT quantity FROM inventory WHERE category = ? AND mark_level = ?');
  const result = stmt.get(category, markLevel) as { quantity: number } | undefined;
  
  return result?.quantity ?? 0;
}

// Settings functions
export function getSetting(key: string): string | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  
  return result?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(key, value);
}

export function getRecommendedStockLevel(): number {
  const value = getSetting('recommendedStockLevel');
  return value ? parseInt(value, 10) : 10;
}

export function setRecommendedStockLevel(level: number): void {
  setSetting('recommendedStockLevel', level.toString());
}

// Close database connection gracefully
export function closeDatabase() {
  if (db) {
    db.close();
  }
}
