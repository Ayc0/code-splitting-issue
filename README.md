## Code splitting issues

This repo aims to check that tree-shaking for lazy-loaded assets works

### Input

This repository mostly works with 2 files:

- `index.js`
- `to-import.js`

In the imported file, we define 2 variables:

- `toKeepInBundle`
- `toRemoveFromBundle`

And in the index files, we only import `toKeepInBundle` and we check if `toRemoveFromBundle` is in the final output (by checking its value, not key)

And we test this using 4 different scenarios

### Tests

|                                                              |                          `esbuild`                          |      `parcel`      |       `rollup`       |                                    `rspack`                                    |         `vite`          |      `rolldown`      |                                  `rsbuild`                                   |             `bun`             |
| ------------------------------------------------------------ | :---------------------------------------------------------: | :----------------: | :------------------: | :----------------------------------------------------------------------------: | :---------------------: | :------------------: | :--------------------------------------------------------------------------: | :---------------------------: |
| Compilation time (avg on 25 runs) | 18.9ms<br>(±2.61ms) | 483ms<br>(±8.33ms) | 35.9ms<br>(±1.15ms) | 40.9ms<br>(±3.53ms) | 38.2ms<br>(±0.900ms) | 11.3ms<br>(±2.44ms) | 61.8ms<br>(±2.92ms) | 46.0ms<br>(±4.30ms) <tr></tr>  |
| <pre>const { bar } = require('./foo')</pre>                  |                             ❌                              |         ✅         |          ❌          | ✅<br>[`>=2.0.0-beta.6`](https://github.com/web-infra-dev/rspack/issues/11226) |           ❌            |          ❌          | ✅<br>[`>=2.0.0-beta.8`](https://github.com/web-infra-dev/rsbuild/pull/7307) |         ❌ <tr></tr>          |
| <pre>import { bar } from './foo'</pre>                       |                             ✅                              |         ✅         |          ✅          |                                       ✅                                       |           ✅            |          ✅          |                                      ✅                                      |         ✅ <tr></tr>          |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |                                       ✅                                       |           ✅            |          ✅          |                                      ✅                                      |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |     ✅<br>[`>=1.5.6`](https://github.com/web-infra-dev/rspack/pull/11665)      | ✅<br>`>=8.0.0-beta.15` |          ✅          |                               ✅<br>`>=1.5.11`                               |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |     ✅<br>[`>=1.5.6`](https://github.com/web-infra-dev/rspack/pull/11665)      |           ✅            |          ✅          |                               ✅<br>`>=1.5.11`                               |              ❌               |

> [!Note]
> For `require()`, Rollup was computed using the plugin `@rollup/plugin-commonjs` with the option `transformMixedEsModules: true`\
> And Vite 7- also uses the same plugin (and not the default `build.commonjsOptions` object, for some reason it didn’t work).\
> But neither Vite 8+ nor Rolldown don’t need that.

> [!Note]
> For rsbuild and the `import('./foo').then(({ bar }) => bar)` test, it requires to have `browserslist` setup to something like `Chrome >= 55`

#### Raw tests

If you want to test this for yourself, you can run `pnpm test`

> [!Note]
> To run those tests, you need at least Node 24.4.0 as it depends on the [new `Symbol.dispose` & `using` keywords](https://github.com/tc39/proposal-explicit-resource-management), and [`fs.mkdtempDisposable()`](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options) released in 24.4.0.

<details><summary>Output of the tests</summary>

```
> node --test tests/*.test.mjs

▶ builds and tree-shakes using bun
  ✔ properly bundles important variables (1.707459ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.413875ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.120583ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.081584ms)
  ✔ tree shakes sync modules (0.047708ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.078167ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.080209ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.070959ms)
✔ builds and tree-shakes using bun (55.950542ms)

▶ builds and tree-shakes using esbuild
  ✔ properly bundles important variables (0.465083ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.486208ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.123541ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.104375ms)
  ✔ tree shakes sync modules (0.040958ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.071208ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.075041ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.069625ms)
✔ builds and tree-shakes using esbuild (189.439ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.594417ms)
  ✔ tree shakes sync require destructuring (0.050792ms)
  ✔ tree shakes sync require module (0.029167ms)
  ✔ tree shakes sync require chaining (0.028833ms)
  ✔ tree shakes sync modules (0.023292ms)
  ✔ tree shakes async modules top level awaited (0.019833ms)
  ✔ tree shakes async modules import() whole module (0.024042ms)
  ✔ tree shakes async modules import() + picked (0.0225ms)
✔ builds and tree-shakes using parcel (492.933958ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (0.528042ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.455834ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.12275ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.103833ms)
  ✔ tree shakes sync modules (0.038959ms)
  ✔ tree shakes async modules top level awaited (0.038625ms)
  ✔ tree shakes async modules import() whole module (0.036958ms)
  ✔ tree shakes async modules import() + picked (0.078208ms)
✔ builds and tree-shakes using rolldown (29.99775ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.49325ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.478333ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.118833ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.10475ms)
  ✔ tree shakes sync modules (0.037334ms)
  ✔ tree shakes async modules top level awaited (0.033875ms)
  ✔ tree shakes async modules import() whole module (0.031584ms)
  ✔ tree shakes async modules import() + picked (0.038041ms)
✔ builds and tree-shakes using rollup (31.731208ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (0.682292ms)
  ✔ tree shakes sync require destructuring (0.0585ms)
  ✔ tree shakes sync require module (0.04425ms)
  ✔ tree shakes sync require chaining (0.043667ms)
  ✔ tree shakes sync modules (0.041042ms)
  ✔ tree shakes async modules top level awaited (0.028084ms)
  ✔ tree shakes async modules import() whole module (0.028584ms)
  ✔ tree shakes async modules import() + picked (0.030041ms)
✔ builds and tree-shakes using rsbuild (75.59525ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (0.77225ms)
  ✔ tree shakes sync require destructuring (0.074792ms)
  ✔ tree shakes sync require module (0.049125ms)
  ✔ tree shakes sync require chaining (0.041084ms)
  ✔ tree shakes sync modules (0.042708ms)
  ✔ tree shakes async modules top level awaited (0.032125ms)
  ✔ tree shakes async modules import() whole module (0.046208ms)
  ✔ tree shakes async modules import() + picked (0.052917ms)
✔ builds and tree-shakes using rspack (73.300209ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (0.592084ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.315792ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.075792ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.10425ms)
  ✔ tree shakes sync modules (0.058625ms)
  ✔ tree shakes async modules top level awaited (0.042833ms)
  ✔ tree shakes async modules import() whole module (0.03475ms)
  ✔ tree shakes async modules import() + picked (0.031666ms)
✔ builds and tree-shakes using vite (41.211666ms)
```

</details>

#### Benchmark

For more precise performance measures, you can run `pnpm run benchmark` that will start the tests 25 times (+ once for cold start, not included in the count) and compute a few metrics.
Those have been ported in the table before, but the last benchmark is available under `benchmarks/results-2025-07-29T21:08:01.343Z.csv`

<details><summary>Values</summary>

```benchmark
🎉 Benchmark completed in 25.45 seconds
📄 Results saved to: benchmarks/results-2026-04-25T09:23:13.964Z.csv

📊 Summary Statistics on 10 CPUs Apple M1 Max:
==================================================
esbuild (esbuild@0.28.0):
  Average: 18.9ms
  Median:  18.1ms
  Stddev:  2.61ms
  Min:     15.2ms
  Max:     24.0ms

parcel (@parcel/core@2.16.4):
  Average: 483ms
  Median:  481ms
  Stddev:  8.33ms
  Min:     468ms
  Max:     501ms

rollup (rollup@4.60.1):
  Average: 35.9ms
  Median:  35.7ms
  Stddev:  1.15ms
  Min:     34.2ms
  Max:     38.5ms

rspack (@rspack/core@2.0.0):
  Average: 40.9ms
  Median:  40.7ms
  Stddev:  3.53ms
  Min:     36.0ms
  Max:     50.9ms

vite (vite@8.0.10):
  Average: 38.2ms
  Median:  38.1ms
  Stddev:  0.900ms
  Min:     36.5ms
  Max:     40.1ms

rolldown (rolldown@1.0.0-rc.13):
  Average: 11.3ms
  Median:  11.6ms
  Stddev:  2.44ms
  Min:     7.53ms
  Max:     17.2ms

rsbuild (@rsbuild/core@2.0.0-beta.9):
  Average: 61.8ms
  Median:  61.7ms
  Stddev:  2.92ms
  Min:     57.8ms
  Max:     69.9ms

bun (bun@1.3.9):
  Average: 46.0ms
  Median:  44.4ms
  Stddev:  4.30ms
  Min:     39.3ms
  Max:     54.1ms

```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
