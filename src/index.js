#!/usr/bin/env node

/**
 * Daily Briefing System - Main Entry Point
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import modules
import RSSFetcher from './fetchers/rss.js';
import AIProcessor from './processors/ai.js';
import BriefingFormatter from './formatters/briefing.js';
import TelegramPublisher from './publishers/telegram.js';
import EmailPublisher from './publishers/email.js';
import SlackPublisher from './publishers/slack.js';
import TaskScheduler from './scheduler/index.js';
import { getDatabase } from './db/index.js';

class DailyBriefingSystem {
  constructor() {
    this.fetcher = new RSSFetcher();
    this.ai = new AIProcessor();
    this.formatter = new BriefingFormatter();
    this.telegram = new TelegramPublisher();
    this.email = new EmailPublisher();
    this.slack = new SlackPublisher();
    this.scheduler = new TaskScheduler();
    this.db = getDatabase();
  }

  async fetchArticles() {
    console.log('📡 Fetching articles...');
    const articles = await this.fetcher.fetchAll();
    
    // Save to database
    let added = 0;
    for (const article of articles) {
      const existing = this.db.getArticleByUrl(article.url);
      if (!existing) {
        this.db.insertArticle(article);
        added++;
      }
    }
    
    console.log(`✅ Fetched ${articles.length} articles, ${added} new`);
    return articles;
  }

  async processArticles() {
    console.log('🤖 Processing articles with AI...');
    const articles = this.db.getUnprocessedArticles(parseInt(process.env.MAX_ARTICLES_PER_DAY || '20'));
    
    if (articles.length === 0) {
      console.log('✅ No new articles to process');
      return [];
    }

    const results = await this.ai.batchProcess(articles);
    
    // Update database
    for (const { article, result } of results) {
      if (result) {
        this.db.updateArticleSummary(
          article.id,
          result.summary,
          result.category,
          result.importance
        );
      }
    }

    return results.filter(r => r.result).map(r => ({ ...r.article, ...r.result }));
  }

  async generateBriefing(date = new Date()) {
    console.log('📝 Generating briefing...');
    
    const startDate = Math.floor(new Date(date.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endDate = Math.floor(new Date(date.setHours(23, 59, 59, 999)).getTime() / 1000);
    
    const articles = this.db.getArticlesByDate(startDate, endDate, 100);
    console.log(`✅ Found ${articles.length} articles for briefing`);
    
    return articles;
  }

  async publishBriefing(articles, date = new Date()) {
    console.log('📤 Publishing briefing...');
    
    const dateStr = this.formatter.formatDate(date);
    const markdown = this.formatter.formatDailyBriefing(articles, date);
    const telegram = this.formatter.formatTelegramBriefing(articles, date);
    const emailHtml = this.formatter.formatEmailBriefing(articles, date);
    const slackBlocks = this.slack.formatAsSlackBlocks(articles, dateStr);

    // Save briefing to database
    const briefing = {
      date: dateStr,
      content: markdown,
      articleCount: articles.length
    };
    this.db.insertBriefing(briefing);

    // Publish to channels
    const results = {
      telegram: await this.telegram.sendBriefing(telegram),
      email: await this.email.sendBriefing(emailHtml, markdown, dateStr),
      slack: await this.slack.sendBriefing(slackBlocks, telegram)
    };

    console.log('✅ Briefing published');
    return results;
  }

  async runDailyBriefing() {
    try {
      // 1. Fetch articles
      await this.fetchArticles();

      // 2. Process with AI
      const processed = await this.processArticles();

      // 3. Generate briefing
      const articles = await this.generateBriefing();

      // 4. Publish
      if (articles.length > 0) {
        await this.publishBriefing(articles);
      }

      // 5. Show stats
      const stats = this.db.getStats();
      console.log('📊 Stats:', stats);

    } catch (error) {
      console.error('❌ Daily briefing failed:', error);
    }
  }

  startScheduler() {
    // Schedule daily briefing
    this.scheduler.scheduleTask(
      'daily-briefing',
      process.env.FETCH_SCHEDULE || '0 8 * * *',
      () => this.runDailyBriefing()
    );

    // Schedule article fetching (every 2 hours)
    this.scheduler.scheduleTask(
      'fetch-articles',
      '0 */2 * * *',
      () => this.fetchArticles()
    );

    // Start all tasks
    this.scheduler.startAll();
    this.scheduler.listTasks();

    console.log('🕐 Scheduler started');
  }

  async testConnections() {
    console.log('🔍 Testing connections...');
    
    await this.telegram.testConnection();
    await this.email.testConnection();
    await this.slack.testConnection();
  }

  async shutdown() {
    console.log('👋 Shutting down...');
    this.scheduler.stopAll();
    this.db.close();
  }
}

// CLI interface
const system = new DailyBriefingSystem();

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  // Ensure data directory exists
  const dataDir = join(__dirname, '../../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  switch (command) {
    case 'fetch':
      await system.fetchArticles();
      break;
      
    case 'process':
      await system.processArticles();
      break;
      
    case 'briefing':
      const articles = await system.generateBriefing();
      await system.publishBriefing(articles);
      break;
      
    case 'run':
      await system.runDailyBriefing();
      break;
      
    case 'schedule':
      system.startScheduler();
      // Keep process running
      console.log('Press Ctrl+C to stop');
      break;
      
    case 'test':
      await system.testConnections();
      break;
      
    default:
      console.log(`
Daily Briefing System CLI

Usage: node src/index.js <command>

Commands:
  fetch      - Fetch articles from RSS feeds
  process    - Process articles with AI
  briefing   - Generate and publish briefing
  run        - Run complete daily briefing workflow
  schedule   - Start scheduler (daemon mode)
  test       - Test channel connections

Examples:
  node src/index.js run
  node src/index.js schedule
      `);
  }

  if (command !== 'schedule') {
    system.shutdown();
  }
}

main().catch(console.error);

export default DailyBriefingSystem;
