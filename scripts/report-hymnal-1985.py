import json,hashlib,os
from pathlib import Path
stem=os.environ.get('IMPORT_REPORT','hymnal-1985')
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
inventory=read(f'reports/{stem}-inventory.json');validation={r['id']:r for r in read(f'reports/{stem}-validation.json')};tempo={r['id']:r for r in read(f'reports/{stem}-tempo-mode-audit.json')};lyrics={r['id']:r for r in read('assets/lyrics.json')['songs']}
songs=json.loads(Path('imported-songs.js').read_text(encoding='utf-8').split('export const importedSongs=',1)[1].strip().removesuffix(';'));songs={s['id']:s for s in songs};songs.update({s['id']:s for s in inventory['before']});manifest=read('offline-scores.json');matrix=[]
for row in inventory['rows']:
 r=dict(row);id=r['id'];v=validation.get(id,{});s=songs.get(id,{});l=lyrics.get(id,{});t=tempo.get(id,{})
 r.update(renderStatus=v.get('render','not available'),transpositionStatus=v.get('transposition','not available'),playbackStatus=v.get('playback','not available'),lyricsStatus=('available: '+l['status']) if l.get('available') else ('withheld: '+l.get('status','no source')),lyricsNotes=l.get('notes',[]),originalKey=s.get('tonic',''),mode=s.get('mode',''),modeOverride=s.get('modeOverride'),offlineAssetStatus='bundled; cache presence checked in collection acceptance test' if r.get('asset') in manifest else 'no score asset',fallbackTempo=t.get('fallbackTempo',v.get('fallbackTempo')),linearRepeatPlayback=t.get('repeats',False))
 r['notes']+=v.get('notes',[])
 if stem=='childrens-songbook' and str(r['number'])=='42':r['notes'].append('Visual spot check at 820px: tight lyric spacing around Bless all in the second system. Recorded as an existing source/renderer spacing exception; no global engraving change.')
 if s.get('evidence'):r['notes'].append(s['evidence'])
 if stem=='hymnal-1985' and str(r['number'])=='154':r['notes'].append('Opening C-minor triad, incomplete closing E-flat/G voicing; retained declared E-flat major. Tonal interpretation needs musician review.')
 if r.get('asset'):
  assert hashlib.sha256(Path(r['asset']).read_bytes()).hexdigest()==r['sha256'],'Archive copy mismatch'
  r['archiveBytesMatch']=True
 matrix.append(r)
Path(f'reports/{stem}-validation-matrix.json').write_text(json.dumps({'startingCommit':inventory['startingCommit'],'expected':inventory['expected'],'before':len(inventory['before']),'after':sum(bool(r.get('asset')) for r in matrix),'added':sum(bool(r.get('asset')) and not r['beforeId'] for r in matrix),'rows':matrix},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
withheld=[r for r in matrix if r.get('asset') and r['lyricsStatus'].startswith('withheld')]
Path(f'reports/{stem}-lyrics-exceptions.md').write_text('# Withheld collection Lyrics\n\nScore remains available. Entries below have ambiguous extraction or no source lyrics; no fabricated text is displayed.\n\n'+''.join(f"- {r['number']}: {r['title']} — {'; '.join(r['lyricsNotes']) or r['lyricsStatus']}\n" for r in withheld),encoding='utf-8')
print('Matrix',len(matrix),'available lyrics',sum(bool(r.get('asset')) for r in matrix)-len(withheld))
