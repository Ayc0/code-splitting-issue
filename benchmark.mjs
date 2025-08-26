import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const NUM_RUNS = 25;
const BUNDLERS = ['esbuild', 'parcel', 'rolldown', 'rollup', 'rsbuild', 'rspack', 'vite'];

// Storage for all timing results
const results = [];

/**
 * Extract timing from test output for a specific bundler
 * @param {string} output - The test output
 * @param {string} bundler - The bundler name
 * @returns {number|null} - The timing in milliseconds or null if not found
 */
function extractTiming(output, bundler) {
    // Pattern: ✔ builds and tree-shakes using [bundler] ([time]ms)
    const pattern = new RegExp(`✔ builds and tree-shakes using ${bundler}.*\\(([0-9.]+)ms\\)`, 'i');
    const match = output.match(pattern);

    if (match && match[1]) {
        return parseFloat(match[1]);
    }

    return null;
}

/**
 * Run pnpm test and extract timing data
 * @param {number} runNumber - The current run number
 * @returns {Object} - Object with bundler timings
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

        const runResults = {};

        for (const bundler of BUNDLERS) {
            const timing = extractTiming(output, bundler);
            runResults[bundler] = timing;

            if (timing === null) {
                console.warn(`⚠️  Could not extract timing for ${bundler} in run ${runNumber}`);
            }
        }

        return runResults;
    } catch (error) {
        console.error(`❌ Error running test ${runNumber}:`, error.message);

        // Return null values for this run
        const runResults = {};
        for (const bundler of BUNDLERS) {
            runResults[bundler] = null;
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
    const headers = [...BUNDLERS];
    let csv = headers.join(',') + '\n';

    // Add data rows
    for (const result of results) {
        const row = headers.map(header => {
            const value = result[header];
            return value !== null && value !== undefined ? value : '';
        });
        csv += row.join(',') + '\n';
    }

    return csv;
}

/**
 * Calculate and display summary statistics
 * @param {Array} results - Array of result objects
 */
function displaySummary(results) {
    console.log('\n📊 Summary Statistics:');
    console.log('='.repeat(50));

    for (const bundler of BUNDLERS) {
        const timings = results
            .map(r => r[bundler])
            .filter(t => t !== null && t !== undefined);

        if (timings.length === 0) {
            console.log(`${bundler}: No valid timings`);
            continue;
        }

        const sum = timings.reduce((a, b) => a + b, 0);
        const avg = sum / timings.length;
        const min = Math.min(...timings);
        const max = Math.max(...timings);
        const sorted = timings.toSorted((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        const stddev = Math.sqrt(
            timings.reduce((cumDev, t) => cumDev + Math.pow(t - avg, 2), 0) / timings.length
        );

        console.log(`${bundler}:`);
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
    console.log(`📊 Running ${NUM_RUNS} iterations for bundlers: ${BUNDLERS.join(', ')}`);
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

    console.log(`\n📁 CSV file location: ${path.resolve(csvFilename)}`);
}

// Run the benchmark
await main()
