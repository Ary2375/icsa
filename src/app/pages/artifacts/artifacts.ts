import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ResultsService } from '../../services/results/results';

export interface ArtifactFile {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly kind: 'text' | 'image';
  readonly format: string;
}

export interface ModelArtifact {
  readonly id: string;
  readonly label: string;
  readonly sources: ArtifactFile[];
  readonly images: ArtifactFile[];
}

export interface RepositoryArtifacts {
  readonly name: string;
  readonly telemetry: ArtifactFile[];
  readonly models: ModelArtifact[];
}

function artifactFile(path: string, kind: ArtifactFile['kind']): ArtifactFile {
  const name = path.split('/').at(-1) ?? path;
  const extension = name.split('.').at(-1)?.toUpperCase() ?? 'FILE';
  return { id: path, name, url: `/assets/artifacts/${path}`, kind, format: extension };
}

function modelArtifact(
  root: string,
  id: string,
  label: string,
  sourceNames: string[],
  imageNames: string[],
): ModelArtifact {
  const folder = `${root}/behavior-models/${id}`;
  return {
    id,
    label,
    sources: sourceNames.map(name => artifactFile(`${folder}/${name}`, 'text')),
    images: imageNames.map(name => artifactFile(`${folder}/${name}`, 'image')),
  };
}

function repositoryArtifacts(
  name: string,
  modelRoot: string,
  modelImages: Record<string, string[]>,
): RepositoryArtifacts {
  const sourceFiles = [
    ['efsm_diagram', 'Extended Finite State Machine (GK-Tail+)', ['efsm_model.dot', 'efsm_model.mmd']],
    ['dfg', 'Directly-Follows Graph', ['dfg.dot', 'dfg.mmd']],
    ['inductive_miner', 'Inductive Miner', ['petri_net.dot', 'petri_net.mmd']],
    ['split_miner', 'Split Miner', ['split_miner.dot', 'bpmn.mmd']],
  ] as const;

  return {
    name,
    telemetry: ['traces.json', 'metrics.json', 'logs.json'].map(file =>
      artifactFile(`${name}/telemetry/${file}`, 'text'),
    ),
    models: sourceFiles.map(([id, label, sources]) =>
      modelArtifact(modelRoot, id, label, [...sources], modelImages[id] ?? []),
    ),
  };
}

const REPOSITORY_ARTIFACTS: RepositoryArtifacts[] = [
  repositoryArtifacts('7ep-demo', '7ep-demo/telemetry', {
    efsm_diagram: ['gfsm_graphviz.svg'],
    dfg: ['dfg_graphviz.png', 'dfg_mermaid.png'],
    inductive_miner: ['petri_net_graphviz.png', 'petri_net_mermaid.png'],
    split_miner: ['bpmn_graphviz.png', 'bpmn_mermaid.png'],
  }),
  repositoryArtifacts('JPetStore', 'JPetStore', {
    efsm_diagram: ['gfsm_mermaid.png'],
    dfg: ['dfg_graphviz.png', 'dfg_mermaid.png'],
    inductive_miner: ['petri_net_graphviz.png', 'petri_net_mermaid.png'],
    split_miner: ['bpmn_graphviz.png', 'bpmn_mermaid.png'],
  }),
  repositoryArtifacts('PartsUnlimitedMRP', 'PartsUnlimitedMRP', {
    efsm_diagram: ['gfsm_model_graphviz.png'],
    dfg: ['dfg_graphviz.png', 'dfg_mermaid.png'],
    inductive_miner: ['petri_net_graphviz.svg'],
    split_miner: ['bpmn_graphviz.svg'],
  }),
  repositoryArtifacts('Spring-PetClinic', 'Spring-PetClinic/telemetry', {
    efsm_diagram: ['gfsm_graphviz.png', 'gfsm_mermaid.png'],
    dfg: ['dfg_graphviz.png', 'dfg_mermaid.png'],
    inductive_miner: ['petri_net_graphviz.png', 'petri_net_mermaid.png'],
    split_miner: ['bpmn_graphviz.png', 'bpmn_mermaid.png'],
  }),
];

@Component({
  selector: 'app-artifacts',
  templateUrl: './artifacts.html',
  styleUrl: './artifacts.scss',
})
export class Artifacts implements OnInit {
  readonly repositories = signal<RepositoryArtifacts[]>([]);
  readonly resultsFile: ArtifactFile = {
    id: 'results.json',
    name: 'results.json',
    url: '/assets/data/results.json',
    kind: 'text',
    format: 'JSON',
  };
  readonly previewFileId = signal<string | null>(null);
  readonly previewText = signal('');
  readonly loadingPreview = signal(false);
  readonly previewFailed = signal(false);
  private previewRequest = 0;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly resultsService: ResultsService,
  ) { }

  ngOnInit(): void {
    this.resultsService.getResults().subscribe(results => {
      const caseStudies = new Set(results.map(result => result.caseStudy));
      this.repositories.set(REPOSITORY_ARTIFACTS.filter(repository => caseStudies.has(repository.name)));
    });
  }

  isPreviewOpen(file: ArtifactFile): boolean {
    return this.previewFileId() === file.id;
  }

  togglePreview(file: ArtifactFile): void {
    if (file.kind !== 'text') {
      return;
    }

    if (this.isPreviewOpen(file)) {
      this.previewRequest++;
      this.previewFileId.set(null);
      this.loadingPreview.set(false);
      return;
    }

    const request = ++this.previewRequest;
    this.previewFileId.set(file.id);
    this.previewText.set('');
    this.previewFailed.set(false);
    this.loadingPreview.set(true);
    this.httpClient.get(file.url, { responseType: 'text' }).subscribe({
      next: text => {
        if (request !== this.previewRequest) return;
        this.previewText.set(text);
        this.loadingPreview.set(false);
      },
      error: () => {
        if (request !== this.previewRequest) return;
        this.previewFailed.set(true);
        this.loadingPreview.set(false);
      },
    });
  }
}
