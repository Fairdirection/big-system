import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-commission-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="text-2xl font-display font-bold text-sf-text mb-6">Commission Preview</h1>`,
})
export class CommissionPreviewComponent {}
