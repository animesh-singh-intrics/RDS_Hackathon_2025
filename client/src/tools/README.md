# Tools Architecture

This document outlines the folder structure and architecture for individual tools in the Hackathon 2025 project.

## 📁 Folder Structure

```
src/tools/
├── shared/                    # Shared components and utilities for all tools
│   ├── components/           # Reusable UI components
│   ├── layouts/              # Tool layout components (ToolLayout)
│   ├── hooks/                # Shared hooks (useToolState, useAsyncOperation)
│   └── types/                # Common type definitions
├── taskmaster-pro/           # TaskMaster Pro tool
│   ├── components/           # Tool-specific React components
│   ├── hooks/                # Tool-specific custom hooks
│   ├── services/             # Business logic and API services
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── index.tsx             # Main tool entry point
└── [future-tools]/           # Other tools follow the same structure
```

## 🎯 Tool Development Standards

### 1. **Tool Entry Point** (`index.tsx`)
- Main component that exports the tool
- Uses the shared `ToolLayout` component
- Implements the tool's main interface

### 2. **Type Definitions** (`types/index.ts`)
- Extends `BaseTool` interface from shared types
- Defines tool-specific interfaces and types
- Includes form data and state interfaces

### 3. **Services** (`services/`)
- Contains business logic classes
- Handles data persistence and API calls
- Exports singleton instances for use in components

### 4. **Components** (`components/`)
- Tool-specific UI components
- Should be reusable within the tool
- Follow React functional component patterns

### 5. **Hooks** (`hooks/`)
- Custom React hooks for tool-specific functionality
- Can use shared hooks from `tools/shared/hooks/`
- Handle component state and side effects

## 🚀 Adding a New Tool

1. **Create Tool Directory**
   ```bash
   mkdir src/tools/your-tool-name
   mkdir src/tools/your-tool-name/{components,hooks,services,types,utils}
   ```

2. **Define Types**
   ```typescript
   // src/tools/your-tool-name/types/index.ts
   import type { BaseTool } from '@/tools/shared/types/index.js';
   
   export interface YourToolInterface extends BaseTool {
     id: 'your-tool-id';
     name: 'Your Tool Name';
     // ... other properties
   }
   ```

3. **Create Main Component**
   ```typescript
   // src/tools/your-tool-name/index.tsx
   import React from 'react';
   import { ToolLayout } from '@/tools/shared/layouts/ToolLayout.js';
   
   export const YourTool: React.FC = () => {
     const toolInfo = {
       id: 'your-tool-id',
       name: 'Your Tool Name',
       description: 'Tool description',
       version: '1.0.0',
       category: 'Category'
     };
   
     return (
       <ToolLayout tool={toolInfo}>
         {/* Your tool content */}
       </ToolLayout>
     );
   };
   ```

4. **Add Route**
   ```typescript
   // src/App.tsx
   import { YourTool } from '@/tools/your-tool-name/index.js';
   
   // Add to Routes
   <Route path="/tools/your-tool-name" element={<YourTool />} />
   ```

5. **Update Tool Navigation**
   ```typescript
   // src/components/ui/ToolCard.tsx
   const toolRoutes: Record<string, string> = {
     'your-tool-id': '/tools/your-tool-name',
     // ... other routes
   };
   ```

## 🛠 Available Shared Resources

### **Shared Types**
- `BaseTool` - Base interface for all tools
- `ToolLayoutProps` - Layout component props
- `ToolStatus` - Status types ('idle' | 'loading' | 'success' | 'error')
- `ToolState<T>` - Generic tool state interface

### **Shared Hooks**
- `useToolState<T>()` - Generic state management
- `useAsyncOperation<T>()` - Async operation handling

### **Shared Components**
- `ToolLayout` - Consistent layout with header and navigation

## 📋 Current Tools

### ✅ TaskMaster Pro (`taskmaster-pro`)
- **Status**: Active (backbone complete)
- **Path**: `/tools/taskmaster-pro`
- **Features**: Task management and AI-powered daily plan generation
- **Components**: Main dashboard with task list and plan generation

### 🔄 Future Tools (Coming Soon)
- TrendSpotter (retail-trend-visualizer)
- BugWhisperer (bug-report-analyzer)
- EmailBot Genius (auto-reply-generator)
- CommentCraft (code-commenter-bot)
- StockGuard (inventory-alert-system)
- MinuteMaker (meeting-minutes-generator)
- SentimentSorter (customer-review-classifier)
- DeployWise (devops-checklist-assistant)
- ClickCraft (click-only-app)
- GameForge (javascript-game)
- CareerCompass (career-path-recommender)

## 🔗 Path Mappings

The following TypeScript path mappings are configured:

```json
{
  "@/tools/*": ["tools/*"],
  "@/tools/shared/*": ["tools/shared/*"]
}
```

This allows clean imports like:
```typescript
import { ToolLayout } from '@/tools/shared/layouts/ToolLayout.js';
import { TaskMasterPro } from '@/tools/taskmaster-pro/index.js';
```

## 🎨 Styling Guidelines

- Use TailwindCSS for all styling
- Follow the existing color schemes and design patterns
- Maintain consistency with the main dashboard design
- Use the shared ToolLayout for consistent headers and navigation

---

**Ready to start building individual tool functionality!** 🚀

The backbone is now in place and TaskMaster Pro can be clicked from the dashboard to navigate to its dedicated page.