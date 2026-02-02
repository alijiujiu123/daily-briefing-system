#!/usr/bin/env node

/**
 * Database initialization
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Remove 'sqlite:' prefix if present
let dbPath = process.env.DATABASE_URL || 'data/briefing.db';
if (dbPath.startsWith('sqlite:')) {
  dbPath = dbPath.replace('sqlite:', '');
}

// Ensure directory exists
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
const dbDir = dirname(dbPath);
if (dbDir && dbDir !== '.') {
  mkdirSync(dbDir, { recursive: true });
}

console.log(`📦 Initializing database: ${dbPath}`);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Articles table
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    blog_name TEXT,
    published_at INTEGER,
    fetched_at INTEGER NOT NULL,
    content TEXT,
    summary TEXT,
    category TEXT,
    importance_score REAL DEFAULT 0,
    processed BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  -- Briefings table
  CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    article_count INTEGER NOT NULL,
    sent_telegram BOOLEAN DEFAULT 0,
    sent_email BOOLEAN DEFAULT 0,
    sent_slack BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  -- Sent articles tracking
  CREATE TABLE IF NOT EXISTS sent_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    briefing_id INTEGER NOT NULL,
    channel TEXT NOT NULL,
    sent_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
  CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_processed ON articles(processed);
  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
  CREATE INDEX IF NOT EXISTS idx_briefings_date ON briefings(date);
`);

console.log('✅ Database initialized successfully');

db.close();
