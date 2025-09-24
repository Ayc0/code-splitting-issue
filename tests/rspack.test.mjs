import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { rspack } from '@rspack/core';

test("builds and tree-shakes using rspack", async (t) => {
    await using dir = await fs.mkdtempDisposable('vite');

    const outDir = path.join(process.cwd(), dir.path, 'dist');

    let compiler = rspack({
        entry: { index: './src/index.js' },
        output: {
            path: outDir,
        },
        mode: 'production',
    });

    const stats = await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                reject(err);
                return;
            }

            const info = stats.toJson();

            if (stats.hasErrors()) {
                reject(info.errors);
                return;
            }

            resolve(stats);
        });
    });

    const assets = stats.toJson().assets
    const getCode = (asset) => fs.readFile(path.join(outDir, asset.name), 'utf8')

    const builtIndexAsset = assets.find((asset) => asset.name.includes('index'));
    const builtFileAsyncAwaitAsset = assets.find((asset) => asset.name.includes('file-async-await'));
    const builtFileAsyncModuleAsset = assets.find((asset) => asset.name.includes('file-async-module'));
    const builtFileAsyncPickedAsset = assets.find((asset) => asset.name.includes('file-async-picked'));

    const builtIndexCode = await getCode(builtIndexAsset);
    const builtFileAsyncAwaitCode = await getCode(builtFileAsyncAwaitAsset);
    const builtFileAsyncModuleCode = await getCode(builtFileAsyncModuleAsset);
    const builtFileAsyncPickedCode = await getCode(builtFileAsyncPickedAsset);

    t.test("properly bundles important variables", () => {
        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC REQUIRE DESTRUCTURING/)
        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC REQUIRE MODULE/)
        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC REQUIRE CHAINING/)

        assert.match(builtIndexCode, /TO KEEP IN BUNDLE SYNC IMPORT/)
        assert.match(builtFileAsyncAwaitCode, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/)
        assert.match(builtFileAsyncModuleCode, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/)
        assert.match(builtFileAsyncPickedCode, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/)
    })

    t.test("❌ FAILURE: tree shakes sync require destructuring", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE DESTRUCTURING/)
        })
    })

    t.test("❌ FAILURE: tree shakes sync require module", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE MODULE/)
        })
    })

    t.test("tree shakes sync require chaining", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE CHAINING/)
    })

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/);
    });

    t.test("tree shakes async modules top level awaited", () => {
        assert.doesNotMatch(builtFileAsyncAwaitCode, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/);
    });

    t.test("tree shakes async modules import() whole module", () => {
        assert.doesNotMatch(builtFileAsyncModuleCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/)
    });

    t.test("tree shakes async modules import() + picked", () => {
        assert.doesNotMatch(builtFileAsyncPickedCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/)
    });
});
