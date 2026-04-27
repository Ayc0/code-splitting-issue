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

|                                                              |                          `esbuild`                          |      `parcel`      |       `rollup`       |                                    `rspack`                                    |         `vite`          |     `rolldown`      |                                  `rsbuild`                                   |             `bun`             |
| ------------------------------------------------------------ | :---------------------------------------------------------: | :----------------: | :------------------: | :----------------------------------------------------------------------------: | :---------------------: | :-----------------: | :--------------------------------------------------------------------------: | :---------------------------: |
| Compilation time (avg on 25 runs)                            |                     17.4ms<br>(±1.69ms)                     | 480ms<br>(±3.83ms) | 36.1ms<br>(±0.866ms) |                              39.3ms<br>(±2.68ms)                               |  38.3ms<br>(±0.685ms)   | 11.6ms<br>(±2.30ms) |                             59.4ms<br>(±2.17ms)                              | 43.8ms<br>(±3.60ms) <tr></tr> |
| <pre>const { bar } = require('./foo')</pre>                  |                             ❌                              |         ✅         |          ❌          | ✅<br>[`>=2.0.0-beta.6`](https://github.com/web-infra-dev/rspack/issues/11226) |           ❌            |         ❌          | ✅<br>[`>=2.0.0-beta.8`](https://github.com/web-infra-dev/rsbuild/pull/7307) |         ❌ <tr></tr>          |
| <pre>import { bar } from './foo'</pre>                       |                             ✅                              |         ✅         |          ✅          |                                       ✅                                       |           ✅            |         ✅          |                                      ✅                                      |         ✅ <tr></tr>          |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |                                       ✅                                       |           ✅            |         ✅          |                                      ✅                                      |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |     ✅<br>[`>=1.5.6`](https://github.com/web-infra-dev/rspack/pull/11665)      | ✅<br>`>=8.0.0-beta.15` |         ✅          |                               ✅<br>`>=1.5.11`                               |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |     ✅<br>[`>=1.5.6`](https://github.com/web-infra-dev/rspack/pull/11665)      |           ✅            |         ✅          |                               ✅<br>`>=1.5.11`                               |              ❌               |

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
🎉 Benchmark completed in 25.15 seconds
📄 Results saved to: benchmarks/results-2026-04-27T06:49:17.209Z.csv

📊 Summary Statistics on 10 CPUs Apple M1 Max:
==================================================
esbuild (esbuild@0.28.0):
  Average: 17.4ms
  Median:  17.5ms
  Stddev:  1.69ms
  Min:     14.0ms
  Max:     20.2ms

parcel (@parcel/core@2.16.4):
  Average: 480ms
  Median:  480ms
  Stddev:  3.83ms
  Min:     472ms
  Max:     490ms

rollup (rollup@4.60.2):
  Average: 36.1ms
  Median:  35.9ms
  Stddev:  0.866ms
  Min:     34.5ms
  Max:     38.5ms

rspack (@rspack/core@2.0.0):
  Average: 39.3ms
  Median:  39.0ms
  Stddev:  2.68ms
  Min:     33.7ms
  Max:     44.1ms

vite (vite@8.0.10):
  Average: 38.3ms
  Median:  38.5ms
  Stddev:  0.685ms
  Min:     36.9ms
  Max:     40.4ms

rolldown (rolldown@1.0.0-rc.17):
  Average: 11.6ms
  Median:  11.3ms
  Stddev:  2.30ms
  Min:     7.46ms
  Max:     17.9ms

rsbuild (@rsbuild/core@2.0.1):
  Average: 59.4ms
  Median:  59.3ms
  Stddev:  2.17ms
  Min:     56.2ms
  Max:     65.8ms

bun (bun@1.3.9):
  Average: 43.8ms
  Median:  44.5ms
  Stddev:  3.60ms
  Min:     37.6ms
  Max:     50.8ms

```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
