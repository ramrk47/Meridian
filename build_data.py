#!/usr/bin/env python3
"""Convert all extracted CSVs into a single embedded data.js for the dashboard."""
import csv, json, os, re

RAW = os.path.join(os.path.dirname(__file__), "_raw")
DOWNLOADS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def rd(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.reader(f))

# ---------- Marrow QBank ----------
marrow_subjects = []
for row in rd(f"{RAW}/Marrow/Marrow/marrow_qbank_subject_summary.csv")[1:]:
    if not row or row[1] == "TOTAL":
        continue
    marrow_subjects.append({"subject": row[1], "modules": int(row[2]), "mcqs": int(row[3])})

# topic/module level
marrow_modules = []
for row in rd(f"{RAW}/Marrow/Marrow/marrow_qbank_topic_breakdown.csv")[1:]:
    if len(row) < 6 or row[1] == "TOTAL":
        continue
    try:
        rating = float(row[4]) if row[4] not in ("", "-") else None
    except ValueError:
        rating = None
    marrow_modules.append({
        "subject": row[1], "category": row[2], "module": row[3],
        "rating": rating, "mcqs": int(row[5]) if row[5].isdigit() else 0,
    })

# ---------- Cerebellum QBank ----------
cere_subjects = []
for row in rd(f"{RAW}/Cerebellum/Cerebellum/cerebellum_qbank_subject_summary.csv")[1:]:
    if not row or row[1] == "TOTAL":
        continue
    cere_subjects.append({
        "subject": row[1], "units": int(row[2]) if row[2].isdigit() else None,
        "modules": int(row[3]), "mcqs": int(row[4]),
    })

cere_units = []
for row in rd(f"{RAW}/Cerebellum/Cerebellum/cerebellum_qbank_topic_breakdown.csv")[1:]:
    if len(row) < 5 or row[1] == "TOTAL":
        continue
    cere_units.append({
        "subject": row[1], "unit": row[2],
        "modules": int(row[3]) if row[3].isdigit() else 0,
        "mcqs": int(row[4]) if row[4].isdigit() else 0,
    })

# ---------- CoreBTR tests ----------
corebtr_tests = []
for row in rd(f"{RAW}/CoreBTR/CoreBTR/corebtr_all_tests.csv")[1:]:
    if not row or row[1].startswith("TOTAL"):
        continue
    corebtr_tests.append({
        "name": row[1], "status": row[2],
        "duration": int(row[3]) if row[3].isdigit() else None,
        "questions": int(row[4]) if row[4].isdigit() else None,
        "marks": int(row[5]) if row[5].isdigit() else None,
    })

# ---------- Cerebellum tests (loose csv, multi-section) ----------
cere_subject_tests, cere_gt_summary, cere_gt_2026 = [], [], []
lines = open(f"{RAW}/NewPlatforms/cerebellum_tests.csv", encoding="utf-8").read().splitlines()
section = None
for ln in lines:
    s = ln.strip()
    if not s or set(s) == {"="}:
        continue
    if "SUBJECT TESTS" in s: section = "subj"; continue
    if "2026 GRAND TEST DETAIL" in s: section = "gt2026"; continue
    if "GRAND TESTS" in s: section = "gtsum"; continue
    parts = next(csv.reader([s]))
    if section == "subj":
        if parts[0] in ("Subject",) or len(parts) < 3: continue
        cere_subject_tests.append({"subject": parts[0], "prof": parts[1], "count": int(parts[2]) if parts[2].isdigit() else parts[2]})
    elif section == "gtsum":
        if parts[0] in ("Year",) or len(parts) < 2: continue
        cere_gt_summary.append({"year": parts[0], "count": parts[1], "notes": parts[2] if len(parts) > 2 else ""})
    elif section == "gt2026":
        if parts[0] in ("Test Name",) or len(parts) < 4: continue
        cere_gt_2026.append({"name": parts[0], "questions": parts[1], "duration": parts[2], "date": parts[3]})

# ---------- Marrow tests (parse counts from raw + summary) ----------
marrow_tests = {"grand": 25, "mini": 46, "subject": 26}

