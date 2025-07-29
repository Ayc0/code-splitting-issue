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
    const getCode = (asset) => fs.readFile(path.join(outDir, asset.name), 'utf8')

    const builtIndexAsset = assets.find((asset) => asset.name.includes('/index'));
    const builtFileAsyncAwaitAsset = assets.find((asset) => asset.name.includes('/file-async-await'));
    const builtFileAsyncModuleAsset = assets.find((asset) => asset.name.includes('/file-async-module'));
    const builtFileAsyncPickedAsset = assets.find((asset) => asset.name.includes('/file-async-picked'));

    const builtIndexCode = await getCode(builtIndexAsset);
    const builtFileAsyncAwaitCode = await getCode(builtFileAsyncAwaitAsset);
    const builtFileAsyncModuleCode = await getCode(builtFileAsyncModuleAsset);
    const builtFileAsyncPickedCode = await getCode(builtFileAsyncPickedAsset);

    t.test("properly bundles important variables", () => {
        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC/); // ✅ Passes
        assert.match(builtFileAsyncAwaitCode, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/); // ✅ Passes
        assert.match(builtFileAsyncModuleCode, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/); // ✅ Passes
        assert.match(builtFileAsyncPickedCode, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/); // ✅ Passes
    });

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC/); // ✅ Passes
    });

    t.test("tree shakes async modules top level awaited", () => {
        assert.doesNotMatch(builtFileAsyncAwaitCode, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/); // ✅ Passes
    });

    t.test("tree shakes async modules import() whole module", () => {
        assert.doesNotMatch(builtFileAsyncModuleCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/); // ❌ Throws
    });

    t.test("tree shakes async modules import() + picked", () => {
        assert.doesNotMatch(builtFileAsyncPickedCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/); // ❌ Throws
    });
});
