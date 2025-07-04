/**
 * SOAP API Integration Module
 *
 * Handles SWGAide SOAP API integration for detailed resource information.
 * Provides functions to fetch resource data via SOAP calls and update local database.
 */

import { getDatabase, dbLogger } from './database.js';
import { getResourceById } from './resources.js';
import { XMLParser } from 'fast-xml-parser';

// SOAP API Configuration
const SOAP_SERVER_URL = 'https://swgaide.com/soap/server.php';
const SOAP_UPDATE_INTERVAL_HOURS = 1; // Update SOAP data every hour
const DEFAULT_SERVER_ID = 162; // SWG Restoration III

/**
 * Resource class information from database lookup
 */
interface ResourceClassLookup {
	swgcraft_id: string;
	name: string;
	parent_id: string | null;
}

/**
 * Look up resource class information by SOAP class ID (swgID)
 * @param soapClassId - The SOAP class ID (Class field from SOAP response)
 * @returns Resource class info or null if not found
 */
function getResourceClassBySoapId(soapClassId: number): ResourceClassLookup | null {
	try {
		const db = getDatabase();
		const result = db
			.prepare('SELECT swgcraft_id, name, parent_id FROM resource_classes WHERE swgID = ?')
			.get(soapClassId) as ResourceClassLookup | undefined;
		return result || null;
	} catch (error) {
		dbLogger.warn(`Failed to lookup resource class for SOAP class ID ${soapClassId}:`, {
			error: error as Error
		});
		return null;
	}
}

/**
 * Get the full class path for a resource class
 * @param swgcraftId - The SWGCraft ID for the resource class
 * @returns Array of class names from root to leaf
 */
function getResourceClassPath(swgcraftId: string): string[] {
	try {
		const db = getDatabase();
		const path: string[] = [];
		let currentId = swgcraftId;

		while (currentId) {
			const record = db
				.prepare('SELECT name, parent_id FROM resource_classes WHERE swgcraft_id = ?')
				.get(currentId) as { name: string; parent_id: string | null } | undefined;

			if (!record) break;

			path.unshift(record.name);
			currentId = record.parent_id || '';
		}

		return path;
	} catch (error) {
		dbLogger.warn(`Failed to get class path for ${swgcraftId}:`, { error: error as Error });
		return [];
	}
}

/**
 * SOAP API ResourceInfo type based on WSDL definition
 */
export interface SOAPResourceInfo {
	ID: number;
	Name: string;
	Class: number;
	ServerID: number;
	AddedStamp: number;
	AddedBy: number;
	// Resource stats
	ER: number; // Energy Resistance
	CR: number; // Cold Resistance
	CD: number; // Conductivity
	DR: number; // Decay Resistance
	FL: number; // Flavor
	HR: number; // Heat Resistance
	MA: number; // Malleability
	PE: number; // Potential Energy
	OQ: number; // Overall Quality
	SR: number; // Shock Resistance
	UT: number; // Unit Toughness
}

/**
 * Check if a resource needs SOAP update based on last update time
 * @param lastUpdated - The last SOAP update timestamp
 * @returns True if resource needs update (>1 hour since last update or never updated)
 */
function needsSOAPUpdate(lastUpdated: string | null): boolean {
	if (!lastUpdated) return true;

	const lastUpdateTime = new Date(lastUpdated);
	const now = new Date();
	const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);

	return hoursSinceUpdate >= SOAP_UPDATE_INTERVAL_HOURS;
}

/**
 * Update resource with SOAP data in the database
 * @param resourceId - The resource ID
 * @param soapData - The SOAP resource information
 */
/**
 * Update an existing resource with SOAP data
 * @param resourceId - The local database ID of the resource
 * @param soapData - The SOAP resource information
 */