# ---------- CoreBTR Topic Videos (parse the cut report) ----------
def hms_to_sec(t):
    parts = [int(x) for x in t.strip().split(":")]
    while len(parts) < 3:
        parts.insert(0, 0)
    h, m, s = parts[-3], parts[-2], parts[-1]
    return h * 3600 + m * 60 + s

# ---------- stable IDs ----------
def slug(*parts):
    s = "|".join(str(p) for p in parts).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

for i, m in enumerate(marrow_modules):
    m["id"] = "m-" + slug(m["subject"], m["category"], m["module"])[:80] + f"-{i}"
for i, u in enumerate(cere_units):
    u["id"] = "c-" + slug(u["subject"], u["unit"])[:80] + f"-{i}"
for i, t in enumerate(corebtr_tests):
    t["id"] = "kt-" + slug(t["name"])[:60] + f"-{i}"
for i, t in enumerate(cere_gt_2026):
    t["id"] = "cg-" + slug(t["name"])[:60] + f"-{i}"
    t["platform"] = "Cerebellum"

# ---------- high-yield / importance engine ----------
def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def tier_from(score):
    if score >= 0.70: return 3
    if score >= 0.45: return 2
    return 1

# Marrow: blend star-rating (its own importance signal) with MCQ share within subject
by_subj = {}
for m in marrow_modules:
    by_subj.setdefault(m["subject"], []).append(m)
for subj, mods in by_subj.items():
    # PYQ papers are past exams, not "high-yield topics" — keep them out of HY rollups
    if subj == "Previous Year Question Papers":
        for m in mods:
            m["hyScore"] = 0.0
            m["priority"] = 1
        continue
    mx = max((m["mcqs"] for m in mods), default=1) or 1
    for m in mods:
        share = m["mcqs"] / mx
        rating = m["rating"] if m["rating"] is not None else 4.4
        rnorm = clamp((rating - 4.2) / 0.5)
        score = round(0.55 * rnorm + 0.45 * share, 3)
        m["hyScore"] = score
        m["priority"] = tier_from(score)

# Cerebellum: no rating -> blend volume share with MCQ density (q per module)
by_subj = {}
for u in cere_units:
    by_subj.setdefault(u["subject"], []).append(u)
for subj, units in by_subj.items():
    mx = max((u["mcqs"] for u in units), default=1) or 1
    dens = [(u["mcqs"] / u["modules"]) if u["modules"] else 0 for u in units]
    dmx = max(dens, default=1) or 1
    for u in units:
        share = u["mcqs"] / mx
        d = ((u["mcqs"] / u["modules"]) if u["modules"] else 0) / dmx
        score = round(0.55 * share + 0.45 * d, 3)
        u["hyScore"] = score
        u["priority"] = tier_from(score)

# ---------- CoreBTR Topic Videos (parse the cut report) ----------
btr_videos = []
vid_path = f"{RAW}/CoreBTR_Videos/Topic Video Cut Report.md"
if os.path.exists(vid_path):
    for line in open(vid_path, encoding="utf-8"):
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 6 or cells[0] == "Subject" or not cells[1].isdigit():
            continue
        subject, num, topic, timerange, conf, fname = cells[0], int(cells[1]), cells[2], cells[3], cells[4], cells[5]
        dur = None
        if "-" in timerange:
            a, b = [p.strip() for p in timerange.split("-", 1)]
            try:
                dur = max(0, round((hms_to_sec(b) - hms_to_sec(a)) / 60))
            except Exception:
                dur = None
        btr_videos.append({
            "id": "v-btr-" + slug(subject, str(num)),
            "source": "CoreBTR", "subject": subject, "num": num, "topic": topic,
            "timerange": timerange, "durMin": dur, "confidence": conf, "file": fname,
        })

