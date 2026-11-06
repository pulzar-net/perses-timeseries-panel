// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createTimezoneAwareAxisFormatter } from './timezone-formatter';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const noon = Date.UTC(2026, 10, 1, 12, 30); // Nov 1, 2026 12:30 UTC
const midnight = Date.UTC(2026, 10, 1); // Nov 1, 2026 00:00 UTC

describe('createTimezoneAwareAxisFormatter', () => {
  const at = (rangeMs: number, value: number, timeZone = 'UTC') => createTimezoneAwareAxisFormatter(rangeMs, timeZone)(value);

  it('names the month, never a numbered day and month', () => {
    expect(at(30 * DAY, noon)).toBe('Nov 1');
    expect(at(5 * DAY, noon)).toBe('Nov 1 12:30');
  });

  it('names the day at midnight and gives the time otherwise, within a few days', () => {
    expect(at(6 * HOUR, noon)).toBe('12:30');
    expect(at(2 * DAY, midnight)).toBe('Nov 1');
    expect(at(5 * DAY, midnight)).toBe('Nov 1');
  });

  it('months, then years, over long ranges', () => {
    expect(at(300 * DAY, noon)).toBe('Nov 2026'); // between 6 months and 2 years
    expect(at(3 * 365 * DAY, noon)).toBe('Nov 2026');
    expect(at(6 * 365 * DAY, noon)).toBe('2026');
  });

  it('in the time zone it is given', () => {
    expect(at(6 * HOUR, noon, 'America/New_York')).toBe('07:30'); // EST from 2am that day
    expect(at(2 * DAY, Date.UTC(2026, 10, 1, 4), 'America/New_York')).toBe('Nov 1');
  });
});
