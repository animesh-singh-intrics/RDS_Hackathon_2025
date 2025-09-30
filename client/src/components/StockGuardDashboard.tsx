import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Upload,
  Settings,
  Package,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  X,
} from 'lucide-react';
import { OPENROUTER_MODEL_OPTIONS, DEFAULT_OPENROUTER_MODEL } from '@/constants/openRouterModels';
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';

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

// Types
interface InventoryData {
  productId: string;
  productName: string;
  location: string;
  date: string;
  salesQty: number;
  currentStock: number;
  reorderLevel: number;
}

interface PredictionResult {
  analysisType: string;
  timeframe: string;
  criticalItems?: Array<{
    name: string;
    currentStock: number;
    projectedDemand: number;
    risk: string;
  }>;
  recommendations?: string[];
  insights?: string;
}

type AnalysisState = 'idle' | 'loading' | 'result';

const StockGuardDashboard: React.FC = () => {
  // State management
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<InventoryData[]>([]);
  const [predictionTimeframe, setPredictionTimeframe] = useState<string>('30days');
  const [analysisFocus, setAnalysisFocus] = useState<string>('comprehensive');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_OPENROUTER_MODEL);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Filter states for charts
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('4weeks');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter helper functions
  const getUniqueCategories = () => {
    // Create pseudo-categories based on common product name patterns
    const categories = new Set<string>();
    csvData.forEach(item => {
      const name = item.productName.toLowerCase();
      if (name.includes('widget')) categories.add('Widgets');
      else if (name.includes('gadget')) categories.add('Gadgets');
      else if (name.includes('tool')) categories.add('Tools');
      else if (name.includes('device')) categories.add('Devices');
      else if (name.includes('controller')) categories.add('Controllers');
      else categories.add('Other');
    });
    return Array.from(categories);
  };

  const getUniqueLocations = () => {
    const locations = new Set(csvData.map(item => item.location).filter(Boolean));
    return Array.from(locations);
  };

  const getProductCategory = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes('widget')) return 'Widgets';
    if (name.includes('gadget')) return 'Gadgets';
    if (name.includes('tool')) return 'Tools';
    if (name.includes('device')) return 'Devices';
    if (name.includes('controller')) return 'Controllers';
    return 'Other';
  };

  const getFilteredData = () => {
    return csvData.filter(item => {
      const itemCategory = getProductCategory(item.productName);
      const categoryMatch = categoryFilter === 'all' || itemCategory === categoryFilter;
      const locationMatch = locationFilter === 'all' || item.location === locationFilter;
      return categoryMatch && locationMatch;
    });
  };

  // Generate chart data from real CSV data
  const stockLevelsData = useMemo(() => {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Current Stock',
            data: [],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
          {
            label: 'Reorder Level',
            data: [],
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
          },
        ],
      };
    }

    // Get unique products and their latest stock levels
    const productMap = new Map<string, InventoryData>();
    filteredData.forEach(item => {
      productMap.set(item.productId, item);
    });

    const products = Array.from(productMap.values()).slice(0, 10); // Top 10 products
    
    return {
      labels: products.map(item => item.productName),
      datasets: [
        {
          label: 'Current Stock',
          data: products.map(item => item.currentStock),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Reorder Level',
          data: products.map(item => item.reorderLevel),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [csvData, categoryFilter, locationFilter]);

  const salesTrendData = useMemo(() => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Sales Velocity',
            data: [],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
          },
        ],
      };
    }

    // Calculate sales velocity based on time range filter
    const timeData = new Map<string, number>();
    
    filteredData.forEach(item => {
      const date = new Date(item.date);
      let timeKey: string;
      
      if (timeRangeFilter === '4weeks') {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        timeKey = weekStart.toISOString().slice(0, 10);
      } else if (timeRangeFilter === '3months' || timeRangeFilter === '6months') {
        // Group by month
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Default: group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        timeKey = weekStart.toISOString().slice(0, 10);
      }
      
      timeData.set(timeKey, (timeData.get(timeKey) || 0) + item.salesQty);
    });

    // Determine how many periods to show and sort
    let sliceCount = 4;
    let labelPrefix = 'Week';
    
    if (timeRangeFilter === '4weeks') {
      sliceCount = 4;
      labelPrefix = 'Week';
    } else if (timeRangeFilter === '3months') {
      sliceCount = 3;
      labelPrefix = 'Month';
    } else if (timeRangeFilter === '6months') {
      sliceCount = 6;
      labelPrefix = 'Month';
    }

    const sortedData = Array.from(timeData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-sliceCount);
    
    return {
      labels: sortedData.map(([period], index) => {
        if (labelPrefix === 'Month') {
          const [year, month] = period.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${monthNames[parseInt(month) - 1]} ${year}`;
        } else {
          return `${labelPrefix} ${index + 1}`;
        }
      }),
      datasets: [
        {
          label: 'Sales Velocity',
          data: sortedData.map(([, sales]) => sales),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  }, [csvData, timeRangeFilter, categoryFilter, locationFilter]);

  const riskDistributionData = useMemo(() => {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
      return {
        labels: ['Critical', 'Warning', 'Good', 'Overstocked'],
        datasets: [
          {
            data: [0, 0, 0, 0],
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(156, 163, 175, 0.8)',
            ],
            borderWidth: 0,
          },
        ],
      };
    }

    const riskCounts = { critical: 0, warning: 0, good: 0, overstocked: 0 };
    const productMap = new Map<string, InventoryData>();
    
    // Get latest data for each product from filtered data
    filteredData.forEach(item => {
      productMap.set(item.productId, item);
    });

    productMap.forEach((item) => {
      if (item.currentStock <= item.reorderLevel) {
        riskCounts.critical++;
      } else if (item.currentStock <= item.reorderLevel * 1.5) {
        riskCounts.warning++;
      } else if (item.currentStock >= item.reorderLevel * 3) {
        riskCounts.overstocked++;
      } else {
        riskCounts.good++;
      }
    });

    return {
      labels: ['Critical', 'Warning', 'Good', 'Overstocked'],
      datasets: [
        {
          data: [riskCounts.critical, riskCounts.warning, riskCounts.good, riskCounts.overstocked],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(156, 163, 175, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [csvData, categoryFilter, locationFilter]);

  const statsData = useMemo(() => {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
      return { totalItems: 0, criticalRisk: 0, lowStock: 0, overstocked: 0 };
    }

    const productMap = new Map<string, InventoryData>();
    filteredData.forEach(item => {
      productMap.set(item.productId, item);
    });

    let criticalRisk = 0;
    let lowStock = 0;
    let overstocked = 0;

    productMap.forEach((item) => {
      if (item.currentStock <= item.reorderLevel) {
        criticalRisk++;
      } else if (item.currentStock <= item.reorderLevel * 1.5) {
        lowStock++;
      } else if (item.currentStock >= item.reorderLevel * 3) {
        overstocked++;
      }
    });

    return {
      totalItems: productMap.size,
      criticalRisk,
      lowStock,
      overstocked,
    };
  }, [csvData, categoryFilter, locationFilter]);

  // CSV parsing helper
  const parseCSV = (csvText: string): InventoryData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: InventoryData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= headers.length) {
        const item: any = {};
        headers.forEach((header, index) => {
          item[header] = values[index];
        });
        
        // Map to our expected structure
        const inventoryItem: InventoryData = {
          productId: item.productid || item['product id'] || item.id || `item-${i}`,
          productName: item.productname || item['product name'] || item.name || 'Unknown Product',
          location: item.location || item.warehouse || item.store || 'Default Location',
          date: item.date || item.timestamp || new Date().toISOString().split('T')[0],
          salesQty: parseInt(item.salesqty || item['sales qty'] || item.quantity || item.sales || '0'),
          currentStock: parseInt(item.currentstock || item['current stock'] || item.stock || item.inventory || '0'),
          reorderLevel: parseInt(item.reorderlevel || item['reorder level'] || item.minimum || item.threshold || '10'),
        };
        
        data.push(inventoryItem);
      }
    }
    
    return data;
  };

  // File handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setCsvFile(file);
      setErrorMessage('');
      
      // Read and parse CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvPreview(content.split('\n').slice(0, 5).join('\n'));
        
        try {
          const parsedData = parseCSV(content);
          setCsvData(parsedData);
          
          if (parsedData.length === 0) {
            setErrorMessage('CSV file appears to be empty or invalid format.');
          } else {
            console.log(`Parsed ${parsedData.length} inventory records`);
          }
        } catch (error) {
          setErrorMessage('Error parsing CSV file. Please check the format.');
          console.error('CSV parsing error:', error);
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMessage('Please select a valid CSV file.');
    }
  }, []);

  // Data analysis helpers
  const calculateSalesVelocity = (data: InventoryData[], productId: string): number => {
    const productSales = data.filter(item => item.productId === productId);
    if (productSales.length === 0) return 0;
    
    const totalSales = productSales.reduce((sum, item) => sum + item.salesQty, 0);
    const uniqueDates = new Set(productSales.map(item => item.date)).size;
    
    return uniqueDates > 0 ? totalSales / uniqueDates : 0;
  };

  const identifyRiskItems = (data: InventoryData[]) => {
    const productMap = new Map<string, InventoryData[]>();
    
    // Group by product
    data.forEach(item => {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, []);
      }
      productMap.get(item.productId)?.push(item);
    });

    const riskItems: Array<{
      name: string;
      currentStock: number;
      projectedDemand: number;
      risk: string;
      salesVelocity: number;
      daysUntilStockout: number;
    }> = [];

    productMap.forEach((items, productId) => {
      const latestItem = items[items.length - 1];
      const salesVelocity = calculateSalesVelocity(data, productId);
      const daysUntilStockout = salesVelocity > 0 ? latestItem.currentStock / salesVelocity : Infinity;
      
      let riskLevel = 'Low';
      if (latestItem.currentStock <= latestItem.reorderLevel) {
        riskLevel = 'Critical';
      } else if (daysUntilStockout < 7) {
        riskLevel = 'High';
      } else if (daysUntilStockout < 14) {
        riskLevel = 'Medium';
      }

      if (riskLevel !== 'Low') {
        riskItems.push({
          name: latestItem.productName,
          currentStock: latestItem.currentStock,
          projectedDemand: Math.ceil(salesVelocity * 7), // 7-day projection
          risk: riskLevel,
          salesVelocity,
          daysUntilStockout: Math.floor(daysUntilStockout),
        });
      }
    });

    return riskItems.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  };

  const generateAnalysisPrompt = (data: InventoryData[], riskItems: any[]): string => {
    const totalProducts = new Set(data.map(item => item.productId)).size;
    const totalLocations = new Set(data.map(item => item.location)).size;
    const averageStock = data.reduce((sum, item) => sum + item.currentStock, 0) / data.length;
    
    return `You are an expert inventory analyst. Analyze this inventory data and provide actionable insights.

**Dataset Overview:**
- Total Products: ${totalProducts}
- Locations: ${totalLocations}
- Records Analyzed: ${data.length}
- Average Stock Level: ${Math.round(averageStock)}

**Risk Analysis:**
${riskItems.map(item => 
  `- ${item.name}: ${item.currentStock} units (${item.daysUntilStockout} days until stockout, velocity: ${item.salesVelocity.toFixed(1)}/day)`
).join('\n')}

**Analysis Parameters:**
- Timeframe: ${predictionTimeframe}
- Focus: ${analysisFocus}

Please provide:
1. **Critical Alerts**: Immediate stockout risks (next 1-7 days)
2. **Recommendations**: Specific reorder quantities and timing
3. **Insights**: Patterns, seasonal trends, and optimization opportunities
4. **Action Items**: Prioritized next steps

Format as JSON with this structure:
{
  "criticalItems": [{"name": "Product", "currentStock": 0, "projectedDemand": 0, "risk": "description"}],
  "recommendations": ["action1", "action2"],
  "insights": "detailed analysis text"
}`;
  };

  // Analysis handler
  const handleAnalysis = useCallback(async () => {
    if (!csvFile || !apiKey.trim()) {
      setErrorMessage('Please upload data and configure API settings first.');
      return;
    }

    if (csvData.length === 0) {
      setErrorMessage('No valid inventory data found. Please check your CSV file format.');
      return;
    }

    setAnalysisState('loading');
    setErrorMessage('');

    try {
      // Analyze local data first
      const riskItems = identifyRiskItems(csvData);
      const analysisPrompt = generateAnalysisPrompt(csvData, riskItems);
      
      // Call AI API for insights
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          model: selectedModel,
          apiKey: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result); // Debug log
      
      // OpenRouter returns: { choices: [{ message: { content: "..." } }] }
      let aiResponse = '';
      if (result.choices && result.choices[0] && result.choices[0].message) {
        aiResponse = result.choices[0].message.content || '';
      } else {
        aiResponse = result.response || result.message || '';
      }
      
      // Try to parse JSON response from AI
      let parsedResult: PredictionResult;
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          parsedResult = {
            analysisType: analysisFocus,
            timeframe: predictionTimeframe,
            criticalItems: jsonData.criticalItems || riskItems.slice(0, 5).map(item => ({
              name: item.name,
              currentStock: item.currentStock,
              projectedDemand: item.projectedDemand,
              risk: `${item.risk} - ${item.daysUntilStockout} days until stockout`,
            })),
            recommendations: jsonData.recommendations || [
              'Review high-risk items immediately',
              'Implement automated reorder alerts',
              'Consider safety stock adjustments',
            ],
            insights: jsonData.insights || aiResponse,
          };
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback to structured data from local analysis
        parsedResult = {
          analysisType: analysisFocus,
          timeframe: predictionTimeframe,
          criticalItems: riskItems.slice(0, 5).map(item => ({
            name: item.name,
            currentStock: item.currentStock,
            projectedDemand: item.projectedDemand,
            risk: `${item.risk} - ${item.daysUntilStockout} days until stockout`,
          })),
          recommendations: [
            `Found ${riskItems.length} items requiring attention`,
            'Prioritize critical stockout risks',
            'Review sales velocity patterns',
          ],
          insights: aiResponse || 'Local analysis completed. Check critical items for immediate attention.',
        };
      }

      setPredictionResult(parsedResult);
      setAnalysisState('result');
      
    } catch (error) {
      console.error('Analysis error:', error);
      const detailedMessage = (error as any)?.response?.data?.error?.message || (error as Error).message;
      setErrorMessage(`Analysis failed: ${detailedMessage}`);
      setAnalysisState('idle');
    }
  }, [csvFile, csvData, apiKey, analysisFocus, predictionTimeframe, selectedModel, identifyRiskItems, generateAnalysisPrompt]);

  // Sample CSV download
  const downloadSampleCSV = useCallback(() => {
    const sampleData = `ProductID,ProductName,Location,Date,SalesQty,CurrentStock,ReorderLevel
P001,Widget Pro X1,Warehouse A,2024-01-15,5,15,50
P002,Gadget Ultra,Warehouse B,2024-01-15,8,45,30
P003,Tool Master,Location C,2024-01-15,12,8,20
P004,Device Prime,Warehouse A,2024-01-15,3,200,150
P005,Smart Controller,Warehouse B,2024-01-15,15,30,40
P001,Widget Pro X1,Warehouse A,2024-01-16,7,8,50
P002,Gadget Ultra,Warehouse B,2024-01-16,4,41,30
P003,Tool Master,Location C,2024-01-16,6,2,20
P004,Device Prime,Warehouse A,2024-01-16,2,198,150
P005,Smart Controller,Warehouse B,2024-01-16,9,21,40`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_inventory_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with Settings */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">StockGuard</h1>
              <p className="text-gray-600">AI-Powered Inventory Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </button>
            
            <button
              onClick={downloadSampleCSV}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📊 Sample CSV
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Filter Status Indicator */}
        {(categoryFilter !== 'all' || locationFilter !== 'all') && (
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800">Active Filters:</span>
              {categoryFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Category: {categoryFilter}
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Location: {locationFilter}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setLocationFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.totalItems.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Risk</p>
                <p className="text-2xl font-bold text-red-600">{statsData.criticalRisk}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{statsData.lowStock}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overstocked</p>
                <p className="text-2xl font-bold text-gray-600">{statsData.overstocked}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Levels Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Current vs Reorder Levels</h2>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="h-80">
              {stockLevelsData.labels.length > 0 ? (
                <Bar data={stockLevelsData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No data available</p>
                    <p className="text-sm">Upload inventory data or adjust filters to see stock levels</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Risk Distribution</h2>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="all">All Locations</option>
                {getUniqueLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div className="h-80 flex items-center justify-center">
              {riskDistributionData.datasets[0].data.some(val => val > 0) ? (
                <Doughnut data={riskDistributionData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }} />
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">No data available</p>
                  <p className="text-sm">Upload inventory data or adjust filters to see risk distribution</p>
                </div>
              )}
            </div>
          </div>

          {/* Sales Trend */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Sales Velocity Trend</h2>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={timeRangeFilter}
                onChange={(e) => setTimeRangeFilter(e.target.value)}
              >
                <option value="4weeks">Last 4 Weeks</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
              </select>
            </div>
            <div className="h-64">
              {salesTrendData.labels.length > 0 ? (
                <Line data={salesTrendData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No data available</p>
                    <p className="text-sm">Upload inventory data or adjust filters to see sales trends</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Critical Items List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Critical Items</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {(() => {
                const filteredData = getFilteredData();
                if (filteredData.length > 0) {
                  return identifyRiskItems(filteredData).slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">
                          Stock: {item.currentStock} • {item.daysUntilStockout} days left
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.risk === 'High' || item.risk === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.risk}
                      </span>
                    </div>
                  ));
                } else {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No data available</p>
                      <p className="text-xs mt-1">Upload inventory data to see critical items</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Settings & Configuration</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your OpenRouter API key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {OPENROUTER_MODEL_OPTIONS.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prediction Timeframe
                    </label>
                    <select
                      value={predictionTimeframe}
                      onChange={(e) => setPredictionTimeframe(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7days">Next 7 days</option>
                      <option value="30days">Next 30 days</option>
                      <option value="90days">Next 90 days</option>
                      <option value="6months">Next 6 months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Focus
                    </label>
                    <select
                      value={analysisFocus}
                      onChange={(e) => setAnalysisFocus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="stockouts">Stockout Risk</option>
                      <option value="overstock">Overstock Analysis</option>
                      <option value="demand">Demand Forecasting</option>
                      <option value="comprehensive">Comprehensive Analysis</option>
                    </select>
                  </div>
                </div>

                {csvFile && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Current File:</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{csvFile.name}</p>
                    
                    {csvPreview && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview:</h4>
                        <div className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto max-h-32">
                          <pre>{csvPreview}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAnalysis}
                    disabled={!csvFile || !apiKey || analysisState === 'loading'}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {analysisState === 'loading' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Run Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Results */}
        {predictionResult && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">AI Analysis Results</h2>
              <div className="flex space-x-2">
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                  {predictionResult.timeframe}
                </span>
                <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                  {predictionResult.analysisType}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Items */}
              {predictionResult.criticalItems && predictionResult.criticalItems.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Critical Items
                  </h3>
                  <div className="space-y-3">
                    {predictionResult.criticalItems.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded border-l-4 border-red-500">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Current: {item.currentStock} | Demand: {item.projectedDemand}
                        </p>
                        <p className="text-sm text-red-600 mt-1">{item.risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {predictionResult.recommendations && predictionResult.recommendations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {predictionResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-700 bg-white p-2 rounded border-l-4 border-blue-400">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insights */}
              {predictionResult.insights && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Key Insights
                  </h3>
                  <div className="bg-white p-3 rounded text-sm text-green-700">
                    <p className="whitespace-pre-wrap">{predictionResult.insights}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {errorMessage && (
          <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md shadow-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockGuardDashboard;