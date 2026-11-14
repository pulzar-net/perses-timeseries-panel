# Time series chart with bands and step lines, for Perses

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/pulzar-net/perses-timeseries-panel/releases/latest/download/preview-dark.png">
  <img alt="The PulzrTimeSeriesChart panel: two cold room temperatures over 24 hours, with the target band behind them" src="https://github.com/pulzar-net/perses-timeseries-panel/releases/latest/download/preview-light.png">
</picture>

Perses's [time series chart](https://github.com/perses/plugins/tree/main/timeserieschart), as the panel `PulzrTimeSeriesChart`, with five additions:

- **Line interpolation**: `linear`, `smooth`, `stepBefore` or `stepAfter`, for the whole panel (`visual.lineInterpolation`) or one query (`querySettings[].lineInterpolation`). A setpoint or a mode is a step line.
- **Calendar steps**: a query whose points are calendar days, weeks or months (local midnights) is drawn where its points are. Perses lays every point on the range's start plus a whole number of steps, so across a clock change (a 23- or 25-hour day) or in a 31-day month a point moved to the next step and the line broke before it. Here a point keeps its own time, and the line breaks only where a whole step is missing. A query of months gives the longest month, 31 days, as its step.
- **Bars and lines together**: `querySettings[].display` draws one query as bars and another as a line over them, whatever `visual.display` says; `querySettings[].axis: right` gives a query its own scale on the right even in the panel's unit (permits sold as bars, permits active as a line), and `axis: hidden` its own scale with no axis drawn.
- **Bar width**: `visual.maxBarWidth` keeps bars at most so many px wide, as a week of daily bars should not fill the chart.
- **Bands**: a query's two series labelled `band: lo` and `band: hi` are drawn as one filled area instead of two lines, in the color of the query's first series, at `visual.bandOpacity` (0.15 by default). The tooltip and legend leave the band out. The [Pulzr Net datasource](https://github.com/pulzar-net/perses-pulzr-datasource) labels a target band this way.

Everything else is the upstream chart, and it installs beside it. The aim is to offer these additions to Perses; this repository goes away once the upstream chart has them.

```yaml
kind: Panel
spec:
  plugin:
    kind: PulzrTimeSeriesChart
    spec:
      visual:
        lineInterpolation: stepAfter
```

## Install

Put the archive (`PulzrTimeSeriesChart-<version>.tar.gz`, from the releases) in a folder listed in the Perses server's `plugin.archive_paths`, or `npm install @pulzr/perses-timeseries-panel` to embed it.

## Development

```bash
npm install
npm test
percli plugin test-schemas
npm run build
percli plugin build
```

### Releasing

Set the new version in `package.json`, commit, then tag and push it:

```bash
git tag v0.2.0 && git push origin v0.2.0
```

The Release workflow tests and builds, publishes the package to npm with provenance, and attaches the Perses plugin archive and the npm tarball to a GitHub release.

## License

Apache 2.0. Derived from Perses; see NOTICE.
