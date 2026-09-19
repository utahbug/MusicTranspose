import json,hashlib
from pathlib import Path
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
inventory=read('reports/hymnal-1985-inventory.json');validation={r['id']:r for r in read('reports/hymnal-1985-validation.json')};tempo={r['id']:r for r in read('reports/hymnal-1985-tempo-mode-audit.json')};lyrics={r['id']:r for r in read('assets/lyrics.json')['songs']}
songs=json.loads(Path('imported-songs.js').read_text(encoding='utf-8').split('export const importedSongs=',1)[1].strip().removesuffix(';'));songs={s['id']:s for s in songs};songs.update({s['id']:s for s in inventory['before']});manifest=read('offline-scores.json');matrix=[]
for row in inventory['rows']:
 r=dict(row);id=r['id'];v=validation.get(id,{});s=songs.get(id,{});l=lyrics.get(id,{});t=tempo.get(id,{})
 r.update(renderStatus=v.get('render','not available'),transpositionStatus=v.get('transposition','not available'),playbackStatus=v.get('playback','not available'),lyricsStatus=('available: '+l['status']) if l.get('available') else ('withheld: '+l.get('status','no source')),lyricsNotes=l.get('notes',[]),originalKey=s.get('tonic',''),mode=s.get('mode',''),modeOverride=s.get('modeOverride'),offlineAssetStatus='bundled; cache presence verified' if r.get('asset') in manifest else 'no score asset',fallbackTempo=t.get('fallbackTempo'),linearRepeatPlayback=t.get('repeats',False))
 r['notes']+=v.get('notes',[])
 if s.get('evidence'):r['notes'].append(s['evidence'])
 if r['number']==154:r['notes'].append('Opening C-minor triad, incomplete closing E-flat/G voicing; retained declared E-flat major. Tonal interpretation needs musician review.')
 if r.get('asset'):
  assert hashlib.sha256(Path(r['asset']).read_bytes()).hexdigest()==r['sha256'],'Archive copy mismatch'
  r['archiveBytesMatch']=True
 matrix.append(r)
Path('reports/hymnal-1985-validation-matrix.json').write_text(json.dumps({'startingCommit':'a4fdec4','expected':341,'before':2,'after':335,'added':333,'rows':matrix},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
withheld=[r for r in matrix if r.get('asset') and r['lyricsStatus'].startswith('withheld')]
Path('reports/hymnal-1985-lyrics-exceptions.md').write_text('# Withheld Hymnal Lyrics\n\nScore remains available. Extraction is ambiguous, not silently presented as verified.\n\n'+''.join(f"- {r['number']}: {r['title']} — {'; '.join(r['lyricsNotes'])}\n" for r in withheld),encoding='utf-8')
print('Matrix',len(matrix),'available lyrics',335-len(withheld))
