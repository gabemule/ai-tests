const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const CLASSES_FILE = path.join(OUTPUT_DIR, 'cnae-classes.json');
const SUBCLASSES_FILE = path.join(OUTPUT_DIR, 'cnae-subclasses.json');

// --- Classes ---

if (!fs.existsSync(CLASSES_FILE)) {
    console.error(`❌ File not found: ${CLASSES_FILE}`);
    console.error('Run "npm run extract" first.');
    process.exit(1);
}

const classes = JSON.parse(fs.readFileSync(CLASSES_FILE, 'utf8'));

const classesSeen = new Set();
const classesDuplicates = [];
const classesSecoes = new Set();
const classesDivisoes = new Set();
const classesGrupos = new Set();
const classesClasses = new Set();
const classesInvalids = [];

for (const item of classes) {
    const code = item.codigo;

    if (classesSeen.has(code)) classesDuplicates.push(item);
    classesSeen.add(code);

    if (item.secao_codigo) classesSecoes.add(item.secao_codigo);
    if (item.divisao_codigo) classesDivisoes.add(item.divisao_codigo);
    if (item.grupo_codigo) classesGrupos.add(item.grupo_codigo);
    if (item.classe_codigo) classesClasses.add(item.classe_codigo);

    if (!/^\d{2}\.\d{2}-\d$/.test(code)) classesInvalids.push(item);
}

// --- Subclasses ---

let subclasses = [];
let subclassesSeen = new Set();
let subclassesDuplicates = [];
let subclassesInvalids = [];
let subclassesCount = 0;

if (fs.existsSync(SUBCLASSES_FILE)) {
    subclasses = JSON.parse(fs.readFileSync(SUBCLASSES_FILE, 'utf8'));
    subclassesCount = subclasses.length;

    for (const item of subclasses) {
        const code = item.codigo;

        if (subclassesSeen.has(code)) subclassesDuplicates.push(item);
        subclassesSeen.add(code);

        // Subclass format: 0111-3/01
        if (!/^\d{4}-\d\/\d{2}$/.test(code)) subclassesInvalids.push(item);
    }
}

// --- Report ---

console.log('\n=== CLASSES CHECK (CNAE 2.0) ===\n');

console.log({
    secoes: classesSecoes.size,
    divisoes: classesDivisoes.size,
    grupos: classesGrupos.size,
    classes: classesClasses.size,
    total: classes.length
});

console.log('Duplicados:', classesDuplicates.length);
console.log('Inválidos:', classesInvalids.length);

if (classesDuplicates.length > 0) {
    console.log(JSON.stringify(classesDuplicates, null, 2));
}
if (classesInvalids.length > 0) {
    console.log(JSON.stringify(classesInvalids, null, 2));
}

if (subclassesCount > 0) {
    console.log('\n=== SUBCLASSES CHECK (CNAE 2.3) ===\n');

    console.log({
        subclasses: subclassesCount,
        unique: subclassesSeen.size
    });

    console.log('Duplicados:', subclassesDuplicates.length);
    console.log('Inválidos:', subclassesInvalids.length);

    if (subclassesDuplicates.length > 0) {
        console.log(JSON.stringify(subclassesDuplicates, null, 2));
    }
    if (subclassesInvalids.length > 0) {
        console.log(JSON.stringify(subclassesInvalids, null, 2));
    }
}

// --- Final status ---

console.log('\n=== STATUS ===\n');

const classesOk =
    classesSecoes.size === 21 &&
    classesDivisoes.size === 87 &&
    classesGrupos.size === 285 &&
    classesClasses.size === 673 &&
    classesDuplicates.length === 0 &&
    classesInvalids.length === 0;

const subclassesOk =
    subclassesCount === 0 || (
        subclassesDuplicates.length === 0 &&
        subclassesInvalids.length === 0 &&
        subclassesCount > 1000
    );

if (classesOk) {
    console.log('✅ Classes: VÁLIDA');
} else {
    console.log('❌ Classes: COM PROBLEMAS');
}

if (subclassesCount > 0) {
    if (subclassesOk) {
        console.log('✅ Subclasses: VÁLIDA');
    } else {
        console.log('❌ Subclasses: COM PROBLEMAS');
    }
} else {
    console.log('⚠️  Subclasses: arquivo não encontrado (rode npm run extract:subclasses)');
}

if (!classesOk || !subclassesOk) {
    process.exit(1);
}
