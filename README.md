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

|                                                              |                          `esbuild`                          |     `parcel`     |    `rollup`     |                                    `rspack`                                    |    `vite`     |  `rolldown`  |         `rsbuild`          |
| ------------------------------------------------------------ | :---------------------------------------------------------: | :--------------: | :-------------: | :----------------------------------------------------------------------------: | :-----------: | :----------: | :------------------------: |
| Compilation time (avg on 25 runs)                            |                       10.4ms<br>(±0.3ms)                        | 374ms<br>(±16ms) | 27.4ms<br>(±0.7ms) |                                30.8ms<br>(±1ms)                                 | 78.8ms (±1.9ms) | 6.6ms<br>(0.5ms) | 46.7ms<br>(±0.9ms) <tr></tr>  |
| <pre>const { bar } = require('./foo')</pre>                  |                             ❌                              |        ✅        |       ❌        |      ⚠️<br>[#11226](https://github.com/web-infra-dev/rspack/issues/11226)      |      ❌       |      ❌      |        ⚠️ <tr></tr>        |
| <pre>import { bar } from './foo'</pre>                       |                             ✅                              |        ✅        |       ✅        |                                       ✅                                       |      ✅       |      ✅      |        ✅ <tr></tr>        |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅        |                                       ✅                                       |      ✅       |      ✅      |        ✅ <tr></tr>        |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅        | ✅<br>`>=1.5.6` ([#11665](https://github.com/web-infra-dev/rspack/pull/11665)) |      ❌       |      ✅      | ✅<br>`>=1.5.11` <tr></tr> |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅        | ✅<br>`>=1.5.6` ([#11665](https://github.com/web-infra-dev/rspack/pull/11665)) |      ✅       |      ✅      |      ✅<br>`>=1.5.11`      |

> [!Note]
> For `require()`, Rollup was computed using the plugin `@rollup/plugin-commonjs` with the option `transformMixedEsModules: true`\
> And Vite also uses the same plugin (and not the default `build.commonjsOptions` object, for some reason it didn’t work).\
> But Rolldown didn’t need that (it worked out of the box).

> [!Note]
> For rsbuild and the `import('./foo').then(({ bar }) => bar)` test, it requires to have `browserslist` setup to something like `Chrome >= 55`

#### Raw tests

If you want to test this for yourself, you can run `pnpm test`

> [!Note]
> To run those tests, you need at least Node 24.4.0 as it depends on the [new `Symbol.dispose` & `using` keywords](https://github.com/tc39/proposal-explicit-resource-management), and [`fs.mkdtempDisposable()`](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options) released in 24.4.0.

<details><summary>Output of the tests</summary>

```
> node --test tests/\*.test.mjs

▶ builds and tree-shakes using esbuild
  ✔ properly bundles important variables (0.477959ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.543958ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.12675ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.109625ms)
  ✔ tree shakes sync modules (0.044708ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.07625ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.076959ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.068708ms)
✔ builds and tree-shakes using esbuild (10.113208ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.560791ms)
  ✔ tree shakes sync require destructuring (0.051083ms)
  ✔ tree shakes sync require module (0.031459ms)
  ✔ tree shakes sync require chaining (0.029708ms)
  ✔ tree shakes sync modules (0.026834ms)
  ✔ tree shakes async modules top level awaited (0.021666ms)
  ✔ tree shakes async modules import() whole module (0.022292ms)
  ✔ tree shakes async modules import() + picked (0.023042ms)
✔ builds and tree-shakes using parcel (363.28775ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (0.514042ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.493292ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.11925ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.105417ms)
  ✔ tree shakes sync modules (0.044666ms)
  ✔ tree shakes async modules top level awaited (0.037625ms)
  ✔ tree shakes async modules import() whole module (0.042375ms)
  ✔ tree shakes async modules import() + picked (0.044875ms)
✔ builds and tree-shakes using rolldown (6.638083ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.468917ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.475875ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.116541ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.108042ms)
  ✔ tree shakes sync modules (0.066625ms)
  ✔ tree shakes async modules top level awaited (0.035625ms)
  ✔ tree shakes async modules import() whole module (0.028459ms)
  ✔ tree shakes async modules import() + picked (0.040167ms)
✔ builds and tree-shakes using rollup (37.339875ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (0.626209ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.347916ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.083375ms)
  ✔ tree shakes sync require chaining (0.034875ms)
  ✔ tree shakes sync modules (0.036792ms)
  ✔ tree shakes async modules top level awaited (0.029458ms)
  ✔ tree shakes async modules import() whole module (0.027666ms)
  ✔ tree shakes async modules import() + picked (0.029917ms)
✔ builds and tree-shakes using rsbuild (57.8595ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (0.6615ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.36675ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.091458ms)
  ✔ tree shakes sync require chaining (0.041042ms)
  ✔ tree shakes sync modules (0.040625ms)
  ✔ tree shakes async modules top level awaited (0.034417ms)
  ✔ tree shakes async modules import() whole module (0.046916ms)
  ✔ tree shakes async modules import() + picked (0.050792ms)
✔ builds and tree-shakes using rspack (43.594291ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (0.640208ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.344042ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.088875ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.074125ms)
  ✔ tree shakes sync modules (0.034167ms)
  ✔ tree shakes async modules top level awaited (0.035708ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.06175ms)
  ✔ tree shakes async modules import() + picked (0.033541ms)
✔ builds and tree-shakes using vite (79.232875ms)
```

</details>

#### Benchmark

For more precise performance measures, you can run `pnpm run benchmark` that will start the tests 25 times (+ once for cold start, not included in the count) and compute a few metrics.
Those have been ported in the table before, but the last benchmark is available under `benchmarks/results-2025-07-29T21:08:01.343Z.csv`

<details><summary>Values</summary>

```
🎉 Benchmark completed in 18.82 seconds
📄 Results saved to: benchmarks/results-2025-11-15T12:22:39.208Z.csv

📊 Summary Statistics:
==================================================
esbuild:
  Average: 10.45ms
  Median:  10.37ms
  Stddev:  0.32ms
  Min:     9.89ms
  Max:     11.35ms

parcel:
  Average: 374.40ms
  Median:  369.55ms
  Stddev:  15.96ms
  Min:     360.64ms
  Max:     441.04ms

rollup:
  Average: 27.40ms
  Median:  27.33ms
  Stddev:  0.71ms
  Min:     26.20ms
  Max:     29.34ms

rspack:
  Average: 30.82ms
  Median:  30.59ms
  Stddev:  1.01ms
  Min:     29.10ms
  Max:     33.68ms

vite:
  Average: 78.80ms
  Median:  78.28ms
  Stddev:  1.90ms
  Min:     76.77ms
  Max:     84.47ms

rolldown:
  Average: 6.61ms
  Median:  6.55ms
  Stddev:  0.54ms
  Min:     5.94ms
  Max:     8.76ms

rsbuild:
  Average: 46.64ms
  Median:  46.47ms
  Stddev:  0.94ms
  Min:     45.28ms
  Max:     49.25ms
```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
