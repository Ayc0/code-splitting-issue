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

|                                                              | `esbuild` | `parcel` | `rollup` | `rspack` | `vite` | `rolldown` | `rsbuild`    |
| ------------------------------------------------------------ | :-------: | :------: | :------: | :------: | :----: | :--------: | ------------ |
| <pre>import { bar } from './foo'</pre>                       |    ✅     |    ✅    |    ✅    |    ✅    |   ✅   |     ✅     | ✅ <tr></tr> |
| <pre>const { bar } =&#13;  await import('./foo')</pre>       |    ❌     |    ✅    |    ✅    |    ✅    |   ✅   |     ✅     | ✅ <tr></tr> |
| <pre>import('./foo')&#13;  .then(module => module.bar)</pre> |    ❌     |    ✅    |    ✅    |    ❌    |   ❌   |     ✅     | ❌ <tr></tr> |
| <pre>import('./foo')&#13;  .then(({ bar }) => bar)</pre>     |    ❌     |    ✅    |    ✅    |    ❌    |   ✅   |     ✅     | ❌           |

#### Raw tests

If you want to test this for yourself, you can run `pnpm test`

> [!Note]
> To run those tests, you need at least Node 24.4.0 as it depends on the new `Symbol.dispose` & `using` keywords, and [`fs.mkdtempDisposable()`](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options) released in 24.4.0.

<details><summary>Output of the tests</summary>

```
> node --test tests/\*.test.js

▶ builds and tree-shakes using esbuild
  ✔ properly bundles important variables (0.684042ms)
  ✔ tree shakes sync modules (0.094083ms)
  ✖ tree shakes async modules top level awaited (0.55125ms)
  ✖ tree shakes async modules import() whole module (0.140125ms)
  ✖ tree shakes async modules import() + picked (0.135708ms)
✖ builds and tree-shakes using esbuild (28.821958ms)

▶ builds and tree-shakes using parcel
  ✔ properly bundles important variables (0.830625ms)
  ✔ tree shakes sync modules (0.085542ms)
  ✔ tree shakes async modules top level awaited (0.052833ms)
  ✔ tree shakes async modules import() whole module (0.048791ms)
  ✔ tree shakes async modules import() + picked (0.0425ms)
✔ builds and tree-shakes using parcel (956.7455ms)

▶ builds and tree-shakes using rolldown
  ✔ properly bundles important variables (1.542333ms)
  ✔ tree shakes sync modules (0.210708ms)
  ✔ tree shakes async modules top level awaited (0.092625ms)
  ✔ tree shakes async modules import() whole module (0.07125ms)
  ✔ tree shakes async modules import() + picked (0.076083ms)
✔ builds and tree-shakes using rolldown (22.407291ms)

▶ builds and tree-shakes using rollup
  ✔ properly bundles important variables (0.605458ms)
  ✔ tree shakes sync modules (0.077541ms)
  ✔ tree shakes async modules top level awaited (0.0585ms)
  ✔ tree shakes async modules import() whole module (0.071416ms)
  ✔ tree shakes async modules import() + picked (0.067584ms)
✔ builds and tree-shakes using rollup (49.007709ms)

▶ builds and tree-shakes using rsbuild
  ✔ properly bundles important variables (0.864334ms)
  ✔ tree shakes sync modules (0.080834ms)
  ✔ tree shakes async modules top level awaited (0.05925ms)
  ✖ tree shakes async modules import() whole module (0.399958ms)
  ✖ tree shakes async modules import() + picked (0.15125ms)
✖ builds and tree-shakes using rsbuild (145.675542ms)

▶ builds and tree-shakes using rspack
  ✔ properly bundles important variables (0.909042ms)
  ✔ tree shakes sync modules (0.087167ms)
  ✔ tree shakes async modules top level awaited (0.067333ms)
  ✖ tree shakes async modules import() whole module (0.418209ms)
  ✖ tree shakes async modules import() + picked (0.154666ms)
✖ builds and tree-shakes using rspack (86.639458ms)

▶ builds and tree-shakes using vite
  ✔ properly bundles important variables (0.801291ms)
  ✔ tree shakes sync modules (0.082458ms)
  ✔ tree shakes async modules top level awaited (0.091583ms)
  ✖ tree shakes async modules import() whole module (0.54775ms)
  ✔ tree shakes async modules import() + picked (0.087875ms)
✖ builds and tree-shakes using vite (120.876541ms)
```

</details>

### Conclusion

If you want to achieve maximum tree-shaking, prefer top-level awaits: this is the most stable across bundlers.
