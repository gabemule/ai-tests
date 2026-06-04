const https = require('https');

const DOWNLOAD_PAGE = 'https://cnae.ibge.gov.br/classificacoes/download-concla.html';
const BASE_URL = 'https://cnae.ibge.gov.br';

// All URLs currently known on the IBGE download page.
// When `npm run scrape` reports something as "🆕 NEW", it means
// IBGE added a file that didn't exist before — worth investigating.
const KNOWN_URLS = [
    // CNAE 2.0 Classes
    '/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_EstruturaDetalhada.xls',
    '/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Correspondencias.xls',

    // CNAE 2.3 Subclasses
    '/images/concla/documentacao/CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx',
    '/images/concla/documentacao/CNAE_Subclasses_2_3_Tabelas_de_correspondência.xlsx',

    // CNAE 2.2 Subclasses
    '/images/concla/downloads/Subclasses CNAE 2.2 - Estrutura.xls',
    '/images/concla/downloads/corresp-cnae-sub-2-2x2-1--2-1x2-2-preferenciais.xls',

    // CNAE 2.1 Subclasses
    '/images/concla/downloads/revisao2007/prop_cnae21/cnae21_estrutura_detalhada.xls',
    '/images/concla/downloads/revisao2007/prop_cnae21/cnae21_correspondencias.xls',

    // CNAE 2.0 Subclasses
    '/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Subclasses_EstruturaDetalhada.xls',
    '/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Subclasses_Correspondencias.xls',

    // CNAE 1.0
    '/images/concla/downloads/CNAE1.0.xls',

    // CNAE-Fiscal 1.1
    '/images/concla/downloads/CNAE-Fiscal 1.1.xls',

    // CNAE (original)
    '/images/concla/downloads/CNAE.xls',

    // CNAE-Domiciliar
    '/np_download/concla/CNAE_Domiciliar 2.0 (ABR 2010) - Estrutura.xlsx',
    '/images/concla/downloads/cnae_dom_codigos.xls',

    // PRODLIST-Industria
    '/images/concla/downloads/Prodlist-Industria 2025.xlsx',
    '/images/concla/downloads/3correspondenciaProdlist-indústria 2025.xlsx',
    '/images/concla/downloads/Prodlist_Industria_2022.xlsx',
    '/images/concla/downloads/prodlist_industria_2022 x 2019_DE PARA.xlsx',
    '/images/concla/downloads/Prodlist_Industria_2019.xlsx',
    '/images/concla/downloads/prodlist_industria_2019 x 2016_DE PARA.xlsx',
    '/images/concla/downloads/PRODLIST-Industria-2016.xls',
    '/images/concla/downloads/PROD2016X2013.xls',
    '/images/concla/downloads/PRODLIST- Indústria 2013.xls',
    '/images/concla/downloads/PROD2013X2010.xls',
    '/images/concla/downloads/PRODLISTIndustria2010.xls',
    '/images/concla/downloads/PROD2010x2007.xls',
    '/images/concla/downloads/PRODLISTIndustria2007.xls',
    '/images/concla/downloads/PROD2007x2006.xls',
    '/images/concla/downloads/PRODLISTIndustria2006.xls',
    '/images/concla/downloads/PROD2006x2005.xls',
    '/images/concla/downloads/PRODLISIndustria2005.xls',
    '/images/concla/downloads/PROD2005x2004.xls',

    // PRODLIST-Agro/Pesca
    '/images/concla/downloads/EstruturaProdlistAgroPesca2003.xls',
    '/images/concla/downloads/EstruturaProdlistAgroPesca2007.xls',
    '/images/concla/downloads/EstruturaProdlistAgroPesca2008.xls',
    '/images/concla/downloads/EstruturaProdlistAgroPesca2013.xls',
    '/images/concla/downloads/EstruturaProdlistAgroPesca2018.xls',
    '/images/concla/estrutura/EstruturaProdlistAgroPesca2021.xlsx',

    // Other
    '/images/concla/downloads/IPCAxCOICOP.xls'
];

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractLinks(html) {
    const linkRegex = /href="([^"]*\.(xls|xlsx)x?)"/gi;
    const links = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
        let url = match[1];
        if (url.startsWith('/')) {
            url = BASE_URL + url;
        }
        links.push(url);
    }

    return [...new Set(links)];
}

function isKnown(url) {
    return KNOWN_URLS.some(known => {
        const encodedKnown = known.replace(/ /g, '%20');
        return url.includes(known) || url.includes(encodedKnown);
    });
}

async function main() {
    console.log(`🔍 Scraping download URLs from IBGE...\n`);
    console.log(`   Page: ${DOWNLOAD_PAGE}\n`);

    const html = await fetchPage(DOWNLOAD_PAGE);
    const allLinks = extractLinks(html);

    const knownLinks = allLinks.filter(isKnown);
    const newLinks = allLinks.filter(l => !isKnown(l));

    console.log(`=== KNOWN FILES (${knownLinks.length}) ===\n`);
    knownLinks.forEach(url => console.log(`  ✅ ${url}`));

    if (newLinks.length > 0) {
        console.log(`\n=== 🆕 NEW FILES (${newLinks.length}) ===\n`);
        newLinks.forEach(url => console.log(`  🆕 ${url}`));
    }

    console.log(`\n=== KNOWN URL HEALTH CHECK ===\n`);
    let missing = 0;
    for (const known of KNOWN_URLS) {
        const found = allLinks.some(l => {
            const encodedKnown = known.replace(/ /g, '%20');
            return l.includes(known) || l.includes(encodedKnown);
        });
        if (!found) {
            console.log(`  ❌ MISSING: ${known}`);
            missing++;
        }
    }
    if (missing === 0) {
        console.log(`  ✅ All ${KNOWN_URLS.length} known URLs still present.`);
    }

    console.log(`\n=== SUMMARY ===\n`);
    console.log(`  Total links found: ${allLinks.length}`);
    console.log(`  Known: ${knownLinks.length}`);
    console.log(`  New: ${newLinks.length}`);
    console.log(`  Missing known: ${missing}`);

    if (newLinks.length > 0) {
        console.log(`\n⚠️  New URLs detected! Review and add to KNOWN_URLS if needed.`);
        process.exitCode = 1; // Non-zero exit for CI/CD alerting
    }
}

main().catch(err => {
    console.error('❌ Scraping failed:', err.message);
    process.exit(2);
});
