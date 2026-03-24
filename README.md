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

|                                                              |                          `esbuild`                          |      `parcel`      |       `rollup`       |                                         `rspack`                                         |         `vite`          |      `rolldown`      |      `rsbuild`       |             `bun`             |
| ------------------------------------------------------------ | :---------------------------------------------------------: | :----------------: | :------------------: | :--------------------------------------------------------------------------------------: | :---------------------: | :------------------: | :------------------: | :---------------------------: |
| Compilation time (avg on 25 runs)                            |                    11.4ms<br>(±0.590ms)                     | 379ms<br>(±20.6ms) | 26.8ms<br>(±0.616ms) |                                   24.6ms<br>(±0.363ms)                                   |  32.9ms<br>(±0.772ms)   | 6.19ms<br>(±0.317ms) | 45.8ms<br>(±0.937ms) | 22.3ms<br>(±1.03ms) <tr></tr> |
| <pre>const { bar } = require('./foo')</pre>                  |                             ❌                              |         ✅         |          ❌          | ✅<br>`>= 2.0.0-beta.6` ([#11226](https://github.com/web-infra-dev/rspack/issues/11226)) |           ❌            |          ❌          |          ⚠️          |         ❌ <tr></tr>          |
| <pre>import { bar } from './foo'</pre>                       |                             ✅                              |         ✅         |          ✅          |                                            ✅                                            |           ✅            |          ✅          |          ✅          |         ✅ <tr></tr>          |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |                                            ✅                                            |           ✅            |          ✅          |          ✅          |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |      ✅<br>`>=1.5.6` ([#11665](https://github.com/web-infra-dev/rspack/pull/11665))      | ✅<br>`>=8.0.0-beta.15` |          ✅          |   ✅<br>`>=1.5.11`   |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |      ✅<br>`>=1.5.6` ([#11665](https://github.com/web-infra-dev/rspack/pull/11665))      |           ✅            |          ✅          |   ✅<br>`>=1.5.11`   |              ❌               |

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
  ✔ properly bundles important variables (0.694292ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.387791ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.116417ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.075542ms)
  ✔ tree shakes sync modules (0.048208ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.078ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.075875ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.066375ms)
✔ builds and tree-shakes using bun (22.296041ms)

▶ builds and tree-shakes using esbuild
  ✔ properly bundles important variables (0.637958ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.513ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.135458ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.11525ms)
  ✔ tree shakes sync modules (0.044458ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.07875ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.078292ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.07025ms)
✔ builds and tree-shakes using esbuild (11.131083ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.542166ms)
  ✔ tree shakes sync require destructuring (0.048541ms)
  ✔ tree shakes sync require module (0.029041ms)
  ✔ tree shakes sync require chaining (0.032333ms)
  ✔ tree shakes sync modules (0.025875ms)
  ✔ tree shakes async modules top level awaited (0.020542ms)
  ✔ tree shakes async modules import() whole module (0.021292ms)
  ✔ tree shakes async modules import() + picked (0.023834ms)
✔ builds and tree-shakes using parcel (360.458375ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (0.622042ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.503166ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.126042ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.102834ms)
  ✔ tree shakes sync modules (0.039166ms)
  ✔ tree shakes async modules top level awaited (0.036625ms)
  ✔ tree shakes async modules import() whole module (0.039709ms)
  ✔ tree shakes async modules import() + picked (0.043417ms)
✔ builds and tree-shakes using rolldown (6.117417ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.45775ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.47575ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.115ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.09875ms)
  ✔ tree shakes sync modules (0.035125ms)
  ✔ tree shakes async modules top level awaited (0.033ms)
  ✔ tree shakes async modules import() whole module (0.031583ms)
  ✔ tree shakes async modules import() + picked (0.03725ms)
✔ builds and tree-shakes using rollup (27.63525ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (0.610708ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.349584ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.080958ms)
  ✔ tree shakes sync require chaining (0.04275ms)
  ✔ tree shakes sync modules (0.039666ms)
  ✔ tree shakes async modules top level awaited (0.0285ms)
  ✔ tree shakes async modules import() whole module (0.028ms)
  ✔ tree shakes async modules import() + picked (0.028458ms)
✔ builds and tree-shakes using rsbuild (46.290334ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (0.650291ms)
  ✔ tree shakes sync require destructuring (0.054ms)
  ✔ tree shakes sync require module (0.041541ms)
  ✔ tree shakes sync require chaining (0.037667ms)
  ✔ tree shakes sync modules (0.038042ms)
  ✔ tree shakes async modules top level awaited (0.030417ms)
  ✔ tree shakes async modules import() whole module (0.039458ms)
  ✔ tree shakes async modules import() + picked (0.048584ms)
✔ builds and tree-shakes using rspack (24.432166ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (0.701042ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.379417ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.086417ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.075333ms)
  ✔ tree shakes sync modules (0.035333ms)
  ✔ tree shakes async modules top level awaited (0.03475ms)
  ✔ tree shakes async modules import() whole module (0.031083ms)
  ✔ tree shakes async modules import() + picked (0.032292ms)
✔ builds and tree-shakes using vite (33.421583ms)
```

</details>

#### Benchmark

For more precise performance measures, you can run `pnpm run benchmark` that will start the tests 25 times (+ once for cold start, not included in the count) and compute a few metrics.
Those have been ported in the table before, but the last benchmark is available under `benchmarks/results-2025-07-29T21:08:01.343Z.csv`

<details><summary>Values</summary>

```benchmark
🎉 Benchmark completed in 19.91 seconds
📄 Results saved to: benchmarks/results-2026-03-24T11:12:34.067Z.csv

📊 Summary Statistics on 16 CPUs Apple M4 Max:
==================================================
esbuild (esbuild@0.27.4):
  Average: 11.4ms
  Median:  11.4ms
  Stddev:  0.590ms
  Min:     10.4ms
  Max:     13.2ms

parcel (@parcel/core@2.16.4):
  Average: 379ms
  Median:  374ms
  Stddev:  20.6ms
  Min:     361ms
  Max:     446ms

rollup (rollup@4.60.0):
  Average: 26.8ms
  Median:  26.9ms
  Stddev:  0.616ms
  Min:     25.9ms
  Max:     28.5ms

rspack (@rspack/core@2.0.0-beta.7):
  Average: 24.6ms
  Median:  24.6ms
  Stddev:  0.363ms
  Min:     24.0ms
  Max:     25.4ms

vite (vite@8.0.2):
  Average: 32.9ms
  Median:  33.0ms
  Stddev:  0.772ms
  Min:     31.6ms
  Max:     35.3ms

rolldown (rolldown@1.0.0-rc.11):
  Average: 6.19ms
  Median:  6.16ms
  Stddev:  0.317ms
  Min:     5.44ms
  Max:     6.94ms

rsbuild (@rsbuild/core@1.7.3):
  Average: 45.8ms
  Median:  45.6ms
  Stddev:  0.937ms
  Min:     44.4ms
  Max:     48.6ms

bun (bun@1.3.9):
  Average: 22.3ms
  Median:  22.1ms
  Stddev:  1.03ms
  Min:     21.3ms
  Max:     25.4ms

```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
