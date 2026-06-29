import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-provider-marker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="provider-marker" [class.selected]="selected">
      <div class="marker-pin">
        <span class="marker-icon">🔧</span>
      </div>
      @if (label) {
        <div class="marker-label">{{ label }}</div>
      }
    </div>
  `,
  styles: [`
    .provider-marker { position: relative; display: flex; flex-direction: column; align-items: center; }
    .marker-pin {
      width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
      background: #06C167; display: flex; align-items: center; justify-content: center;
      transform: rotate(-45deg); box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .marker-pin .marker-icon { transform: rotate(45deg); font-size: 16px; }
    .provider-marker.selected .marker-pin { background: #000; }
    .marker-label { font-size: 10px; font-weight: 600; margin-top: 4px; background: white; padding: 2px 4px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
  `]
})
export class ProviderMarkerComponent {
  @Input() selected = false;
  @Input() label = '';
}