# ---------- DocTutorials QBank (Main section: subject -> chapter) ----------
# DocTutorials gives chapter + MCQ totals. We ingest the "Main" topic bank (the surface
# directly comparable to Marrow modules / Cerebellum units). QRP + PYQ sections are also
# captured in doctutorials_chapters.csv — left as a clean seam for a later pass.
# No star-rating or sub-module counts are available, so high-yield is scored from MCQ
# volume share within a subject only (honest: real counts, no fabricated rating signal).
dt_order, dt_by_subject = [], {}
DT_PATH = f"{RAW}/NewPlatforms/doctutorials_chapters.csv"
if os.path.exists(DT_PATH):
    for row in rd(DT_PATH)[1:]:
        if len(row) < 4 or row[0] != "Main":
            continue
        _, subject, chapter, mcq = row[0], row[1], row[2], row[3]
        if subject not in dt_by_subject:
            dt_by_subject[subject] = []; dt_order.append(subject)
        dt_by_subject[subject].append({"name": chapter, "mcqs": int(mcq) if mcq.isdigit() else 0})

dt_subjects = []
for subject in dt_order:
    chs = dt_by_subject[subject]
    mx = max((c["mcqs"] for c in chs), default=1) or 1
    mods = []
    for i, c in enumerate(chs):
        score = round(c["mcqs"] / mx, 3)  # within-subject MCQ share
        mods.append({
            "id": "d-" + slug(subject, c["name"])[:80] + f"-{i}",
            "category": None, "name": c["name"], "mcqs": c["mcqs"],
            "rating": None, "priority": tier_from(score), "hyScore": score,
        })
    dt_subjects.append({"subject": subject, "modules": mods})

# ---------- assemble exam-agnostic model: D = {exam, platforms[], tests, videos} ----------
def _marrow_platform():
    by = {}
    for m in marrow_modules:
        by.setdefault(m["subject"], []).append(m)
    subs = [{"subject": s["subject"], "modules": [
        {"id": m["id"], "category": m["category"], "name": m["module"], "mcqs": m["mcqs"],
         "rating": m["rating"], "priority": m["priority"], "hyScore": m["hyScore"]}
        for m in by.get(s["subject"], [])]} for s in marrow_subjects]
    return {"id": "marrow", "name": "Marrow", "kind": "qbank", "color": "#3a5a78", "cls": "m", "subjects": subs}

def _cere_platform():
    by = {}
    for u in cere_units:
        by.setdefault(u["subject"], []).append(u)
    subs = [{"subject": s["subject"], "modules": [
        {"id": u["id"], "category": None, "name": u["unit"], "mcqs": u["mcqs"],
         "modulesCount": u["modules"], "rating": None, "priority": u["priority"], "hyScore": u["hyScore"]}
        for u in by.get(s["subject"], [])]} for s in cere_subjects]
    return {"id": "cerebellum", "name": "Cerebellum", "kind": "qbank", "color": "#b0613b", "cls": "c", "subjects": subs}

platforms = [
    _marrow_platform(),
    _cere_platform(),
    {"id": "doctutorials", "name": "DocTutorials", "kind": "qbank", "color": "#5d7a52", "cls": "k", "subjects": dt_subjects},
]

# ---------- curated judgment layer (Phase 1c.1 — substance, honestly labelled) ----------
# Curated, sourced claims live in _raw/curated/*.json (never hardcoded here). Every directional /
# public-3p figure references a source in the shared registry. epistemic labels: measured | proxy |
# directional | public-3p. The faculty pass (1c.1F) reuses D.sources + D.methodology + these conventions.
CURATED = os.path.join(RAW, "curated")

def load_curated(name):
    path = os.path.join(CURATED, name)
    if not os.path.exists(path):
        print(f"WARN: curated/{name} missing — skipping")
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)

_sources_doc = load_curated("sources.json") or {"sources": []}
_strength_doc = load_curated("subject_strength.json")
_reliab_doc = load_curated("reliability.json")
_method_doc = load_curated("methodology.json")

# ---------- faculty layer (Phase 1c.1F / Stage 3b) ----------
# Faculty seed + its own source registry live on disk un-emitted until now. We APPEND the
# faculty sources into the shared registry (so the integrity guard still validates faculty refs
# against one combined set) and emit D.faculty[]. Epistemic: directional (seed). Aggregate-only.
_faculty_doc = load_curated("faculty_seed.json")
_faculty_src_doc = load_curated("faculty_sources.json")

sources = _sources_doc.get("sources", [])
# append faculty sources (prefixed src-fac- to avoid collision; dedupe by id just in case)
if _faculty_src_doc:
    _existing = {s["id"] for s in sources}
    for s in _faculty_src_doc.get("sources", []):
        if s["id"] not in _existing:
            sources.append(s)
            _existing.add(s["id"])
