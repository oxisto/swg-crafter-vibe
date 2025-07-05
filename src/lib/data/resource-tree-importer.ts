/**
 * Resource Tree XML Parser and Database Importer
 *
 * This module handles parsing the canonical resourcetree2.xml file and
 * importing the comprehensive resource data into the database.
 */

import { XMLParser } from 'fast-xml-parser';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { getDatabase } from './database.js';
import { createLogger } from '../logger.js';

const logger = createLogger({ component: 'resource-tree' });

export interface ResourceClassDBRecord {
	id: number;
	swgcraft_id: string;
	swgID: number;
	name: string;
	parent_id: string | null;
	depth: number;
	// Resource stat ranges
	oq_min?: number;
	oq_max?: number;
	pe_min?: number;
	pe_max?: number;
	dr_min?: number;
	dr_max?: number;
	fl_min?: number;
	fl_max?: number;
	hr_min?: number;
	hr_max?: number;
	ma_min?: number;
	ma_max?: number;
	cd_min?: number;
	cd_max?: number;
	cr_min?: number;
	cr_max?: number;
	sh_min?: number;
	sh_max?: number;
	ut_min?: number;
	ut_max?: number;
	sr_min?: number;
	sr_max?: number;
	// Flags
	recycled: boolean;
	harvested: boolean;
	// Metadata
	created_at: string;
	updated_at: string;
}

interface ResourceTreeAttributes {
	swgcraft_id: string;
	swgID: number;
	description: string;

	// Resource stat ranges
	oq_min?: number;
	oq_max?: number;
	pe_min?: number;
	pe_max?: number;
	dr_min?: number;
	dr_max?: number;
	fl_min?: number;
	fl_max?: number;
	hr_min?: number;
	hr_max?: number;
	ma_min?: number;
	ma_max?: number;
	cd_min?: number;
	cd_max?: number;
	cr_min?: number;
	cr_max?: number;
	sh_min?: number;
	sh_max?: number;
	ut_min?: number;
	ut_max?: number;
	sr_min?: number;
	sr_max?: number;

	// Flags
	recycled?: string;
	harvested?: string;
}

interface ResourceTypeNode {
	'@_swgcraft_id': string;
	'@_swgID': string;
	'@_description': string;
	'@_oq_min'?: string;
	'@_oq_max'?: string;
	'@_pe_min'?: string;
	'@_pe_max'?: string;
	'@_dr_min'?: string;
	'@_dr_max'?: string;
	'@_fl_min'?: string;
	'@_fl_max'?: string;
	'@_hr_min'?: string;
	'@_hr_max'?: string;
	'@_ma_min'?: string;
	'@_ma_max'?: string;
	'@_cd_min'?: string;
	'@_cd_max'?: string;
	'@_cr_min'?: string;
	'@_cr_max'?: string;
	'@_sh_min'?: string;
	'@_sh_max'?: string;
	'@_ut_min'?: string;
	'@_ut_max'?: string;
	'@_sr_min'?: string;
	'@_sr_max'?: string;
	'@_recycled'?: string;
	'@_harvested'?: string;
	resource_type?: ResourceTypeNode | ResourceTypeNode[];
}

const XML_FILE_PATH = join(process.cwd(), 'src/lib/data/resourcetree2-resto3.xml');

/**
 * Check if the XML file has been modified since last import
 */
export function shouldUpdateResourceTree(): boolean {
	try {
		const db = getDatabase();
		const xmlStats = statSync(XML_FILE_PATH);

		const result = db
			.prepare('SELECT value FROM resource_tree_metadata WHERE key = ?')
			.get('last_modified') as { value: string } | undefined;

		if (!result) {
			return true; // Never imported
		}

		const lastModified = new Date(result.value);
		return xmlStats.mtime > lastModified;
	} catch (error) {
		logger.warn('Error checking resource tree update status:', { error: String(error) });
		return true; // Import on error to be safe
	}
}

/**
 * Parse and import the resource tree XML into the database
 */
