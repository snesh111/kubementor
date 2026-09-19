import config from '../config/env.js';

export class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
    this.circuitBreakerUntil = 0;
    this.lastLoggedCooldown = 0;
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
      return { isFallback: true, text: null, provider: 'fallback', error: 'GEMINI_API_KEY not configured' };
    }

    // Check circuit breaker (Rate limit cooldown active)
    const now = Date.now();
    if (now < this.circuitBreakerUntil) {
      const remainingSec = Math.ceil((this.circuitBreakerUntil - now) / 1000);
      if (now - this.lastLoggedCooldown > 15000) {
        console.warn(`[Gemini Provider] Rate-limit circuit breaker active (${remainingSec}s remaining). Serving context-grounded reasoning.`);
        this.lastLoggedCooldown = now;
      }
      return { isFallback: true, error: `Gemini rate limit cooldown active (${remainingSec}s remaining)`, provider: 'fallback' };
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
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s fast timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        
        // If Rate Limited (429) or Service Unavailable (503), trip circuit breaker for 45 seconds
        if (response.status === 429 || response.status === 503) {
          this.circuitBreakerUntil = Date.now() + 45000;
          console.warn(`[Gemini Provider] API Quota Exceeded (HTTP ${response.status}). Activated 45s circuit breaker fallback.`);
        } else {
          console.error(`[Gemini Provider] API Error (${response.status}):`, errorText.slice(0, 300));
        }

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
      if (err.name === 'AbortError') {
        console.warn('[Gemini Provider] Request timed out (4s). Switching to fast fallback.');
        this.circuitBreakerUntil = Date.now() + 20000; // 20s cooldown on timeout
      } else {
        console.error('[Gemini Provider] Request failed:', err.message);
      }
      return { isFallback: true, error: err.message, provider: 'fallback' };
    }
  }
}

export default new GeminiProvider();

