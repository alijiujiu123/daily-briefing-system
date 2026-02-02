#!/usr/bin/env node

/**
 * AI Content Processor
 * Uses Zhipu AI to generate summaries and classify articles
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AIProcessor {
  constructor() {
    this.apiKey = process.env.ZHIPU_API_KEY;
    this.model = process.env.ZHIPU_MODEL || 'GLM-4.7';
    
    if (!this.apiKey) {
      throw new Error('ZHIPU_API_KEY is required');
    }
  }

  async generateSummary(article) {
    const prompt = this.buildSummaryPrompt(article);
    
    try {
      const response = await this.callZhipuAPI([
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ]);

      return this.parseSummaryResponse(response);
    } catch (error) {
      console.error('❌ Failed to generate summary:', error.message);
      return null;
    }
  }

  getSystemPrompt() {
    return `你是一个技术文章摘要助手。你的任务是：
1. 阅读技术文章内容
2. 生成简洁的中文摘要（100-150字）
3. 分类文章（AI/ML, 创业, 安全, 开发, 基础设施, 数据分析, 其他）
4. 评分重要性（1-10分，基于原创性、实用性、影响力）

输出格式（JSON）：
{
  "summary": "摘要内容",
  "category": "分类",
  "importance": 8
}`;
  }

  buildSummaryPrompt(article) {
    return `请为以下文章生成摘要：

标题: ${article.title}
作者: ${article.author || '未知'}
来源: ${article.blogName}
发布时间: ${article.publishedAt}

内容:
${article.content ? article.content.substring(0, 3000) : '无内容'}

链接: ${article.url}`;
  }

  async callZhipuAPI(messages) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zhipu API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  parseSummaryResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parse manually
      return {
        summary: response.substring(0, 200),
        category: '其他',
        importance: 5
      };
    } catch (error) {
      console.error('❌ Failed to parse summary response:', error.message);
      return null;
    }
  }

  async batchProcess(articles, concurrency = 3) {
    console.log(`🤖 Processing ${articles.length} articles with AI...`);
    
    const results = [];
    const batches = [];
    
    // Split into batches
    for (let i = 0; i < articles.length; i += concurrency) {
      batches.push(articles.slice(i, i + concurrency));
    }

    let processed = 0;
    for (const batch of batches) {
      const promises = batch.map(async (article) => {
        try {
          const result = await this.generateSummary(article);
          processed++;
          
          if (processed % 10 === 0) {
            console.log(`  Processed ${processed}/${articles.length} articles`);
          }
          
          return { article, result };
        } catch (error) {
          console.error(`❌ Failed to process article ${article.id}:`, error.message);
          return { article, result: null };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Rate limiting: wait 1 second between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Processed ${results.length} articles`);
    return results;
  }
}

export default AIProcessor;
