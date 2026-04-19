import { heuristicModeration, isResponseAllowed } from './llmModeration';

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
});