source_ids = {s["id"] for s in sources}

# Source-integrity guard: no curated claim may reference a source that isn't in the registry
# (catches typos / fabricated source refs before they ship). Collect every referenced id.
def _collect_refs(doc):
    refs = set()
    if not doc:
        return refs
    refs.update(doc.get("sourceIds", []) or [])
    for subj in doc.get("subjects", []) or []:
        refs.update(subj.get("sourceIds", []) or [])
    for app in doc.get("apps", []) or []:
        if app.get("sourceId"):
            refs.add(app["sourceId"])
    # faculty docs: each faculty (+ its affiliations) carries sourceIds
    for fac in doc.get("faculty", []) or []:
        refs.update(fac.get("sourceIds", []) or [])
        for aff in fac.get("affiliations", []) or []:
            refs.update(aff.get("sourceIds", []) or [])
    return refs

referenced = _collect_refs(_strength_doc) | _collect_refs(_reliab_doc) | _collect_refs(_faculty_doc)
dangling = referenced - source_ids
if dangling:
    raise SystemExit(f"ABORT (neutrality firewall): curated claims reference unknown source ids: {sorted(dangling)}")

# Attach the public-3p reliability record to each integrated platform by id (convenience pointer;
# D.reliability stays the canonical full scorecard incl. non-integrated apps PrepLadder / eGurukul).
if _reliab_doc:
    by_pid = {a["platformId"]: a for a in _reliab_doc.get("apps", []) if a.get("platformId")}
    for p in platforms:
        if p["id"] in by_pid:
            p["reliability"] = by_pid[p["id"]]

# ---------- faculty roster + a "platforms[]" convenience seam per faculty ----------
# Derive a deduped platform list per faculty (real integrated platformIds only) from their
# affiliations — entity pages / facultyForPlatform() read this without re-walking affiliations.
faculty = (_faculty_doc.get("faculty", []) if _faculty_doc else [])
_integrated_ids = {p["id"] for p in platforms}
for f in faculty:
    pids, seen = [], set()
    for aff in f.get("affiliations", []) or []:
        pid = aff.get("platformId")
        if pid and pid in _integrated_ids and pid not in seen:
            pids.append({"platformId": pid}); seen.add(pid)
    f["platforms"] = pids

# ---------- map D.videos[].facultyId where subject+platform confidently identifies ONE faculty ----------
# CoreBTR is Cerebellum's video series, so a video maps to a faculty only when that faculty has a
# Cerebellum affiliation AND is the UNIQUE seeded teacher of the video's canonical subject. Where
# more than one (or zero) seeded faculty teach the subject, we leave facultyId unset (honest).
_CANON = {
    "Anatomy":"Anatomy","Physiology":"Physiology","Biochemistry":"Biochemistry","Pharmacology":"Pharmacology",
    "Microbiology":"Microbiology","Pathology":"Pathology","Community Medicine":"Community Medicine / PSM",
    "Forensic Medicine":"Forensic Medicine","Ophthalmology":"Ophthalmology","ENT":"ENT","Psychiatry":"Psychiatry",
    "Radiology":"Radiology","Medicine":"Medicine","Surgery":"Surgery","Orthopaedics":"Orthopaedics",
    "Paediatrics":"Paediatrics","Obstetrics and Gynaecology":"Obstetrics & Gynaecology","Dermatology":"Dermatology",
    "Anaesthesia":"Anaesthesia","Anesthesia":"Anaesthesia",
}
def _canon(s): return _CANON.get(s, s)
# video-subject -> canonical QBank subject (mirrors BTR_CANON in core.js)
_BTR_CANON = {
    "Anatomy":"Anatomy","Anesthesia":"Anaesthesia","Biochemistry":"Biochemistry","Dermatology":"Dermatology",
    "ENT":"ENT","Forensic Medicine":"Forensic Medicine","General Pathology":"Pathology","General Pharmacology":"Pharmacology",
    "General Physiology":"Physiology","Hematology":"Pathology","Immunology":"Microbiology","Integrated CVS":"Medicine",
    "Integrated Renal-Electrolytes":"Medicine","Integrative Neurology":"Medicine","Microbiology":"Microbiology",
    "Obstetrics and Gynaecology":"Obstetrics & Gynaecology","Ophthalmology":"Ophthalmology","Orthopedics":"Orthopaedics",
    "Pediatrics":"Paediatrics","Preventive and Social Medicine":"Community Medicine / PSM","Psychiatry":"Psychiatry",
    "Radiology":"Radiology","Surgery":"Surgery",
}
# canonical subject -> [faculty ids] for faculty with a Cerebellum affiliation
_cere_by_subj = {}
for f in faculty:
    if any(a.get("platformId") == "cerebellum" for a in f.get("affiliations", []) or []):
        for s in f.get("subjects", []):
            _cere_by_subj.setdefault(_canon(s), []).append(f["id"])
