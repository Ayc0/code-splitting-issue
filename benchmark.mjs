// @ts-check

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import packageJSON from './package.json' with { type: "json" };

/**
 * @typedef {{ name: string, package: string, version: string, longDisplayName: string, shortDisplayName: string }} Bundler
 */


/**
 * @typedef {{ avg: number, median: number, stddev: number, min: number, max: number }} Metric
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
 * @param {Result[]} results - Array of result objects
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
 * Calculate summary statistics
 * @param {Result[]} results - Array of result objects
 * @returns {Array<{ bundler: Bundler, metric: Metric }>}
 */
function computeStatistics(results) {
    /**
     * @type {Array<{ bundler: Bundler, metric: Metric }>}
     */
    const statistics = [];

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

        statistics.push({ bundler, metric: { avg, median, stddev, min, max }});
    }

    return statistics
}

/**
 * Compute summary to display statistics
 * @param {Result[]} results - Array of result objects
 */
function computeSummary(results) {
    /**
     * @type {string[]}
     */
    const output = []
    output.push(`\n📊 Summary Statistics on ${os.cpus().length} CPUs ${os.cpus()[0].model}:`);
    output.push('='.repeat(50));

    const statistics = computeStatistics(results);

    for (const statistic of statistics) {
        output.push(`${statistic.bundler.longDisplayName}:`);
        output.push(`  Average: ${statistic.metric.avg.toPrecision(3)}ms`);
        output.push(`  Median:  ${statistic.metric.median.toPrecision(3)}ms`);
        output.push(`  Stddev:  ${statistic.metric.stddev.toPrecision(3)}ms`);
        output.push(`  Min:     ${statistic.metric.min.toPrecision(3)}ms`);
        output.push(`  Max:     ${statistic.metric.max.toPrecision(3)}ms`);
        output.push('');
    }

    return output.join('\n')
}

/**
 * Update README's content automatically
 * @param {Result[]} results - Array of result objects
 * @param {string} scriptLogs
 */
function modifyReadme(results, scriptLogs) {
    const readme = fs.readFileSync(path.resolve('./README.md'), 'utf-8')

    const statistics = computeStatistics(results);

    const tableLine = '| Compilation time (avg on 25 runs) | ' + statistics.map(statistic => `${statistic.metric.avg.toPrecision(3)}ms<br>(±${statistic.metric.stddev.toPrecision(3)}ms)`).join(' | ') + ' <tr></tr>  |'

    const newReadme = readme
        .replace(/^\| Compilation time.*\|$/m, tableLine)
        .replace(/```benchmark.*```/s, `\`\`\`benchmark\n${scriptLogs}\n\`\`\``)

    fs.writeFileSync(path.resolve('./README.md'), newReadme)
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

    console.log('');

    /**
     * @type {string[]}
     */
    const logs = [];

    logs.push(`🎉 Benchmark completed in ${totalTime.toFixed(2)} seconds`);

    // Generate CSV
    const csvContent = generateCSV(results);
    const csvFilename = `benchmarks/results-${new Date().toISOString()}.csv`;

    try {
        fs.writeFileSync(csvFilename, csvContent);
        logs.push(`📄 Results saved to: ${csvFilename}`);
    } catch (error) {
        console.error('❌ Error saving CSV file:', error.message);
    }

    // Display summary
    logs.push(computeSummary(results));

    const builtLogs = logs.join('\n');

    console.log(builtLogs);

    // Update README's table
    modifyReadme(results, builtLogs);
}

// Run the benchmark
await main()
