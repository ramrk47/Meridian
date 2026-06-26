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
lines = open(f"{DOWNLOADS}/cerebellum_tests.csv", encoding="utf-8").read().splitlines()
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

data = {
    "captured": "26 June 2026",
    "marrow": {"subjects": marrow_subjects, "modules": marrow_modules, "tests": marrow_tests},
    "cerebellum": {"subjects": cere_subjects, "units": cere_units,
                   "subjectTests": cere_subject_tests, "gtSummary": cere_gt_summary, "gt2026": cere_gt_2026},
    "corebtr": {"tests": corebtr_tests},
    "videos": btr_videos,
}

out = os.path.join(os.path.dirname(__file__), "data.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("// Auto-generated from extracted CSVs. Do not edit by hand.\n")
    f.write("window.QBANK_DATA = ")
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write(";\n")

# sanity
mt = sum(s["mcqs"] for s in marrow_subjects)
ct = sum(s["mcqs"] for s in cere_subjects)
print(f"Marrow subjects: {len(marrow_subjects)}  modules: {len(marrow_modules)}  MCQs: {mt}")
print(f"Cerebellum subjects: {len(cere_subjects)}  units: {len(cere_units)}  MCQs: {ct}")
print(f"CoreBTR tests: {len(corebtr_tests)}")
print(f"Cerebellum subject-tests: {len(cere_subject_tests)}  GT-2026 listed: {len(cere_gt_2026)}")
print(f"Combined MCQs: {mt+ct}")
print(f"CoreBTR topic videos: {len(btr_videos)}  total minutes: {sum(v['durMin'] or 0 for v in btr_videos)}")
print(f"Wrote {out}")
