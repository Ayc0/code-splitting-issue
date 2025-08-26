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

|                                                              |                          `esbuild`                          |     `parcel`     |    `rollup`     |                               `rspack`                               |    `vite`     |  `rolldown`  |         `rsbuild`         |
| ------------------------------------------------------------ | :---------------------------------------------------------: | :--------------: | :-------------: | :------------------------------------------------------------------: | :-----------: | :----------: | :-----------------------: |
| Compilation time (avg on 25 runs)                            |                       27ms<br>(±7ms)                        | 582ms<br>(±21ms) | 54ms<br>(±16ms) |                           71ms<br>(±10ms)                            | 148ms (±21ms) | 31ms (±18ms) | 86ms<br>(±14ms) <tr></tr> |
| <pre>const { bar } = require('./foo')</pre>                  |                             ❌                              |        ✅        |       ❌        | ⚠️<br>[#11226](https://github.com/web-infra-dev/rspack/issues/11226) |      ❌       |      ❌      |       ⚠️ <tr></tr>        |
| <pre>import { bar } from './foo'</pre>                       |                             ✅                              |        ✅        |       ✅        |                                  ✅                                  |      ✅       |      ✅      |       ✅ <tr></tr>        |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅        |                                  ✅                                  |      ✅       |      ✅      |       ✅ <tr></tr>        |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅        | ❌<br>[#11225](https://github.com/web-infra-dev/rspack/issues/11225) |      ❌       |      ✅      |       ❌ <tr></tr>        |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     | ❌<br>[#4255](https://github.com/evanw/esbuild/issues/4255) |        ✅        |       ✅        | ❌<br>[#11225](https://github.com/web-infra-dev/rspack/issues/11225) |      ✅       |      ✅      |            ❌             |

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
  ✔ properly bundles important variables (0.734208ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.781625ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.305583ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.233834ms)
  ✔ tree shakes sync modules (0.074ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.124125ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.128042ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.106084ms)
✔ builds and tree-shakes using esbuild (22.699708ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.899ms)
  ✔ tree shakes sync require destructuring (0.083667ms)
  ✔ tree shakes sync require module (0.046916ms)
  ✔ tree shakes sync require chaining (0.046625ms)
  ✔ tree shakes sync modules (0.044791ms)
  ✔ tree shakes async modules top level awaited (0.0365ms)
  ✔ tree shakes async modules import() whole module (0.041042ms)
  ✔ tree shakes async modules import() + picked (0.041209ms)
✔ builds and tree-shakes using parcel (604.39475ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (2.446666ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (2.313667ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.328041ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.276416ms)
  ✔ tree shakes sync modules (0.086583ms)
  ✔ tree shakes async modules top level awaited (0.072333ms)
  ✔ tree shakes async modules import() whole module (0.060875ms)
  ✔ tree shakes async modules import() + picked (0.07425ms)
✔ builds and tree-shakes using rolldown (24.0595ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (1.0855ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (1.206875ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.259333ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.198916ms)
  ✔ tree shakes sync modules (0.071792ms)
  ✔ tree shakes async modules top level awaited (0.059958ms)
  ✔ tree shakes async modules import() whole module (0.055042ms)
  ✔ tree shakes async modules import() + picked (0.061625ms)
✔ builds and tree-shakes using rollup (44.270875ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (1.045666ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.569167ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.143916ms)
  ✔ tree shakes sync require chaining (0.05775ms)
  ✔ tree shakes sync modules (0.054542ms)
  ✔ tree shakes async modules top level awaited (0.05ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.109ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.1125ms)
✔ builds and tree-shakes using rsbuild (73.223167ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (1.048042ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.59025ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.155542ms)
  ✔ tree shakes sync require chaining (0.066916ms)
  ✔ tree shakes sync modules (0.0735ms)
  ✔ tree shakes async modules top level awaited (0.061125ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.130458ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.150875ms)
✔ builds and tree-shakes using rspack (62.813125ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (1.716084ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.60125ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.150416ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.125292ms)
  ✔ tree shakes sync modules (0.062834ms)
  ✔ tree shakes async modules top level awaited (0.055625ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.102ms)
  ✔ tree shakes async modules import() + picked (0.054917ms)
✔ builds and tree-shakes using vite (142.726875ms)
```

</details>

#### Benchmark

For more precise performance measures, you can run `pnpm run benchmark` that will start the tests 25 times (+ once for cold start, not included in the count) and compute a few metrics.
Those have been ported in the table before, but the last benchmark is available under `benchmarks/results-2025-07-29T21:08:01.343Z.csv`

<details><summary>Values</summary>

```
🎉 Benchmark completed in 31.36 seconds
📄 Results saved to: benchmarks/results-2025-08-26T11:25:08.774Z.csv

📊 Summary Statistics:
==================================================
esbuild:
  Average: 27.30ms
  Median:  25.03ms
  Stddev:  7.04ms
  Min:     19.23ms
  Max:     45.17ms

parcel:
  Average: 582.25ms
  Median:  575.07ms
  Stddev:  21.04ms
  Min:     564.34ms
  Max:     664.65ms

rolldown:
  Average: 31.12ms
  Median:  24.29ms
  Stddev:  18.84ms
  Min:     12.05ms
  Max:     101.80ms

rollup:
  Average: 53.63ms
  Median:  48.42ms
  Stddev:  15.69ms
  Min:     43.63ms
  Max:     123.31ms

rsbuild:
  Average: 86.06ms
  Median:  81.71ms
  Stddev:  14.58ms
  Min:     74.08ms
  Max:     125.52ms

rspack:
  Average: 70.63ms
  Median:  67.07ms
  Stddev:  9.68ms
  Min:     63.03ms
  Max:     106.78ms

vite:
  Average: 147.69ms
  Median:  140.65ms
  Stddev:  20.88ms
  Min:     133.76ms
  Max:     235.06ms
```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
