/**
 * Enhanced LLM Dashboard Service with Chart.js Integration
 * Generates Chart.js configurations instead of HTML/CSS for professional charts
 */

import type { ParsedCSVData, DatasetAnalysis } from '../types/index.js';
import { ChartJSConfigGenerator } from '../components/ChartJSRenderer.js';

interface EnhancedDashboardRequest {
  csvData: ParsedCSVData;
  analysis: DatasetAnalysis;
  userPreferences?: {
    style?: 'modern' | 'corporate' | 'minimal' | 'colorful';
    focusArea?: string;
    chartTypes?: string[];
  };
}

interface ChartJSConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter';
  data: any;
  options: any;
}

interface EnhancedDashboardResponse {
  success: boolean;
  htmlContent: string;
  chartConfigs?: ChartJSConfig[];
  error?: string;
}

/**
 * System prompt for generating Chart.js configurations instead of pure HTML
 */
const CHARTJS_GENERATION_PROMPT = `You are an expert data visualization developer. Create a complete HTML dashboard that integrates Chart.js for professional charts.

REQUIREMENTS:
1. Generate Chart.js configuration objects for charts (NOT HTML/CSS charts)
2. Include KPI cards with calculated metrics from the data
3. Use Chart.js for all visualizations with proper scaling and professional appearance
4. Include proper HTML structure with Chart.js script integration
5. Calculate meaningful statistics from the provided data

TEMPLATE STRUCTURE:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        .kpi-value { font-size: 2.5em; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
        .kpi-label { color: #64748b; font-size: 1.1em; font-weight: 500; }
        .chart-container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .chart-title { font-size: 1.5em; font-weight: 600; color: #1e293b; margin-bottom: 20px; }
        .chart-canvas { position: relative; height: 400px; }
        .data-table { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .data-table table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #f8fafc; padding: 15px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
        .data-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
        .data-table tr:hover { background: #f8fafc; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Professional Analytics Dashboard</h1>
            <p>Data insights with Chart.js visualizations</p>
        </div>
        
        <!-- KPI Cards -->
        <div class="kpi-grid" id="kpi-cards">
            <!-- Generate KPI cards with calculated values -->
        </div>
        
        <!-- Chart Section -->
        <div class="chart-container">
            <div class="chart-title">Data Visualization</div>
            <div class="chart-canvas">
                <canvas id="mainChart"></canvas>
            </div>
        </div>
        
        <!-- Additional Charts if needed -->
        <div class="chart-container">
            <div class="chart-title">Secondary Analysis</div>
            <div class="chart-canvas">
                <canvas id="secondaryChart"></canvas>
            </div>
        </div>
        
        <!-- Data Table -->
        <div class="data-table">
            <div class="chart-title" style="margin-bottom: 0; border-bottom: none; padding: 15px;">Data Sample</div>
            <table id="data-table-body">
                <!-- Generate table with headers and sample rows -->
            </table>
        </div>
    </div>

    <script>
        // Data from CSV
        const csvData = DATA_PLACEHOLDER;
        
        // Generate Chart.js configurations
        function createCharts() {
            // Main Chart Configuration
            const mainChartConfig = MAIN_CHART_CONFIG;
            
            // Secondary Chart Configuration
            const secondaryChartConfig = SECONDARY_CHART_CONFIG;
            
            // Create Chart.js instances
            const ctx1 = document.getElementById('mainChart').getContext('2d');
            new Chart(ctx1, mainChartConfig);
            
            const ctx2 = document.getElementById('secondaryChart').getContext('2d');
            new Chart(ctx2, secondaryChartConfig);
        }
        
        // Populate KPIs
        function createKPIs() {
            // Calculate and display KPIs
            KPI_GENERATION_CODE
        }
        
        // Populate data table
        function createDataTable() {
            // Generate data table
            TABLE_GENERATION_CODE
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            createKPIs();
            createCharts();
            createDataTable();
        });
    </script>
</body>
</html>

INSTRUCTIONS:
1. Replace DATA_PLACEHOLDER with the actual CSV data
2. Replace MAIN_CHART_CONFIG with a proper Chart.js configuration object
3. Replace SECONDARY_CHART_CONFIG with another Chart.js configuration
4. Replace KPI_GENERATION_CODE with JavaScript to calculate and display KPIs
5. Replace TABLE_GENERATION_CODE with JavaScript to populate the data table
6. Ensure Chart.js configurations have proper data, labels, colors, and options
7. Use appropriate chart types based on data analysis (bar, line, pie, etc.)
8. Make charts responsive and interactive

Generate the complete HTML with proper Chart.js configurations. Output ONLY the HTML code.

Data to visualize: `;

