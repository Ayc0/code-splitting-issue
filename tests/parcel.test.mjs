import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { Parcel } from '@parcel/core';

test("builds and tree-shakes using parcel", async (t) => {
    await using dir = await fs.mkdtempDisposable('vite');

    let bundler = new Parcel({
        entries: 'src/index.js',
        defaultConfig: '@parcel/config-default',
        mode: 'production',
        defaultTargetOptions: {
            distDir: path.join(process.cwd(), dir.path, 'dist'),
            engines: {
                browsers: ['last 1 Chrome version']
            }
        }
    });

    let { bundleGraph } = await bundler.run();

    const bundles = bundleGraph.getBundles()

    const builtIndex = bundles.find((bundle) => bundle.filePath.includes('index'))
    const builtFileAsyncAwait = bundles.find((bundle) => bundle.filePath.includes('file-async-await'))
    const builtFileAsyncModule = bundles.find((bundle) => bundle.filePath.includes('file-async-module'))
    const builtFileAsyncPicked = bundles.find((bundle) => bundle.filePath.includes('file-async-picked'))


    const getCode = (bundle) => fs.readFile(bundle.filePath, 'utf8')
    const builtIndexCode = await getCode(builtIndex)
    const builtFileAsyncAwaitCode = await getCode(builtFileAsyncAwait)
    const builtFileAsyncModuleCode = await getCode(builtFileAsyncModule)
    const builtFileAsyncPickedCode = await getCode(builtFileAsyncPicked)

    t.test("properly bundles important variables", () => {
        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC REQUIRE DESTRUCTURING/) // ✅ Passes
        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC REQUIRE MODULE/) // ✅ Passes
        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC REQUIRE CHAINING/) // ✅ Passes

        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC IMPORT/) // ✅ Passes
        assert.match(builtFileAsyncAwaitCode, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/) // ✅ Passes
        assert.match(builtFileAsyncModuleCode, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/) // ✅ Passes
        assert.match(builtFileAsyncPickedCode, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/) // ✅ Passes
    })

    t.test("tree shakes sync require destructuring", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE DESTRUCTURING/) // ✅ Passes
    })

    t.test("tree shakes sync require module", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE MODULE/) // ✅ Passes
    })

    t.test("tree shakes sync require chaining", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE CHAINING/) // ✅ Passes
    })

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/) // ✅ Passes
    })

    t.test("tree shakes async modules top level awaited", () => {
        assert.doesNotMatch(builtFileAsyncAwaitCode, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/) // ✅ Passes
    })

    t.test("tree shakes async modules import() whole module", () => {
        assert.doesNotMatch(builtFileAsyncModuleCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/) // ✅ Passes
    })

    t.test("tree shakes async modules import() + picked", () => {
        assert.doesNotMatch(builtFileAsyncPickedCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/) // ✅ Passes
    })
});
