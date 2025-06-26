/**
 * Star Wars Galaxies Resource Class Mapping
 *
 * Maps cryptic resource class codes (like "stl", "rad") to human-readable names.
 * This provides better UX when displaying schematics and resource information.
 *
 * HIERARCHICAL STRUCTURE:
 * This system now supports a hierarchical resource tree structure that reflects
 * the true organization of SWG resources:
 * - Inorganic (metals, gemstones, ores)
 * - Organic (flora, fauna)
 * - Chemical (gases, petrochemicals, radioactives)
 * - Energy (renewable sources)
 *
 * The hierarchical mapping is stored in resource-class-hierarchy.yaml and provides:
 * 1. Parent-child relationships between resource types
 * 2. Path-based navigation (e.g., "inorganic.metal.ferrous.steel")
 * 3. Category-based filtering and searching
 * 4. Better organization for UI components
 *
 * COMPATIBILITY:
 * The legacy flat mapping is maintained for backwards compatibility.
 * New code should use the hierarchical functions where possible.
 */

import { load } from 'js-yaml';
import hierarchyYaml from './resource-class-hierarchy.yaml?raw';

export interface ResourceClassInfo {
	name: string;
	category?: string;
	description?: string;
	path?: string;
}

export interface ResourceTreeNode {
	name: string;
	children?: Record<string, ResourceTreeNode>;
}

export interface ResourceHierarchy {
	[key: string]: ResourceTreeNode;
}

/**
 * Load the hierarchical resource data from YAML
 */
let _cachedHierarchy: ResourceHierarchy | null = null;

function loadHierarchy(): ResourceHierarchy {
	if (_cachedHierarchy) {
		return _cachedHierarchy;
	}

	try {
		if (!hierarchyYaml) {
			console.warn('Resource hierarchy YAML not found, falling back to empty structure');
			return {};
		}

		const parsed = load(hierarchyYaml) as ResourceHierarchy;
		if (!parsed || typeof parsed !== 'object') {
			console.warn('Invalid resource hierarchy data, falling back to empty structure');
			return {};
		}

		_cachedHierarchy = parsed;
		return _cachedHierarchy;
	} catch (error) {
		console.error('Failed to load resource hierarchy:', error);
		// Fallback to empty structure
		return {};
	}
}

/**
 * Recursively search for a resource code in the hierarchy tree
 */
function findResourceInTree(
	node: ResourceTreeNode,
	targetCode: string,
	currentPath: string[] = []
): ResourceClassInfo | null {
	// Check if this node's key in the parent matches our target code
	const currentKey = currentPath[currentPath.length - 1];
	if (currentKey === targetCode) {
		return {
			name: node.name,
			path: currentPath.join('.'),
			category: currentPath[0] || 'Unknown'
		};
	}

	// Search in children
	if (node.children) {
		for (const [childKey, childNode] of Object.entries(node.children)) {
			const result = findResourceInTree(childNode, targetCode, [...currentPath, childKey]);
			if (result) {
				return result;
			}
		}
	}

	return null;
}

/**
 * Get resource info by class code using hierarchical lookup
 */
export function getResourceInfo(classCode: string): ResourceClassInfo | null {
	// First try legacy mapping for backwards compatibility
	if (RESOURCE_CLASS_MAPPING[classCode]) {
		return RESOURCE_CLASS_MAPPING[classCode];
	}

	// Try hierarchical lookup
	const hierarchy = loadHierarchy();

	// Check if hierarchy is valid
	if (!hierarchy || typeof hierarchy !== 'object') {
		return null;
	}

	// Search through all top-level categories
	for (const [categoryKey, categoryNode] of Object.entries(hierarchy)) {
		if (categoryNode && typeof categoryNode === 'object') {
			const result = findResourceInTree(categoryNode, classCode, [categoryKey]);
			if (result) {
				return result;
			}
		}
	}

	return null;
}

/**
 * Get display name for a resource class code
 */
export function getResourceDisplayName(classCode: string): string {
	const info = getResourceInfo(classCode);
	return info?.name || classCode.toUpperCase();
}

/**
 * Find a node in the hierarchy by its path (e.g., "inorganic.metal.ferrous.steel")
 */
function findNodeByPath(hierarchy: ResourceHierarchy, path: string): ResourceTreeNode | null {
	const parts = path.split('.');
	let current: ResourceTreeNode | undefined = hierarchy[parts[0]];

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		if (!current?.children?.[part]) {
			return null;
		}
		current = current.children[part];
	}

	return current || null;
}

/**
 * Get all descendants of a resource node (for filtering purposes)
 */
