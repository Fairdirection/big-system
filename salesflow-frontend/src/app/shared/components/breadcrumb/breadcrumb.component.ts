import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronLeft } from '@ng-icons/heroicons/outline';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

const ROUTE_LABELS: Record<string, string> = {
  dashboard:            'لوحة التحكم',
  employees:            'الموظفين',
  teams:                'الفرق',
  clients:              'العملاء',
  sales:                'المبيعات',
  claims:               'المطالبات',
  targets:              'المستهدفات',
  commissions:          'العمولات',
  settings:             'الإعدادات',
  new:                  'إضافة جديد',
  edit:                 'تعديل',
  'commission-preview': 'معاينة العمولة',
  'edit-history':       'تعديل السجل',
};

interface Crumb { label: string; path: string; }

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ heroChevronLeft })],
  template: `
    @if (crumbs().length > 1) {
      <nav class="flex items-center gap-1.5 animate-fade-in" aria-label="breadcrumb" dir="rtl">
        @for (crumb of crumbs(); track crumb.path; let last = $last) {
          @if (!last) {
            <a [routerLink]="crumb.path"
               class="text-[11px] font-bold text-sf-muted hover:text-sf-primary
                      transition-colors duration-150 whitespace-nowrap">
              {{ crumb.label }}
            </a>
            <ng-icon name="heroChevronLeft"
                     class="text-sf-subtle flex-shrink-0"
                     style="font-size: 9px" />
          } @else {
            <span class="text-[11px] font-bold text-sf-text truncate max-w-[180px]">
              {{ crumb.label }}
            </span>
          }
        }
      </nav>
    }
  `,
})
export class BreadcrumbComponent {
  private router = inject(Router);

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  crumbs = computed<Crumb[]>(() => {
    const segments = this.url().split('/').filter(Boolean);
    if (!segments.length) return [];

    const crumbs: Crumb[] = [];
    let path = '';

    for (const seg of segments) {
      path += `/${seg}`;
      const isId = /^[a-f\d]{24}$/i.test(seg);
      crumbs.push({ label: isId ? 'التفاصيل' : (ROUTE_LABELS[seg] ?? seg), path });
    }

    return crumbs;
  });
}