export async function importResourceTree(): Promise<void> {
	try {
		logger.info('Starting resource tree import...');

		const xmlContent = readFileSync(XML_FILE_PATH, 'utf8');
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '@_',
			parseAttributeValue: true
		});

		const result = parser.parse(xmlContent);
		const resourceTreeData = result.resource_tree_data;

		if (!resourceTreeData || !resourceTreeData.resource_type) {
			throw new Error('Invalid XML structure: missing resource_type data');
		}

		const db = getDatabase();

		// Start transaction for atomic import
		const transaction = db.transaction(() => {
			// Clear existing data
			db.prepare('DELETE FROM resource_classes').run();

			// Import the tree recursively
			const rootNodes = Array.isArray(resourceTreeData.resource_type)
				? resourceTreeData.resource_type
				: [resourceTreeData.resource_type];

			let importCount = 0;
			for (const rootNode of rootNodes) {
				importCount += importResourceNode(rootNode, null, 0);
			}

			// Update metadata
			const xmlStats = statSync(XML_FILE_PATH);
			db.prepare('INSERT OR REPLACE INTO resource_tree_metadata (key, value) VALUES (?, ?)').run(
				'last_modified',
				xmlStats.mtime.toISOString()
			);
			db.prepare('INSERT OR REPLACE INTO resource_tree_metadata (key, value) VALUES (?, ?)').run(
				'import_count',
				importCount.toString()
			);

			logger.info(`Successfully imported ${importCount} resource classes`);
		});

		transaction();
	} catch (error) {
		logger.error('Error importing resource tree:', { error: String(error) });
		throw error;
	}
}

/**
 * Recursively import a resource node and its children
 */
function importResourceNode(
	node: ResourceTypeNode,
	parentId: string | null,
	depth: number
): number {
	const db = getDatabase();

	// Extract attributes with proper type conversion
	const attrs = extractNodeAttributes(node);

	// Insert this node
	const stmt = db.prepare(`
		INSERT INTO resource_classes (
			swgcraft_id, swgID, name, parent_id, depth,
			oq_min, oq_max, pe_min, pe_max, dr_min, dr_max,
			fl_min, fl_max, hr_min, hr_max, ma_min, ma_max,
			cd_min, cd_max, cr_min, cr_max, sh_min, sh_max,
			ut_min, ut_max, sr_min, sr_max,
			recycled, harvested
		) VALUES (
			?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?,
			?, ?, ?, ?,
			?, ?
		)
	`);

	// Prepare values with proper null handling
	const values = [
		attrs.swgcraft_id,
		attrs.swgID,
		attrs.description,
		parentId,
		depth,
		attrs.oq_min ?? null,
		attrs.oq_max ?? null,
		attrs.pe_min ?? null,
		attrs.pe_max ?? null,
		attrs.dr_min ?? null,
		attrs.dr_max ?? null,
		attrs.fl_min ?? null,
		attrs.fl_max ?? null,
		attrs.hr_min ?? null,
		attrs.hr_max ?? null,
		attrs.ma_min ?? null,
		attrs.ma_max ?? null,
		attrs.cd_min ?? null,
		attrs.cd_max ?? null,
		attrs.cr_min ?? null,
		attrs.cr_max ?? null,
		attrs.sh_min ?? null,
		attrs.sh_max ?? null,
		attrs.ut_min ?? null,
		attrs.ut_max ?? null,
		attrs.sr_min ?? null,
		attrs.sr_max ?? null,
		attrs.recycled === 'yes' ? 1 : 0,
		attrs.harvested !== 'no' ? 1 : 0 // Default to true unless explicitly "no"
	];

	try {
		stmt.run(...values);
	} catch (error) {
		console.error('Error inserting resource:', attrs.swgcraft_id, error);
		console.error('Values:', values);
		throw error;
	}

	let count = 1;

	// Process children if any
	if (node.resource_type) {
		const children = Array.isArray(node.resource_type) ? node.resource_type : [node.resource_type];

		for (const child of children) {
			count += importResourceNode(child, attrs.swgcraft_id, depth + 1);
		}
	}

	return count;
}

/**
 * Extract and convert node attributes to proper types
 */
