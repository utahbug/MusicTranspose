"""Read-only, versioned MusicXML baseline extraction. Standard library only."""
import argparse
import hashlib
import json
import re
import sys
import zipfile
from fractions import Fraction
from pathlib import Path
import xml.etree.ElementTree as ET

VERSION = 'musicxml-structure-v1'
# Engraving/placement only; musical elements and their sequence are retained.
LAYOUT_TAGS = {'print', 'system-layout', 'page-layout', 'staff-layout', 'appearance',
               'end-line', 'end-paragraph'}
LAYOUT_ATTRS = {'default-x', 'default-y', 'relative-x', 'relative-y', 'font-family',
                'font-size', 'font-style', 'font-weight', 'color', 'halign', 'valign',
                'justify', 'placement', 'width', 'height', 'id'}


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode('utf-8')).hexdigest()


def read_score(path):
    raw = path.read_bytes()
    if path.suffix.lower() == '.mxl':
        with zipfile.ZipFile(path) as archive:
            bad = archive.testzip()
            if bad:
                raise ValueError('ZIP integrity failure: ' + bad)
            container = ET.fromstring(archive.read('META-INF/container.xml'))
            candidates = [e for e in container.iter() if e.tag.split('}')[-1] == 'rootfile']
            entry = next((e for e in candidates if e.get('media-type') == 'application/vnd.recordare.musicxml+xml'), None)
            if entry is None:
                raise ValueError('No MusicXML rootfile')
            member = entry.get('full-path')
            xml = archive.read(member)
    else:
        xml, member = raw, None
    root = ET.fromstring(xml)
    for e in root.iter():
        e.tag = e.tag.split('}')[-1]
    if root.tag != 'score-partwise':
        raise ValueError('Only score-partwise is supported')
    return raw, root, member


def canonical(e, divisions):
    if e.tag in LAYOUT_TAGS or e.tag == 'divisions':
        return None
    attrs = {k: v for k, v in e.attrib.items() if k not in LAYOUT_ATTRS}
    if e.tag == 'measure':
        attrs.pop('number', None)  # editorial measure label, sequence is retained
    text = re.sub(r'\s+', ' ', e.text or '').strip()
    if e.tag in {'duration', 'offset'} and text:
        text = str(Fraction(text) / divisions)
    children = [c for child in e if (c := canonical(child, divisions)) is not None]
    return [e.tag, attrs, text, children]


