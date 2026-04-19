import { timeAgo } from './timeAgo';

describe('timeAgo', () => {
  const realDate = Date;

  beforeEach(() => {
    global.Date = class extends realDate {
      constructor(value) {
        return value ? new realDate(value) : new realDate('2026-04-20T00:00:00.000Z');
      }

      static now() {
        return new realDate('2026-04-20T00:00:00.000Z').getTime();
      }
    };
  });

  afterEach(() => {
    global.Date = realDate;
  });

  it('formats recent timestamps', () => {
    expect(timeAgo('2026-04-19T23:59:30.000Z')).toBe('just now');
    expect(timeAgo('2026-04-19T23:55:00.000Z')).toBe('5 minutes ago');
    expect(timeAgo('2026-04-19T22:00:00.000Z')).toBe('2 hours ago');
  });
});
