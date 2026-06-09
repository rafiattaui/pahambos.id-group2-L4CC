/**
 * submit_quiz.js
 * Reads quiz data from a .txt file and submits it to the API.
 *
 * Usage:
 *   node submit_quiz.js [path/to/quiz.txt]
 *
 * Requires:
 *   npm install node-fetch   (if Node < 18)
 */

import fs from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:3000/api/quiz'; // adjust to your route
const COOKIE =
  'SRkV5um8m0QJPBbIhjwkVzkjjDvGxD8Q.zSY4CVCqur2Fs0ifmql3pGjoPUBW%2Fk%2FXb%2BS4W%2Bl0O4Y%3D'; // paste your auth cookie value
const FILE = process.argv[2] ?? 'quiz.txt';
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expected quiz.txt format:
 *
 * [quiz]
 * title=My Quiz Title
 * description=Optional description
 * category=SCIENCE
 *
 * [question]
 * question=What is 2 + 2?
 * type=SINGLE
 * answers=3|4|5|6
 * correctAnswers=1
 *
 * [question]
 * question=Which are primary colors?
 * type=MULTIPLE
 * answers=Red|Green|Blue|Yellow
 * correctAnswers=0|2|3
 *
 * Notes:
 *  - answers and correctAnswers are pipe-separated
 *  - correctAnswers are zero-based indexes into the answers array
 *  - type is typically SINGLE or MULTIPLE
 *  - imageFile is not supported in this script (no binary upload from .txt)
 */
function parseTxt(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  let quiz = null;
  const questions = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    if (line === '[quiz]') {
      quiz = {};
      current = quiz;
      continue;
    }

    if (line === '[question]') {
      current = {};
      questions.push(current);
      continue;
    }

    const eq = line.indexOf('=');
    if (eq === -1 || !current) continue;

    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    current[key] = val;
  }

  if (!quiz) throw new Error('No [quiz] section found in file.');

  return { quiz, questions };
}

function buildFormData({ quiz, questions }) {
  const fd = new FormData();

  fd.append('quiz.title', quiz.title ?? '');
  fd.append('quiz.description', quiz.description ?? '');
  fd.append('quiz.category', quiz.category ?? '');

  questions.forEach((q, i) => {
    const answers = (q.answers ?? '').split('|').map((s) => s.trim());
    const correctIndexes = (q.correctAnswers ?? '0')
      .split('|')
      .map((s) => s.trim());

    fd.append(`questions[${i}].question`, q.question ?? '');
    fd.append(`questions[${i}].type`, q.type ?? 'SINGLE');
    fd.append(`questions[${i}].order`, String(i));

    answers.forEach((a, j) => {
      fd.append(`questions[${i}].answers[${j}]`, a);
    });

    correctIndexes.forEach((c, j) => {
      fd.append(`questions[${i}].correctAnswers[${j}]`, c);
    });
  });

  return fd;
}

async function submit(fd) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Origin: new URL(API_URL).origin,
      Cookie: `better-auth.session_token=${COOKIE}`,
    },
    body: fd,
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('❌ Server error:', res.status);
    if (json?.details?.fieldErrors) {
      for (const [field, errors] of Object.entries(json.details.fieldErrors)) {
        console.error(`  [${field}]`, JSON.stringify(errors, null, 2));
      }
    } else {
      console.error(JSON.stringify(json, null, 2));
    }
    process.exit(1);
  }

  console.log('✅ Quiz created! ID:', json.quizId);
}

// ── Main ──────────────────────────────────────────────────────────────────────
try {
  console.log(`📄 Reading ${FILE}...`);
  const parsed = parseTxt(FILE);
  console.log(
    `   Quiz: "${parsed.quiz.title}" | ${parsed.questions.length} question(s)`
  );

  const fd = buildFormData(parsed);
  console.log('📦 FormData entries:');
  for (const [k, v] of fd.entries()) console.log(`   ${k} = ${v}`);
  console.log('🚀 Submitting...');
  await submit(fd);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
