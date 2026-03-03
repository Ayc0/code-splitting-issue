import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { execSync } from "node:child_process";

test("builds and tree-shakes using bun", async (t) => {
    await using dir = await fs.mkdtempDisposable('bun');

    const outDir = path.join(process.cwd(), dir.path, 'dist');

    execSync(`bun build src/index.js --outdir ${outDir} --splitting --minify --target=browser`, {
        cwd: process.cwd(),
        stdio: 'pipe',
    });

    const files = await fs.readdir(outDir);
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    const getCode = (fileName) => fs.readFile(path.join(outDir, fileName), 'utf8');

    const indexFile = jsFiles.find((f) => f === 'index.js');
    const asyncAwaitFile = jsFiles.find((f) => f.includes('file-async-await'));
    const asyncModuleFile = jsFiles.find((f) => f.includes('file-async-module'));
    const asyncPickedFile = jsFiles.find((f) => f.includes('file-async-picked'));

    const builtIndexCode = await getCode(indexFile);
    const builtFileAsyncAwaitCode = await getCode(asyncAwaitFile);
    const builtFileAsyncModuleCode = await getCode(asyncModuleFile);
    const builtFileAsyncPickedCode = await getCode(asyncPickedFile);

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

    t.test("❌ FAILURE: tree shakes sync require chaining", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC REQUIRE CHAINING/)
        })
    })

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndexCode, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/)
    })

    t.test("❌ FAILURE: tree shakes async modules top level awaited", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtFileAsyncAwaitCode, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/)
        })
    })

    t.test("❌ FAILURE: tree shakes async modules import() whole module", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtFileAsyncModuleCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/)
        })
    })

    t.test("❌ FAILURE: tree shakes async modules import() + picked", () => {
        assert.throws(() => {
            assert.doesNotMatch(builtFileAsyncPickedCode, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/)
        })
    })
});
