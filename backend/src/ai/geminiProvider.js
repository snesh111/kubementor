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
    if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY' || this.apiKey === 'mock-key') {
      console.warn('[Gemini Provider] GEMINI_API_KEY not set. Using context-grounded fallback reasoning.');
      return { isFallback: true, text: null };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      
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
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
        return { isFallback: true, error: `Gemini API returned ${response.status}` };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return {
        isFallback: false,
        text,
      };
    } catch (err) {
      console.error('[Gemini Provider] Request failed:', err.message);
      return { isFallback: true, error: err.message };
    }
  }
}

export default new GeminiProvider();