export function getResourceDescendants(path: string): string[] {
	const hierarchy = loadHierarchy();
	const node = findNodeByPath(hierarchy, path);

	if (!node) {
		return [];
	}

	const descendants: string[] = [];

	function collectDescendants(current: ResourceTreeNode, currentPath: string[]): void {
		if (current.children) {
			for (const [childKey, childNode] of Object.entries(current.children)) {
				const childPath = [...currentPath, childKey];
				descendants.push(childKey);
				collectDescendants(childNode, childPath);
			}
		}
	}

	collectDescendants(node, path.split('.'));
	return descendants;
}

/**
 * Get all resource classes in a category
 */
export function getResourcesByCategory(category: string): ResourceClassInfo[] {
	const hierarchy = loadHierarchy();
	const categoryNode = hierarchy[category];

	if (!categoryNode) {
		return [];
	}

	const resources: ResourceClassInfo[] = [];

	function collectResources(node: ResourceTreeNode, currentPath: string[]): void {
		// If this is a leaf node (no children), it's a resource class
		if (!node.children || Object.keys(node.children).length === 0) {
			const code = currentPath[currentPath.length - 1];
			resources.push({
				name: node.name,
				path: currentPath.join('.'),
				category: currentPath[0]
			});
		} else {
			// Traverse children
			for (const [childKey, childNode] of Object.entries(node.children)) {
				collectResources(childNode, [...currentPath, childKey]);
			}
		}
	}

	collectResources(categoryNode, [category]);
	return resources;
}

/**
 * Build a resource tree for UI components
 */
export function buildResourceTree(): Record<string, any> {
	const hierarchy = loadHierarchy();
	const tree: Record<string, any> = {};

	for (const [categoryKey, categoryNode] of Object.entries(hierarchy)) {
		tree[categoryKey] = {
			name: categoryNode.name,
			children: buildTreeRecursive(categoryNode.children || {}, [categoryKey])
		};
	}

	return tree;
}

function buildTreeRecursive(
	children: Record<string, ResourceTreeNode>,
	path: string[]
): Record<string, any> {
	const result: Record<string, any> = {};

	for (const [childKey, childNode] of Object.entries(children)) {
		result[childKey] = {
			name: childNode.name,
			path: [...path, childKey].join('.'),
			children: childNode.children
				? buildTreeRecursive(childNode.children, [...path, childKey])
				: undefined
		};
	}

	return result;
}

/**
 * Search for resources by name or description
 */
export function searchResources(query: string): Array<{ code: string; info: ResourceClassInfo }> {
	const results: Array<{ code: string; info: ResourceClassInfo }> = [];
	const queryLower = query.toLowerCase();

	// Search through legacy flat mapping
	for (const [code, info] of Object.entries(RESOURCE_CLASS_MAPPING)) {
		if (
			info.name.toLowerCase().includes(queryLower) ||
			info.description?.toLowerCase().includes(queryLower) ||
			code.toLowerCase().includes(queryLower)
		) {
			results.push({ code, info });
		}
	}

	return results;
}

/**
 * Get the full hierarchy tree for display purposes
 */
export function getResourceHierarchy(): ResourceHierarchy {
	return loadHierarchy();
}

