import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import process from 'process';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const crypto = require('crypto');
const admin = require('firebase-admin');

function normalizeTitle(t) {
  return (t || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function titleHash(title) {
  return crypto.createHash('sha1').update(normalizeTitle(title)).digest('hex');
}

if (process.argv.length < 3) {
  process.stderr.write('Usage: node scripts/upsertBatch.js <serviceAccountKeyOrMapKey>\n');
  process.exit(1);
}

let sa;
try {
  const userInput = process.argv[2];

  // only allow a plain filename/key (no directory components) to prevent path traversal
  if (!userInput) {
    throw new Error('No service account filename or key provided');
  }
  if (userInput !== path.basename(userInput)) {
    throw new Error('Invalid service account file path: path separators are not allowed');
  }

  // Restrict service account files to a dedicated directory inside the repository root.
  // Create or place your service account JSONs in ./service_accounts/<filename>.json
  // Resolve repository root relative to this script file to avoid relying on process.cwd()
  const scriptPath = fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(path.dirname(scriptPath), '..');

  // Normalize repository root (avoid resolving symlinks on a path that could be influenced)
  const normalizedRepoRoot = path.normalize(repoRoot);

  // Construct the base directory using normalized join (no user input involved)
  const baseDirCandidate = path.normalize(path.join(normalizedRepoRoot, 'service_accounts'));

  // Canonicalize the base directory and ensure it's inside the repo root
  let baseDirReal;
  try {
    // Resolve the repository real path and ensure it's a directory
    const repoRootReal = fs.realpathSync(repoRoot);
    const repoRootStats = fs.lstatSync(repoRoot);
    if (!repoRootStats.isDirectory()) {
      throw new Error(`Repository root is not a directory: ${repoRoot}`);
    }

    // Ensure the service_accounts candidate exists and is not a symlink (prevent redirecting outside repo)
    if (!fs.existsSync(baseDirCandidate)) {
      throw new Error(`Service accounts directory does not exist: ${baseDirCandidate}`);
    }

    // Canonicalize the candidate relative to the repository real path to avoid any user-influenced traversal.
    // Use path.relative to compute a safe relative path from the repo root, then resolve that back against repoRootReal.
    const relativeToRepo = path.relative(repoRootReal, path.resolve(baseDirCandidate));
    const baseDirResolved = path.resolve(repoRootReal, relativeToRepo);

    // Normalize and re-resolve to eliminate any '..' or redundant separators, then verify containment.
    const safeBaseDir = path.normalize(path.resolve(repoRootReal, path.relative(repoRootReal, baseDirResolved)));

    // Ensure the resolved candidate stays inside the repository root
    if (!safeBaseDir.startsWith(repoRootReal + path.sep) && safeBaseDir !== repoRootReal) {
      throw new Error(`Service accounts directory resolves outside of repository root: ${baseDirCandidate}`);
    }

    // Canonicalize the safeBaseDir against the trusted repoRootReal to avoid inspecting
    // any user-influenced path components directly, then verify and inspect the canonical path.
    const safeBaseDirReal = fs.realpathSync(path.resolve(repoRootReal, path.relative(repoRootReal, safeBaseDir)));

    // Ensure the resolved canonical path is still contained within the repository root
    if (!safeBaseDirReal.startsWith(repoRootReal + path.sep) && safeBaseDirReal !== repoRootReal) {
      throw new Error(`Service accounts directory resolves outside of repository root: ${baseDirCandidate}`);
    }

    // Use lstatSync on the canonical path to verify it's a directory and not a symlink.
    const safeBaseDirStats = fs.lstatSync(safeBaseDirReal);
    if (!safeBaseDirStats.isDirectory()) {
      throw new Error(`Service accounts directory is not a directory: ${baseDirCandidate}`);
    }
    if (safeBaseDirStats.isSymbolicLink()) {
      throw new Error(`Service accounts directory must not be a symlink: ${baseDirCandidate}`);
    }

    // Now safely resolve the real path for the base directory and verify containment
    // Avoid calling realpathSync on a path that may contain user-influenced components;
    // instead resolve it relative to the trusted repoRootReal and validate containment.
    const relativeFromRepo = path.relative(repoRootReal, path.resolve(baseDirCandidate));
    const candidateResolved = path.resolve(repoRootReal, relativeFromRepo);
    let candidateNormalized = path.normalize(candidateResolved);

    // Use path.relative to verify containment within the trusted repoRootReal (prevents prefix-based bypasses)
    const relToRepo = path.relative(repoRootReal, candidateNormalized);
    if (relToRepo.startsWith('..') || path.isAbsolute(relToRepo)) {
      throw new Error(`Service accounts directory resolves outside of repository root: ${baseDirCandidate}`);
    }

    // Construct the final resolved path without following symlinks. We only resolve against the trusted repoRootReal
    // and the already-validated relative path to prevent any user-influenced traversal or symlink following.
    const candidateReal = path.resolve(repoRootReal, relToRepo);
    if (!candidateReal.startsWith(repoRootReal + path.sep) && candidateReal !== repoRootReal) {
      throw new Error(`Service accounts directory resolves outside of repository root: ${baseDirCandidate}`);
    }

    // Ensure the candidate exists and is not a symlink; do not follow symlinks from user-influenced paths.
    const candidateStats = fs.lstatSync(candidateReal);
    if (!candidateStats.isDirectory()) {
      throw new Error(`Service accounts directory is not a directory: ${baseDirCandidate}`);
    }
    if (candidateStats.isSymbolicLink()) {
      throw new Error(`Service accounts directory must not be a symlink: ${baseDirCandidate}`);
    }

    // Use the resolved real path as the trusted base directory path (it was resolved against the trusted repoRootReal).
    baseDirReal = candidateReal;

    if (!baseDirReal.startsWith(repoRootReal + path.sep) && baseDirReal !== repoRootReal) {
      throw new Error('Service accounts directory resolves outside of repository root');
    }
  } catch (e) {
    throw new Error(`Service accounts directory does not exist: ${baseDirCandidate}`);
  }

  // Require a mapping file to avoid using raw user input as a filename.
  // map.json should contain a JSON object mapping user keys to actual filenames,
  // e.g. { "prod": "my-prod-sa.json", "staging": "staging-sa.json" }
  const mapPath = path.normalize(path.join(baseDirReal, 'map.json'));

  // Ensure the map file exists and resolves inside the service_accounts directory
  let mapPathReal;
  try {
    // Resolve the map.json path against the trusted base directory without following symlinks
    const resolvedMapPath = path.resolve(baseDirReal, 'map.json');
    const normalizedMapPath = path.normalize(resolvedMapPath);

    // Verify containment: normalizedMapPath must be inside baseDirReal
    const relToBase = path.relative(baseDirReal, normalizedMapPath);
    if (relToBase.startsWith('..') || path.isAbsolute(relToBase)) {
      throw new Error(`Service accounts map file resolves outside of service accounts directory: ${mapPath}`);
    }

    // Use lstat on the normalized path to ensure it exists, is a file, and is not a symlink.
    // This avoids following any symlink before validation.
    const candidateStats = fs.lstatSync(normalizedMapPath);
    if (candidateStats.isSymbolicLink()) {
      throw new Error(`Service accounts map file must not be a symlink: ${mapPath}`);
    }
    if (!candidateStats.isFile()) {
      throw new Error(`Service accounts map file does not exist or is not a file: ${mapPath}`);
    }

    // Attempt to canonicalize for subsequent operations but validate canonical path remains inside baseDirReal.
    try {
      const canonical = fs.realpathSync(normalizedMapPath);
      const relCanonical = path.relative(baseDirReal, canonical);
      if (relCanonical.startsWith('..') || path.isAbsolute(relCanonical)) {
        throw new Error(`Service accounts map file resolves outside of service accounts directory: ${mapPath}`);
      }
      mapPathReal = canonical;
    } catch (e) {
      // If realpathSync fails or is undesirable on this platform, fall back to the already-validated normalized path.
      mapPathReal = normalizedMapPath;
    }
  } catch (e) {
    throw new Error(`Service accounts map file is required and missing or invalid: ${mapPath}`);
  }

  // Open map.json without following symlinks where supported and read securely.
  // This reduces the risk of TOCTOU/symlink-based traversal and ensures the file is the expected one.
  let mapRaw;
  try {
    const nofollowSupported = !!(fs.constants && typeof fs.constants.O_NOFOLLOW !== 'undefined');
    const flags = nofollowSupported ? (fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW) : fs.constants.O_RDONLY;
    const fd = fs.openSync(mapPathReal, flags);
    try {
      mapRaw = fs.readFileSync(fd, 'utf8');
    } finally {
      fs.closeSync(fd);
    }
  } catch (e) {
    // If O_NOFOLLOW isn't available or the atomic open failed, attempt a validated fallback read.
    // The fallback still validates the canonical path and file type above before reading.
    try {
      mapRaw = fs.readFileSync(mapPathReal, 'utf8');
    } catch (e2) {
      throw new Error(`Unable to read service accounts map file securely: ${mapPath}`);
    }
  }
  let map;
  try {
    map = JSON.parse(mapRaw);
  } catch (e) {
    throw new Error(`Invalid JSON in service accounts map file: ${mapPath}`);
  }

  if (!Object.prototype.hasOwnProperty.call(map, userInput)) {
    throw new Error(`Service account key not found in map: ${userInput}`);
  }
  let mappedFilename = map[userInput];

  // Validate mappedFilename is a string
  if (typeof mappedFilename !== 'string') {
    throw new Error('Invalid service account filename in map');
  }

  // Resolve base name and ensure no directory components are present (prevent traversal)
  const safeBasename = path.basename(mappedFilename);
  if (mappedFilename !== safeBasename) {
    throw new Error('Service account filename in map must not contain path components');
  }

  // Only allow filenames with safe characters and .json extension (from the trusted map)
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(safeBasename)) {
    throw new Error('Invalid service account filename in map');
  }

  // Enforce a reasonable length to avoid pathological filenames
  if (safeBasename.length > 255) {
    throw new Error('Service account filename in map is too long');
  }

  // Build the final path using the trusted base directory and the safe basename,
  // then normalize and canonicalize before using.
  const finalPathCandidate = path.normalize(path.join(baseDirReal, safeBasename));
  const normalizedFilePath = fs.realpathSync(finalPathCandidate);

  // Ensure the resolved file path is inside the base directory
  if (!normalizedFilePath.startsWith(baseDirReal + path.sep) && normalizedFilePath !== baseDirReal) {
    throw new Error('Invalid service account file path');
  }

  const saRaw = fs.readFileSync(normalizedFilePath, 'utf8');
  sa = JSON.parse(saRaw);
} catch (err) {
  // Surface a clear error and exit
  process.stderr.write(`Error loading service account: ${err && err.message ? err.message : String(err)}\n`);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(sa)
});

const db = admin.firestore();

async function upsert(paper) {
  if (!paper || !paper.title) {
    throw new Error('Paper must have a title');
  }
  const now = admin.firestore.Timestamp.now();
  const docId = titleHash(paper.title);
  const docRef = db.collection('papers').doc(docId);
  const payload = {
    title: paper.title,
    authors: paper.authors || [],
    abstract: paper.abstract || null,
    publicationDate: paper.publicationDate ? admin.firestore.Timestamp.fromDate(new Date(paper.publicationDate)) : null,
    updatedAt: now
  };
  // Use set with merge so we don't lose other fields if already present
  await docRef.set(payload, { merge: true });
}

(async () => {
  try {
    const samples = require('./samples.json'); // optional: array of papers
    if (!Array.isArray(samples)) {
      throw new Error('samples.json must export an array');
    }
    for (const s of samples) {
      await upsert(s);
      process.stdout.write(`Upserted: ${s.title}\n`);
    }
    process.stdout.write('Done\n');
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Error during upsert: ${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
})();