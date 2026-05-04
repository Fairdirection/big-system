import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="w-16 h-16 rounded-2xl bg-sf-elevated border border-sf-border
                  flex items-center justify-center text-sf-muted mb-4">
        <ng-content select="[slot=icon]" />
      </div>
      <h3 class="text-sm font-semibold text-sf-text mb-1">{{ title }}</h3>
      <p class="text-xs text-sf-muted max-w-[240px]">{{ message }}</p>
      <div class="mt-6">
        <ng-content select="[slot=action]" />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'لا توجد بيانات';
  @Input() message = 'جرب تعديل الفلاتر أو إضافة سجل جديد.';
}
