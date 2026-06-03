const fs = require('fs');

const result = JSON.parse(
    fs.readFileSync('./cnae.json', 'utf8')
);

const seen = new Set();
const duplicates = [];

const secoes = new Set();
const divisoes = new Set();
const grupos = new Set();
const classes = new Set();

const invalids = [];

for (const item of result) {
    const code = item.codigo;

    // valida duplicados
    if (seen.has(code)) {
        duplicates.push(item);
    }

    seen.add(code);

    // contadores hierárquicos
    if (item.secao_codigo) {
        secoes.add(item.secao_codigo);
    }

    if (item.divisao_codigo) {
        divisoes.add(item.divisao_codigo);
    }

    if (item.grupo_codigo) {
        grupos.add(item.grupo_codigo);
    }

    if (item.classe_codigo) {
        classes.add(item.classe_codigo);
    }

    // valida formato CNAE
    const validCode = /^\d{2}\.\d{2}-\d$/.test(code);

    if (!validCode) {
        invalids.push(item);
    }
}

console.log('\n=== EXTRACTION CHECK ===\n');

console.log({
    secoes: secoes.size,
    divisoes: divisoes.size,
    grupos: grupos.size,
    classes: classes.size,
    total: result.length
});

console.log('\n=== DUPLICADOS ===\n');

console.log('Qtd duplicados:', duplicates.length);

if (duplicates.length > 0) {
    console.log(JSON.stringify(duplicates, null, 2));
}

console.log('\n=== CÓDIGOS INVÁLIDOS ===\n');

console.log('Qtd inválidos:', invalids.length);

if (invalids.length > 0) {
    console.log(JSON.stringify(invalids, null, 2));
}

console.log('\n=== STATUS ===\n');

const success =
    secoes.size === 21 &&
    divisoes.size === 87 &&
    grupos.size === 285 &&
    classes.size === 673 &&
    duplicates.length === 0 &&
    invalids.length === 0;

if (success) {
    console.log('✅ EXTRAÇÃO CNAE VÁLIDA');
} else {
    console.log('❌ EXTRAÇÃO COM PROBLEMAS');
}
