# Core BTR Drive Manifest

Generated root on this Mac:

`/Users/sriramrk/Downloads/Core BTR Videos`

## Folder Logic

- `Topic Breakdown.md`: subject/topic list copied from the screenshots.
- `Topic Timeline Summary.md`: subjects processed into timeline drafts.
- `Topic Video Cut Report.md`: master index of every generated topic clip.
- `<Subject>/Videos/`: untouched original source videos.
- `<Subject>/Audio/`: high quality 192 kbps MP3 audio, where available.
- `<Subject>/Transcripts/`: timestamped transcripts and segment JSON.
- `<Subject>/Topic Timelines/`: per-subject inferred cut points with evidence snippets.
- `<Subject>/Topic Videos/`: topic-wise MP4 clips named and numbered for playlist continuity.
- `<Subject>/Topic Videos/README.md`: per-subject index showing topic order, time range, confidence, and source file.

## Generated Topic Video Set

- Expected topics from the screenshot-derived breakdown: 178.
- Generated topic-wise videos: 178.
- ffprobe validation failures: 0.
- Empty/tiny failed clips detected: 0.
- Duplicate topic numbers detected: 0.

## Confidence Labels

- `high`: strongest boundary, either direct phrase match or manual transcript-derived boundary.
- `medium`: usable automated boundary with decent phrase evidence.
- `low`: usable but approximate.
- `estimated`: topic order was used because the transcript did not clearly announce the boundary.

Keep the original videos until you have spot-checked the `low` and `estimated` cuts that matter most. The topic clips are designed for navigation and study continuity, not as proof-perfect editorial cuts.

## Scripts Used

Run from:

`/Users/sriramrk/Documents/Codex/2026-05-28/okay-ive-only-one-task-for`

- `./core_btr_status.zsh`: check transcription/extraction status.
- `./make_core_btr_topic_timelines.zsh`: rebuild topic timeline drafts from transcripts.
- `./cut_core_btr_topic_videos.zsh`: rebuild topic video clips and reports.
- `./cut_core_btr_topic_videos.zsh --subject "Radiology" --overwrite`: rebuild one subject.
- `./cut_core_btr_topic_videos.zsh --accurate --subject "Radiology" --overwrite`: slower frame-accurate rebuild for one subject if a fast-cut boundary feels off.

## Repaired Manually From Transcript

Two subjects had transcript boundaries that the automatic matcher initially collapsed near the end. These were repaired with explicit transcript-derived start points:

- `Integrated CVS`
- `Radiology`

