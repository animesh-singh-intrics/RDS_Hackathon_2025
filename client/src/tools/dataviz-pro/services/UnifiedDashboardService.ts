/**
 * Unified Dashboard Service - Complete Dashboard Generation with Chart.js
 * Generates entire dashboards in a single LLM call using structured JSON schema
 */

import type { ParsedCSVData, DatasetAnalysis } from '../types/index.js';

interface UnifiedDashboardRequest {
  csvData: ParsedCSVData;
  analysis: DatasetAnalysis;
  userPreferences?: {
    style?: 'modern' | 'corporate' | 'minimal' | 'colorful';
    focusArea?: string;
    chartTypes?: string[];
  };
}

interface UnifiedDashboardResponse {
  success: boolean;
  error?: string;
  dashboardConfig?: DashboardConfig;
  htmlContent?: string;
}

// Unified Dashboard JSON Schema Interfaces
interface DashboardConfig {
  dashboard: DashboardMetadata;
  kpis: KPICard[];
  charts: ChartConfig[];
}

interface DashboardMetadata {
  title: string;
  subtitle?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  layout: {
    grid: string;
    sections: string[];
    responsive: boolean;
  };
}

interface KPICard {
  id: string;
  label: string;
  value: string | number;
  format: 'number' | 'currency' | 'percentage' | 'text';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period?: string;
  };
  styling: {
    backgroundColor: string;
    textColor: string;
  };
  position?: {
    row: number;
    col: number;
    span?: number;
  };
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'polarArea';
  title: string;
  position?: {
    row: number;
    col: number;
    span?: number;
  };
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options: ChartOptions;
  styling?: {
    colors: string[];
    borderRadius?: string;
    shadow?: boolean;
  };
}

interface ChartDataset {
  label: string;
  data: number[] | {x: number, y: number}[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    title?: {
      display: boolean;
      text: string;
    };
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
  };
  scales?: {
    x?: {
      beginAtZero?: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
    y?: {
      beginAtZero?: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
  };
}

/**
 * Complete JSON Schema for Dashboard Configuration
 */
const UNIFIED_DASHBOARD_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Complete Dashboard Configuration for DataViz Pro",
  "type": "object",
  "properties": {
    "dashboard": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "subtitle": { "type": "string" },
        "theme": {
          "type": "object",
          "properties": {
            "primaryColor": { "type": "string" },
            "secondaryColor": { "type": "string" },
            "backgroundColor": { "type": "string" },
            "textColor": { "type": "string" },
            "fontFamily": { "type": "string" }
          },
          "required": ["primaryColor", "secondaryColor", "backgroundColor", "textColor", "fontFamily"]
        },
        "layout": {
          "type": "object",
          "properties": {
            "grid": { "type": "string", "enum": ["1x1", "2x1", "2x2", "3x2", "auto"] },
            "sections": {
              "type": "array",
              "items": { "type": "string", "enum": ["kpis", "charts", "tables"] }
            },
            "responsive": { "type": "boolean" }
          },
          "required": ["grid", "sections", "responsive"]
        }
      },
      "required": ["title", "theme", "layout"]
    },
    "kpis": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "value": { "type": ["string", "number"] },
          "format": { "type": "string", "enum": ["number", "currency", "percentage", "text"] },
          "trend": {
            "type": "object",
            "properties": {
              "direction": { "type": "string", "enum": ["up", "down", "neutral"] },
              "percentage": { "type": "number" },
              "period": { "type": "string" }
            },
            "required": ["direction", "percentage"]
          },
          "styling": {
            "type": "object",
            "properties": {
              "backgroundColor": { "type": "string" },
              "textColor": { "type": "string" }
            },
            "required": ["backgroundColor", "textColor"]
          },
          "position": {
            "type": "object",
            "properties": {
              "row": { "type": "number" },
              "col": { "type": "number" },
              "span": { "type": "number" }
            }
          }
        },
        "required": ["id", "label", "value", "format", "styling"]
      }
    },
    "charts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["bar", "line", "pie", "doughnut", "scatter", "radar", "polarArea"] },
          "title": { "type": "string" },
          "position": {
            "type": "object",
            "properties": {
              "row": { "type": "number" },
              "col": { "type": "number" },
              "span": { "type": "number" }
            }
          },
          "data": {
            "type": "object",
            "properties": {
              "labels": { "type": "array", "items": { "type": "string" } },
              "datasets": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": { "type": "string" },
                    "data": { "type": "array", "items": { "type": "number" } },
                    "backgroundColor": { "oneOf": [{ "type": "string" }, { "type": "array", "items": { "type": "string" } }] },
                    "borderColor": { "oneOf": [{ "type": "string" }, { "type": "array", "items": { "type": "string" } }] },
                    "borderWidth": { "type": "number" },
                    "fill": { "type": "boolean" },
                    "tension": { "type": "number" }
                  },
                  "required": ["label", "data"]
                }
              }
            },
            "required": ["labels", "datasets"]
          },
          "options": {
            "type": "object",
            "properties": {
              "responsive": { "type": "boolean" },
              "maintainAspectRatio": { "type": "boolean" },
              "plugins": { "type": "object" },
              "scales": { "type": "object" }
            },
            "required": ["responsive", "maintainAspectRatio"]
          },
          "styling": {
            "type": "object",
            "properties": {
              "colors": { "type": "array", "items": { "type": "string" } },
              "borderRadius": { "type": "string" },
              "shadow": { "type": "boolean" }
            }
          }
        },
        "required": ["id", "type", "title", "data", "options"]
      }
    }
  },
  "required": ["dashboard", "kpis", "charts"]
};

