const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const STEPS = [
    { script: 'scrape-urls.js',         label: 'Scrape IBGE for new URLs' },
    { script: 'download.js',            label: 'Download files from IBGE' },
    { script: 'extract.js',             label: 'Extract classes (CNAE 2.0)' },
    { script: 'extract-subclasses.js',  label: 'Extract subclasses (CNAE 2.3)' },
    { script: 'check.js',               label: 'Validate extraction' }
];

function run(script, label, index) {
    const step = `Step ${index + 1}/${STEPS.length}`;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔄 ${step}: ${label}`);
    console.log('='.repeat(50) + '\n');

    try {
        execSync(`node ${path.join('scripts', script)}`, {
            cwd: ROOT,
            stdio: 'inherit'
        });
        return true;
    } catch (err) {
        // scrape exits 1 when new URLs found — that's a warning, not a failure
        if (script === 'scrape-urls.js') {
            console.log('\n⚠️  New URLs detected (non-blocking). Continuing...');
            return true;
        }
        console.error(`\n❌ ${step} failed!`);
        return false;
    }
}

function main() {
    console.log('🚀 CNAE Full Pipeline\n');
    console.log(`   Started: ${new Date().toISOString()}`);
    console.log(`   Steps:   ${STEPS.length}\n`);

    for (let i = 0; i < STEPS.length; i++) {
        const { script, label } = STEPS[i];
        const ok = run(script, label, i);

        if (!ok) {
            console.error(`\n❌ Pipeline aborted at step ${i + 1}.`);
            process.exit(1);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('✅ CNAE pipeline complete!');
    console.log(`   Finished: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
}

main();