function updateResourceWithSOAPData(resourceId: number, soapData: SOAPResourceInfo): void {
	const db = getDatabase();

	// Validate SOAP data - check if we have basic resource information
	const hasBasicInfo = soapData.ID > 0 && soapData.Name && soapData.Name.trim().length > 0;

	if (!hasBasicInfo) {
		dbLogger.debug(`Invalid SOAP data for resource ${resourceId}, skipping update`);
		return;
	}

	// Update the resource attributes with SOAP data
	const attributes = {
		er: soapData.ER || 0,
		cr: soapData.CR || 0,
		cd: soapData.CD || 0,
		dr: soapData.DR || 0,
		fl: soapData.FL || 0,
		hr: soapData.HR || 0,
		ma: soapData.MA || 0,
		pe: soapData.PE || 0,
		oq: soapData.OQ || 0,
		sr: soapData.SR || 0,
		ut: soapData.UT || 0
	};

	// Use ISO timestamp for consistency with JavaScript Date parsing
	const nowISO = new Date().toISOString();

	const updateStmt = db.prepare(`
		UPDATE resources 
		SET attributes = ?, soap_last_updated = ?, updated_at = ?
		WHERE id = ?
	`);

	updateStmt.run(JSON.stringify(attributes), nowISO, nowISO, resourceId);
	dbLogger.debug(`Updated resource ${resourceId} via SOAP (OQ: ${soapData.OQ || 0})`);
}

/**
 * Create a new resource from SOAP data
 * @param soapData - The SOAP resource information
 * @returns The ID of the newly created resource, or null if creation failed
 */