export class EnhancedLLMDashboardService {
  private apiKey: string | null = null;

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Generate enhanced dashboard with Chart.js integration
   */
  async generateEnhancedDashboard(request: EnhancedDashboardRequest): Promise<EnhancedDashboardResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API key is required. Please add your API key in the settings.',
        htmlContent: this.generateFallbackWithChartJS(request)
      };
    }

    try {
      return await this.generateWithOpenRouter(request);
    } catch (error) {
      console.error('Enhanced dashboard generation failed:', error);
      return {
        success: false,
        error: `OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        htmlContent: this.generateFallbackWithChartJS(request)
      };
    }
  }

  /**
   * Generate dashboard with OpenRouter using Chart.js approach
   */
  private async generateWithOpenRouter(request: EnhancedDashboardRequest): Promise<EnhancedDashboardResponse> {
    try {
      const dataPayload = this.prepareDataPayload(request);
      
      const fullPrompt = `${CHARTJS_GENERATION_PROMPT}

**CSV DATA (JSON FORMAT):**
\`\`\`json
${JSON.stringify(dataPayload, null, 2)}
\`\`\`

Generate the complete HTML dashboard with Chart.js configurations:`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dataviz-pro.vercel.app',
          'X-Title': 'DataViz Pro Enhanced'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: fullPrompt
          }],
          max_tokens: 8192,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const choice = result.choices[0];

      if (choice.finish_reason === 'length') {
        console.warn('LLM response was truncated, attempting to use partial content...');
      }

      let htmlContent = choice.message.content;
      
      if (htmlContent.startsWith('```html')) {
        htmlContent = htmlContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      }
      if (htmlContent.startsWith('```')) {
        htmlContent = htmlContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // Auto-complete truncated HTML if needed
      if (choice.finish_reason === 'length' && 
          htmlContent.includes('<body') && 
          !htmlContent.includes('</body>')) {
        htmlContent += '\n</script>\n</body>\n</html>';
      }

      return {
        success: true,
        htmlContent: this.sanitizeHTML(htmlContent)
      };
    } catch (error) {
      console.error('Enhanced dashboard generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate fallback dashboard with Chart.js
   */
  generateFallbackWithChartJS(request: EnhancedDashboardRequest): string {
    const { csvData, analysis } = request;
    
    // Generate Chart.js configuration using our utility
    const chartConfig = ChartJSConfigGenerator.generateAutoChart(
      csvData.rows.map((row) => {
        const obj: any = {};
        csvData.headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      }),
      analysis
    );

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        .kpi-value { font-size: 2.5em; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
        .kpi-label { color: #64748b; font-size: 1.1em; font-weight: 500; }
        .chart-container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .chart-title { font-size: 1.5em; font-weight: 600; color: #1e293b; margin-bottom: 20px; }
        .chart-canvas { position: relative; height: 400px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Professional Analytics Dashboard</h1>
            <p>Data insights with Chart.js visualizations</p>
        </div>
        
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${csvData.rowCount}</div>
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
        </div>
        
        ${chartConfig ? `
        <div class="chart-container">
            <div class="chart-title">${chartConfig.options?.plugins?.title?.text || 'Data Visualization'}</div>
            <div class="chart-canvas">
                <canvas id="mainChart"></canvas>
            </div>
        </div>
        ` : ''}
    </div>

    <script>
        ${chartConfig ? `
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('mainChart').getContext('2d');
            new Chart(ctx, ${JSON.stringify(chartConfig, null, 2)});
        });
        ` : ''}
    </script>
</body>
</html>
    `.trim();
  }

  private prepareDataPayload(request: EnhancedDashboardRequest) {
    const { csvData, analysis, userPreferences = {} } = request;
    
    const sampleData = csvData.rows.slice(0, 50);
    
    return {
      metadata: {
        totalRows: csvData.rowCount,
        totalColumns: csvData.headers.length,
        sampleSize: sampleData.length,
        fileName: 'uploaded-data.csv'
      },
      headers: csvData.headers,
      sampleData: sampleData,
      columnAnalysis: analysis.columns,
      insights: analysis.insights,
      preferences: {
        style: userPreferences.style || 'modern',
        focusArea: userPreferences.focusArea || 'auto-detect',
        chartTypes: userPreferences.chartTypes || ['auto']
      }
    };
  }

  private sanitizeHTML(html: string): string {
    return html;
  }
}

export const enhancedLLMDashboardService = new EnhancedLLMDashboardService();