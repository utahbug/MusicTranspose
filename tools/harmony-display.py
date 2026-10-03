"""Development-only accompaniment display policy; never alters analysis events."""
from copy import deepcopy
from collections import Counter

NAT = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
SUFFIX = {'major':'','minor':'m','dominant':'7','major-seventh':'maj7','diminished':'dim','augmented':'aug'}
def identity(e): return (e['rootPC'], e['kind'])
def pc(p): return (NAT[p['step']]+p['alter'])%12
def name(p): return p['step']+'#'*max(0,p['alter'])+'b'*max(0,-p['alter'])
def simplify(events, measures):
    """Use duration, meter and adjacent harmonic function, not song identity or quotas."""
    starts=[];total=0
    for m in measures: starts.append(total);total+=m['duration']
    times=[starts[e['measure']]+e['offset'] for e in events]
    displayed=[];decisions=[]
    for i,original in enumerate(events):
        e=deepcopy(original);m=measures[e['measure']]
        prev=events[i-1] if i else None;following=events[i+1] if i+1<len(events) else None
        beat=4/m['unit'];span=min((times[i+1] if following else total)-times[i],m['duration']-e['offset'])
        group=beat*(3 if m['beats'] in [6,9,12] else 2 if m['beats']==4 else m['beats'])
        strong=abs(e['offset']%group)<1e-7
        short=span<=beat+1e-7
        tonic=(7*m['fifths']+(9 if m['mode']=='minor' else 0))%12
        scale={(tonic+x)%12 for x in ([0,2,3,5,7,8,10] if m['mode']=='minor' else [0,2,4,5,7,9,11])}
        third=(e['rootPC']+(3 if e['kind'] in ['minor','diminished'] else 4))%12
        protected=e['kind']!='major' or e['rootPC'] not in scale or third not in scale
        cadence=bool(following and e['bass'] and pc(e['bass'])==following['rootPC'] and (following['rootPC']-e['rootPC'])%12==7)
        resolution=bool(prev and (prev['rootPC']-e['rootPC'])%12==7 and e['rootPC']==tonic)
        reason=None
        following_span=(min((times[i+2] if i+2<len(events) else total)-times[i+1],measures[following['measure']]['duration']-following['offset']) if following else 0)
        primary_neighbor=bool(prev and following and prev['rootPC']==tonic and identity(prev)==identity(following) and e['rootPC']==(tonic+7)%12 and e['kind'] in ['major','dominant'] and following_span<=beat and e['offset']>0 and short)
        structural_dominant=bool((not e['bass'] or e['kind']!='major') and following and (e['rootPC']-following['rootPC'])%12==7 and following_span>=2*beat)
        if primary_neighbor:
            reason='brief dominant neighbor within sustained tonic'
        if not reason and prev and following and not protected and not structural_dominant and not strong and short and identity(prev)==identity(following) and not (resolution and span>beat):
            reason='weak-beat return to previous harmony'
        # A brief inversion between related harmonies is voice leading, not a new accompaniment instruction.
        if not reason and prev and following and e['bass'] and not protected and not cadence and not structural_dominant and not resolution and short:
            def tones(x): return {x['rootPC'],(x['rootPC']+(3 if x['kind']=='minor' else 4))%12,(x['rootPC']+7)%12}
            bass_neighbor=prev['bassNote']==following['bassNote'] and original['bassNote']!=prev['bassNote']
            if bass_neighbor or (not strong and (len(tones(e)&tones(prev))>=2 or len(tones(e)&tones(following))>=2 or (e['rootPC']==tonic and following_span>=beat))):
                reason='brief voice-leading inversion'
        slash_removed=False
        if e['bass'] and not cadence and not (strong and span>=max(beat,m['duration']/2)):
            e['bass']=None;slash_removed=True
            e['label']=name(e['root'])+SUFFIX[e['kind']]
        if not reason and displayed and identity(displayed[-1])==identity(e) and displayed[-1]['bass']==e['bass']:
            reason='redundant functional repeat after slash simplification'
        decisions.append({'measure':e['sourceMeasure'],'offset':e['offset'],'before':original['label'],'after':None if reason else e['label'],'suppressed':reason,'slashRemoved':bool(original['bass'] and (reason or slash_removed)),'durationQuarters':span,'strongBeat':strong,'shortProtected':bool(not reason and short and (protected or cadence or resolution))})
        if not reason: displayed.append(e)
    return {'events':displayed,'decisions':decisions,'suppressionCounts':dict(Counter(d['suppressed'] for d in decisions if d['suppressed']))}