function createResourceFromSOAPData(soapData: SOAPResourceInfo): number | null {
	const db = getDatabase();

	// Validate SOAP data
	const hasBasicInfo = soapData.ID > 0 && soapData.Name && soapData.Name.trim().length > 0;

	if (!hasBasicInfo) {
		dbLogger.debug(`Invalid SOAP data for resource creation, skipping`);
		return null;
	}

	// Look up resource class information from SOAP class ID
	const resourceClass = getResourceClassBySoapId(soapData.Class);
	const className = resourceClass?.name || 'Unknown';
	const classPath = resourceClass ? getResourceClassPath(resourceClass.swgcraft_id) : [];

	// For type, use the most specific class name (last in path) or the class name itself
	const type = classPath.length > 0 ? classPath[classPath.length - 1] : className;

	// Create resource attributes from SOAP data
	const attributes = {
		er: soapData.ER || 0,
		cr: soapData.CR || 0,
		cd: soapData.CD || 0,
		dr: soapData.DR || 0,
		fl: soapData.FL || 0,
		hr: soapData.HR || 0,
		ma: soapData.MA || 0,
		pe: soapData.PE || 0,
		oq: soapData.OQ || 0,
		sr: soapData.SR || 0,
		ut: soapData.UT || 0
	};

	// Use ISO timestamp for consistency
	const nowISO = new Date().toISOString();
	const enterDate = soapData.AddedStamp
		? new Date(soapData.AddedStamp * 1000).toISOString()
		: nowISO;

	// Determine spawn status more intelligently
	// Resources older than 6 months are likely despawned
	const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
	const addedTime = soapData.AddedStamp ? soapData.AddedStamp * 1000 : Date.now();
	const isLikelySpawned = addedTime > sixMonthsAgo;

	// Set despawn date if we think it's not currently spawned
	const despawnDate = isLikelySpawned ? null : enterDate;

	try {
		const insertStmt = db.prepare(`
			INSERT INTO resources (
				id, name, type, class_name, class_path, attributes, 
				planet_distribution, enter_date, despawn_date, 
				is_currently_spawned, soap_last_updated, stats
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		const result = insertStmt.run(
			soapData.ID, // id (use SOAP ID)
			soapData.Name, // name
			type, // type (use most specific class name)
			className, // class_name (use proper class name from lookup)
			JSON.stringify(classPath), // class_path (full path array)
			JSON.stringify(attributes), // attributes
			JSON.stringify({}), // planet_distribution (empty, will be populated later)
			enterDate, // enter_date
			despawnDate, // despawn_date (set if likely despawned)
			isLikelySpawned ? 1 : 0, // is_currently_spawned (based on age)
			nowISO, // soap_last_updated
			JSON.stringify(attributes) // stats (copy of attributes)
		);

		dbLogger.info(
			`Created new resource from SOAP: ${soapData.Name} (ID: ${soapData.ID}, Class: ${className}, OQ: ${soapData.OQ || 0}, Spawned: ${isLikelySpawned ? 'Active' : 'Despawned'})`
		);
		return soapData.ID;
	} catch (error) {
		// Likely a duplicate ID, which is fine
		dbLogger.debug(`Resource ${soapData.Name} (ID: ${soapData.ID}) already exists in database`);
		return null;
	}
}

/**
 * Helper function to extract string values from XML elements
 * Handles various XML parsing scenarios including text nodes and nil values
 */
function extractStringValue(element: any): string {
	if (!element) return '';
	if (element._xsi?.nil || element['_xsi:nil']) return '';
	let value = '';
	if (typeof element === 'string') value = element;
	else if (element.text !== undefined) value = String(element.text);
	else value = String(element);

	// Handle malformed XML like "Behabet</n>" by removing trailing incomplete tags
	return value.replace(/<\/n>?$/, '');
}

/**
 * Helper function to extract numeric values from XML elements
 */
function extractValue(element: any): number {
	if (!element) return 0;
	if (element._xsi?.nil || element['_xsi:nil']) return 0;
	if (typeof element === 'number') return element;
	if (element.text !== undefined) return parseInt(element.text) || 0;
	return parseInt(element) || 0;
}

/**
 * Parse SOAP XML response to extract ResourceInfo using proper XML parsing
 */
function parseSOAPResourceInfo(xmlText: string): SOAPResourceInfo | null {
	try {
		// Use the XMLParser for parsing SOAP responses
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '_',
			textNodeName: 'text',
			parseAttributeValue: true,
			parseTagValue: true
		});

		const parsedXml = parser.parse(xmlText);

		// Navigate through the SOAP response structure
		// Structure: soap:Envelope -> soap:Body -> ns1:GetResourceInfoResponse -> return
		const soapEnvelope = parsedXml['soap:Envelope'] || parsedXml['SOAP-ENV:Envelope'];
		if (!soapEnvelope) return null;

		const soapBody = soapEnvelope['soap:Body'] || soapEnvelope['SOAP-ENV:Body'];
		if (!soapBody) return null;

		// Look for the response element (could have different namespaces)
		let resourceInfoResponse = null;
		for (const key of Object.keys(soapBody)) {
			if (key.includes('GetResourceInfo') && key.includes('Response')) {
				resourceInfoResponse = soapBody[key];
				break;
			}
		}

		if (!resourceInfoResponse) return null;

		const returnElement = resourceInfoResponse.return;
		if (!returnElement) return null;

		// Extract ResourceInfo fields from the return element
		const resourceInfo: SOAPResourceInfo = {
			ID: extractValue(returnElement.ID),
			Name: extractStringValue(returnElement.Name),
			Class: extractValue(returnElement.Class),
			ServerID: extractValue(returnElement.ServerID) || DEFAULT_SERVER_ID,
			AddedStamp: extractValue(returnElement.AddedStamp),
			AddedBy: extractValue(returnElement.AddedBy),
			ER: extractValue(returnElement.ER),
			CR: extractValue(returnElement.CR),
			CD: extractValue(returnElement.CD),
			DR: extractValue(returnElement.DR),
			FL: extractValue(returnElement.FL),
			HR: extractValue(returnElement.HR),
			MA: extractValue(returnElement.MA),
			PE: extractValue(returnElement.PE),
			OQ: extractValue(returnElement.OQ),
			SR: extractValue(returnElement.SR),
			UT: extractValue(returnElement.UT)
		};

		return resourceInfo;
	} catch (error) {
		dbLogger.error('Failed to parse SOAP ResourceInfo with XML parser', { error: error as Error });

		// Fallback to regex parsing if XML parsing fails
		try {
			const returnMatch = xmlText.match(/<return[^>]*>(.*?)<\/return>/s);
			if (!returnMatch) return null;

			const resourceXml = returnMatch[1];

			const extractField = (fieldName: string): number => {
				const match = resourceXml.match(new RegExp(`<${fieldName}[^>]*>([^<]+)<\/${fieldName}>`));
				return match ? parseInt(match[1], 10) : 0;
			};

			const extractStringField = (fieldName: string): string => {
				const match = resourceXml.match(new RegExp(`<${fieldName}[^>]*>([^<]+)<\/${fieldName}>`));
				return match ? match[1] : '';
			};

			return {
				ID: extractField('ID'),
				Name: extractStringField('Name'),
				Class: extractField('Class'),
				ServerID: extractField('ServerID'),
				AddedStamp: extractField('AddedStamp'),
				AddedBy: extractField('AddedBy'),
				ER: extractField('ER'),
				CR: extractField('CR'),
				CD: extractField('CD'),
				DR: extractField('DR'),
				FL: extractField('FL'),
				HR: extractField('HR'),
				MA: extractField('MA'),
				PE: extractField('PE'),
				OQ: extractField('OQ'),
				SR: extractField('SR'),
				UT: extractField('UT')
			};
		} catch (fallbackError) {
			dbLogger.error('Failed to parse SOAP ResourceInfo with fallback regex', {
				error: fallbackError as Error
			});
			return null;
		}
	}
}

/**
 * Simple resource info from FindResources SOAP API
 */
export interface SimpleResourceInfo {
	Name: string;
}

/**
 * Parse SOAP XML response for FindResources to extract resource names
 */
function parseSOAPResourceList(xmlText: string): SimpleResourceInfo[] {
	try {
		// Use the XMLParser for parsing SOAP responses
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '_',
			textNodeName: 'text',
			parseAttributeValue: true,
			parseTagValue: true
		});

		const parsedXml = parser.parse(xmlText);

		// Navigate through the SOAP response structure
		const soapEnvelope = parsedXml['soap:Envelope'] || parsedXml['SOAP-ENV:Envelope'];
		if (!soapEnvelope) return [];

		const soapBody = soapEnvelope['soap:Body'] || soapEnvelope['SOAP-ENV:Body'];
		if (!soapBody) return [];

		// Look for the FindResources response element
		let findResourcesResponse = null;
		for (const key of Object.keys(soapBody)) {
			if (key.includes('FindResources') && key.includes('Response')) {
				findResourcesResponse = soapBody[key];
				break;
			}
		}

		if (!findResourcesResponse) return [];

		const returnElement = findResourcesResponse.return;
		if (!returnElement) return [];

		// Handle both single item and array cases
		const items = Array.isArray(returnElement.item) ? returnElement.item : [returnElement.item];

		const resources: SimpleResourceInfo[] = [];
		for (const item of items) {
			if (item && item.Name) {
				// Extract the name, handling both string and object formats
				let name = extractStringValue(item.Name);

				// Debug: log the structure of the name to understand parsing issues
				dbLogger.debug(`Parsing resource name from FindResources:`, {
					rawName: item.Name,
					extractedName: name,
					nameType: typeof item.Name
				});

				if (name && name.trim().length > 0) {
					resources.push({ Name: name });
				}
			}
		}

		return resources;
	} catch (error) {
		dbLogger.error('Failed to parse SOAP FindResources response', { error: error as Error });
		return [];
	}
}

/**
 * Get detailed resource information by name using SOAP API
 * Updates the resource in the database with SOAP data if successful
 * @param resourceName - The exact name of the resource
 * @param serverId - The server ID (defaults to 162 for Restoration III)
 * @returns Promise that resolves to resource information or null
 */
export async function getResourceInfoByName(
	resourceName: string,
	serverId: number = DEFAULT_SERVER_ID
): Promise<SOAPResourceInfo | null> {
	try {
		const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="urn:swgaide">
  <soap:Body>
    <tns:GetResourceInfo>
      <tns:name>
        <tns:name>${resourceName}</tns:name>
        <tns:server>${serverId}</tns:server>
      </tns:name>
    </tns:GetResourceInfo>
  </soap:Body>
</soap:Envelope>`;

		const response = await fetch(SOAP_SERVER_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/xml; charset=utf-8',
				SOAPAction: 'urn:swgaide#GetResourceInfo'
			},
			body: soapBody
		});

		if (!response.ok) {
			throw new Error(`SOAP request failed: ${response.statusText}`);
		}

		const xmlText = await response.text();
		dbLogger.debug(`SOAP XML Response for resource ${resourceName}:`, { xmlText });
		const resourceInfo = parseSOAPResourceInfo(xmlText);

		if (resourceInfo) {
			// Find the resource by name to get its ID for updating
			const { searchResources } = await import('./resources.js');
			const matchingResources = searchResources(resourceName);
			const exactMatch = matchingResources.find((r) => r.name === resourceName);

			if (exactMatch) {
				// Update the existing resource in our database with SOAP data
				updateResourceWithSOAPData(exactMatch.id, resourceInfo);
				dbLogger.debug(
					`SOAP update successful for existing resource: ${resourceName} (ID: ${exactMatch.id})`
				);
			} else {
				// Resource doesn't exist locally, create it from SOAP data
				const newResourceId = createResourceFromSOAPData(resourceInfo);
				if (newResourceId) {
					dbLogger.info(`Created new resource from SOAP: ${resourceName} (ID: ${newResourceId})`);
				} else {
					dbLogger.warn(`Failed to create new resource from SOAP data: ${resourceName}`);
				}
			}
		}

		return resourceInfo;
	} catch (error) {
		dbLogger.error(`SOAP request failed for ${resourceName}: ${(error as Error).message}`);
		return null;
	}
}

