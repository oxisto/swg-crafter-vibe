# SOAP API Integration Documentation

## Overview

The SWG Shipwright application now includes complete SOAP API integration with SWGAide for real-time resource data queries. This provides detailed resource statistics and information beyond what's available in the local XML exports.

## Features

### 1. Real-time Resource Queries

- Query individual resources by name or ID
- Retrieve detailed resource statistics (ER, CR, CD, DR, FL, HR, MA, PE, OQ, SR, UT)
- Get server-specific data for SWG Restoration III (Server ID: 162)

### 2. Intelligent Caching

- 4-hour TTL cache to reduce API load
- Automatic cache validation and cleanup
- Database-backed cache storage with expiration tracking
- Cache statistics and management endpoints

### 3. API Endpoints

#### Get Resource with Automatic SOAP Enrichment

```http
GET /api/resources/{id}
GET /api/resources/{id}?force=true
```

Retrieves a resource with automatic SOAP data enrichment. The system uses smart caching to only update SOAP data when needed (>1 hour since last update).

**Query Parameters:**

- `force=true`: Force refresh SOAP data (bypasses cache)

**Response:**

````json
{
  "success": true,
  "resource": {
    "id": "1542964",
    "name": "Nosleseraite",
    "soapLastUpdated": "2025-06-11T23:02:45.261Z",
    ...
  },
  "soap": {
    "data": {
      "ID": 1542964,
      "Name": "Nosleseraite",
      "Class": 777,
      "ServerID": 162,
      "OQ": 109,
      "DR": 748,
      ...
    },
    "updated": true,
    "reason": "Successfully updated from SOAP",
    "timestamp": "2025-06-11T23:02:45.262Z"
  }
#### Resource Enrichment (DEPRECATED)
```http
GET /api/resources/search?q={query}&include_soap=true
````

**Note:** Extended SOAP search functionality has been removed. Use the main resource endpoint for SOAP enrichment.

## Technical Implementation

### SOAP Request Structure

The implementation uses proper WSDL-compliant SOAP requests:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="urn:swgaide">
  <soap:Body>
    <tns:GetResourceInfoFromID>
      <tns:id>1542964</tns:id>
    </tns:GetResourceInfoFromID>
  </soap:Body>
</soap:Envelope>
```

### Smart Caching Strategy

- **Update Interval**: 1 hour per resource
- **Storage**: Direct database updates to `resources` table
- **Tracking**: `soap_last_updated` timestamp field
- **Logic**: Only update currently spawned resources
- **Validation**: Skip updates for despawned resources

### Database Schema Updates

```sql
ALTER TABLE resources ADD COLUMN soap_last_updated DATETIME;
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Examples

### Basic Resource Query with Auto-Enrichment

```javascript
// Get resource with automatic SOAP enrichment
const response = await fetch('/api/resources/1542964');
const data = await response.json();

if (data.success) {
	console.log(`Resource: ${data.resource.name}`);
	console.log(`SOAP Data Available: ${data.soap.updated}`);
	console.log(`Update Reason: ${data.soap.reason}`);

	if (data.soap.data) {
		console.log(`Overall Quality: ${data.soap.data.OQ}`);
		console.log(`Decay Resistance: ${data.soap.data.DR}`);
	}
}
```

### Force Refresh SOAP Data

```javascript
// Force refresh bypassing cache
const response = await fetch('/api/resources/1542964?force=true');
const data = await response.json();

console.log(`Force refresh result: ${data.soap.reason}`);
```

## Performance Considerations

### Smart Caching

- First request: Fresh SOAP API call (~500-1000ms) if needed
- Subsequent requests within 1 hour: No SOAP call (~10-50ms)
- Despawned resources: No SOAP calls made

### Update Logic

- Only currently spawned resources are updated via SOAP
- Updates occur only when >1 hour since last update
- Database updates happen automatically during GET requests

### Error Handling

- Graceful degradation when SOAP API is unavailable
- Local database data remains accessible
- SOAP failures don't break resource retrieval

## Configuration

### Server ID

Currently hardcoded to 162 (SWG Restoration III). To change:

```javascript
const DEFAULT_SERVER_ID = 162; // Update in database.ts
```

### Update Interval

```javascript
const SOAP_UPDATE_INTERVAL_HOURS = 1; // Update in database.ts
```

## API Changes (December 2024)

### Removed Features

- ❌ Separate SOAP cache table
- ❌ POST `/api/resources/{id}/soap` endpoint
- ❌ Extended search with SOAP integration
- ❌ Cache management endpoints
- ❌ Rate limiting (rolled back)

### New Features

- ✅ Integrated SOAP functionality into main resource endpoint
- ✅ Smart caching with direct database updates
- ✅ Automatic SOAP enrichment on GET requests
- ✅ Timestamp-based update tracking
- ✅ Simplified API surface

## Testing

The updated implementation has been tested with:

- ✅ Real resource data from SWG Restoration III
- ✅ Smart caching behavior (1-hour intervals)
- ✅ Force refresh functionality
- ✅ POST endpoint removal verification
- ✅ SOAP XML parsing accuracy
- ✅ Database timestamp tracking
- ✅ Error handling for API failures

All tests pass successfully with improved performance and simplified architecture.
