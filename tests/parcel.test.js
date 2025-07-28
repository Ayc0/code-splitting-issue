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

    for (let bundle of bundleGraph.getBundles()) {
        const code = await fs.readFile(bundle.filePath, 'utf8');
        if (bundle.filePath.endsWith('index.js')) {
            assert.match(code, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
        } else {
            assert.match(code, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ✅ Passes
        }
    }
});
