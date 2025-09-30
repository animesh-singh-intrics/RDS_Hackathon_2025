import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '@/utils/AppError';

/**
 * Chat Controller
 * Handles LLM chat requests via OpenRouter API
 */
export class ChatController {
  /**
   * Process chat request
   * @route POST /api/chat
   */
  public chat = async (req: Request, res: Response): Promise<void> => {
    console.log('=== Chat API Request Started ===');
    console.log('Request body keys:', Object.keys(req.body));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      throw new AppError('Validation failed', 400, errors.array());
    }

  const { messages, model, apiKey } = req.body;
    console.log('Model:', model);
    console.log('Messages count:', messages?.length);
    console.log('API Key present:', !!apiKey);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new AppError('Messages array is required and cannot be empty', 400);
    }

    if (!model) {
      throw new AppError('Model is required', 400);
    }

    if (!apiKey) {
      throw new AppError('API key is required', 400);
    }

    try {
      console.log('Making request to OpenRouter API...');
      
      const envSiteUrl = process.env['OPENROUTER_SITE_URL']?.trim();
      const envAppName = process.env['OPENROUTER_APP_NAME']?.trim();
      const requestOrigin = req.get('origin')?.trim();
      const requestReferer = req.get('referer')?.trim();

  const siteUrl = envSiteUrl || requestOrigin || requestReferer || 'http://localhost:3000';
  const appTitle = envAppName || req.get('x-app-title')?.trim() || 'Hackathon Toolkit';

  console.log('Resolved OpenRouter headers:', { siteUrl, appTitle });

      // Set a reasonable timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      // Make request to OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': siteUrl,
          'X-Title': appTitle
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 4000,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('OpenRouter response status:', response.status);
      console.log('OpenRouter response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API Error Response:', errorText);

        let errorMessage = `OpenRouter API Error: ${response.status} ${response.statusText}`;
        let errorDetails: unknown = errorText;

        try {
          const parsedError = JSON.parse(errorText);
          errorDetails = parsedError;
          const messages = [
            parsedError?.error?.message,
            parsedError?.error?.metadata?.explanation,
            parsedError?.message,
          ].filter(Boolean);

          if (messages.length > 0) {
            errorMessage = messages[0] as string;
          }
        } catch (parseError) {
          console.warn('Failed to parse OpenRouter error JSON:', parseError);
        }

        throw new AppError(errorMessage, response.status, errorDetails);
      }

      // Get response as text first to debug potential JSON issues
      const responseText = await response.text();
      console.log('Raw OpenRouter response length:', responseText.length);
      console.log('Raw OpenRouter response (first 500 chars):', responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('JSON parsed successfully');
      } catch (jsonError) {
        console.error('JSON parsing failed:', jsonError);
        console.error('Full response text:', responseText);
        throw new AppError('Invalid JSON response from OpenRouter API', 502);
      }
      
      console.log('OpenRouter response received, sending to client...');
      res.status(200).json(data);
      console.log('=== Chat API Request Completed Successfully ===');
      
    } catch (error: any) {
      console.error('=== Chat API Error ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.name === 'AbortError') {
        throw new AppError('Request timeout - please try again', 408);
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Failed to process chat request: ${error.message}`, 500);
    }
  };
}