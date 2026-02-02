#!/usr/bin/env node

/**
 * Telegram Publisher
 */

import TelegramBot from 'node-telegram-bot-api';

class TelegramPublisher {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!this.token) {
      console.warn('⚠️  TELEGRAM_BOT_TOKEN not set, Telegram publishing disabled');
      this.enabled = false;
      return;
    }
    
    this.bot = new TelegramBot(this.token, { polling: false });
    this.enabled = true;
  }

  async sendBriefing(text) {
    if (!this.enabled || !this.chatId) {
      console.warn('⚠️  Telegram publishing not configured');
      return false;
    }

    try {
      await this.bot.sendMessage(this.chatId, text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });
      
      console.log('✅ Briefing sent to Telegram');
      return true;
    } catch (error) {
      console.error('❌ Failed to send briefing:', error.message);
      return false;
    }
  }

  async testConnection() {
    if (!this.enabled) {
      console.warn('⚠️  Telegram not configured');
      return false;
    }

    try {
      await this.bot.getMe();
      console.log('✅ Telegram connection OK');
      return true;
    } catch (error) {
      console.error('❌ Telegram connection failed:', error.message);
      return false;
    }
  }
}

export default TelegramPublisher;
