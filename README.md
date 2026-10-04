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

- **Results**: filter and inspect results as a table, bar charts, or radar charts. Table values are compared with the `80k_ai` baseline for the same case study and tool.
- **Methodology**: review telemetry collection, model generation, and the repeated LLM experiment.
- **Artifacts**: preview or download telemetry JSON and model specifications, and view rendered diagrams grouped by repository.

## Repository structure

```text
.github/workflows/deploy.yml       GitHub Pages release workflow
src/app/pages/dashboard/           Results dashboard
src/app/pages/methodology/         Pipeline, diagrams, and references
src/app/pages/artifacts/           Artifact browser
src/assets/data/results.json       Dataset consumed by Results
src/assets/artifacts/<repository>/ Telemetry and model files by repository
src/assets/theme/colors.scss       Shared color tokens
src/assets/theme/global.scss       Shared page layout and typography
```

The artifact catalog is maintained in `src/app/pages/artifacts/artifacts.ts`. When adding or removing files, update the corresponding repository/model entry there. Repository directory names must match the `Case Study` values in `results.json` (currently `7ep-demo`, `JPetStore`, `PartsUnlimitedMRP`, and `Spring-PetClinic`).

## Updating results and artifacts

Edit `src/assets/data/results.json`. The dashboard reads the `llm_comparison` object, whose keys identify the baseline and augmented inputs:

- `80k_ai`: baseline input
- `80k_ai_dfg`: baseline plus a DFG
- `80k_ai_gfsm`: baseline plus an EFSM/GFSM
- `80k_ai_inductive_miner`: baseline plus an Inductive Miner model
- `80k_ai_split_miner`: baseline plus a Split Miner model

Each result entry needs `Case Study`, `Tool`, `Strategy`, and the metric fields displayed by the table. Keep case-study and tool names consistent across strategies so baseline comparisons can be matched. Store repository files under `src/assets/artifacts/<Case Study>/` and update the artifact catalog when paths or files change.

Run the production build locally before publishing:

```bash
npm ci
npm run build
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
