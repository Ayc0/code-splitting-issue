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
        }
    });

    const builtIndex = result.output.find((r) => r.name === 'index');
    const builtFileAsyncAwait = result.output.find((r) => r.name === 'file-async-await');
    const builtFileAsyncModule = result.output.find((r) => r.name === 'file-async-module');
    const builtFileAsyncPicked = result.output.find((r) => r.name === 'file-async-picked');

    t.test("properly bundles important variables", () => {
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC REQUIRE DESTRUCTURING/)
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC REQUIRE MODULE/)
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC REQUIRE CHAINING/)

        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC IMPORT/)
        assert.match(builtFileAsyncAwait.code, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/)
        assert.match(builtFileAsyncModule.code, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/)
        assert.match(builtFileAsyncPicked.code, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/)
    })

    t.test("❌ FAILURE: tree shakes sync require destructuring", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE DESTRUCTURING/)
        })
    })

    t.test("❌ FAILURE: tree shakes sync require module", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE MODULE/)
        })
    })

    t.test("❌ FAILURE: tree shakes sync require chaining", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE CHAINING/)
        })
    })

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/);
    });

    t.test("tree shakes async modules top level awaited", () => {
        assert.doesNotMatch(builtFileAsyncAwait.code, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/);
    });

    t.test("❌ FAILURE: tree shakes async modules import() whole module", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtFileAsyncModule.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/)
        })
    });

    t.test("tree shakes async modules import() + picked", () => {
        assert.doesNotMatch(builtFileAsyncPicked.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/);
    });
});
