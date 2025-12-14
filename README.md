# Pan Todo

一个基于艾森豪威尔矩阵的极简待办事项桌面应用。

## 特性

- 🎯 **四象限管理** - 基于艾森豪威尔矩阵的任务优先级管理
- 🖱️ **拖拽排序** - 支持同象限内排序和跨象限移动
- 💾 **本地存储** - 数据存储在本地，无需云端服务
- 🎨 **极简设计** - 灰色调界面，专注于任务本身
- ⚡ **快速响应** - 流畅的交互体验

## 技术栈

- **Electron** - 桌面应用框架
- **React** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **shadcn/ui** - UI 组件库
- **@dnd-kit** - 拖拽功能
- **Zustand** - 状态管理

### 快速开始

```bash
# 安装依赖
pnpm install

# 浏览器开发模式
pnpm dev

# Electron 开发模式
pnpm electron:dev

# 打包应用
pnpm build
```

## 数据存储

- **macOS**: `~/Library/Application Support/pan-todo/todos.json`
- **Windows**: `%APPDATA%/pan-todo/todos.json`
- **Linux**: `~/.config/pan-todo/todos.json`