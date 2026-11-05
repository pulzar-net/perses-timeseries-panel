# Time series chart with bands and step lines, for Perses

Perses's [time series chart](https://github.com/perses/plugins/tree/main/timeserieschart), as the panel `PulzrTimeSeriesChart`, with two additions:

- **Line interpolation**: `linear`, `smooth`, `stepBefore` or `stepAfter`, for the whole panel (`visual.lineInterpolation`) or one query (`querySettings[].lineInterpolation`). A setpoint or a mode is a step line.
- **Bands**: a query's two series labelled `band: lo` and `band: hi` are drawn as one filled area instead of two lines, in the color of the query's first series, at `visual.bandOpacity` (0.15 by default). The tooltip and legend leave the band out. The [Pulzr Net datasource](https://github.com/pulzar-net/perses-pulzr-datasource) labels a target band this way.

Everything else is the upstream chart, and it installs beside it. The aim is to offer both additions to Perses; this repository goes away once the upstream chart has them.

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

## License

Apache 2.0. Derived from Perses; see NOTICE.
