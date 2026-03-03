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

|                                                              |                          `esbuild`                          |      `parcel`      |       `rollup`       |                                    `rspack`                                    |         `vite`          |      `rolldown`      |      `rsbuild`      |             `bun`             |
| ------------------------------------------------------------ | :---------------------------------------------------------: | :----------------: | :------------------: | :----------------------------------------------------------------------------: | :---------------------: | :------------------: | :-----------------: | :---------------------------: |
| Compilation time (avg on 25 runs)                            |                     16.5ms<br>(±2.77ms)                     | 507ms<br>(±11.4ms) | 39.2ms<br>(±0.656ms) |                              42.6ms<br>(±0.938ms)                              |   47.7ms<br>(±1.14ms)   | 7.88ms<br>(±0.353ms) | 66.4ms<br>(±1.47ms) | 30.3ms<br>(±2.05ms) <tr></tr> |
| <pre>const { bar } = require('./foo')</pre>                  |                             ❌                              |         ✅         |          ❌          |      ⚠️<br>[#11226](https://github.com/web-infra-dev/rspack/issues/11226)      |           ❌            |          ❌          |         ⚠️          |         ❌ <tr></tr>          |
| <pre>import { bar } from './foo'</pre>                       |                             ✅                              |         ✅         |          ✅          |                                       ✅                                       |           ✅            |          ✅          |         ✅          |         ✅ <tr></tr>          |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          |                                       ✅                                       |           ✅            |          ✅          |         ✅          |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          | ✅<br>`>=1.5.6` ([#11665](https://github.com/web-infra-dev/rspack/pull/11665)) | ✅<br>`>=8.0.0-beta.15` |          ✅          |  ✅<br>`>=1.5.11`   |         ❌ <tr></tr>          |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |         ✅         |          ✅          | ✅<br>`>=1.5.6` ([#11665](https://github.com/web-infra-dev/rspack/pull/11665)) |           ✅            |          ✅          |  ✅<br>`>=1.5.11`   |              ❌               |

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
  ✔ properly bundles important variables (1.130292ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.617916ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.189958ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.128042ms)
  ✔ tree shakes sync modules (0.071167ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.123ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.123ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.117542ms)
✔ builds and tree-shakes using bun (279.435458ms)

▶ builds and tree-shakes using esbuild
  ✔ properly bundles important variables (0.759792ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.783542ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.212042ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.181041ms)
  ✔ tree shakes sync modules (0.066917ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.121333ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.125792ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.111417ms)
✔ builds and tree-shakes using esbuild (265.765291ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.841833ms)
  ✔ tree shakes sync require destructuring (0.078334ms)
  ✔ tree shakes sync require module (0.043417ms)
  ✔ tree shakes sync require chaining (0.043208ms)
  ✔ tree shakes sync modules (0.036167ms)
  ✔ tree shakes async modules top level awaited (0.032459ms)
  ✔ tree shakes async modules import() whole module (0.032958ms)
  ✔ tree shakes async modules import() + picked (0.037917ms)
✔ builds and tree-shakes using parcel (521.164833ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (0.891791ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.718542ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.185625ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.152792ms)
  ✔ tree shakes sync modules (0.056875ms)
  ✔ tree shakes async modules top level awaited (0.060208ms)
  ✔ tree shakes async modules import() whole module (0.052ms)
  ✔ tree shakes async modules import() + picked (0.055958ms)
✔ builds and tree-shakes using rolldown (7.748459ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.8325ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.795625ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.194166ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.167209ms)
  ✔ tree shakes sync modules (0.057ms)
  ✔ tree shakes async modules top level awaited (0.04825ms)
  ✔ tree shakes async modules import() whole module (0.050416ms)
  ✔ tree shakes async modules import() + picked (0.062458ms)
✔ builds and tree-shakes using rollup (43.670417ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (1.031166ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.571708ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.139167ms)
  ✔ tree shakes sync require chaining (0.06775ms)
  ✔ tree shakes sync modules (0.070625ms)
  ✔ tree shakes async modules top level awaited (0.050209ms)
  ✔ tree shakes async modules import() whole module (0.046334ms)
  ✔ tree shakes async modules import() + picked (0.045416ms)
✔ builds and tree-shakes using rsbuild (77.177458ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (1.005458ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.576375ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.146083ms)
  ✔ tree shakes sync require chaining (0.066ms)
  ✔ tree shakes sync modules (0.062291ms)
  ✔ tree shakes async modules top level awaited (0.0505ms)
  ✔ tree shakes async modules import() whole module (0.057875ms)
  ✔ tree shakes async modules import() + picked (0.062334ms)
✔ builds and tree-shakes using rspack (46.271208ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (0.891208ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.497334ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.119625ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.103416ms)
  ✔ tree shakes sync modules (0.05075ms)
  ✔ tree shakes async modules top level awaited (0.045541ms)
  ✔ tree shakes async modules import() whole module (0.0935ms)
  ✔ tree shakes async modules import() + picked (0.045584ms)
✔ builds and tree-shakes using vite (50.667166ms)
ℹ tests 72
```

</details>

#### Benchmark

For more precise performance measures, you can run `pnpm run benchmark` that will start the tests 25 times (+ once for cold start, not included in the count) and compute a few metrics.
Those have been ported in the table before, but the last benchmark is available under `benchmarks/results-2025-07-29T21:08:01.343Z.csv`

<details><summary>Values</summary>

```benchmark
🎉 Benchmark completed in 26.79 seconds
📄 Results saved to: benchmarks/results-2026-02-15T17:42:55.754Z.csv

📊 Summary Statistics on 16 CPUs Apple M4 Max:
==================================================
esbuild (esbuild@0.27.3):
  Average: 16.5ms
  Median:  15.9ms
  Stddev:  2.77ms
  Min:     14.7ms
  Max:     29.7ms

parcel (@parcel/core@2.16.4):
  Average: 507ms
  Median:  505ms
  Stddev:  11.4ms
  Min:     491ms
  Max:     536ms

rollup (rollup@4.57.1):
  Average: 39.2ms
  Median:  39.2ms
  Stddev:  0.656ms
  Min:     38.2ms
  Max:     41.0ms

rspack (@rspack/core@1.7.6):
  Average: 42.6ms
  Median:  42.3ms
  Stddev:  0.938ms
  Min:     41.4ms
  Max:     45.5ms

vite (vite@8.0.0-beta.14):
  Average: 47.7ms
  Median:  47.5ms
  Stddev:  1.14ms
  Min:     46.0ms
  Max:     51.5ms

rolldown (rolldown@1.0.0-rc.4):
  Average: 7.88ms
  Median:  7.78ms
  Stddev:  0.353ms
  Min:     7.41ms
  Max:     8.70ms

rsbuild (@rsbuild/core@1.7.3):
  Average: 66.4ms
  Median:  65.9ms
  Stddev:  1.47ms
  Min:     64.4ms
  Max:     70.0ms

bun (bun@1.3.9):
  Average: 30.3ms
  Median:  29.8ms
  Stddev:  2.05ms
  Min:     27.8ms
  Max:     38.0ms

```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
