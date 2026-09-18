import {songs} from '../songs.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before=new Map(songs.map(s=>[s.asset,hash(s.asset)]));
for(const suffix of ['first','second'])execFileSync(process.execPath,['tools/build-score-baseline.mjs','--output',`test-results/baseline-${suffix}.json`],{stdio:'inherit'});
const first=fs.readFileSync('test-results/baseline-first.json'),second=fs.readFileSync('test-results/baseline-second.json');
assert(first.equals(second));assert(first.equals(fs.readFileSync('data/score-baseline-2026.json')));
const baseline=JSON.parse(first),structured=songs.filter(s=>s.scoreType!=='pdf');
assert.equal(baseline.structuredScoreCount,structured.length);
assert.deepEqual(baseline.songs.map(s=>s.stableSongId).sort(),structured.map(s=>s.id).sort());
assert.equal(new Set(baseline.songs.map(s=>s.stableSongId)).size,structured.length);
for(const song of songs)assert.equal(hash(song.asset),before.get(song.asset));
for(const record of baseline.songs){const s=songs.find(s=>s.id===record.stableSongId),edition=record.editions[baseline.baselineLabel];assert.equal(edition.source.sha256,before.get(s.asset));assert(edition.measureCountPerPart.every(p=>p.measureCount>0));}
console.log(`PASS ${structured.length} catalog IDs exactly once; both builds byte-identical to frozen baseline; all ${songs.length} bundled source hashes unchanged`);
