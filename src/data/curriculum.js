import { hiragana, katakana } from './kana';
import { vocabulary } from './vocabulary';
import { kanji } from './kanji';
import { grammar } from './grammar';
import { sentences, dialogues } from './sentences';

// Each lesson introduces a small batch of items, then drills them.
// The curriculum defines the ORDER. The study session handles the FLOW.

function buildCurriculum() {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const allLessons = [];
  let lessonNum = 0;

  // === KANA PHASE (before N5 content) ===
  const hiraGroups = ['vowel', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'special'];
  const dakutenGroups = ['g', 'z', 'd', 'b', 'p'];

  // Hiragana basic groups
  for (let i = 0; i < hiraGroups.length; i += 2) {
    const groups = hiraGroups.slice(i, i + 2);
    const items = hiragana.filter(k => groups.includes(k.group));
    lessonNum++;
    allLessons.push({
      id: `L${lessonNum}`,
      number: lessonNum,
      title: `Hiragana : ${groups.map(g => g.toUpperCase()).join(' & ')}`,
      level: 'N5',
      phase: 'kana',
      items: items.map(k => ({ id: `hira-${k.romaji}`, type: 'kana', data: { ...k, kanaType: 'hiragana' } })),
      sentences: [],
      dialogue: null,
    });
  }

  // Hiragana dakuten
  for (let i = 0; i < dakutenGroups.length; i += 3) {
    const groups = dakutenGroups.slice(i, i + 3);
    const items = hiragana.filter(k => groups.includes(k.group));
    lessonNum++;
    allLessons.push({
      id: `L${lessonNum}`,
      number: lessonNum,
      title: `Hiragana dakuten : ${groups.map(g => g.toUpperCase()).join(', ')}`,
      level: 'N5',
      phase: 'kana',
      items: items.map(k => ({ id: `hira-${k.romaji}`, type: 'kana', data: { ...k, kanaType: 'hiragana' } })),
      sentences: [],
      dialogue: null,
    });
  }

  // Katakana basic
  for (let i = 0; i < hiraGroups.length; i += 3) {
    const groups = hiraGroups.slice(i, i + 3);
    const items = katakana.filter(k => groups.includes(k.group));
    lessonNum++;
    allLessons.push({
      id: `L${lessonNum}`,
      number: lessonNum,
      title: `Katakana : ${groups.map(g => g.toUpperCase()).join(', ')}`,
      level: 'N5',
      phase: 'kana',
      items: items.map(k => ({ id: `kata-${k.romaji}`, type: 'kana', data: { ...k, kanaType: 'katakana' } })),
      sentences: [],
      dialogue: null,
    });
  }

  // Katakana dakuten
  {
    const items = katakana.filter(k => dakutenGroups.includes(k.group));
    lessonNum++;
    allLessons.push({
      id: `L${lessonNum}`,
      number: lessonNum,
      title: 'Katakana : dakuten & handakuten',
      level: 'N5',
      phase: 'kana',
      items: items.map(k => ({ id: `kata-${k.romaji}`, type: 'kana', data: { ...k, kanaType: 'katakana' } })),
      sentences: [],
      dialogue: null,
    });
  }

  // === JLPT LEVELS ===
  for (const level of levels) {
    const levelVocab = vocabulary.filter(v => v.level === level);
    const levelKanji = kanji.filter(k => k.level === level);
    const levelGrammar = grammar.filter(g => g.level === level);
    const levelSentences = sentences.filter(s => s.level === level);
    const levelDialogues = dialogues.filter(d => d.level === level);

    // Chunk vocab into groups of 5
    const vocabChunks = [];
    for (let i = 0; i < levelVocab.length; i += 5) {
      vocabChunks.push(levelVocab.slice(i, i + 5));
    }

    // Chunk kanji into groups of 5
    const kanjiChunks = [];
    for (let i = 0; i < levelKanji.length; i += 5) {
      kanjiChunks.push(levelKanji.slice(i, i + 5));
    }

    // Chunk grammar into groups of 3
    const grammarChunks = [];
    for (let i = 0; i < levelGrammar.length; i += 3) {
      grammarChunks.push(levelGrammar.slice(i, i + 3));
    }

    // Interleave: vocab lesson, kanji lesson, grammar lesson, repeat
    const maxChunks = Math.max(vocabChunks.length, kanjiChunks.length, grammarChunks.length);
    let sentenceIdx = 0;
    let dialogueIdx = 0;

    for (let i = 0; i < maxChunks; i++) {
      // Vocab lesson
      if (i < vocabChunks.length) {
        const chunk = vocabChunks[i];
        const lessonSentences = levelSentences.slice(sentenceIdx, sentenceIdx + 2);
        sentenceIdx = Math.min(sentenceIdx + 2, levelSentences.length);
        lessonNum++;
        allLessons.push({
          id: `L${lessonNum}`,
          number: lessonNum,
          title: `${level} Vocabulaire ${i + 1}`,
          level,
          phase: 'vocabulary',
          items: chunk.map(v => ({ id: `vocab-${v.word}`, type: 'vocabulary', data: v })),
          sentences: lessonSentences,
          dialogue: null,
        });
      }

      // Kanji lesson
      if (i < kanjiChunks.length) {
        const chunk = kanjiChunks[i];
        lessonNum++;
        allLessons.push({
          id: `L${lessonNum}`,
          number: lessonNum,
          title: `${level} Kanji ${i + 1}`,
          level,
          phase: 'kanji',
          items: chunk.map(k => ({ id: `kanji-${k.kanji}`, type: 'kanji', data: k })),
          sentences: [],
          dialogue: null,
        });
      }

      // Grammar lesson (with dialogue if available)
      if (i < grammarChunks.length) {
        const chunk = grammarChunks[i];
        const dialogue = dialogueIdx < levelDialogues.length ? levelDialogues[dialogueIdx] : null;
        if (dialogue) dialogueIdx++;
        lessonNum++;
        allLessons.push({
          id: `L${lessonNum}`,
          number: lessonNum,
          title: `${level} Grammaire ${i + 1}`,
          level,
          phase: 'grammar',
          items: chunk.map(g => ({ id: `grammar-${g.pattern}`, type: 'grammar', data: g })),
          sentences: levelSentences.slice(sentenceIdx, sentenceIdx + 1),
          dialogue,
        });
        sentenceIdx = Math.min(sentenceIdx + 1, levelSentences.length);
      }
    }
  }

  // === INSERT CHECKPOINTS every 4 lessons ===
  const CHECKPOINT_INTERVAL = 4;
  const withCheckpoints = [];
  let regularCount = 0;

  for (const lesson of allLessons) {
    withCheckpoints.push(lesson);
    regularCount++;

    if (regularCount % CHECKPOINT_INTERVAL === 0) {
      // Gather items from the last CHECKPOINT_INTERVAL lessons
      const recentLessons = withCheckpoints
        .filter(l => !l.isCheckpoint)
        .slice(-CHECKPOINT_INTERVAL);
      const allItems = recentLessons.flatMap(l => l.items);

      if (allItems.length >= 4) {
        lessonNum++;
        withCheckpoints.push({
          id: `L${lessonNum}`,
          number: lessonNum,
          title: `Checkpoint — Révision`,
          level: recentLessons[0].level,
          phase: 'checkpoint',
          isCheckpoint: true,
          items: allItems,
          sentences: [],
          dialogue: null,
        });
      }
    }
  }

  // Renumber all lessons
  withCheckpoints.forEach((l, i) => {
    l.number = i + 1;
    l.id = `L${i + 1}`;
  });

  return withCheckpoints;
}

export const curriculum = buildCurriculum();

export function getLessonsByLevel(level) {
  return curriculum.filter(l => l.level === level);
}

export function getLesson(lessonId) {
  return curriculum.find(l => l.id === lessonId);
}
