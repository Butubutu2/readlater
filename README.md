# ReadLater — 稍后观看

> 碎片时间刷到感兴趣的内容，一键收藏，AI 自动分类整理，有空再看。

## 截图预览

| 登录页 | 主页（有内容） | 已读页 | 搜索页 |
|:-----:|:-------------:|:------:|:------:|
| <img src="https://via.placeholder.com/200x400?text=Auth" width="200"> | <img src="https://via.placeholder.com/200x400?text=Home" width="200"> | <img src="https://via.placeholder.com/200x400?text=Read" width="200"> | <img src="https://via.placeholder.com/200x400?text=Search" width="200"> |

> 静态预览文件在 `preview/` 目录，直接用浏览器打开即可查看。

## 功能

- **📥 一键收藏** — 粘贴链接，自动获取标题和封面图
- **🤖 AI 自动分类** — 多模态模型根据标题 + 封面图自动打标签和写摘要
- **🏷️ 标签管理** — 按标签分区浏览未读内容，支持自定义标签
- **⏰ 3 天未读提醒** — 收藏超过 3 天未读的内容用色条醒目提示（越久越醒目）
- **📖 已读标记** — 点击卡片自动标记已读并跳转原文
- **🔍 多维度搜索** — 按关键词、标签、平台、状态组合筛选
- **🗑️ 整理操作** — 支持删除、标记未读
- **📱 移动端优先** — 极简设计，适合碎片时间使用

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 14 (App Router) |
| 样式 | Tailwind CSS |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth（邮箱密码） |
| AI 分类 | 智谱 GLM-4V-Flash（多模态） |
| 部署 | Vercel |

## 快速开始

### 前置条件

- Node.js 18+
- [Supabase](https://supabase.com) 项目（免费计划即可）
- [智谱开放平台](https://open.bigmodel.cn) API Key（GLM-4V-Flash 目前免费）

### 1. 克隆

```bash
git clone https://github.com/Butubutu2/readlater.git
cd readlater
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key

# 智谱 GLM-4V-Flash
ZHIPU_API_KEY=你的智谱API密钥
```

Supabase 的 URL 和 anon key 在项目 Settings → API 中获取。
智谱 API Key 在 [open.bigmodel.cn](https://open.bigmodel.cn) → API 密钥 中获取。

### 3. 初始化数据库

在 Supabase 项目的 **SQL Editor** 中执行 `supabase/schema.sql` 的全部内容，会自动创建所有表、索引、触发器和行级安全策略。

### 4. 启动

```bash
npm run dev
```

打开 http://localhost:3000

### 5. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FButubutu2%2Freadlater)

在 Vercel 项目设置中添加与 `.env.local` 相同的环境变量即可。

## 项目结构

```
readlater/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 主页（录入 + 标签分区）
│   │   ├── auth/page.tsx         # 登录/注册
│   │   ├── read/page.tsx         # 已读内容
│   │   ├── search/page.tsx       # 搜索
│   │   ├── go/route.ts           # 中间跳转页（标记已读+302）
│   │   ├── not-found.tsx         # 404
│   │   ├── error.tsx             # 通用错误
│   │   └── api/
│   │       ├── parse/            # POST 解析链接元数据
│   │       ├── classify/         # POST AI 分类
│   │       └── items/            # CRUD + 分页
│   ├── components/
│   │   ├── AuthForm.tsx          # 登录/注册表单
│   │   ├── LinkInput.tsx         # 链接输入框
│   │   ├── CategoryConfirm.tsx   # AI 分类确认弹窗
│   │   ├── ItemCard.tsx          # 内容卡片
│   │   ├── TagSection.tsx        # 标签区块
│   │   └── EmptyState.tsx        # 空状态
│   ├── lib/
│   │   ├── supabase-client.ts    # 浏览器端 Supabase
│   │   ├── supabase-server.ts    # 服务端 Supabase
│   │   ├── normalize-url.ts      # URL 规范化
│   │   ├── parse-metadata.ts     # 页面元数据解析
│   │   ├── glm.ts                # 智谱 API 封装
│   │   └── types.ts              # 类型定义
│   └── middleware.ts             # Auth 中间件
├── supabase/
│   └── schema.sql                # 数据库建表语句
├── preview/                      # 静态 HTML 预览
└── README.md
```

## URL 规范化

服务端自动处理，用户无感知：

| 平台 | 规则 |
|------|------|
| 微信公众号 | 保留 `/s/{id}`，去除所有查询参数 |
| B 站 | 保留 `/video/{BV号}`，去除分 P 参数 |
| 抖音 | 提取短链标识符，零 HTTP 请求，去重 100% 可靠 |
| 通用 | 统一 HTTPS，去除 `utm_*` 等追踪参数 |

## 设计原则

- **回到原平台消费** — 本站只做收藏和整理，不搬运内容
- **减少操作成本** — 能一步解决不要第二步
- **极简设计** — 弱化非内容元素，注意力集中在内容本身
- **移动端优先** — 其次 PC 端

## License

MIT
