# Behavioral Models for LLM-Driven Microservice Decomposition

An Angular dashboard for examining whether runtime-derived behavioral models provide useful context for LLM-driven microservice decomposition.

**GitHub Pages:** [https://ary2375.github.io/icsa/](https://ary2375.github.io/icsa/)

## Research workflow

1. Instrument each Java repository with the OpenTelemetry Java Agent and a custom extension that captures method parameters.
2. Run each repository's existing test suite automatically and collect `traces.json`, `metrics.json`, and `logs.json` through the OpenTelemetry Collector.
3. Process `traces.json` with GK-Tail+ to generate an EFSM, then independently with PM4Py to generate DFG, Inductive Miner, and Split Miner models.
4. Add one generated model at a time as the final artifact in the baseline LLM input. Repeat for every repository and model variant.
5. Compare the resulting decompositions in the Results dashboard.

The research starting point is [LLMs for Architectural Refactoring: An Exploratory Study on Monoliths to Microservices](https://doi.org/10.1109/icsa66085.2026.00033), presented at ICSA 2026.

## Application sections

- **Results**: filter and inspect all LLM experiments and literature/state-of-the-art reference results together as a table, bar charts, or radar charts. The table's **Compare with** selector defaults to the plain baseline for the same case study, tool, family, and chunk size. Alternatively, select a single literature reference to compare all displayed rows against its results for the same case study. Comparison data remains available even when hidden by filters; missing references produce an explicit notice instead of deltas. Higher/lower differences indicate numerical direction, not necessarily improvement.
- **Comparator** (`/comparator`): choose a reference experiment, then explore a selected experiment relative to that fixed reference. The two decompositions are shown side by side, with every microservice tagged as new, removed, merged, split, renamed, etc., the differing classes highlighted, and the coverage of the monolith reported for each. This page focuses exclusively on architectural structure; metrics remain in Results.
- **Methodology**: review telemetry collection, model generation, and the repeated LLM experiment.
- **Artifacts**: preview or download telemetry JSON and model specifications, and view rendered diagrams grouped by repository.

## Repository structure

```text
.github/workflows/deploy.yml       GitHub Pages release workflow
src/app/pages/dashboard/           Results dashboard
src/app/pages/comparator/          Side-by-side comparison of two decompositions
src/app/pages/methodology/         Pipeline, diagrams, and references
src/app/pages/artifacts/           Artifact browser
src/assets/data/results.json       Dataset consumed by Results
src/assets/data/monoliths/         Reference class lists and raw decompositions (532 files) read live by the Comparator
src/assets/artifacts/<repository>/ Telemetry and model files by repository
src/assets/theme/colors.scss       Shared color tokens
src/assets/theme/global.scss       Shared page layout and typography
```

The artifact catalog is maintained in `src/app/pages/artifacts/artifacts.ts`. When adding or removing files, update the corresponding repository/model entry there. Repository directory names must match the `Case Study` values in `results.json` (currently `7ep-demo`, `JPetStore`, `PartsUnlimitedMRP`, and `Spring-PetClinic`).

## Updating results and artifacts

The table shows coverage (observed entities %) and partition count next to quality metrics. Expand **Details** in a row for observed-entity count and partition sizes Min/Med/Max. These fields are not included in quality-metric deltas. `Partition Size Med` retains its source name because its mean/median definition has not been confirmed. Missing structural data is displayed as N/A, not zero.

The **Coverage** view shows one scatter chart per metric selected in the sidebar, with all metrics selected initially. The same sidebar configuration filters and repository selection apply. Colors use the same shared legend as other charts; a separate shape legend identifies experiments (circles), plain baselines (squares), and literature references (diamonds). Axis margins keep points at 0 and 100 inside the plot. Tooltips identify the configuration and observed-entity count. Missing coverage/metric values are excluded with a notice; overlapping points can represent multiple configurations.

Observed-entity coverage is read from `# Obs. Ents. (%)`; it is not asserted to measure output completeness and is distinct from `c2c_cvg` metrics. No missing-entity counts, aggregate scores, or statistical significance are inferred.

Edit `src/assets/data/results.json`. The dashboard reads `llm_comparison` for LLM strategy results and `variant_comparison` for literature/state-of-the-art results. The latter includes DATACENTRIC, GROUND_TRUTH, HyDec, LOG2MS, and MONO2MICRO; the `business` and `natural` strategies are shown as separate MONO2MICRO configurations. LLM rows repeated in `variant_comparison` are ignored by the dashboard.

The dashboard combines both sources in the same views. Literature tools are reference points; LLM strategy keys identify baseline and augmented inputs:

- `80k_ai`: baseline input
- `80k_ai_dfg`: baseline plus a DFG
- `80k_ai_gfsm`: baseline plus an EFSM/GFSM
- `80k_ai_inductive_miner`: baseline plus an Inductive Miner model
- `80k_ai_split_miner`: baseline plus a Split Miner model

Bar charts group results by model and strategy, with one category label and adjacent bars for the available chunk sizes. Literature references each get their own category. This keeps the two LLMs directly comparable without repeating a category for every chunk, while retaining every result. Colors identify variants and chunk sizes; grey bands highlight baselines and literature references. Tooltips show the full model and strategy.

Bar charts use vertical bars and a shared model selector: only one LLM is displayed at a time across all metrics, with all its filtered strategies and chunk sizes. Selected literature references stay visible alongside either model. If filters exclude the active model, the selector falls back to the first available model. Full tool and strategy names remain available in tooltips.

Each result entry needs `Case Study`, `Tool`, `Strategy`, and the metric fields displayed by the table. Keep case-study and tool names consistent across strategies so baseline comparisons can be matched. Store repository files under `src/assets/artifacts/<Case Study>/` and update the artifact catalog when paths or files change.

Run the production build locally before publishing:

```bash
npm ci
npm run build
```

## Comparator

The Comparator page contains only the two-experiment structural comparison.
Choose a monolith, then configure a **Reference experiment** and a **Selected
experiment**. All changes are directional: reference to selected. Changing the
selected experiment preserves the reference, so it can serve as a stable
baseline across multiple comparisons. Changing monolith resets both selections.
Identical selections are allowed and explicitly reported.

- **Selection by factor:** each experiment is chosen through the factors of the
  study rather than from one long list: **LLM**, **chunk size** (30k / 50k /
  80k), **artifact preparation** (AI / CONCAT) and **behavioral input** (static
  only, static + one model, static + all models, or behavioral models only,
  grouped in the menu). Values that no experiment combines with the current
  choices are disabled, so a selection never ends in a dead end. The chosen
  experiment is spelled out below the controls, for example
  “Deepseek 32 Terminus · 30k · AI · Static + DFG”.
- **Scope:** only the 528 thesis experiments are compared (4 monoliths × 2 LLMs ×
  3 chunk sizes × 2 preparations × 11 inputs). Other outputs of the original
  study (other LLMs, hierarchical or zero-shot runs) are not part of the
  comparison and are not kept in the repository. An experiment whose
  strategy name does not follow the chunk/preparation/input pattern stops the
  page with an explicit error instead of being silently skipped.
- **Default:** the reference starts as the static baseline and the selected
  experiment as the same setting plus a DFG. Both can be changed independently.

- **Side-by-side comparison:** the reference decomposition on the left and the
  selected experiment on the right, with service and class counts, service
  sizes and the raw JSON link. Every service carries a tag (new, removed,
  merged, split, reorganized, modified, renamed, unchanged or uncertain) and the
  services it relates to on the other side. Unchanged services are collapsed.
- **Summary:** counts of new services, removed services, merge operations and
  split operations, plus the change in monolith coverage.
- **Legend:** a single legend below the columns explains every service tag (New,
  Removed, Merged, Split / Split part, Reorganized, Modified, Renamed,
  Unchanged, Uncertain) and every class tag (→ / ← service, not in selected, not
  in reference, repeated assignment). The columns themselves contain no warning
  boxes.
- **Evolution semantics:** services are linked through the classes they share.
  One reference service with several successors is a split; several reference
  services with one successor form a merge; many-to-many groups are mixed
  reorganizations and are not counted as merges or splits. A one-to-one group is
  unchanged, renamed (equal class sets) or modified (different class sets). A
  nonempty service is *new* only when none of its class IDs exists in the
  reference, and *removed* only when none survives in the selected experiment.
  These terms describe decompositions, not code that was added or deleted. Only
  IDs assigned exactly once on each side create a link, and no name-similarity or
  majority heuristic is used; groups touching repeated IDs, and empty services,
  are *uncertain*.
- **Monolith coverage:** for each decomposition, the share of the monolith's own
  class list that it assigns to a service. The class list is the set of distinct
  classes in the monolith's `reference_decomposition.json`. IDs match either by
  fully-qualified name or by an unambiguous simple name. The panel also lists
  the classes that are not covered, the number of IDs outside the class list
  (for example tests or other artifacts), and the number of simple names that
  match several classes; neither of the last two is counted as covered. When the
  evaluator's observed-entity figure exists it is shown separately, because it is
  a different measure. Coverage is not a quality measure, and a missing class
  list is shown as unavailable rather than as zero.

Class IDs are compared exactly as recorded. The comparison does not infer
cohesion, coupling, architectural quality or causality from class co-location.

### Data source: always read live

There is no generated index and no script to run. Every time the page is opened:

1. `results.json` provides the list of experiments (LLM strategies only).
2. When an experiment is chosen, only its `decomposition.json` and the
   monolith's `reference_decomposition.json` are fetched, with
   `Cache-Control: no-cache` so edited files are never served stale.

The Comparator therefore always reflects the files currently deployed. A missing
or malformed file, an unsupported strategy name, an unmapped monolith/LLM or a
duplicate experiment shows an explicit error instead of being skipped.

`src/assets/data/monoliths` contains only what the Comparator needs (**532
files**, which must be committed for deployment): for each monolith,
`reference_decomposition.json` (its class list) and the raw `decomposition.json`
of every compared experiment under
`summaries/<llm>/<chunk>/artifacts_<ai|concat>/<variant>/` (an empty variant
folder is the static baseline).

`angular.json` publishes only these files with the site (528 decompositions and
the 4 references, about 1 MB); the rest of the tree is excluded.

To add a monolith or LLM, add its data folder to `MONOLITH_FOLDERS` /
`LLM_FOLDERS` in `src/app/utils/decomposition-source.ts` (and a new chunk size
or LLM to the globs in `angular.json`). Quality metrics, tokens and automatic
research notes are not part of this page.

Focused validation:

```bash
npm test -- --watch=false --include="src/app/utils/decomposition-analysis.spec.ts" --include="src/app/utils/decomposition-source.spec.ts" --include="src/app/utils/experiment-selection.spec.ts" --include="src/app/services/decompositions/decompositions.spec.ts" --include="src/app/components/experiment-picker/experiment-picker.spec.ts" --include="src/app/pages/comparator/comparator.spec.ts"
```

## Local development

```bash
npm ci
npm start
```

The development server runs at `http://localhost:4200/` and reloads when source files change. Run unit tests with:

```bash
npm test
```

## Deploying a release

The workflow in `.github/workflows/deploy.yml` deploys when a GitHub Release is **published**. A push to `main` alone does not trigger deployment.

1. Commit and push the updated dataset, artifact files/catalog, and application changes.
2. Create a GitHub Release from the commit or tag containing those changes.
3. Publish the release. GitHub Actions builds the production app and deploys it to Pages.

The workflow can also be started manually with `workflow_dispatch`. In repository settings, configure GitHub Pages to use **GitHub Actions** as its deployment source. Check the Actions tab for build and deployment status.