/**
 * Get detailed resource information by ID using SOAP API
 * Updates the resource in the database with SOAP data if successful
 * @param resourceId - The SWGAide ID of the resource
 * @returns Promise that resolves to resource information or null
 */
export async function getResourceInfoById(resourceId: number): Promise<SOAPResourceInfo | null> {
	try {
		const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="urn:swgaide">
  <soap:Body>
    <tns:GetResourceInfoFromID>
      <tns:id>${resourceId}</tns:id>
    </tns:GetResourceInfoFromID>
  </soap:Body>
</soap:Envelope>`;

		const response = await fetch(SOAP_SERVER_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/xml; charset=utf-8',
				SOAPAction: 'urn:swgaide#GetResourceInfoFromID'
			},
			body: soapBody
		});

		if (!response.ok) {
			throw new Error(`SOAP request failed: ${response.statusText}`);
		}

		const xmlText = await response.text();
		dbLogger.debug(`SOAP XML Response for resource ${resourceId}:`, { xmlText });
		const resourceInfo = parseSOAPResourceInfo(xmlText);

		if (resourceInfo) {
			// Update the resource in our database with SOAP data
			updateResourceWithSOAPData(resourceId, resourceInfo);
			dbLogger.info(`Fetched and updated SOAP data for resource ID: ${resourceId}`);
		}

		return resourceInfo;
	} catch (error) {
		dbLogger.error('Failed to get resource info by ID', { error: error as Error, resourceId });
		return null;
	}
}

/**
 * Update resource with latest SOAP data if needed
 * Only updates currently spawned resources that haven't been updated in the last hour
 * @param resourceId - The resource ID to update (as integer)
 * @returns Promise that resolves to success status and resource info
 */
export async function updateResourceSOAPData(resourceId: number): Promise<{
	success: boolean;
	updated: boolean;
	resourceInfo?: SOAPResourceInfo;
	reason?: string;
}> {
	try {
		const resource = getResourceById(resourceId);
		if (!resource) {
			return { success: false, updated: false, reason: 'Resource not found' };
		}

		// Don't update despawned resources
		if (!resource.isCurrentlySpawned) {
			dbLogger.debug(
				`Skipping SOAP update for despawned resource: ${resource.name} (ID: ${resourceId})`
			);
			return { success: true, updated: false, reason: 'Resource is despawned' };
		}

		// Check if update is needed
		if (!needsSOAPUpdate(resource.soapLastUpdated || null)) {
			return { success: true, updated: false, reason: 'Recently updated' };
		}

		// Fetch SOAP data
		const resourceInfo = await getResourceInfoById(resourceId);
		if (!resourceInfo) {
			return { success: false, updated: false, reason: 'SOAP API call failed' };
		}

		return {
			success: true,
			updated: true,
			resourceInfo,
			reason: 'Successfully updated from SOAP'
		};
	} catch (error) {
		dbLogger.error('Failed to update resource SOAP data', { error: error as Error, resourceId });
		return { success: false, updated: false, reason: 'Update failed' };
	}
}

/**
 * Find resources by partial name match using SOAP API
 * @param searchTerm - The partial resource name to search for
 * @param serverId - The server ID (defaults to 162 for Restoration III)
 * @returns Promise that resolves to array of matching resource names
 */
export async function findResourcesByName(
	searchTerm: string,
	serverId: number = DEFAULT_SERVER_ID
): Promise<SimpleResourceInfo[]> {
	try {
		const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="urn:swgaide">
  <soap:Body>
    <tns:FindResources>
      <tns:name>
        <tns:name>${searchTerm}</tns:name>
        <tns:server>${serverId}</tns:server>
      </tns:name>
    </tns:FindResources>
  </soap:Body>
</soap:Envelope>`;

		const response = await fetch(SOAP_SERVER_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/xml; charset=utf-8',
				SOAPAction: 'urn:swgaide#FindResources'
			},
			body: soapBody
		});

		if (!response.ok) {
			throw new Error(`SOAP FindResources request failed: ${response.statusText}`);
		}

		const xmlText = await response.text();
		dbLogger.debug(`SOAP FindResources XML Response for "${searchTerm}":`, { xmlText });

		const resourceList = parseSOAPResourceList(xmlText);
		dbLogger.debug(`Found ${resourceList.length} resources matching "${searchTerm}"`);

		// Debug: log the actual resource names found
		if (resourceList.length > 0) {
			const resourceNames = resourceList.map((r) => r.Name).join(', ');
			dbLogger.debug(`SOAP FindResources for "${searchTerm}" returned: ${resourceNames}`);
		}

		return resourceList;
	} catch (error) {
		dbLogger.error(`SOAP FindResources failed for "${searchTerm}": ${(error as Error).message}`);
		return [];
	}
}

