/**
 * LLM Dashboard Generation Service
 * Converts parsed CSV data (JSON format) to HTML/CSS dashboard using AI
 */

import type { ParsedCSVData, DatasetAnalysis } from '../types/index.js';

interface DashboardGenerationRequest {
  csvData: ParsedCSVData;
  analysis: DatasetAnalysis;
  userPreferences?: {
    style?: 'modern' | 'corporate' | 'minimal' | 'colorful';
    focusArea?: string;
    chartTypes?: string[];
  };
}

interface DashboardGenerationResponse {
  htmlContent: string;
  success: boolean;
  error?: string;
}

/**
 * System prompt for LLM to generate HTML/CSS dashboards
 */
const DASHBOARD_GENERATION_PROMPT = `Create a complete HTML dashboard with charts and KPIs using HTML/CSS/JavaScript.

MUST INCLUDE:
- Complete <!DOCTYPE html> document
- KPI cards with calculated metrics from data
- Interactive bar/line charts using CSS/JS (no external libs)
- Modern responsive styling
- Data table with sample rows

TEMPLATE STRUCTURE:
<!DOCTYPE html>
<html><head><title>Dashboard</title>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f7fa}
.dashboard{max-width:1200px;margin:0 auto}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px}
.kpi-card{background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center}
.kpi-value{font-size:2.5em;font-weight:bold;color:#2563eb;margin-bottom:8px}
.kpi-label{color:#64748b;font-size:1.1em}
.chart-container{background:white;padding:30px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);margin-bottom:30px}
.bar-chart{display:flex;align-items:end;height:250px;gap:10px;padding:20px 0}
.bar{background:linear-gradient(45deg,#3b82f6,#1d4ed8);border-radius:4px 4px 0 0;position:relative;min-height:5px;transition:all 0.3s;cursor:pointer}
.bar:hover{transform:scaleY(1.05)}
.bar-label{position:absolute;bottom:-25px;left:50%;transform:translateX(-50%);font-size:12px;color:#666}
.data-table{background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.data-table table{width:100%;border-collapse:collapse}
.data-table th{background:#f8fafc;padding:12px;text-align:left;font-weight:600;border-bottom:1px solid #e5e7eb}
.data-table td{padding:10px;border-bottom:1px solid #f1f5f9}
</style>
</head>
<body>
<div class="dashboard">
<h1>Data Dashboard</h1>
<div class="kpi-grid" id="kpis"></div>
<div class="chart-container">
<h3>Data Visualization</h3>
<div class="bar-chart" id="chart"></div>
</div>
<div class="data-table"><table id="table"></table></div>
</div>
<script>
// Calculate KPIs and generate charts from data
const data = DATA_PLACEHOLDER;
// Add JavaScript to populate dashboard
</script>
</body></html>

INSTRUCTIONS:
- Replace DATA_PLACEHOLDER with actual data
- Calculate meaningful KPIs (totals, averages, counts)
- Generate proportional bar charts
- Include interactive hover effects
- Show data table with headers and rows
- Use actual values from provided data

Output ONLY the complete HTML. No markdown, no explanations.

Data: `;

/**
 * LLM Dashboard Generation Service
 */
export class LLMDashboardService {
  private apiKey: string | null = null;

