// @ts-check

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import packageJSON from './package.json' with { type: "json" };

/**
 * @typedef {{name: string, package: string, version: string, longDisplayName: string, shortDisplayName: string}} Bundler
 */

// Configuration
const NUM_RUNS = 25;

/**
 * @type {Bundler[]}
 */
const BUNDLERS = [
    { name: 'esbuild', package: 'esbuild' },
    { name: 'parcel', package: '@parcel/core' },
    { name: 'rollup', package: 'rollup' },
    { name:  'rspack', package: '@rspack/core' },
    { name: 'vite', package: 'vite' },
    { name: 'rolldown', package: 'rolldown' },
    { name: 'rsbuild', package: '@rsbuild/core' },
].map(bundler => {
    const version = packageJSON.devDependencies[bundler.package];
    return {
        name: bundler.name,
        package: bundler.package,
        version,
        shortDisplayName: `${bundler.package}@${version}`,
        longDisplayName: `${bundler.name} (${bundler.package}@${version})`,
    };
});

/**
 * @typedef {Record<string, number | null>} Result
 */

/**
 * Storage for all timing results
 * @type {Result[]}
 */
const results = [];

/**
 * Extract timing from test output for a specific bundler
 * @param {string} output - The test output
 * @param {Bundler} bundler - The bundler name
 * @returns {number|null} - The timing in milliseconds or null if not found
 */
function extractTiming(output, bundler) {
    // Pattern: ✔ builds and tree-shakes using [bundler] ([time]ms)
    const pattern = new RegExp(`✔ builds and tree-shakes using ${bundler.name}.*\\(([0-9.]+)ms\\)`, 'i');
    const match = output.match(pattern);

    if (match && match[1]) {
        return parseFloat(match[1]);
    }

    return null;
}

/**
 * Run pnpm test and extract timing data
 * @param {number} runNumber - The current run number
 * @returns {Result} - Object with bundler timings
 */
function runTest(runNumber) {
    console.log(`Running test ${runNumber}/${NUM_RUNS}...`);

    try {
        // Run pnpm test and capture output
        const output = execSync('pnpm test', {
            encoding: 'utf8',
            stdio: 'pipe',
            cwd: process.cwd()
        });

        /** @type {Result} */
        const runResults = {};

        for (const bundler of BUNDLERS) {
            const timing = extractTiming(output, bundler);
            runResults[bundler.name] = timing;

            if (timing === null) {
                console.warn(`⚠️  Could not extract timing for ${bundler.name} in run ${runNumber}`);
            }
        }

        return runResults;
    } catch (error) {
        console.error(`❌ Error running test ${runNumber}:`, error.message);

        // Return null values for this run

        /** @type {Result} */
        const runResults = {};
        for (const bundler of BUNDLERS) {
            runResults[bundler.name] = null;
        }
        return runResults;
    }
}

/**
 * Generate CSV content from results
 * @param {Array} results - Array of result objects
 * @returns {string} - CSV content
 */
function generateCSV(results) {
    if (results.length === 0) {
        return '';
    }

    // Create header
    let csv = [...BUNDLERS.map(bundler => bundler.shortDisplayName)].join(',') + '\n';

    // Add data rows
    for (const result of results) {
        const row = BUNDLERS.map(bundler => {
            const value = result[bundler.name];
            return value !== null && value !== undefined ? value : '';
        });
        csv += row.join(',') + '\n';
    }

    return csv;
}

/**
 * Calculate and display summary statistics
 * @param {Result[]} results - Array of result objects
 */
function displaySummary(results) {
    console.log('\n📊 Summary Statistics:');
    console.log('='.repeat(50));

    for (const bundler of BUNDLERS) {
        const timings = results
            .map(r => r[bundler.name])
            .filter(t => t !== null && t !== undefined);

        if (timings.length === 0) {
            console.log(`${bundler.name}: No valid timings`);
            continue;
        }

        const sum = timings.reduce((a, b) => a + b, 0);
        const avg = sum / timings.length;
        const min = Math.min(...timings);
        const max = Math.max(...timings);
        const sorted = [...timings].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        const stddev = Math.sqrt(
            timings.reduce((cumDev, t) => cumDev + Math.pow(t - avg, 2), 0) / timings.length
        );

        console.log(`${bundler.longDisplayName}:`);
        console.log(`  Average: ${avg.toFixed(2)}ms`);
        console.log(`  Median:  ${median.toFixed(2)}ms`);
        console.log(`  Stddev:  ${stddev.toFixed(2)}ms`);
        console.log(`  Min:     ${min.toFixed(2)}ms`);
        console.log(`  Max:     ${max.toFixed(2)}ms`);
        console.log('');
    }
}

/**
 * Main function to run the benchmark
 */
async function main() {
    console.log('🚀 Starting bundler performance benchmark...');
    console.log(`📊 Running ${NUM_RUNS} iterations for bundlers: ${BUNDLERS.map(bundler => bundler.name).join(', ')}`);
    console.log('');

    // Run 1 batch of tests just to warm up the Node engine (the 1st run is always slower)
    runTest(0)

    const startTime = Date.now();

    // Run tests multiple times
    for (let i = 1; i <= NUM_RUNS; i++) {
        const result = runTest(i);
        results.push(result);

        // Show progress
        const progress = (i / NUM_RUNS * 100).toFixed(1);
        console.log(`✅ Completed run ${i}/${NUM_RUNS} (${progress}%)`);
    }

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`\n🎉 Benchmark completed in ${totalTime.toFixed(2)} seconds`);

    // Generate CSV
    const csvContent = generateCSV(results);
    const csvFilename = `benchmarks/results-${new Date().toISOString()}.csv`;

    try {
        fs.writeFileSync(csvFilename, csvContent);
        console.log(`📄 Results saved to: ${csvFilename}`);
    } catch (error) {
        console.error('❌ Error saving CSV file:', error.message);
    }

    // Display summary
    displaySummary(results);
}

// Run the benchmark
await main()
