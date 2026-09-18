import {songs} from '../songs.js';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
fs.mkdirSync(new URL('../test-results/',import.meta.url),{recursive:true});
const catalog=fileURLToPath(new URL('../test-results/lyrics-catalog.json',import.meta.url));
fs.writeFileSync(catalog,JSON.stringify(songs));
execFileSync(process.env.PYTHON||'python',['tools/extract-lyrics.py',catalog],{cwd:root,stdio:'inherit',env:{...process.env,PYTHONIOENCODING:'utf-8'}});
