const LLM_API_URL = process.env.REACT_APP_LLM_API_URL;
const LLM_API_KEY = process.env.REACT_APP_LLM_API_KEY;
const LLM_PROVIDER = process.env.REACT_APP_LLM_PROVIDER || 'anthropic';
const LLM_MODEL = process.env.REACT_APP_LLM_MODEL || 'claude-3-haiku-20240307';

const VALID_LABELS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'HARMFUL', 'CRISIS_RISK'];

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

const isPlaceholderKey = (key) =>
  !key || key === 'your_llm_api_key_here' || key.startsWith('your_');

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

const callAnthropic = async (responseText) => {
  const response = await fetch(LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LLM_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
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

const callOpenAICompatible = async (responseText) => {
  const response = await fetch(LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'MindBridge',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
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

export const moderateResponse = async (responseText) => {
  const localResult = heuristicModeration(responseText);

  if (isPlaceholderKey(LLM_API_KEY) || !LLM_API_URL) {
    return {
      ...localResult,
      reason: `${localResult.reason} Add an LLM API key to enable model-based moderation.`,
    };
  }

  try {
    const rawLabel = LLM_PROVIDER === 'anthropic'
      ? await callAnthropic(responseText)
      : await callOpenAICompatible(responseText);
    const label = parseLabel(rawLabel);

    return {
      label,
      source: 'llm',
      reason: `LLM classified this reply as ${label.toLowerCase().replace('_', ' ')}.`,
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
