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

import type { LegacyTimeSeries } from '@perses-dev/components';
import type { TimeScale } from '@perses-dev/spec';

import type { TimeSeriesChartVisualOptions, TimeSeriesChartYAxisOptions } from '../time-series-chart-model';
import type { ExemplarChartData } from './data-transform';
import {
  axisStartMs,
  EXEMPLAR_SERIES_ID_PREFIX,
  getBandSeries,
  interpolationOption,
  EXEMPLAR_SYMBOL_SIZE,
  convertPercentThreshold,
  convertPanelYAxis,
  getExemplarSeries,
  getTimeSeries,
  getTimeSeriesValues,
  roundDown,
} from './data-transform';

const MAX_VALUE = 120;
const MOCK_ECHART_TIME_SERIES_DATA: LegacyTimeSeries[] = [
  {
    data: [10, 30, 80, 50],
  },
  {
    data: [20, MAX_VALUE, 17, 30],
  },
];

describe('getExemplarSeries', () => {
  const exemplarData: ExemplarChartData = {
    seriesId: 'chart1http_requests_total0',
    seriesName: 'http_requests_total',
    color: '#5f6caf',
    seriesLabels: { __name__: 'http_requests_total', job: 'demo' },
    yAxisIndex: 0,
    exemplars: [
      { labels: { trace_id: 'abc-123' }, value: 42, timestamp: 1700000000000 },
      { labels: { trace_id: 'def-456' }, value: 7, timestamp: 1700000150000 },
    ],
  };

  it('should render a diamond scatter series prefixed with the exemplar series id', () => {
    const series = getExemplarSeries(exemplarData);
    expect(series.type).toEqual('scatter');
    expect(series.id).toEqual(`${EXEMPLAR_SERIES_ID_PREFIX}${exemplarData.seriesId}`);
    expect(series.symbol).toEqual('diamond');
    expect(series.symbolSize).toEqual(EXEMPLAR_SYMBOL_SIZE);
    expect(series.color).toEqual('#5f6caf');
  });

  it('should embed exemplar metadata in each data item so the dialog can be populated on click', () => {
    const series = getExemplarSeries(exemplarData);
    const data = series.data as Array<{ value: [number, number]; exemplar: unknown; seriesLabels: unknown }>;
    expect(data).toHaveLength(2);
    expect(data[0]?.value).toEqual([1700000000000, 42]);
    expect(data[0]?.exemplar).toEqual(exemplarData.exemplars[0]);
    expect(data[0]?.seriesLabels).toEqual(exemplarData.seriesLabels);
  });

  it('should negate plotted Y values while keeping original exemplar values when negativeY is enabled', () => {
    const series = getExemplarSeries({ ...exemplarData, negativeY: true });
    const data = series.data as Array<{ value: [number, number]; exemplar: unknown }>;
    expect(data[0]?.value).toEqual([1700000000000, -42]);
    expect(data[1]?.value).toEqual([1700000150000, -7]);
    // The embedded exemplar keeps the original (positive) value for the metadata tooltip.
    expect(data[0]?.exemplar).toEqual(exemplarData.exemplars[0]);
    expect(data[1]?.exemplar).toEqual(exemplarData.exemplars[1]);
  });
});

describe('convertPercentThreshold', () => {
  it('should return 25 if percent threshold is 25 and max is 100', () => {
    const value = convertPercentThreshold(25, MOCK_ECHART_TIME_SERIES_DATA, 100);
    expect(value).toEqual(25);
  });

  it('should return 60 if percent threshold is 50, max is 100, and min is 20', () => {
    const value = convertPercentThreshold(50, MOCK_ECHART_TIME_SERIES_DATA, 100, 20);
    expect(value).toEqual(60);
  });

  it('should return 50% of the max value in time series data if max is undefined', () => {
    const value = convertPercentThreshold(50, MOCK_ECHART_TIME_SERIES_DATA);
    expect(value).toEqual(0.5 * MAX_VALUE);
  });

  it('should use absolute values when finding the max so negated series (negativeY) still resolve correctly', () => {
    // Simulates a series that was negated for display (querySettings.negativeY = true)
    const negatedSeries: LegacyTimeSeries[] = [{ data: [-10, -30, -80, -50] }, { data: [-20, -MAX_VALUE, -17, -30] }];
    const value = convertPercentThreshold(50, negatedSeries);
    expect(value).toEqual(0.5 * MAX_VALUE);
  });
});

