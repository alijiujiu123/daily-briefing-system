# Daily Briefing System - 架构设计

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Telegram │  │  Email   │  │  Slack   │  │   Web    │   │
│  │   Bot    │  │ Subscriber│  │  Webhook │  │   API    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼─────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Scheduler   │  │  Processor   │  │  Formatter   │     │
│  │  (node-cron) │  │   (AI/LLM)   │  │  (Templates) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
┌─────────┴──────────────────┴──────────────────┴────────────┐
│                       Data Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ RSS Fetcher│  │  Database  │  │   Cache    │           │
│  │(rss-parser)│  │  (SQLite)  │  │  (Redis?)  │           │
│  └──────┬─────┘  └──────┬─────┘  └────────────┘           │
└─────────┼─────────────────┼─────────────────────────────────┘
          │                 │
┌─────────┴─────────────────┴─────────────────────────────────┐
│                   External Services                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ RSS Feeds│  │ 智谱 AI  │  │ Telegram │  │   SMTP   │   │
│  │ (100+)   │  │(GLM-4.7) │  │   API    │  │  Email   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 数据流

### 1. 文章抓取流程

```
OPML 文件
   ↓
parseOPML()
   ↓
RSS URLs (100+)
   ↓
fetchFeed(url) [并发]
   ↓
Articles (原始数据)
   ↓
去重 (基于 link)
   ↓
存储到 SQLite
```

### 2. 处理流程

```
Database (新文章)
   ↓
ArticleProcessor.process()
   ↓
[可选] AI 摘要生成
   ↓
[可选] AI 分类
   ↓
Processed Articles
```

### 3. 推送流程

```
Processed Articles
   ↓
BriefingFormatter.format()
   ↓
Markdown/HTML
   ↓
Publisher.publish()
   ↓
Telegram/Email/Slack
```

## 核心模块

### RSSFetcher

**职责：**
- 解析 OPML 文件
- 抓取 RSS feeds
- 并发控制
- 错误处理

**接口：**
```javascript
class RSSFetcher {
  async parseOPML()
  async fetchFeed(url)
  async fetchAll()
}
```

### ArticleProcessor

**职责：**
- 调用 AI API
- 生成摘要
- 分类文章
- 评分

**接口：**
```javascript
class ArticleProcessor {
  async process(articles)
  async generateSummary(article)
  async classify(article)
  async score(article)
}
```

### BriefingFormatter

**职责：**
- 应用模板
- 格式化输出
- 多格式支持

**接口：**
```javascript
class BriefingFormatter {
  async format(articles, template)
  toMarkdown(articles)
  toHTML(articles)
}
```

### Publisher

**职责：**
- 多渠道推送
- 失败重试
- 发送记录

**接口：**
```javascript
class Publisher {
  async publish(briefing)
  async toTelegram(message)
  async toEmail(message)
  async toSlack(message)
}
```

## 数据库设计

### articles 表

```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  link TEXT UNIQUE NOT NULL,
  pub_date DATETIME,
  content TEXT,
  creator TEXT,
  guid TEXT,
  summary TEXT,
  category TEXT,
  score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT 0
);

CREATE INDEX idx_link ON articles(link);
CREATE INDEX idx_pub_date ON articles(pub_date);
CREATE INDEX idx_processed ON articles(processed);
```

### briefings 表

```sql
CREATE TABLE briefings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE UNIQUE NOT NULL,
  content TEXT NOT NULL,
  article_count INTEGER,
  sent BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### subscriptions 表

```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  telegram_chat_id TEXT UNIQUE,
  slack_channel_id TEXT,
  preferences JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## AI 集成

### 智谱 API 调用

```javascript
import fetch from 'node-fetch';

async function callGLM(prompt) {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GLM-4.7',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  return response.json();
}
```

### Prompt 模板

**摘要生成：**
```
请用中文为以下文章生成100-200字的摘要，保持关键信息：

标题：{title}
作者：{creator}
内容：{content}

摘要：
```

**分类：**
```
将以下文章分类到以下类别之一：
- AI & 机器学习
- 前端开发
- 后端开发
- 创业
- 安全
- 其他

标题：{title}
内容：{content}

分类（只输出类别名称）：
```

## 性能优化

### 1. RSS 抓取优化

- **批量并发**：每批 10 个 feed
- **超时控制**：每个 feed 最多 10 秒
- **增量更新**：只抓取最近 24 小时

### 2. AI 处理优化

- **批量调用**：合并多个文章的请求
- **缓存**：相同内容不重复调用
- **队列**：使用队列控制并发

### 3. 数据库优化

- **索引**：在常用查询字段上建索引
- **连接池**：复用数据库连接
- **批量插入**：使用事务

## 安全考虑

1. **API 密钥管理**
   - 使用环境变量
   - 不要提交到 Git
   - 定期轮换

2. **输入验证**
   - 验证 RSS 内容
   - 防止 XSS 攻击
   - URL 白名单

3. **速率限制**
   - API 调用限流
   - 发送频率控制

## 监控和日志

```javascript
// 日志级别
logger.debug('Detailed debug info');
logger.info('General information');
logger.warn('Warning messages');
logger.error('Error messages');

// 结构化日志
logger.info('Article fetched', {
  url: article.link,
  source: article.creator,
  pubDate: article.pubDate
});
```

## 部署架构

### 开发环境
```
本地 Node.js + SQLite
```

### 生产环境
```
Docker Container
  ├── Node.js App
  ├── SQLite 数据卷
  └── 环境变量配置
```

### 云平台部署
```
负载均衡
  ├── 容器 1
  ├── 容器 2
  └── 容器 N

共享数据库（PostgreSQL）
任务队列（Redis/Cloud Tasks）
```
