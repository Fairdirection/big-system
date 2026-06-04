import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  effect,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { forkJoin } from "rxjs";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { EmployeeService } from "@core/services/employee.service";
import { ThemeService } from "@core/services/theme.service";
import { Employee } from "@core/models/employee.model";
import { CurrencyEgpPipe } from "@shared/pipes/currency-egp.pipe";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import {
  heroPlus,
  heroIdentification,
  heroEnvelope,
  heroPhone,
  heroChevronRight,
  heroCalendarDays,
  heroChartBar,
  heroSquares2x2,
  heroTableCells,
} from "@ng-icons/heroicons/outline";
import { RouterLink } from "@angular/router";
import { BadgeComponent } from "@shared/components/badge/badge.component";
import { environment } from "@env/environment";
import { formatQuarter } from "@core/utils/quarter.utils";
import { ListToolbarComponent } from "@shared/components/list-toolbar/list-toolbar.component";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { EmployeeFrameService } from "@shared/employee-frame/employee-frame.service";
import { AvatarFrameComponent } from "@shared/components/avatar-frame/avatar-frame.component";

interface EmployeeWithQuarterlyTarget extends Employee {
  _quarterlyTarget?: number | null; // adjusted target for active quarter
  _hasCustomTarget?: boolean; // true when a custom override exists in DB
  _fullTarget?: number | null; // original target before any team leader adjustments
}