/**
 * Enhanced resource search using FindResources + GetResourceInfo approach
 * First finds matching resource names, then fetches detailed info for resources not in our database
 * @param searchTerm - The partial resource name to search for
 * @param serverId - The server ID (defaults to 162 for Restoration III)
 * @returns Promise that resolves to number of new resources created
 */
export async function enhancedResourceSearch(
	searchTerm: string,
	serverId: number = DEFAULT_SERVER_ID
): Promise<{ created: number; found: number }> {
	try {
		// First, find all resources matching the search term
		const foundResources = await findResourcesByName(searchTerm, serverId);

		if (foundResources.length === 0) {
			dbLogger.debug(`No resources found in SOAP for search term: "${searchTerm}"`);
			return { created: 0, found: 0 };
		}

		dbLogger.info(
			`Found ${foundResources.length} potential matches for "${searchTerm}" in SOAP API`
		);

		// Check which resources we don't have in our database yet
		const { searchResources } = await import('./resources.js');
		let createdCount = 0;

		for (const foundResource of foundResources) {
			// Debug: log the actual foundResource object to see what we're working with
			dbLogger.debug(`Processing found resource:`, {
				foundResource,
				name: foundResource.Name,
				type: typeof foundResource.Name
			});

			// Check if we already have this resource
			const existingResources = searchResources(foundResource.Name);
			const exactMatch = existingResources.find((r) => r.name === foundResource.Name);

			if (!exactMatch) {
				// We don't have this resource, fetch detailed info and create it
				dbLogger.debug(`Fetching detailed info for new resource: ${foundResource.Name}`);

				const detailedInfo = await getResourceInfoByName(foundResource.Name, serverId);
				if (detailedInfo) {
					// Check if the resource was actually created by searching for it again
					const verifyResources = searchResources(foundResource.Name);
					const verifyMatch = verifyResources.find((r) => r.name === foundResource.Name);

					if (verifyMatch) {
						createdCount++;
						dbLogger.info(
							`Successfully created resource from SOAP search: ${foundResource.Name} (ID: ${verifyMatch.id})`
						);
					} else {
						dbLogger.warn(
							`SOAP data retrieved for ${foundResource.Name} but resource creation failed`
						);
					}
				} else {
					dbLogger.warn(`Failed to get detailed info for resource: ${foundResource.Name}`);
				}
			} else {
				dbLogger.debug(
					`Resource already exists in database: ${foundResource.Name} (ID: ${exactMatch.id})`
				);
			}
		}

		dbLogger.info(
			`Enhanced search for "${searchTerm}" created ${createdCount} new resources out of ${foundResources.length} found`
		);
		return { created: createdCount, found: foundResources.length };
	} catch (error) {
		dbLogger.error(
			`Enhanced resource search failed for "${searchTerm}": ${(error as Error).message}`
		);
		return { created: 0, found: 0 };
	}
}
