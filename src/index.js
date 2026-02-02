#!/usr/bin/env node

/**
 * Daily Briefing System
 * Main entry point
 */

import cron from 'node-cron';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Import services
import { RSSFetcher } from './fetchers/rss-fetcher.js';
import { ArticleProcessor } from './processors/article-processor.js';
import { BriefingFormatter } from './formatters/briefing-formatter.js';
import { TelegramPublisher } from './publishers/telegram-publisher.js';

class BriefingSystem {
  constructor() {
    this.fetcher = new RSSFetcher();
    this.processor = new ArticleProcessor();
    this.formatter = new BriefingFormatter();
    this.publisher = new TelegramPublisher();
  }

  async run() {
    logger.info('Starting Daily Briefing System...');

    try {
      // Fetch articles
      const articles = await this.fetcher.fetchAll();
      logger.info(`Fetched ${articles.length} articles`);

      // Process articles
      const processed = await this.processor.process(articles);
      logger.info(`Processed ${processed.length} articles`);

      // Format briefing
      const briefing = await this.formatter.format(processed);

      // Publish
      await this.publisher.publish(briefing);
      logger.info('Briefing published successfully');

    } catch (error) {
      logger.error('Error running briefing system:', error);
    }
  }

  start() {
    const schedule = process.env.FETCH_SCHEDULE || '0 8 * * *';
    const timezone = process.env.TIMEZONE || 'Asia/Shanghai';

    logger.info(`Scheduler configured: ${schedule} (${timezone})`);

    // Run immediately on start
    this.run();

    // Schedule runs
    cron.schedule(schedule, () => {
      this.run();
    }, {
      timezone: timezone
    });
  }
}

// Start the system
const system = new BriefingSystem();
system.start();

logger.info('Daily Briefing System started');
