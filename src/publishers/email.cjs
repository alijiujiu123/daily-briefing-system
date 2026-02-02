#!/usr/bin/env node

/**
 * Email Publisher
 */

import nodemailer from 'nodemailer';

class EmailPublisher {
  constructor() {
    this.host = process.env.SMTP_HOST;
    this.port = parseInt(process.env.SMTP_PORT || '587');
    this.user = process.env.SMTP_USER;
    this.pass = process.env.SMTP_PASS;
    this.from = process.env.EMAIL_FROM || 'Daily Briefing <noreply@dailybriefing.ai>';
    this.to = process.env.EMAIL_TO || this.user;
    
    if (!this.host || !this.user || !this.pass) {
      console.warn('⚠️  SMTP not configured, email publishing disabled');
      this.enabled = false;
      return;
    }
    
    this.transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.port === 465,
      auth: {
        user: this.user,
        pass: this.pass
      }
    });
    
    this.enabled = true;
  }

  async sendBriefing(html, text, date) {
    if (!this.enabled) {
      console.warn('⚠️  Email publishing not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: `📅 每日技术简报 - ${date}`,
        text: text,
        html: html
      });
      
      console.log('✅ Briefing sent via email');
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return false;
    }
  }

  async testConnection() {
    if (!this.enabled) {
      console.warn('⚠️  Email not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection OK');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      return false;
    }
  }
}

export default EmailPublisher;
