"""Audit archived Standard PDFs; copy only with explicit --copy after reviewing sizes."""
import argparse, collections, csv, hashlib, json, os, pathlib, re, shutil, subprocess, unicodedata
ROOT = pathlib.Path(__file__).resolve().parents[1]
ARCHIVE = pathlib.Path(r"D:\LDS_Music_PDFs\2026-09-16")
def normalized(value):
    return "".join(c for c in unicodedata.normalize("NFKD", value).casefold() if c.isalnum())
def title_key(value):
    # Archive performance qualifiers; never strip arbitrary title text.
    return normalized(re.sub(r"\s*\((Women|Men|Men[’']s Choir|Round|Appropriate for Parents and Leaders)\)$", "", value))
def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--copy",action="store_true"); args=parser.parse_args()
    node=os.environ.get("NODE_EXE", "node")
    songs=json.loads(subprocess.check_output([node,"--input-type=module","-e","import {songs} from './songs.js'; console.log(JSON.stringify(songs))"],cwd=ROOT,text=True,encoding="utf-8"))
    rows=list(csv.DictReader((ARCHIVE/"reports/pdf-download-manifest.csv").open(encoding="utf-8-sig")))
    valid=[r for r in rows if r["variant_type"]=="Standard" and r["validation_result"].startswith("PASS") and r["content_status"].startswith("No licensing-placeholder") and pathlib.Path(r["local_full_path"]).is_file()]
    collections_map={c:next((r["collection"] for r in rows if (c=="Hymns (1985)" and r["collection"].startswith("Hymns of")) or (c.startswith("Children") and r["collection"].startswith("Children")) or r["collection"]==c),c) for c in {s["collection"] for s in songs}}
    matched=[]; exceptions=[]; existing=[]
    for s in songs:
        if s.get("scoreType")=="pdf":
            existing.append({"id":s["id"],"title":s["title"],"asset":s["asset"],"status":"Existing bundled PDF retained; not in this collection archive"}); continue
        candidates=[r for r in valid if r["collection"]==collections_map[s["collection"]] and normalized(r["official_number_page"])==normalized(s.get("page","")) and title_key(r["official_title"])==title_key(s["title"])]
        if len(candidates)!=1:
            exceptions.append({"id":s["id"],"title":s["title"],"page":s.get("page"),"candidates":len(candidates)}); continue
        r=candidates[0]; source=pathlib.Path(r["local_full_path"]); data=source.read_bytes()
        assert hashlib.sha256(data).hexdigest()==r["sha256"] and data.startswith(b"%PDF-")
        matched.append({"id":s["id"],"title":s["title"],"collection":s["collection"],"number":s.get("page"),"archiveTitle":r["official_title"],"source":str(source),"asset":"./assets/pdfs/fallback/"+s["id"]+".pdf","bytes":len(data),"sha256":r["sha256"],"pages":int(r["page_count"]),"match":"collection + number + title" if normalized(s["title"])==normalized(r["official_title"]) else "collection + number + title; archive performance qualifier retained in audit"})
    tracked=[ROOT/p for p in subprocess.check_output(["git","ls-files"],cwd=ROOT,text=True).splitlines() if (ROOT/p).is_file()]
    tree=[p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.relative_to(ROOT).parts]
    size=lambda paths:sum(p.stat().st_size for p in paths)
    total=sum(r["bytes"] for r in matched)
    audit={"startingCommit":subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip(),"songCount":len(songs),"matchedCount":len(matched),"matchedBytes":total,"byCollection":dict(collections.Counter(r["collection"] for r in matched)),"largest":max(matched,key=lambda r:r["bytes"]),"workingTreeBytesBefore":size(tree),"trackedSiteBytesBefore":size(tracked),"bundledAssetBytesBefore":size([p for p in tracked if p.relative_to(ROOT).parts[0] in ["assets","vendor"]]),"existingPdfBytes":size([p for p in tracked if p.suffix==".pdf"]),"projectedTrackedSiteBytes":size(tracked)+total,"projectedWorkingTreeBytes":size(tree)+total,"exceptions":exceptions,"existingPdfs":existing,"matches":matched}
    print(json.dumps({k:v for k,v in audit.items() if k!="matches"},indent=2,ensure_ascii=True))
    if args.copy:
        assert audit["projectedTrackedSiteBytes"]<500_000_000, "Review deployment size before copying"
        for r in matched:
            dest=ROOT/r["asset"]; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(r["source"],dest)
            assert hashlib.sha256(dest.read_bytes()).hexdigest()==r["sha256"]
        (ROOT/"reports/pdf-fallback-audit.json").write_text(json.dumps(audit,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
        mapping={r["id"]:r["asset"] for r in matched}
        (ROOT/"pdf-fallbacks.js").write_text("// Derived from the recovered Standard PDF manifest. Keys are existing stable song IDs.\nexport const pdfFallbacks = "+json.dumps(mapping,indent=2)+";\n",encoding="utf-8")
if __name__=="__main__": main()