describe('convertPanelYAxis', () => {
  it('should convert a Perses yAxis spec to the ECharts equivalent', () => {
    const persesAxis: TimeSeriesChartYAxisOptions = {
      show: true,
      label: 'Axis Label',
      format: {
        unit: 'percent-decimal',
        decimalPlaces: 0,
      },
      min: 0.1,
      max: 1,
    };
    const echartsAxis = convertPanelYAxis(persesAxis);
    // Axis label is handled outside of echarts since it is built with a custom React component.
    expect(echartsAxis).toEqual({
      show: true,
      max: 1,
      min: 0.1,
    });
  });
  it('should convert a Perses yAxis spec of type log to the ECharts equivalent', () => {
    const persesAxis: TimeSeriesChartYAxisOptions = {
      show: true,
      label: 'Axis Label',
      format: {
        unit: 'percent-decimal',
        decimalPlaces: 0,
      },
      min: 0.1,
      max: 1,
      logBase: 2,
    };
    const actualAxisLog2 = convertPanelYAxis(persesAxis);
    // Axis label is handled outside of echarts since it is built with a custom React component.
    expect(actualAxisLog2).toEqual({
      show: true,
      max: 1,
      min: undefined,
      type: 'log',
      logBase: 2,
    });
    persesAxis.logBase = 10;
    const actualAxisLog10 = convertPanelYAxis(persesAxis);
    // Axis label is handled outside of echarts since it is built with a custom React component.
    expect(actualAxisLog10).toEqual({
      show: true,
      max: 1,
      min: undefined,
      type: 'log',
      logBase: 10,
    });
  });
});

const ROUND_DOWN_TESTS = [
  {
    value: -400305,
    expected: -500000,
  },
  {
    value: -633,
    expected: -700,
  },
  {
    value: -5.99,
    expected: -6,
  },
  {
    value: -0.123,
    expected: -0.2,
  },
  {
    value: -0.000543,
    expected: -0.0006,
  },
  {
    value: 0.000543,
    expected: 0.0005,
  },
  {
    value: 0.123,
    expected: 0.1,
  },
  {
    value: 5.99,
    expected: 5,
  },
  {
    value: 633,
    expected: 600,
  },
  {
    value: 400305,
    expected: 400000,
  },
];

describe('roundDown', () => {
  it.each(ROUND_DOWN_TESTS)('returns $expected when the input is $value', ({ value, expected }) => {
    expect(roundDown(value)).toEqual(expected);
  });
});

describe('getTimeSeries stack behavior', () => {
  const TIME_SCALE: TimeScale = { startMs: 0, endMs: 60_000, stepMs: 1000, rangeMs: 60_000 };

  // 6 combinations of (global visual.stack) x (per-query stack override) -> whether
  // the resulting series should have stack === 'all'. Run for both line and bar display.
  const STACK_CASES: Array<{
    label: string;
    globalStack: 'all' | undefined;
    querySettingsStack: boolean | undefined;
    expectStacked: boolean;
  }> = [
    {
      label: 'global=none + query=unset → not stacked',
      globalStack: undefined,
      querySettingsStack: undefined,
      expectStacked: false,
    },
    {
      label: 'global=none + query=true  → stacked',
      globalStack: undefined,
      querySettingsStack: true,
      expectStacked: true,
    },
    {
      label: 'global=none + query=false → not stacked',
      globalStack: undefined,
      querySettingsStack: false,
      expectStacked: false,
    },
    {
      label: 'global=all  + query=unset → stacked',
      globalStack: 'all',
      querySettingsStack: undefined,
      expectStacked: true,
    },
    { label: 'global=all  + query=true  → stacked', globalStack: 'all', querySettingsStack: true, expectStacked: true },
    {
      label: 'global=all  + query=false → not stacked',
      globalStack: 'all',
      querySettingsStack: false,
      expectStacked: false,
    },
  ];

  describe.each(['line', 'bar'] as const)('display: %s', (display) => {
    it.each(STACK_CASES)('$label', ({ globalStack, querySettingsStack, expectStacked }) => {
      const visual: TimeSeriesChartVisualOptions = { display, stack: globalStack };
      const series = getTimeSeries('series-id', 0, 'series', visual, TIME_SCALE, '#000000', {
        stack: querySettingsStack,
      });

      expect(series.type).toEqual(display);
      expect(series.stack).toEqual(expectStacked ? 'all' : undefined);
    });
  });
});

