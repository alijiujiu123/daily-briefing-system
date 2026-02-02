# Contributing to Daily Briefing System

感谢你的贡献！🎉

## 如何贡献

### 报告 Bug

创建 GitHub Issue，包含：
- Bug 描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（OS, Node.js 版本）

### 提交功能

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

**代码风格：**
- 使用 ES Modules
- 2 空格缩进
- 单引号
- 分号结尾

**提交信息：**
```
type(scope): subject

body

footer
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建

示例：
```
feat(fetcher): add concurrent RSS fetching

- Implement batch fetching
- Add rate limiting
- Improve error handling

Closes #123
```

### 测试

```bash
# 运行测试
npm test

# 运行单个测试文件
node --test tests/rss-fetcher.test.js
```

### 文档

更新相关文档：
- README.md - 功能变更
- docs/ROADMAP.md - 进度更新
- 代码注释 - 复杂逻辑

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/alijiujiu123/daily-briefing-system.git
cd daily-briefing-system

# 安装依赖
npm install

# 配置环境
cp .env.example .env
# 编辑 .env

# 运行
npm start
```

## 项目结构

```
src/
├── fetchers/       # RSS 抓取
├── processors/     # AI 处理
├── formatters/     # 格式化
├── publishers/     # 推送
├── scheduler/      # 调度
├── db/            # 数据库
└── utils/         # 工具
```

## 优先事项

当前最需要帮助的领域：

1. ⭐ **RSS Fetcher 优化**
   - 增量更新
   - 更好的错误处理
   - 性能优化

2. ⭐ **AI Processor**
   - 智谱 API 集成
   - 摘要生成
   - 分类识别

3. ⭐ **Telegram Publisher**
   - Bot 集成
   - 消息格式化

## 问题反馈

- GitHub Issues: https://github.com/alijiujiu123/daily-briefing-system/issues
- Discussions: https://github.com/alijiujiu123/daily-briefing-system/discussions

## 行为准则

- 尊重他人
- 欢迎新手
- 建设性反馈
- 专注于项目

再次感谢你的贡献！🙏