def root_only_display(events, measures, *, local_density=False):
    """Phase 1C output stage. Root/quality only; analysis and source XML untouched."""
    result=[];decisions=[]
    for event in events:
        e=deepcopy(event);e['bass']=None;e['label']=name(e['root'])+SUFFIX[e['kind']]
        reason='slash-only duplicate' if result and identity(result[-1])==identity(e) else None
        decisions.append(dict(measure=e['sourceMeasure'],offset=e['offset'],before=event['label'],after=None if reason else e['label'],suppressed=reason))
        if not reason:result.append(e)
    root_dedup=sum(d['suppressed'] is not None for d in decisions)
    before=Counter(e['measure'] for e in events)
    removed=set()
    if local_density:
        groups={m:[(i,e) for i,e in enumerate(result) if e['measure']==m] for m in {e['measure'] for e in result}}
        for mi,group in groups.items():
            if len(group)<3:continue
            m=measures[mi];beat=4/m['unit'];tonic=(7*m['fifths']+(9 if m['mode']=='minor' else 0))%12
            scale={(tonic+x)%12 for x in ([0,2,3,5,7,8,10] if m['mode']=='minor' else [0,2,4,5,7,9,11])}
            for gi,(i,e) in enumerate(group):
                if gi==0 or gi==len(group)-1:continue
                prev=group[gi-1][1];nxt=group[gi+1][1];span=nxt['offset']-e['offset']
                third=(e['rootPC']+(3 if e['kind']=='minor' else 4))%12
                protected=e['kind'] not in ['major','minor'] or e['rootPC'] not in scale or third not in scale
                if protected or span>beat+1e-7:continue
                strong=abs(e['offset']%(beat*(3 if m['beats'] in [6,9,12] else 2 if m['beats']==4 else m['beats'])))<1e-7
                reason=None
                if not strong and identity(prev)==identity(nxt):
                    reason='local weak-beat neighbor returning to the same harmony'
                elif e['kind']=='major' and e['rootPC']==tonic and (prev['rootPC']-tonic)%12 in [2,5] and (nxt['rootPC']-tonic)%12==7:
                    reason='local intermediate tonic between predominant and dominant'
                elif not strong and e['kind']=='major' and e['rootPC']==tonic and (prev['rootPC']-tonic)%12==7 and (nxt['rootPC']-tonic)%12==5 and m['duration']-nxt['offset']>=2*beat:
                    reason='local brief tonic passing to sustained subdominant'
                elif not strong and e['kind']=='major' and (e['rootPC']-tonic)%12 not in [0,7] and (e['rootPC']-nxt['rootPC'])%12!=7:
                    reason='local weak-beat diatonic intermediate'
                if reason:
                    removed.add(i)
                    next(d for d in decisions if d['measure']==e['sourceMeasure'] and d['offset']==e['offset']).update(after=None,suppressed=reason)
    final=[]
    for i,e in enumerate(result):
        if i in removed:continue
        if final and identity(final[-1])==identity(e):
            removed.add(i)
            next(d for d in decisions if d['measure']==e['sourceMeasure'] and d['offset']==e['offset']).update(after=None,suppressed='local-density resulting duplicate')
        else:final.append(e)
    after=Counter(e['measure'] for e in final)
    remaining=[]
    for mi,count in sorted(after.items()):
        if count>=3:
            remaining.append({'measure':measures[mi]['number'],'events':[{'offset':e['offset'],'chord':e['label']} for e in final if e['measure']==mi], 'reason':('Approved control: only slash removal and resulting deduplication allowed.' if not local_density else 'Retained opening/final harmony plus strong-beat, seventh-quality, minor, or chromatic functional change; no eligible short intermediate.')})
    return dict(events=final,decisions=decisions,previousCount=len(events),displayCount=len(final),slashBefore=sum(bool(e['bass']) for e in events),slashAfter=0,slashDuplicates=root_dedup,localSuppressed=len(removed),denseBefore=sum(n>=3 for n in before.values()),denseAfter=sum(n>=3 for n in after.values()),remainingDense=remaining)


