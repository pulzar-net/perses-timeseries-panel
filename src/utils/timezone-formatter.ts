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

import { formatWithTimeZone } from '@perses-dev/components';

const DAY_MS = 86400000;
const MONTH_MS = 2629440000;
const YEAR_MS = 31536000000;

/**
 * Creates a timezone-aware axis formatter function for different time ranges.
 *
 * Months are named rather than numbered: "01.11" is the 1st of November in
 * one country and the 11th of January in another. Within a few days a tick on
 * midnight names its day, so the hours either side of it are placed.
 */
export function createTimezoneAwareAxisFormatter(rangeMs: number, timeZone: string) {
  return function (value: number): string {
    const timeStamp = new Date(Number(value));

    // more than 5 years
    if (rangeMs > YEAR_MS * 5) {
      return formatWithTimeZone(timeStamp, 'yyyy', timeZone);
    }

    // more than 6 months
    if (rangeMs >= MONTH_MS * 6) {
      return formatWithTimeZone(timeStamp, 'MMM yyyy', timeZone);
    }

    // more than 10 days
    if (rangeMs > DAY_MS * 10) {
      return formatWithTimeZone(timeStamp, 'MMM d', timeZone);
    }

    const time = formatWithTimeZone(timeStamp, 'HH:mm', timeZone);
    const day = formatWithTimeZone(timeStamp, 'MMM d', timeZone);

    // between 2 and 10 days
    if (rangeMs > DAY_MS * 2) {
      return time === '00:00' ? day : `${day} ${time}`;
    }

    return time === '00:00' ? day : time;
  };
}
