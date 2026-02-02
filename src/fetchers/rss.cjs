#!/usr/bin/env node

/**
 * RSS Feed Fetcher
 * Fetches articles from RSS feeds
 */

import Parser from 'rss-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import xml2js from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['author', 'author'],
      ['content:encoded', 'content']
    ]
  }
});

class RSSFetcher {
  constructor() {
    this.feeds = [];
    this.loadFeeds();
  }

  loadFeeds() {
    try {
      const opmlPath = join(__dirname, '../../data/feeds.opml');
      const opmlContent = readFileSync(opmlPath, 'utf-8');
      
      xml2js.parseString(opmlContent, { explicitArray: false }, (err, result) => {
        if (err) {
          console.error('❌ Failed to parse OPML:', err);
          return;
        }

        const outlines = result.opml.body.outline;
        const feeds = Array.isArray(outlines) ? outlines : [outlines];
        
        this.feeds = feeds.map(feed => ({
          title: feed.$.title || feed.$.text,
          xmlUrl: feed.$.xmlUrl,
          htmlUrl: feed.$.htmlUrl
        })).filter(feed => feed.xmlUrl);

        console.log(`✅ Loaded ${this.feeds.length} RSS feeds`);
      });
    } catch (error) {
      console.error('❌ Failed to load feeds:', error);
    }
  }

  async fetchFeed(feedUrl) {
    try {
      const feed = await parser.parseURL(feedUrl);
      return {
        title: feed.title,
        description: feed.description,
        items: feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          author: item.author || item.creator,
          content: item.content || item['content:encoded'] || item.contentSnippet,
          blogName: feed.title
        }))
      };
    } catch (error) {
      console.error(`❌ Failed to fetch feed ${feedUrl}:`, error.message);
      return null;
    }
  }

  async fetchAll(since = null) {
    console.log(`📡 Fetching ${this.feeds.length} RSS feeds...`);
    
    const cutoffTime = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const articles = [];

    for (const feed of this.feeds) {
      try {
        const feedData = await this.fetchFeed(feed.xmlUrl);
        if (!feedData) continue;

        for (const item of feedData.items) {
          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
          
          // Only include articles published after cutoff time
          if (pubDate >= cutoffTime) {
            articles.push({
              url: item.link,
              title: item.title,
              author: item.author,
              blogName: item.blogName,
              publishedAt: pubDate,
              content: item.content
            });
          }
        }

        // Rate limiting: wait 100ms between feeds
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error processing ${feed.title}:`, error.message);
      }
    }

    console.log(`✅ Fetched ${articles.length} articles`);
    return articles;
  }

  async fetchSingle(feedUrl) {
    return await this.fetchFeed(feedUrl);
  }
}

export default RSSFetcher;
