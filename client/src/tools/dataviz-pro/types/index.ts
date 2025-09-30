/**
 * DataViz Pro - AI-Powered CSV Dashboard Generator
 * TypeScript type definitions for CSV parsing, analysis, and visualization
 */

// Base tool interface
export interface BaseTool {
  readonly id: string;
  readonly name: string;
  readonly version: string;
}

// Column data types detected from CSV
export type ColumnType =
  | 'number'      // Numbers, integers, floats
  | 'string'      // Text categories and free text
  | 'date'        // Date/time values
  | 'boolean'     // True/false values
  | 'unknown';    // Couldn't determine type

// CSV parsing and upload states
export type CSVError =
  | 'invalid-format'
  | 'empty-file'
  | 'encoding-error'
  | 'parse-error'
  | 'network-error'
  | 'file-too-large'
  | 'no-data'
  | 'parsing-failed'
  | 'unknown-error';

export interface UploadState {
  uploading: boolean;
  progress: number;
  file: File | null;
  error: string | null;
}

/**
 * Parsed CSV data structure
 */
export interface ParsedCSVData {
  headers: readonly string[];
  rows: readonly (readonly string[])[];
  columnTypes: readonly ColumnType[];
  rowCount: number;
  columnCount: number;
  hasHeaders: boolean;
  sampleRows: readonly (readonly string[])[];
}

/**
 * Column analysis results
 */
export interface ColumnAnalysis {
  name: string;
  type: ColumnType;
  nullCount: number;
  uniqueCount: number;
  sampleValues: readonly string[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
  };
}

/**
 * Dataset analysis results
 */
export interface DatasetAnalysis {
  totalRows: number;
  totalColumns: number;
  columns: readonly ColumnAnalysis[];
  dataQuality: {
    completeness: number;
    uniqueness: number;
    validity: number;
  };
  insights: readonly string[];
  recommendedCharts: readonly string[];
}

/**
 * LLM Dashboard Generation Types
 */
export interface DashboardGenerationRequest {
  csvData: ParsedCSVData;
  analysis: DatasetAnalysis;
  userPreferences?: {
    theme?: 'light' | 'dark';
    colorScheme?: readonly string[];
    chartTypes?: readonly string[];
  };
}

export interface DashboardGenerationResponse {
  success: boolean;
  htmlContent: string;
  error?: string;
}
