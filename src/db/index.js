#!/usr/bin/env node

/**
 * Database connection and queries
 */

import SQLite3 from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_URL?.replace('sqlite:', '') || 'data/briefing.db';

class Database {
  constructor() {
    this.db = new SQLite3(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  close() {
    this.db.close();
  }

  // Articles
  insertArticle(article) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO articles (
        url, title, author, blog_name, published_at, fetched_at, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      article.url,
      article.title,
      article.author || null,
      article.blogName || null,
      article.publishedAt ? Math.floor(new Date(article.publishedAt).getTime() / 1000) : null,
      Math.floor(Date.now() / 1000),
      article.content || null
    );
  }

  getArticleByUrl(url) {
    const stmt = this.db.prepare('SELECT * FROM articles WHERE url = ?');
    return stmt.get(url);
  }

  getUnprocessedArticles(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM articles
      WHERE processed = 0
      ORDER BY published_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  updateArticleSummary(id, summary, category, importanceScore) {
    const stmt = this.db.prepare(`
      UPDATE articles
      SET summary = ?, category = ?, importance_score = ?, processed = 1, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    return stmt.run(summary, category, importanceScore, id);
  }

  getArticlesByDate(startDate, endDate, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM articles
      WHERE published_at >= ? AND published_at <= ?
      ORDER BY importance_score DESC, published_at DESC
      LIMIT ?
    `);
    return stmt.all(startDate, endDate, limit);
  }

  // Briefings
  insertBriefing(briefing) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO briefings (date, content, article_count)
      VALUES (?, ?, ?)
    `);
    return stmt.run(briefing.date, briefing.content, briefing.articleCount);
  }

  getBriefingByDate(date) {
    const stmt = this.db.prepare('SELECT * FROM briefings WHERE date = ?');
    return stmt.get(date);
  }

  getLatestBriefing() {
    const stmt = this.db.prepare('SELECT * FROM briefings ORDER BY date DESC LIMIT 1');
    return stmt.get();
  }

  updateBriefingSent(date, channel) {
    const column = `sent_${channel}`;
    const stmt = this.db.prepare(`
      UPDATE briefings
      SET ${column} = 1, updated_at = strftime('%s', 'now')
      WHERE date = ?
    `);
    return stmt.run(date);
  }

  // Stats
  getStats() {
    const totalArticles = this.db.prepare('SELECT COUNT(*) as count FROM articles').get();
    const processedArticles = this.db.prepare('SELECT COUNT(*) as count FROM articles WHERE processed = 1').get();
    const totalBriefings = this.db.prepare('SELECT COUNT(*) as count FROM briefings').get();

    return {
      totalArticles: totalArticles.count,
      processedArticles: processedArticles.count,
      totalBriefings: totalBriefings.count
    };
  }
}

// Singleton
let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

export default Database;
