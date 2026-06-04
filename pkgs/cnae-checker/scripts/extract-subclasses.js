const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const SOURCE_FILE = path.join(DATA_DIR, 'CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'cnae-subclasses.json');

if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file not found: ${SOURCE_FILE}`);
    console.error('Run "npm run download" first.');
    process.exit(1);
}

const workbook = XLSX.readFile(SOURCE_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// Columns: [Seção, Divisão, Grupo, Classe, Subclasse, Denominação, (empty)]

const result = [];

let current = {
    secao: null,
    divisao: null,
    grupo: null,
    classe: null
};

function normalize(text = '') {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function buildTokens(...texts) {
    const stopwords = new Set([
        'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o',
        'as', 'os', 'para', 'com', 'por', 'na', 'no', 'nas', 'nos'
    ]);

    return [
        ...new Set(
            texts
                .filter(Boolean)
                .join(' ')
                .split(/\s+/)
                .map(t => normalize(t))
                .filter(t => t.length > 2)
                .filter(t => !stopwords.has(t))
        )
    ];
}

// Skip header rows (0-3)
for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const [secao, divisao, grupo, classe, subclasse, denominacao] = row.map(v => String(v || '').trim());

    if (!denominacao) continue;

    // Seção
    if (secao) {
        current.secao = { codigo: secao, descricao: denominacao };
    }

    // Divisão
    if (divisao) {
        current.divisao = { codigo: divisao, descricao: denominacao };
    }

    // Grupo
    if (grupo) {
        current.grupo = { codigo: grupo, descricao: denominacao };
    }

    // Classe
    if (classe) {
        current.classe = { codigo: classe, descricao: denominacao };
    }

    // Subclasse — this is the final record
    if (subclasse) {
        const hierarchy = [
            current.secao?.descricao,
            current.divisao?.descricao,
            current.grupo?.descricao,
            current.classe?.descricao,
            denominacao
        ].filter(Boolean);

        const textoEmbedding = `
${denominacao}.
${current.classe?.descricao || ''}.
${current.grupo?.descricao || ''}.
${current.divisao?.descricao || ''}.
${current.secao?.descricao || ''}.
CNAE ${subclasse}
`
            .replace(/\s+/g, ' ')
            .trim();

        const tokens = buildTokens(
            denominacao,
            current.classe?.descricao,
            current.grupo?.descricao,
            current.divisao?.descricao,
            current.secao?.descricao
        );

        result.push({
            codigo: subclasse,
            titulo: denominacao,

            secao_codigo: current.secao?.codigo || null,
            secao_descricao: current.secao?.descricao || null,

            divisao_codigo: current.divisao?.codigo || null,
            divisao_descricao: current.divisao?.descricao || null,

            grupo_codigo: current.grupo?.codigo || null,
            grupo_descricao: current.grupo?.descricao || null,

            classe_codigo: current.classe?.codigo || null,
            classe_descricao: current.classe?.descricao || null,

            subclasse_codigo: subclasse,
            subclasse_descricao: denominacao,

            hierarchy,
            texto_embedding: textoEmbedding,
            tokens,

            raw_hierarchy: {
                secao: current.secao,
                divisao: current.divisao,
                grupo: current.grupo,
                classe: current.classe,
                subclasse: { codigo: subclasse, descricao: denominacao }
            }
        });
    }
}

// Remove duplicates
const unique = Array.from(
    new Map(result.map(item => [item.codigo, item])).values()
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2), 'utf8');

console.log(`✅ ${unique.length} subclasses extraídas → ${OUTPUT_FILE}`);
