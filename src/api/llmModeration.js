const VALID_LABELS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'HARMFUL', 'CRISIS_RISK'];

const providerDefaults = {
  anthropic: { apiUrl: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
  gemini: { apiUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-1.5-flash' },
  openai: { apiUrl: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  openrouter: { apiUrl: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini' },
};

const negativePatterns = [
  /\b(stupid|idiot|loser|worthless|pathetic|shut up|nobody cares|fuck(?:ing|ed|er|ers)?|shit|bitch|asshole|bastard|cunt)\b/i,
  /\b(get over it|your fault|stop whining|attention seeker|die|dies|dying|suicide|suicidal)\b/i,
  /\b(hate you|damn you)\b/i,
];

const crisisPatterns = [
  /\b(kill yourself|go kill yourself|kys|end your life|you should die|go die|commit suicide|suicide is the answer)\b/i,
  /\b(self harm is good|hurt yourself|cut yourself|you should self[- ]harm)\b/i,
];

const positivePatterns = [
  /\b(you are not alone|proud of you|you matter|i hear you|i understand)\b/i,
  /\b(support|kind|hope|gentle|take care|here for you|valid)\b/i,
];

const isChatModel = (model) => model && !/(tts|speech|audio|whisper|embedding|image|vision-preview)/i.test(model);
const isCompatibleChatModel = (provider, model) => {
  if (!isChatModel(model)) return false;
  if (provider === 'anthropic') return model.startsWith('claude-');
  if (provider === 'gemini') return model.startsWith('gemini-');
  if (provider === 'openai') return !model.includes('/');
  return true;
};

const inferProvider = ({ apiKey, apiUrl, provider }) => {
  if (provider && provider !== 'auto') return provider === 'google' ? 'gemini' : provider;
  if (apiKey?.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey?.startsWith('sk-or-')) return 'openrouter';
  if (apiKey?.startsWith('AIza')) return 'gemini';
  if (apiKey?.startsWith('sk-')) return 'openai';
  if (apiUrl?.includes('anthropic.com')) return 'anthropic';
  if (apiUrl?.includes('generativelanguage.googleapis.com')) return 'gemini';
  if (apiUrl?.includes('openrouter.ai')) return 'openrouter';
  if (apiUrl?.includes('openai.com')) return 'openai';
  return 'openrouter';
};

// Kept as a pure configuration helper for existing callers; API requests and
// secrets are handled only by the server-side Vercel Function.
export const resolveLlmConfig = ({ apiKey, apiUrl, provider = 'auto', model } = {}) => {
  const resolvedProvider = inferProvider({ apiKey, apiUrl, provider });
  const defaults = providerDefaults[resolvedProvider] || providerDefaults.openrouter;
  return {
    provider: resolvedProvider,
    apiUrl: apiUrl || defaults.apiUrl,
    model: isCompatibleChatModel(resolvedProvider, model) ? model : defaults.model,
  };
};

export const heuristicModeration = (responseText) => {
  const text = responseText.trim();
  if (crisisPatterns.some((pattern) => pattern.test(text))) {
    return { label: 'CRISIS_RISK', source: 'local', reason: 'The reply contains language that could encourage self-harm or death.' };
  }
  if (negativePatterns.some((pattern) => pattern.test(text))) {
    return { label: 'NEGATIVE', source: 'local', reason: 'The reply sounds dismissive, insulting, or unsupportive.' };
  }
  if (positivePatterns.some((pattern) => pattern.test(text))) {
    return { label: 'POSITIVE', source: 'local', reason: 'The reply contains supportive language.' };
  }
  return { label: 'NEUTRAL', source: 'local', reason: 'No harmful or clearly negative language was detected locally.' };
};

const manualFallback = (responseText) => ({
  ...heuristicModeration(responseText),
  source: 'local-fallback',
  reason: 'The OpenRouter check was unavailable, so a basic local phrase check was used.',
});

export const moderateResponse = async (responseText, user) => {
  if (!user) throw new Error('Sign in before posting a reply.');
  const idToken = await user.getIdToken();
  let response;
  try {
    response = await fetch('/api/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ text: responseText.trim() }),
    });
  } catch (_error) {
    return manualFallback(responseText);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return manualFallback(responseText);
  }
  let result;
  try {
    result = await response.json();
  } catch (_error) {
    return manualFallback(responseText);
  }
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      throw new Error(result.error || 'Please sign in again before posting a reply.');
    }
    return manualFallback(responseText);
  }
  const label = String(result.label || '').toUpperCase();
  if (!VALID_LABELS.includes(label)) return manualFallback(responseText);
  return {
    label,
    source: result.source || 'openrouter',
    reason: `OpenRouter classified this reply as ${label.toLowerCase().replace('_', ' ')}.`,
  };
};

export const isResponseAllowed = (moderationResult) => {
  const label = typeof moderationResult === 'string' ? moderationResult : moderationResult?.label;
  return label === 'POSITIVE' || label === 'NEUTRAL' || label === 'SUPPORTIVE';
};

export const getBlockedMessage = (moderationResult) => {
  const label = typeof moderationResult === 'string' ? moderationResult : moderationResult?.label;
  if (label === 'CRISIS_RISK') {
    return 'This reply could encourage unsafe or crisis behavior, so it was blocked. Please rewrite it with care, safety, and support.';
  }
  if (label === 'HARMFUL') {
    return 'This reply may be harmful, abusive, or emotionally unsafe. Please rewrite it in a supportive way.';
  }
  return 'This reply was blocked. Please rewrite it to be supportive and kind.';
};
