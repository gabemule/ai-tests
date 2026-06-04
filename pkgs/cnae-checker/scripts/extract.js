const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const SOURCE_FILE = path.join(DATA_DIR, 'CNAE20_EstruturaDetalhada.xls');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'cnae-classes.json');

if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file not found: ${SOURCE_FILE}`);
    console.error('Run "npm run download" first.');
    process.exit(1);
}

const workbook = XLSX.readFile(SOURCE_FILE);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: ''
});

const result = [];

let current = {
    secao: null,
    divisao: null,
    grupo: null
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
        'de',
        'da',
        'do',
        'das',
        'dos',
        'e',
        'em',
        'a',
        'o',
        'as',
        'os',
        'para',
        'com',
        'por',
        'na',
        'no',
        'nas',
        'nos'
    ]);

    return [
        ...new Set(
            texts
                .join(' ')
                .split(/\s+/)
                .map(t => normalize(t))
                .filter(t => t.length > 2)
                .filter(t => !stopwords.has(t))
        )
    ];
}

for (const row of rows) {
    const [
        secao,
        divisao,
        grupo,
        classe,
        denominacao
    ] = row.map(v => String(v || '').trim());

    // ignora lixo/header
    if (
        !denominacao ||
        denominacao.includes('Estrutura detalhada') ||
        denominacao.includes('(continuação)') ||
        denominacao === 'Denominação'
    ) {
        continue;
    }

    // seção
    if (secao) {
        current.secao = {
            codigo: secao,
            descricao: denominacao
        };
    }

    // divisão
    if (divisao) {
        current.divisao = {
            codigo: divisao,
            descricao: denominacao
        };
    }

    // grupo
    if (grupo) {
        current.grupo = {
            codigo: grupo,
            descricao: denominacao
        };
    }

    // somente classes viram registro final
    if (classe) {
        const hierarchy = [
            current.secao?.descricao,
            current.divisao?.descricao,
            current.grupo?.descricao,
            denominacao
        ].filter(Boolean);

        const textoEmbedding = `
${denominacao}.
${current.grupo?.descricao || ''}.
${current.divisao?.descricao || ''}.
${current.secao?.descricao || ''}.
CNAE ${classe}
`
            .replace(/\s+/g, ' ')
            .trim();

        const tokens = buildTokens(
            denominacao,
            current.grupo?.descricao,
            current.divisao?.descricao,
            current.secao?.descricao
        );

        result.push({
            codigo: classe,
            titulo: denominacao,

            secao_codigo: current.secao?.codigo || null,
            secao_descricao: current.secao?.descricao || null,

            divisao_codigo: current.divisao?.codigo || null,
            divisao_descricao: current.divisao?.descricao || null,

            grupo_codigo: current.grupo?.codigo || null,
            grupo_descricao: current.grupo?.descricao || null,

            classe_codigo: classe,
            classe_descricao: denominacao,

            hierarchy,

            texto_embedding: textoEmbedding,

            tokens,

            raw_hierarchy: {
                secao: current.secao,
                divisao: current.divisao,
                grupo: current.grupo,
                classe: {
                    codigo: classe,
                    descricao: denominacao
                }
            }
        });
    }
}

// remove possíveis duplicados
const unique = Array.from(
    new Map(
        result.map(item => [item.codigo, item])
    ).values()
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(unique, null, 2),
    'utf8'
);

console.log(`✅ ${unique.length} registros extraídos → ${OUTPUT_FILE}`);
