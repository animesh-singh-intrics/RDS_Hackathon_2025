import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ToolLayoutProps } from '../types/index.js';

/**
 * Shared layout component for all tools
 * Provides consistent header, navigation, and styling
 */
export const ToolLayout: React.FC<ToolLayoutProps> = ({ 
  children, 
  tool, 
  navigation = [] 
}) => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tool Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Left: Back button and tool info */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🎯</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{tool.name}</h1>
                  <p className="text-xs text-gray-500">v{tool.version}</p>
                </div>
              </div>
            </div>

            {/* Right: Tool navigation */}
            {navigation.length > 0 && (
              <nav className="flex items-center space-x-1">
                {navigation.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Hackathon 2025</Link>
            <span>/</span>
            <span className="text-gray-900">{tool.name}</span>
          </div>
        </div>
      </header>

      {/* Tool Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
    </div>
  );
};