# Resource Spawns Feature

The Resource Spawns feature in the SWG Shipwright application allows you to track and analyze current resources available in Star Wars Galaxies: Restoration III server.

## Overview

Resources in SWG are constantly changing, with new resources spawning and old ones depleting over time. Keeping track of high-quality resources is essential for crafting the best possible ship components. This feature provides a comprehensive interface to:

1. View current resource spawns on Restoration III server
2. Check resource quality and attributes
3. Find resource spawn locations
4. Determine which resources are best for specific components

## Data Source

The application fetches resource data from the SWGAide public API:
- Resource data URL: `https://swgaide.com/pub/exports/currentresources_162.xml.gz`
- Data is cached locally and refreshed every 6 hours

## Features

### Resource Browsing

- **Table View**: Compact list showing all resource properties
- **Grid View**: Card-based layout for easier visual browsing
- **Search**: Filter resources by name
- **Class Filter**: Show only resources of a specific class

### Resource Details

Each resource has detailed information:
- Name and class
- Quality score (calculated from attributes)
- Full attributes list (CR, CD, DR, FL, HR, MA, PE, OQ, SR, UT, ER)
- Planet distribution with concentration percentages
- Best uses based on attributes and class
- Spawn date

### Updates

- Automatic background updates every 6 hours
- Manual update capability
- Last update timestamp display

## Integration with Crafting

The resources data is particularly valuable when combined with schematic information to determine:
- Which currently available resources are best for specific ship components
- What quality of components can be crafted with current resources
- Which planets to visit for resource harvesting

## Technical Details

- Resources are stored in the SQLite database
- Resource attributes and values are preserved exactly as provided by SWGAide
- Quality scores and best uses are calculated based on attribute values
- Planet concentration values show where resources are most abundant

## Using the Feature

1. Access the Resources page from the main navigation
2. Browse or search for resources
3. Click on a resource to view detailed information
4. Use the update button to fetch the latest data if needed

This feature helps shipwrights keep track of valuable resources for component crafting and ensures you always have information about the best current materials available.
