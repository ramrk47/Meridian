# Prompt for Claude-in-Chrome — QBank data pull

Paste everything below the line into the Claude-in-Chrome extension. You're logged into all three
sites already (DocTutorials, PrepLadder, eGurukul).

---

You are collecting **question-bank structure data** from three NEET-PG prep platforms I'm logged
into. Be **systematic and exhaustive** — every section, every subject, every chapter/topic, with
its MCQ count. Work one platform at a time. Read page text (don't screenshot). When a section needs
drilling, open each subject one by one. At the end, output the data as **CSV code blocks** (one per
file, named exactly as below) so I can paste them into my repo. Do not summarise — give the raw rows.

The MCQ count usually appears as `0/N` (0 = my attempts, **N = total questions** — capture N).

## Platform 1 — DocTutorials  (app.doctutorials.com/question-bank)
Three tabs at the top: **Main**, **QRP**, **PYQs**. For EACH tab:
1. Read the subject grid → record every subject's "**N Chapters**" and "**0/M MCQs**" (M = total).
2. Then **open each subject** (click its card → URL becomes `/question-bank/topics/<id>/0`) and read
   the **chapter list with per-chapter MCQ counts**. Capture every chapter.
- IMPORTANT: verify the three tabs are actually different. In a quick check, **Main and PYQs showed
  identical subject totals** (e.g. Anatomy 47 ch / 714) while **QRP differed** (Anatomy 13 ch / 299).
  Confirm whether PYQs is genuinely distinct from Main or a duplicate, and note it.
- 19 subjects: Anatomy, Physiology, Biochemistry, Pathology, Microbiology, Pharmacology, Forensic
  Medicine, ENT, Ophthalmology, PSM, Medicine, Surgery, OB & G, Pediatrics, Anaesthesia,
  Dermatology, Orthopaedics, Psychiatry, Radiology.

Output two files:
- `doctutorials_subjects.csv` → columns: `section,subject,chapters,total_mcqs`  (section ∈ Main/QRP/PYQ)
- `doctutorials_chapters.csv` → columns: `section,subject,chapter,mcq_count`

## Platform 2 — PrepLadder  (prepladder.com/app/qbank)  [free-plan account]
A) **Learning Modules** (the main QBank): subjects are grouped by Prof (Prof 1, Prof 2, Final Prof
   Part 1, Part 2 Major, Part 2 Minor). Each subject shows "0/N completed" (N = module count).
   **Open each subject** and capture every **module/chapter name + its MCQ count**.
B) **PYQ's** (button on the QBank page → `/app/past-year-questions`): a **subject-wise PYQ** section.
   Open each subject and capture the PYQ breakdown (topic/year + question count). This is the
   topic-wise division of PYQs — gather it in full.
- 19 subjects (same list; PrepLadder spells it "Gynaecology & Obstetrics").

Output:
- `prepladder_modules.csv` → `prof,subject,module,mcq_count`
- `prepladder_subject_totals.csv` → `prof,subject,total_modules` (and total_mcqs if shown)
- `prepladder_pyq.csv` → `subject,topic_or_year,question_count`

## Platform 3 — eGurukul  (dashboard.egurukulapp.com/#/qblayer)
**Subject Wise QB**: 19 subjects → each subject opens to **Topics (N)** → each topic has questions
shown as `0/K Questions` (K = total). For EACH subject: open it, list its topics, and for each topic
capture K (you may need to open the topic to see K — do it for all). Also capture the **PYQ**,
**Express Question Bank**, and **Express QB 23-24** sections if they have subject/topic breakdowns.
- Faster option if you can: the site uses a GraphQL API at `https://api.egurukulapp.com/graphql/`.
  The query that returns a subject's topics-with-counts is the one fired when you open a subject
  (look in Network for the POST to /graphql with the subject's topic list; each topic carries a
  `questionIds` array whose **length is the count**). If you can replay it per subject with the
  page's own `Authorization: Bearer` header, do that — it's far faster than clicking every topic.
- 19 subjects: Anatomy, Biochemistry, Physiology, Pathology, Microbiology, Pharmacology, Forensic
  Medicine, ENT, PSM, OBG, Pediatrics, Medicine, Anesthesia, Surgery, Orthopaedics, Ophthalmology,
  Radiology, Psychiatry, Dermatology.

Output:
- `egurukul_topics.csv` → `subject,topic,question_count`
- `egurukul_other.csv` → `section,subject,topic,question_count`  (for PYQ / Express QB sections)

## Rules
- **Capture totals (N), not my attempt count (0).**
- Only read my own logged-in pages; don't bypass any paywall or protection.
- If a count is only visible by opening a chapter/topic, open it — be thorough, don't skim.
- Normalise nothing; give raw subject/chapter names as shown.
- Final message = the CSV code blocks, each preceded by its filename. Nothing else needed.
