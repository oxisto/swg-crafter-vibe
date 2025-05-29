package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/urfave/cli/v3"
)

func main() {
	cmd := &cli.Command{
		Name:        "mail-analyzer",
		Usage:       "Parse SWG in-game mail files to extract raw mail data",
		Description: "A tool to parse Star Wars Galaxies in-game email files and extract raw mail data for import into SWG Crafter",
		Version:     "2.0.0",
		Authors: []any{
			"SWG Crafter Team <dev@swg-crafter.local>",
		},
		Commands: []*cli.Command{
			{
				Name:    "parse",
				Aliases: []string{"p"},
				Usage:   "Parse mail files and extract raw mail data",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:    "input",
						Aliases: []string{"i"},
						Usage:   "Input directory containing .mail files",
						Value:   "./testdata",
					},
					&cli.StringFlag{
						Name:    "output",
						Aliases: []string{"o"},
						Usage:   "Output file for JSON results",
						Value:   "mail_data.json",
					},
					&cli.BoolFlag{
						Name:    "verbose",
						Aliases: []string{"v"},
						Usage:   "Enable verbose output",
						Value:   false,
					},
					&cli.StringFlag{
						Name:  "sender-filter",
						Usage: "Filter by sender (e.g., 'SWG.Restoration.auctioner')",
					},
					&cli.StringFlag{
						Name:  "subject-filter",
						Usage: "Filter by subject pattern (e.g., 'Sale Complete')",
					},
				},
				Action: parseMailFiles,
			},
		},
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}

func parseMailFiles(ctx context.Context, cmd *cli.Command) error {
	inputDir := cmd.String("input")
	outputFile := cmd.String("output")
	verbose := cmd.Bool("verbose")
	senderFilter := cmd.String("sender-filter")
	subjectFilter := cmd.String("subject-filter")

	if verbose {
		fmt.Printf("Parsing mail files from: %s\n", inputDir)
		fmt.Printf("Output file: %s\n", outputFile)
	}

	mailData, err := parseMailFromDirectory(inputDir, verbose, senderFilter, subjectFilter)
	if err != nil {
		return fmt.Errorf("failed to parse mail files: %w", err)
	}

	// Generate statistics
	stats := generateMailStats(mailData)

	// Create batch for export
	batch := MailBatch{
		Mails: mailData,
		Stats: stats,
	}

	// Write to JSON file
	jsonData, err := json.MarshalIndent(batch, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	if err := os.WriteFile(outputFile, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to write output file: %w", err)
	}

	fmt.Printf("Successfully parsed %d mail files\n", len(mailData))
	fmt.Printf("Sale notifications: %d\n", stats.SaleNotifications)
	fmt.Printf("Results written to: %s\n", outputFile)

	return nil
}

func parseMailFromDirectory(inputDir string, verbose bool, senderFilter, subjectFilter string) ([]MailData, error) {
	var allMails []MailData

	err := filepath.Walk(inputDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !strings.HasSuffix(path, ".mail") {
			return nil
		}

		if verbose {
			fmt.Printf("Processing: %s\n", path)
		}

		mailData, err := parseMailFile(path)
		if err != nil {
			if verbose {
				fmt.Printf("Warning: Failed to parse %s: %v\n", path, err)
			}
			return nil // Continue processing other files
		}

		// Apply filters
		if senderFilter != "" && !strings.Contains(mailData.Sender, senderFilter) {
			return nil
		}

		if subjectFilter != "" && !strings.Contains(mailData.Subject, subjectFilter) {
			return nil
		}

		allMails = append(allMails, *mailData)
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Sort by timestamp
	sort.Slice(allMails, func(i, j int) bool {
		return allMails[i].Timestamp.Before(allMails[j].Timestamp)
	})

	return allMails, nil
}

func generateMailStats(mails []MailData) MailStats {
	stats := MailStats{
		TotalMails: len(mails),
		Senders:    make(map[string]int),
	}

	if len(mails) == 0 {
		return stats
	}

	// Initialize date range
	stats.DateRange.StartDate = mails[0].Timestamp
	stats.DateRange.EndDate = mails[0].Timestamp

	for _, mail := range mails {
		// Update date range
		if mail.Timestamp.Before(stats.DateRange.StartDate) {
			stats.DateRange.StartDate = mail.Timestamp
		}
		if mail.Timestamp.After(stats.DateRange.EndDate) {
			stats.DateRange.EndDate = mail.Timestamp
		}

		// Count senders
		stats.Senders[mail.Sender]++

		// Count sale notifications
		if mail.Sender == "SWG.Restoration.auctioner" && strings.Contains(mail.Subject, "Sale Complete") {
			stats.SaleNotifications++
		}
	}

	return stats
}
