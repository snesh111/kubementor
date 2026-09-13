import config from '../config/env.js';

export class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
  }

  /**
   * Send prompt to Gemini API with timeout and error handling
   * @param {string} systemPrompt - System prompt context
   * @param {string} userPrompt - User/Context prompt
   * @returns {Object} JSON response object or raw text response
   */
  async generateResponse(systemPrompt, userPrompt) {
    const apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey || this.apiKey;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey === 'mock-key' || apiKey.trim().length === 0) {
      console.warn('[Gemini Provider] GEMINI_API_KEY not set. Using context-grounded fallback reasoning.');
      return { isFallback: true, text: null, provider: 'fallback', error: 'GEMINI_API_KEY not configured' };
    }

    try {
      const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUSER / CONTEXT:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini Provider] API Error (${response.status}):`, errorText);
        return { isFallback: true, error: `Gemini API returned HTTP ${response.status}`, provider: 'fallback' };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return { isFallback: true, error: 'Empty content returned by Gemini', provider: 'fallback' };
      }

      return {
        isFallback: false,
        text,
        provider: 'gemini',
        model,
      };
    } catch (err) {
      console.error('[Gemini Provider] Request failed:', err.message);
      return { isFallback: true, error: err.message, provider: 'fallback' };
    }
  }
}

export default new GeminiProvider();
