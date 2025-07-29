import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { createRsbuild } from '@rsbuild/core';

test("builds and tree-shakes using rsbuild", async (t) => {
    await using dir = await fs.mkdtempDisposable('vite');

    const outDir = path.join(process.cwd(), dir.path, 'dist');

    let compiler = await createRsbuild({
        rsbuildConfig: {
            source: {
                entry: { index: './src/index.js' }
            },
            output: {
                filename: 'index.js',
                distPath: {
                    root: outDir,
                },
            },
            mode: 'production',
            logLevel: 'silent',
        }
    });

    const { stats } = await compiler.build();

    const assets = stats.toJson().assets

    const builtIndexAsset = assets.find((asset) => asset.name.includes('js/index'))
    const builtFileAsyncAsset = assets.find((asset) => asset.name.includes('js/async'))

    const getCode = (asset) => fs.readFile(path.join(outDir, asset.name), 'utf8')
    const builtIndexCode = await getCode(builtIndexAsset)
    const builtFileAsyncCode = await getCode(builtFileAsyncAsset)

    assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
    assert.match(builtFileAsyncCode, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes

    assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
    assert.doesNotMatch(builtFileAsyncCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ❌ Throws
});