describe('area style', () => {
  const scale: TimeScale = { startMs: 0, endMs: 60_000, stepMs: 1000, rangeMs: 60_000 };

  it('omits areaStyle when the resolved opacity is 0', () => {
    const series = getTimeSeries('id', 0, 'name', { areaOpacity: 0 }, scale, '#000000');
    expect(series).not.toHaveProperty('areaStyle');
    expect(series).toHaveProperty('emphasis.disabled', false);
  });

  it('keeps areaStyle when the visual or query opacity is positive', () => {
    const fromVisual = getTimeSeries('id', 0, 'name', { areaOpacity: 0.3 }, scale, '#000000');
    const fromQuery = getTimeSeries('id', 0, 'name', { areaOpacity: 0 }, scale, '#000000', { areaOpacity: 0.5 });

    expect(fromVisual).toHaveProperty('areaStyle.opacity', 0.3);
    expect(fromVisual).toHaveProperty('emphasis.disabled', true);
    expect(fromQuery).toHaveProperty('areaStyle.opacity', 0.5);
  });

  it('lets a query opacity of 0 override a positive visual opacity', () => {
    const series = getTimeSeries('id', 0, 'name', { areaOpacity: 0.3 }, scale, '#000000', { areaOpacity: 0 });
    expect(series).not.toHaveProperty('areaStyle');
  });
});

describe('automatic point markers', () => {
  const scale: TimeScale = { startMs: 0, endMs: 60_000, stepMs: 1000, rangeMs: 60_000 };

  it.each([
    [70, 'auto', true],
    [71, 'auto', false],
    [1000, 'always', true],
  ] as const)('renders markers for %i visible series with showPoints=%s: %s', (count, showPoints, expected) => {
    const series = getTimeSeries('id', 0, 'name', { showPoints }, scale, '#000000', undefined, undefined, count);
    expect(series).toHaveProperty('showSymbol', expected);
  });
});

describe('interpolationOption', () => {
  it('maps each interpolation to ECharts', () => {
    expect(interpolationOption('smooth')).toEqual({ smooth: true });
    expect(interpolationOption('stepBefore')).toEqual({ step: 'start' });
    expect(interpolationOption('stepAfter')).toEqual({ step: 'end' });
    expect(interpolationOption('linear')).toEqual({});
    expect(interpolationOption(undefined)).toEqual({});
  });
});

describe('getBandSeries', () => {
  it('stacks the band height on an invisible lower edge, with its own data', () => {
    const [lo, hi] = getBandSeries(
      'b0',
      [
        [1, 20],
        [2, null],
      ],
      [
        [1, 24],
        [2, 25],
      ],
      '#123456',
      0.2,
    );
    expect(lo).toMatchObject({
      id: 'b0-lo',
      stack: 'b0',
      data: [
        [1, 20],
        [2, null],
      ],
      lineStyle: { opacity: 0 },
    });
    expect(hi).toMatchObject({
      id: 'b0-hi',
      stack: 'b0',
      data: [
        [1, 4],
        [2, null],
      ],
      areaStyle: { opacity: 0.2 },
    });
    expect(lo).not.toHaveProperty('datasetIndex');
  });
});