@Component({
  selector: "app-employee-list",
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    CurrencyEgpPipe,
    NgIconComponent,
    RouterLink,
    ListToolbarComponent,
    TranslateModule,
    AvatarFrameComponent,
  ],
  providers: [
    provideIcons({
      heroPlus,
      heroIdentification,
      heroEnvelope,
      heroPhone,
      heroChevronRight,
      heroCalendarDays,
      heroChartBar,
      heroSquares2x2,
      heroTableCells,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1
            class="text-2xl sm:text-3xl font-display font-bold text-sf-text tracking-tight"
          >
            {{ "employee.list.title" | translate }}
          </h1>
          <p class="text-sf-muted font-medium mt-1 text-sm">
            {{ "employee.list.subtitle" | translate }}
          </p>
        </div>
        <button
          [routerLink]="['new']"
          class="btn btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <ng-icon name="heroPlus"></ng-icon>
          <span>{{ "employee.list.add" | translate }}</span>
        </button>
      </header>

      <!-- Toolbar row: ListToolbar + View toggle -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
        <div class="flex-1">
          <app-list-toolbar
            placeholder="بحث بالاسم، الكود أو البريد..."
            [statusOptions]="statusOptions"
            [activeStatus]="statusFilter()"
            [count]="filteredEmployees().length"
            [loading]="loading()"
            (searchChange)="onSearch($event)"
            (statusChange)="changeStatusFilter($event)"
          />
        </div>

        <!-- View toggle -->
        <div
          class="flex items-center gap-1 p-1 bg-sf-surface border border-sf-border rounded-2xl self-start flex-shrink-0 h-[50px] mt-0.5"
        >
          <button
            (click)="viewMode.set('card')"
            class="p-2 rounded-xl transition-all duration-200"
            [class.bg-sf-primary]="viewMode() === 'card'"
            [class.text-white]="viewMode() === 'card'"
            [class.text-sf-muted]="viewMode() !== 'card'"
            title="عرض البطاقات"
          >
            <ng-icon name="heroSquares2x2" class="text-lg"></ng-icon>
          </button>
          <button
            (click)="viewMode.set('table')"
            class="p-2 rounded-xl transition-all duration-200"
            [class.bg-sf-primary]="viewMode() === 'table'"
            [class.text-white]="viewMode() === 'table'"
            [class.text-sf-muted]="viewMode() !== 'table'"
            title="عرض القائمة"
          >
            <ng-icon name="heroTableCells" class="text-lg"></ng-icon>
          </button>
        </div>
      </div>

      <!-- Employee Grid (card view) -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
        *ngIf="!loading() && viewMode() === 'card'; else tableOrSkeleton"
      >
        @for (emp of filteredEmployees(); track emp._id) {
          <div
            class="relative emp-card-frame rounded-2xl overflow-hidden cursor-pointer flex flex-col group"
            [style]="
              frameService.getCardStyles(emp.seniorityLevel, emp.department)
            "
            [class.emp-exclusive-texture]="
              frameService.getTheme(emp.seniorityLevel, emp.department)
                .exclusive
            "
            [routerLink]="[emp._id]"
          >
            <!-- ░░ SHAPE INSIGNIA FRAME — each tier has a unique geometric motif ░░ -->
            @let tier =
              frameService.getTheme(emp.seniorityLevel, emp.department).tier;
            <svg
              class="emp-frame-svg absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              [style.color]="'rgb(var(--emp-r))'"
              [style.opacity]="
                tier === 1
                  ? '0'
                  : tier === 2
                    ? '0.5'
                    : tier === 3
                      ? '0.6'
                      : tier === 4
                        ? '0.7'
                        : tier === 5
                          ? '0.82'
                          : '0.92'
              "
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              @switch (tier) {
                <!-- ═══════════════════════════════════════════════════════
                     TIER 2 · BA · Motif: CIRCLES
                     4 filled circles at corners + extending double-lines
                ═══════════════════════════════════════════════════════ -->
                @case (2) {
                  <!-- Corner circles (filled) -->
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <circle
                    cx="93"
                    cy="7"
                    r="5"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <circle
                    cx="7"
                    cy="93"
                    r="5"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <circle
                    cx="93"
                    cy="93"
                    r="5"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Inner outline rings on top two circles -->
                  <circle
                    cx="7"
                    cy="7"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    opacity="0.35"
                    vector-effect="non-scaling-stroke"
                  />
                  <circle
                    cx="93"
                    cy="7"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    opacity="0.35"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Extending lines from top circles along edges -->
                  <g
                    stroke="currentColor"
                    stroke-width="1.5"
                    opacity="0.55"
                    vector-effect="non-scaling-stroke"
                  >
                    <line x1="12" y1="7" x2="26" y2="7" />
                    <line x1="88" y1="7" x2="74" y2="7" />
                    <line x1="7" y1="12" x2="7" y2="24" />
                    <line x1="93" y1="12" x2="93" y2="24" />
                  </g>
                }

                <!-- ═══════════════════════════════════════════════════════
                     TIER 3 · BC · Motif: TRIANGLES
                     Right triangles in each corner — sharp, technical
                ═══════════════════════════════════════════════════════ -->
                @case (3) {
                  <!-- Filled corner triangles (pointing inward) -->
                  <path
                    d="M 2,2 L 2,22 L 22,2 Z"
                    fill="currentColor"
                    opacity="0.8"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 98,2 L 78,2 L 98,22 Z"
                    fill="currentColor"
                    opacity="0.8"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 2,98 L 22,98 L 2,78 Z"
                    fill="currentColor"
                    opacity="0.8"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 98,98 L 98,78 L 78,98 Z"
                    fill="currentColor"
                    opacity="0.8"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Inner triangle outlines for depth -->
                  <path
                    d="M 4,4 L 4,16 L 16,4 Z"
                    fill="none"
                    stroke="white"
                    stroke-width="0.8"
                    opacity="0.25"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 96,4 L 84,4 L 96,16 Z"
                    fill="none"
                    stroke="white"
                    stroke-width="0.8"
                    opacity="0.25"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Top center: 3-dot row -->
                  <g
                    fill="currentColor"
                    opacity="0.7"
                    vector-effect="non-scaling-stroke"
                  >
                    <circle cx="42" cy="3" r="2" />
                    <circle cx="50" cy="3" r="2" />
                    <circle cx="58" cy="3" r="2" />
                  </g>
                }

                <!-- ═══════════════════════════════════════════════════════
                     TIER 4 · Senior · Motif: DIAMONDS
                     Large filled diamonds at corners + center badge
                ═══════════════════════════════════════════════════════ -->
                @case (4) {
                  <!-- Large filled corner diamonds -->
                  <path
                    d="M 10,2 L 18,10 L 10,18 L 2,10 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 90,2 L 98,10 L 90,18 L 82,10 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 10,98 L 18,90 L 10,82 L 2,90 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 90,98 L 98,90 L 90,82 L 82,90 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Inner outline for 3D depth effect -->
                  <path
                    d="M 10,4 L 16,10 L 10,16 L 4,10 Z"
                    fill="none"
                    stroke="white"
                    stroke-width="1"
                    opacity="0.3"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 90,4 L 96,10 L 90,16 L 84,10 Z"
                    fill="none"
                    stroke="white"
                    stroke-width="1"
                    opacity="0.3"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Lines from top diamonds along edges -->
                  <g
                    stroke="currentColor"
                    stroke-width="1.2"
                    opacity="0.5"
                    vector-effect="non-scaling-stroke"
                  >
                    <line x1="18" y1="10" x2="34" y2="10" />
                    <line x1="82" y1="10" x2="66" y2="10" />
                  </g>
                  <!-- Top center: larger diamond badge -->
                  <path
                    d="M 50,1 L 56,7 L 50,13 L 44,7 Z"
                    fill="currentColor"
                    opacity="0.9"
                    vector-effect="non-scaling-stroke"
                  />
                }

                <!-- ═══════════════════════════════════════════════════════
                     TIER 5 · SV · Motif: 4-POINTED STARS
                     Bold 4-pointed stars at corners + side & center badges
                ═══════════════════════════════════════════════════════ -->
                @case (5) {
                  <!-- 4-pointed stars at each corner (outer r=9, inner r=4) -->
                  <!-- TL star -->
                  <path
                    d="M 10,1 L 13,7 L 19,10 L 13,13 L 10,19 L 7,13 L 1,10 L 7,7 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- TR star -->
                  <path
                    d="M 90,1 L 93,7 L 99,10 L 93,13 L 90,19 L 87,13 L 81,10 L 87,7 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- BL star -->
                  <path
                    d="M 10,99 L 13,93 L 19,90 L 13,87 L 10,81 L 7,87 L 1,90 L 7,93 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- BR star -->
                  <path
                    d="M 90,99 L 93,93 L 99,90 L 93,87 L 90,81 L 87,87 L 81,90 L 87,93 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Inner shine on top stars -->
                  <path
                    d="M 10,4 L 12,8.5 L 16,10 L 12,11.5 L 10,16 L 8,11.5 L 4,10 L 8,8.5 Z"
                    fill="white"
                    opacity="0.2"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 90,4 L 92,8.5 L 96,10 L 92,11.5 L 90,16 L 88,11.5 L 84,10 L 88,8.5 Z"
                    fill="white"
                    opacity="0.2"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Side center: small 4-pointed stars -->
                  <path
                    d="M 2,50 L 4,46 L 8,50 L 4,54 Z"
                    fill="currentColor"
                    opacity="0.75"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 98,50 L 96,46 L 92,50 L 96,54 Z"
                    fill="currentColor"
                    opacity="0.75"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Top center: circle with star inside -->
                  <circle
                    cx="50"
                    cy="5"
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    opacity="0.7"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 50,2 L 51,4.5 L 53,5 L 51,5.5 L 50,8 L 49,5.5 L 47,5 L 49,4.5 Z"
                    fill="currentColor"
                    opacity="0.9"
                    vector-effect="non-scaling-stroke"
                  />
                }

                <!-- ═══════════════════════════════════════════════════════
                     TIER 6 · TeamLeader · Motif: HEXAGONS + CROWN
                     Flat-top hexagons at corners + crown at top center
                     Exclusive: the highest authority frame
                ═══════════════════════════════════════════════════════ -->
                @case (6) {
                  <!-- Flat-top hexagons at 4 corners (cx=10,cy=10, r=10) -->
                  <!-- Flat-top hex: top=(10,0), tr=(18.7,5), br=(18.7,15), b=(10,20), bl=(1.3,15), tl=(1.3,5) -->
                  <path
                    d="M 10,0 L 18.7,5 L 18.7,15 L 10,20 L 1.3,15 L 1.3,5 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- TR hex (cx=90,cy=10) -->
                  <path
                    d="M 90,0 L 98.7,5 L 98.7,15 L 90,20 L 81.3,15 L 81.3,5 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- BL hex (cx=10,cy=90) -->
                  <path
                    d="M 10,100 L 18.7,95 L 18.7,85 L 10,80 L 1.3,85 L 1.3,95 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- BR hex (cx=90,cy=90) -->
                  <path
                    d="M 90,100 L 98.7,95 L 98.7,85 L 90,80 L 81.3,85 L 81.3,95 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Inner shine on all hexagons -->
                  <path
                    d="M 10,2 L 17,6 L 17,14 L 10,18 L 3,14 L 3,6 Z"
                    fill="none"
                    stroke="white"
                    stroke-width="1"
                    opacity="0.25"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    d="M 90,2 L 97,6 L 97,14 L 90,18 L 83,14 L 83,6 Z"
                    fill="none"
                    stroke="white"
                    stroke-width="1"
                    opacity="0.25"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Lines connecting top hexagons to crown -->
                  <g
                    stroke="currentColor"
                    stroke-width="1.5"
                    opacity="0.55"
                    vector-effect="non-scaling-stroke"
                  >
                    <line x1="19" y1="10" x2="32" y2="10" />
                    <line x1="81" y1="10" x2="68" y2="10" />
                  </g>
                  <!-- CROWN at top center (filled) -->
                  <path
                    d="M 32,12 L 32,5 L 40,10 L 50,3 L 60,10 L 68,5 L 68,12 Z"
                    fill="currentColor"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Crown base bar -->
                  <rect
                    x="32"
                    y="12"
                    width="36"
                    height="4"
                    fill="currentColor"
                    rx="1"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Crown shine -->
                  <path
                    d="M 34,7 L 34,5 L 40,9 L 50,4 L 60,9 L 66,5 L 66,7 L 60,11 L 50,6 L 40,11 Z"
                    fill="white"
                    opacity="0.2"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Side vertical accent bars -->
                  <g
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    opacity="0.55"
                    vector-effect="non-scaling-stroke"
                  >
                    <line x1="2" y1="35" x2="2" y2="65" />
                    <line x1="98" y1="35" x2="98" y2="65" />
                  </g>
                  <!-- Side ticks -->
                  <line
                    x1="0"
                    y1="50"
                    x2="6"
                    y2="50"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    opacity="0.55"
                    vector-effect="non-scaling-stroke"
                  />
                  <line
                    x1="94"
                    y1="50"
                    x2="100"
                    y2="50"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    opacity="0.55"
                    vector-effect="non-scaling-stroke"
                  />
                }
              }
            </svg>

            <!-- Header accent band -->
            <div
              class="emp-header-band absolute top-0 inset-x-0 h-20 pointer-events-none"
            ></div>

            <!-- Rank accent strip (leading edge, RTL-safe) -->
            <div
              class="absolute start-0 top-0 bottom-0 w-[3px] emp-accent-strip"
            ></div>

            <!-- Card content — z-20 ensures it always sits above decorative SVG/strips -->
            <div class="relative z-20 p-5 flex flex-col gap-4">
              <!-- Top Row: Avatar + Identity -->
              <div class="flex items-start gap-4 min-w-0">
                <!-- Animated SVG avatar frame -->
                <app-avatar-frame
                  [level]="
                    frameService.getFrameLevel(
                      emp.seniorityLevel,
                      emp.department
                    )
                  "
                  [variant]="
                    frameService.getFrameVariant(
                      emp.seniorityLevel,
                      emp.department,
                      emp.jobTitle
                    )
                  "
                  [initials]="emp.name.charAt(0)"
                  [avatarUrl]="emp.avatarUrl ?? null"
                >
                </app-avatar-frame>

                <!-- Identity block -->
                <div class="flex-1 min-w-0 pt-0.5">
                  <h3
                    class="text-sm font-bold text-sf-text group-hover:text-sf-primary transition-colors truncate leading-tight"
                  >
                    {{ emp.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      class="text-[10px] font-bold text-sf-muted uppercase tracking-widest"
                      >#{{ emp.code }}</span
                    >
                    <app-badge
                      [color]="emp.isActive ? 'success' : 'gray'"
                      class="shrink-0"
                    >
                      {{
                        emp.isActive
                          ? ("common.status_active" | translate)
                          : ("common.status_inactive" | translate)
                      }}
                    </app-badge>
                  </div>
                  <!-- Seniority + pip dots + tier label -->
                  <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      class="text-[11px] text-sf-muted font-medium truncate"
                      >{{ translateSeniority(emp.seniorityLevel) }}</span
                    >
                    <div class="flex items-center gap-[3px] shrink-0">
                      @for (pip of [1, 2, 3, 4, 5, 6]; track pip) {
                        <span
                          class="emp-pip"
                          [style.opacity]="pip <= tier ? '1' : '0.12'"
                        ></span>
                      }
                    </div>
                    <span
                      class="emp-tier-chip inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black border tracking-wider leading-none shrink-0"
                    >
                      {{
                        frameService.getTheme(
                          emp.seniorityLevel,
                          emp.department
                        ).tierLabel
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-sf-border/25"></div>

              <!-- Info Row -->
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div class="flex items-center gap-1.5 min-w-0">
                  <ng-icon
                    name="heroIdentification"
                    class="text-sf-muted text-sm shrink-0"
                  ></ng-icon>
                  <span class="text-sf-muted truncate font-medium">{{
                    translateDepartment(emp.department)
                  }}</span>
                </div>
                <div class="flex items-center gap-1.5 min-w-0">
                  <ng-icon
                    name="heroCalendarDays"
                    class="text-sf-muted text-sm shrink-0"
                  ></ng-icon>
                  <span class="text-sf-muted truncate font-medium">{{
                    emp.hireDate | date: "MMM yyyy"
                  }}</span>
                </div>
                @if (emp.department === "Sales") {
                  <div
                    class="col-span-2 flex items-center gap-1.5 min-w-0 pt-1"
                  >
                    <ng-icon
                      name="heroChartBar"
                      class="text-sm shrink-0"
                      [style.color]="'rgb(var(--emp-r))'"
                    ></ng-icon>
                    <span class="font-black text-sf-text truncate">{{
                      getEffectiveTarget(emp) | currencyEgp
                    }}</span>
                    <span class="text-[9px] text-sf-muted shrink-0">{{
                      formatQ(currentQuarter())
                    }}</span>
                  </div>
                }
              </div>

              <!-- Actions Footer -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-1.5">
                  <button
                    class="p-1.5 bg-sf-bg border border-sf-border rounded-lg text-sf-muted hover:text-sf-primary hover:border-sf-primary/30 transition-all"
                    [title]="emp.email"
                    (click)="$event.stopPropagation()"
                  >
                    <ng-icon name="heroEnvelope" class="text-xs"></ng-icon>
                  </button>
                  @if (emp.phone) {
                    <button
                      class="p-1.5 bg-sf-bg border border-sf-border rounded-lg text-sf-muted hover:text-sf-primary hover:border-sf-primary/30 transition-all"
                      [title]="emp.phone"
                      (click)="$event.stopPropagation()"
                    >
                      <ng-icon name="heroPhone" class="text-xs"></ng-icon>
                    </button>
                  }
                </div>
                <span
                  class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest group-hover:gap-2 transition-all shrink-0"
                  [style.color]="'rgb(var(--emp-r))'"
                >
                  {{ "employee.detail.edit_btn" | translate }}
                  <ng-icon
                    name="heroChevronRight"
                    class="rotate-180 text-xs"
                  ></ng-icon>
                </span>
              </div>
            </div>
          </div>
        } @empty {
          <div
            class="col-span-full py-24 flex flex-col items-center justify-center text-sf-muted text-center"
          >
            <div
              class="w-20 h-20 rounded-full bg-sf-surface flex items-center justify-center mb-6 border border-sf-border border-dashed animate-pulse"
            >
              <ng-icon
                name="heroIdentification"
                class="text-4xl opacity-20"
              ></ng-icon>
            </div>
            <h3 class="text-xl font-bold">
              {{ "employee.list.no_data" | translate }}
            </h3>
            <p class="text-sm mt-1">
              تأكد من كتابة الاسم بشكل صحيح أو ابدأ بإضافة موظفين جدد.
            </p>
          </div>
        }
      </div>

      <!-- Table view / Skeleton -->
      <ng-template #tableOrSkeleton>
        <ng-container *ngIf="!loading(); else skeleton">
          <!-- List view — premium row-cards matching grid design language -->
          <div class="space-y-2 animate-fade-in" *ngIf="viewMode() === 'table'">
            <!-- Column headers -->
            <div
              class="flex items-center gap-4 px-5 pb-1 text-[9px] font-black text-sf-muted uppercase tracking-widest select-none"
            >
              <div class="w-10 ms-3 shrink-0">
                {{ "employee.list.title" | translate }}
              </div>
              <div class="flex-1"></div>
              <div class="w-32 hidden md:flex shrink-0">القسم والمستوى</div>
              <div class="w-28 hidden lg:flex justify-end shrink-0">
                {{ "employee.list.target_progress" | translate }}
              </div>
              <div class="w-20 hidden sm:flex justify-end shrink-0">
                {{ "employee.list.hire_date" | translate }}
              </div>
              <div class="w-16 flex justify-center shrink-0">
                {{ "employee.list.status" | translate }}
              </div>
              <div class="w-5 shrink-0"></div>
            </div>

            @for (emp of filteredEmployees(); track emp._id) {
              <div
                class="relative flex items-center gap-4 px-5 py-3.5 rounded-2xl
                          emp-card-frame cursor-pointer group transition-all duration-200"
                [style]="
                  frameService.getCardStyles(emp.seniorityLevel, emp.department)
                "
                [class.emp-exclusive-texture]="
                  frameService.getTheme(emp.seniorityLevel, emp.department)
                    .exclusive
                "
                [routerLink]="[emp._id]"
              >
                <!-- Rank accent strip (leading edge) -->
                <div
                  class="absolute start-0 top-2 bottom-2 w-[3px] rounded-full emp-accent-strip"
                ></div>

                <!-- Avatar with rank ring (compact, non-animated) -->
                <div
                  class="ms-1 w-10 h-10 rounded-full shrink-0 overflow-hidden"
                  style="outline: var(--emp-ring-w) solid rgb(var(--emp-r)); outline-offset: 2px;"
                >
                  @if (emp.avatarUrl) {
                    <img
                      [src]="emp.avatarUrl"
                      class="w-full h-full object-cover"
                    />
                  } @else {
                    <div
                      class="emp-avatar-initials w-full h-full flex items-center justify-center text-white text-sm font-display font-black"
                    >
                      {{ emp.name.charAt(0) }}
                    </div>
                  }
                </div>

                <!-- Name + code + tier indicator -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p
                      class="text-sm font-bold text-sf-text group-hover:text-sf-primary transition-colors truncate leading-tight"
                    >
                      {{ emp.name }}
                    </p>
                    <!-- Tier pip dots -->
                    <div class="flex items-center gap-[3px] shrink-0">
                      @for (pip of [1, 2, 3, 4, 5, 6]; track pip) {
                        <span
                          class="emp-pip"
                          [style.opacity]="
                            pip <=
                            frameService.getTheme(
                              emp.seniorityLevel,
                              emp.department
                            ).tier
                              ? '1'
                              : '0.12'
                          "
                        ></span>
                      }
                    </div>
                    <span
                      class="emp-tier-chip inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black border tracking-wider leading-none shrink-0"
                    >
                      {{
                        frameService.getTheme(
                          emp.seniorityLevel,
                          emp.department
                        ).tierLabel
                      }}
                    </span>
                  </div>
                  <p
                    class="text-[10px] font-bold text-sf-muted uppercase tracking-widest mt-0.5"
                  >
                    #{{ emp.code }}
                  </p>
                </div>

                <!-- Department + seniority -->
                <div class="w-32 hidden md:block shrink-0">
                  <p class="text-xs font-semibold text-sf-text truncate">
                    {{ translateDepartment(emp.department) }}
                  </p>
                  <p class="text-[10px] text-sf-muted truncate">
                    {{ translateSeniority(emp.seniorityLevel) }}
                  </p>
                </div>

                <!-- Target (sales) -->
                <div class="w-28 hidden lg:flex flex-col items-end shrink-0">
                  @if (emp.department === "Sales") {
                    <span
                      class="text-sm font-black font-mono-numbers leading-tight"
                      [style.color]="'rgb(var(--emp-r))'"
                    >
                      {{ getEffectiveTarget(emp) | currencyEgp }}
                    </span>
                    <span class="text-[9px] text-sf-muted">{{
                      formatQ(currentQuarter())
                    }}</span>
                  } @else {
                    <span class="text-sf-subtle text-xs">—</span>
                  }
                </div>

                <!-- Hire date -->
                <div class="w-20 hidden sm:flex justify-end shrink-0">
                  <span class="text-xs font-medium text-sf-muted">{{
                    emp.hireDate | date: "MMM yyyy"
                  }}</span>
                </div>

                <!-- Status badge -->
                <div class="w-16 flex justify-center shrink-0">
                  <app-badge [color]="emp.isActive ? 'success' : 'gray'">
                    {{
                      emp.isActive
                        ? ("common.status_active" | translate)
                        : ("common.status_inactive" | translate)
                    }}
                  </app-badge>
                </div>

                <!-- Chevron -->
                <ng-icon
                  name="heroChevronRight"
                  class="rotate-180 text-sf-muted group-hover:text-sf-primary transition-colors text-sm shrink-0 w-5"
                ></ng-icon>
              </div>
            } @empty {
              <div
                class="py-24 flex flex-col items-center justify-center text-sf-muted text-center"
              >
                <div
                  class="w-20 h-20 rounded-full bg-sf-surface flex items-center justify-center mb-6 border border-sf-border border-dashed animate-pulse"
                >
                  <ng-icon
                    name="heroIdentification"
                    class="text-4xl opacity-20"
                  ></ng-icon>
                </div>
                <h3 class="text-xl font-bold">
                  {{ "employee.list.no_data" | translate }}
                </h3>
              </div>
            }
          </div>
        </ng-container>
      </ng-template>

      <!-- Skeleton Loader -->
      <ng-template #skeleton>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
        >
          <div
            class="h-56 bg-sf-surface rounded-2xl border border-sf-border skeleton"
            *ngFor="let i of [1, 2, 3, 4, 5, 6]"
          ></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .shadow-glow-sm {
        box-shadow: 0 0 15px rgba(147, 51, 234, 0.2);
      }
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in {
        animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `,
  ],
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private themeService = inject(ThemeService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  frameService = inject(EmployeeFrameService);

  employees = signal<EmployeeWithQuarterlyTarget[]>([]);
  searchTerm = signal("");
  statusFilter = signal<"active" | "inactive" | "all">("active");
  loading = signal(true);
  filteredEmployees = signal<EmployeeWithQuarterlyTarget[]>([]);
  viewMode = signal<"card" | "table">("table");
  currentQuarter = this.themeService.currentQuarter;

  readonly statusOptions = [
    { value: "active", label: "النشطون" },
    { value: "inactive", label: "غير النشطين" },
    { value: "all", label: "الكل" },
  ];

  constructor() {
    effect(() => {
      const q = this.themeService.currentQuarter();
      this.loadEmployees(q);
    });
  }

  ngOnInit() {}

  loadEmployees(quarterId?: string) {
    const quarter = quarterId || this.currentQuarter();
    this.themeService.loading.set(true);
    this.loading.set(true);

    forkJoin({
      employees: this.employeeService.getEmployees({ limit: "500" }),
      targets: this.http.get<any>(`${environment.apiUrl}/targets/summary`, {
        params: { quarterId: quarter },
      }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ employees: res, targets: targetsRes }) => {
          this.themeService.loading.set(false);
          this.loading.set(false);

          if (res.success) {
            const baseEmployees: EmployeeWithQuarterlyTarget[] = res.data.map(
              (e) => ({
                ...e,
                _quarterlyTarget: undefined,
              }),
            );
            this.employees.set(baseEmployees);
            this.applyFilters();

            if (targetsRes.success && targetsRes.data && targetsRes.data.employees) {
              const targetMap = new Map<
                string,
                { adjusted: number | null; full: number | null; hasCustom: boolean }
              >();
              for (const empData of targetsRes.data.employees) {
                targetMap.set(empData.employeeId?.toString(), {
                  adjusted: empData.adjustedTarget ?? null,
                  full: empData.fullTarget ?? null,
                  hasCustom: empData.hasCustomTarget ?? false,
                });
              }

              const enriched = baseEmployees.map((emp) => {
                const t = targetMap.get(emp._id.toString());
                return {
                  ...emp,
                  _quarterlyTarget: t ? t.adjusted : null,
                  _fullTarget: t ? t.full : null,
                  _hasCustomTarget: t ? t.hasCustom : false,
                };
              });

              this.employees.set(enriched);
              this.applyFilters();
            }
          }
        },
        error: () => {
          this.themeService.loading.set(false);
          this.loading.set(false);
        },
      });
  }

  loadQuarterlyTargets(
    baseEmployees: EmployeeWithQuarterlyTarget[],
    quarterId: string,
  ) {
    // Fetch the target summary which contains computed targets for all sales employees
    this.http
      .get<any>(`${environment.apiUrl}/targets/summary`, {
        params: { quarterId },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.themeService.loading.set(false);
          this.loading.set(false);

          if (res.success && res.data && res.data.employees) {
            const targetMap = new Map<
              string,
              { adjusted: number | null; full: number | null; hasCustom: boolean }
            >();
            for (const empData of res.data.employees) {
              targetMap.set(empData.employeeId?.toString(), {
                adjusted: empData.adjustedTarget ?? null,
                full: empData.fullTarget ?? null,
                hasCustom: empData.hasCustomTarget ?? false,
              });
            }

            const enriched = this.employees().map((emp) => {
              const t = targetMap.get(emp._id.toString());
              return {
                ...emp,
                _quarterlyTarget: t ? t.adjusted : null,
                _fullTarget: t ? t.full : null,
                _hasCustomTarget: t ? t.hasCustom : false,
              };
            });

            this.employees.set(enriched);
            this.applyFilters();
          }
        },
        error: () => {
          this.themeService.loading.set(false);
          this.loading.set(false);
        },
      });
  }

  /** Returns the effective display target computed by the backend. */
  getEffectiveTarget(emp: EmployeeWithQuarterlyTarget): number {
    if (emp.seniorityLevel === 'TeamLeader' || emp.seniorityLevel === 'SalesManager') {
      if (emp._fullTarget !== null && emp._fullTarget !== undefined && emp._fullTarget > 0) {
        return emp._fullTarget;
      }
    }
    if (emp._quarterlyTarget !== null && emp._quarterlyTarget !== undefined) {
      return emp._quarterlyTarget;
    }
    return emp.target ?? 0;
  }

  onSearch(query: string) {
    this.searchTerm.set(query.toLowerCase());
    this.applyFilters();
  }

  changeStatusFilter(filter: string) {
    this.statusFilter.set(filter as "active" | "inactive" | "all");
    this.applyFilters();
  }

  applyFilters() {
    const term = this.searchTerm().toLowerCase();
    const filter = this.statusFilter();
    let list = this.employees();

    if (filter === "active") list = list.filter((e) => e.isActive);
    else if (filter === "inactive") list = list.filter((e) => !e.isActive);

    if (term) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.code.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term),
      );
    }

    this.filteredEmployees.set(list);
  }

  formatQ(q: string): string {
    return formatQuarter(q);
  }

  translateDepartment(dept: string): string {
    const key = `department.${dept}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : dept;
  }

  translateSeniority(level: string | undefined): string {
    if (!level) return this.translate.instant("seniority.unspecified");
    const key = `seniority.${level}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : level;
  }
}
