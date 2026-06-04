const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HASHES_FILE = path.join(DATA_DIR, '.hashes.json');

const FILES = [
    {
        name: 'CNAE 2.0 Classes',
        url: 'https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_EstruturaDetalhada.xls',
        output: 'CNAE20_EstruturaDetalhada.xls'
    },
    {
        name: 'CNAE 2.3 Subclasses',
        url: 'https://cnae.ibge.gov.br/images/concla/documentacao/CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx',
        output: 'CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx'
    }
];

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const client = url.startsWith('https') ? https : http;

        client.get(url, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlinkSync(dest);
                return resolve(downloadFile(response.headers.location, dest));
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(err);
        });
    });
}

function calculateHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

function loadHashes() {
    if (fs.existsSync(HASHES_FILE)) {
        return JSON.parse(fs.readFileSync(HASHES_FILE, 'utf8'));
    }
    return {};
}

function saveHashes(hashes) {
    fs.writeFileSync(HASHES_FILE, JSON.stringify(hashes, null, 2), 'utf8');
}

async function main() {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    const hashes = loadHashes();
    const changes = [];

    console.log('📥 Downloading CNAE files from IBGE...\n');

    for (const file of FILES) {
        const dest = path.join(DATA_DIR, file.output);

        try {
            console.log(`  ⬇️  ${file.name}`);
            console.log(`     ${file.url}`);

            await downloadFile(file.url, dest);

            const newHash = calculateHash(dest);
            const oldHash = hashes[file.output];

            if (oldHash === newHash) {
                console.log(`     ✅ No changes (hash unchanged)\n`);
            } else {
                console.log(`     🆕 File changed!`);
                console.log(`        Old: ${oldHash || '(none)'}`);
                console.log(`        New: ${newHash}\n`);
                changes.push(file.name);
            }

            hashes[file.output] = newHash;
        } catch (err) {
            console.error(`     ❌ Failed: ${err.message}\n`);
        }
    }

    hashes._lastUpdated = new Date().toISOString();
    saveHashes(hashes);

    console.log('=== SUMMARY ===\n');

    if (changes.length === 0) {
        console.log('✅ No changes detected. Data is up to date.');
    } else {
        console.log(`🆕 ${changes.length} file(s) changed:`);
        changes.forEach(name => console.log(`   - ${name}`));
        console.log('\nRun "npm run extract" to reprocess.');
    }
}

main().catch(err => {
    console.error('❌ Download failed:', err.message);
    process.exit(1);
});
