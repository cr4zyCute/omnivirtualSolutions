---
name: data-analysis-mastery
description: >-
  Use this skill whenever a task involves analyzing data — exploring a dataset,
  answering a business question with data, building a report or dashboard,
  running or interpreting an experiment/A-B test, or reviewing someone else's
  analysis. Standard of a senior analyst (7+ years): question the data, choose
  the right method deliberately, and communicate findings to drive decisions.
---

# Data Analysis Mastery Skill (Senior Analyst-level)

## Purpose
Use this skill whenever a task involves analyzing data — exploring a dataset,
answering a business question with data, building a report or dashboard, running
or interpreting an experiment/A-B test, or reviewing someone else's analysis.
Written to the standard of a senior analyst (7+ years): someone who doesn't just
run the numbers, but questions the data, chooses the right method deliberately,
and communicates findings so they actually drive a decision.

## When to trigger
- "analyze this dataset / CSV / spreadsheet"
- "what does this data tell us", "find trends/insights in this"
- "build a dashboard/report on X"
- "is this result significant", "should we trust this A/B test"
- Reviewing or sanity-checking someone else's chart, stat, or conclusion

---

## 1. The senior-analyst mindset

- **Question the data before trusting it.** Where did it come from, how was it
  collected, what's missing, and what biases does the collection method introduce?
  A junior analyst accepts the dataset as given; a senior analyst interrogates it first.
- **Start from the decision, not the dataset.** What decision will this analysis
  inform, and for whom? An analysis with no decision attached is trivia, not insight.
- **Correlation is not causation — say so explicitly** whenever a finding could be
  read as causal but wasn't established that way (no controlled experiment, no
  causal inference method applied). This is the single most common way analyses
  mislead people, and the senior move is naming the limitation unprompted.
- **The result that confirms what everyone expected is the one to double-check
  hardest** — confirmation bias is easy to miss when the finding is convenient.
- **A surprising number is usually a data problem until proven otherwise.** Check
  for a pipeline bug, a join error, or a definition mismatch before reporting a
  dramatic finding as real.
- In 2026, AI-native tools (Claude, Copilot, NotebookLM-style assistants) handle a
  large share of the repetitive work — query generation, first-pass cleaning,
  summarization. The senior differentiator now is judgment: picking the right
  question, catching what the automated pass missed, and knowing when a generated
  answer is subtly wrong. Use these tools to go faster, not to skip verification.

---

## 2. The analysis lifecycle

1. **Clarify the question.** What decision does this inform? What would change
   based on the answer? Vague requests ("look at our sales data") need one
   clarifying question before diving in, unless a reasonable default question is
   obvious from context.
