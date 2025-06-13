# SWG Mail Analyzer

A command-line tool written in Go to analyze Star Wars Galaxies in-game mail files and extract sales data for shipwright business tracking.

## Features

- **Parse Mail Files**: Extract sale notifications from SWG mail files
- **Sales Statistics**: Generate comprehensive statistics about your sales
- **Filtering**: Filter sales by item type, date range, and more
- **Export Formats**: Export data in JSON or CSV format for integration with SWG Crafter
- **Rich CLI**: User-friendly command-line interface using urfave/cli

## Installation

### Prerequisites

- Go 1.23 or later

### Build from Source

```bash
cd tools/mail-analyzer
go mod tidy
go build -o mail-analyzer .
```

## Usage

### Parse Mail Files

Extract sales data from mail files:

```bash
./mail-analyzer parse --input ./testdata --output sales.json --verbose
```

**Flags:**

- `--input, -i`: Input directory containing .mail files (default: "./testdata")
- `--output, -o`: Output file for JSON results (default: "sales_data.json")
- `--verbose, -v`: Enable verbose output
- `--filter`: Filter by item type (e.g., 'Engine', 'Blaster', 'Reactor')
- `--from`: Filter sales from date (YYYY-MM-DD)
- `--to`: Filter sales to date (YYYY-MM-DD)

**Examples:**

```bash
# Parse all mails with verbose output
./mail-analyzer parse -v

# Filter only engine sales from January 2024
./mail-analyzer parse --filter "Engine" --from 2024-01-01 --to 2024-01-31

# Parse specific directory
./mail-analyzer parse -i /path/to/mail/files -o my_sales.json
```

### Generate Statistics

Generate comprehensive sales statistics:

```bash
./mail-analyzer stats --input ./testdata --verbose
```

**Output includes:**

- Total sales count and revenue
- Average sale price
- Top selling items
- Category breakdown (Engine, Reactor, Shield, etc.)
- Mark level distribution
- Date range of sales

### Export for SWG Crafter

Export data in format suitable for SWG Crafter integration:

```bash
./mail-analyzer export --input ./testdata --output crafter_data.json --format json
```

**Formats:**

- `json`: JSON format for API integration
- `csv`: CSV format for spreadsheet analysis

## Mail File Format

The tool expects SWG mail files in the following format:

```
<MailID>
<Sender>
<Subject>
TIMESTAMP: <Unix Timestamp>
<Mail Body>
<Optional Location Line>
```

**Example Sale Mail:**

```
11324432
SWG.Restoration.auctioner
Instant Sale Complete
TIMESTAMP: 1743011946
Your auction of [SEA] Heavy Blaster (Green) has been sold to Darkmole for 30000 credits
The sale took place at Mos Eisley, on Tatooine.
```

## Sale Data Structure

Each parsed sale contains:

```json
{
	"mail_id": "11324432",
	"timestamp": "2025-01-24T15:39:06Z",
	"item_name": "Heavy Blaster (Green)",
	"buyer": "Darkmole",
	"credits": 30000,
	"location": "Mos Eisley, Tatooine",
	"mark_level": "I",
	"category": "Weapon"
}
```

## Categories

The tool automatically categorizes items into:

- **Engine**: Starfighter engines
- **Reactor**: Fusion reactors and power systems
- **Shield**: Deflector shields and generators
- **Capacitor**: Weapons capacitors
- **Armor**: Durasteel plating and armor
- **Weapon**: Blasters, cannons, and weapons
- **Booster**: Speed and performance boosters
- **Droid Interface**: Droid interfaces and systems

## Mark Levels

The tool extracts mark levels (I-V) from item names:

- Detects "Mark I", "Mark II", etc.
- Identifies "Starter Line" items as Mark I
- Falls back to pattern matching

## Integration with SWG Crafter

The export command generates data suitable for integration with the main SWG Crafter application:

```bash
./mail-analyzer export --format json --output ../../../src/lib/data/sales_import.json
```

This creates a JSON file that can be imported into the SWG Crafter inventory management system to track:

- Historical sales data
- Revenue analysis
- Item performance metrics
- Customer information

## Development

### Project Structure

```
tools/mail-analyzer/
├── main.go          # CLI application and commands
├── types.go         # Data structures and types
├── parser.go        # Mail file parsing logic
├── go.mod          # Go module definition
├── testdata/       # Sample mail files for testing
└── README.md       # This file
```

### Testing

Run the tool against test data:

```bash
./mail-analyzer parse -v
./mail-analyzer stats -v
```

### Adding New Features

1. Add new command in `main.go`
2. Implement parsing logic in `parser.go`
3. Add new types in `types.go` if needed
4. Test with sample data in `testdata/`

## License

Part of the SWG Crafter project. See the main project README for license information.
