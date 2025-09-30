import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard.js';
import { TaskMasterPro } from '@/tools/taskmaster-pro/TaskMasterPro.js';
import { TaskMasterErrorBoundary } from '@/tools/taskmaster-pro/components/TaskMasterErrorBoundary.js';
import DataVizPro from './tools/dataviz-pro/DataVizPro.js';
import { CodeCommenterTool } from './components/CodeCommenterTool';
import BugHunter from './components/BugHunter';
import SmartResponser from './components/SmartResponser';
import StockGuardDashboard from './components/StockGuardDashboard';
import { MinuteMaker } from './components/MinuteMaker';
import { SentimentSorter } from './components/SentimentSorter';
import './App.css';

/**
 * Main Application Component
 * Sets up routing and renders the dashboard and tools
 */
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Tool Routes with Error Boundary */}
        <Route 
          path="/tools/taskmaster-pro" 
          element={
            <TaskMasterErrorBoundary>
              <TaskMasterPro />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/taskmaster-pro/*" 
          element={
            <TaskMasterErrorBoundary>
              <TaskMasterPro />
            </TaskMasterErrorBoundary>
          } 
        />
        
        {/* Future tool routes will be added here */}
        <Route 
          path="/tools/dataviz-pro" 
          element={
            <TaskMasterErrorBoundary>
              <DataVizPro />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/dataviz-pro/*" 
          element={
            <TaskMasterErrorBoundary>
              <DataVizPro />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/code-commenter" 
          element={
            <TaskMasterErrorBoundary>
              <CodeCommenterTool />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/code-commenter/*" 
          element={
            <TaskMasterErrorBoundary>
              <CodeCommenterTool />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/bug-hunter" 
          element={
            <TaskMasterErrorBoundary>
              <BugHunter />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/bug-hunter/*" 
          element={
            <TaskMasterErrorBoundary>
              <BugHunter />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/smart-responser" 
          element={
            <TaskMasterErrorBoundary>
              <SmartResponser />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/smart-responser/*" 
          element={
            <TaskMasterErrorBoundary>
              <SmartResponser />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/stock-guard" 
          element={
            <TaskMasterErrorBoundary>
              <StockGuardDashboard />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/stock-guard/*" 
          element={
            <TaskMasterErrorBoundary>
              <StockGuardDashboard />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/minute-maker" 
          element={
            <TaskMasterErrorBoundary>
              <MinuteMaker />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/minute-maker/*" 
          element={
            <TaskMasterErrorBoundary>
              <MinuteMaker />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/sentiment-sorter" 
          element={
            <TaskMasterErrorBoundary>
              <SentimentSorter />
            </TaskMasterErrorBoundary>
          } 
        />
        <Route 
          path="/tools/sentiment-sorter/*" 
          element={
            <TaskMasterErrorBoundary>
              <SentimentSorter />
            </TaskMasterErrorBoundary>
          } 
        />
        {/* <Route path="/tools/bugwhisperer" element={<BugWhisperer />} /> */}
      </Routes>
    </Router>
  );
};

export default App;
