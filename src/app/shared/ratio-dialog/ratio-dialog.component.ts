import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  model,
  output,
} from '@angular/core';
import { COLOR_THEMES, ImageRatio } from '../../services/verse-image.service';

// Overlay for picking the color theme and size of a generated image
@Component({
  selector: 'app-ratio-dialog',
  templateUrl: './ratio-dialog.component.html',
  styleUrls: ['./ratio-dialog.component.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': 'onOverlayClick($event)' },
})
export class RatioDialogComponent implements OnInit, OnDestroy {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly selectedTheme = model(0);
  readonly ratioSelected = output<ImageRatio>();
  readonly closed = output<void>();

  readonly themes = COLOR_THEMES;
  readonly ratios: { value: ImageRatio; label: string }[] = [
    { value: '1:1', label: 'Square (1:1) - 720x720' },
    { value: '3:4', label: 'Portrait (3:4) - 720x960' },
    { value: '9:16', label: 'Story (9:16) - 720x1280' },
  ];

  // Moved to the body so the page and card cannot clip the fixed overlay
  ngOnInit() {
    document.body.appendChild(this.host);
  }

  ngOnDestroy() {
    this.host.remove();
  }

  // Only a click on the backdrop closes; clicks inside the dialog do not
  onOverlayClick(event: Event) {
    if (event.target === this.host) {
      this.closed.emit();
    }
  }
}
