## Code splitting issues

This repo aims to check that tree-shaking for lazy-loaded assets works

### Input

This repository mostly works with 2 files:

- `index.js`
- `file-async.js`

(In practice a 3rd file `file-sync.js` is used to test as a baseline that tree-shaking works for direct imports)

```js
// index.js
import("./file-async").then((module) => console.log(module.toKeepInBundle));
```

```js
// file-async.js
export const toKeepInBundle = "TO KEEP IN BUNDLE ASYNC";

// Often never tree-shaken (because of `import()`)
export const toRemoveFromBundle = "SHOULD BE REMOVED FROM BUNDLE ASYNC";
```

### Tests

To run tests, you can run `pnpm test`

> [!Note]
> To run those tests, you need at least Node 24.4.0 as it depends on the new `Symbol.dispose` & `using` keywords, and [`fs.mkdtempDisposable()`](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options) released in 24.4.0.

```
> node --test tests/\*.test.js

✖ builds and tree-shakes using esbuild (40.826916ms)
✔ builds and tree-shakes using parcel (480.178709ms)
✔ builds and tree-shakes using rolldown (87.689083ms)
✔ builds and tree-shakes using rollup (45.05275ms)
✖ builds and tree-shakes using rsbuild (91.116792ms)
✖ builds and tree-shakes using rspack (68.258125ms)
✖ builds and tree-shakes using vite (105.721833ms)
```
