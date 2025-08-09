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

|                                                              |                          `esbuild`                          |     `parcel`     |    `rollup`    |                               `rspack`                               |    `vite`    |  `rolldown`  |         `rsbuild`         |
| ------------------------------------------------------------ | :---------------------------------------------------------: | :--------------: | :------------: | :------------------------------------------------------------------: | :----------: | :----------: | :-----------------------: |
| Compilation time (avg on 25 runs)                            |                       31ms<br>(±8ms)                        | 547ms<br>(±36ms) | 46ms<br>(±7ms) |                            62ms<br>(±7ms)                            | 123ms (±8ms) | 38ms (±13ms) | 78ms<br>(±12ms) <tr></tr> |
| <pre>const { bar } = require('./foo')</pre>                  |                             ❌                              |        ✅        |       ❌       | ⚠️<br>[#11226](https://github.com/web-infra-dev/rspack/issues/11226) |      ❌      |      ❌      |       ⚠️ <tr></tr>        |
| <pre>import { bar } from './foo'</pre>                       |                             ✅                              |        ✅        |       ✅       |                                  ✅                                  |      ✅      |      ✅      |       ✅ <tr></tr>        |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅       |                                  ✅                                  |      ✅      |      ✅      |       ✅ <tr></tr>        |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅       | ❌<br>[#11225](https://github.com/web-infra-dev/rspack/issues/11225) |      ❌      |      ✅      |       ❌ <tr></tr>        |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅       | ❌<br>[#11225](https://github.com/web-infra-dev/rspack/issues/11225) |      ✅      |      ✅      |            ❌             |

> [!Note]
> For `require()`, Rollup was computed using the plugin `@rollup/plugin-commonjs` with the option `transformMixedEsModules: true`\
> And Vite also uses the same plugin (and not the default `build.commonjsOptions` object, for some reason it didn’t work).\
> But Rolldown didn’t need that (it worked out of the box).

#### Raw tests

If you want to test this for yourself, you can run `pnpm test`

> [!Note]
> To run those tests, you need at least Node 24.4.0 as it depends on the [new `Symbol.dispose` & `using` keywords](https://github.com/tc39/proposal-explicit-resource-management), and [`fs.mkdtempDisposable()`](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options) released in 24.4.0.

<details><summary>Output of the tests</summary>

```
> node --test tests/\*.test.mjs

▶ builds and tree-shakes using esbuild
  ✔ properly bundles important variables (0.800541ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.901875ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.216916ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.180833ms)
  ✔ tree shakes sync modules (0.071833ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.116709ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.123833ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.712708ms)
✔ builds and tree-shakes using esbuild (29.283791ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.962625ms)
  ✔ tree shakes sync require destructuring (0.09975ms)
  ✔ tree shakes sync require module (0.051458ms)
  ✔ tree shakes sync require chaining (0.053292ms)
  ✔ tree shakes sync modules (0.046375ms)
  ✔ tree shakes async modules top level awaited (0.039916ms)
  ✔ tree shakes async modules import() whole module (0.042042ms)
  ✔ tree shakes async modules import() + picked (0.04475ms)
✔ builds and tree-shakes using parcel (583.063958ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (1.507125ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.939125ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.421ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.310792ms)
  ✔ tree shakes sync modules (0.087833ms)
  ✔ tree shakes async modules top level awaited (0.064291ms)
  ✔ tree shakes async modules import() whole module (0.060166ms)
  ✔ tree shakes async modules import() + picked (0.084917ms)
✔ builds and tree-shakes using rolldown (26.31975ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.742917ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.865542ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.210458ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.1815ms)
  ✔ tree shakes sync modules (0.065958ms)
  ✔ tree shakes async modules top level awaited (0.059167ms)
  ✔ tree shakes async modules import() whole module (0.053792ms)
  ✔ tree shakes async modules import() + picked (0.055708ms)
✔ builds and tree-shakes using rollup (48.903208ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (1.046083ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.593209ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.199833ms)
  ✔ tree shakes sync require chaining (0.102959ms)
  ✔ tree shakes sync modules (0.069875ms)
  ✔ tree shakes async modules top level awaited (0.054916ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.147541ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.113959ms)
✔ builds and tree-shakes using rsbuild (79.585958ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (1.154ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.582709ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.156333ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.068333ms)
  ✔ tree shakes sync modules (0.063625ms)
  ✔ tree shakes async modules top level awaited (0.056167ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.137ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.151834ms)
✔ builds and tree-shakes using rspack (65.446334ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (0.983042ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.547958ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.230208ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.140417ms)
  ✔ tree shakes sync modules (0.062541ms)
  ✔ tree shakes async modules top level awaited (0.057208ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.106416ms)
  ✔ tree shakes async modules import() + picked (0.052708ms)
✔ builds and tree-shakes using vite (142.683083ms)
```

</details>

#### Benchmark

For more precise performance measures, you can run `pnpm run benchmark` that will start the tests 25 times (+ once for cold start, not included in the count) and compute a few metrics.
Those have been ported in the table before, but the last benchmark is available under `benchmark-results-2025-07-29T21:08:01.343Z.csv`

<details><summary>Values</summary>

```
🎉 Benchmark completed in 27.89 seconds
📄 Results saved to: benchmark-results-2025-07-29T21:08:01.343Z.csv

📊 Summary Statistics:
==================================================
esbuild:
  Average: 30.74ms
  Median:  29.90ms
  Stddev:  8.16ms
  Min:     20.21ms
  Max:     54.36ms

parcel:
  Average: 547.04ms
  Median:  545.32ms
  Stddev:  35.86ms
  Min:     499.00ms
  Max:     625.70ms

rolldown:
  Average: 38.05ms
  Median:  37.21ms
  Stddev:  12.83ms
  Min:     12.30ms
  Max:     65.26ms

rollup:
  Average: 45.86ms
  Median:  43.76ms
  Stddev:  7.19ms
  Min:     34.64ms
  Max:     63.95ms

rsbuild:
  Average: 78.44ms
  Median:  77.25ms
  Stddev:  11.90ms
  Min:     65.47ms
  Max:     116.25ms

rspack:
  Average: 61.86ms
  Median:  59.83ms
  Stddev:  7.02ms
  Min:     53.28ms
  Max:     78.04ms

vite:
  Average: 123.36ms
  Median:  119.62ms
  Stddev:  7.77ms
  Min:     114.72ms
  Max:     138.90ms
```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
