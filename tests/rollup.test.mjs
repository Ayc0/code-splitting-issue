import test from "node:test";
import assert from "node:assert/strict";

import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs'


test("builds and tree-shakes using rollup", async (t) => {
    const bundle = await rollup({
        input: 'src/index.js',
        plugins: [
            commonjs({ transformMixedEsModules: true })
        ]
    });

    const result = await bundle.generate({})

    const builtIndex = result.output.find((output) => output.name === 'index');
    const builtFileAsyncAwait = result.output.find((output) => output.name === 'file-async-await');
    const builtFileAsyncModule = result.output.find((output) => output.name === 'file-async-module');
    const builtFileAsyncPicked = result.output.find((output) => output.name === 'file-async-picked');

    t.test("properly bundles important variables", () => {
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC REQUIRE DESTRUCTURING/) // ✅ Passes
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC REQUIRE MODULE/) // ✅ Passes
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC REQUIRE CHAINING/) // ✅ Passes

        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC IMPORT/) // ✅ Passes
        assert.match(builtFileAsyncAwait.code, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/) // ✅ Passes
        assert.match(builtFileAsyncModule.code, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/) // ✅ Passes
        assert.match(builtFileAsyncPicked.code, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/) // ✅ Passes
    })

    t.test("tree shakes sync require destructuring", () => {
        assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE DESTRUCTURING/) // ❌ Throws
    })

    t.test("tree shakes sync require module", () => {
        assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE MODULE/) // ❌ Throws
    })

    t.test("tree shakes sync require chaining", () => {
        assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE CHAINING/) // ❌ Throws
    })

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/); // ✅ Passes
    });

    t.test("tree shakes async modules top level awaited", () => {
        assert.doesNotMatch(builtFileAsyncAwait.code, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/); // ✅ Passes
    });

    t.test("tree shakes async modules import() whole module", () => {
        assert.doesNotMatch(builtFileAsyncModule.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/); // ✅ Passes
    });

    t.test("tree shakes async modules import() + picked", () => {
        assert.doesNotMatch(builtFileAsyncPicked.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/); // ✅ Passes
    });
});