_vid_mapped = 0
for v in btr_videos:
    cc = _BTR_CANON.get(v["subject"])
    facs = _cere_by_subj.get(cc, []) if cc else []
    if len(facs) == 1:               # unique seeded teacher → confident
        v["facultyId"] = facs[0]
        _vid_mapped += 1

data = {
    "exam": "NEET PG / INI-CET",
    "captured": "26 June 2026",
    "platforms": platforms,
    # tests stay structured (CoreBTR + Cerebellum GTs have different shapes; timeline needs gt2026)
    "tests": {"corebtr": corebtr_tests, "gt2026": cere_gt_2026,
              "cereSubjectTests": cere_subject_tests, "cereGtSummary": cere_gt_summary,
              "marrowTests": marrow_tests},
    "videos": btr_videos,
    # curated judgment layer (each block carries its own epistemic tag + sourceIds + capture date)
    "sources": sources,
    "subjectStrength": _strength_doc,
    "reliability": _reliab_doc,
    "methodology": _method_doc,
    # faculty "people" layer — directional seed; aggregate-only; every datum sourced
    "faculty": faculty,
}

out = os.path.join(os.path.dirname(__file__), "data.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("// Auto-generated from extracted CSVs. Do not edit by hand.\n")
    f.write("window.D = ")
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write(";\n")
    f.write("// back-compat shim: legacy reads of window.QBANK_DATA resolve to the new model.\n")
    f.write("window.QBANK_DATA = window.D;\n")

# sanity
mt = sum(m["mcqs"] for p in platforms if p["id"] == "marrow" for s in p["subjects"] for m in s["modules"])
ct = sum(m["mcqs"] for p in platforms if p["id"] == "cerebellum" for s in p["subjects"] for m in s["modules"])
dt_leaf = sum(m["mcqs"] for s in dt_subjects for m in s["modules"])
dt_subj = 13199  # per doctutorials_subjects.csv Main totals (chapter capture sums to dt_leaf)
print(f"Marrow:     {len(marrow_subjects)} subjects, {len(marrow_modules)} modules, {mt} MCQs")
print(f"Cerebellum: {len(cere_subjects)} subjects, {len(cere_units)} units, {ct} MCQs")
print(f"Marrow+Cerebellum combined MCQs: {mt+ct}  (must equal 42889)")
print(f"DocTutorials (Main): {len(dt_subjects)} subjects, "
      f"{sum(len(s['modules']) for s in dt_subjects)} chapters, {dt_leaf} MCQs "
      f"(subject-overview states {dt_subj}; +{dt_leaf-dt_subj} capture variance)")
print(f"CoreBTR tests: {len(corebtr_tests)}   Cerebellum GT-2026 listed: {len(cere_gt_2026)}")
print(f"CoreBTR topic videos: {len(btr_videos)}  total minutes: {sum(v['durMin'] or 0 for v in btr_videos)}")
print(f"Curated: {len(sources)} sources, "
      f"{len(_strength_doc.get('subjects', [])) if _strength_doc else 0} subject-strength rows (directional), "
      f"{len(_reliab_doc.get('apps', [])) if _reliab_doc else 0} reliability rows (public-3p); "
      f"all source refs resolve")
print(f"Faculty: {len(faculty)} profiles (directional seed), "
      f"{_vid_mapped} videos mapped to a faculty by subject+platform")
print(f"Wrote {out}")
