import { Component, computed, input, output } from '@angular/core';
import {
  ExperimentOption,
  Facet,
  Selection,
  facetValues,
  isAvailable,
  kindOf,
  modeLabel,
  selectionForTool,
  toolGroups,
  toolLabel,
  variantGroup,
  variantLabel,
  variantsOfTool,
} from '../../utils/experiment-selection';

@Component({
  selector: 'app-experiment-picker',
  template: `
    <fieldset [attr.data-side]="side()">
      <legend>{{ label() }}</legend>
      <label class="field">
        <span class="field-label">Approach</span>
        <select aria-label="Approach" (change)="pickTool($event)">
          @for (group of toolGroups(); track group.label) {
            <optgroup [label]="group.label">
              @for (tool of group.tools; track tool) {
                <option [value]="tool" [selected]="tool === selection().tool">
                  {{ toolLabel(tool) }}
                </option>
              }
            </optgroup>
          }
        </select>
      </label>
      @if (isLiterature()) {
        @if (configurations().length > 1) {
          <label class="field">
            <span class="field-label">Configuration</span>
            <select aria-label="Configuration" (change)="pick('variant', $event)">
              @for (configuration of configurations(); track configuration) {
                <option [value]="configuration" [selected]="configuration === selection().variant">
                  {{ variantLabel(configuration) }}
                </option>
              }
            </select>
          </label>
        }
      } @else {
        <div class="field">
          <span class="field-label">Chunk size</span>
          <div class="chips" role="group" aria-label="Chunk size">
            @for (chunk of facets().chunks; track chunk) {
              <button
                type="button"
                [attr.aria-pressed]="chunk === selection().chunk"
                [disabled]="!available('chunk', chunk)"
                (click)="update({ chunk })"
              >
                {{ chunk }}
              </button>
            }
          </div>
        </div>
        <div class="field">
          <span class="field-label">Artifact preparation</span>
          <div class="chips" role="group" aria-label="Artifact preparation">
            @for (mode of facets().modes; track mode) {
              <button
                type="button"
                [attr.aria-pressed]="mode === selection().mode"
                [disabled]="!available('mode', mode)"
                (click)="update({ mode })"
              >
                {{ modeLabel(mode) }}
              </button>
            }
          </div>
        </div>
        <label class="field">
          <span class="field-label">Behavioral input</span>
          <select (change)="pick('variant', $event)">
            @for (group of variantGroups(); track group.label) {
              <optgroup [label]="group.label">
                @for (variant of group.items; track variant) {
                  <option
                    [value]="variant"
                    [selected]="variant === selection().variant"
                    [disabled]="!available('variant', variant)"
                  >
                    {{ variantLabel(variant) }}
                  </option>
                }
              </optgroup>
            }
          </select>
        </label>
      }
      @if (current(); as current) {
        <p class="current">{{ current.label }}</p>
      } @else {
        <p class="current missing" role="status">No experiment matches this combination.</p>
      }
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    fieldset {
      min-width: 0;
      margin: 0;
      padding: 1rem;
      border: 1px solid var(--color-border);
      border-top: 3px solid var(--color-blue);
      background: var(--color-surface);
    }
    fieldset[data-side='reference'] {
      border-top-color: var(--color-ochre);
    }
    legend {
      padding: 0 0.4rem;
      color: var(--color-blue);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 0.9rem;
      font-size: 0.8rem;
    }
    .field-label {
      color: var(--color-body);
      font-size: 0.72rem;
      font-weight: 650;
    }
    select,
    button {
      min-height: 36px;
      padding: 0.35rem 0.6rem;
      border: 1px solid var(--color-border-mid);
      border-radius: 3px;
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-size: 0.8rem;
      cursor: pointer;
    }
    select {
      width: 100%;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    button[aria-pressed='true'] {
      border-color: var(--color-blue);
      background: var(--color-blue);
      color: var(--color-surface);
    }
    button:disabled,
    option:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    :focus-visible {
      outline: 2px solid var(--color-blue);
      outline-offset: 2px;
    }
    .current {
      margin: 0.2rem 0 0;
      padding-top: 0.7rem;
      border-top: 1px solid var(--color-border-soft);
      color: var(--color-ink);
      font-size: 0.8rem;
      font-weight: 600;
      line-height: 1.5;
    }
    .current.missing {
      color: var(--color-negative);
      font-weight: 500;
    }
  `,
})
export class ExperimentPicker {
  readonly label = input.required<string>();
  readonly side = input<'reference' | 'selected'>('reference');
  readonly options = input<ExperimentOption[]>([]);
  readonly selection = input.required<Selection>();
  readonly current = input<ExperimentOption | null>(null);
  readonly selectionChange = output<Selection>();
  readonly toolLabel = toolLabel;
  readonly modeLabel = modeLabel;
  readonly variantLabel = variantLabel;
  // Chunk, preparation and behavioral input only describe the LLM experiments.
  readonly facets = computed(() =>
    facetValues(this.options().filter((option) => option.kind === 'llm')),
  );
  readonly toolGroups = computed(() => toolGroups(this.options()));
  readonly isLiterature = computed(
    () => kindOf(this.options(), this.selection().tool) === 'literature',
  );
  readonly configurations = computed(() => variantsOfTool(this.options(), this.selection().tool));
  readonly variantGroups = computed(() => {
    const groups = new Map<string, string[]>();
    for (const variant of this.facets().variants) {
      const label = variantGroup(variant);
      groups.set(label, [...(groups.get(label) ?? []), variant]);
    }
    return [...groups].map(([label, items]) => ({ label, items }));
  });

  available(facet: Facet, value: string): boolean {
    return isAvailable(this.options(), this.selection(), facet, value);
  }

  update(patch: Partial<Selection>): void {
    this.selectionChange.emit({ ...this.selection(), ...patch });
  }

  pick(facet: Facet, event: Event): void {
    this.update({ [facet]: (event.target as HTMLSelectElement).value });
  }

  pickTool(event: Event): void {
    this.selectionChange.emit(
      selectionForTool(this.options(), this.selection(), (event.target as HTMLSelectElement).value),
    );
  }
}
