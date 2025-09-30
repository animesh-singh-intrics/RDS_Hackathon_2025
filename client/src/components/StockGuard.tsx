import React, { useState, useCallback, useRef } from 'react';
import { Upload, TrendingUp, AlertTriangle, Calendar, MapPin, Target, FileSpreadsheet } from 'lucide-react';
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

interface InventoryData {
  productId: string;
  productName: string;
  location: string;
  date: string;
  salesQty: number;
  currentStock: number;
  reorderLevel: number;
  price?: number;
  category?: string;
}

interface PredictionResult {
  analysis: string;
  analysisType: string;
  timeframe: string;
  hasHistoricalData: boolean;
}

type AnalysisState = 'idle' | 'analyzing' | 'result';

const StockGuard: React.FC = () => {
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

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prediction timeframe options
  const timeframeOptions = [
    { value: '7days', label: 'Next 7 Days', description: 'Short-term immediate risks' },
    { value: '30days', label: 'Next 30 Days', description: 'Monthly planning horizon' },
    { value: '90days', label: 'Next Quarter', description: 'Long-term strategic planning' }
  ];

  // Analysis focus options
  const analysisFocusOptions = [
    { value: 'stockout', label: 'Stock Depletion Alerts', description: 'Identify products likely to run out' },
    { value: 'location', label: 'Location-based Trends', description: 'Geographic performance analysis' },
    { value: 'seasonal', label: 'Seasonal Demand Predictions', description: 'Time-based pattern analysis' },
    { value: 'comprehensive', label: 'Comprehensive Analysis', description: 'Full inventory intelligence report' }
  ];

  // Available models
  const models = OPENROUTER_MODEL_OPTIONS;

  // CSV parsing function
  const parseCSV = useCallback((content: string): InventoryData[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: InventoryData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length >= 6) {
        const item: InventoryData = {
          productId: values[headers.indexOf('productid')] || '',
          productName: values[headers.indexOf('productname')] || '',
          location: values[headers.indexOf('location')] || '',
          date: values[headers.indexOf('date')] || '',
          salesQty: parseInt(values[headers.indexOf('salesqty')]) || 0,
          currentStock: parseInt(values[headers.indexOf('currentstock')]) || 0,
          reorderLevel: parseInt(values[headers.indexOf('reorderlevel')]) || 0,
        };
        
        if (item.productId && item.productName) {
          data.push(item);
        }
      }
    }
    
    return data;
  }, []);

  // Handle CSV file selection
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
            setErrorMessage('No valid data found in CSV. Please check the format.');
          }
        } catch (error) {
          setErrorMessage('Error parsing CSV file. Please check the format.');
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMessage('Please select a valid CSV file.');
    }
  }, [parseCSV]);

  const removeFile = useCallback(() => {
    setCsvFile(null);
    setCsvData([]);
    setCsvPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Data analysis functions
  const calculateStockStats = useCallback(() => {
    if (!csvData.length) return { total: 0, critical: 0, lowStock: 0, overStock: 0 };
    
    let critical = 0;
    let lowStock = 0;
    let overStock = 0;
    
    csvData.forEach(item => {
      if (item.currentStock <= item.reorderLevel * 0.5) {
        critical++;
      } else if (item.currentStock <= item.reorderLevel) {
        lowStock++;
      } else if (item.currentStock > item.reorderLevel * 2) {
        overStock++;
      }
    });
    
    return {
      total: csvData.length,
      critical,
      lowStock,
      overStock
    };
  }, [csvData]);


  const getCriticalItems = useCallback(() => {
    if (!csvData.length) return [];
    
    return csvData
      .filter(item => item.currentStock <= item.reorderLevel)
      .sort((a, b) => (a.currentStock / a.reorderLevel) - (b.currentStock / b.reorderLevel))
      .slice(0, 10)
      .map(item => ({
        name: item.productName,
        stock: item.currentStock,
        reorder: item.reorderLevel,
        risk: item.currentStock <= item.reorderLevel * 0.5 ? 'High' : 'Medium'
      }));
  }, [csvData]);

  // Handle prediction generation with API integration
  const handleGeneratePredictions = useCallback(async () => {
    setErrorMessage('');
    setPredictionResult(null);
    
    // Validation
    if (!csvData.length) {
      setErrorMessage('Please upload a valid CSV file with inventory data.');
      return;
    }

    if (!apiKey.trim()) {
      setErrorMessage('Please enter your OpenRouter API key.');
      return;
    }

    setAnalysisState('analyzing');
    
    try {
      // Prepare data summary for AI analysis
      const stats = calculateStockStats();
      const criticalItems = getCriticalItems();
      
      const dataSummary = {
        totalItems: stats.total,
        criticalItems: stats.critical,
        lowStockItems: stats.lowStock,
        overstockItems: stats.overStock,
        sampleItems: csvData.slice(0, 5).map(item => ({
          product: item.productName,
          currentStock: item.currentStock,
          reorderLevel: item.reorderLevel,
          location: item.location,
          recentSales: item.salesQty
        }))
      };

      const prompt = `Analyze this inventory data and provide predictions for ${predictionTimeframe} focusing on ${analysisFocus}.

Data Summary:
- Total Products: ${dataSummary.totalItems}
- Critical Risk Items: ${dataSummary.criticalItems}
- Low Stock Items: ${dataSummary.lowStockItems}
- Overstocked Items: ${dataSummary.overstockItems}

Sample Items: ${JSON.stringify(dataSummary.sampleItems, null, 2)}

Please provide:
1. Critical items that need immediate attention
2. Specific recommendations for stock management
3. Key insights and trends
4. Predicted stockout risks

Format response as JSON with: criticalItems[], recommendations[], insights string.`;

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: selectedModel,
          apiKey: apiKey
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      let analysisResult;
      
      try {
        // Get AI response from OpenRouter format
        const aiResponse = data.choices?.[0]?.message?.content || data.response || '';
        
        // Extract JSON from markdown code block if present
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
        
        analysisResult = JSON.parse(jsonString);
      } catch (error) {
        // If JSON parsing fails, create structured response
        const aiResponse = data.choices?.[0]?.message?.content || data.response || '';
        console.error('Failed to parse AI response:', error);
        console.log('Raw AI response:', aiResponse);
        
        analysisResult = {
          criticalItems: criticalItems.map(item => ({
            name: item.name,
            currentStock: item.stock,
            projectedDemand: item.reorder,
            risk: `${item.risk} risk - Current: ${item.stock}, Reorder: ${item.reorder}`
          })),
          recommendations: [
            'Immediate reorder recommended for critical items',
            'Monitor sales velocity for trending products',
            'Optimize reorder levels based on seasonal patterns'
          ],
          insights: aiResponse || 'Analysis completed successfully.'
        };
      }

      setPredictionResult({
        ...analysisResult,
        analysisType: analysisFocusOptions.find(option => option.value === analysisFocus)?.label || analysisFocus,
        timeframe: timeframeOptions.find(option => option.value === predictionTimeframe)?.label || predictionTimeframe,
        hasHistoricalData: true
      });
      
      setAnalysisState('result');
      
    } catch (error) {
      console.error('Analysis error:', error);
      const detailedMessage = (error as any)?.response?.data?.error?.message || (error as Error).message;
      setErrorMessage(`Failed to generate predictions: ${detailedMessage}`);
      setAnalysisState('idle');
    }
  }, [csvData, apiKey, selectedModel, analysisFocus, predictionTimeframe, calculateStockStats, getCriticalItems, analysisFocusOptions, timeframeOptions]);

  // Reset to start new analysis
  const resetAnalysis = useCallback(() => {
    setAnalysisState('idle');
    setPredictionResult(null);
    setErrorMessage('');
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 StockGuard</h1>
        <p className="text-gray-600">AI-powered inventory predictions based on historical data</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* CSV Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-yellow-500" />
              Historical Data Upload
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inventory History CSV *
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".csv"
                  className="hidden"
                  disabled={analysisState === 'analyzing'}
                />
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                  {!csvFile ? (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-yellow-600 hover:text-yellow-700 font-medium"
                        disabled={analysisState === 'analyzing'}
                      >
                        Click to upload CSV file
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Expected columns: ProductID, ProductName, Location, Date, SalesQty, CurrentStock, ReorderLevel
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">{csvFile.name}</span>
                      </div>
                      <button
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={analysisState === 'analyzing'}
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                </div>
                
                {csvPreview && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border text-xs font-mono text-gray-600 max-h-24 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Preview:</div>
                    <pre className="whitespace-pre-wrap">{csvPreview}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Configuration */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-yellow-500" />
              Analysis Configuration
            </h3>
            
            <div className="space-y-4">
              {/* Prediction Timeframe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Prediction Timeframe *
                </label>
                <select
                  value={predictionTimeframe}
                  onChange={(e) => setPredictionTimeframe(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  disabled={analysisState === 'analyzing'}
                >
                  <option value="">Select prediction period...</option>
                  {timeframeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Analysis Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Analysis Focus *
                </label>
                <select
                  value={analysisFocus}
                  onChange={(e) => setAnalysisFocus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  disabled={analysisState === 'analyzing'}
                >
                  <option value="">Select analysis type...</option>
                  {analysisFocusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  disabled={analysisState === 'analyzing'}
                >
                  {models.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  disabled={analysisState === 'analyzing'}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            {analysisState === 'idle' && (
              <button
                onClick={handleGeneratePredictions}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Generate Predictions
              </button>
            )}

            {analysisState === 'analyzing' && (
              <button
                disabled
                className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-md flex items-center justify-center"
              >
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing Trends...
              </button>
            )}

            {analysisState === 'result' && (
              <button
                onClick={resetAnalysis}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors"
              >
                New Analysis
              </button>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Results Section - Takes 3 columns */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border p-6 h-full">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Inventory Predictions
            </h2>

            {analysisState === 'idle' && (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Ready for Analysis</p>
                  <p className="text-sm">Upload your inventory history CSV and configure the analysis to get started</p>
                </div>
              </div>
            )}

            {analysisState === 'analyzing' && (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                  <p className="text-lg mb-2">Analyzing Historical Data</p>
                  <p className="text-sm">Processing sales patterns and generating predictions...</p>
                  <p className="text-xs mt-2 text-gray-400">This may take 15-45 seconds</p>
                </div>
              </div>
            )}

            {analysisState === 'result' && predictionResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    {predictionResult.analysisType}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {predictionResult.timeframe}
                  </span>
                </div>
                
                {/* Placeholder for actual results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="font-semibold text-red-800">Critical Alerts</span>
                    </div>
                    <div className="text-sm text-red-700">
                      Analysis results will appear here...
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-semibold text-yellow-800">Location Trends</span>
                    </div>
                    <div className="text-sm text-yellow-700">
                      Geographic insights will appear here...
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Target className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-800">Recommendations</span>
                    </div>
                    <div className="text-sm text-green-700">
                      Action items will appear here...
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                  💡 <strong>Tip:</strong> These predictions are based on historical sales patterns. Review recommendations and adjust based on your business knowledge and upcoming events.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockGuard;