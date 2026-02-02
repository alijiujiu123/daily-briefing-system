#!/usr/bin/env node

/**
 * Slack Publisher
 */

import { WebClient } from '@slack/web-api';

class SlackPublisher {
  constructor() {
    this.token = process.env.SLACK_BOT_TOKEN;
    this.channel = process.env.SLACK_CHANNEL || '#daily-briefing';
    
    if (!this.token) {
      console.warn('⚠️  SLACK_BOT_TOKEN not set, Slack publishing disabled');
      this.enabled = false;
      return;
    }
    
    this.client = new WebClient(this.token);
    this.enabled = true;
  }

  async sendBriefing(blocks, text) {
    if (!this.enabled) {
      console.warn('⚠️  Slack publishing not configured');
      return false;
    }

    try {
      await this.client.chat.postMessage({
        channel: this.channel,
        text: text,
        blocks: blocks
      });
      
      console.log('✅ Briefing sent to Slack');
      return true;
    } catch (error) {
      console.error('❌ Failed to send to Slack:', error.message);
      return false;
    }
  }

  formatAsSlackBlocks(articles, date) {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📅 每日技术简报 - ${date}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `今日收录 *${articles.length}* 篇文章`
        }
      },
      {
        type: 'divider'
      }
    ];

    const grouped = this.groupByCategory(articles);
    
    for (const [category, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${category}* (${items.length} 篇)`
        }
      });

      for (const article of items.slice(0, 3)) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• <${article.url}|${article.title}>`
          }
        });
      }
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '由 Daily Briefing System 自动生成'
        }
      ]
    });

    return blocks;
  }

  async testConnection() {
    if (!this.enabled) {
      console.warn('⚠️  Slack not configured');
      return false;
    }

    try {
      await this.client.auth.test();
      console.log('✅ Slack connection OK');
      return true;
    } catch (error) {
      console.error('❌ Slack connection failed:', error.message);
      return false;
    }
  }

  groupByCategory(articles) {
    const grouped = {};
    for (const article of articles) {
      const category = article.category || '其他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(article);
    }
    return grouped;
  }
}

export default SlackPublisher;
