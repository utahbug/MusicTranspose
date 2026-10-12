"""Four source-reviewed mappings; availability is deliberately unchanged/withheld."""
from collections import defaultdict
from fractions import Fraction
from hashlib import sha256
from pathlib import Path

IDS = {'cs-78', 'song-d165ef87-2efa-4a0c-a4b1-e07a742ea654', 'song-1d22a11a-9dd3-480d-a6f4-8c8e3fbd84a7', 'song-9be03820-2e2a-453e-9270-2138bf79d9c2'}
SOURCE_HASHES = {'cs-78': {'assets/scores/cs-78.mxl': '4a592f668b5ab64b71a19a827d3fe8deccbc04e1383a9830237614a2b0fd5cd9', 'assets/pdfs/fallback/cs-78.pdf': 'aae09dca46b96284e7b7fbc0f409e269105dda0eae4db22f5969006e05437f87'}, 'song-9be03820-2e2a-453e-9270-2138bf79d9c2': {'assets/scores/song-9be03820-2e2a-453e-9270-2138bf79d9c2.mxl': 'b0f20f0210cdcc7ebe56f7cd22797c10b4af338179067b4bfcae2a1b52645bf9', 'assets/pdfs/fallback/song-9be03820-2e2a-453e-9270-2138bf79d9c2.pdf': '7614bcf71996b02a997272c44cfa32e745703ca093e2364191149b6b508cd3e4'}, 'song-d165ef87-2efa-4a0c-a4b1-e07a742ea654': {'assets/scores/song-d165ef87-2efa-4a0c-a4b1-e07a742ea654.mxl': 'b1012bee827cb45d6c001a1c89fa8007fdb917e985765e617c3ac05d771d8d12', 'assets/pdfs/fallback/song-d165ef87-2efa-4a0c-a4b1-e07a742ea654.pdf': '61648064492a00df22ecfc8725951cc7de4e7da00821952ec2bc5d4b212df0ff'}, 'song-1d22a11a-9dd3-480d-a6f4-8c8e3fbd84a7': {'assets/scores/song-1d22a11a-9dd3-480d-a6f4-8c8e3fbd84a7.mxl': '6b40b39373966e6cf24c54a46e9d5acaaccf147bdff03afbc3ee36e93fca82d9', 'assets/pdfs/fallback/song-1d22a11a-9dd3-480d-a6f4-8c8e3fbd84a7.pdf': '28ff1b79aaef4f69b944cd0787189d34e37958b5d9b1bf6f832c9a8ac5c4a1d9'}}

