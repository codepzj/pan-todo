# Design Document

## Overview

本设计文档描述了艾森豪威尔矩阵待办应用的技术架构和实现方案。该应用基于 Electron 框架，使用 React + shadcn/ui 构建用户界面，采用本地 JSON 文件进行数据持久化。应用采用清晰的分层架构，将 Electron 主进程、渲染进程、数据存储和 UI 组件进行合理分离，为后续扩展插件系统和快捷键支持奠定基础。

## Architecture

### High-Level Architecture

应用采用 Electron 的多进程架构：

```
┌─────────────────────────────────────────┐
│         Main Process (Node.js)          │
│  - Window Management                    │
│  - System Tray Integration              │
│  - IPC Communication Handler            │
│  - File System Operations               │
└──────────────┬──────────────────────────┘
               │ IPC
┌──────────────▼──────────────────────────┐
│      Renderer Process (Browser)         │
│  ┌────────────────────────────────────┐ │
│  │         React Application          │ │
│  │  - Quadrant Components             │ │
│  │  - Todo Card Components            │ │
│  │  - Drag & Drop Logic               │ │
│  │  - State Management                │ │
│  └────────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Local File System Storage          │
│         (todos.json)                    │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Electron**: 桌面应用框架
- **React 18**: UI 框架
- **TypeScript**: 类型安全的开发语言
- **shadcn/ui**: UI 组件库（基于 Radix UI + Tailwind CSS）
- **@dnd-kit**: 现代化的拖拽库，支持 React 18
- **Zustand**: 轻量级状态管理
- **Electron Store**: 简化的本地数据持久化（可选，或使用原生 fs）

### Module Structure

```
eisenhower-matrix-todo/
├── electron/
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本（IPC 桥接）
│   └── storage.ts           # 文件存储模块
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui 组件
│   │   ├── Quadrant.tsx     # 象限组件
│   │   ├── TodoCard.tsx     # 待办卡片组件
│   │   ├── TodoForm.tsx     # 待办表单组件
│   │   └── Matrix.tsx       # 矩阵容器组件
│   ├── hooks/
│   │   └── useTodoStore.ts  # 状态管理 hook
│   ├── types/
│   │   └── todo.ts          # 类型定义
│   ├── lib/
│   │   └── ipc.ts           # IPC 通信封装
│   ├── App.tsx              # 应用根组件
│   └── main.tsx             # 渲染进程入口
├── package.json
├── tsconfig.json
├── vite.config.ts           # Vite 构建配置
└── tailwind.config.js       # Tailwind 配置
```

## Components and Interfaces

### Data Models

#### TodoItem Interface

```typescript
interface TodoItem {
  id: string;              // UUID
  title: string;           // 标题（必填）
  description?: string;    // 描述（可选）
  quadrant: QuadrantType;  // 所属象限
  createdAt: number;       // 创建时间戳
  updatedAt: number;       // 更新时间戳
}

type QuadrantType = 
  | 'urgent-important'      // 重要且紧急
  | 'not-urgent-important'  // 重要不紧急
  | 'urgent-not-important'  // 紧急不重要
  | 'not-urgent-not-important'; // 不重要不紧急
