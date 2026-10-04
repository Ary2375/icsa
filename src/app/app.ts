import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import projectMetadata from '../../package.json';
import { Navbar } from './components/navbar/navbar';

@Component({
  imports: [RouterOutlet, Navbar],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('behavioral-models-llm-decomposition-results');
  protected readonly author = projectMetadata.author;
  protected readonly version = projectMetadata.version;
}
