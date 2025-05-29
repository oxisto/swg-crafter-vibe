// Types for the Star Wars Galaxies shipwright inventory system

export type MarkLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

export type PartCategory = 
  | 'Armor'
  | 'Booster'
  | 'Capacitor'
  | 'Droid Interface'
  | 'Engine'
  | 'Reactor'
  | 'Shield'
  | 'Weapon';

export interface InventoryItem {
  category: PartCategory;
  markLevel: MarkLevel;
  quantity: number;
}

export type Inventory = Record<string, number>; // key: `${category}-${markLevel}`

export interface Settings {
  recommendedStockLevel: number;
}

// Schematic types for SWGAide data
export interface Schematic {
  id: string;
  name: string;
  category: string;
  profession: string;
  complexity: number;
  datapad: number;
  ingredients: SchematicIngredient[];
  resources: SchematicResource[];
}

export interface SchematicIngredient {
  name: string;
  amount: number;
  units: string;
}

export interface SchematicResource {
  name: string;
  amount: number;
  units: string;
  classes: string[];
}

export const MARK_LEVELS: MarkLevel[] = ['I', 'II', 'III', 'IV', 'V'];

export const PART_CATEGORIES: PartCategory[] = [
  'Armor',
  'Booster', 
  'Capacitor',
  'Droid Interface',
  'Engine',
  'Reactor',
  'Shield',
  'Weapon'
];

export function getInventoryKey(category: PartCategory, markLevel: MarkLevel): string {
  return `${category}-${markLevel}`;
}