// Core mapping - these are the most commonly encountered resource class codes
// Based on schematics data and SWGAide resource information
export const RESOURCE_CLASS_MAPPING: Record<string, ResourceClassInfo> = {
	// Metal Resources
	stl: {
		name: 'Steel',
		category: 'Metal',
		description: 'High-grade metal alloy used in shipbuilding and weapons'
	},
	alu: {
		name: 'Aluminum',
		category: 'Metal',
		description: 'Lightweight metal for various ship components'
	},
	mtl: {
		name: 'Non-Ferrous Metal',
		category: 'Metal',
		description: 'General non-ferrous metals'
	},
	fer: {
		name: 'Ferrous Metal',
		category: 'Metal',
		description: 'Iron-based metals and alloys'
	},
	cop: {
		name: 'Copper',
		category: 'Metal',
		description: 'Conductive metal for electronic components'
	},
	irn: {
		name: 'Iron',
		category: 'Metal',
		description: 'Basic iron ore and refined iron'
	},

	// Chemical Resources
	chm: {
		name: 'Chemical',
		category: 'Chemical',
		description: 'Chemical compounds and reactive substances'
	},
	rad: {
		name: 'Radioactive',
		category: 'Chemical',
		description: 'Radioactive materials for energy systems'
	},
	ptf: {
		name: 'Petro Fuel',
		category: 'Chemical',
		description: 'Petroleum-based fuels'
	},

	// Gemstone Resources
	cry: {
		name: 'Crystalline Gemstone',
		category: 'Gemstone',
		description: 'Crystalline gemstones with precise structure'
	},
	amo: {
		name: 'Amorphous Gemstone',
		category: 'Gemstone',
		description: 'Non-crystalline gemstones'
	},

	// Ore Resources
	int: {
		name: 'Intrusive Ore',
		category: 'Ore',
		description: 'Ore formed deep underground'
	},
	ext: {
		name: 'Extrusive Ore',
		category: 'Ore',
		description: 'Ore formed from surface cooling'
	},
	car: {
		name: 'Carbonate Ore',
		category: 'Ore',
		description: 'Calcium carbonate based ores'
	},
	sil: {
		name: 'Siliclastic Ore',
		category: 'Ore',
		description: 'Silicate-based ores'
	},

	// Wood Resources
	dec: {
		name: 'Deciduous Wood',
		category: 'Wood',
		description: 'Wood from trees that shed leaves'
	},
	con: {
		name: 'Conifer Wood',
		category: 'Wood',
		description: 'Wood from cone-bearing trees'
	},
	eve: {
		name: 'Evergreen Wood',
		category: 'Wood',
		description: 'Wood from evergreen trees'
	},

	// Vegetable Resources
	fun: {
		name: 'Vegetable Fungus',
		category: 'Vegetable',
		description: 'Edible mushrooms and fungi'
	},
	bea: {
		name: 'Vegetable Beans',
		category: 'Vegetable',
		description: 'Legumes and bean varieties'
	},
	tub: {
		name: 'Vegetable Tubers',
		category: 'Vegetable',
		description: 'Root vegetables and tubers'
	},
	gre: {
		name: 'Vegetable Greens',
		category: 'Vegetable',
		description: 'Leafy green vegetables'
	},

	// Fruit Resources
	ber: {
		name: 'Berry Fruit',
		category: 'Fruit',
		description: 'Small, soft fruits'
	},
	flo: {
		name: 'Flower Fruit',
		category: 'Fruit',
		description: 'Fruits from flowering plants'
	},

	// Grain Resources
	whe: {
		name: 'Wheat',
		category: 'Grain',
		description: 'Wheat grains'
	},
	oat: {
		name: 'Oats',
		category: 'Grain',
		description: 'Oat grains'
	},
	ric: {
		name: 'Rice',
		category: 'Grain',
		description: 'Rice grains'
	},
	cor: {
		name: 'Corn',
		category: 'Grain',
		description: 'Corn kernels'
	},

	// Animal Products
	mil: {
		name: 'Milk',
		category: 'Animal Product',
		description: 'Animal milk'
	},
	egg: {
		name: 'Egg',
		category: 'Animal Product',
		description: 'Animal eggs'
	},

	// Hide Resources
	sch: {
		name: 'Scaley Hide',
		category: 'Hide',
		description: 'Hide from scaled animals'
	},
	leh: {
		name: 'Leathery Hide',
		category: 'Hide',
		description: 'Tough, leather-like hide'
	},
	woh: {
		name: 'Wooly Hide',
		category: 'Hide',
		description: 'Woolly animal pelts'
	},
	brh: {
		name: 'Bristley Hide',
		category: 'Hide',
		description: 'Hide with coarse bristles'
	},

	// Bone Resources
	anb: {
		name: 'Animal Bones',
		category: 'Bone',
		description: 'General animal bone material'
	},
	avb: {
		name: 'Avian Bones',
		category: 'Bone',
		description: 'Bird bone material'
	},

	// Meat Resources
	wme: {
		name: 'Wild Meat',
		category: 'Meat',
		description: 'Meat from wild animals'
	},
	dme: {
		name: 'Domesticated Meat',
		category: 'Meat',
		description: 'Meat from domesticated animals'
	},
	hme: {
		name: 'Herbivore Meat',
		category: 'Meat',
		description: 'Meat from plant-eating animals'
	},
	cme: {
		name: 'Carnivore Meat',
		category: 'Meat',
		description: 'Meat from meat-eating animals'
	},
	rme: {
		name: 'Reptilian Meat',
		category: 'Meat',
		description: 'Meat from reptiles'
	},
	ame: {
		name: 'Avian Meat',
		category: 'Meat',
		description: 'Meat from birds'
	},
	ime: {
		name: 'Insect Meat',
		category: 'Meat',
		description: 'Meat from insects'
	},
	fme: {
		name: 'Fish Meat',
		category: 'Meat',
		description: 'Meat from fish'
	},

	// Gas Resources
	ine: {
		name: 'Inert Gas',
		category: 'Gas',
		description: 'Non-reactive gases'
	},
	rea: {
		name: 'Reactive Gas',
		category: 'Gas',
		description: 'Chemically reactive gases'
	},
	wva: {
		name: 'Water Vapor',
		category: 'Gas',
		description: 'Vaporized water'
	},

	// Other Chemical Resources
	lub: {
		name: 'Lubricating Oil',
		category: 'Chemical',
		description: 'Oils for lubrication'
	},
	pol: {
		name: 'Polymer',
		category: 'Chemical',
		description: 'Synthetic polymer materials'
	},
	fib: {
		name: 'Fiberplast',
		category: 'Chemical',
		description: 'Synthetic fiber materials'
	},

	// Radioactive Classifications
	rd1: {
		name: 'Class 1 Radioactive',
		category: 'Chemical',
		description: 'Low-level radioactive materials'
	},
	rd2: {
		name: 'Class 2 Radioactive',
		category: 'Chemical',
		description: 'Medium-level radioactive materials'
	},
	rd3: {
		name: 'Class 3 Radioactive',
		category: 'Chemical',
		description: 'High-level radioactive materials'
	},
	rd4: {
		name: 'Class 4 Radioactive',
		category: 'Chemical',
		description: 'Very high-level radioactive materials'
	},
	rd5: {
		name: 'Class 5 Radioactive',
		category: 'Chemical',
		description: 'Extremely high-level radioactive materials'
	},
	rd6: {
		name: 'Class 6 Radioactive',
		category: 'Chemical',
		description: 'Ultra high-level radioactive materials'
	},
	rd7: {
		name: 'Class 7 Radioactive',
		category: 'Chemical',
		description: 'Maximum level radioactive materials'
	},

	// Energy Resources
	geo: {
		name: 'Geothermal Renewable Energy',
		category: 'Energy',
		description: 'Energy from planetary thermal sources'
	},

	// Additional mappings found in database queries
	// These were discovered through actual schematic data analysis
	blk: { name: 'Bulk', category: 'Material' },
	cab: { name: 'Cable', category: 'Component' },
	cap: { name: 'Capacitor', category: 'Electronic' },
	cir: { name: 'Circuit', category: 'Electronic' },
	cnd: { name: 'Conductor', category: 'Electronic' },
	ctl: { name: 'Control', category: 'Component' },
	drv: { name: 'Drive', category: 'Component' },
	eng: { name: 'Engine', category: 'Mechanical' },
	fld: { name: 'Field', category: 'Energy' },
	flt: { name: 'Filter', category: 'Component' },
	gen: { name: 'Generator', category: 'Mechanical' },
	hsg: { name: 'Housing', category: 'Structural' },
	hyp: { name: 'Hyperdrive', category: 'Propulsion' },
	mod: { name: 'Module', category: 'Component' },
	mtr: { name: 'Motor', category: 'Mechanical' },
	pow: { name: 'Power', category: 'Energy' },
	prc: { name: 'Processor', category: 'Electronic' },
	reg: { name: 'Regulator', category: 'Electronic' },
	sen: { name: 'Sensor', category: 'Electronic' },
	shd: { name: 'Shield', category: 'Defensive' },
	stb: { name: 'Stabilizer', category: 'Component' },
	sys: { name: 'System', category: 'Component' },
	tar: { name: 'Targeting', category: 'Weapon' },
	thm: { name: 'Thermal', category: 'Energy' },
	wea: { name: 'Weapon', category: 'Weapon' }
};

/**
 * Get human-readable information for a resource class code
 */
export function getResourceClassInfo(code: string): ResourceClassInfo {
	const mapping = RESOURCE_CLASS_MAPPING[code.toLowerCase()];

	if (mapping) {
		return mapping;
	}

	// Try hierarchical lookup
	const hierarchyInfo = getResourceInfo(code);
	if (hierarchyInfo) {
		return hierarchyInfo;
	}

	// Fallback: return the code itself with capitalization
	return {
		name: code.toUpperCase(),
		category: 'Unknown',
		description: `Unknown resource class: ${code}`
	};
}

/**
 * Get a user-friendly display name for a resource class code
 */
export function getResourceClassName(code: string): string {
	return getResourceClassInfo(code).name;
}

/**
 * Get the category for a resource class code
 */
export function getResourceClassCategory(code: string): string {
	return getResourceClassInfo(code).category || 'Unknown';
}

/**
 * Format a list of resource class codes into a comma-separated string of names
 */
export function formatResourceClasses(codes: string[]): string {
	return codes.map((code) => getResourceDisplayName(code)).join(', ');
}