2. **Understand the data's provenance** before touching it: source system, collection
   method, known gaps, how recently it was last refreshed, what a given row actually
   represents (don't assume — verify against documentation or a source-of-truth check).
3. **Explore before concluding (EDA)**: distributions, missingness, outliers,
   duplicates, obvious data-quality issues — this step is not optional, even under
   time pressure, because it's where most false conclusions get caught early.
4. **Clean and transform deliberately**, documenting every transformation decision
   (why a row was dropped, why an outlier was capped vs. removed) — undocumented
   cleaning is one of the most common ways an analysis becomes unreproducible.
5. **Analyze with the method that fits the question** (see section 4) — not the
   method that's fastest to run or most familiar.
6. **Sanity-check the result**: does it hold up against a different cut of the
   data, a different time window, a simple manual spot-check of a few raw rows?
7. **Communicate for the audience, not for yourself** (see section 6) — the
   analysis isn't done until the right person can act on it.

---

## 3. Data quality & cleaning

- **Profile before cleaning**: row/column counts, data types, null rates per
  column, cardinality of categorical fields, min/max/distribution of numeric
  fields. Skipping this step is how silent errors slip through.
- **Understand missingness, don't just drop it**: missing-completely-at-random,
  missing-at-random, and missing-not-at-random each call for a different handling
  strategy (drop, impute, or flag and investigate why it's missing) — defaulting
  to "just drop nulls" can quietly bias the remaining sample.
- **Duplicates**: define what makes a row a true duplicate for this specific
  dataset (exact row match vs. same entity recorded twice under different IDs) —
  naive exact-match deduplication misses the second kind.
- **Outliers**: investigate before removing — a true outlier (data entry error,
  system glitch) is removable; an extreme-but-real value (a legitimate large
  transaction) often carries the most important signal and shouldn't be discarded
  just because it's inconvenient for a cleaner distribution.
- **Keep the transformation pipeline reproducible** — a script/notebook that
  re-derives the cleaned dataset from raw source, not manual one-off edits in a
  spreadsheet that can't be re-run or audited.

---

## 4. Choosing the right method

- **Descriptive** (what happened): aggregates, trends over time, segmentation —
  the majority of real business questions live here; don't reach for something
  more complex than the question needs.
- **Diagnostic** (why it happened): drill-downs, cohort/segment comparison,
  correlation analysis (with the causation caveat from section 1) — the move when
  a descriptive finding needs an explanation.
- **Predictive** (what will happen): forecasting, regression — only when the
  question is genuinely about the future, and only with stated confidence/error
  bounds, not a single point estimate presented as fact.
- **Causal / experimental** (what would happen if we changed X): A/B tests,
  quasi-experimental methods — the only category of analysis that can properly
  support a causal claim; don't claim causality from any of the other three without this.
- **Statistical significance != practical significance.** A result can be
  statistically significant with an effect size too small to matter for the
  decision at hand — always report effect size and practical impact alongside
  (or instead of) a bare p-value.
- **Watch for common experiment-design pitfalls**: peeking at A/B test results
  early and stopping once "significant" (inflates false positives), underpowered
  sample sizes, novelty effects skewing early results, and multiple-comparisons
  problems when testing many metrics/segments without correction.

---

## 5. Tooling (pick based on scale and need, not habit)

- **SQL** — the primary tool for extracting and aggregating from any relational
  source; still the single most important technical skill for a data analyst, since
  nearly every analysis starts with retrieving the right data. Know joins, window
  functions, and CTEs well enough to write one clean query instead of pulling raw
  data and doing the join in a spreadsheet.
- **Python (pandas)** — for cleaning, transformation, and analysis beyond what SQL
  comfortably expresses; also the path to reproducible, re-runnable pipelines
  instead of manual spreadsheet edits.
- **Spreadsheets (Excel/Sheets)** — still genuinely useful for quick exploration,
  lightweight sharing with non-technical stakeholders, and small datasets — not a
  failure to "not use code," just the wrong tool for anything large, repeated, or
  needing to be reproducible.
- **BI/visualization tools (Power BI, Tableau, or code-based charting)** — for the
  final reporting/dashboard layer once the underlying analysis is solid; don't
  build the dashboard before the analysis is actually right.
- **AI-assisted tooling** — useful for first-draft query generation, summarizing a
  large result set, or drafting a report structure; always verify generated
  queries/code against the actual data rather than trusting output unchecked,
  since a plausible-looking but wrong query is a common failure mode.

---

## 6. Communicating findings (where most of the real impact is won or lost)

- **Lead with the answer, not the methodology.** Most audiences want "here's what
  we found and what we recommend," with the methodology available for anyone who
  wants to dig in — not a chronological walkthrough of every step taken.
- **One chart, one idea.** A chart should make one point clearly rather than
  display everything available — pick the one or two numbers that matter for the
  decision and cut the rest from the headline view (available in an appendix if needed).
- **Match the visualization to the data's shape**: trend over time -> line chart;
  comparison across categories -> bar chart; part-to-whole -> avoid pie charts for
  more than ~4-5 categories (bar is usually clearer); relationship between two
  variables -> scatter plot. Don't default to whatever chart type is fastest to
  build if it isn't the clearest for the question.
- **Always state uncertainty and limitations** — sample size, data gaps, time
  period caveats, confidence intervals where relevant. Presenting a number with
  false precision is a common way analyses lose credibility once someone pokes at it.
- **Tailor depth to the audience**: an executive needs the headline and
  recommendation in the first sentence; a fellow analyst reviewing the work needs
  the methodology and edge cases. Same finding, different framing.
- **State the recommendation, not just the observation**, when the question calls
  for one — "revenue dropped 12% in Q3, driven mainly by the EMEA region" is an
  observation; pairing it with "worth checking the EMEA pricing change from
  August before the next review" turns it into something actionable.

---

## 7. Documentation & reproducibility

- Document data sources, key assumptions, and transformation decisions alongside
  the analysis itself (a wiki page, a notebook's markdown cells, a README) — not
  just in your own memory. This is what lets someone else trust, audit, or rebuild
  on top of the work later.
- Keep the path from raw data to final chart re-runnable, not a series of manual
  one-off spreadsheet edits that can't be reproduced if the question comes up again
  with refreshed data.
- Version control analysis code/notebooks where practical, the same discipline
  applied to production code — an analysis that produced a decision should be
  traceable back to exactly what was run.

---

## 8. Ethics & governance basics

- Be alert to sampling bias, survivorship bias, and selection bias in how the
  underlying data was collected — these distort conclusions before any analysis
  method is even applied.
- Handle PII/sensitive data according to policy — aggregate/anonymize before
  sharing wherever the analysis doesn't specifically require individual-level data.
- Flag when a dataset's limitations mean a confident conclusion isn't actually
  warranted — a senior analyst's credibility rests partly on being willing to say
  "we can't conclude that from this data" rather than forcing an answer.

---

## 9. Pre-delivery checklist
- [ ] The business question and intended decision are explicitly stated up front
- [ ] Data provenance and known limitations are documented, not assumed
- [ ] EDA was performed (distributions, nulls, duplicates, outliers checked) before concluding
- [ ] Cleaning/transformation steps are documented and reproducible, not manual one-offs
- [ ] The analysis method matches the question (descriptive vs. diagnostic vs. predictive vs. causal)
- [ ] Any causal-sounding claim is backed by an actual causal method, or explicitly hedged as correlational
- [ ] Statistical significance is paired with effect size / practical significance, not reported alone
- [ ] The result was sanity-checked against a different cut, time window, or manual spot-check
- [ ] Charts each make one clear point, matched to the data's shape
- [ ] Uncertainty, sample size, and limitations are stated, not hidden
- [ ] The write-up leads with the finding/recommendation, with methodology available but not front-loaded

---

## 10. Curated reference library

**Foundational / statistics & methodology**
- *Naked Statistics* — Charles Wheelan — accessible, intuition-first stats grounding
  (sampling, significance, regression) without heavy math prerequisites.
- *The Signal and the Noise* — Nate Silver — forecasting, uncertainty, and why
  confident predictions often fail — directly relevant to the predictive-analysis
  caveats in section 4.
- *How to Lie with Statistics* — Darrell Huff — a classic, short read on how charts
  and stats mislead, useful specifically for spotting bad analysis (your own or
  others') before it ships.
- *Trustworthy Online Controlled Experiments* — Kohavi, Tang, Xu — the standard
  reference on A/B testing done right, including the peeking/stopping-early pitfall
  named in section 4.

**Practical / tooling**
- *Python for Data Analysis* — Wes McKinney (pandas' original author) — the
  standard pandas reference.
- Mode Analytics SQL tutorial (free) — https://mode.com/sql-tutorial/ — strong
  free resource specifically for analytical SQL (window functions, CTEs).
- Kaggle Learn (free, short practical courses) — https://www.kaggle.com/learn —
  pandas, data cleaning, and data visualization modules in particular.

**Communication & visualization**
- *Storytelling with Data* — Cole Nussbaumer Knaflic — the standard reference for
  turning an analysis into a chart/narrative a non-technical audience will actually
  understand and act on.
- *The Visual Display of Quantitative Information* — Edward Tufte — foundational
  (if dense) work on clear, high-integrity data visualization.

**Free technical references**
- pandas documentation — https://pandas.pydata.org/docs/
- PostgreSQL documentation (analytical SQL features) — https://www.postgresql.org/docs/
- Harvard Business Review's "data storytelling" article collection (free articles,
  paywalled archive) — https://hbr.org/topic/subject/data-visualization — useful
  for executive-communication framing specifically.
