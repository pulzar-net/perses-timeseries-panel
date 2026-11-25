import { allSeriesTooltipHtml } from './TimeSeriesChartBase';

describe('allSeriesTooltipHtml', () => {
  const at = Date.UTC(2026, 10, 24, 20, 30);
  const params = [
    { seriesId: 'a', seriesName: 'Chamber', marker: '', value: [at, 21.3], axisValue: at },
    { seriesId: 'b', seriesName: 'Upper <air>', marker: '', value: [at, 24.1], axisValue: at },
    { seriesId: 'band0-lo', seriesName: 'band lo', marker: '', value: [at, 20], axisValue: at },
    { seriesId: 'c', seriesName: 'Lower air', marker: '', value: [at, null], axisValue: at },
  ];

  it('lists only the chart series with a value, highest first, escaped', () => {
    const html = allSeriesTooltipHtml(params, new Set(['a', 'b', 'c']), { unit: 'celsius', decimalPlaces: 1 });
    expect(html).not.toContain('band lo');
    expect(html).not.toContain('Lower air');
    expect(html).toContain('Upper &lt;air&gt;');
    expect(html.indexOf('Upper')).toBeLessThan(html.indexOf('Chamber'));
    expect(html).toContain('24.1');
  });
});