function extractNodeAttributes(node: ResourceTypeNode): ResourceTreeAttributes {
	const parseIntOrUndefined = (value: string | undefined): number | undefined =>
		value !== undefined ? parseInt(value, 10) : undefined;

	return {
		swgcraft_id: node['@_swgcraft_id'],
		swgID: parseInt(node['@_swgID'], 10),
		description: node['@_description'],

		// Resource stats
		oq_min: parseIntOrUndefined(node['@_oq_min']),
		oq_max: parseIntOrUndefined(node['@_oq_max']),
		pe_min: parseIntOrUndefined(node['@_pe_min']),
		pe_max: parseIntOrUndefined(node['@_pe_max']),
		dr_min: parseIntOrUndefined(node['@_dr_min']),
		dr_max: parseIntOrUndefined(node['@_dr_max']),
		fl_min: parseIntOrUndefined(node['@_fl_min']),
		fl_max: parseIntOrUndefined(node['@_fl_max']),
		hr_min: parseIntOrUndefined(node['@_hr_min']),
		hr_max: parseIntOrUndefined(node['@_hr_max']),
		ma_min: parseIntOrUndefined(node['@_ma_min']),
		ma_max: parseIntOrUndefined(node['@_ma_max']),
		cd_min: parseIntOrUndefined(node['@_cd_min']),
		cd_max: parseIntOrUndefined(node['@_cd_max']),
		cr_min: parseIntOrUndefined(node['@_cr_min']),
		cr_max: parseIntOrUndefined(node['@_cr_max']),
		sh_min: parseIntOrUndefined(node['@_sh_min']),
		sh_max: parseIntOrUndefined(node['@_sh_max']),
		ut_min: parseIntOrUndefined(node['@_ut_min']),
		ut_max: parseIntOrUndefined(node['@_ut_max']),
		sr_min: parseIntOrUndefined(node['@_sr_min']),
		sr_max: parseIntOrUndefined(node['@_sr_max']),

		// Flags
		recycled: node['@_recycled'],
		harvested: node['@_harvested']
	};
}

/**
 * Get resource class info from the database
 */
export function getResourceClassFromDB(swgcraftId: string): ResourceClassDBRecord | null {
	const db = getDatabase();
	return (
		(db.prepare('SELECT * FROM resource_classes WHERE swgcraft_id = ?').get(swgcraftId) as
			| ResourceClassDBRecord
			| undefined) || null
	);
}

/**
 * Get all children of a resource class
 */
export function getResourceClassChildren(parentId: string) {
	const db = getDatabase();
	return db
		.prepare('SELECT * FROM resource_classes WHERE parent_id = ? ORDER BY name')
		.all(parentId);
}

/**
 * Get the full path of a resource class (from root to this class)
 */
export function getResourceClassPath(swgcraftId: string): string[] {
	const db = getDatabase();
	const path: string[] = [];

	let currentId: string | null = swgcraftId;
	while (currentId) {
		const resource = db
			.prepare('SELECT swgcraft_id, name, parent_id FROM resource_classes WHERE swgcraft_id = ?')
			.get(currentId) as
			| { swgcraft_id: string; name: string; parent_id: string | null }
			| undefined;

		if (!resource) break;

		path.unshift(resource.name);
		currentId = resource.parent_id;
	}

	return path;
}

/**
 * Search resource classes by name
 */
export function searchResourceClasses(query: string, limit = 50) {
	const db = getDatabase();
	return db
		.prepare(
			`
		SELECT swgcraft_id, name, 
		       CASE WHEN name LIKE ? THEN 1 ELSE 2 END as relevance
		FROM resource_classes 
		WHERE name LIKE ? 
		ORDER BY relevance, name
		LIMIT ?
	`
		)
		.all(`${query}%`, `%${query}%`, limit);
}

/**
 * Get resource tree statistics
 */
export function getResourceTreeStats() {
	const db = getDatabase();

	const totalCount = db.prepare('SELECT COUNT(*) as count FROM resource_classes').get() as {
		count: number;
	};
	const lastImport = db
		.prepare("SELECT value FROM resource_tree_metadata WHERE key = 'last_modified'")
		.get() as { value: string } | undefined;
	const importCount = db
		.prepare("SELECT value FROM resource_tree_metadata WHERE key = 'import_count'")
		.get() as { value: string } | undefined;

	return {
		totalResources: totalCount.count,
		lastImported: lastImport ? new Date(lastImport.value) : null,
		lastImportCount: importCount ? parseInt(importCount.value, 10) : 0
	};
}