describe('bars at most so wide', () => {
  const scale = { startMs: 0, endMs: 1000, stepMs: 100, rangeMs: 1000 };
  it('caps a bar series when asked, and leaves it to ECharts otherwise', () => {
    expect(getTimeSeries('id', 0, 'name', { display: 'bar', maxBarWidth: 36 }, scale, '#000')).toMatchObject({
      type: 'bar',
      barMaxWidth: 36,
    });
    expect(getTimeSeries('id', 0, 'name', { display: 'bar' }, scale, '#000')).not.toHaveProperty('barMaxWidth');
  });
});

describe('getTimeSeriesValues', () => {
  const HOUR = 3_600_000;
  const DAY = 24 * HOUR;
  // Local midnights in New York across the end of daylight time (1 November 2026): that day is 25 hours.
  const nov1 = Date.UTC(2026, 10, 1, 4);
  const nov2 = Date.UTC(2026, 10, 2, 5);
  const nov3 = Date.UTC(2026, 10, 3, 5);

  it('keeps a calendar day at its own time across a clock change', () => {
    const scale: TimeScale = { startMs: nov1, endMs: nov3, stepMs: DAY, rangeMs: nov3 - nov1 };
    const values = getTimeSeriesValues(
      {
        name: 'rate',
        values: [
          [nov1, 1],
          [nov2, 2],
          [nov3, 3],
        ],
      },
      scale,
    );
    expect(values).toEqual([
      [nov1, 1],
      [nov2, 2],
      [nov3, 3],
    ]);
  });

  it('breaks the line only for a missing step', () => {
    const scale: TimeScale = { startMs: nov1, endMs: nov3, stepMs: DAY, rangeMs: nov3 - nov1 };
    const values = getTimeSeriesValues(
      {
        name: 'rate',
        values: [
          [nov1, 1],
          [nov3, 3],
        ],
      },
      scale,
    );
    expect(values).toEqual([
      [nov1, 1],
      [nov1 + DAY, null],
      [nov3, 3],
    ]);
  });

  it('pads the start and end of the range with nulls, as Perses does', () => {
    const scale: TimeScale = { startMs: 0, endMs: 4 * HOUR, stepMs: HOUR, rangeMs: 4 * HOUR };
    const values = getTimeSeriesValues({ name: 'x', values: [[2 * HOUR, 5]] }, scale);
    expect(values).toEqual([
      [0, null],
      [HOUR, null],
      [2 * HOUR, 5],
      [3 * HOUR, null],
      [4 * HOUR, null],
    ]);
  });

  it('does not go back for a value before the start of the scale', () => {
    const scale: TimeScale = { startMs: 10 * HOUR, endMs: 12 * HOUR, stepMs: HOUR, rangeMs: 2 * HOUR };
    const values = getTimeSeriesValues(
      {
        name: 'x',
        values: [
          [0, 1],
          [11 * HOUR, 2],
        ],
      },
      scale,
    );
    expect(values).toEqual([
      [0, 1],
      [10 * HOUR, null],
      [11 * HOUR, 2],
      [12 * HOUR, null],
    ]);
  });

  it('matches Perses for values on the grid', () => {
    const scale: TimeScale = { startMs: 0, endMs: 3 * HOUR, stepMs: HOUR, rangeMs: 3 * HOUR };
    const values = getTimeSeriesValues(
      {
        name: 'x',
        values: [
          [0, 1],
          [HOUR, 2],
          [3 * HOUR, 4],
        ],
      },
      scale,
    );
    expect(values).toEqual([
      [0, 1],
      [HOUR, 2],
      [2 * HOUR, null],
      [3 * HOUR, 4],
    ]);
  });
});

describe('axisStartMs', () => {
  it('starts at a bucket that begins before the range, else at the range', () => {
    const start = Date.UTC(2026, 10, 6, 1);
    const midnight = Date.UTC(2026, 10, 6);
    expect(axisStartMs(start, [{ values: [[midnight, 6.8]] }, { values: [] }])).toBe(midnight);
    expect(axisStartMs(start, [{ values: [[start + 3_600_000, 1]] }])).toBe(start);
    expect(axisStartMs(start, [])).toBe(start);
  });
});