/**
 * Enhanced LLM Prompt for Unified Dashboard Generation
 */
const UNIFIED_DASHBOARD_PROMPT = `You are an expert dashboard architect and data visualization specialist. Generate a COMPLETE dashboard configuration based on CSV data analysis.

**CRITICAL: RESPOND WITH ONLY VALID JSON - NO MARKDOWN, NO EXPLANATIONS, NO CODE BLOCKS**

Follow this EXACT JSON schema for unified dashboard generation:
${JSON.stringify(UNIFIED_DASHBOARD_SCHEMA, null, 2)}

**UNIFIED DESIGN PRINCIPLES:**
1. **Cohesive Theme**: All elements (KPIs, charts, colors) must use consistent styling from the theme object
2. **Professional Layout**: Logical grid arrangement with proper spacing and responsive design
3. **Chart.js Integration**: Generate complete Chart.js configurations with proper scaling and professional appearance
4. **Data-Driven Analysis**: Generate meaningful KPIs from CSV analysis
5. **Accessibility**: Ensure proper contrast ratios and readable text

**CHART GENERATION GUIDELINES:**
- **Bar Charts**: For categorical comparisons with clear scaling (use when comparing categories)
- **Line Charts**: For time-series or trend analysis (use for data with date/time columns)
- **Pie Charts**: For part-to-whole relationships (max 6-8 segments for readability)
- **Scatter Plots**: For correlation between two numeric variables

**COLOR SCHEME CONSISTENCY:**
- Use theme.primaryColor for main elements and primary chart colors
- Use theme.secondaryColor for accents and secondary elements
- Generate harmonious color palettes for multi-dataset charts
- Ensure accessibility with proper contrast ratios

**KPI CALCULATION RULES:**
- Generate 3-6 meaningful KPIs from the data (totals, averages, counts, percentages, trends)
- Include trend analysis where possible (compare periods, calculate growth rates)
- Use appropriate formatting (currency for money, percentage for ratios, etc.)
- Assign appropriate colors based on KPI type

**LAYOUT OPTIMIZATION:**
- Arrange elements in logical reading order (KPIs at top, charts below)
- Balance chart sizes based on data importance and complexity
- Use appropriate grid layout (2x2 for 4 charts, auto for variable content)
- Ensure mobile responsiveness

**CSV DATA TO ANALYZE:**
`;

/**
 * Unified Dashboard Generation Service
 */
export class UnifiedDashboardService {
  private apiKey: string | null = null;

