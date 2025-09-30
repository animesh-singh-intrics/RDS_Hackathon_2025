/**
 * Base tool interface that all tools should implement
 */
export interface BaseTool {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
}

/**
 * Tool navigation item for breadcrumbs and navigation
 */
export interface ToolNavItem {
  label: string;
  path: string;
  icon?: string;
}

/**
 * Tool layout props
 */
export interface ToolLayoutProps {
  children: React.ReactNode;
  tool: BaseTool;
  navigation?: ToolNavItem[];
}

/**
 * Tool action button props
 */
export interface ToolActionProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}

/**
 * Tool status types
 */
export type ToolStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Common tool state interface
 */
export interface ToolState<T = any> {
  data: T | null;
  status: ToolStatus;
  error: string | null;
}