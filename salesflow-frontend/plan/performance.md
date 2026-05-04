# 📄 performance.md
# SalesFlow Frontend — Performance Optimization

---

## 1. `ChangeDetectionStrategy.OnPush` — Universal Rule

Every component in this project — shared and feature — uses `OnPush`. This eliminates Angular's default zone-based dirty checking across the entire tree.

```ts
// Apply to EVERY component — no exceptions
@Component({
  selector: 'app-sale-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // ← mandatory
  template: `...`,
})
export class SaleListComponent {}
```

With `OnPush`, Angular only re-renders when:
- An `@Input()` reference changes
- An `async` pipe emits
- A Signal reads
- `markForCheck()` is called explicitly

Since all services use Angular Signals or RxJS Observables consumed via `async`, this works seamlessly.

---

## 2. Signals-First State Management

Prefer Angular Signals over BehaviorSubjects for local and shared state. Signals are natively change-detection aware with `OnPush`.

```ts
// src/app/features/sales/sale-list/sale-list.component.ts
import {
  Component, ChangeDetectionStrategy, inject,
  signal, computed, OnInit
} from '@angular/core';
import { SaleService } from '@core/services/sale.service';
import { ThemeService } from '@core/services/theme.service';
import { Sale } from '@core/models/sale.model';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex gap-3 mb-6">
        @for (status of statuses; track status) {
          <button (click)="activeFilter.set(status)"
                  [class.ring-2]="activeFilter() === status"
                  class="px-3 py-1.5 rounded-pill text-xs font-mono
                         bg-sf-surface border border-sf-border
                         ring-neon-purple/50 transition-all duration-200">
            {{ status }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 gap-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-20 rounded-2xl bg-sf-surface animate-shimmer
                        bg-gradient-to-r from-sf-surface via-sf-elevated to-sf-surface
                        bg-[length:200%_100%]"></div>
          }
        </div>
      } @else {
        <div class="space-y-3">
          @for (sale of filteredSales(); track sale._id) {
            <app-sale-row [sale]="sale" />
          }
          @empty {
            <app-empty-state message="No sales found for this filter." />
          }
        </div>
      }
    </div>
  `,
})
export class SaleListComponent implements OnInit {
  private saleService = inject(SaleService);
  private themeService = inject(ThemeService);

  sales = signal<Sale[]>([]);
  loading = signal(true);
  activeFilter = signal<string>('all');

  statuses = ['all', 'draft', 'confirmed', 'claimed', 'collected'];

  // Computed — recalculates only when sales() or activeFilter() changes
  filteredSales = computed(() => {
    const filter = this.activeFilter();
    const all = this.sales();
    return filter === 'all' ? all : all.filter(s => s.status === filter);
  });

