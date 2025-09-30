import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import type { 
  ParsedCSVData, 
  DatasetAnalysis, 
  UploadState,
  ColumnType
} from './types/index.js';
import { APIKeyManager } from './components/APIKeyManager.js';
import { SecureHTMLRenderer } from './components/SecureHTMLRenderer.js';
import { UnifiedDashboardRenderer } from './components/UnifiedDashboardRenderer.js';

// Service imports
import { unifiedDashboardService } from './services/UnifiedDashboardService.js';

// Types for unified dashboard
interface DashboardConfig {
  dashboard: {
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
  };
  kpis: any[];
  charts: any[];
}

const DataVizPro: React.FC = () => {
  // Core state management
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    file: null,
    error: null
  });
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  
  // LLM Dashboard Generation State
  const [llmDashboardHTML, setLLMDashboardHTML] = useState<string | null>(null);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [renderMode, setRenderMode] = useState<'html' | 'react'>('react');
  
  // Processing steps state
  const [currentStep, setCurrentStep] = useState<'upload' | 'parsing' | 'analyzing' | 'dashboard' | 'complete'>('upload');
  const [processingError, setProcessingError] = useState<string | null>(null);

  // References
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Parse CSV file using PapaParse
   */
  const parseCSV = async (file: File, signal: AbortSignal): Promise<ParsedCSVData> => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('CSV parsing cancelled'));
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          if (signal.aborted) {
            reject(new Error('CSV parsing cancelled'));
            return;
          }

          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
            return;
          }

          const data: ParsedCSVData = {
            headers: results.meta.fields || [],
            rows: results.data as readonly (readonly string[])[],
            columnTypes: new Array((results.meta.fields || []).length).fill('unknown' as ColumnType),
            rowCount: results.data.length,
            columnCount: (results.meta.fields || []).length,
            hasHeaders: true,
            sampleRows: (results.data.slice(0, 5) as readonly (readonly string[])[]) || []
          };

          resolve(data);
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  };

  /**
   * Analyze dataset structure and generate insights
   */
  const analyzeDataset = async (data: ParsedCSVData, signal: AbortSignal): Promise<DatasetAnalysis> => {
    if (signal.aborted) throw new Error('Dataset analysis cancelled');

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing

    // Basic analysis - detect column types and patterns
    const columnAnalysis = data.headers.map((header, headerIndex) => {
      const values = data.rows.map((row: readonly string[]) => row[headerIndex]).filter((val: string) => val !== null && val !== undefined && val !== '');
      const sampleValues = values.slice(0, 100);
      
      // Try to determine data type
      const numericValues = sampleValues.filter(val => !isNaN(Number(val)) && val !== '');
      const isNumeric = numericValues.length / sampleValues.length > 0.8;
      
      const dateValues = sampleValues.filter(val => !isNaN(Date.parse(val)));
      const isDate = dateValues.length / sampleValues.length > 0.8;
      
      const uniqueValues = new Set(values);
      
      return {
        name: header,
        type: isNumeric ? 'number' : (isDate ? 'date' : 'string'),
        uniqueValues: uniqueValues.size,
        nullCount: data.rows.length - values.length,
        sampleValues: Array.from(uniqueValues).slice(0, 5)
      };
    });

    return {
      totalRows: data.rowCount,
      totalColumns: data.headers.length,
      columns: columnAnalysis,
      dataQuality: {
        completeness: 0.95, // Placeholder
        consistency: 0.9,   // Placeholder
        validity: 0.95      // Placeholder
      } as any,
      insights: [
        'Dataset contains structured tabular data ready for visualization',
        `${data.rowCount} rows across ${data.headers.length} columns detected`
      ]
    } as any;
  };

  /**
   * Generate AI-powered dashboard using LLM
   */
  const generateAIDashboard = async (
    data: ParsedCSVData, 
    analysis: DatasetAnalysis, 
    signal: AbortSignal
  ): Promise<void> => {
    if (signal.aborted) throw new Error('Dashboard generation cancelled');

    try {
      // Set API key in service
      unifiedDashboardService.setApiKey(apiKey);
      
      // Generate unified dashboard using LLM
      const result = await unifiedDashboardService.generateUnifiedDashboard({
        csvData: data,
        analysis,
        userPreferences: {
          style: 'modern',
          focusArea: 'auto-detect'
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate dashboard');
      }

      // Store both HTML and structured config for flexible rendering
      setLLMDashboardHTML(result.htmlContent || '');
      if (result.dashboardConfig) {
        setDashboardConfig(result.dashboardConfig);
      }
      
    } catch (error) {
      console.error('AI Dashboard generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDashboardError(errorMessage);
      
      // Generate fallback dashboard
      if (!apiKey) {
        setDashboardError('OpenRouter API key is required for AI dashboard generation');
      } else {
        try {
          const fallbackResult = await unifiedDashboardService.generateUnifiedDashboard({
            csvData: data,
            analysis
          });
          setLLMDashboardHTML(fallbackResult.htmlContent || '');
          if (fallbackResult.dashboardConfig) {
            setDashboardConfig(fallbackResult.dashboardConfig);
          }
        } catch (fallbackError) {
          console.error('Fallback generation also failed:', fallbackError);
          setDashboardError('Both AI generation and fallback failed. Please try again.');
        }
      }
    }
  };

  /**
   * Reset dashboard state
   */
  const resetDashboardState = useCallback(() => {
    setLLMDashboardHTML(null);
    setDashboardConfig(null);
    setDashboardError(null);
    setRenderMode('react');
  }, []);

  /**
   * Process uploaded CSV file through the complete pipeline
   */
  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    
    // Reset dashboard state for new file
    resetDashboardState();
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setProcessingError(null);
    setCurrentStep('parsing');

    try {
      // Step 1: Parse CSV
      const parsedData = await parseCSV(file, abortController.signal);
      setParsedData(parsedData);
      
      // Step 2: Analyze data structure
      setCurrentStep('analyzing');
      const analysisResult = await analyzeDataset(parsedData, abortController.signal);
      setAnalysis(analysisResult);

      // Step 3: Generate AI Dashboard
      setCurrentStep('dashboard');
      await generateAIDashboard(parsedData, analysisResult, abortController.signal);
      
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('File processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingError(errorMessage);
    }
  }, [apiKey]);

  /**
   * Handle file selection from upload component
   */
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      // Reset previous state
      setProcessingError(null);
      setParsedData(null);
      setAnalysis(null);
      setLLMDashboardHTML(null);
      setDashboardError(null);

      // Update upload state
      setUploadState({
        uploading: true,
        progress: 0,
        file,
        error: null
      });

      // Start processing pipeline
      await processFile(file);

      // Mark upload as complete
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100
      }));

    } catch (error) {
      console.error('File processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage
      }));
      
      setProcessingError(errorMessage);
    }
  }, [processFile]);

  /**
   * Cancel processing
   */
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setUploadState({
      uploading: false,
      progress: 0,
      file: null,
      error: null
    });
    
    setCurrentStep('upload');
    setParsedData(null);
    setAnalysis(null);
    setLLMDashboardHTML(null);
    setDashboardError(null);
  }, []);

  /**
   * Simple CSV upload component
   */
  const renderUpload = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload CSV File
      </h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
          id="csv-upload"
          disabled={uploadState.uploading}
        />
        <label
          htmlFor="csv-upload"
          className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            uploadState.uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploadState.uploading ? 'Processing...' : 'Select CSV File'}
        </label>
        {uploadState.file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {uploadState.file.name}
          </p>
        )}
        {uploadState.uploading && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {uploadState.uploading && (
        <div className="mt-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Cancel Processing
          </button>
        </div>
      )}
    </div>
  );

  /**
   * Render processing status
   */
  const renderProcessingStatus = () => {
    if (currentStep === 'upload' || !uploadState.uploading) return null;

    const stepLabels = {
      parsing: 'Parsing CSV structure...',
      analyzing: 'Analyzing data patterns...',
      dashboard: 'Generating intelligent dashboard...',
      complete: 'Dashboard ready!'
    };

    return (
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-3 px-6 py-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="animate-spin w-5 h-5 text-blue-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span className="text-blue-900 font-medium">{stepLabels[currentStep]}</span>
        </div>
      </div>
    );
  };

  /**
   * Render dashboard results
   */
  const renderDashboard = () => {
    if (!llmDashboardHTML && !dashboardError) return null;

    return (
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              AI-Generated Dashboard
            </h2>
            
            {/* Render Mode Toggle */}
            {(llmDashboardHTML || dashboardConfig) && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Render Mode:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setRenderMode('react')}
                    className={`px-3 py-1 text-sm rounded-md transition-all ${
                      renderMode === 'react'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📊 Interactive
                  </button>
                  <button
                    onClick={() => setRenderMode('html')}
                    className={`px-3 py-1 text-sm rounded-md transition-all ${
                      renderMode === 'html'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🖥️ HTML
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {dashboardError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {dashboardError}
            </div>
          )}
        </div>
        
        {/* Conditional Rendering based on mode */}
        {renderMode === 'react' && dashboardConfig ? (
          <div className="p-6">
            <UnifiedDashboardRenderer config={dashboardConfig} />
          </div>
        ) : renderMode === 'html' && llmDashboardHTML ? (
          <div className="p-6">
            <SecureHTMLRenderer htmlContent={llmDashboardHTML} />
          </div>
        ) : llmDashboardHTML ? (
          <div className="p-6">
            <SecureHTMLRenderer htmlContent={llmDashboardHTML} />
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          DataViz Pro - AI Dashboard Generator
        </h1>
        <p className="text-gray-600">
          Upload your CSV file and let AI create a custom dashboard with intelligent visualizations
        </p>
      </div>

      {/* API Key Management */}
      <div className="mb-6">
        <APIKeyManager 
          onApiKeySet={setApiKey}
        />
      </div>

      {/* File Upload Section */}
      {renderUpload()}

      {/* Processing Status */}
      {renderProcessingStatus()}

      {/* Error Display */}
      {processingError && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <h3 className="font-semibold">Processing Error</h3>
          <p className="mt-1">{processingError}</p>
        </div>
      )}

      {/* Dashboard Display */}
      {renderDashboard()}

      {/* Debug Information */}
      {parsedData && analysis && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Dataset Summary</h3>
          <p>Rows: {parsedData.rowCount} | Columns: {parsedData.headers.length}</p>
          <p>Headers: {parsedData.headers.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export default DataVizPro;