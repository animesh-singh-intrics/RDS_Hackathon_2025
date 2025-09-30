import type { Tool } from '../types/tools.types.js';

/**
 * Tools data for the dashboard - 12 different tools in a 4x3 grid
 * Each tool represents a different utility or functionality
 */
export const toolsData: Tool[] = [
  {
    id: 'smart-task-planner',
    name: 'TaskMaster Pro',
    description: 'Transform your chaotic task list into a perfectly prioritized daily battle plan with AI-powered scheduling',
    icon: '🎯',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    category: 'Productivity',
    route: '/tools/task-planner'
    // Available now - TaskMaster Pro is ready!
  },
  {
    id: 'retail-trend-visualizer',
    name: 'DataViz Pro',
    description: 'Upload any CSV file and instantly generate AI-powered dashboards with smart charts and insights',
    icon: '',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    category: 'Analytics'
    // Available now - DataViz Pro is ready!
  },
  {
    id: 'code-commenter-bot',
    name: 'Code Commenter Tool',
    description: 'Transform your silent code into a well-documented masterpiece with AI-generated comments following industry best practices',
    icon: '',
    color: 'indigo',
    gradient: 'from-indigo-500 to-indigo-600',
    category: 'Development',
    route: '/tools/code-commenter'
    // Available now - Code Commenter Tool is ready!
  },
  {
    id: 'bug-report-analyzer',
    name: 'BugHunter',
    description: 'Analyze bugs and find probable causes using AI - supports both generic analysis and specific code scanning',
    icon: '🐛',
    color: 'red',
    gradient: 'from-red-500 to-red-600',
    category: 'Development',
    route: '/tools/bug-hunter'
    // Available now - BugHunter is ready!
  },
  {
    id: 'auto-reply-generator',
    name: 'Smart Responser',
    description: 'Generate professional, contextual replies for GitHub issues, pull requests, and code reviews',
    icon: '💬',
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    category: 'Communication',
    route: '/tools/smart-responser'
    // Available now - Smart Responser is ready!
  },
  {
    id: 'inventory-alert-system',
    name: 'StockGuard',
    description: 'AI-powered inventory predictions based on historical data - identify stock risks and optimize reorder timing',
    icon: '📦',
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-600',
    category: 'Business',
    route: '/tools/stock-guard'
    // Available now - StockGuard is ready!
  },
  {
    id: 'meeting-minutes-generator',
    name: 'MinuteMaker',
    description: 'Transform meeting transcripts into professional, structured meeting minutes with AI-powered intelligence',
    icon: '📝',
    color: 'cyan',
    gradient: 'from-cyan-500 to-teal-600',
    category: 'Productivity',
    route: '/tools/minute-maker'
    // Available now - MinuteMaker is ready!
  },
  {
    id: 'customer-review-classifier',
    name: 'SentimentSorter',
    description: 'Analyze customer reviews with AI-powered sentiment classification. Get actionable insights, key themes, and comprehensive analysis',
    icon: '💝',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    category: 'Analytics',
    route: '/tools/sentiment-sorter'
    // Available now - SentimentSorter is ready!
  },
  {
    id: 'devops-checklist-assistant',
    name: 'DeployWise',
    description: 'Get AI-generated deployment checklists, environment setup guides, and DevOps best practices',
    icon: '',
    color: 'slate',
    gradient: 'from-slate-500 to-slate-600',
    category: 'DevOps',
    comingSoon: true
  },
  {
    id: 'click-only-app',
    name: 'ClickCraft',
    description: 'Build complete web applications just by clicking - no coding required, powered by AI',
    icon: '',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    category: 'Development',
    comingSoon: true
  },
  {
    id: 'javascript-game',
    name: 'GameForge',
    description: 'Create engaging JavaScript games with AI assistance - from simple puzzles to complex adventures',
    icon: '',
    color: 'violet',
    gradient: 'from-violet-500 to-violet-600',
    category: 'Entertainment',
    comingSoon: true
  },
  {
    id: 'career-path-recommender',
    name: 'CareerCompass',
    description: 'Upload your resume and get personalized career path recommendations with skill gap analysis',
    icon: '',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    category: 'Career',
    comingSoon: true
  }
];
