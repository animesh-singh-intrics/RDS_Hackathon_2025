export interface OpenRouterModelOption {
  value: string;
  label: string;
  vendor?: 'anthropic' | 'openai' | 'google' | 'meta-llama' | 'mistral' | 'others';
  tier?: 'baseline' | 'premium' | 'fast';
}

export const OPENROUTER_MODEL_OPTIONS: OpenRouterModelOption[] = [
  {
    value: 'anthropic/claude-3.5-sonnet',
    label: 'Anthropic Claude 3.5 Sonnet',
    vendor: 'anthropic',
    tier: 'baseline'
  },
  {
    value: 'anthropic/claude-3.5-haiku',
    label: 'Anthropic Claude 3.5 Haiku',
    vendor: 'anthropic',
    tier: 'fast'
  },
  {
    value: 'anthropic/claude-3-haiku',
    label: 'Anthropic Claude 3 Haiku (Legacy)',
    vendor: 'anthropic',
    tier: 'fast'
  },
  {
    value: 'anthropic/claude-3-opus',
    label: 'Anthropic Claude 3 Opus',
    vendor: 'anthropic',
    tier: 'premium'
  },
  {
    value: 'openai/gpt-4o',
    label: 'OpenAI GPT-4o',
    vendor: 'openai',
    tier: 'premium'
  },
  {
    value: 'openai/gpt-4o-mini',
    label: 'OpenAI GPT-4o Mini',
    vendor: 'openai',
    tier: 'baseline'
  },
  {
    value: 'openai/o3-mini',
    label: 'OpenAI o3 Mini',
    vendor: 'openai',
    tier: 'fast'
  },
  {
    value: 'openai/gpt-4',
    label: 'OpenAI GPT-4 (Legacy)',
    vendor: 'openai',
    tier: 'premium'
  },
  {
    value: 'openai/gpt-3.5-turbo',
    label: 'OpenAI GPT-3.5 Turbo (Legacy)',
    vendor: 'openai',
    tier: 'baseline'
  },
  {
    value: 'google/gemini-1.5-pro',
    label: 'Google Gemini 1.5 Pro',
    vendor: 'google',
    tier: 'premium'
  },
  {
    value: 'google/gemini-1.5-flash',
    label: 'Google Gemini 1.5 Flash',
    vendor: 'google',
    tier: 'baseline'
  },
  {
    value: 'google/gemini-1.5-flash-8b',
    label: 'Google Gemini 1.5 Flash 8B',
    vendor: 'google',
    tier: 'fast'
  },
  {
    value: 'google/gemini-pro',
    label: 'Google Gemini Pro (Legacy)',
    vendor: 'google',
    tier: 'baseline'
  },
  {
    value: 'google/gemini-pro-1.5',
    label: 'Google Gemini Pro 1.5 (Legacy)',
    vendor: 'google',
    tier: 'baseline'
  },
  {
    value: 'google/gemini-flash-1.5',
    label: 'Google Gemini Flash 1.5 (Legacy)',
    vendor: 'google',
    tier: 'fast'
  },
  {
    value: 'meta-llama/llama-3.1-70b-instruct',
    label: 'Meta Llama 3.1 70B Instruct',
    vendor: 'meta-llama',
    tier: 'premium'
  },
  {
    value: 'meta-llama/llama-3.1-8b-instruct',
    label: 'Meta Llama 3.1 8B Instruct',
    vendor: 'meta-llama',
    tier: 'baseline'
  },
  {
    value: 'meta-llama/llama-3.1-405b-instruct',
    label: 'Meta Llama 3.1 405B Instruct',
    vendor: 'meta-llama',
    tier: 'premium'
  }
];

export const DEFAULT_OPENROUTER_MODEL = OPENROUTER_MODEL_OPTIONS[0]?.value || 'anthropic/claude-3.5-sonnet';
