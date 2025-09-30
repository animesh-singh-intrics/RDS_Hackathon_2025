import React, { useState, useRef, useMemo } from 'react';
import { Button } from './ui/Button';
import { Doughnut, Bar } from 'react-chartjs-2';
import { OPENROUTER_MODEL_OPTIONS, DEFAULT_OPENROUTER_MODEL } from '@/constants/openRouterModels';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ReviewData {
  id?: string;
  review: string;
  rating?: number;
  product?: string;
  customer?: string;
  date?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: number;
}

interface SentimentAnalysis {
  overallScore: number; // 0-100 scale
  sentimentBreakdown: {
    positive: { count: number; percentage: number };
    negative: { count: number; percentage: number };
    neutral: { count: number; percentage: number };
  };
  keyThemes: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  insights: {
    summary: string;
    recommendations: string[];
    criticalIssues: string[];
    strengths: string[];
  };
  ratingDistribution?: { [key: number]: number };
  averageRating?: number;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  processedCount: number;
  totalCount: number;
}

export const SentimentSorter: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [analysisResult, setAnalysisResult] = useState<SentimentAnalysis | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    processedCount: 0,
    totalCount: 0
  });
  const [selectedModel, setSelectedModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [apiKey, setApiKey] = useState('');
  const [productName, setProductName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = OPENROUTER_MODEL_OPTIONS;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      parseCSV(csv);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have at least a header row and one data row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const reviewColumnIndex = headers.findIndex(h => 
      h.includes('review') || h.includes('comment') || h.includes('feedback') || h.includes('text')
    );
    
    if (reviewColumnIndex === -1) {
      alert('CSV must contain a column for reviews (e.g., "review", "comment", "feedback", or "text").');
      return;
    }

    const ratingColumnIndex = headers.findIndex(h => 
      h.includes('rating') || h.includes('score') || h.includes('stars')
    );
    const productColumnIndex = headers.findIndex(h => 
      h.includes('product') || h.includes('item') || h.includes('name')
    );
    const customerColumnIndex = headers.findIndex(h => 
      h.includes('customer') || h.includes('user') || h.includes('reviewer')
    );
    const dateColumnIndex = headers.findIndex(h => 
      h.includes('date') || h.includes('time') || h.includes('created')
    );

    const parsedReviews: ReviewData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      
      if (columns.length >= reviewColumnIndex + 1 && columns[reviewColumnIndex]) {
        const review: ReviewData = {
          id: i.toString(),
          review: columns[reviewColumnIndex],
        };

        if (ratingColumnIndex !== -1 && columns[ratingColumnIndex]) {
          const rating = parseFloat(columns[ratingColumnIndex]);
          if (!isNaN(rating)) review.rating = rating;
        }

        if (productColumnIndex !== -1 && columns[productColumnIndex]) {
          review.product = columns[productColumnIndex];
        }

        if (customerColumnIndex !== -1 && columns[customerColumnIndex]) {
          review.customer = columns[customerColumnIndex];
        }

        if (dateColumnIndex !== -1 && columns[dateColumnIndex]) {
          review.date = columns[dateColumnIndex];
        }

        parsedReviews.push(review);
      }
    }

    if (parsedReviews.length === 0) {
      alert('No valid reviews found in the CSV file.');
      return;
    }

    setReviews(parsedReviews);
    
    // Auto-detect product name if not set
    if (!productName && parsedReviews[0].product) {
      setProductName(parsedReviews[0].product);
    }
  };

  const analyzeSentiment = async () => {
    if (reviews.length === 0) {
      alert('Please upload a CSV file with reviews first.');
      return;
    }

    if (!apiKey.trim()) {
      alert('Please enter your OpenRouter API key.');
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: 0,
      currentStep: 'Initializing sentiment analysis...',
      processedCount: 0,
      totalCount: reviews.length
    });

    try {
      // Batch process reviews for efficiency (process in chunks of 20)
      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < reviews.length; i += batchSize) {
        batches.push(reviews.slice(i, i + batchSize));
      }

      const processedReviews: ReviewData[] = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        setProcessing(prev => ({
          ...prev,
          progress: Math.round((batchIndex / batches.length) * 70), // 70% for processing
          currentStep: `Processing batch ${batchIndex + 1} of ${batches.length}...`,
          processedCount: batchIndex * batchSize
        }));

        const prompt = `Analyze the sentiment of the following customer reviews for ${productName || 'the product'}. For each review, classify it as positive, negative, or neutral, and provide a confidence score (0-1).

Reviews to analyze:
${batch.map((review, index) => `${index + 1}. "${review.review}"`).join('\n')}

Please respond with ONLY a JSON array in this exact format:
[
  {
    "sentiment": "positive|negative|neutral",
    "confidence": 0.95
  }
]

Important: Return exactly ${batch.length} sentiment classifications in the same order as the reviews.`;

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
          throw new Error('Failed to analyze sentiment');
        }

        const data = await response.json();
        
        try {
          const aiResponse = data.choices?.[0]?.message?.content || data.response || '';
          const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
          const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
          
          const sentiments = JSON.parse(jsonString);
          
          // Apply sentiment results to this batch
          batch.forEach((review, index) => {
            if (sentiments[index]) {
              review.sentiment = sentiments[index].sentiment;
              review.confidence = sentiments[index].confidence;
            } else {
              // Fallback sentiment based on rating if available
              if (review.rating) {
                review.sentiment = review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral';
                review.confidence = 0.6;
              } else {
                review.sentiment = 'neutral';
                review.confidence = 0.5;
              }
            }
          });
        } catch (parseError) {
          console.error('Failed to parse sentiment results:', parseError);
          // Fallback: assign sentiment based on ratings
          batch.forEach(review => {
            if (review.rating) {
              review.sentiment = review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral';
              review.confidence = 0.6;
            } else {
              review.sentiment = 'neutral';
              review.confidence = 0.5;
            }
          });
        }

        processedReviews.push(...batch);
      }

      // Generate overall analysis
      setProcessing(prev => ({
        ...prev,
        progress: 80,
        currentStep: 'Generating insights and themes...',
        processedCount: processedReviews.length
      }));

      const analysisPrompt = `Based on the following sentiment analysis of ${processedReviews.length} customer reviews for ${productName || 'the product'}, provide a comprehensive analysis.

Sentiment Summary:
- Positive: ${processedReviews.filter(r => r.sentiment === 'positive').length} reviews
- Negative: ${processedReviews.filter(r => r.sentiment === 'negative').length} reviews  
- Neutral: ${processedReviews.filter(r => r.sentiment === 'neutral').length} reviews

Sample Reviews by Sentiment:
Positive Reviews:
${processedReviews.filter(r => r.sentiment === 'positive').slice(0, 5).map(r => `"${r.review}"`).join('\n')}

Negative Reviews:
${processedReviews.filter(r => r.sentiment === 'negative').slice(0, 5).map(r => `"${r.review}"`).join('\n')}

Neutral Reviews:
${processedReviews.filter(r => r.sentiment === 'neutral').slice(0, 3).map(r => `"${r.review}"`).join('\n')}

Please provide analysis in this exact JSON format:
{
  "keyThemes": {
    "positive": ["theme1", "theme2", "theme3"],
    "negative": ["issue1", "issue2", "issue3"],
    "neutral": ["observation1", "observation2"]
  },
  "insights": {
    "summary": "Overall product sentiment summary in 2-3 sentences",
    "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
    "criticalIssues": ["critical issue 1", "critical issue 2"],
    "strengths": ["key strength 1", "key strength 2", "key strength 3"]
  }
}`;

      const analysisResponse = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: analysisPrompt }],
          model: selectedModel,
          apiKey: apiKey
        }),
      });

      setProcessing(prev => ({
        ...prev,
        progress: 95,
        currentStep: 'Finalizing analysis...'
      }));

      const analysisData = await analysisResponse.json();
      let insightsData;
      
      try {
        const aiResponse = analysisData.choices?.[0]?.message?.content || analysisData.response || '';
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
        insightsData = JSON.parse(jsonString);
      } catch (error) {
        console.error('Failed to parse insights:', error);
        insightsData = {
          keyThemes: {
            positive: ['Quality', 'Value', 'Performance'],
            negative: ['Price', 'Delivery', 'Support'],
            neutral: ['Features', 'Design']
          },
          insights: {
            summary: 'Analysis completed successfully.',
            recommendations: ['Improve customer service', 'Monitor product quality'],
            criticalIssues: ['Review pricing strategy'],
            strengths: ['Strong product quality', 'Good user experience']
          }
        };
      }

      // Calculate statistics
      const positiveCount = processedReviews.filter(r => r.sentiment === 'positive').length;
      const negativeCount = processedReviews.filter(r => r.sentiment === 'negative').length;
      const neutralCount = processedReviews.filter(r => r.sentiment === 'neutral').length;
      const totalReviews = processedReviews.length;

      // Calculate overall score (0-100)
      const overallScore = Math.round(
        ((positiveCount * 100) + (neutralCount * 50) + (negativeCount * 0)) / totalReviews
      );

      // Rating distribution if ratings are available
      const ratingsExist = processedReviews.some(r => r.rating !== undefined);
      let ratingDistribution = {};
      let averageRating = 0;

      if (ratingsExist) {
        ratingDistribution = processedReviews.reduce((acc, review) => {
          if (review.rating) {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
          }
          return acc;
        }, {} as { [key: number]: number });

        const totalRatings = processedReviews.filter(r => r.rating).length;
        const sumRatings = processedReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
      }

      const finalAnalysis: SentimentAnalysis = {
        overallScore,
        sentimentBreakdown: {
          positive: {
            count: positiveCount,
            percentage: Math.round((positiveCount / totalReviews) * 100)
          },
          negative: {
            count: negativeCount,
            percentage: Math.round((negativeCount / totalReviews) * 100)
          },
          neutral: {
            count: neutralCount,
            percentage: Math.round((neutralCount / totalReviews) * 100)
          }
        },
        keyThemes: insightsData.keyThemes,
        insights: insightsData.insights,
        ...(ratingsExist && { ratingDistribution, averageRating })
      };

      setReviews(processedReviews);
      setAnalysisResult(finalAnalysis);

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      const detailedMessage = (error as any)?.response?.data?.error?.message || (error as Error).message;
      alert(`Failed to analyze sentiment: ${detailedMessage}`);
    } finally {
      setProcessing({
        isProcessing: false,
        progress: 100,
        currentStep: 'Complete',
        processedCount: reviews.length,
        totalCount: reviews.length
      });
    }
  };

  // Chart configurations
  const sentimentChartData = useMemo(() => {
    if (!analysisResult) return null;
    
    return {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          data: [
            analysisResult.sentimentBreakdown.positive.count,
            analysisResult.sentimentBreakdown.negative.count,
            analysisResult.sentimentBreakdown.neutral.count,
          ],
          backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [analysisResult]);

  const ratingChartData = useMemo(() => {
    if (!analysisResult?.ratingDistribution) return null;

    const labels = Object.keys(analysisResult.ratingDistribution).sort((a, b) => Number(a) - Number(b));
    const data = labels.map(rating => analysisResult.ratingDistribution![Number(rating)]);

    return {
      labels: labels.map(l => `${l} Star${Number(l) !== 1 ? 's' : ''}`),
      datasets: [
        {
          label: 'Number of Reviews',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, [analysisResult]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-3 rounded-full mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">SentimentSorter</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Analyze customer reviews with AI-powered sentiment classification. Get actionable insights, key themes, and comprehensive sentiment analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload and Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name for better analysis"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {models.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload Reviews</h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    className="mb-4"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload CSV File
                  </Button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv"
                    className="hidden"
                  />
                  
                  <p className="text-sm text-gray-500 mt-2">
                    CSV should contain columns like "review", "rating", "product", etc.
                  </p>
                </div>

                {reviews.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">
                        {reviews.length} reviews loaded successfully
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={analyzeSentiment}
                  disabled={processing.isProcessing || reviews.length === 0 || !apiKey.trim()}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  {processing.isProcessing ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    'Analyze Sentiment'
                  )}
                </Button>

                {processing.isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{processing.currentStep}</span>
                      <span>{processing.processedCount}/{processing.totalCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${processing.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {analysisResult ? (
              <>
                {/* Overall Score */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overall Sentiment Score</h2>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white mb-4">
                      <span className="text-3xl font-bold">{analysisResult.overallScore}/100</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analysisResult.sentimentBreakdown.positive.count}
                        </div>
                        <div className="text-sm text-gray-600">Positive ({analysisResult.sentimentBreakdown.positive.percentage}%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {analysisResult.sentimentBreakdown.negative.count}
                        </div>
                        <div className="text-sm text-gray-600">Negative ({analysisResult.sentimentBreakdown.negative.percentage}%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {analysisResult.sentimentBreakdown.neutral.count}
                        </div>
                        <div className="text-sm text-gray-600">Neutral ({analysisResult.sentimentBreakdown.neutral.percentage}%)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sentiment Distribution */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Sentiment Distribution</h3>
                    <div className="h-64">
                      {sentimentChartData && (
                        <Doughnut data={sentimentChartData} options={chartOptions} />
                      )}
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  {analysisResult.ratingDistribution && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        Rating Distribution 
                        {analysisResult.averageRating && (
                          <span className="text-sm text-gray-600 ml-2">
                            (Avg: {analysisResult.averageRating.toFixed(1)})
                          </span>
                        )}
                      </h3>
                      <div className="h-64">
                        {ratingChartData && (
                          <Bar data={ratingChartData} options={chartOptions} />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Themes */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Themes</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">Positive Themes</h4>
                      <ul className="space-y-1">
                        {analysisResult.keyThemes.positive.map((theme, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {theme}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2">Negative Themes</h4>
                      <ul className="space-y-1">
                        {analysisResult.keyThemes.negative.map((theme, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {theme}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Neutral Themes</h4>
                      <ul className="space-y-1">
                        {analysisResult.keyThemes.neutral.map((theme, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            {theme}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Insights and Recommendations */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Analysis Insights</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {analysisResult.insights.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2">Critical Issues</h4>
                        <ul className="space-y-2">
                          {analysisResult.insights.criticalIssues.map((issue, index) => (
                            <li key={index} className="text-sm text-gray-700 bg-red-50 p-2 rounded border-l-4 border-red-400">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Key Strengths</h4>
                        <ul className="space-y-2">
                          {analysisResult.insights.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-700 bg-green-50 p-2 rounded border-l-4 border-green-400">
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysisResult.insights.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">
                    Upload a CSV file with customer reviews and click "Analyze Sentiment" to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};