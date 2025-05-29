package main

import "time"

// MailData represents raw mail data extracted from mail files
type MailData struct {
	MailID    string    `json:"mail_id"`
	Sender    string    `json:"sender"`
	Subject   string    `json:"subject"`
	Timestamp time.Time `json:"timestamp"`
	Body      string    `json:"body"`
	Location  string    `json:"location,omitempty"`
}

// MailBatch represents a collection of mail data for batch import
type MailBatch struct {
	Mails []MailData `json:"mails"`
	Stats MailStats  `json:"stats"`
}

// MailStats represents basic statistics about the parsed mail batch
type MailStats struct {
	TotalMails        int            `json:"total_mails"`
	SaleNotifications int            `json:"sale_notifications"`
	DateRange         DateRange      `json:"date_range"`
	Senders           map[string]int `json:"senders"`
}

// DateRange represents the time span of the data
type DateRange struct {
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}