def temporal_display(events, measures):
    """Opt-in accompaniment cleanup for close changes, including across barlines.

    Meter-normalized time is measured in beats (compound dotted beats). A four-
    symbol window within three beats, or three within 1.5 beats, merits review.
    This is a trigger, never a cap. Retained events keep their encoded onset.
    """
    starts=[];total=0
    for m in measures:
        starts.append(total)
        total+=m['duration']/(4/m['unit']*(3 if m['beats'] in [6,9,12] else 1))
    def time(e):
        m=measures[e['measure']]
        return starts[e['measure']]+e['offset']/(4/m['unit']*(3 if m['beats'] in [6,9,12] else 1))
    def windows(es):
        ts=[time(e) for e in es];found=[]
        for i in range(len(es)):
            for size,span in [(4,3),(3,1.5)]:
                if i+size<=len(es) and ts[i+size-1]-ts[i]<=span+1e-7:
                    end=i+size
                    while end<len(es) and ts[end]-ts[i]<=span+1e-7:end+=1
                    found.append((i,end))
        return sorted(set(w for w in found if not any(v!=w and v[0]<=w[0] and v[1]>=w[1] for v in found)))
    result=deepcopy(events);before=windows(result);decisions=[]
    def key(e):return (e['measure'],e['offset'])
    def crowded(es):return {i for a,b in windows(es) for i in range(a,b)}
    def record(e,why,duration):
        decisions.append(dict(measure=e['sourceMeasure'],measureIndex=e['measure'],offset=e['offset'],chord=e['label'],durationBeats=duration,reason=why))
    # A short triad followed by its seventh does not need two accompaniment labels.
    # Keep the seventh at its actual onset; never manufacture an earlier seventh.
    dense=crowded(result);kept=[]
    for i,e in enumerate(result):
        nxt=result[i+1] if i+1<len(result) else None
        duration=time(nxt)-time(e) if nxt else total-time(e)
        prev=result[i-1] if i else None
        if i in dense and i>0 and nxt and duration<=1+1e-7 and e['rootPC']==nxt['rootPC'] and e['kind']=='major' and nxt['kind']=='dominant':
            record(e,'brief triad before the same-root dominant seventh',duration)
        elif i in dense and prev and nxt and duration<=1+1e-7 and prev['kind']=='dominant' and e['kind']=='major' and prev['rootPC']==e['rootPC'] and (e['rootPC']-nxt['rootPC'])%12==7:
            record(e,'brief same-root triad between dominant seventh and resolution',duration)
        else:kept.append(e)
    result=kept
    # Minor is not automatically essential. Protect actual functional links instead.
    # Use the original crowded neighborhood too, so removing a redundant seventh
    # preparation does not shield another low-value intermediate in that cluster.
    candidates={key(e) for a,b in before for e in events[a:b]}
    protected=set()
    for i,e in enumerate(result):
        prev=result[i-1] if i else None;nxt=result[i+1] if i+1<len(result) else None
        if prev and ((prev['kind'] in ['major','dominant'] and (prev['rootPC']-e['rootPC'])%12==7) or (prev['kind']=='diminished' and (e['rootPC']-prev['rootPC'])%12 in [1,2])):protected.add(key(e))
        if nxt and e['kind']=='minor' and nxt['kind'] in ['major','dominant'] and (e['rootPC']-nxt['rootPC'])%12==7:protected.add(key(e))
    final=[]
    for i,e in enumerate(result):
        prev=result[i-1] if i else None;nxt=result[i+1] if i+1<len(result) else None
        duration=time(nxt)-time(e) if nxt else total-time(e)
        m=measures[e['measure']];beat=4/m['unit'];group=beat*(3 if m['beats'] in [6,9,12] else 2 if m['beats']==4 else m['beats'])
        strong=abs(e['offset']%group)<1e-7
        tonic=(7*m['fifths']+(9 if m['mode']=='minor' else 0))%12
        scale={(tonic+x)%12 for x in ([0,2,3,5,7,8,10] if m['mode']=='minor' else [0,2,4,5,7,9,11])}
        tones={(e['rootPC']+x)%12 for x in ([0,3,7] if e['kind']=='minor' else [0,4,7])}
        reason=None
        if key(e) in candidates and prev and nxt and not strong and duration<=1+1e-7 and key(e) not in protected and e['kind'] in ['major','minor'] and tones<=scale:
            if identity(prev)==identity(nxt):reason='brief weak-position neighbor returning to prior harmony'
            elif e['kind']=='minor':reason='brief weak-position diatonic minor without a functional approach/resolution'
        if reason:record(e,reason,duration)
        elif final and identity(final[-1])==identity(e):record(e,'redundant root/quality after temporal cleanup',duration)
        else:final.append(e)
    def describe(es,ws):
        return [dict(start=es[a]['sourceMeasure'],startOffset=es[a]['offset'],end=es[b-1]['sourceMeasure'],endOffset=es[b-1]['offset'],spanBeats=round(time(es[b-1])-time(es[a]),6),events=[dict(measure=e['sourceMeasure'],offset=e['offset'],chord=e['label']) for e in es[a:b]]) for a,b in ws]
    return dict(events=final,decisions=decisions,beforeClusters=describe(events,before),remainingClusters=describe(final,windows(final)))
