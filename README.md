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

|                                                              | `esbuild` | `parcel` | `rollup` | `rspack` | `vite` | `rolldown` |    `rsbuild`    |
| ------------------------------------------------------------ | :-------: | :------: | :------: | :------: | :----: | :--------: | :-------------: |
| Compilation time                                             |  28.8ms   |  957ms   |  49.0ms  |  86.6ms  | 121ms  |   22.4ms   | 146ms <tr></tr> |
| <pre>const { bar } = require('./foo')</pre>                  |    ❌     |    ✅    |    ❌    |    ❌    |   ❌   |     ❌     |  ✅ <tr></tr>   |
| <pre>import { bar } from './foo'</pre>                       |    ✅     |    ✅    |    ✅    |    ✅    |   ✅   |     ✅     |  ✅ <tr></tr>   |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       |    ❌     |    ✅    |    ✅    |    ✅    |   ✅   |     ✅     |  ✅ <tr></tr>   |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> |    ❌     |    ✅    |    ✅    |    ❌    |   ❌   |     ✅     |  ❌ <tr></tr>   |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     |    ❌     |    ✅    |    ✅    |    ❌    |   ✅   |     ✅     |       ❌        |

#### Raw tests

If you want to test this for yourself, you can run `pnpm test`

> [!Note]
> To run those tests, you need at least Node 24.4.0 as it depends on the new `Symbol.dispose` & `using` keywords, and [`fs.mkdtempDisposable()`](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options) released in 24.4.0.

<details><summary>Output of the tests</summary>

```
> node --test tests/\*.test.mjs

▶ builds and tree-shakes using esbuild
  ✔ properly bundles important variables (0.628417ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.669917ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.255042ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.22125ms)
  ✔ tree shakes sync modules (0.068084ms)
  ✔ ❌ FAILURE: tree shakes async modules top level awaited (0.095333ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.0965ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.088458ms)
✔ builds and tree-shakes using esbuild (28.255292ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.73575ms)
  ✔ tree shakes sync require destructuring (0.065375ms)
  ✔ tree shakes sync require module (0.039875ms)
  ✔ tree shakes sync require chaining (0.035583ms)
  ✔ tree shakes sync modules (0.042084ms)
  ✔ tree shakes async modules top level awaited (0.034208ms)
  ✔ tree shakes async modules import() whole module (0.031709ms)
  ✔ tree shakes async modules import() + picked (0.033375ms)
✔ builds and tree-shakes using parcel (550.783458ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (0.72675ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.642125ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.242959ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.222291ms)
  ✔ tree shakes sync modules (0.061083ms)
  ✔ tree shakes async modules top level awaited (0.049584ms)
  ✔ tree shakes async modules import() whole module (0.049916ms)
  ✔ tree shakes async modules import() + picked (0.060709ms)
✔ builds and tree-shakes using rolldown (28.376167ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.585667ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.638792ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.164459ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.208666ms)
  ✔ tree shakes sync modules (0.05275ms)
  ✔ tree shakes async modules top level awaited (0.049083ms)
  ✔ tree shakes async modules import() whole module (0.04575ms)
  ✔ tree shakes async modules import() + picked (0.042209ms)
✔ builds and tree-shakes using rollup (53.577042ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (0.833667ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.470416ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.1145ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.103375ms)
  ✔ tree shakes sync modules (0.075833ms)
  ✔ tree shakes async modules top level awaited (0.073167ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.128375ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.109833ms)
✔ builds and tree-shakes using rsbuild (73.163417ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (0.9665ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.500084ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.12675ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.116042ms)
  ✔ tree shakes sync modules (0.053917ms)
  ✔ tree shakes async modules top level awaited (0.056334ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.107625ms)
  ✔ ❌ FAILURE: tree shakes async modules import() + picked (0.122417ms)
✔ builds and tree-shakes using rspack (55.529375ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (1.106541ms)
  ✔ ❌ FAILURE: tree shakes sync require destructuring (0.476667ms)
  ✔ ❌ FAILURE: tree shakes sync require module (0.124417ms)
  ✔ ❌ FAILURE: tree shakes sync require chaining (0.103584ms)
  ✔ tree shakes sync modules (0.05275ms)
  ✔ tree shakes async modules top level awaited (0.044583ms)
  ✔ ❌ FAILURE: tree shakes async modules import() whole module (0.085167ms)
  ✔ tree shakes async modules import() + picked (0.04725ms)
✔ builds and tree-shakes using vite (115.024625ms)
```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
