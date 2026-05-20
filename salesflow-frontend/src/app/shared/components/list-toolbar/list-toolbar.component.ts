import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  heroMagnifyingGlass, heroXMark, heroChevronUpDown,
} from '@ng-icons/heroicons/outline';

export interface ToolbarStatusOption { value: string; label: string; }
export interface ToolbarSortOption   { value: string; label: string; }

@Component({
  selector: 'app-list-toolbar',
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ heroMagnifyingGlass, heroXMark, heroChevronUpDown })],
  template: `
    <div class="flex flex-col gap-3 bg-sf-surface/70 backdrop-blur-sm p-4
                rounded-2xl border border-sf-border shadow-sm">

      <!-- Row 1: Search + Sort -->
      <div class="flex items-center gap-3">

        <!-- Search -->
        <div class="relative flex-1 group">
          <ng-icon name="heroMagnifyingGlass"
                   class="absolute right-3.5 top-1/2 -translate-y-1/2 text-sf-muted
                          group-focus-within:text-sf-primary transition-colors pointer-events-none">
          </ng-icon>
          <input type="text"
                 [placeholder]="placeholder"
                 [value]="searchValue()"
                 [disabled]="loading"
                 (input)="onSearch($event)"
                 class="w-full pr-10 pl-9 py-2.5 bg-sf-bg border border-sf-border rounded-xl
                        text-sm text-sf-text font-body placeholder:text-sf-subtle
                        focus:ring-2 focus:ring-sf-primary/40 focus:border-sf-primary/40
                        disabled:opacity-50 transition-all outline-none" />

          <!-- Clear button -->
          @if (searchValue()) {
            <button (click)="clearSearch()"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-sf-muted
                           hover:text-sf-text transition-colors">
              <ng-icon name="heroXMark" class="text-base"></ng-icon>
            </button>
          }
        </div>

        <!-- Sort dropdown -->
        @if (sortOptions.length) {
          <div class="relative flex-shrink-0">
            <select [value]="activeSort"
                    (change)="onSort($event)"
                    [disabled]="loading"
                    class="appearance-none pr-4 pl-8 py-2.5 bg-sf-bg border border-sf-border rounded-xl
                           text-sm font-bold text-sf-text outline-none cursor-pointer
                           focus:ring-2 focus:ring-sf-primary/40 focus:border-sf-primary/40
                           disabled:opacity-50 transition-all min-w-[130px]">
              @for (opt of sortOptions; track opt.value) {
                <option [value]="opt.value" class="bg-sf-surface text-sf-text">{{ opt.label }}</option>
              }
            </select>
            <ng-icon name="heroChevronUpDown"
                     class="absolute left-2.5 top-1/2 -translate-y-1/2 text-sf-muted text-sm pointer-events-none">
            </ng-icon>
          </div>
        }
      </div>

      <!-- Row 2: Status tabs + count (only if statusOptions provided) -->
      @if (statusOptions.length) {
        <div class="flex items-center gap-3">

          <!-- Tabs -->
          <div class="flex items-center gap-1 bg-sf-bg rounded-xl p-1 border border-sf-border
                      overflow-x-auto flex-1 min-w-0">
            @for (opt of statusOptions; track opt.value) {
              <button (click)="onStatus(opt.value)"
                      [disabled]="loading"
                      class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold
                             transition-all duration-200 whitespace-nowrap disabled:opacity-50"
                      [class.bg-sf-primary]="activeStatus === opt.value"
                      [class.text-white]="activeStatus === opt.value"
                      [class.text-sf-muted]="activeStatus !== opt.value"
                      [class.hover:text-sf-text]="activeStatus !== opt.value">
                {{ opt.label }}
              </button>
            }
          </div>

          <!-- Count badge -->
          @if (count !== null) {
            <div class="flex-shrink-0 px-3 py-1.5 bg-sf-elevated border border-sf-border
                        rounded-xl text-xs font-black text-sf-muted whitespace-nowrap">
              {{ count }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ListToolbarComponent {
  private translate = inject(TranslateService);
  get placeholder() { return this.translate.instant('common.search'); }
  @Input() statusOptions: ToolbarStatusOption[] = [];
  @Input() sortOptions:   ToolbarSortOption[]   = [];
  @Input() activeStatus = 'all';
  @Input() activeSort   = '';
  @Input() count: number | null = null;
  @Input() loading = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() sortChange   = new EventEmitter<string>();

  searchValue = signal('');

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchValue.set(val);
    this.searchChange.emit(val);
  }

  clearSearch() {
    this.searchValue.set('');
    this.searchChange.emit('');
  }

  onStatus(value: string) { this.statusChange.emit(value); }

  onSort(event: Event) {
    this.sortChange.emit((event.target as HTMLSelectElement).value);
  }
}
