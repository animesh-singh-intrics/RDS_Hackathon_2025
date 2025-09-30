import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartJSRendererProps {
  config: any; // Chart.js configuration object
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'radar';
  width?: number;
  height?: number;
}

/**
 * Chart.js React Component
 * Renders professional charts using Chart.js library with AI-generated configurations
 */
export const ChartJSRenderer: React.FC<ChartJSRendererProps> = ({ 
  config, 
  type = 'bar', 
  width = 400, 
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create new chart instance
    chartInstanceRef.current = new ChartJS(ctx, {
      type: config.type || type,
      data: config.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              callback: function(value: any) {
                return typeof value === 'number' ? value.toLocaleString() : value;
              }
            }
          },
          x: {
            grid: {
              display: false,
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        ...config.options // Allow override of default options
      }
    });

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [config, type]);

  return (
    <div style={{ position: 'relative', width: '100%', height: height }}>
      <canvas 
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
};

/**
 * Utility functions for generating Chart.js configurations from CSV data
 */
export class ChartJSConfigGenerator {
  
  /**
   * Generate Chart.js configuration for bar charts
   */
  static generateBarChartConfig(data: any[], labelField: string, valueField: string, title: string = 'Bar Chart') {
    const labels = data.map(item => item[labelField]);
    const values = data.map(item => Number(item[valueField]) || 0);

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(6, 182, 212, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(6, 182, 212, 1)'
          ],
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    };
  }

  /**
   * Generate Chart.js configuration for line charts
   */
  static generateLineChartConfig(data: any[], labelField: string, valueField: string, title: string = 'Line Chart') {
    const labels = data.map(item => item[labelField]);
    const values = data.map(item => Number(item[valueField]) || 0);

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: title,
          data: values,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  /**
   * Generate Chart.js configuration for pie charts
   */
  static generatePieChartConfig(data: any[], labelField: string, valueField: string, title: string = 'Pie Chart') {
    const labels = data.map(item => item[labelField]);
    const values = data.map(item => Number(item[valueField]) || 0);

    return {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(132, 204, 22, 0.8)',
            'rgba(249, 115, 22, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(6, 182, 212, 1)',
            'rgba(132, 204, 22, 1)',
            'rgba(249, 115, 22, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'right' as const,
          }
        }
      }
    };
  }

  /**
   * Auto-generate appropriate chart configuration based on data analysis
   */
  static generateAutoChart(data: any[], analysis: any): any {
    if (!data || data.length === 0) return null;

    const numericColumns = analysis.columns.filter((col: any) => col.type === 'number');
    const stringColumns = analysis.columns.filter((col: any) => col.type === 'string');

    // If we have at least one numeric and one string column, create a bar chart
    if (numericColumns.length > 0 && stringColumns.length > 0) {
      const labelField = stringColumns[0].name;
      const valueField = numericColumns[0].name;
      
      return this.generateBarChartConfig(
        data.slice(0, 10), // Limit to first 10 rows for readability
        labelField,
        valueField,
        `${valueField} by ${labelField}`
      );
    }

    // If multiple numeric columns, create a line chart with the first two
    if (numericColumns.length >= 2) {
      const xField = numericColumns[0].name;
      const yField = numericColumns[1].name;
      
      return this.generateLineChartConfig(
        data.slice(0, 20),
        xField,
        yField,
        `${yField} vs ${xField}`
      );
    }

    // Fallback to a simple frequency chart of the first string column
    if (stringColumns.length > 0) {
      const field = stringColumns[0].name;
      const frequencies: { [key: string]: number } = {};
      
      data.forEach(item => {
        const value = item[field];
        frequencies[value] = (frequencies[value] || 0) + 1;
      });

      const chartData = Object.entries(frequencies)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8) // Top 8 categories
        .map(([label, count]) => ({ label, count }));

      return this.generateBarChartConfig(
        chartData,
        'label',
        'count',
        `Distribution of ${field}`
      );
    }

    return null;
  }
}