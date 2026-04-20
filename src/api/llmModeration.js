const ENV_API_URL = process.env.REACT_APP_LLM_API_URL;
const ENV_API_KEY = process.env.REACT_APP_LLM_API_KEY;
const ENV_PROVIDER = (process.env.REACT_APP_LLM_PROVIDER || 'auto').toLowerCase();
const ENV_MODEL = process.env.REACT_APP_LLM_MODEL;

const VALID_LABELS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'HARMFUL', 'CRISIS_RISK'];
const BLOCK_NEGATIVE_RESPONSES = process.env.REACT_APP_BLOCK_NEGATIVE_RESPONSES !== 'false';

const providerDefaults = {
  anthropic: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
  },
  gemini: {
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-flash',
  },
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  },
  openrouter: {
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-4o-mini',
  },
};

const negativePatterns = [
  /\b(stupid|idiot|loser|worthless|pathetic|shut up|nobody cares)\b/i,
  /\b(get over it|your fault|stop whining|attention seeker)\b/i,
  /\b(hate you|kill yourself|kys|die)\b/i,
];

const crisisPatterns = [
  /\b(kill yourself|kys|end your life|you should die)\b/i,
  /\b(self harm is good|hurt yourself|cut yourself)\b/i,
];

const positivePatterns = [
  /\b(you are not alone|proud of you|you matter|i hear you|i understand)\b/i,
  /\b(support|kind|hope|gentle|take care|here for you|valid)\b/i,
];

const isPlaceholderValue = (value) =>
  !value || value === 'your_llm_api_key_here' || value.startsWith('your_');

const isChatModel = (model) =>
  model && !/(tts|speech|audio|whisper|embedding|image|vision-preview)/i.test(model);

const isCompatibleChatModel = (provider, model) => {
  if (!isChatModel(model)) return false;
  if (provider === 'anthropic') return model.startsWith('claude-');
  if (provider === 'gemini') return model.startsWith('gemini-');
  if (provider === 'openai') return !model.includes('/');
  return true;
};

const inferProvider = ({ apiKey, apiUrl, provider }) => {
  if (provider && provider !== 'auto') {
    return provider === 'google' ? 'gemini' : provider;
  }

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

export const resolveLlmConfig = ({
  apiKey = ENV_API_KEY,
  apiUrl = ENV_API_URL,
  provider = ENV_PROVIDER,
  model = ENV_MODEL,
} = {}) => {
  const resolvedProvider = inferProvider({ apiKey, apiUrl, provider });
  const defaults = providerDefaults[resolvedProvider] || providerDefaults.openrouter;

  return {
    provider: resolvedProvider,
    apiKey,
    apiUrl: isPlaceholderValue(apiUrl) ? defaults.apiUrl : (apiUrl || defaults.apiUrl),
    model: isPlaceholderValue(model) || !isCompatibleChatModel(resolvedProvider, model)
      ? defaults.model
      : model,
  };
};

export const heuristicModeration = (responseText) => {
  const text = responseText.trim();

  if (crisisPatterns.some((pattern) => pattern.test(text))) {
    return {
      label: 'CRISIS_RISK',
      source: 'local',
      reason: 'The reply contains language that could encourage self-harm or death.',
    };
  }

  if (negativePatterns.some((pattern) => pattern.test(text))) {
    return {
      label: 'NEGATIVE',
      source: 'local',
      reason: 'The reply sounds dismissive, insulting, or unsupportive.',
    };
  }

  if (positivePatterns.some((pattern) => pattern.test(text))) {
    return {
      label: 'POSITIVE',
      source: 'local',
      reason: 'The reply contains supportive language.',
    };
  }

  return {
    label: 'NEUTRAL',
    source: 'local',
    reason: 'No harmful or clearly negative language was detected locally.',
  };
};

const parseLabel = (text) => {
  const normalized = String(text || '').trim().toUpperCase();
  const directLabel = VALID_LABELS.find((label) => normalized === label);
  if (directLabel) return directLabel;

  return VALID_LABELS.find((label) => normalized.includes(label)) || 'NEUTRAL';
};

const buildPrompt = (responseText) => `You are moderating replies in a mental health support app.

Classify this reply into exactly one label:
POSITIVE - kind, validating, supportive, empathetic, or helpful.
NEUTRAL - not harmful, but not especially supportive.
NEGATIVE - dismissive, blaming, insulting, mocking, discouraging, or emotionally unsafe.
HARMFUL - abusive, harassing, manipulative, or likely to worsen distress.
CRISIS_RISK - encourages self-harm, suicide, violence, or dangerous behavior.

Return only the label. No explanation.

Reply:
${responseText}`;

const buildOpenAiCompatibleHeaders = ({ apiKey, provider }) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
  ...(provider === 'openrouter'
    ? {
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'MindBridge',
      }
    : {}),
});

const callAnthropic = async (responseText, config) => {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 20,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: buildPrompt(responseText),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text;
};

const callGemini = async (responseText, config) => {
  const baseUrl = config.apiUrl.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildPrompt(responseText),
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 20,
        temperature: 0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
};

const callOpenAICompatible = async (responseText, config) => {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: buildOpenAiCompatibleHeaders(config),
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: buildPrompt(responseText),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
};

const callLlm = async (responseText, config) => {
  if (config.provider === 'anthropic') return callAnthropic(responseText, config);
  if (config.provider === 'gemini') return callGemini(responseText, config);
  return callOpenAICompatible(responseText, config);
};

export const moderateResponse = async (responseText) => {
  const localResult = heuristicModeration(responseText);
  const config = resolveLlmConfig();

  if (isPlaceholderValue(config.apiKey)) {
    return {
      ...localResult,
      reason: `${localResult.reason} Add an LLM API key to enable model-based moderation.`,
    };
  }

  try {
    const rawLabel = await callLlm(responseText, config);
    const label = parseLabel(rawLabel);

    return {
      label,
      source: config.provider,
      reason: `${config.provider} classified this reply as ${label.toLowerCase().replace('_', ' ')}.`,
    };
  } catch (error) {
    console.error('LLM moderation error:', error);
    return {
      ...localResult,
      reason: `${localResult.reason} The LLM check failed, so local moderation was used.`,
    };
  }
};

export const isResponseAllowed = (moderationResult) => {
  const label = typeof moderationResult === 'string'
    ? moderationResult
    : moderationResult?.label;

  if (label === 'NEGATIVE') return !BLOCK_NEGATIVE_RESPONSES;
  return label === 'POSITIVE' || label === 'NEUTRAL' || label === 'SUPPORTIVE';
};

export const getBlockedMessage = (moderationResult) => {
  const label = typeof moderationResult === 'string'
    ? moderationResult
    : moderationResult?.label;
  const reason = typeof moderationResult === 'object' ? moderationResult.reason : '';

  if (label === 'CRISIS_RISK') {
    return 'This reply could encourage unsafe or crisis behavior, so it was blocked. Please rewrite it with care, safety, and support.';
  }

  if (label === 'HARMFUL') {
    return 'This reply may be harmful, abusive, or emotionally unsafe. Please rewrite it in a supportive way.';
  }

  if (label === 'NEGATIVE') {
    return `This reply sounds negative or unsupportive, so it was blocked.${reason ? ` ${reason}` : ''}`;
  }

  return 'This reply was blocked. Please rewrite it to be supportive and kind.';
};