def apply_reviewed_lyrics(record, root, stitch):
    sid = record['id']
    if sid not in IDS:
        return
    for filename, digest in SOURCE_HASHES[sid].items():
        assert sha256(Path(filename).read_bytes()).hexdigest() == digest, 'Re-review changed source: '+filename
    # Sort within each measure by actual onset, not XML voice serialization.
    events=[]
    for part in root.findall('part'):
        divisions=1
        for mi, measure in enumerate(part.findall('measure')):
            cursor=Fraction(0); previous=Fraction(0)
            for e in measure:
                if e.tag=='attributes': divisions=int(e.findtext('divisions',str(divisions)))
                duration=Fraction(int(e.findtext('duration','0')),divisions)
                if e.tag=='backup': cursor-=duration
                elif e.tag=='forward': cursor+=duration
                elif e.tag=='note':
                    onset=previous if e.find('chord') is not None else cursor
                    for lyric in e.findall('lyric'):
                        if lyric.findall('text'): events.append((part.get('id'),mi,measure.get('number'),onset,e.findtext('voice','1'),lyric.get('number','1'),lyric))
                    if e.find('chord') is None: previous=onset;cursor+=duration
    events.sort(key=lambda e:(e[0],e[1],e[3]))
    def nodes(part,start,end,row=None):
        return [e[6] for e in events if e[0]==part and start<=e[1]<=end and (row is None or e[5]==str(row))]
    def text(part,start,end,row=None):return stitch(nodes(part,start,end,row))
    def section(label,value,**extra):return dict(label=label,text=value,**extra)
    def verse(number,value):return dict(number=str(number),label='Verse '+str(number),text=value,kind='reviewed-note-lyrics')
    raw=defaultdict(list)
    for p,mi,bar,onset,voice,row,node in events:raw[(p,voice,row)].append(node)
    record['sourceLyricStreams']=[dict(part=p,voice=v,row=n,text=stitch(ls)) for (p,v,n),ls in raw.items()]
    if sid=='cs-78':
        assert text('P1',23,23,2)=='I’m'
        v1=text('P1',3,15,1);v2=text('P1',23,23,2)+' '+text('P1',4,15,2)
        # Original PDF p1/p2 uses lowercase pronouns and a colon before Chorus.
        assert v1.endswith('whispers,')
        v1=v1.replace('His','his').replace('He','he')[:-1]+':'
        v2=v2.replace('He','he')
        chorus=text('P1',16,24,1)
        record['verses']=[verse(1,v1),verse(2,v2)]
        record['refrains']=[section('Chorus',chorus,verses=['1','2'])]
        evidence='CS78 PDF pp1–2 and XML P1: X3 pickup/row1 X4–15; row2 X4–15 preceded by first-ending X23 return pickup. Chorus X16–22 plus final word X24; X23 pickup is not a second refrain. PDF confirms lowercase his/he and whispers colon; these PDF/XML differences are corrected with source hash guards.'
    elif sid=='song-1d22a11a-9dd3-480d-a6f4-8c8e3fbd84a7':
        instruction='Sing parts separately, then combined using third ending.'
        assert instruction in [w.text for w in root.findall('.//direction-type/words')]
        one=text('P1',4,19,1);two=text('P2',4,19,2)
        assert one.startswith('(Girls) 1. ') and two.startswith('(Boys) 2. ')
        final=text('P1',20,24,1)
        assert text('P2',20,24,2)=='here. '+final
        record['verses']=[]
        record['refrains']=[section('Performance instruction',instruction),section('Part 1 — Girls',one.removeprefix('(Girls) 1. ')),section('Part 2 — Boys',two.removeprefix('(Boys) 2. ')),section('Together — third ending',final)]
        evidence='CS190 PDF pp1–2: separate Girls/P1 and Boys/P2 X4–19, then combined pass using ending 3 (X20–24). P2 X19 here and X20 here are alternative endings, not consecutive words. Shared final text follows once after both parts; original raw streams retain both occurrences.'
    elif sid=='song-d165ef87-2efa-4a0c-a4b1-e07a742ea654':
        record['verses']=[verse(i,text('P1',0,16,i)) for i in (1,2,3)]
        upper=text('P1',17,33,1)
        # Lower line shares "the Savior in a stall!" before its second response.
        common=nodes('P1',22,25,1)[1:-1]
        lower=stitch(nodes('P1',18,21,2)+common+nodes('P1',26,33,2))
        record['refrains']=[section('Chorus — upper part (optional)',upper,disclosure=True),section('Chorus — lower part (optional)',lower,disclosure=True),section('Performance instruction',record['sourceTextBlocks'][1])]
        evidence='CS42 PDF pp1–2: three verses P1 rows1–3 through X16; optional Chorus X17–33. Lower response row2 crosses XML voice IDs; onset order restores its words. Lower part shares the Savior in a stall at X22–25, then follows its own closing the Lord, the Lord of all. Two separately labeled optional disclosures preserve overlap without inventing extra verses. PDF footnote: Chorus may be sung in one or two parts.'
    else:
        record['verses']=[verse(i,text('P1',0,3,i)) for i in (1,2,3,4)]
        common=text('P1',8,11,2)
        lower=text('P2',4,7,6)
        upper=text('P1',4,4,2)+' '+text('P2',5,6,5)
        record['refrains']=[section('Refrain',text('P1',4,11,2),verses=['1','2','3','4']),section('Refrain — upper secondary line',upper+' '+common,disclosure=True),section('Refrain — lower voices',lower+' '+common,disclosure=True)]
        evidence='Hymn212 PDF p1 and XML: four actual stanzas P1 rows1–4 through X3. P1 row2 X4–11 is the shared refrain, not part of verse2 only. XML P2 row5 appears under the upper staff in PDF and is an upper secondary line; row6 lower line crosses voice IDs and is ordered by onset at X4–7. Upper secondary shares the first Glory phrase at X4. Both rejoin common Peace text X8–11. No invented verses5/6. Refrain is descriptive; no unsupported printed Chorus label claimed.'
    # Attribution remains byte-for-byte in sourceTextBlocks; also available to Copy.
    credits=[b for b in record['sourceTextBlocks'] if b!=record['title'] and b!=record['number'] and not b.startswith('*Chorus')]
    record['refrains'].append(section('Credits and references','\n\n'.join(credits)))
    record['notes']=['Structure reviewed; existing Lyrics availability remains withheld. Publication eligibility is not established by musical-data review.']
    record['extractionDecisions'].append(evidence)
    record['status']='reviewed-withheld'
    record['available']=False
    record['publicationReview']={'status':'existing-withholding-preserved','publicLyricsEnabled':False}
