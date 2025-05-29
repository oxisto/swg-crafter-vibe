package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// parseMailFile parses a single mail file and extracts raw mail data
func parseMailFile(filename string) (*MailData, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	if len(lines) < 4 {
		return nil, fmt.Errorf("mail file too short: %d lines", len(lines))
	}

	// Parse mail format:
	// Line 0: Mail ID
	// Line 1: Sender
	// Line 2: Subject
	// Line 3: TIMESTAMP: <unix timestamp>
	// Line 4+: Body content

	mailID := strings.TrimSpace(lines[0])
	sender := strings.TrimSpace(lines[1])
	subject := strings.TrimSpace(lines[2])

	// Parse timestamp
	timestampLine := strings.TrimSpace(lines[3])
	if !strings.HasPrefix(timestampLine, "TIMESTAMP: ") {
		return nil, fmt.Errorf("invalid timestamp line: %s", timestampLine)
	}

	timestampStr := strings.TrimPrefix(timestampLine, "TIMESTAMP: ")
	timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse timestamp: %w", err)
	}

	// Collect body content (everything after timestamp line)
	var bodyLines []string
	if len(lines) > 4 {
		bodyLines = lines[4:]
	}
	body := strings.Join(bodyLines, "\n")

	// Extract location if available (look for location pattern in body)
	location := parseLocation(body)

	return &MailData{
		MailID:    mailID,
		Sender:    sender,
		Subject:   subject,
		Timestamp: time.Unix(timestamp, 0),
		Body:      body,
		Location:  location,
	}, nil
}

// parseLocation extracts location from mail body content
func parseLocation(body string) string {
	// Expected format: "The sale took place at LocationName, on PlanetName."
	re := regexp.MustCompile(`The sale took place at (.*?), on (.*?)\.`)
	matches := re.FindStringSubmatch(body)

	if len(matches) == 3 {
		return fmt.Sprintf("%s, %s", matches[1], matches[2])
	}

	return ""
}
