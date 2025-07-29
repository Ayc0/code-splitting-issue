import test from "node:test";
import assert from "node:assert/strict";

import * as esbuild from 'esbuild';

test("builds and tree-shakes using esbuild", async (t) => {
    let result = await esbuild.build({
        entryPoints: ['src/index.js'],
        bundle: true,
        treeShaking: true,
        splitting: true,
        format: 'esm',
        outdir: '.',
        write: false,
    });

    const builtIndex = result.outputFiles.find((outputFile) => outputFile.path.includes('index'))
    const builtFileAsyncAwait = result.outputFiles.find((outputFile) => outputFile.path.includes('file-async-await'))
    const builtFileAsyncModule = result.outputFiles.find((outputFile) => outputFile.path.includes('file-async-module'))
    const builtFileAsyncPicked = result.outputFiles.find((outputFile) => outputFile.path.includes('file-async-picked'))

    t.test("properly bundles important variables", () => {
        assert.match(builtIndex.text, /TO KEEP IN BUNDLE SYNC REQUIRE DESTRUCTURING/)
        assert.match(builtIndex.text, /TO KEEP IN BUNDLE SYNC REQUIRE MODULE/)
        assert.match(builtIndex.text, /TO KEEP IN BUNDLE SYNC REQUIRE CHAINING/)

        assert.match(builtIndex.text, /TO KEEP IN BUNDLE SYNC IMPORT/)
        assert.match(builtFileAsyncAwait.text, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/)
        assert.match(builtFileAsyncModule.text, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/)
        assert.match(builtFileAsyncPicked.text, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/)
    })

    t.test("❌ FAILURE: tree shakes sync require destructuring", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndex.text, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE DESTRUCTURING/)
        })
    })

    t.test("❌ FAILURE: tree shakes sync require module", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndex.text, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE MODULE/)
        })
    })

    t.test("❌ FAILURE: tree shakes sync require chaining", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndex.text, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE CHAINING/)
        })
    })

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndex.text, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/)
    })

    t.test("❌ FAILURE: tree shakes async modules top level awaited", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtFileAsyncAwait.text, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/)
        })
    })

    t.test("❌ FAILURE: tree shakes async modules import() whole module", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtFileAsyncModule.text, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/)
        })
    })

    t.test("❌ FAILURE: tree shakes async modules import() + picked", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtFileAsyncPicked.text, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/)
        })
    })

});
