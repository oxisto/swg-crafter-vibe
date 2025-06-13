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
function updateResourceWithSOAPData(resourceId: string, soapData: SOAPResourceInfo): void {
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

		// Helper function to extract values, handling both text nodes and nil values
		const extractValue = (element: any): number => {
			if (!element) return 0;
			if (element._xsi?.nil || element['_xsi:nil']) return 0;
			if (typeof element === 'number') return element;
			if (element.text !== undefined) return parseInt(element.text) || 0;
			return parseInt(element) || 0;
		};

		const extractStringValue = (element: any): string => {
			if (!element) return '';
			if (element._xsi?.nil || element['_xsi:nil']) return '';
			if (typeof element === 'string') return element;
			if (element.text !== undefined) return String(element.text);
			return String(element);
		};

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
			// Update the resource in our database with SOAP data
			updateResourceWithSOAPData(resourceName, resourceInfo);
			dbLogger.debug(`SOAP update successful for resource: ${resourceName}`);
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
export async function getResourceInfoById(resourceId: string): Promise<SOAPResourceInfo | null> {
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
 * @param resourceId - The resource ID to update
 * @returns Promise that resolves to success status and resource info
 */
export async function updateResourceSOAPData(resourceId: string): Promise<{
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
