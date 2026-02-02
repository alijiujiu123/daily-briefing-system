/**
 * RSS Fetcher
 * Fetch articles from RSS feeds
 */

import Parser from 'rss-parser';
import { readFile } from 'fs/promises';
import { logger } from '../utils/logger.js';

export class RSSFetcher {
  constructor() {
    this.parser = new Parser();
    this.feedsFile = 'data/feeds.opml';
  }

  /**
   * Parse OPML file to extract RSS URLs
   */
  async parseOPML() {
    try {
      const content = await readFile(this.feedsFile, 'utf-8');
      const urls = [];

      // Extract xmlUrl attributes using regex
      const regex = /xmlUrl="([^"]+)"/g;
      let match;

      while ((match = regex.exec(content)) !== null) {
        urls.push(match[1]);
      }

      logger.info(`Found ${urls.length} RSS feeds`);
      return urls;
    } catch (error) {
      logger.error('Error parsing OPML:', error);
      throw error;
    }
  }

  /**
   * Fetch single RSS feed
   */
  async fetchFeed(url) {
    try {
      const feed = await this.parser.parseURL(url);
      return feed.items || [];
    } catch (error) {
      logger.warn(`Failed to fetch ${url}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch all feeds concurrently
   */
  async fetchAll() {
    const urls = await this.parseOPML();
    const allArticles = [];

    // Fetch in batches to avoid overwhelming servers
    const batchSize = 10;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      logger.info(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)}`);

      const promises = batch.map(url => this.fetchFeed(url));
      const results = await Promise.all(promises);

      // Flatten results
      results.flat().forEach(article => {
        if (article.link) {
          allArticles.push({
            title: article.title || 'Untitled',
            link: article.link,
            pubDate: article.pubDate || new Date(),
            content: article.contentSnippet || article.content || '',
            creator: article.creator || article.author || 'Unknown',
            guid: article.guid || article.link
          });
        }
      });
    }

    // Deduplicate by link
    const seen = new Set();
    const unique = allArticles.filter(article => {
      if (seen.has(article.link)) {
        return false;
      }
      seen.add(article.link);
      return true;
    });

    logger.info(`Fetched ${unique.length} unique articles from ${urls.length} feeds`);
    return unique;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new RSSFetcher();
  const articles = await fetcher.fetchAll();
  console.log(`Fetched ${articles.length} articles`);
  console.log('Sample:', articles[0]);
}
