# Daily Briefing System

> 🤖 AI 驱动的每日技术简报系统 - 从 100+ 优质技术博客自动抓取、摘要并推送

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org)
[![AI](https://img.shields.io/badge/AI-GLM--4.7-blue)](https://open.bigmodel.cn/)

## ✨ 特性

- 📡 **RSS 抓取** - 从 Hacker News Top 100+ 技术博客抓取最新文章
- 🤖 **AI 摘要** - 使用智谱 GLM-4.7 生成中文摘要
- 📊 **智能分类** - 自动分类：AI/ML、创业、安全、开发、基础设施等
- 🎯 **重要性评分** - 基于原创性、实用性、影响力自动评分
- 📱 **多渠道推送** - 支持 Telegram、Email、Slack
- ⏰ **定时任务** - 灵活的 Cron 调度
- 💾 **数据持久化** - SQLite 数据库存储
- 🎨 **多种格式** - Markdown、Telegram、HTML Email、Slack Blocks

## 🚀 快速开始

### 1. 安装

```bash
git clone https://github.com/alijiujiu123/daily-briefing-system.git
cd daily-briefing-system
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

必需配置：
```bash
# 智谱 AI
ZHIPU_API_KEY=your_api_key_here

# 数据库
DATABASE_URL=sqlite:data/briefing.db

# 至少配置一个推送渠道
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. 初始化数据库

```bash
npm run db:init
```

### 4. 运行

```bash
# 手动运行一次完整流程
npm start

# 或者分步运行
npm run fetch          # 仅抓取文章
npm start process      # 仅 AI 处理
npm start briefing     # 仅生成简报
```

### 5. 启动定时任务

```bash
npm start schedule
```

默认调度：
- 每日简报：每天早上 8 点
- 文章抓取：每 2 小时

## 📋 数据源

基于 [Hacker News Most Popular Blogs 2025](https://gist.github.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b)

包含博客：
- Andrej Karpathy (AI/ML)
- Paul Graham (创业)
- Simon Willison (技术)
- Troy Hunt (安全)
- Gwern Branwen (AI研究)
- Mitchell Hashimoto (基础设施)
- 等等...

## 🎯 系统架构

```
┌─────────────┐
│ RSS Feeds   │ 100+ 技术博客
│ (100+)      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Fetcher     │ 定时抓取新文章
│ (Cron)      │ 每 2 小时
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Processor   │ AI 摘要生成
│ (GLM-4.7)   │ 分类 + 评分
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Formatter   │ 生成简报
│             │ Markdown/HTML/Telegram/Slack
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Publisher   │ 推送到各渠道
│             │ Telegram/Email/Slack
└─────────────┘
```

## 📝 简报格式

### Markdown

```markdown
# 每日技术简报 - 2026年2月2日 周一

今日收录 15 篇文章

---

## 🤖 AI & 机器学习

### GPT-2 训练成本 7 年降低 600 倍
**作者**: Andrej Karpathy | **来源**: Blog

2019 年训练 GPT-2 需要 $43K (168 小时)，现在只需 ~$73 (3.04 小时)，成本每年下降约 2.5 倍...

[阅读原文](https://...)
```

### Telegram

```
📅 *每日技术简报 - 2026年2月2日*

今日收录 15 篇文章

🔥 *今日重点*

🤖 *GPT-2 训练成本大幅下降*
_2019 年训练 GPT-2 需要 $43K..._
[阅读](https://...)

📚 *其他* (3 篇)
💻 *开发* (5 篇)
...
```

## 🔧 配置选项

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ZHIPU_API_KEY` | 智谱 AI API Key | 必需 |
| `ZHIPU_MODEL` | 模型名称 | `GLM-4.7` |
| `DATABASE_URL` | 数据库路径 | `sqlite:data/briefing.db` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | 可选 |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | 可选 |
| `SMTP_HOST` | SMTP 服务器 | 可选 |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `FETCH_SCHEDULE` | 抓取时间 Cron | `0 8 * * *` |
| `BRIEFING_TIMEZONE` | 时区 | `Asia/Shanghai` |
| `MAX_ARTICLES_PER_DAY` | 每日最大文章数 | `20` |

### 调度配置

Cron 表达式格式：
```
┌───────────── 分钟 (0-59)
│ ┌─────────── 小时 (0-23)
│ │ ┌───────── 日期 (1-31)
│ │ │ ┌─────── 月份 (1-12)
│ │ │ │ ┌───── 星期 (0-6, 周日=0)
│ │ │ │ │
* * * * *
```

示例：
- `0 8 * * *` - 每天早上 8 点
- `0 */2 * * *` - 每 2 小时
- `0 9 * * 1-5` - 周一到周五早上 9 点

## 🛠️ 开发

### 项目结构

```
daily-briefing-system/
├── src/
│   ├── fetchers/        # RSS 抓取
│   ├── processors/      # AI 处理
│   ├── formatters/      # 格式化
│   ├── publishers/      # 推送
│   ├── scheduler/       # 调度
│   ├── db/              # 数据库
│   └── index.js         # 主入口
├── data/
│   ├── feeds.opml       # RSS 源列表
│   └── briefing.db      # SQLite 数据库
├── tests/               # 测试
├── docs/                # 文档
└── package.json
```

### 添加新的 RSS 源

编辑 `data/feeds.opml`：

```xml
<outline text="Blog Name" 
         title="Blog Name" 
         type="rss" 
         xmlUrl="https://blog.com/feed.xml" 
         htmlUrl="https://blog.com/"/>
```

### 自定义分类

编辑 `src/processors/ai.cjs` 中的 `getSystemPrompt()` 方法。

## 📊 数据库 Schema

### Articles
- `id` - 主键
- `url` - 文章链接（唯一）
- `title` - 标题
- `author` - 作者
- `blog_name` - 来源博客
- `published_at` - 发布时间
- `fetched_at` - 抓取时间
- `content` - 原始内容
- `summary` - AI 摘要
- `category` - 分类
- `importance_score` - 重要性评分
- `processed` - 是否已处理

### Briefings
- `id` - 主键
- `date` - 日期（唯一）
- `content` - Markdown 内容
- `article_count` - 文章数量
- `sent_*` - 各渠道发送状态

## 🧪 测试

```bash
# 测试数据库
npm run db:init

# 测试抓取
npm run fetch

# 测试 AI 处理
npm start process

# 测试推送连接
npm start test
```

## 🚀 部署

### Docker

```bash
docker build -t daily-briefing .
docker run -d \
  --name daily-briefing \
  --env-file .env \
  -v briefing-data:/app/data \
  daily-briefing
```

### Systemd Service

```ini
[Unit]
Description=Daily Briefing System
After=network.target

[Service]
Type=simple
User=briefing
WorkingDirectory=/opt/daily-briefing-system
ExecStart=/usr/bin/node src/index.js schedule
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 🔗 相关链接

- [OpenClaw](https://openclaw.ai/) - AI 助手平台
- [智谱 AI](https://open.bigmodel.cn/) - GLM-4.7 模型
- [Hacker News](https://news.ycombinator.com/) - 技术社区
- [Simon Willison's OPML](https://gist.github.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b)

---

**Made with ❤️ by OpenClaw Community**
