#!/usr/bin/env python3
"""Convert all extracted CSVs into a single embedded data.js for the dashboard."""
import csv, json, os, re, zipfile
from xml.etree import ElementTree as ET

RAW = os.path.join(os.path.dirname(__file__), "_raw")
DOWNLOADS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def rd(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.reader(f))

# ---------- minimal stdlib .xlsx reader (no openpyxl dependency) ----------
# Reads a workbook into {sheet_name: [ [cellval,...], ... ]} preserving column
# position (gaps become ""). Used for the community PYQ-importance masterlist.
_XL_M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
_XL_R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

def _xl_colnum(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):
        n = n * 26 + (ord(ch) - 64)
    return n

def read_xlsx(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(f"{_XL_M}si"):
            shared.append("".join(t.text or "" for t in si.iter(f"{_XL_M}t")))
    rels = {r.get("Id"): r.get("Target")
            for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    out = {}
    for s in wb.find(f"{_XL_M}sheets"):
        name = s.get("name")
        tgt = rels[s.get(f"{_XL_R}id")]
        member = tgt if tgt.startswith("xl/") else "xl/" + tgt
        rows = []
        for row in ET.fromstring(z.read(member)).find(f"{_XL_M}sheetData").findall(f"{_XL_M}row"):
            cells = {}
            for c in row.findall(f"{_XL_M}c"):
                t = c.get("t"); v = c.find(f"{_XL_M}v"); isn = c.find(f"{_XL_M}is")
                if t == "s" and v is not None:
                    val = shared[int(v.text)]
                elif t == "inlineStr" and isn is not None:
                    val = "".join(x.text or "" for x in isn.iter(f"{_XL_M}t"))
                elif v is not None:
                    val = v.text
                else:
                    val = None
                if val is not None and str(val).strip() != "":
                    cells[_xl_colnum(c.get("r"))] = str(val).strip()
            width = max(cells) if cells else 0
            rows.append([cells.get(i, "") for i in range(1, width + 1)])
        out[name] = rows
    return out

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

# ---------- PrepLadder + eGurukul (Phase 1d Stage 2: the last 2 platforms) ----------
# Lecture/video platforms (kind="lecture") integrated so the canonical spine can map
# ALL FIVE platforms. They carry NO measured MCQ totals (mcqs=null) — the measured MCQ
# figure stays 56,091 (Marrow + Cerebellum + DocTutorials only). Module/topic COUNTS are
# tracked separately. We read the canonical base CSVs only (the (1)/(2) copies are
# byte-identical dups). qcount = the raw per-module/topic question count from capture,
# kept for transparency but deliberately NOT summed into any MCQ rollup.
NP = f"{RAW}/NewPlatforms"

def _prepladder_platform():
    by_subj, order = {}, []
    for row in rd(f"{NP}/prepladder_modules.csv")[1:]:
        if len(row) < 3 or not row[1]:
            continue
        prof, subject, module = row[0], row[1], row[2]
        qc = row[3] if len(row) > 3 else ""
        if subject not in by_subj:
            by_subj[subject] = []; order.append(subject)
        by_subj[subject].append({"prof": prof, "name": module,
                                 "qcount": int(qc) if qc.isdigit() else None})
    subs = []
    for subject in order:
        mods = [{"id": "p-" + slug(subject, m["name"])[:80] + f"-{i}", "category": None,
                 "name": m["name"], "mcqs": None, "qcount": m["qcount"], "prof": m["prof"],
                 "rating": None, "priority": 1, "hyScore": 0.0}
                for i, m in enumerate(by_subj[subject])]
        subs.append({"subject": subject, "modules": mods})
    return {"id": "prepladder", "name": "PrepLadder", "kind": "lecture",
            "color": "#7a6a3c", "cls": "p", "subjects": subs}

def _egurukul_platform():
    by_subj, order = {}, []
    for row in rd(f"{NP}/egurukul_topics.csv")[1:]:
        if len(row) < 2 or not row[0]:
            continue
        subject, topic = row[0], row[1]
        qc = row[2] if len(row) > 2 else ""
        if subject not in by_subj:
            by_subj[subject] = []; order.append(subject)
        by_subj[subject].append({"name": topic, "qcount": int(qc) if qc.isdigit() else None})
    subs = []
    for subject in order:
        mods = [{"id": "e-" + slug(subject, t["name"])[:80] + f"-{i}", "category": None,
                 "name": t["name"], "mcqs": None, "qcount": t["qcount"],
                 "rating": None, "priority": 1, "hyScore": 0.0}
                for i, t in enumerate(by_subj[subject])]
        subs.append({"subject": subject, "modules": mods})
    return {"id": "egurukul", "name": "eGurukul (DBMCI)", "kind": "lecture",
            "color": "#6a5a86", "cls": "e", "subjects": subs}

prepladder = _prepladder_platform()
egurukul = _egurukul_platform()

# ---------- canonical subject map (Python mirror of js/core.js CANON outputs) ----------
# Native platform / sheet subject name -> the single canonical subject string the app
# groups on. MUST stay in sync with the canonical OUTPUTS of CANON in js/core.js.
CANON = {
    "Anatomy": "Anatomy", "Physiology": "Physiology", "Biochemistry": "Biochemistry",
    "Pharmacology": "Pharmacology", "Microbiology": "Microbiology", "Pathology": "Pathology",
    "Community Medicine": "Community Medicine / PSM", "Preventive & Social Medicine": "Community Medicine / PSM",
    "PSM": "Community Medicine / PSM", "Forensic Medicine": "Forensic Medicine",
    "Ophthalmology": "Ophthalmology", "ENT": "ENT", "Anaesthesia": "Anaesthesia", "Anesthesia": "Anaesthesia",
    "Dermatology": "Dermatology", "Psychiatry": "Psychiatry", "Radiology": "Radiology", "Medicine": "Medicine",
    "Surgery": "Surgery", "Orthopaedics": "Orthopaedics", "Orthopedics": "Orthopaedics",
    "Paediatrics": "Paediatrics", "Pediatrics": "Paediatrics",
    "Obstetrics & Gynaecology": "Obstetrics & Gynaecology", "Obstetrics & Gynecology": "Obstetrics & Gynaecology",
    "Gynaecology & Obstetrics": "Obstetrics & Gynaecology", "OB & G": "Obstetrics & Gynaecology",
    "OBG": "Obstetrics & Gynaecology", "Obs & Gynae": "Obstetrics & Gynaecology",
}
def canon(s): return CANON.get(s, s)

# ---------- Canonical Topic Library & Importance Spine (Phase 1d) ----------
# Parse the community-curated PYQ-importance masterlist into a canonical
# Subject -> Section -> Topic library. importance is DERIVED from PYQ frequency
# (Times Repeated) + the curator's priority band; epistemic = directional. We omit
# the author's personal revision-tracking columns. No counts/mappings are fabricated:
# a missing datum stays null. platformRefs{} is filled later by the mapping stage.
ML_PATH = f"{RAW}/curated/Masterlist_topic_importance.xlsx"
# masterlist SHEET name -> native subject string fed through canon()
ML_SHEET_SUBJECT = {
    "SURGERY": "Surgery", "OBG": "Obstetrics & Gynaecology", "PATHOLOGY": "Pathology",
    "PHARMACOLOGY": "Pharmacology", "MICROBIOLOGY": "Microbiology", "FORENSIC": "Forensic Medicine",
    "PEDIATRICS": "Paediatrics", "BIOCHEMISTRY": "Biochemistry", "MEDICINE": "Medicine",
    "PSM": "Community Medicine / PSM", "ORTHO": "Orthopaedics", "PSYCHIATRY": "Psychiatry",
    "PHYSIOLOGY": "Physiology", "ENT": "ENT", "OPHTHAL": "Ophthalmology", "DERMATOLOGY": "Dermatology",
    "ANATOMY": "Anatomy", "RADIOLOGY": "Radiology", "ANAESTHESIA": "Anaesthesia",
}
_HEADER_KEYS = ("number", "no.", "sl", "s.no")
_PRI_W = {"High": 1.0, "Moderate": 0.55, "Low": 0.25}
_TIMES_CAP = 6  # >99% of topics repeat ≤6×; a couple of outliers (9,15) clamp here

def _ml_norm_priority(raw):
    if not raw: return None
    p = raw.strip().capitalize()
    return p if p in _PRI_W else None

def _ml_priority_from_times(times):
    if times is None: return "Low"
    return "High" if times >= 3 else "Moderate" if times == 2 else "Low"

def _ml_importance(times, priority):
    tn = min(times or 1, _TIMES_CAP) / _TIMES_CAP
    pw = _PRI_W.get(priority, 0.25)
    return round(0.65 * tn + 0.35 * pw, 3)

_TIER = {"High": 3, "Moderate": 2, "Low": 1}

def _ml_split_aliases(cell):
    # "Inguinal Hernia, Hernia" -> ("Inguinal Hernia", ["Hernia"]); strip trailing commas/space
    parts = [p.strip() for p in cell.split(",") if p.strip()]
    if not parts: return cell.strip(), []
    return parts[0], parts[1:]

def build_library():
    if not os.path.exists(ML_PATH):
        print(f"WARN: masterlist {ML_PATH} missing — D.library skipped")
        return None
    book = read_xlsx(ML_PATH)
    subjects_out = []
    tid = 0
    for sheet, native in ML_SHEET_SUBJECT.items():
        rows = book.get(sheet)
        if not rows:
            print(f"WARN: masterlist sheet {sheet!r} missing/empty — skipped")
            continue
        subj = canon(native)
        pos = {"num": 0, "topic": 1, "times": 2, "pyq": 3, "pri": 4, "src": 5}  # 0-based defaults A–F
        sections, cur = [], None
        for r in rows:
            def g(k):
                i = pos[k]
                return r[i].strip() if i < len(r) and r[i] else ""
            a, b = g("num"), g("topic")
            al, bl = a.lower(), b.lower()
            # header row -> remap column positions by fuzzy header text
            if (al in _HEADER_KEYS or al.startswith("number")) and "topic" in bl:
                for i, cell in enumerate(r):
                    lc = (cell or "").strip().lower()
                    if lc.startswith("number") or lc in _HEADER_KEYS: pos["num"] = i
                    elif "topic" in lc: pos["topic"] = i
                    elif "times" in lc or "repeat" in lc: pos["times"] = i
                    elif "pyq" in lc or "asked" in lc: pos["pyq"] = i
                    elif "priorit" in lc: pos["pri"] = i
                    elif "source" in lc: pos["src"] = i
                continue
            times_raw = g("times"); pri_raw = g("pri")
            is_topic = bool(b) and (a.replace(".", "").isdigit() or times_raw or pri_raw)
            if is_topic:
                if cur is None:
                    cur = {"name": "(uncategorized)", "topics": []}
                    sections.append(cur)
                times = int(times_raw) if times_raw.replace(".", "").isdigit() else None
                priority = _ml_norm_priority(pri_raw) or _ml_priority_from_times(times)
                name, aliases = _ml_split_aliases(b)
                tid += 1
                cur["topics"].append({
                    "id": "lib-" + slug(subj, name)[:70] + f"-{tid}",
                    "name": name, "aliases": aliases,
                    "timesRepeated": times, "priority": priority,
                    "pyqAngle": g("pyq") or None, "sourceRec": g("src") or None,
                    "importance": _ml_importance(times, priority),
                    "tier": _TIER[priority], "platformRefs": {},
                })
            elif a and not b:
                cur = {"name": a, "topics": []}
                sections.append(cur)
        # drop empty sections (e.g. a stray header with no rows beneath)
        sections = [s for s in sections if s["topics"]]
        subjects_out.append({"subject": subj, "sheet": sheet, "sections": sections})
    return {
        "source": {"id": "src-masterlist-pyq-reddit",
                   "label": "Community-curated PYQ-importance masterlist (Reddit)",
                   "epistemic": "directional", "captured": "2026-06-27"},
        "subjects": subjects_out,
    }

library = build_library()

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
    prepladder,   # kind="lecture" — no MCQ totals; integrated for the canonical spine
    egurukul,     # kind="lecture" — no MCQ totals; integrated for the canonical spine
]

# ---------- Stage 3: map all 5 platforms → canonical topics (the spine) ----------
# Anchor on the canonical topic names+aliases; for each canonical topic, find the
# platform leaves (in the SAME canonical subject) that confidently name the same thing.
# HIGH PRECISION over recall: only confident matches are recorded; everything else
# stays unmapped and is reported. No forced matches → no false coverage. The result
# fills library topic.platformRefs{platformId:[leafIds]} and a coverage scorecard.
# (The legacy js sim()/toksC() token matcher is kept only as a runtime fallback hint
# in the qbank drawer — this build-time map is the source of truth for coverage.)
_MAP_STOP = set((
    "and the of for with system systems disease diseases disorder disorders its his amp "
    "general basic concepts tricks magics drug drugs management basics introduction clinical "
    "miscellaneous related part type types other others overview approach study notes video "
    "main rr in to a an by on or "
).split())

# Spelling normalization (British⇄American) + true-synonym canonicalization. These are
# genuine same-thing rewrites, applied symmetrically to BOTH sides — normalization, not
# forcing. Kept deliberately conservative (only unambiguous medical synonyms).
def _spell(s):
    s = s.replace("oe", "e").replace("ae", "e")
    s = re.sub(r"our\b", "or", s)          # tumour→tumor, colour→color
    return s

_SYN = {
    "cancer": "carcinoma", "cancers": "carcinoma", "carcinomas": "carcinoma",
    "tumour": "tumor", "tumours": "tumor", "tumors": "tumor",
}
def _syn(tok):
    if tok in _SYN:
        return _SYN[tok]
    # light plural stem (only longer tokens; avoids butchering short terms)
    if len(tok) > 4 and tok.endswith("s") and not tok.endswith("ss"):
        tok = tok[:-1]
    return tok

def _norm(s):
    return _spell(re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", (s or "").lower())).strip())

def _toks(s):
    return {_syn(w) for w in _norm(s).split() if len(w) > 2 and w not in _MAP_STOP}

# Split a topic name into the distinct entities it lists. A masterlist topic is often
# a compound ("Rheumatic Heart disease and Infective endocarditis", "Thyroid Nodule, Goitre")
# — each conjunct is its own matchable entity. We deliberately do NOT use a loose token-
# overlap path (it mis-merges sibling variants that share a generic noun, e.g. Fungal vs
# Bacterial Corneal Ulcer, OHSS vs PCOS) — only exact / word-bounded-substring / token-subset.
# Generic head / region nouns: descriptive, never specific enough to confirm a topic on
# their own (e.g. "syndrome", "genital", "anatomy"). A lone generic token must NOT establish
# a match — otherwise "Genetics and syndrome" would claim every "…Syndrome" module.
_GENERIC = set((
    "syndrome anatomy physiology infection infections tumor tumour lesion lesions anomaly "
    "anomalies defect defects fracture fractures surgery region gland glands nerve nerves "
    "muscle muscles artery arteries vein veins bone bones reflex reflexes pregnancy fluid "
    "function functions deficiency malignancy benign acute chronic carcinoma cancer genital "
    "neoplasm neoplasms tract organ organs cavity canal congenital metabolism pathway pathways "
    # generic process / region / category words (over-claim coverage on their own)
    "vaginal vagina synthesis complication learning delivery production storage classification "
    "screening prevention staging grading scoring schedule development"
).split())

_CONNECTORS = re.compile(r"\s*(?:/|,|&|\band\b|\bwith\b|\bor\b)\s*", re.I)

def _phrases(name):
    parts = [p.strip() for p in _CONNECTORS.split(name) if p and p.strip()]
    out = [name]
    for p in parts:
        if p != name and _toks(p):   # only conjuncts that carry a significant token
            out.append(p)
    return out

def _phrase_match(canon_name, leaf_str):
    """Confidence 0..1 that leaf_str names the same topic as canon_name (anchor=canon).
    Precision-first: exact, then word-bounded substring of a substantial phrase, then
    token-subset either way. No loose overlap path → no sibling-variant false coverage."""
    nc, nl = _norm(canon_name), _norm(leaf_str)
    if not nc or not nl:
        return 0.0
    if nc == nl:
        return 1.0
    tc, tl = _toks(canon_name), _toks(leaf_str)
    # whole-phrase substring (word-bounded), only for substantial multi-token phrases —
    # guards a short generic token from over-matching ("ulcer" inside "peptic ulcer disease").
    if len(nc) >= 6 and (f" {nc} " in f" {nl} " or f" {nl} " in f" {nc} "):
        if len(tc) >= 2 or len(nc) >= 8:
            return 0.95
    if not tc or not tl:
        return 0.0
    # every significant canonical token present in the leaf → leaf covers this entity
    if tc <= tl:
        if len(tc) >= 2:
            # reject if EVERY canonical token is a generic head/region noun (no specific anchor)
            if all(t in _GENERIC for t in tc):
                return 0.0
            return 0.9
        # a single, distinctive token (e.g. "glaucoma", "achalasia", "uveitis") — never a
        # bare generic noun ("syndrome", "genital"), which would over-claim coverage.
        (only,) = tuple(tc)
        if len(only) >= 7 and only not in _GENERIC:
            return 0.8
        return 0.0
    # leaf fully inside canonical (leaf is the narrower phrasing of this entity)
    if tl <= tc and len(tl) >= 2:
        return 0.82
    return 0.0

_MATCH_THRESHOLD = 0.78

# Curated recall-recovery overlay (Mapping Audit, ultracode): verified platform→topic
# maps the precision-first matcher missed on granularity/naming. Each entry is gated by
# propose→refute agents; this build only MERGES survivors that pass strict structural
# validation (leaf exists, belongs to the named platform, SAME canonical subject as the
# topic). No spine edits — only platformRefs grow. Absent file → identical to pre-overlay.
MAP_OVERRIDES_PATH = f"{RAW}/curated/mapping_overrides.json"

def _apply_map_overrides(topic_index, leaf_index):
    """Merge the curated overlay into topic.platformRefs (additions) and drop verified false-positive
    links (removals). Returns (added_links, added_leaf_refs, removed_links, rejections[]). added_links =
    NEW (topic,platform) coverage edges; removed_links = existing edges deleted; rejections are logged."""
    if not os.path.exists(MAP_OVERRIDES_PATH):
        return 0, 0, 0, []
    with open(MAP_OVERRIDES_PATH, encoding="utf-8") as f:
        doc = json.load(f)
    pids = {p["id"] for p in platforms}
    added_links = added_refs = removed_links = 0
    rejections = []
    # removals FIRST: drop the matcher's confirmed false-positive links (homonym / generic-noun)
    # before additions, so a correct overlay leaf for the same (topic,platform) can re-establish the
    # link via the right leaf rather than being nuked alongside the bad one.
    for r in doc.get("removals", []):
        tid, pid = r.get("topicId"), r.get("platformId")
        ent = topic_index.get(tid)
        if not ent:
            rejections.append(("removal-unknown-topic", tid, pid, None)); continue
        refs = ent[1]["platformRefs"]
        if pid not in refs:
            rejections.append(("removal-no-such-link", tid, pid, None)); continue
        # Condemn the whole spurious LINK (the skeptics flagged the topic↔platform edge as a
        # homonym/generic-noun false positive). Any genuinely-correct leaf is re-established by a
        # verified addition below (additions run after removals). leafIds in the removal are advisory.
        del refs[pid]; removed_links += 1
    for m in doc.get("mappings", []):
        tid, pid = m.get("topicId"), m.get("platformId")
        leaf_ids = [l for l in (m.get("leafIds") or []) if l]
        ent = topic_index.get(tid)
        if not ent:
            rejections.append(("unknown-topic", tid, pid, leaf_ids)); continue
        t_subj, topic = ent
        if pid not in pids:
            rejections.append(("unknown-platform", tid, pid, leaf_ids)); continue
        valid = []
        for lid in leaf_ids:
            li = leaf_index.get(lid)
            if not li:
                rejections.append(("unknown-leaf", tid, pid, lid)); continue
            l_pid, l_subj = li
            if l_pid != pid:
                rejections.append(("leaf-platform-mismatch", tid, pid, lid)); continue
            if l_subj != t_subj:  # granularity recovery stays within the canonical subject
                rejections.append(("cross-subject", tid, pid, lid)); continue
            valid.append(lid)
        if not valid:
            continue
        refs = topic["platformRefs"]
        was_covered = pid in refs
        cur = refs.setdefault(pid, [])
        for lid in valid:
            if lid not in cur:
                cur.append(lid); added_refs += 1
        if not was_covered:
            added_links += 1
    return added_links, added_refs, removed_links, rejections

def map_platforms_to_library():
    if not library:
        return None
    # index every platform leaf by canonical subject (skip non-library subjects e.g. PYQ papers)
    lib_subjects = {s["subject"] for s in library["subjects"]}
    leaves_by_subj = {}
    leaf_total = {p["id"]: 0 for p in platforms}
    leaf_index = {}  # leafId -> (platformId, canonicalSubject) — for overlay validation
    for p in platforms:
        for s in p["subjects"]:
            cs = canon(s["subject"])
            if cs not in lib_subjects:
                continue
            for m in s["modules"]:
                leaf_total[p["id"]] += 1
                leaf_index[m["id"]] = (p["id"], cs)
                leaves_by_subj.setdefault(cs, []).append(
                    {"pid": p["id"], "id": m["id"], "name": m["name"], "cat": m.get("category")})
    leaf_mapped = {p["id"]: set() for p in platforms}  # leaf ids that hit ≥1 canonical topic
    topic_index = {}  # topicId -> (canonicalSubject, topic) — for overlay validation
    # Pass 1: fill every topic's platformRefs from the precision-first matcher.
    for subj in library["subjects"]:
        cs = subj["subject"]
        pool = leaves_by_subj.get(cs, [])
        for sec in subj["sections"]:
            for t in sec["topics"]:
                topic_index[t["id"]] = (cs, t)
                # candidate phrases: the name, each alias, and each conjunct entity within them
                names = []
                for raw in [t["name"]] + (t["aliases"] or []):
                    for ph in _phrases(raw):
                        if ph not in names:
                            names.append(ph)
                refs = {}
                for leaf in pool:
                    score = 0.0
                    for nm in names:
                        score = max(score, _phrase_match(nm, leaf["name"]))
                        if leaf["cat"]:  # a leaf's category can also name the topic
                            score = max(score, _phrase_match(nm, leaf["cat"]) * 0.9)
                        if score >= 1.0:
                            break
                    if score >= _MATCH_THRESHOLD:
                        refs.setdefault(leaf["pid"], []).append(leaf["id"])
                        leaf_mapped[leaf["pid"]].add(leaf["id"])
                t["platformRefs"] = refs
    # Pass 2: merge the curated recall-recovery overlay (validated; absent file = no-op).
    cur_links, cur_refs, cur_removed, cur_rej = _apply_map_overrides(topic_index, leaf_index)
    if cur_links or cur_refs or cur_removed or cur_rej:
        print(f"Mapping overlay: +{cur_links} topic-platform links, +{cur_refs} leaf refs, "
              f"-{cur_removed} false-positive links removed, {len(cur_rej)} rejected by validator")
        for kind, tid, pid, lid in cur_rej[:20]:
            print(f"  reject [{kind}] topic={tid} platform={pid} leaf={lid}")
    # Pass 3: rebuild leaf_mapped from the FINAL refs (so additions/removals are reflected), then tally.
    leaf_mapped = {p["id"]: set() for p in platforms}
    for subj in library["subjects"]:
        for sec in subj["sections"]:
            for t in sec["topics"]:
                for pid, lids in t["platformRefs"].items():
                    leaf_mapped.setdefault(pid, set()).update(lids)
    cov = {p["id"]: {"hyCovered": 0, "hyTotal": 0, "topicsCovered": 0, "topicsTotal": 0}
           for p in platforms}
    for subj in library["subjects"]:
        for sec in subj["sections"]:
            for t in sec["topics"]:
                refs = t["platformRefs"]
                for p in platforms:
                    cov[p["id"]]["topicsTotal"] += 1
                    if t["tier"] == 3:
                        cov[p["id"]]["hyTotal"] += 1
                    if p["id"] in refs:
                        cov[p["id"]]["topicsCovered"] += 1
                        if t["tier"] == 3:
                            cov[p["id"]]["hyCovered"] += 1
    # finalize per-platform scorecard
    platform_cov = []
    for p in platforms:
        c = cov[p["id"]]
        mapped = len(leaf_mapped[p["id"]])
        total = leaf_total[p["id"]]
        platform_cov.append({
            "platformId": p["id"], "name": p["name"], "kind": p["kind"],
            "hyCovered": c["hyCovered"], "hyTotal": c["hyTotal"],
            "hyPct": round(100 * c["hyCovered"] / c["hyTotal"]) if c["hyTotal"] else 0,
            "topicsCovered": c["topicsCovered"], "topicsTotal": c["topicsTotal"],
            "topicsPct": round(100 * c["topicsCovered"] / c["topicsTotal"]) if c["topicsTotal"] else 0,
            "leavesMapped": mapped, "leavesUnmapped": total - mapped, "leavesTotal": total,
        })
    # topics with NO platform at all (gaps the spine flags honestly)
    topics_all = [t for s in library["subjects"] for sec in s["sections"] for t in sec["topics"]]
    topics_any = sum(1 for t in topics_all if t["platformRefs"])
    hy_all = [t for t in topics_all if t["tier"] == 3]
    hy_any = sum(1 for t in hy_all if t["platformRefs"])
    return {
        "matcher": "name+alias normalized token match, anchored on canonical topics; "
                   f"threshold {_MATCH_THRESHOLD}; precision-first (unmapped over forced); "
                   "+ curated recall-recovery overlay (propose→refute verified, granularity-aware)",
        "curatedLinks": cur_links, "curatedLeafRefs": cur_refs,
        "topicsTotal": len(topics_all), "topicsWithAnyPlatform": topics_any,
        "hyTotal": len(hy_all), "hyWithAnyPlatform": hy_any,
        "platforms": platform_cov,
    }

library_coverage = map_platforms_to_library()
if library:
    library["coverage"] = library_coverage

# ---------- Previous-Year-Question seams → D.pyq (Phase 2b, Stage 1) ----------
# The strongest HONEST yield signal we hold: actual past-exam question counts, captured
# per platform → epistemic = measured. Four platforms expose PYQ banks (Marrow, DocTutorials,
# PrepLadder, eGurukul); Cerebellum has NO PYQ capture and is shown as such (never fabricated).
# Adjacent revision sets (DocTutorials QRP, eGurukul Express) are captured too but tagged
# distinctly (kind="qrp"/"express") so they never masquerade as past papers.
# IMPORTANT: these counts are a SEPARATE block — they are NOT summed into the 56,091 measured
# QBank-MCQ figure. Marrow's PYQ papers already live as marrow leaves (subject "Previous Year
# Question Papers"), so we REUSE their existing leaf ids → ticking a paper here unions with the
# QBank tracker. The other platforms' PYQ/QRP/Express rows get fresh "pyq-*" ids.
_PYQ_SUBJ_EXTRA = {
    "OBS": "Obstetrics & Gynaecology", "Gynaecology": "Obstetrics & Gynaecology",
}
def canon_loose(s):
    c = canon(s)
    return _PYQ_SUBJ_EXTRA.get(s, c) if c == s else c

_MARROW_PYQ_CAT = {
    "ANATOMY": "Anatomy", "PHYSIOLOGY": "Physiology", "BIOCHEMISTRY": "Biochemistry",
    "PHARMACOLOGY": "Pharmacology", "MICROBIOLOGY": "Microbiology", "PATHOLOGY": "Pathology",
    "COMMUNITY MEDICINE": "Community Medicine / PSM", "FORENSIC MEDICINE": "Forensic Medicine",
    "OPHTHALMOLOGY": "Ophthalmology", "ENT": "ENT", "ANESTHESIA": "Anaesthesia",
    "DERMATOLOGY": "Dermatology", "PSYCHIATRY": "Psychiatry", "RADIOLOGY": "Radiology",
    "MEDICINE": "Medicine", "SURGERY": "Surgery", "ORTHOPEDICS": "Orthopaedics",
    "PEDIATRICS": "Paediatrics", "OBSTETRICS AND GYNECOLOGY": "Obstetrics & Gynaecology",
}
def _marrow_pyq_subject(cat):
    c = (cat or "").strip().upper()
    if c in _MARROW_PYQ_CAT:
        return _MARROW_PYQ_CAT[c]
    first = c.split()[0] if c.split() else c   # malformed merged rows e.g. "ENT AIIMS 2017"
    return _MARROW_PYQ_CAT.get(first, canon(cat.title()))

def _parse_exam_year(label):
    """label → (exam, year). exam ∈ {NEET PG, INI-CET, FMGE, AIIMS} or None; year int or None.
    Order matters: FMGE → INI-CET (incl. legacy INICET / 'INI CET') → AIIMS → NEET."""
    s = (label or "").upper()
    my = re.search(r"(19|20)\d{2}", s)
    year = int(my.group(0)) if my else None
    if "FMGE" in s:
        exam = "FMGE"
    elif "INI" in s:                      # INI-CET / INICET / INI CET
        exam = "INI-CET"
    elif "AIIMS" in s:                    # legacy AIIMS PG (pre-INI-CET)
        exam = "AIIMS"
    elif "NEET" in s:
        exam = "NEET PG"
    else:
        exam = None
    return exam, year

def build_pyq():
    EXAMS = ["NEET PG", "INI-CET", "FMGE", "AIIMS"]
    plat_meta = {p["id"]: p for p in platforms}
    papers = []   # flat trackable units: {id, platformId, setKind, subject, label, exam, year, count}

    def add(pid, set_kind, subject, label, count, pid_for_id=None):
        c = count if isinstance(count, int) else 0
        exam, year = _parse_exam_year(label)
        papers.append({
            "id": pid_for_id or ("pyq-" + slug(pid, set_kind, subject, label)[:88] + f"-{len(papers)}"),
            "platformId": pid, "setKind": set_kind, "subject": canon_loose(subject),
            "label": label.strip(), "exam": exam, "year": year, "count": c,
        })

    # 1) Marrow — reuse existing leaf ids (unions with the QBank tracker)
    for m in marrow_modules:
        if m["subject"] != "Previous Year Question Papers":
            continue
        add("marrow", "pyq", _marrow_pyq_subject(m["category"]), m["module"], m["mcqs"], pid_for_id=m["id"])

    # 2) DocTutorials — PYQ (past papers) + QRP (quick-revision sets)
    if os.path.exists(DT_PATH):
        for row in rd(DT_PATH)[1:]:
            if len(row) < 4:
                continue
            section, subject, chapter, mcq = row[0], row[1], row[2], row[3]
            kind = "pyq" if section == "PYQ" else "qrp" if section == "QRP" else None
            if not kind:
                continue
            add("doctutorials", kind, subject, chapter, int(mcq) if mcq.isdigit() else 0)

    # 3) PrepLadder — PYQ by subject × exam/year
    PL_PYQ = f"{NP}/prepladder_pyq.csv"
    if os.path.exists(PL_PYQ):
        for row in rd(PL_PYQ)[1:]:
            if len(row) < 3 or not row[0]:
                continue
            subject, label, qc = row[0], row[1], row[2]
            add("prepladder", "pyq", subject, label, int(qc) if qc.isdigit() else 0)

    # 4) eGurukul — PYQ (past papers) + Express (revision question bank)
    EG_OTHER = f"{NP}/egurukul_other.csv"
    if os.path.exists(EG_OTHER):
        for row in rd(EG_OTHER)[1:]:
            if len(row) < 4 or not row[1]:
                continue
            section, subject, topic, qc = row[0], row[1], row[2], row[3]
            kind = "pyq" if section == "PYQ" else "express" if section.startswith("Express") else None
            if not kind:
                continue
            add("egurukul", kind, subject, topic, int(qc) if qc.isdigit() else 0)

    # per-platform rollups (+ honest "no capture" entry for Cerebellum)
    SET_LABEL = {"pyq": "Past papers", "qrp": "Quick-revision sets (QRP)", "express": "Express question bank"}
    plats_out = []
    for p in platforms:
        pid = p["id"]
        mine = [x for x in papers if x["platformId"] == pid]
        sets = []
        for sk in ("pyq", "qrp", "express"):
            sub = [x for x in mine if x["setKind"] == sk]
            if not sub:
                continue
            sets.append({"kind": sk, "label": SET_LABEL[sk], "isPastPaper": sk == "pyq",
                         "questions": sum(x["count"] for x in sub), "paperCount": len(sub)})
        plats_out.append({
            "platformId": pid, "name": p["name"], "kind": p["kind"], "has": bool(mine),
            "questions": sum(x["count"] for x in mine), "paperCount": len(mine), "sets": sets,
        })

    pyq_papers = [x for x in papers if x["setKind"] == "pyq"]
    return {
        "captured": "26 June 2026",
        "epistemic": "measured",
        "measuredNote": ("Actual past-exam question counts captured per platform (measured). "
                         "Cerebellum exposes no PYQ bank in our capture. Quick-revision sets "
                         "(DocTutorials QRP, eGurukul Express) are measured too but flagged separately — "
                         "they are revision banks, not past papers."),
        "exams": EXAMS,
        "platforms": plats_out,
        "papers": papers,
        "totals": {
            "questions": sum(x["count"] for x in papers), "paperCount": len(papers),
            "pyqQuestions": sum(x["count"] for x in pyq_papers), "pyqPaperCount": len(pyq_papers),
            "platformsWithPyq": sum(1 for p in plats_out if any(s["kind"] == "pyq" for s in p["sets"])),
        },
    }

pyq_data = build_pyq()

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
# the canonical library must also reference a registered source (Phase 1d)
if library:
    referenced.add(library["source"]["id"])
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

# ---------- video → faculty attribution: INTENTIONALLY NOT EMITTED (neutrality firewall) ----------
# We previously derived D.videos[].facultyId by picking the UNIQUE seeded Cerebellum teacher of a
# video's canonical subject. That is a Meridian-side heuristic, NOT a source-backed fact: no entry in
# faculty_sources.json ties any specific CoreBTR clip to any specific person — the sources only confirm
# that a faculty teaches that subject on Cerebellum. Asserting it on individual video rows fabricates a
# person-level attribution the sources do not support, and surfacing it as "Faculty of record
# (directional)" mislabels a derived heuristic (which methodology.json defines as "proxy", not
# "directional"). Per the firewall (no fabrication; aggregate-only), we DROP the inference at the source:
# no facultyId is set on any video. The consuming surfaces already degrade honestly when it is absent
# (empty "Videos by" panels show "none attributed yet"; no "Faculty of record" chip renders).
# When a source actually attributes clips to people, populate facultyId from curated raw data here.
_vid_mapped = 0  # kept for the build summary; no videos are attributed to a person without a source

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
    # canonical Subject→Section→Topic library + PYQ-frequency importance spine (Phase 1d)
    # directional; platformRefs filled by the mapping stage below.
    "library": library,
    # previous-year-question seams (Phase 2b) — measured past-paper question counts per
    # platform (+ flagged QRP/Express revision sets). SEPARATE from the 56,091 QBank figure.
    "pyq": pyq_data,
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
_pl_mods = sum(len(s["modules"]) for s in prepladder["subjects"])
_eg_tops = sum(len(s["modules"]) for s in egurukul["subjects"])
print(f"PrepLadder: {len(prepladder['subjects'])} subjects, {_pl_mods} modules (lecture; mcqs=null)")
print(f"eGurukul:   {len(egurukul['subjects'])} subjects, {_eg_tops} topics (lecture; mcqs=null)")
print(f"Measured MCQs (Marrow+Cere+DocT only): {mt+ct+dt_leaf}  (must equal 56091)")
print(f"CoreBTR tests: {len(corebtr_tests)}   Cerebellum GT-2026 listed: {len(cere_gt_2026)}")
print(f"CoreBTR topic videos: {len(btr_videos)}  total minutes: {sum(v['durMin'] or 0 for v in btr_videos)}")
print(f"Curated: {len(sources)} sources, "
      f"{len(_strength_doc.get('subjects', [])) if _strength_doc else 0} subject-strength rows (directional), "
      f"{len(_reliab_doc.get('apps', [])) if _reliab_doc else 0} reliability rows (public-3p); "
      f"all source refs resolve")
print(f"Faculty: {len(faculty)} profiles (directional seed), "
      f"{_vid_mapped} videos mapped to a faculty by subject+platform")
if library:
    _lib_secs = sum(len(s["sections"]) for s in library["subjects"])
    _lib_tops = sum(len(sec["topics"]) for s in library["subjects"] for sec in s["sections"])
    _lib_hy = sum(1 for s in library["subjects"] for sec in s["sections"] for t in sec["topics"] if t["tier"] == 3)
    print(f"Library: {len(library['subjects'])} subjects, {_lib_secs} sections, {_lib_tops} topics "
          f"({_lib_hy} high-priority); importance directional (PYQ-frequency masterlist)")
if library_coverage:
    lc = library_coverage
    print(f"Mapping: {lc['topicsWithAnyPlatform']}/{lc['topicsTotal']} canonical topics covered by ≥1 platform; "
          f"high-yield {lc['hyWithAnyPlatform']}/{lc['hyTotal']}")
    for pc in lc["platforms"]:
        print(f"  {pc['name']:16s} HY {pc['hyCovered']:>3d}/{pc['hyTotal']:<3d} ({pc['hyPct']:>3d}%) · "
              f"topics {pc['topicsCovered']:>3d}/{pc['topicsTotal']} ({pc['topicsPct']:>3d}%) · "
              f"leaves mapped {pc['leavesMapped']:>4d}/{pc['leavesTotal']:<4d} unmapped {pc['leavesUnmapped']}")
if pyq_data:
    pt = pyq_data["totals"]
    print(f"PYQ seams: {pt['pyqPaperCount']} past-paper sets ({pt['pyqQuestions']} Qs) across "
          f"{pt['platformsWithPyq']} platforms + revision sets; {pt['paperCount']} total trackable units "
          f"(measured; SEPARATE from 56,091)")
    for pc in pyq_data["platforms"]:
        setsdesc = ", ".join(f"{s['kind']} {s['paperCount']}×/{s['questions']}Q" for s in pc["sets"]) or "no PYQ capture"
        print(f"  {pc['name']:16s} {'has' if pc['has'] else 'NONE':4s} · {setsdesc}")
print(f"Wrote {out}")