```

#### Storage Interface

```typescript
interface StorageData {
  todos: TodoItem[];
  version: string;  // 数据格式版本，用于未来迁移
}
```

### IPC Communication

主进程和渲染进程之间通过 IPC 通信：

```typescript
// IPC Channels
interface IpcChannels {
  'todos:load': () => Promise<TodoItem[]>;
  'todos:save': (todos: TodoItem[]) => Promise<void>;
  'todos:create': (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TodoItem>;
  'todos:update': (id: string, updates: Partial<TodoItem>) => Promise<void>;
  'todos:delete': (id: string) => Promise<void>;
  'window:minimize': () => void;
  'window:close': () => void;
}
```

### Component Hierarchy

```
App
└── Matrix
    ├── Quadrant (urgent-important)
    │   ├── TodoCard
    │   ├── TodoCard
    │   └── TodoForm
    ├── Quadrant (not-urgent-important)
    │   └── ...
    ├── Quadrant (urgent-not-important)
    │   └── ...
    └── Quadrant (not-urgent-not-important)
        └── ...
```

### Key Components

#### Matrix Component

负责整体布局和拖拽上下文：

```typescript
interface MatrixProps {
  // 无需外部 props，使用内部状态管理
}

// 功能：
// - 提供 DndContext
// - 渲染四个 Quadrant
// - 处理拖拽结束事件
// - 协调状态更新
```

#### Quadrant Component

单个象限容器：

```typescript
interface QuadrantProps {
  type: QuadrantType;
  title: string;
  todos: TodoItem[];
  onAddTodo: (title: string, description?: string) => void;
}

// 功能：
// - 作为拖拽放置目标
// - 渲染该象限的所有 TodoCard
// - 提供添加按钮和表单
```

#### TodoCard Component

待办事项卡片：

```typescript
interface TodoCardProps {
  todo: TodoItem;
  onEdit: (id: string, updates: Partial<TodoItem>) => void;
  onDelete: (id: string) => void;
}

// 功能：
// - 可拖拽
// - 显示标题和描述
// - 提供编辑和删除按钮
// - 内联编辑模式
```

#### TodoForm Component

添加/编辑表单：

```typescript
interface TodoFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<TodoItem>;
  onSubmit: (data: { title: string; description?: string }) => void;
  onCancel: () => void;
}

// 功能：
// - 标题输入（必填）
// - 描述输入（可选）
// - 表单验证
// - 提交和取消操作
```

### State Management

使用 Zustand 进行状态管理：

```typescript
interface TodoStore {
  todos: TodoItem[];
  isLoading: boolean;
  