  ngOnInit() {
    const q = this.themeService.currentQuarter();
    this.saleService.getSalesByQuarter(q).subscribe({
      next: (res) => {
        this.sales.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
```

---

## 3. `trackBy` in `@for` Loops

Always provide a `track` expression to prevent full list re-renders when the array reference changes.

```html
<!-- ✅ Always use track with a unique identifier -->
@for (sale of sales(); track sale._id) {
  <app-sale-row [sale]="sale" />
}

@for (emp of employees(); track emp._id) {
  <app-employee-card [employee]="emp" />
}

<!-- ✅ For primitive arrays -->
@for (q of quarters; track q) {
  <option [value]="q">{{ q }}</option>
}
```

> `@for` with `track` is the Angular 17+ replacement for `*ngFor` with `trackBy`. Never use `*ngFor` in this project.

---

## 4. Lazy Loading — Every Feature Module

All feature routes are lazy-loaded via `loadComponent` or `loadChildren`. Zero feature code lands in the initial bundle.

```ts
// ✅ Lazy-loaded — code splits automatically
{
  path: 'sales',
  loadChildren: () =>
    import('./features/sales/sales.routes').then(m => m.SALE_ROUTES),
}

// ✅ Even single-page features use loadComponent
{
  path: 'dashboard',
  loadComponent: () =>
    import('./features/dashboard/dashboard.component').then(
      m => m.DashboardComponent
    ),
}
```

### Expected Bundle Budget

| Chunk | Max Size |
|---|---|
| `main` (initial) | < 100kB gzipped |
| Each feature chunk | < 30kB gzipped |
| `styles.css` | < 20kB (Tailwind purged) |

---

## 5. Tailwind CSS Purge Optimization

Tailwind automatically purges unused classes in production builds via the `content` paths in `tailwind.config.js`.

```js
// tailwind.config.js
content: [
  './src/**/*.{html,ts}',
  './src/app/**/*.{html,ts}',
],
```

**Do not** use dynamic class construction with template literals — Tailwind's purger is regex-based and cannot detect these:

```ts
// ❌ WRONG — Tailwind cannot detect 'bg-neon-purple' at build time
const cls = `bg-neon-${color}`;

// ✅ CORRECT — Full class names in source
const variants = {
  purple: 'bg-neon-purple',
  cyan:   'bg-neon-cyan',
  pink:   'bg-neon-pink',
};
const cls = variants[color];
```

---

## 6. HTTP Caching with `shareReplay`

Dashboard and reference data (employees for selectors, teams list) should be cached to avoid redundant API calls on route re-entry.

```ts
// src/app/core/services/employee.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Employee } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/employees`;

  // Cache active sales employees for commission form selectors
  private _salesEmployees$: Observable<ApiResponse<Employee[]>> | null = null;

  getSalesEmployees(): Observable<ApiResponse<Employee[]>> {
    if (!this._salesEmployees$) {
      this._salesEmployees$ = this.http
        .get<ApiResponse<Employee[]>>(`${this.base}?department=Sales&isActive=true`)
        .pipe(shareReplay(1));
    }
    return this._salesEmployees$;
  }

  invalidateCache() {
    this._salesEmployees$ = null;
  }

  getEmployees(params?: Record<string, string>) {
    return this.http.get<PaginatedResponse<Employee>>(this.base, { params });
  }

  getEmployee(id: string) {
    return this.http.get<ApiResponse<Employee>>(`${this.base}/${id}`);
  }

  createEmployee(data: Partial<Employee>) {
    return this.http.post<ApiResponse<Employee>>(this.base, data);
  }

  updateEmployee(id: string, data: Partial<Employee>) {
    return this.http.patch<ApiResponse<Employee>>(`${this.base}/${id}`, data);
  }

  deleteEmployee(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
```

---

## 7. `withFetch()` — Native Fetch API

`provideHttpClient(withFetch())` in `app.config.ts` uses the browser's native `fetch` API instead of `XMLHttpRequest`. This aligns with Angular's SSR-ready architecture and reduces polyfill overhead.

---

## 8. `async` Pipe vs Manual Subscribe

Prefer `async` pipe in templates over manual subscriptions. `async` handles unsubscription automatically and works perfectly with `OnPush`.

```html
<!-- ✅ Preferred: async pipe — auto unsubscribes, OnPush compatible -->
@if (dashboard$ | async; as stats) {
  <app-stat-card [value]="stats.overview.totalGross" [isCurrency]="true" />
}

<!-- ✅ Also fine: Signal in template — zero boilerplate -->
<app-stat-card [value]="totalGross()" [isCurrency]="true" />
```

---

## 9. Large Table Virtualization

For the Sales list which may contain hundreds of rows per quarter, implement virtual scrolling:

```ts
// Install: npm install @angular/cdk
import { ScrollingModule } from '@angular/cdk/scrolling';

// In template:
<cdk-virtual-scroll-viewport itemSize="72" class="h-[600px]">
  @for (sale of sales(); track sale._id) {
    <app-sale-row *cdkVirtualFor="let sale of sales()" [sale]="sale" />
  }
</cdk-virtual-scroll-viewport>
```

---

## Performance Checklist

| Optimization | Status |
|---|---|
| `OnPush` on every component | Required |
| Signals for reactive state | Required |
| `track` in every `@for` | Required |
| Lazy-loaded feature routes | Required |
| Tailwind full class names (no dynamic strings) | Required |
| `withFetch()` in HttpClient | Required |
| `shareReplay(1)` for reference data | Recommended |
| `async` pipe over manual subscribe | Recommended |
| Virtual scrolling for large lists | Recommended |
