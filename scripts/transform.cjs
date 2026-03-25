const fs = require('fs');
const path = require('path');

// === Parse CSV ===
function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const entries = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());

    if (fields.length >= 3) {
      entries.push({
        expression: fields[0],
        reading: fields[1],
        meaning: fields[2],
        tags: fields[3] || '',
      });
    }
  }
  return entries;
}

// === Categorize by POS ===
function categorize(entry) {
  const m = entry.meaning.toLowerCase();
  const expr = entry.expression;

  if (m.startsWith('to ') || m.includes('; to ')) return 'verb';
  if (expr.endsWith('する')) return 'verb';

  const iAdjEndings = ['しい', 'かい', 'たい', 'ない', 'るい', 'さい', 'くい', 'どい', 'よい', 'いい'];
  if (expr.endsWith('い') && !expr.endsWith('きれい')) {
    for (const end of iAdjEndings) {
      if (expr.endsWith(end)) return 'adjective';
    }
  }
  if (m.includes('(na-adj)') || entry.tags.includes('na-adj')) return 'adjective';

  if (m.includes('(adv)') || entry.tags.includes('adv')) return 'adverb';
  if (m.includes('!') || m.includes('please') || m.includes('excuse') || m.includes('thank')) return 'expression';

  return 'noun';
}

// === JLPT level mapping for kanji-data (jlpt_new: 5=N5, 4=N4, etc.) ===
function jlptNewToLevel(n) {
  if (n === 5) return 'N5';
  if (n === 4) return 'N4';
  if (n === 3) return 'N3';
  if (n === 2) return 'N2';
  if (n === 1) return 'N1';
  return null;
}

// =============================================
// VOCABULARY
// =============================================
const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const allVocab = [];

for (const level of levels) {
  const n = level.replace('N', '');
  const filepath = path.join(__dirname, `n${n}.csv`);
  if (!fs.existsSync(filepath)) {
    console.warn(`Skipping ${level}: file not found`);
    continue;
  }

  const entries = parseCSV(filepath);
  const seen = new Set();

  for (const entry of entries) {
    if (!entry.expression || !entry.reading || !entry.meaning) continue;

    let word = entry.expression.split(';')[0].trim();
    if (seen.has(word)) continue;
    seen.add(word);

    allVocab.push({
      word,
      reading: entry.reading,
      meaning: entry.meaning,
      level,
      category: categorize(entry),
    });
  }

  console.log(`${level}: ${seen.size} unique words`);
}

const vocabJS = `// Auto-generated from JLPT word lists
// Source: github.com/elzup/jlpt-word-list
// ${allVocab.length} vocabulary entries across N5-N1
// Meanings are in English — run translate script to convert to French

export const vocabulary = ${JSON.stringify(allVocab, null, 2)};

export const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const categories = ['verb', 'noun', 'adjective', 'adverb', 'expression'];
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'vocabulary.js'), vocabJS);
console.log(`\nWrote vocabulary.js: ${allVocab.length} entries`);

// =============================================
// KANJI (merge JLPT levels from AnchorI + readings from davidluzgouveia)
// =============================================
const kanjiJlpt = JSON.parse(fs.readFileSync(path.join(__dirname, 'jlpt-kanji-raw.json'), 'utf-8'));
const kanjiReadings = JSON.parse(fs.readFileSync(path.join(__dirname, 'kanji-full.json'), 'utf-8'));

// Build JLPT level map from AnchorI data
const jlptMap = {};
kanjiJlpt.forEach(k => {
  if (k.jlpt && k.kanji) jlptMap[k.kanji] = k.jlpt;
});

// Build vocab examples: for each kanji, find vocab words that contain it
const kanjiExamples = {};
allVocab.forEach(v => {
  for (const ch of v.word) {
    if (jlptMap[ch]) {
      if (!kanjiExamples[ch]) kanjiExamples[ch] = [];
      if (kanjiExamples[ch].length < 3) {
        kanjiExamples[ch].push(`${v.word}（${v.reading}）`);
      }
    }
  }
});

const allKanji = [];
const seenKanji = new Set();

// Process from AnchorI list (has JLPT levels)
for (const entry of kanjiJlpt) {
  if (!entry.jlpt || !entry.kanji) continue;
  if (seenKanji.has(entry.kanji)) continue;
  seenKanji.add(entry.kanji);

  const readingData = kanjiReadings[entry.kanji];
  let on = [];
  let kun = [];
  let meanings = [];

  if (readingData) {
    on = (readingData.readings_on || []).filter(r => !r.startsWith('!')).slice(0, 4);
    kun = (readingData.readings_kun || []).filter(r => !r.startsWith('!')).slice(0, 4);
    meanings = readingData.meanings || [];
  }

  // Fallback meaning from description
  if (meanings.length === 0) {
    const desc = entry.description || '';
    const match = desc.match(/means?\s+(.+?)\./);
    if (match) meanings = [match[1]];
  }

  allKanji.push({
    kanji: entry.kanji,
    readings: { on, kun },
    meaning: meanings.join(', ') || entry.kanji,
    level: entry.jlpt,
    strokes: readingData?.strokes || entry.strokes || 0,
    examples: kanjiExamples[entry.kanji] || [],
  });
}

// Sort by level then frequency
const levelOrder = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
allKanji.sort((a, b) => (levelOrder[a.level] - levelOrder[b.level]));

const kanjiJS = `// Auto-generated from JLPT kanji data
// Sources: github.com/AnchorI/jlpt-kanji-dictionary (JLPT levels)
//          github.com/davidluzgouveia/kanji-data (readings, meanings)
// ${allKanji.length} kanji entries across N5-N1

export const kanji = ${JSON.stringify(allKanji, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'kanji.js'), kanjiJS);

// Print stats
console.log(`\nWrote kanji.js: ${allKanji.length} entries`);
const kanjiCounts = {};
allKanji.forEach(k => { kanjiCounts[k.level] = (kanjiCounts[k.level] || 0) + 1; });
console.log('Kanji per level:', kanjiCounts);
const withReadings = allKanji.filter(k => k.readings.on.length > 0 || k.readings.kun.length > 0).length;
console.log(`With readings: ${withReadings}/${allKanji.length}`);
const withExamples = allKanji.filter(k => k.examples.length > 0).length;
console.log(`With examples: ${withExamples}/${allKanji.length}`);
