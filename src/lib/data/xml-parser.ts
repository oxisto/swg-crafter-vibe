/**
 * XML Parser Module
 *
 * Provides common XML parsing functionality for schematics and resources.
 */

import { XMLParser } from 'fast-xml-parser';
import { createWriteStream, existsSync, unlinkSync, readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { dbLogger } from './database.js';

/**
 * XML Parser configuration
 */
const XML_PARSER_CONFIG = {
	ignoreAttributes: false,
	attributeNamePrefix: '_',
	textNodeName: 'text',
	parseAttributeValue: true,
	parseTagValue: true
};

/**
 * Creates an XML parser with standard configuration
 * @returns Configured XMLParser instance
 */
export function createXMLParser(): XMLParser {
	return new XMLParser(XML_PARSER_CONFIG);
}

/**
 * Downloads and extracts a compressed XML file
 * @param url - The URL to download from
 * @param tempFileName - Temporary file name for the download
 * @returns The extracted XML content as a string
 */
export async function downloadAndExtractXML(url: string, tempFileName: string): Promise<string> {
	dbLogger.info(`Starting download from ${url}`);
	
	try {
		// Download the compressed XML file
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to download: ${response.statusText}`);
		}

		const downloadSize = response.headers.get('content-length');
		const sizeText = downloadSize
			? `${Math.round(parseInt(downloadSize) / 1024)}KB`
			: 'unknown size';
		
		dbLogger.debug(`Downloaded ${sizeText} from ${url}`);

		// Save the gzipped file temporarily
		const buffer = await response.arrayBuffer();
		const fileStream = createWriteStream(tempFileName);
		fileStream.write(Buffer.from(buffer));
		fileStream.end();

		// Wait for the file to be written
		await new Promise<void>((resolve, reject) => {
			fileStream.on('finish', () => resolve());
			fileStream.on('error', reject);
		});

		// Extract and return the XML content
		const compressedData = readFileSync(tempFileName);
		const xmlContent = gunzipSync(compressedData).toString('utf-8');

		// Clean up temporary file
		if (existsSync(tempFileName)) {
			unlinkSync(tempFileName);
		}

		return xmlContent;
	} catch (error) {
		// Clean up temporary file on error
		if (existsSync(tempFileName)) {
			unlinkSync(tempFileName);
		}
		throw error;
	}
}

/**
 * Parses XML content using the standard configuration
 * @param xmlContent - The XML content to parse
 * @returns Parsed XML data
 */
export function parseXMLContent(xmlContent: string): any {
	const parser = createXMLParser();
	return parser.parse(xmlContent);
}