  /**
   * Set the OpenRouter API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Generate unified dashboard configuration from CSV data
   */
  async generateUnifiedDashboard(request: UnifiedDashboardRequest): Promise<UnifiedDashboardResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API key is required. Please add your API key in the settings.',
        htmlContent: this.generateFallbackHTML(request)
      };
    }

    try {
      // Generate structured dashboard configuration with LLM
      const configResult = await this.generateDashboardConfig(request);
      
      if (!configResult.success || !configResult.config) {
        throw new Error(configResult.error || 'Failed to generate dashboard configuration');
      }

      // Convert JSON config to HTML for rendering
      const htmlContent = this.renderDashboardHTML(configResult.config);

      return {
        success: true,
        dashboardConfig: configResult.config,
        htmlContent
      };

    } catch (error) {
      console.error('Unified dashboard generation failed:', error);
      return {
        success: false,
        error: `Dashboard generation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        htmlContent: this.generateFallbackHTML(request)
      };
    }
  }

  /**
   * Generate dashboard configuration using OpenRouter LLM
   */
  private async generateDashboardConfig(request: UnifiedDashboardRequest): Promise<{success: boolean, config?: DashboardConfig, error?: string}> {
    try {
      const dataPayload = this.prepareDataPayload(request);
      
      const fullPrompt = `${UNIFIED_DASHBOARD_PROMPT}

**CSV DATA (JSON FORMAT):**
\`\`\`json
${JSON.stringify(dataPayload, null, 2)}
\`\`\`

Generate the complete dashboard configuration as JSON:`;

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'DataViz Pro Unified Dashboard'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: fullPrompt
          }],
          max_tokens: 8192,
          temperature: 0.1,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const choice = result.choices[0];

      if (!choice.message || !choice.message.content) {
        throw new Error('No content in OpenRouter API response');
      }

      let jsonContent = choice.message.content;

      // Clean up response (remove any markdown formatting)
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse JSON configuration
      let dashboardConfig: DashboardConfig;
      try {
        dashboardConfig = JSON.parse(jsonContent);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}\n\nRaw response: ${jsonContent.substring(0, 500)}...`);
      }

      // Validate configuration against schema
      const validation = this.validateDashboardConfig(dashboardConfig);
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }

      return {
        success: true,
        config: dashboardConfig
      };

    } catch (error) {
      console.error('Dashboard config generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert dashboard configuration to HTML for rendering
   */
  private renderDashboardHTML(config: DashboardConfig): string {
    const { dashboard, kpis, charts } = config;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboard.title}</title>
    
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${dashboard.theme.fontFamily};
            background: ${dashboard.theme.backgroundColor};
            color: ${dashboard.theme.textColor};
            padding: 20px;
            line-height: 1.6;
        }
        
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .dashboard-header {
            background: linear-gradient(135deg, ${dashboard.theme.primaryColor}, ${dashboard.theme.secondaryColor});
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .dashboard-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .dashboard-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .kpi-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 4px solid ${dashboard.theme.primaryColor};
        }
        
        .kpi-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: ${dashboard.theme.primaryColor};
        }
        
        .kpi-label {
            color: #64748b;
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .kpi-trend {
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        .trend-neutral { color: #64748b; }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .chart-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: ${dashboard.theme.textColor};
            margin-bottom: 20px;
            text-align: center;
        }
        
        .chart-canvas {
            position: relative;
            height: 400px;
        }

        
        @media (max-width: 768px) {
            .dashboard-title {
                font-size: 2rem;
            }
            
            .kpi-grid {
                grid-template-columns: 1fr;
            }
            
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .chart-canvas {
                height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <!-- Header -->
        <div class="dashboard-header">
            <h1 class="dashboard-title">${dashboard.title}</h1>
            ${dashboard.subtitle ? `<p class="dashboard-subtitle">${dashboard.subtitle}</p>` : ''}
        </div>
        
        <!-- KPI Grid -->
        <div class="kpi-grid">
            ${kpis.map(kpi => `
                <div class="kpi-card" style="background: ${kpi.styling.backgroundColor}; color: ${kpi.styling.textColor};">
                    <div class="kpi-value" style="color: ${kpi.styling.textColor};">
                        ${this.formatKPIValue(kpi.value, kpi.format)}
                    </div>
                    <div class="kpi-label" style="color: ${kpi.styling.textColor}; opacity: 0.8;">
                        ${kpi.label}
                    </div>
                    ${kpi.trend ? `
                        <div class="kpi-trend trend-${kpi.trend.direction}" style="color: ${kpi.styling.textColor}; opacity: 0.9;">
                            ${kpi.trend.direction === 'up' ? '↗️' : kpi.trend.direction === 'down' ? '↘️' : '➡️'} 
                            ${kpi.trend.percentage}% ${kpi.trend.period || ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <!-- Charts Grid -->
        <div class="charts-grid">
            ${charts.map(chart => `
                <div class="chart-container">
                    <h3 class="chart-title">${chart.title}</h3>
                    <div class="chart-canvas">
                        <canvas id="${chart.id}"></canvas>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // Chart configurations and rendering
        const chartConfigs = ${JSON.stringify(charts, null, 2)};
        const createdCharts = {};
        
        // Render all charts
        document.addEventListener('DOMContentLoaded', function() {
            chartConfigs.forEach(chartConfig => {
                const canvas = document.getElementById(chartConfig.id);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    createdCharts[chartConfig.id] = new Chart(ctx, {
                        type: chartConfig.type,
                        data: chartConfig.data,
                        options: {
                            ...chartConfig.options,
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    });
                }
            });
        });
        
        // Cleanup charts on page unload
        window.addEventListener('beforeunload', function() {
            Object.values(createdCharts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Format KPI values based on format type
   */
  private formatKPIValue(value: string | number, format: string): string {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
      case 'percentage':
        return `${value}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      default:
        return String(value);
    }
  }

  /**
   * Validate dashboard configuration against schema
   */
  private validateDashboardConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic structure validation
    if (!config.dashboard) errors.push('Missing dashboard configuration');
    if (!config.kpis || !Array.isArray(config.kpis)) errors.push('Missing or invalid KPIs array');
    if (!config.charts || !Array.isArray(config.charts)) errors.push('Missing or invalid charts array');
    
    // Dashboard validation
    if (config.dashboard) {
      if (!config.dashboard.title) errors.push('Dashboard missing title');
      if (!config.dashboard.theme) errors.push('Dashboard missing theme');
      if (!config.dashboard.layout) errors.push('Dashboard missing layout');
    }
    
    // Charts validation
    if (config.charts) {
      config.charts.forEach((chart: any, index: number) => {
        if (!chart.id) errors.push(`Chart ${index} missing id`);
        if (!chart.type) errors.push(`Chart ${index} missing type`);
        if (!chart.title) errors.push(`Chart ${index} missing title`);
        if (!chart.data) errors.push(`Chart ${index} missing data`);
        if (chart.data && (!chart.data.labels || !chart.data.datasets)) {
          errors.push(`Chart ${index} data missing labels or datasets`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Prepare structured data payload for LLM
   */
  private prepareDataPayload(request: UnifiedDashboardRequest) {
    const { csvData, analysis, userPreferences = {} } = request;
    
    // Limit data size for LLM context (first 50 rows max)
    const sampleData = csvData.rows.slice(0, 50);
    
    return {
      headers: csvData.headers,
      rows: sampleData,
      rowCount: csvData.rowCount,
      analysis: {
        columns: analysis.columns,
        recommendedCharts: analysis.recommendedCharts,
        dataQuality: analysis.dataQuality
      },
      preferences: userPreferences,
      metadata: {
        fileName: 'data.csv',
        totalRows: csvData.rowCount,
        totalColumns: csvData.headers.length,
        sampleSize: sampleData.length
      }
    };
  }

  /**
   * Generate fallback HTML dashboard if LLM fails
   */
  private generateFallbackHTML(request: UnifiedDashboardRequest): string {
    const { csvData, analysis } = request;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Dashboard</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f7fa; 
            color: #1e293b;
        }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { 
            text-align: center; 
            padding: 30px; 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white; 
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .kpi-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .kpi-card { 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            text-align: center; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 4px solid #3b82f6;
        }
        .kpi-value { 
            font-size: 2.5rem; 
            font-weight: 700; 
            color: #3b82f6; 
            margin-bottom: 8px; 
        }
        .kpi-label { 
            color: #64748b; 
            font-size: 1rem; 
            font-weight: 500; 
        }
        .note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Data Analysis Dashboard</h1>
            <p>Fallback dashboard with basic metrics</p>
        </div>
        
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${csvData.rowCount.toLocaleString()}</div>
                <div class="kpi-label">Total Records</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${csvData.headers.length}</div>
                <div class="kpi-label">Data Columns</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${analysis.columns.filter(col => col.type === 'number').length}</div>
                <div class="kpi-label">Numeric Fields</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${analysis.columns.filter(col => col.type === 'string').length}</div>
                <div class="kpi-label">Text Fields</div>
            </div>
        </div>
        
        <div class="note">
            <strong>⚠️ Basic Dashboard Mode</strong><br>
            This is a fallback dashboard with basic metrics. For advanced visualizations and AI-generated insights, please configure your OpenRouter API key in the settings.
        </div>
    </div>
</body>
</html>`;
  }
}

// Export singleton instance
export const unifiedDashboardService = new UnifiedDashboardService();