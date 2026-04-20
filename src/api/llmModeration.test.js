import { heuristicModeration, isResponseAllowed, resolveLlmConfig } from './llmModeration';

describe('heuristicModeration', () => {
  it('allows supportive replies', () => {
    const result = heuristicModeration('I hear you, and you are not alone. I am here for you.');

    expect(result.label).toBe('POSITIVE');
    expect(isResponseAllowed(result)).toBe(true);
  });

  it('blocks negative replies', () => {
    const result = heuristicModeration('Nobody cares, stop whining.');

    expect(result.label).toBe('NEGATIVE');
    expect(isResponseAllowed(result)).toBe(false);
  });

  it('blocks crisis-risk replies', () => {
    const result = heuristicModeration('You should kill yourself.');

    expect(result.label).toBe('CRISIS_RISK');
    expect(isResponseAllowed(result)).toBe(false);
  });

  it('detects OpenRouter keys automatically', () => {
    const config = resolveLlmConfig({
      apiKey: 'sk-or-v1-example',
      provider: 'auto',
    });

    expect(config.provider).toBe('openrouter');
    expect(config.apiUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
  });

  it('falls back from speech models to a chat moderation model', () => {
    const config = resolveLlmConfig({
      apiKey: 'sk-or-v1-example',
      provider: 'auto',
      model: 'openai/gpt-4o-mini-tts-2025-12-15',
    });

    expect(config.provider).toBe('openrouter');
    expect(config.model).toBe('openai/gpt-4o-mini');
  });

  it('detects Gemini keys automatically', () => {
    const config = resolveLlmConfig({
      apiKey: 'AIza-example',
      provider: 'auto',
    });

    expect(config.provider).toBe('gemini');
    expect(config.model).toBe('gemini-1.5-flash');
  });
});
