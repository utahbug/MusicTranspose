import csv,json,re,unicodedata,zipfile,hashlib,shutil
from pathlib import Path
import xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=Path('D:/LDS_Music_MXL/2026-09-16')
requested='''A Child’s Prayer
Called to Serve
Choose to Serve the Lord
I Feel My Savior’s Love
I Will Walk with Jesus
I Will Follow God’s Plan
Gethsemane
He Sent His Son
Holding Hands Around the World
Jesus Has Risen
Jesus Wants Me for a Sunbeam
I Need My Heavenly Father
I Belong to the Church of Jesus Christ
I Want to Be a Missionary Now
I Hope They Call Me on a Mission
I Love to See the Temple
I Thank Thee, Dear Father
I’m Trying to Be Like Jesus
My Heavenly Father Loves Me
Scripture Power
Search, Ponder, and Pray
This Little Light of Mine
When He Comes Again
When I Am Baptized
Where Love Is
Beauty Everywhere
Children All Over the World
Follow the Prophet
I Am a Child of God
Little Purple Pansies
Build an Ark
Do as I’m Doing
Give, Said the Little Stream
Head, Shoulders, Knees, and Toes
Hello Song
If You’re Happy
Once There Was a Snowman
Popcorn Popping
The Handcart Song
Wise Man and the Foolish Man
Smiles
Jesus Said Love Everyone
The Shepherd’s Carol'''.splitlines()
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',s).lower())
rows=list(csv.DictReader((ARCHIVE/'reports/mxl-download-manifest.csv').open(encoding='utf-8-sig')))
alias={'I Belong to the Church of Jesus Christ':'The Church of Jesus Christ','Wise Man and the Foolish Man':'The Wise Man and the Foolish Man'}
selected=[r for r in rows if r['collection']=='Hymns for Home and Church'];primary=[];matches=[]
for title in requested:
 found=[r for r in rows if norm(r['official_title'])==norm(alias.get(title,title))]
 found.sort(key=lambda r:0 if r['collection']=="Children's Songbook" else 1 if r['collection']=='Hymns for Home and Church' else 2)
 if not found:matches.append({'requested':title,'status':'No matching structured score in local archive'});continue
 r=found[0];primary.append(r['sha256']);matches.append({'requested':title,'canonical':r['official_title'],'collection':r['collection'],'page':r['official_number_page'],'sha256':r['sha256'],'status':'matched'})
 if r not in selected:selected.append(r)
existing={hashlib.sha256((ROOT/'assets'/f'{id}.mxl').read_bytes()).hexdigest():id for id in ['nativity','shepherd','faithful','silent-night']}
major=['C♭','G♭','D♭','A♭','E♭','B♭','F','C','G','D','A','E','B','F♯','C♯'];minor=['A♭','E♭','B♭','F','C','G','D','A','E','B','F♯','C♯','G♯','D♯','A♯']
registry=[];audit=[];byhash={};duplicates=[]
(ROOT/'assets/scores').mkdir(exist_ok=True)
for r in selected:
 path=Path(r['local_full_path']);raw=path.read_bytes();sha=hashlib.sha256(raw).hexdigest();assert sha==r['sha256']
 collection="Children’s Songbook" if r['collection']=="Children's Songbook" else r['collection'];page=r['official_number_page'];title=r['official_title']
 membership={'collection':collection,'page':page}
 entry={'title':title,'collection':collection,'page':page,'source':str(path),'sha256':sha,'status':'pending'};audit.append(entry)
 if sha in existing:entry.update(status='existing',id=existing[sha]);duplicates.append({'title':title,'kept':existing[sha],'reason':'existing asset'});continue
 if sha in byhash:
  song=byhash[sha];song['collectionMemberships'].append(membership);entry.update(status='consolidated',id=song['id']);duplicates.append({'title':title,'kept':song['id'],'reason':'identical archive bytes'});continue
 try:
  with zipfile.ZipFile(path) as z:
   assert z.testzip() is None
   container=E.fromstring(z.read('META-INF/container.xml'));file=next(e.attrib['full-path'] for e in container.iter() if e.tag.endswith('rootfile'));xml=E.fromstring(z.read(file))
  keys=[(k.findtext('fifths'),k.findtext('mode','major').strip()) for k in xml.findall('.//attributes/key')]
  if not keys:raise ValueError('Missing explicit key signature')
  if len(set(keys))!=1:raise ValueError('Multiple key declarations/modulation unsupported by existing transposer: '+str(sorted(set(keys))))
  fifths=int(keys[0][0]);mode=keys[0][1]
  if mode not in ['major','minor'] or not -7<=fifths<=7:raise ValueError('Unsupported key declaration')
  id=('hhc-' if collection=='Hymns for Home and Church' else 'cs-')+page
  destination=ROOT/'assets/scores'/f'{id}.mxl'
  if destination.exists():assert destination.read_bytes()==raw
  else:shutil.copyfile(path,destination)
  song={'id':id,'title':title,'collection':collection,'page':page,'tonic':(minor if mode=='minor' else major)[fifths+7],'mode':mode,'fifths':fifths,'asset':f'./assets/scores/{id}.mxl','tags':['Primary'] if sha in primary else [],'aliases':[m['requested'] for m in matches if m.get('sha256')==sha and m['requested']!=title],'collectionMemberships':[]}
  overrides={'hhc-1009':'Opening/repeated D-minor harmony and D bass establish D minor; final D-major chord is a Picardy ending.', 'hhc-1058':'Opening and final G-minor harmonies establish G minor.', 'hhc-1203':'E-minor opening, repeated B7 to E-minor cadences and final E-minor harmony establish E minor.', 'cs-110':'C-minor opening, repeated G7 to C-minor cadences and final C-minor harmony establish C minor.'}
  if id in overrides:
   song.update(mode='minor',tonic=minor[fifths+7],modeOverride='minor',evidence=overrides[id]);entry['mode_discrepancy']=overrides[id]
  byhash[sha]=song;registry.append(song);entry.update(status='included',id=id,key=song['tonic']+' '+song['mode'],notes=len(xml.findall('.//note')),harmonies=len(xml.findall('.//harmony')),verses=len(xml.findall('.//lyric')),directions=len(xml.findall('.//direction')))
 except Exception as e:entry.update(status='excluded',reason=str(e))
(ROOT/'imported-songs.js').write_text('// Generated by scripts/import-library.py from the read-only archive.\nexport const importedSongs='+json.dumps(registry,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
(ROOT/'reports/library-import-audit.json').write_text(json.dumps({'requested':matches,'sources':audit,'duplicates':duplicates},ensure_ascii=False,indent=2),encoding='utf-8')
print('HHC archive 82; requested',len(requested),'new unique',len(registry),'existing/consolidated',len(duplicates))
print('Missing:',[m['requested'] for m in matches if m['status']!='matched'])
print('Excluded:',[(a['title'],a.get('reason')) for a in audit if a['status']=='excluded'])
print('Minor:',[(s['title'],s['tonic']) for s in registry if s['mode']=='minor'])
