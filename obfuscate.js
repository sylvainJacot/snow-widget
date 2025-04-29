const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

// Lire le fichier JavaScript minifié
const code = fs.readFileSync('snow-min.js', 'utf8');

// Configuration de l'obfuscation
const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
    compact: true, // Minimise encore plus le code
    controlFlowFlattening: true, // Restructure les flux de contrôle
    controlFlowFlatteningThreshold: 0.75, // Intensité du flattening
    deadCodeInjection: true, // Ajoute du code mort pour compliquer l'analyse
    deadCodeInjectionThreshold: 0.4,
    identifierNamesGenerator: 'mangled', // Renomme les variables en noms courts et aléatoires
    stringArray: true, // Encode les chaînes de caractères
    stringArrayEncoding: ['base64'], // Encode les chaînes en base64
    stringArrayThreshold: 0.8,
    transformObjectKeys: true, // Obfusque les clés des objets
    rotateStringArray: true, // Rotation des tableaux de chaînes
    shuffleStringArray: true, // Mélange les tableaux de chaînes
    splitStrings: true, // Divise les chaînes en morceaux
    splitStringsChunkLength: 5,
    unicodeEscapeSequence: true, // Utilise des séquences d'échappement Unicode
    target: 'browser', // Optimisé pour les navigateurs
    ignoreImports: true // Ignore les imports pour éviter des erreurs
});

// Écrire le résultat obfusqué
fs.writeFileSync('snow-min.js', obfuscationResult.getObfuscatedCode(), 'utf8');
console.log('Obfuscation terminée ! Fichier généré : snow-min.js');