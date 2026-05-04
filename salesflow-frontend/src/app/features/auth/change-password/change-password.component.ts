import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-change-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-6 border border-sf-border">
      <h2 class="font-display font-semibold text-lg text-sf-text mb-6">Change Password</h2>
      <p class="text-sf-muted">Please update your password.</p>
    </div>
  `,
})
export class ChangePasswordComponent {}