def analyze(song, root_dir, label):
    path = (root_dir / song['asset']).resolve()
    if not path.is_relative_to(root_dir.resolve()):
        raise ValueError('Score must be inside collection root: ' + song['asset'])
    raw, root, member = read_score(path)
    parts = root.findall('part')
    if not parts:
        raise ValueError('No musical parts')
    structure, components = [], {k: [] for k in ['notesRhythm', 'keys', 'times', 'harmony', 'lyrics', 'directions', 'measureSequence']}
    per_part, key_declarations, times, tempos, lyric_numbers = [], [], [], [], set()
    harmony_count = lyric_count = 0
    for pi, part in enumerate(parts):
        divisions = Fraction(1)
        measures, count = [], len(part.findall('measure'))
        declared_staffs, used_staffs = [], set()
        for mi, measure in enumerate(part.findall('measure')):
            events = []
            note_index = 0
            for event in measure:
                if event.tag == 'attributes':
                    value = event.findtext('divisions')
                    if value is not None:
                        divisions = Fraction(value)
                        if divisions <= 0:
                            raise ValueError('Invalid divisions')
                    for staff in event.findall('staves'):
                        declared_staffs.append(int(staff.text))
                normalized = canonical(event, divisions)
                if normalized is not None:
                    events.append(normalized)
                position = [pi, mi]
                if event.tag in {'note', 'backup', 'forward'}:
                    if event.tag == 'note':
                        note_index += 1
                        used_staffs.add(event.findtext('staff', '1'))
                        # Lyrics are compared separately; ties, slurs, fingering stay here.
                        copy = ET.fromstring(ET.tostring(event))
                        for lyric in copy.findall('lyric'):
                            copy.remove(lyric)
                        components['notesRhythm'].append([*position, canonical(copy, divisions)])
                    else:
                        components['notesRhythm'].append([*position, normalized])
                if event.tag in {'direction', 'sound', 'barline'}:
                    components['directions'].append([*position, normalized])
                for key in event.findall('.//key'):
                    item = {'partIndex': pi, 'measureIndex': mi, 'fifths': key.findtext('fifths'), 'mode': key.findtext('mode'), 'staff': key.get('number')}
                    key_declarations.append(item)
                    components['keys'].append([*position, canonical(key, divisions)])
                for time in event.findall('.//time'):
                    item = {'partIndex': pi, 'measureIndex': mi, 'beats': [x.text for x in time.findall('beats')], 'beatTypes': [x.text for x in time.findall('beat-type')], 'senzaMisura': time.find('senza-misura') is not None}
                    times.append(item)
                    components['times'].append([*position, canonical(time, divisions)])
                if event.tag == 'harmony':
                    harmony_count += 1
                    components['harmony'].append([*position, normalized])
                for lyric in event.findall('lyric'):
                    lyric_count += 1
                    if lyric.get('number'):
                        lyric_numbers.add(lyric.get('number'))
                    components['lyrics'].append([*position, note_index, canonical(lyric, divisions)])
                for child in event.iter():
                    if child.tag == 'sound' and child.get('tempo') is not None:
                        tempos.append({'partIndex': pi, 'measureIndex': mi, 'type': 'sound', 'quarterBpm': child.get('tempo')})
                    elif child.tag == 'metronome':
                        tempos.append({'partIndex': pi, 'measureIndex': mi, 'type': 'metronome', 'value': canonical(child, divisions)})
            measures.append(events)
        structure.append(measures)
        components['measureSequence'].append(count)
        per_part.append({'partId': part.get('id'), 'measureCount': count,
                         'staffCount': max(declared_staffs + [int(s) for s in used_staffs] + [0]) or None})
    counts = [p['measureCount'] for p in per_part]
    collection = song.get('collection')
    locator = song.get('page') or None
    # Legacy catalog field holds numbers for hymn collections, pages for Songbook.
    number = song.get('songNumber') or (locator if collection in {'Hymns (1985)', 'Hymns for Home and Church'} else None)
    page = locator if collection == 'Children’s Songbook' else None
    if 'pageNumber' in song:
        page = song['pageNumber']
    record = {
        'stableSongId': song['id'],
        'editions': {label: {
            'title': song['title'], 'collection': collection,
            'edition': song.get('edition') or ('1985 English' if collection == 'Hymns (1985)' else None),
            'baselineLabel': label, 'songNumber': number, 'pageNumber': page,
            'catalogLocator': locator, 'collectionMemberships': song.get('collectionMemberships', []),
            'source': {'reference': song['asset'], 'format': path.suffix.lower().lstrip('.'),
                       'mxlRootfile': member, 'sha256': hashlib.sha256(raw).hexdigest()},
            'catalogOriginalKey': {'tonic': song.get('tonic'), 'mode': song.get('mode'), 'fifths': song.get('fifths'), 'overrideEvidence': song.get('evidence')},
            'sourceKeyDeclarations': key_declarations, 'timeSignatures': times, 'encodedTempos': tempos,
            'measureCount': counts[0] if len(set(counts)) == 1 else None,
            'measureCountPerPart': per_part, 'partCount': len(parts),
            'staffCount': sum(p['staffCount'] or 0 for p in per_part) or None,
            'harmonyCount': harmony_count, 'lyricEventCount': lyric_count,
            'lyricVerseIdentifiers': sorted(lyric_numbers), 'lyricVerseCount': len(lyric_numbers) if lyric_numbers else None,
            'structuralFingerprint': {'algorithm': VERSION, 'sha256': digest(structure),
                'components': {k: digest(v) for k, v in components.items()}},
        }}
    }
    return record


def generate(catalog, root, label):
    structured = [s for s in catalog if s.get('scoreType') != 'pdf']
    ids = [s['id'] for s in catalog]
    if len(ids) != len(set(ids)) or any(not isinstance(i, str) or not i for i in ids):
        raise ValueError('Catalog requires unique nonempty stable IDs')
    records = [analyze(s, root, label) for s in sorted(structured, key=lambda s: s['id'])]
    return {'schemaVersion': 1, 'baselineLabel': label, 'fingerprintVersion': VERSION,
            'structuredScoreCount': len(records), 'excludedPdfIds': sorted(s['id'] for s in catalog if s.get('scoreType') == 'pdf'),
            'songs': records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog', default='-', help='JSON array with explicit stable IDs; - reads stdin')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--label', default='2026-09-18 bundled snapshot')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    catalog = json.loads(sys.stdin.read() if args.catalog == '-' else Path(args.catalog).read_text(encoding='utf-8-sig'))
    result = generate(catalog, args.root, args.label)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Inventoried {result['structuredScoreCount']} structured scores; excluded {len(result['excludedPdfIds'])} PDFs")

if __name__ == '__main__':
    main()
