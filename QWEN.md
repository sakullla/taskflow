# TaskFlow - 项目指南

## 项目概述

TaskFlow 是一个全栈待办事项应用，采用现代化的移动优先设计理念，支持 PWA 特性和国际化。

### 技术栈

**前端 (apps/web)**
- React 18 + TypeScript + Vite 7
- Tailwind CSS 4 + Framer Motion (动画)
- Zustand (状态管理) + React Query (数据获取)
- i18next (国际化: `en`, `zh-CN`)
- Lucide React (图标库)
- PWA 支持 (vite-plugin-pwa)

**后端 (apps/api)**
- Fastify 5 + TypeScript
- Prisma ORM + 多数据库支持 (SQLite/PostgreSQL/MySQL)
- JWT 认证 + bcryptjs 密码加密
- Zod 请求验证 + Swagger API 文档

**测试**
- Playwright (E2E 测试)
- Vitest (单元测试)

**部署**
- Docker + Docker Compose
- 支持 TLS/HTTPS 配置

## 开发命令

```bash
# 安装依赖
npm install

# 复制环境配置
cp .env.example .env

# 开发模式 (同时启动前后端)
npm run dev

# 单独启动
npm run dev:web    # 前端 http://localhost:5173
npm run dev:api    # 后端 http://localhost:4000

# 构建
npm run build        # 构建前后端
npm run build:web    # 仅构建前端
npm run build:api    # 仅构建后端

# 类型检查
npm run typecheck --workspaces

# 数据库操作
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 推送数据库变更
npm run db:migrate   # 创建迁移
npm run db:seed      # 填充种子数据

# 测试
npx playwright test  # E2E 测试
npm run test         # 单元测试

# 生产部署
docker-compose -f docker-compose.yml up -d
```

## 项目结构

```
to-do-list/
├── apps/
│   ├── web/              # React 前端
│   │   └── src/
│   │       ├── components/   # UI 组件
│   │       ├── hooks/        # 自定义 Hooks
│   │       ├── lib/          # 工具函数
│   │       ├── locales/      # 国际化文件 (en/, zh-CN/)
│   │       ├── models/       # 数据模型
│   │       ├── pages/        # 页面组件
│   │       ├── stores/       # Zustand stores
│   │       └── types/        # TypeScript 类型
│   └── api/              # Fastify 后端
│       └── src/
│           ├── modules/      # 功能模块 (auth, tasks, lists, users...)
│           ├── config/       # 配置
│           └── shared/       # 共享代码
├── e2e/                  # Playwright E2E 测试
├── docs/                 # 文档
├── scripts/              # 部署/备份脚本
└── design-system/        # 设计系统资源
```

## 开发规范

### 代码风格
- TypeScript 严格模式
- 2 空格缩进
- React 组件文件: PascalCase (如 `TaskItem.tsx`)
- 变量/函数/Hooks: camelCase
- 前端导入路径优先使用 `@/` 别名

### 测试要求
- **必须**: 任何面向用户的功能变更需在 `e2e/*.spec.ts` 中添加/更新 E2E 测试
- E2E 测试运行前会自动启动前后端服务

### 国际化要求
- **必须**: 任何用户可见的文案变更需同时更新两个语言文件:
  - `apps/web/src/locales/en/*.json`
  - `apps/web/src/locales/zh-CN/*.json`

### PR 检查清单
1. `npm run typecheck --workspaces` - 类型检查
2. `npm run build:web` - 前端构建
3. `npm run build:api` - 后端构建

## 环境配置

关键环境变量 (参见 `.env.example`):

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `3000` |
| `TZ` | 时区 (IANA) | `Asia/Shanghai` |
| `JWT_SECRET` | JWT 密钥 | **生产必须修改** |
| `DB_TYPE` | 数据库类型 | `sqlite` |
| `DATABASE_URL` | 数据库连接 | `file:/app/data/todo.db` |
| `ALLOW_REGISTRATION` | 允许注册 | `true` |

## 开发环境默认账户

- Email: `demo@example.com`
- Password: `password123`

## 移动端 UI 设计

项目采用移动优先设计:
- 底部导航栏 (BottomNav)
- 浮动操作按钮 (FAB)
- 滑动手势操作 (framer-motion)
- 底部弹出详情页 (Bottom Sheet)
- PWA 支持 + iOS 安全区域适配

## 安全注意事项

- 永远不要提交 `.env` 文件或密钥
- 生产环境必须设置强 `JWT_SECRET` (至少 32 字符)
- 设置正确的 `TZ` 时区以确保截止日期/提醒逻辑正确

## 相关文档

- `docs/DEPLOYMENT.md` - 部署指南
- `docs/SECURITY_AUDIT.md` - 安全审计
- `docs/ACCESSIBILITY_AUDIT.md` - 无障碍审计