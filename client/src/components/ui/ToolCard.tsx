import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ToolCardProps } from '../../types/tools.types.js';

/**
 * ToolCard Component - Individual tool card for the dashboard grid
 * Features beautiful minimalistic design with hover effects
 */
export const ToolCard: React.FC<ToolCardProps> = ({ tool, index }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (tool.comingSoon) {
      return;
    }
    
    // Use the route property from tool data, or fall back to legacy mapping
    if (tool.route) {
      navigate(tool.route);
      return;
    }
    
    // Legacy route mapping for backward compatibility
    const toolRoutes: Record<string, string> = {
      'smart-task-planner': '/tools/taskmaster-pro',
      'retail-trend-visualizer': '/tools/dataviz-pro',
    };
    
    const route = toolRoutes[tool.id];
    if (route) {
      navigate(route);
    } else {
      console.log(`Tool ${tool.name} is not yet implemented`);
    }
  };

  return (
    <div 
      className={`
        group relative bg-white rounded-xl shadow-sm border border-gray-100 
        hover:shadow-lg hover:-translate-y-1 hover:border-gray-200
        transition-all duration-300 ease-out cursor-pointer h-full
        ${tool.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      onClick={handleCardClick}
      style={{ 
        animationDelay: `${index * 50}ms` 
      }}
    >
      {/* Coming Soon Badge */}
      {tool.comingSoon && (
        <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full border border-amber-200 z-10">
          Soon
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 flex flex-col h-full">
        {/* Icon Section */}
        <div className={`
          inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4
          bg-gradient-to-br ${tool.gradient} shadow-sm
          group-hover:scale-105 transition-transform duration-200
        `}>
          <span className="text-xl text-white">{tool.icon}</span>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-800">
            {tool.name}
          </h3>
          
          <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2 flex-1">
            {tool.description}
          </p>

          <div className="mt-auto">
            <span className={`
              inline-block text-xs font-medium px-2 py-1 rounded-md
              bg-gray-50 text-gray-600 border border-gray-200
            `}>
              {tool.category}
            </span>
          </div>
        </div>

        {/* Subtle hover indicator at bottom */}
        <div className={`
          absolute bottom-0 left-0 right-0 h-1 rounded-b-xl
          bg-gradient-to-r ${tool.gradient}
          transform scale-x-0 group-hover:scale-x-100
          transition-transform duration-300 origin-left
        `} />
      </div>
    </div>
  );
};

// Add the fadeInUp animation to your global CSS or Tailwind config
// This would go in index.css:
/*
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/