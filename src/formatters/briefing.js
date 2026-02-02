#!/usr/bin/env node

/**
 * Briefing Formatter
 * Formats articles into readable briefings
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BriefingFormatter {
  constructor() {
    this.categories = {
      'AI/ML': '🤖',
      '创业': '💼',
      '安全': '🔒',
      '开发': '💻',
      '基础设施': '🏗️',
      '数据分析': '📊',
      '其他': '📚'
    };
  }

  formatDailyBriefing(articles, date = new Date()) {
    const dateStr = this.formatDate(date);
    const grouped = this.groupByCategory(articles);
    
    let markdown = `# 每日技术简报 - ${dateStr}\n\n`;
    markdown += `今日收录 ${articles.length} 篇文章\n\n`;
    markdown += `---\n\n`;

    for (const [category, articles] of Object.entries(grouped)) {
      if (articles.length === 0) continue;
      
      const emoji = this.categories[category] || '📚';
      markdown += `## ${emoji} ${category}\n\n`;
      
      for (const article of articles) {
        markdown += `### ${article.title}\n`;
        if (article.author) {
          markdown += `**作者**: ${article.author} | `;
        }
        markdown += `**来源**: ${article.blogName}\n\n`;
        
        if (article.summary) {
          markdown += `${article.summary}\n\n`;
        }
        
        markdown += `[阅读原文](${article.url})\n\n`;
        markdown += `---\n\n`;
      }
    }

    markdown += `\n**AI 摘要** | **智能分类** | **重要性评分**\n`;
    markdown += `\n由 [Daily Briefing System](https://github.com/alijiujiu123/daily-briefing-system) 自动生成`;

    return markdown;
  }

  formatTelegramBriefing(articles, date = new Date()) {
    const dateStr = this.formatDate(date);
    const grouped = this.groupByCategory(articles);
    
    let text = `📅 *每日技术简报 - ${dateStr}*\n\n`;
    text += `今日收录 ${articles.length} 篇文章\n\n`;

    // Select top articles (importance >= 7)
    const topArticles = articles.filter(a => (a.importanceScore || 0) >= 7).slice(0, 5);
    
    if (topArticles.length > 0) {
      text += `🔥 *今日重点*\n\n`;
      for (const article of topArticles) {
        const emoji = this.categories[article.category] || '📚';
        text += `${emoji} *${article.title}*\n`;
        if (article.summary) {
          text += `_${article.summary.substring(0, 100)}..._\n`;
        }
        text += `[阅读](${article.url})\n\n`;
      }
      text += `\n`;
    }

    // Show categories
    for (const [category, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;
      const emoji = this.categories[category] || '📚';
      text += `${emoji} *${category}*: ${items.length} 篇\n`;
    }

    text += `\n_由 Daily Briefing System 自动生成_`;

    return text;
  }

  formatEmailBriefing(articles, date = new Date()) {
    // For email, use HTML format
    const dateStr = this.formatDate(date);
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
    .category { margin-bottom: 30px; }
    .category-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #667eea; }
    .article { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .article-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
    .article-meta { font-size: 12px; color: #6c757d; margin-bottom: 8px; }
    .article-summary { font-size: 14px; line-height: 1.5; }
    .article-link { display: inline-block; margin-top: 10px; color: #667eea; text-decoration: none; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 每日技术简报</h1>
      <p>${dateStr} | 收录 ${articles.length} 篇文章</p>
    </div>
`;

    const grouped = this.groupByCategory(articles);
    
    for (const [category, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;
      
      const emoji = this.categories[category] || '📚';
      html += `    <div class="category">
      <div class="category-title">${emoji} ${category}</div>
`;
      
      for (const article of items) {
        html += `      <div class="article">
        <div class="article-title">${this.escapeHtml(article.title)}</div>
        <div class="article-meta">${article.author ? this.escapeHtml(article.author) + ' | ' : ''}${this.escapeHtml(article.blogName)}</div>
        <div class="article-summary">${this.escapeHtml(article.summary || '暂无摘要')}</div>
        <a href="${article.url}" class="article-link">阅读原文 →</a>
      </div>
`;
      }
      
      html += `    </div>
`;
    }

    html += `    <div class="footer">
      <p>由 Daily Briefing System 自动生成 | <a href="https://github.com/alijiujiu123/daily-briefing-system">GitHub</a></p>
    </div>
  </div>
</body>
</html>`;

    return html;
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

    // Sort articles by importance within each category
    for (const category of Object.keys(grouped)) {
      grouped[category].sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));
    }

    return grouped;
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}年${month}月${day}日 ${weekday}`;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

export default BriefingFormatter;
