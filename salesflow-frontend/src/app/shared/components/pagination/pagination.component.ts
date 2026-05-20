import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter, computed, signal,
  OnChanges, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { heroChevronRight } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ heroChevronRight })],
  template: `
    @if (totalPages > 1) {
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4
                  px-5 py-3.5 bg-sf-surface/30 border border-sf-border rounded-2xl">

        <!-- Info text -->
        <span class="text-xs font-bold text-sf-muted font-financial whitespace-nowrap">
          {{ 'common.showing_results' | translate:{ start: rangeStart, end: rangeEnd, total: totalItems } }}
        </span>

        <!-- Controls -->
        <div class="flex items-center gap-1.5">

          <!-- Prev -->
          <button (click)="go(currentPage - 1)"
                  [disabled]="currentPage === 1"
                  class="w-8 h-8 flex items-center justify-center rounded-lg
                         border border-sf-border text-sf-muted bg-sf-bg
                         hover:text-sf-primary hover:border-sf-primary/40
                         disabled:opacity-30 disabled:pointer-events-none
                         transition-all active:scale-95">
            <ng-icon name="heroChevronRight" class="text-sm"></ng-icon>
          </button>

          <!-- Page numbers -->
          @for (page of visiblePages; track $index) {
            @if (page === '...') {
              <span class="w-8 h-8 flex items-center justify-center text-sf-subtle text-xs font-bold">
                ···
              </span>
            } @else {
              <button (click)="go(+page)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black
                             border transition-all active:scale-95"
                      [class.bg-sf-primary]="currentPage === +page"
                      [class.text-white]="currentPage === +page"
                      [class.border-sf-primary]="currentPage === +page"
                      [class.border-sf-border]="currentPage !== +page"
                      [class.text-sf-muted]="currentPage !== +page"
                      [class.bg-sf-bg]="currentPage !== +page"
                      [class.hover:border-sf-primary/40]="currentPage !== +page"
                      [class.hover:text-sf-primary]="currentPage !== +page">
                {{ page }}
              </button>
            }
          }

          <!-- Next -->
          <button (click)="go(currentPage + 1)"
                  [disabled]="currentPage === totalPages"
                  class="w-8 h-8 flex items-center justify-center rounded-lg
                         border border-sf-border text-sf-muted bg-sf-bg
                         hover:text-sf-primary hover:border-sf-primary/40
                         disabled:opacity-30 disabled:pointer-events-none
                         transition-all active:scale-95">
            <ng-icon name="heroChevronRight" class="text-sm rotate-180"></ng-icon>
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalPages  = 1;
  @Input() totalItems  = 0;
  @Input() limit       = 10;
  @Output() pageChange = new EventEmitter<number>();

  visiblePages: (number | '...')[] = [];

  get rangeStart(): number { return (this.currentPage - 1) * this.limit + 1; }
  get rangeEnd(): number   { return Math.min(this.currentPage * this.limit, this.totalItems); }

  ngOnChanges() { this.visiblePages = this.buildPages(); }

  go(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  private buildPages(): (number | '...')[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (cur > 3)          pages.push('...');
    const start = Math.max(2, cur - 1);
    const end   = Math.min(total - 1, cur + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (cur < total - 2)  pages.push('...');
    pages.push(total);
    return pages;
  }
}
