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
| Compilation time (avg on 25 runs)                            |                       27ms<br>(±7ms)                        | 582ms<br>(±21ms) | 54ms<br>(±16ms) |                                71ms<br>(±10ms)                                 | 148ms (±21ms) | 31ms (±18ms) | 86ms<br>(±14ms) <tr></tr>  |
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
  ✔ properly bundles important variables (0.800291ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (1.059375ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.319958ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.19925ms)
  ✔ tree shakes sync modules (0.074583ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.125917ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.125041ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.108833ms)
✔ builds and tree-shakes using esbuild (24.498084ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.946292ms)
  ✔ tree shakes sync require destructuring (0.093041ms)
  ✔ tree shakes sync require module (0.051292ms)
  ✔ tree shakes sync require chaining (0.0505ms)
  ✔ tree shakes sync modules (0.046333ms)
  ✔ tree shakes async modules top level awaited (0.03775ms)
  ✔ tree shakes async modules import() whole module (0.041959ms)
  ✔ tree shakes async modules import() + picked (0.042167ms)
✔ builds and tree-shakes using parcel (623.948625ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (2.8225ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.811542ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.298291ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.262125ms)
  ✔ tree shakes sync modules (0.066958ms)
  ✔ tree shakes async modules top level awaited (0.06175ms)
  ✔ tree shakes async modules import() whole module (0.063875ms)
  ✔ tree shakes async modules import() + picked (0.076875ms)
✔ builds and tree-shakes using rolldown (28.179917ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.805583ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.842541ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.270833ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.199083ms)
  ✔ tree shakes sync modules (0.069125ms)
  ✔ tree shakes async modules top level awaited (0.062875ms)
  ✔ tree shakes async modules import() whole module (0.055333ms)
  ✔ tree shakes async modules import() + picked (0.059875ms)
✔ builds and tree-shakes using rollup (47.202166ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (1.008459ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.671417ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.185958ms)
  ✔ tree shakes sync require chaining (0.062667ms)
  ✔ tree shakes sync modules (0.056333ms)
  ✔ tree shakes async modules top level awaited (0.049042ms)
  ✔ tree shakes async modules import() whole module (0.054416ms)
  ✔ tree shakes async modules import() + picked (0.051917ms)
✔ builds and tree-shakes using rsbuild (79.944416ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (1.093083ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.743625ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.2005ms)
  ✔ tree shakes sync require chaining (0.075834ms)
  ✔ tree shakes sync modules (0.070125ms)
  ✔ tree shakes async modules top level awaited (0.07125ms)
  ✔ tree shakes async modules import() whole module (0.073541ms)
  ✔ tree shakes async modules import() + picked (0.101958ms)
✔ builds and tree-shakes using rspack (65.995791ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (1.031792ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.710166ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.166334ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.229583ms)
  ✔ tree shakes sync modules (0.089042ms)
  ✔ tree shakes async modules top level awaited (0.070916ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.136208ms)
  ✔ tree shakes async modules import() + picked (0.059583ms)
✔ builds and tree-shakes using vite (154.022291ms)
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
