// No runtime imports or application changes: export the authoritative catalog to tooling.
import {songs} from '../songs.js';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
execFileSync(process.env.PYTHON||'python',['tools/score-baseline.py','--output','data/score-baseline-2026.json',...process.argv.slice(2)],{cwd:root,input:JSON.stringify(songs),stdio:['pipe','inherit','inherit'],env:{...process.env,PYTHONIOENCODING:'utf-8'}});
