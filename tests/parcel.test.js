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
    const builtFileAsync = bundles.find((bundle) => bundle.filePath.includes('file-async'))

    const getCode = (bundle) => fs.readFile(bundle.filePath, 'utf8')
    const builtIndexCode = await getCode(builtIndex)
    const builtFileAsyncCode = await getCode(builtFileAsync)

    assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
    assert.match(builtFileAsyncCode, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes

    assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
    assert.doesNotMatch(builtFileAsyncCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ✅ Passes
});
