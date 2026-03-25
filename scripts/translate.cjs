#!/usr/bin/env node
/**
 * Batch translate vocabulary meanings from English to French.
 *
 * Usage: node scripts/translate.cjs
 *
 * Requires network access to Google Translate.
 * Run this from a machine with internet access, then commit the result.
 *
 * The script:
 * 1. Reads src/data/vocabulary.js
 * 2. Translates all English meanings to French in batches
 * 3. Writes the updated file back
 * 4. Also translates kanji meanings in src/data/kanji.js
 */

const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 50; // Translate 50 meanings at once
const DELAY_MS = 1000; // Delay between batches to avoid rate limiting

async function translateBatch(texts, fromLang = 'en', toLang = 'fr') {
  const { translate } = require('@vitalets/google-translate-api');

  const results = [];
  for (const text of texts) {
    try {
      const res = await translate(text, { from: fromLang, to: toLang });
      results.push(res.text);
    } catch (e) {
      console.warn(`Failed to translate "${text}": ${e.message}`);
      results.push(text); // Keep English as fallback
    }
  }
  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // === Translate vocabulary ===
  const vocabPath = path.join(__dirname, '..', 'src', 'data', 'vocabulary.js');
  const vocabContent = fs.readFileSync(vocabPath, 'utf-8');

  // Extract the JSON array from the JS file
  const vocabMatch = vocabContent.match(/export const vocabulary = (\[[\s\S]*?\]);/);
  if (!vocabMatch) {
    console.error('Could not parse vocabulary.js');
    return;
  }

  const vocab = JSON.parse(vocabMatch[1]);
  console.log(`Translating ${vocab.length} vocabulary entries...`);

  // Batch translate
  for (let i = 0; i < vocab.length; i += BATCH_SIZE) {
    const batch = vocab.slice(i, i + BATCH_SIZE);
    const meanings = batch.map(v => v.meaning);

    console.log(`  Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(vocab.length/BATCH_SIZE)} (${i}-${i+batch.length})...`);

    const translated = await translateBatch(meanings);
    batch.forEach((v, j) => {
      v.meaning = translated[j];
    });

    if (i + BATCH_SIZE < vocab.length) {
      await sleep(DELAY_MS);
    }
  }

  // Write back
  const newVocabContent = vocabContent.replace(
    /export const vocabulary = \[[\s\S]*?\];/,
    `export const vocabulary = ${JSON.stringify(vocab, null, 2)};`
  );
  fs.writeFileSync(vocabPath, newVocabContent);
  console.log(`Wrote translated vocabulary.js`);

  // === Translate kanji meanings ===
  const kanjiPath = path.join(__dirname, '..', 'src', 'data', 'kanji.js');
  const kanjiContent = fs.readFileSync(kanjiPath, 'utf-8');

  const kanjiMatch = kanjiContent.match(/export const kanji = (\[[\s\S]*?\]);/);
  if (!kanjiMatch) {
    console.error('Could not parse kanji.js');
    return;
  }

  const kanjiData = JSON.parse(kanjiMatch[1]);
  console.log(`\nTranslating ${kanjiData.length} kanji meanings...`);

  for (let i = 0; i < kanjiData.length; i += BATCH_SIZE) {
    const batch = kanjiData.slice(i, i + BATCH_SIZE);
    const meanings = batch.map(k => k.meaning);

    console.log(`  Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(kanjiData.length/BATCH_SIZE)} (${i}-${i+batch.length})...`);

    const translated = await translateBatch(meanings);
    batch.forEach((k, j) => {
      k.meaning = translated[j];
    });

    if (i + BATCH_SIZE < kanjiData.length) {
      await sleep(DELAY_MS);
    }
  }

  const newKanjiContent = kanjiContent.replace(
    /export const kanji = \[[\s\S]*?\];/,
    `export const kanji = ${JSON.stringify(kanjiData, null, 2)};`
  );
  fs.writeFileSync(kanjiPath, newKanjiContent);
  console.log(`Wrote translated kanji.js`);

  console.log('\nDone! Commit the changes.');
}

main().catch(console.error);