  // Actions
  loadTodos: () => Promise<void>;
  addTodo: (quadrant: QuadrantType, title: string, description?: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  moveTodo: (id: string, newQuadrant: QuadrantType) => Promise<void>;
  
  // Selectors
  getTodosByQuadrant: (quadrant: QuadrantType) => TodoItem[];
}
```

## Data Models

### File Storage Format

数据存储在用户数据目录的 `todos.json` 文件中：

```json
{
  "version": "1.0.0",
  "todos": [
    {
      "id": "uuid-v4",
      "title": "完成项目文档",
      "description": "编写技术设计文档和 API 文档",
      "quadrant": "urgent-important",
      "createdAt": 1703001234567,
      "updatedAt": 1703001234567
    }
  ]
}
```

### Storage Location

- **Windows**: `%APPDATA%/eisenhower-matrix-todo/todos.json`
- **macOS**: `~/Library/Application Support/eisenhower-matrix-todo/todos.json`
- **Linux**: `~/.config/eisenhower-matrix-todo/todos.json`


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Adding todo creates in correct quadrant

*For any* quadrant and valid todo data (non-empty title), when a user adds a todo to that quadrant, the todo should appear in that specific quadrant and nowhere else.

**Validates: Requirements 2.1, 2.5**

### Property 2: Empty title validation

*For any* string composed entirely of whitespace or empty string, attempting to create or update a todo with that title should be rejected, and the application state should remain unchanged.

**Validates: Requirements 2.4, 7.4**

### Property 3: Todo card displays title

*For any* todo item, when rendered as a card, the card's content should contain the todo's title.

**Validates: Requirements 3.2**

### Property 4: Description display conditional

*For any* todo item with a description, the rendered card should display the description. For any todo item without a description, the rendered card should not display a description field.

**Validates: Requirements 3.3, 3.4**

### Property 5: Drag and drop updates quadrant

*For any* todo item in any source quadrant, when dragged and dropped into any target quadrant, the todo's quadrant property should be updated to match the target quadrant.

**Validates: Requirements 4.1, 4.2**

### Property 6: Cancelled drag preserves state

*For any* todo item, if a drag operation is started and then cancelled, the todo should remain in its original quadrant with all properties unchanged.

**Validates: Requirements 4.5**

### Property 7: State changes persist immediately

*For any* state-changing operation (create, update, delete, move), the change should be immediately reflected in local storage.

**Validates: Requirements 5.1, 5.2, 5.3, 7.5**

### Property 8: Storage round-trip preserves data

*For any* set of todo items, saving them to storage and then loading them should produce an equivalent set of todos with all properties preserved.

**Validates: Requirements 5.4**

### Property 9: Delete removes todo

*For any* todo item in any quadrant, when deleted, the todo should no longer appear in that quadrant or in the application state.

**Validates: Requirements 6.1, 6.2**

### Property 10: Edit updates todo fields

*For any* todo item and any valid field updates (non-empty title, any description), saving the edits should update the todo's properties and reflect immediately in the display.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 11: Window state persistence

*For any* window position and size, when the application is closed and reopened, the window should restore to the same position and size.

**Validates: Requirements 9.5**

## Error Handling

### File System Errors

- **Read Errors**: If `todos.json` cannot be read (corrupted, permission issues), initialize with empty state and log error
- **Write Errors**: If save fails, show user notification and retry with exponential backoff
- **Parse Errors**: If JSON is malformed, backup corrupted file and initialize with empty state

### Validation Errors

- **Empty Title**: Show inline error message, prevent submission
- **Invalid Quadrant**: Reject drag operation, return to original position
- **Missing Required Fields**: Show validation errors, prevent save

### IPC Communication Errors

- **Timeout**: Retry operation up to 3 times with 1s timeout
- **Channel Not Found**: Log error and show user-friendly message
- **Serialization Errors**: Log detailed error, show generic message to user

### Recovery Strategies

1. **Graceful Degradation**: If storage fails, continue with in-memory state
2. **Auto-backup**: Create backup before each write operation
3. **Error Boundaries**: React error boundaries to catch and display component errors
4. **Logging**: Comprehensive logging to help diagnose issues

## Testing Strategy

### Unit Testing

使用 **Vitest** 作为测试框架，配合 **React Testing Library** 进行组件测试。

**Unit tests 覆盖范围：**

- **Component Rendering**: 测试组件在不同 props 下的渲染输出
  - TodoCard 显示标题和描述
  - Quadrant 显示正确的标题和待办列表
  - TodoForm 表单字段和验证

- **User Interactions**: 测试用户交互行为
  - 点击添加按钮显示表单
  - 点击删除按钮移除待办
  - 点击编辑按钮进入编辑模式

- **Edge Cases**: 测试边界情况
  - 空存储初始化
  - 长标题和描述的显示
  - 特殊字符处理

- **IPC Communication**: 测试主进程和渲染进程通信
  - Mock IPC 调用
  - 测试错误处理

### Property-Based Testing

使用 **fast-check** 库进行属性测试，这是 JavaScript/TypeScript 生态中成熟的 PBT 库。

**配置要求：**
- 每个属性测试至少运行 **100 次迭代**
- 每个测试必须使用注释标记对应的设计文档属性：`// Feature: eisenhower-matrix-todo, Property {number}: {property_text}`

**Property tests 覆盖范围：**

- **Property 1**: 测试添加待办到任意象限都能正确创建
  - 生成随机象限和待办数据
  - 验证待办出现在正确象限

- **Property 2**: 测试空标题验证
  - 生成各种空白字符串（空格、制表符、换行等）
  - 验证都被正确拒绝

- **Property 3-4**: 测试待办卡片渲染
  - 生成随机待办数据（有/无描述）
  - 验证渲染输出包含正确内容

- **Property 5-6**: 测试拖拽功能
  - 生成随机源和目标象限
  - 验证拖拽更新象限属性
  - 验证取消拖拽保持原状态

- **Property 7-8**: 测试持久化
  - 生成随机待办集合
  - 验证保存和加载的一致性
  - 验证所有操作都触发持久化

- **Property 9-10**: 测试删除和编辑
  - 生成随机待办和更新数据
  - 验证操作正确更新状态

- **Property 11**: 测试窗口状态持久化
  - 生成随机窗口位置和大小
  - 验证重启后恢复

**测试数据生成器：**

```typescript
// 使用 fast-check 生成测试数据
const todoArbitrary = fc.record({
  title: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string()),
  quadrant: fc.constantFrom(
    'urgent-important',
    'not-urgent-important', 
    'urgent-not-important',
    'not-urgent-not-important'
  )
});

const whitespaceArbitrary = fc.stringOf(
  fc.constantFrom(' ', '\t', '\n', '\r')
);
```

### Integration Testing

- **End-to-End Workflows**: 使用 Playwright 测试完整用户流程
  - 创建 → 编辑 → 移动 → 删除待办
  - 应用重启后数据恢复
  - 系统托盘交互

- **IPC Integration**: 测试主进程和渲染进程的完整通信流程

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   │   ├── TodoCard.test.tsx
│   │   ├── Quadrant.test.tsx
│   │   └── TodoForm.test.tsx
│   └── hooks/
│       └── useTodoStore.test.ts
├── property/
│   ├── todo-creation.property.test.ts
│   ├── todo-validation.property.test.ts
│   ├── drag-drop.property.test.ts
│   ├── persistence.property.test.ts
│   └── window-state.property.test.ts
└── integration/
    └── app.e2e.test.ts
```

## UI Design

### Layout

采用 2x2 网格布局，每个象限占据 50% 宽度和高度：

```
┌─────────────────────┬─────────────────────┐
│   重要且紧急         │   重要不紧急         │
│   (Urgent +         │   (Not Urgent +     │
│    Important)       │    Important)       │
│                     │                     │
├─────────────────────┼─────────────────────┤
│   紧急不重要         │   不重要不紧急       │
│   (Urgent +         │   (Not Urgent +     │
│    Not Important)   │    Not Important)   │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

### Color Scheme (Minimalist)

- **Background**: 浅灰色 (#F9FAFB)
- **Quadrant Borders**: 中灰色 (#E5E7EB)
- **Cards**: 白色 (#FFFFFF) with subtle shadow
- **Text**: 深灰色 (#111827)
- **Accent**: 蓝色 (#3B82F6) for interactive elements
- **Danger**: 红色 (#EF4444) for delete actions

### Typography

- **Quadrant Titles**: 16px, Semi-bold
- **Card Titles**: 14px, Medium
- **Card Descriptions**: 13px, Regular
- **Buttons**: 13px, Medium

### Spacing

- **Quadrant Padding**: 16px
- **Card Margin**: 8px
- **Card Padding**: 12px
- **Button Padding**: 8px 12px

## Drag and Drop Implementation

### Library Choice

使用 **@dnd-kit** 库，原因：
- 现代化，支持 React 18
- 性能优秀，使用 CSS transforms
- 可访问性支持（键盘导航）
- 灵活的 API

### Implementation Details

```typescript
// 1. 设置 DndContext
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <Matrix />
</DndContext>

// 2. 使 TodoCard 可拖拽
function TodoCard({ todo }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: todo.id,
    data: { todo }
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* Card content */}
    </div>
  );
}

// 3. 使 Quadrant 可放置
function Quadrant({ type, todos }) {
  const { setNodeRef } = useDroppable({
    id: type,
  });
  
  return (
    <div ref={setNodeRef}>
      {/* Quadrant content */}
    </div>
  );
}

// 4. 处理拖拽结束
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  if (!over) return; // Cancelled
  
  const todoId = active.id as string;
  const newQuadrant = over.id as QuadrantType;
  
  moveTodo(todoId, newQuadrant);
}
```

### Visual Feedback

- **Dragging**: 卡片透明度降低到 50%，显示拖拽光标
- **Drop Target**: 目标象限背景色变浅，显示虚线边框
- **Invalid Drop**: 光标显示禁止图标

## Extension Points

### Plugin System Architecture

为未来插件化设计预留接口：

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  
  // Lifecycle hooks
  onLoad?: () => void;
  onUnload?: () => void;
  
  // Extension points
  registerCommands?: () => Command[];
  registerMenuItems?: () => MenuItem[];
  registerShortcuts?: () => Shortcut[];
  
  // Data hooks
  onTodoCreate?: (todo: TodoItem) => TodoItem;
  onTodoUpdate?: (todo: TodoItem) => TodoItem;
  onTodoDelete?: (id: string) => void;
}

interface PluginManager {
  loadPlugin: (plugin: Plugin) => void;
  unloadPlugin: (id: string) => void;
  getPlugins: () => Plugin[];
}
```

### Keyboard Shortcuts Architecture

预留快捷键系统接口：

```typescript
interface Shortcut {
  key: string;              // e.g., "Ctrl+N"
  description: string;
  handler: () => void;
  scope?: 'global' | 'local';
}

interface ShortcutManager {
  register: (shortcut: Shortcut) => void;
  unregister: (key: string) => void;
  getShortcuts: () => Shortcut[];
}

// 预定义快捷键
const defaultShortcuts: Shortcut[] = [
  { key: 'Ctrl+N', description: '新建待办', handler: () => {} },
  { key: 'Ctrl+F', description: '搜索待办', handler: () => {} },
  { key: 'Delete', description: '删除选中待办', handler: () => {} },
  { key: 'Ctrl+E', description: '编辑选中待办', handler: () => {} },
  { key: 'Ctrl+,', description: '打开设置', handler: () => {} },
];
```

### Event System

使用事件总线模式支持扩展：

```typescript
interface EventBus {
  on: (event: string, handler: Function) => void;
  off: (event: string, handler: Function) => void;
  emit: (event: string, data?: any) => void;
}

// 预定义事件
type AppEvent =
  | 'todo:created'
  | 'todo:updated'
  | 'todo:deleted'
  | 'todo:moved'
  | 'app:ready'
  | 'app:closing';
```

### Configuration System

支持用户配置和插件配置：

```typescript
interface AppConfig {
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    compactMode: boolean;
  };
  behavior: {
    confirmDelete: boolean;
    autoSave: boolean;
    saveInterval: number;
  };
  shortcuts: Record<string, string>;
  plugins: {
    enabled: string[];
    config: Record<string, any>;
  };
}
```

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**: 如果单个象限待办数量超过 50，使用虚拟滚动
2. **Debounced Saves**: 编辑时使用防抖，避免频繁写入文件
3. **Memoization**: 使用 React.memo 和 useMemo 优化渲染
4. **Lazy Loading**: 延迟加载非关键组件

### Memory Management

- 限制单个象限最多 100 个待办
- 定期清理已删除待办的备份文件
- 使用 WeakMap 存储临时状态

## Security Considerations

### Data Protection

- 待办数据存储在用户本地目录，不传输到网络
- 文件权限设置为用户只读/写
- 不执行用户输入的代码

### Input Sanitization

- 标题和描述进行 HTML 转义，防止 XSS
- 限制标题最大长度 200 字符
- 限制描述最大长度 1000 字符

### Electron Security

- 启用 contextIsolation
- 禁用 nodeIntegration
- 使用 preload 脚本暴露有限 API
- 设置 CSP (Content Security Policy)

## Build and Distribution

### Build Configuration

```json
{
  "build": {
    "appId": "com.eisenhower.matrix.todo",
    "productName": "Eisenhower Matrix Todo",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist-electron",
      "dist"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

### Development Workflow

1. **Development**: `npm run dev` - 启动 Vite dev server + Electron
2. **Build**: `npm run build` - 构建生产版本
3. **Test**: `npm run test` - 运行所有测试
4. **Lint**: `npm run lint` - 代码检查
5. **Package**: `npm run package` - 打包应用

## Future Enhancements

### Phase 2 Features

- 待办搜索和过滤
- 标签系统
- 待办优先级排序
- 导出为 Markdown/CSV
- 数据统计和可视化

### Phase 3 Features

- 多语言支持
- 主题系统（深色模式）
- 云同步（可选）
- 移动端应用
- 团队协作功能