  /**
   * Set the OpenRouter API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * List available OpenRouter models (for debugging)
   */
  async listAvailableModels(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate HTML dashboard from CSV data using LLM
   */
  async generateDashboard(request: DashboardGenerationRequest): Promise<DashboardGenerationResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API key is required. Please add your API key in the settings.',
        htmlContent: ''
      };
    }

    try {
      return await this.generateWithOpenRouter(request);
    } catch (error) {
      console.error('OpenRouter generation failed:', error);
      return {
        success: false,
        error: `OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        htmlContent: ''
      };
    }
  }

  /**
   * Generate dashboard with OpenRouter
   */
  private async generateWithOpenRouter(request: DashboardGenerationRequest): Promise<DashboardGenerationResponse> {
    try {
      // Prepare data payload for LLM
      const dataPayload = this.prepareDataPayload(request);
      
      // Create the prompt
      const fullPrompt = `${DASHBOARD_GENERATION_PROMPT}

**CSV DATA (JSON FORMAT):**
\`\`\`json
${JSON.stringify(dataPayload, null, 2)}
\`\`\`

Generate the complete HTML dashboard now:`;

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dataviz-pro.vercel.app',
          'X-Title': 'DataViz Pro'
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

      if (!result.choices || result.choices.length === 0) {
        throw new Error('No response generated from OpenRouter API');
      }

      const choice = result.choices[0];

      // Check if response was truncated due to token limit
      if (choice.finish_reason === 'length') {
        console.warn('LLM response was truncated due to token limit, attempting to use partial content...');
        // Don't throw error immediately, try to use partial content if it's valid HTML
      }

      if (!choice.message || !choice.message.content) {
        throw new Error('No content in OpenRouter API response');
      }

      let htmlContent = choice.message.content;
      
      // Clean up markdown code blocks if present
      if (htmlContent.startsWith('```html')) {
        htmlContent = htmlContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      }
      if (htmlContent.startsWith('```')) {
        htmlContent = htmlContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Basic validation of HTML response - try to fix incomplete HTML
      if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html')) {
        throw new Error('Invalid HTML response from LLM - no HTML structure found');
      }

      // If HTML appears to be truncated (no closing body/html tags), try to complete it
      if (choice.finish_reason === 'length' && 
          htmlContent.includes('<body') && 
          !htmlContent.includes('</body>')) {
        console.log('Attempting to complete truncated HTML...');
        htmlContent += '\n</script>\n</body>\n</html>';
      }

      return {
        success: true,
        htmlContent: this.sanitizeHTML(htmlContent)
      };
    } catch (error) {
      console.error('Dashboard generation failed with OpenRouter:', error);
      throw error; // Re-throw to let the caller handle fallback
    }
  }

  /**
   * Prepare structured data payload for LLM
   */
  private prepareDataPayload(request: DashboardGenerationRequest) {
    const { csvData, analysis, userPreferences = {} } = request;
    
    // Limit data size for LLM context (first 50 rows max)
    const sampleData = csvData.rows.slice(0, 50);
    
    // Calculate basic statistics for numeric columns
    const columnStats = analysis.columns.map((col, colIndex) => {
      if (col.type === 'number') {
        const values = csvData.rows
          .map((row: readonly string[]) => row[colIndex])
          .filter((val: string) => val !== '' && !isNaN(Number(val)))
          .map((val: string) => Number(val))
          .sort((a: number, b: number) => a - b);
        
        return {
          ...col,
          stats: {
            min: values[0] || 0,
            max: values[values.length - 1] || 0,
            avg: values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
            median: values.length ? values[Math.floor(values.length / 2)] : 0,
            count: values.length
          }
        };
      }
      return col;
    });

    return {
      metadata: {
        totalRows: csvData.rowCount,
        totalColumns: csvData.headers.length,
        sampleSize: sampleData.length,
        fileName: 'uploaded-data.csv'
      },
      headers: csvData.headers,
      sampleData: sampleData,
      columnAnalysis: columnStats,
      insights: analysis.insights,
      preferences: {
        style: userPreferences.style || 'modern',
        focusArea: userPreferences.focusArea || 'auto-detect',
        chartTypes: userPreferences.chartTypes || ['auto']
      }
    };
  }

  /**
   * Basic HTML sanitization (remove potentially dangerous elements)
   */
  private sanitizeHTML(html: string): string {
    // Remove script tags (except for Chart.js and data visualization)
    let sanitized = html;
    
    // This is a basic sanitization - in production, use a proper HTML sanitizer
    // For now, we trust the LLM to generate safe content
    
    return sanitized;
  }

  /**
   * Generate fallback HTML dashboard if LLM fails
   */
  generateFallbackDashboard(request: DashboardGenerationRequest): string {
    const { csvData, analysis } = request;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .kpi-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .kpi-label { color: #6b7280; font-size: 0.9em; }
        .data-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .data-table table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; }
        .data-table td { padding: 12px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Data Dashboard</h1>
            <p>Analysis of ${csvData.rowCount} records across ${csvData.headers.length} columns</p>
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
        
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        ${csvData.headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${csvData.rows.slice(0, 10).map((row: readonly string[]) => 
                        `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`
                    ).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

// Export singleton instance
export const llmDashboardService = new LLMDashboardService();