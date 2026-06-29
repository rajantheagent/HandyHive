import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-marker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-marker">
      <div class="pulse-ring"></div>
      <div class="marker-dot"></div>
    </div>
  `,
  styles: [`
    .user-marker { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .marker-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: #4285F4; border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 1;
    }
    .pulse-ring {
      position: absolute; width: 24px; height: 24px; border-radius: 50%;
      background: rgba(66, 133, 244, 0.2);
      animation: pulse 2s ease-out infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
  `]
})
export class UserMarkerComponent {}
