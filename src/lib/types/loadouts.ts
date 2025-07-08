/**
 * Types for schematic resource loadouts
 * These are used by both frontend and backend
 */

export interface SchematicResourceLoadout {
	id: number;
	schematic_id: string;
	loadout_name: string;
	resource_slot_name: string; // The name of the required resource from the schematic
	assigned_resource_id: number | null; // ID of the assigned concrete resource
	assigned_resource_name: string | null; // Name of the assigned resource (cached)
	created_at: string;
	updated_at: string;
}

export interface SchematicLoadoutSummary {
	schematic_id: string;
	loadout_name: string;
	total_slots: number;
	assigned_slots: number;
	experimentation_property: string | null;
	created_at: string;
	updated_at: string;
}
