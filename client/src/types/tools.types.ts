/**
 * Tool interface for dashboard tools
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  category: string;
  comingSoon?: boolean;
  route?: string;
}

/**
 * Tool card component props
 */
export interface ToolCardProps {
  tool: Tool;
  index: number;
}