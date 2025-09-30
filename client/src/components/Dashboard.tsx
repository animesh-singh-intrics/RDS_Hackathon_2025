import React from 'react';
import { ToolCard } from './ui/ToolCard.js';
import { toolsData } from '../data/toolsData.js';

/**
 * Dashboard Component - Main homepage for Hackathon 2025 tool switcher
 * Displays a 4x3 grid of tool cards for different utilities
 */
export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mb-6">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Hackathon 2025
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your ultimate productivity toolkit. Choose from our collection of powerful tools to accelerate your workflow.
          </p>
          
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">8 Tools Available • 4 Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {toolsData.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={index}
            />
          ))}
        </div>

        {/* Footer Section */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200/50">
          <p className="text-gray-500 text-sm">
            Built with ❤️ for Hackathon 2025 • Select any tool to get started
          </p>
        </div>
      </div>
    </div>
  );
};