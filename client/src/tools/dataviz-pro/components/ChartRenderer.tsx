import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { ParsedCSVData } from '../types/index.js';

interface ChartRendererProps {
  chart: {
    id: string;
    type: 'bar' | 'scatter' | 'line' | 'pie';
    title: string;
    xAxis: string;
    yAxis: string;
    config?: {
      showGrid?: boolean;
      showLegend?: boolean;
      color?: string;
    };
  };
  data: ParsedCSVData;
}

/**
 * Chart Renderer Component
 * Renders different chart types using Recharts based on configuration
 */
export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart, data }) => {
  // Prepare data for the chart
  const prepareChartData = () => {
    const xAxisIndex = data.headers.indexOf(chart.xAxis);
    const yAxisIndex = data.headers.indexOf(chart.yAxis);
    
    if (xAxisIndex === -1 || yAxisIndex === -1) {
      return [];
    }

    switch (chart.type) {
      case 'bar':
        // For bar charts, aggregate data by category
        return aggregateDataForBar(data.rows, xAxisIndex, yAxisIndex);
      
      case 'scatter':
      case 'line':
        // For scatter/line charts, use raw data points
        return data.rows
          .filter((row: readonly string[]) => 
            row[xAxisIndex] != null && 
            row[yAxisIndex] != null && 
            !isNaN(Number(row[yAxisIndex]))
          )
          .map((row: readonly string[]) => ({
            [chart.xAxis]: row[xAxisIndex],
            [chart.yAxis]: Number(row[yAxisIndex]) || 0,
            originalData: row
          }));
      
      case 'pie':
        // For pie charts, aggregate by categories
        return aggregateDataForPie(data.rows, xAxisIndex);
      
      default:
        return data.rows.map((row: readonly string[]) => ({
          [chart.xAxis]: row[xAxisIndex] || '',
          [chart.yAxis]: row[yAxisIndex] || ''
        }));
    }
  };

  // Aggregate data for bar charts
  const aggregateDataForBar = (rawData: readonly (readonly string[])[], xIndex: number, yIndex: number) => {
    if (chart.yAxis === 'count') {
      // Count frequency of each category
      const counts: Record<string, number> = {};
      rawData.forEach((row: readonly string[]) => {
        const key = String(row[xIndex] || 'Unknown');
        counts[key] = (counts[key] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([key, value]) => ({ [chart.xAxis]: key, count: value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Limit to top 20 categories
    } else {
      // Group by xColumn and sum yColumn values
      const groups: Record<string, number[]> = {};
      rawData.forEach((row: readonly string[]) => {
        const key = String(row[xIndex] || 'Unknown');
        const value = Number(row[yIndex]);
        if (!isNaN(value)) {
          if (!groups[key]) groups[key] = [];
          groups[key].push(value);
        }
      });
      
      return Object.entries(groups)
        .map(([key, values]) => ({
          [chart.xAxis]: key,
          [chart.yAxis]: values.reduce((sum, val) => sum + val, 0) / values.length // Average
        }))
        .sort((a, b) => (b[chart.yAxis] as number) - (a[chart.yAxis] as number))
        .slice(0, 20);
    }
  };

  // Aggregate data for pie charts
  const aggregateDataForPie = (rawData: readonly (readonly string[])[], columnIndex: number) => {
    const counts: Record<string, number> = {};
    rawData.forEach((row: readonly string[]) => {
      const key = String(row[columnIndex] || 'Unknown');
      counts[key] = (counts[key] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([key, value]) => ({ name: key, value, percentage: 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 categories
      .map((item, _index, array) => {
        const total = array.reduce((sum, i) => sum + i.value, 0);
        return { ...item, percentage: Math.round((item.value / total) * 100) };
      });
  };

  const chartData = prepareChartData();
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  // Get responsive dimensions
  const getChartHeight = () => {
    switch (chart.type) {
      case 'pie': return 300;
      default: return 400;
    }
  };

  const renderChart = () => {
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={getChartHeight()}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {chart.config?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={chart.xAxis}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              {chart.config?.showLegend && <Legend />}
              <Bar 
                dataKey={chart.yAxis === 'count' ? 'count' : chart.yAxis}
                fill={chart.config?.color || colors[0]}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={getChartHeight()}>
            <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {chart.config?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={chart.xAxis}
                type="number"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey={chart.yAxis}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                formatter={(value, name) => [value, name]}
              />
              {chart.config?.showLegend && <Legend />}
              <Scatter 
                dataKey={chart.yAxis}
                fill={chart.config?.color || colors[0]}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={getChartHeight()}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {chart.config?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={chart.xAxis}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              {chart.config?.showLegend && <Legend />}
              <Line 
                type="monotone"
                dataKey={chart.yAxis}
                stroke={chart.config?.color || colors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={getChartHeight()}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                formatter={(value: any, name: any) => [`${value} items`, name]}
              />
              {chart.config?.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Unsupported chart type: {chart.type}
          </div>
        );
    }
  };

  // Handle empty data
  if (!chartData || chartData.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="font-medium text-slate-900">{chart.title}</div>
        <div className="mt-4 h-64 bg-slate-100 rounded flex items-center justify-center text-slate-500">
          No data available for this visualization
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium text-slate-900">{chart.title}</div>
          <div className="text-sm text-slate-600 mt-1">
            {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} chart
            {chart.yAxis !== 'count' && `: ${chart.xAxis} vs ${chart.yAxis}`}
          </div>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {chartData.length} data points
        </div>
      </div>
      
      <div className="w-full">
        {renderChart()}
      </div>
    </div>
  );
};