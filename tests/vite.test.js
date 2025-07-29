import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { build } from "vite";

test("builds and tree-shakes using vite", async (t) => {
    await using dir = await fs.mkdtempDisposable('vite');

    const result = await build({
        configFile: false,
        root: 'src',
        logLevel: 'silent',
        build: {
            outDir: path.join(process.cwd(), dir.path, 'dist'),
        },
    });

    const builtIndex = result.output.find((r) => r.name === 'index');
    const builtFileAsyncAwait = result.output.find((r) => r.name === 'file-async-await');
    const builtFileAsyncModule = result.output.find((r) => r.name === 'file-async-module');
    const builtFileAsyncPicked = result.output.find((r) => r.name === 'file-async-picked');

    t.test("properly bundles important variables", () => {
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC IMPORT/); // ✅ Passes
        assert.match(builtFileAsyncAwait.code, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/); // ✅ Passes
        assert.match(builtFileAsyncModule.code, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/); // ✅ Passes
        assert.match(builtFileAsyncPicked.code, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/); // ✅ Passes
    });

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/); // ✅ Passes
    });

    t.test("tree shakes async modules top level awaited", () => {
        assert.doesNotMatch(builtFileAsyncAwait.code, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/); // ✅ Passes
    });

    t.test("tree shakes async modules import() whole module", () => {
        assert.doesNotMatch(builtFileAsyncModule.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/); // ❌ Throws
    });

    t.test("tree shakes async modules import() + picked", () => {
        assert.doesNotMatch(builtFileAsyncPicked.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/); // ✅ Passes
    });
});
