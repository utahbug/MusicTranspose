"""Opt-in Phase 3A.1 rollout: refine #68 display only, never infer new songs.
Run directly to update/check only the selected overlay and its refinement report.
The base generator also calls refine() so its --check remains reproducible.
"""
import hashlib, json, pathlib, runpy, sys
from collections import Counter
ROOT=pathlib.Path(__file__).resolve().parents[1]

def refine(overlays,batch):
    h=runpy.run_path(str(ROOT/'tools/harmony-inference.py'))
    policy=runpy.run_path(str(ROOT/'tools/harmony-display.py'))['temporal_display']
    # A rollout allowlist, not a musical exception: the policy itself has no song IDs.
    song=next(r for r in batch if r['number']==68)
    before=song['rootDisplay']['events']
    xml=h['source'](song)
    assert hashlib.sha256((ROOT/song['asset']).read_bytes()).hexdigest()==song['sourceSha256'], 'Changed source MXL'
    assert hashlib.sha256(xml.encode()).hexdigest()==overlays[song['id']]['xmlSha256'], 'Changed XML fingerprint'
    result=policy(before,h['extract'](xml))
    fields=['measure','offset','root','kind','bass']
    events=[{k:e[k] for k in fields} for e in result['events']]
    accepted=[{k:e[k] for k in fields} for e in before]
    assert overlays[song['id']]['events'] in [accepted,events], 'Unreviewed #68 overlay state'
    overlays[song['id']]={**overlays[song['id']],'events':events}
    def counts(es,clusters):
        measures=Counter(e['measure'] for e in es)
        return {'displayed':len(es),'measures3Plus':sum(v>=3 for v in measures.values()),'measures4Plus':sum(v>=4 for v in measures.values()),'measures5Plus':sum(v>=5 for v in measures.values()),'temporalClusters3Plus':len(clusters),'temporalClusters4Plus':sum(len(c['events'])>=4 for c in clusters),'temporalClusters5Plus':sum(len(c['events'])>=5 for c in clusters)}
    return {'number':68,'id':song['id'],'title':song['title'],'analysisCount':len(song['analysis']['events']),'analysisReviewWindows':len(song['analysis']['review']),'before':counts(before,result['beforeClusters']),'after':counts(result['events'],result['remainingClusters']),**result}

def main():
    path=ROOT/'generated-harmony-data.js';original=path.read_text(encoding='utf8');prefix,data=original.split('export const generatedHarmony = ',1)
    overlays=json.loads(data.strip().rstrip(';'))
    batch=json.loads((ROOT/'reports/harmony-batch3a.json').read_text(encoding='utf8'))
    report=refine(overlays,batch)
    outputs=[(path,prefix+'export const generatedHarmony = '+json.dumps(overlays,ensure_ascii=False,indent=2)+';\n'),(ROOT/'reports/harmony-dense-refinement.json',json.dumps(report,ensure_ascii=False,indent=2)+'\n')]
    for p,content in outputs:
        if '--check' in sys.argv:assert p.read_text(encoding='utf8')==content,str(p)+' not reproducible'
        else:p.write_text(content,encoding='utf8')
    print(report['before'], '->', report['after'])
if __name__=='__main__':main()
