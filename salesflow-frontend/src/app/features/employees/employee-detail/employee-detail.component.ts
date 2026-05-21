import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, effect, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '@core/services/employee.service';
import { SaleService } from '@core/services/sale.service';
import { ThemeService } from '@core/services/theme.service';
import { getAvailableYears, formatQuarter } from '@core/utils/quarter.utils';
import { ToastService } from '@core/services/toast.service';
import { Employee } from '@core/models/employee.model';
import { ApiResponse } from '@core/models/api-response.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroChevronLeft, heroChevronRight, heroChevronDown, heroPencil, heroTrash, heroEnvelope, heroPhone,
  heroCalendar, heroBriefcase, heroClock, heroIdentification, heroTrophy, heroChartBar,
  heroUsers, heroXMark, heroCheck, heroHashtag, heroMapPin, heroBuildingOffice,
  heroPencilSquare, heroCalendarDays, heroExclamationTriangle, heroNoSymbol,
  heroUserGroup, heroArrowPath, heroSparkles, heroCamera
} from '@ng-icons/heroicons/outline';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@core/services/language.service';


@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, RouterLink, CurrencyEgpPipe, TranslateModule],
  providers: [
    provideIcons({
      heroChevronLeft, heroChevronRight, heroChevronDown, heroPencil, heroTrash, heroEnvelope, heroPhone,
      heroCalendar, heroBriefcase, heroClock, heroIdentification, heroTrophy, heroChartBar,
      heroUsers, heroXMark, heroCheck, heroHashtag, heroMapPin, heroBuildingOffice,
      heroPencilSquare, heroCalendarDays, heroExclamationTriangle, heroNoSymbol,
      heroUserGroup, heroArrowPath, heroSparkles, heroCamera
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ░░ PHOTO LIGHTBOX ░░ -->
    @if (lightboxOpen() && employee()?.avatarUrl) {
      <div class="lb-backdrop" (click)="lightboxOpen.set(false)">

        <!-- Ambient orbs -->
        <div class="lb-orb lb-orb-1"></div>
        <div class="lb-orb lb-orb-2"></div>
        <div class="lb-orb lb-orb-3"></div>

        <!-- Card -->
        <div class="lb-card" (click)="$event.stopPropagation()">

          <!-- Aurora photo ring -->
          <div class="lb-ring-wrap">
            <div class="lb-ring lb-ring-1"></div>
            <div class="lb-ring lb-ring-2"></div>
            <div class="lb-ring lb-ring-dots"></div>
            <div class="lb-photo-circle">
              <img [src]="employee()!.avatarUrl" class="lb-photo" />
            </div>
          </div>

          <!-- Name & title -->
          <div class="lb-info">
            <h2 class="lb-name">{{ employee()!.name }}</h2>
            @if (employee()!.jobTitle) {
              <p class="lb-title">{{ employee()!.jobTitle }}</p>
            }
            <p class="lb-dept">{{ employee()!.department }}</p>
          </div>

          <!-- Close -->
          <button class="lb-close" (click)="lightboxOpen.set(false)" aria-label="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" class="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    }

    <div class="space-y-8 animate-fade-in pb-20" *ngIf="employee() as emp">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <button (click)="goBack()" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
            <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
          </button>

          <div class="flex items-center gap-4 sm:gap-5 min-w-0">
            <!-- Clickable avatar -->
            <button (click)="emp.avatarUrl ? lightboxOpen.set(true) : null"
                    class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl shrink-0 overflow-hidden shadow-premium group outline-none p-0 border-0">
              @if (emp.avatarUrl) {
                <img [src]="emp.avatarUrl" class="w-full h-full object-cover transition-all group-hover:brightness-75" />
              } @else {
                <div class="w-full h-full bg-sf-primary/10 flex items-center justify-center text-sf-primary text-2xl sm:text-3xl font-display font-black transition-all group-hover:bg-sf-primary/20">
                  {{ emp.name.charAt(0) }}
                </div>
              }
              <!-- Camera badge -->
              <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ng-icon name="heroCamera" class="text-white text-xl"></ng-icon>
              </div>
            </button>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                <h1 class="text-2xl sm:text-3xl font-display font-black text-sf-text tracking-tight truncate leading-tight">{{ emp.name }}</h1>
                <span class="badge shrink-0" [class.badge-success]="emp.isActive" [class.badge-error]="!emp.isActive">
                  {{ emp.isActive ? ('common.status_active' | translate) : ('common.status_inactive' | translate) }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-sf-muted font-bold flex flex-wrap items-center gap-2">
                <span class="text-sf-primary">{{ emp.jobTitle }}</span>
                <span class="opacity-30">•</span>
                <span>{{ emp.department }}</span>
                <span class="opacity-30">•</span>
                <!-- Active global quarter indicator (read-only, from settings) -->
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black
                             bg-sf-primary/10 text-sf-primary border border-sf-primary/20 shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-sf-primary animate-pulse shrink-0"></span>
                  {{ formatQ(globalQuarter()) }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button [routerLink]="['edit']" class="btn btn-secondary h-11 sm:h-12 px-4 sm:px-6 flex-1 sm:flex-initial text-xs sm:text-sm">
            <ng-icon name="heroPencil"></ng-icon>
            <span>{{ 'employee.detail.edit_btn' | translate }}</span>
          </button>

          @if (emp.isActive) {
            <button (click)="openDeactivatePanel()"
                    [disabled]="deactivateOpen()"
                    class="btn btn-secondary h-11 sm:h-12 px-4 sm:px-6 flex-1 sm:flex-initial text-xs sm:text-sm">
              <ng-icon name="heroXMark"></ng-icon>
              <span>{{ 'employee.detail.deactivate_btn' | translate }}</span>
            </button>
          } @else {
            <button (click)="reactivate()" class="btn btn-primary h-11 sm:h-12 px-4 sm:px-6 flex-1 sm:flex-initial text-xs sm:text-sm">
              <ng-icon name="heroCheck"></ng-icon>
              <span>{{ 'employee.detail.activate_btn' | translate }}</span>
            </button>
          }

          <button (click)="deleteEmployee()" class="btn btn-danger h-11 sm:h-12 px-4 sm:px-6 flex-1 sm:flex-initial text-xs sm:text-sm flex items-center justify-center gap-2">
            <ng-icon name="heroTrash"></ng-icon>
            <span>{{ 'employee.detail.delete_btn' | translate }}</span>
          </button>

        </div>
      </header>

      <!-- ── Deactivation Panel ─────────────────────────────────── -->
      @if (deactivateOpen()) {
        <div class="rounded-3xl border border-sf-danger/25 overflow-hidden animate-slide-down shadow-2xl"
             style="background: linear-gradient(135deg, rgba(var(--sf-danger-rgb,239,68,68),0.04) 0%, rgba(var(--sf-bg-rgb,0,0,0),0) 60%)">
          <div class="h-1 w-full bg-gradient-to-r from-sf-danger via-rose-500 to-orange-500"></div>

          <div class="p-6 sm:p-8 space-y-6">
            <!-- Header -->
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-sf-danger/10 border border-sf-danger/20
                          flex items-center justify-center text-sf-danger shrink-0">
                <ng-icon name="heroNoSymbol" class="text-2xl"></ng-icon>
              </div>
              <div class="flex-1">
                <h3 class="text-base font-display font-black text-sf-text">{{ 'employee.detail.deactivate_title' | translate }}</h3>
                <p class="text-xs text-sf-muted font-medium mt-1 leading-relaxed">
                  {{ 'employee.detail.deactivate_desc' | translate: { name: emp.name } }}
                </p>
              </div>
              <button (click)="deactivateOpen.set(false)" class="w-7 h-7 rounded-lg bg-sf-surface border border-sf-border
                             flex items-center justify-center text-sf-muted hover:text-sf-text transition-all shrink-0">
                <ng-icon name="heroXMark" class="text-sm"></ng-icon>
              </button>
            </div>

            <!-- Date Picker -->
            <div class="space-y-3">
              <label class="flex items-center gap-2 text-xs font-black text-sf-text uppercase tracking-widest">
                <ng-icon name="heroCalendarDays" class="text-sf-danger text-base"></ng-icon>
                {{ 'employee.detail.deactivate_date_label' | translate }}
                <span class="text-sf-danger">*</span>
              </label>

              <div class="flex flex-col sm:flex-row gap-3">
                <div class="flex-1">
                  <input type="date"
                         [(ngModel)]="deactivateEndDate"
                         [max]="todayIso()"
                         class="w-full px-5 py-3.5 bg-sf-bg border-2 border-sf-danger/30 hover:border-sf-danger/50
                                focus:border-sf-danger rounded-2xl text-sm font-bold text-sf-text
                                outline-none transition-all focus:ring-4 focus:ring-sf-danger/10">
                  <p class="text-[10px] text-sf-muted font-medium mt-1.5 mr-1">
                    هذا التاريخ سيُسجل في السجل الوظيفي ويُستخدم في احتساب الأيام الفعلية
                  </p>
                </div>
              </div>
            </div>

            <!-- What will happen note -->
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-sf-surface border border-sf-border/50">
              <ng-icon name="heroExclamationTriangle" class="text-sf-warning text-base shrink-0 mt-0.5"></ng-icon>
              <ul class="space-y-1 text-[11px] font-semibold text-sf-muted">
                <li>• {{ 'employee.detail.deactivate_note_1' | translate }}</li>
                <li>• {{ 'employee.detail.deactivate_note_2' | translate }}</li>
                <li>• {{ 'employee.detail.deactivate_note_3' | translate }}</li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3 pt-1">
              <button (click)="confirmDeactivate()"
                      [disabled]="!deactivateEndDate || saving()"
                      class="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl
                             bg-sf-danger text-white font-black text-sm shadow-lg
                             hover:brightness-110 active:scale-[.98] disabled:opacity-40
                             disabled:cursor-not-allowed transition-all">
                @if (saving()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{{ 'employee.detail.deactivating' | translate }}</span>
                } @else {
                  <ng-icon name="heroNoSymbol" class="text-base"></ng-icon>
                  <span>{{ 'employee.detail.deactivate_confirm_btn' | translate }}</span>
                }
              </button>
              <button (click)="deactivateOpen.set(false)" [disabled]="saving()"
                      class="px-6 py-3.5 rounded-2xl bg-sf-surface border border-sf-border
                             text-sf-muted hover:text-sf-text font-bold text-sm transition-all">
                {{ 'common.cancel' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── Quarter Stepper ──────────────────────────────────── -->
      <div class="qs-root glass-card rounded-2xl transition-all duration-300"
           [class.border-sf-warning]="isHistorical()"
           [class.border-opacity-40]="isHistorical()">

        <!-- Animated shimmer accent bar (sits on top of border-radius, needs wrapper) -->
        <div class="rounded-t-2xl overflow-hidden" style="height:2px">
          <div class="qs-shimmer h-full"
               style="background-size:250% 100%"
               [style.background]="isHistorical()
                 ? 'linear-gradient(90deg,#f59e0b,#fbbf24,#f97316,#f59e0b)'
                 : 'linear-gradient(90deg,rgb(var(--sf-primary)),#a855f7,#ec4899,#06b6d4,rgb(var(--sf-primary)))'">
          </div>
        </div>

        <!-- Main row -->
        <div class="flex items-center gap-3 px-4 sm:px-5 py-3">

          <!-- ← Step back -->
          <button (click)="stepQuarter(-1)"
                  class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all
                         bg-sf-bg border border-sf-border text-sf-muted
                         hover:border-sf-primary/60 hover:text-sf-primary hover:bg-sf-primary/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 pointer-events-none">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <!-- Center: quarter display + dropdown -->
          <div class="flex-1 flex justify-center" style="position:relative">
            <button (click)="pickerOpen.set(!pickerOpen()); $event.stopPropagation()"
                    class="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer border-none
                           bg-transparent hover:bg-sf-surface/60 transition-all select-none">

              <!-- Big Q number -->
              <span class="font-display font-black leading-none tracking-tighter transition-colors"
                    style="font-size:2.2rem"
                    [class.text-sf-warning]="isHistorical()"
                    [class.text-sf-primary]="!isHistorical()">
                Q{{ viewQ() }}
              </span>

              <!-- Vertical divider -->
              <span class="w-px h-9 shrink-0 bg-sf-border/60"></span>

              <!-- Text block -->
              <span class="flex flex-col gap-0.5 text-start">
                <span class="text-sm font-black leading-tight transition-colors"
                      [class.text-sf-warning]="isHistorical()"
                      [class.text-sf-text]="!isHistorical()">
                  {{ formatQ(viewQuarter()) }}
                </span>
                <span class="text-[10px] font-semibold text-sf-muted tracking-wider">
                  {{ viewYear() }}
                </span>
              </span>

              <!-- Caret -->
              <ng-icon name="heroChevronDown"
                       class="text-xs text-sf-muted transition-transform duration-200 shrink-0"
                       [class.rotate-180]="pickerOpen()"></ng-icon>
            </button>

            <!-- Dropdown — rendered relative to the center div, not the clipped card -->
            @if (pickerOpen()) {
              <div class="glass-card rounded-2xl border border-sf-border shadow-2xl p-4 space-y-3 animate-slide-down"
                   style="position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);min-width:248px;z-index:200"
                   (click)="$event.stopPropagation()">

                @if (isHistorical()) {
                  <button (click)="jumpToNow()"
                          class="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
                                 bg-sf-primary/10 border border-sf-primary/20 text-sf-primary
                                 text-xs font-black hover:bg-sf-primary/20 transition-all">
                    <ng-icon name="heroArrowPath" class="text-sm shrink-0"></ng-icon>
                    {{ 'employee.detail.quarter_back_now' | translate }}
                  </button>
                }

                <!-- Year × Quarter grid -->
                <div class="grid gap-1.5" style="grid-template-columns:auto repeat(4,1fr)">
                  <div></div>
                  @for (q of [1,2,3,4]; track q) {
                    <div class="text-center text-[10px] font-black text-sf-muted pb-0.5">Q{{ q }}</div>
                  }
                  @for (y of availableYears; track y) {
                    <div class="text-[10px] font-bold text-sf-muted pe-2 flex items-center">'{{ y % 100 }}</div>
                    @for (q of [1,2,3,4]; track q) {
                      <button (click)="viewQuarter.set('Q'+q+'-'+y); pickerOpen.set(false)"
                              class="h-8 rounded-lg text-xs font-black transition-all"
                              [class]="viewYear()===y && viewQ()===q
                                ? 'bg-sf-primary text-white shadow-md'
                                : 'bg-sf-bg text-sf-muted border border-sf-border hover:border-sf-primary/50 hover:text-sf-text'">
                        Q{{ q }}
                      </button>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <!-- Back to now pill (historical only) -->
          @if (isHistorical()) {
            <button (click)="jumpToNow()"
                    class="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full
                           bg-sf-warning/10 border border-sf-warning/30 text-sf-warning
                           text-[10px] font-black hover:bg-sf-warning/20 transition-all">
              <ng-icon name="heroArrowPath" class="text-xs shrink-0"></ng-icon>
              <span class="hidden sm:inline">{{ 'employee.detail.quarter_back_now' | translate }}</span>
            </button>
          }

          <!-- → Step forward -->
          <button (click)="stepQuarter(1)"
                  class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all
                         bg-sf-bg border border-sf-border text-sf-muted
                         hover:border-sf-primary/60 hover:text-sf-primary hover:bg-sf-primary/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 pointer-events-none">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Stats & Info -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Quick Stats -->
          @if (emp.department === 'Sales') {
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-sf-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">{{ 'employee.detail.adjusted_target' | translate }}</p>
                <div class="flex items-end justify-between relative z-10">
                  <h4 class="text-2xl font-display font-black text-sf-text">{{ (stats()?.adjustedTarget || stats()?.fullTarget || emp.target) | currencyEgp }}</h4>
                  <div class="w-10 h-10 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary">
                    <ng-icon name="heroChartBar"></ng-icon>
                  </div>
                </div>
              </div>

              <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-sf-success/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">{{ 'employee.detail.total_sales' | translate }}</p>
                <div class="flex items-end justify-between relative z-10">
                  <h4 class="text-2xl font-display font-black text-sf-text">{{ (stats()?.achievedSales || 0) | currencyEgp }}</h4>
                  <div class="w-10 h-10 rounded-xl bg-sf-success/10 flex items-center justify-center text-sf-success">
                    <ng-icon name="heroTrophy"></ng-icon>
                  </div>
                </div>
              </div>

              <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-sf-accent/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">{{ 'employee.detail.achievement_pct' | translate }}</p>
                <div class="flex items-end justify-between relative z-10">
                  <h4 class="text-2xl font-display font-black text-sf-text">{{ (stats()?.achievementPercentage || 0) | number:'1.0-1' }}%</h4>
                  <div class="w-10 h-10 rounded-xl bg-sf-accent/10 flex items-center justify-center text-sf-accent">
                    <ng-icon name="heroChartBar"></ng-icon>
                  </div>
                </div>
              </div>

              <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-sf-warning/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">{{ 'employee.detail.active_clients' | translate }}</p>
                <div class="flex items-end justify-between relative z-10">
                  <h4 class="text-2xl font-display font-black text-sf-text">{{ stats()?.clientsCount || 0 }}</h4>
                  <div class="w-10 h-10 rounded-xl bg-sf-warning/10 flex items-center justify-center text-sf-warning">
                    <ng-icon name="heroUsers"></ng-icon>
                  </div>
                </div>
              </div>
            </div>

            <!-- Prorated Target Explanation Banner -->
            @if (stats()?.adjustedTarget && stats()?.adjustedTarget !== stats()?.fullTarget) {
              <div class="glass-card p-5 rounded-2xl border-r-4 border-r-sf-primary border-sf-border bg-sf-surface/60 flex items-center gap-4 shadow-md">
                <div class="w-10 h-10 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary">
                  <ng-icon name="heroClock"></ng-icon>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-black text-sf-text mb-0.5">{{ 'employee.detail.prorated_banner_title' | translate }}</p>
                  <p class="text-[10px] font-semibold text-sf-muted leading-relaxed">{{ 'employee.detail.prorated_banner_sub' | translate: { full: (stats()?.fullTarget | currencyEgp), days: stats()?.actualWorkingDays } }}</p>
                </div>
              </div>
            }
          }

          <!-- Profile Details -->
          <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-xl">
            <h3 class="text-xl font-display font-black text-sf-text mb-8">{{ 'employee.detail.info_title' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-12">
              <div class="flex items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group min-w-0">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors shrink-0">
                  <ng-icon name="heroIdentification" class="text-xl"></ng-icon>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">{{ 'employee.detail.code' | translate }}</p>
                  <p class="text-sm font-bold text-sf-text truncate">{{ emp.code }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group min-w-0">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors shrink-0">
                  <ng-icon name="heroEnvelope" class="text-xl"></ng-icon>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">{{ 'employee.detail.email' | translate }}</p>
                  <p class="text-sm font-bold text-sf-text truncate select-all" [title]="emp.email">{{ emp.email }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group min-w-0">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors shrink-0">
                  <ng-icon name="heroPhone" class="text-xl"></ng-icon>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">{{ 'employee.detail.phone' | translate }}</p>
                  <p class="text-sm font-bold text-sf-text truncate select-all">{{ emp.phone }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group min-w-0">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors shrink-0">
                  <ng-icon name="heroCalendar" class="text-xl"></ng-icon>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">{{ 'employee.detail.hire_date' | translate }}</p>
                  <p class="text-sm font-bold text-sf-text truncate">{{ emp.hireDate | date:'longDate' }}</p>
                </div>
              </div>

              @if (!emp.isActive) {
                <div class="flex items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-sf-danger/5 border border-sf-danger/20 min-w-0">
                  <div class="w-12 h-12 rounded-xl bg-sf-danger/10 flex items-center justify-center text-sf-danger shrink-0">
                    <ng-icon name="heroCalendarDays" class="text-xl"></ng-icon>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">{{ 'employee.detail.end_date' | translate }}</p>
                    <p class="text-sm font-bold text-sf-danger truncate">
                      {{ (emp.endDate || emp.updatedAt) | date:'d MMMM y' }}
                    </p>
                    <p class="text-[9px] text-sf-muted font-medium mt-0.5">{{ 'employee.detail.end_date_hint' | translate }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Sales Activity Section -->
          @if (emp.department === 'Sales') {
            <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-xl">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-xl font-display font-black text-sf-text">{{ 'employee.detail.sales_title' | translate }}</h3>
                <span class="px-4 py-1.5 rounded-full bg-sf-primary/10 text-sf-primary text-xs font-black">{{ 'employee.detail.sales_count' | translate: { count: sales().length } }}</span>
              </div>

              <div class="space-y-4">
                @for (sale of sales(); track sale._id) {
                  <div class="group p-5 rounded-2xl bg-sf-surface border border-sf-border hover:border-sf-primary/40 transition-all hover:shadow-lg">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0 w-full">
                      <div class="flex items-center gap-4 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-white border border-sf-border flex items-center justify-center text-sf-primary text-lg shadow-sm shrink-0">
                          <ng-icon name="heroBuildingOffice"></ng-icon>
                        </div>
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2 mb-1">
                            <p class="text-sm font-black text-sf-text truncate max-w-[150px] sm:max-w-[280px] md:max-w-none">{{ sale.projectName }}</p>
                            <span class="text-[10px] font-bold text-sf-muted px-2 py-0.5 rounded-full bg-sf-surface border border-sf-border shrink-0">الوحدة: {{ sale.unitNumber }}</span>
                          </div>
                          <div class="flex items-center gap-3 text-[10px] font-bold text-sf-muted truncate">
                            <span class="flex items-center gap-1 truncate"><ng-icon name="heroUsers" class="shrink-0"></ng-icon> {{ sale.clientName }}</span>
                            <span class="opacity-30 shrink-0">•</span>
                            <span class="flex items-center gap-1 shrink-0"><ng-icon name="heroCalendar" class="shrink-0"></ng-icon> {{ sale.contractDate | date:'shortDate' }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between md:justify-end gap-6 md:min-w-[180px] border-t md:border-t-0 pt-3 md:pt-0 border-sf-border/30">
                        <div class="text-right">
                          <p class="text-[10px] font-black text-sf-muted uppercase tracking-tighter mb-0.5">قيمة الوحدة</p>
                          <p class="text-sm font-black text-sf-primary">{{ sale.unitValue | currencyEgp }}</p>
                        </div>
                        <span class="badge h-8 px-4 shrink-0" 
                              [class.badge-success]="sale.status === 'collected' || sale.status === 'confirmed'"
                              [class.badge-warning]="sale.status === 'claimed'"
                              [class.badge-secondary]="sale.status === 'draft'">
                          {{ sale.status === 'confirmed' ? 'مؤكد' : 
                             sale.status === 'collected' ? 'مُحصل' : 
                             sale.status === 'claimed' ? 'قيد المطالبة' : 'مسودة' }}
                        </span>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-12 bg-sf-surface/50 rounded-3xl border border-dashed border-sf-border">
                    <p class="text-sf-muted font-bold">{{ 'employee.detail.sales_no_data' | translate }}</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Sidebar: Career History (redesigned) -->
        <div class="lg:col-span-1 space-y-6">
          <div class="glass-card rounded-3xl border border-sf-border shadow-xl sticky top-24 overflow-hidden">
            <!-- Card header with accent -->
            <div class="h-1 bg-gradient-to-r from-sf-primary via-purple-500 to-pink-500"></div>

            <div class="p-6">
              <!-- Header -->
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-base font-display font-black text-sf-text">{{ 'employee.history.title' | translate }}</h3>
                  <p class="text-[10px] text-sf-muted font-medium mt-0.5">{{ 'employee.history.events' | translate: { count: history().length } }}</p>
                </div>
                <button [routerLink]="['history/edit']"
                        class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sf-surface border border-sf-border
                               text-sf-muted hover:text-sf-primary hover:border-sf-primary/30 text-xs font-bold transition-all">
                  <ng-icon name="heroPencilSquare" class="text-sm"></ng-icon>
                  {{ 'employee.history.edit_btn' | translate }}
                </button>
              </div>

              <!-- Timeline -->
              @if (history().length === 0) {
                <div class="py-10 text-center space-y-2">
                  <ng-icon name="heroArrowPath" class="text-sf-border text-4xl mx-auto block"></ng-icon>
                  <p class="text-xs font-bold text-sf-muted">{{ 'employee.history.no_data' | translate }}</p>
                </div>
              } @else {
                <div class="relative space-y-2">
                  <!-- Vertical connector line -->
                  <div class="absolute right-[18px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-sf-border/80 to-transparent pointer-events-none"></div>

                  @for (item of history(); track $index; let isLast = $last) {

                    <!-- ── DEACTIVATION EVENT ──────────────────────── -->
                    @if (item.type === 'deactivated') {
                      <div class="relative pr-12 group animate-fade-in">
                        <!-- Icon badge -->
                        <div class="absolute right-0 top-3 w-9 h-9 rounded-xl border-2 z-10 flex items-center justify-center shadow-md
                                    bg-sf-danger/10 border-sf-danger/40 text-sf-danger">
                          <ng-icon name="heroNoSymbol" class="text-base"></ng-icon>
                        </div>

                        <div class="rounded-2xl border overflow-hidden transition-all
                                    bg-sf-danger/5 border-sf-danger/20 group-hover:border-sf-danger/40
                                    group-hover:shadow-lg">
                          <!-- Top bar -->
                          <div class="h-0.5 w-full bg-gradient-to-r from-sf-danger/60 to-transparent"></div>
                          <div class="p-4 space-y-3">
                            <!-- Label + edit button -->
                            <div class="flex items-center justify-between">
                              <span class="text-[10px] font-black text-sf-danger uppercase tracking-wider flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-sf-danger inline-block"></span>
                                {{ 'employee.history.type_deactivated' | translate }}
                              </span>
                              <button (click)="startEditEndDate(employee())"
                                      title="تعديل تاريخ التعطيل"
                                      class="w-6 h-6 rounded-lg bg-sf-surface border border-sf-border
                                             flex items-center justify-center text-sf-muted
                                             hover:text-sf-danger hover:border-sf-danger/30 transition-all">
                                <ng-icon name="heroPencilSquare" class="text-[10px]"></ng-icon>
                              </button>
                            </div>

                            <p class="text-sm font-black text-sf-text">{{ 'employee.history.terminated_name' | translate }}</p>

                            <!-- Date: view or edit -->
                            @if (!endDateEditing()) {
                              <div class="flex items-center gap-2 text-xs font-bold text-sf-danger">
                                <ng-icon name="heroCalendarDays" class="text-sm shrink-0"></ng-icon>
                                {{ item.startDate | date:'d MMMM y' }}
                              </div>
                            } @else {
                              <!-- Inline date edit -->
                              <div class="space-y-2 pt-1">
                                <input type="date"
                                       [(ngModel)]="endDateEditVal"
                                       [max]="todayIso()"
                                       class="w-full px-3 py-2.5 bg-sf-bg border-2 border-sf-danger/40
                                              focus:border-sf-danger rounded-xl text-sm font-bold
                                              text-sf-text outline-none transition-all focus:ring-2 focus:ring-sf-danger/15">
                                <div class="flex gap-2">
                                  <button (click)="saveEndDate()" [disabled]="!endDateEditVal || saving()"
                                          class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                                 bg-sf-danger text-white font-black text-xs
                                                 disabled:opacity-40 hover:brightness-110 transition-all">
                                    @if (saving()) {
                                      <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    } @else {
                                      <ng-icon name="heroCheck" class="text-xs"></ng-icon>
                                    }
                                    {{ 'employee.history.save_end_date' | translate }}
                                  </button>
                                  <button (click)="endDateEditing.set(false)" [disabled]="saving()"
                                          class="flex-1 py-2 rounded-xl bg-sf-surface border border-sf-border
                                                 text-sf-muted font-bold text-xs transition-all">
                                    {{ 'common.cancel' | translate }}
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    }

                    <!-- ── TEAM EVENT ──────────────────────────────── -->
                    @else if (item.type === 'team') {
                      <div class="relative pr-12 group">
                        <div class="absolute right-0 top-3 w-9 h-9 rounded-xl border-2 z-10 flex items-center justify-center shadow-sm
                                    bg-sf-primary/10 border-sf-primary/40 text-sf-primary transition-all group-hover:scale-105">
                          <ng-icon name="heroUserGroup" class="text-base"></ng-icon>
                        </div>

                        <div class="p-4 rounded-2xl border transition-all
                                    bg-sf-surface border-sf-border/40
                                    group-hover:border-sf-primary/30 group-hover:bg-sf-primary/[0.02]
                                    group-hover:shadow-md space-y-3">
                          <!-- Type label + duration -->
                          <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black text-sf-primary uppercase tracking-wider flex items-center gap-1.5">
                              <span class="w-1.5 h-1.5 rounded-full bg-sf-primary inline-block"></span>
                              {{ 'employee.history.type_team' | translate }}
                            </span>
                            <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-sf-bg border border-sf-border text-sf-muted">
                              {{ item.durationDays }} يوم
                            </span>
                          </div>

                          <p class="text-sm font-bold text-sf-text leading-tight">{{ item.name }}</p>

                          <!-- Dates -->
                          <div class="flex items-center gap-1.5 text-[10px] font-bold text-sf-muted">
                            <ng-icon name="heroCalendar" class="text-xs shrink-0"></ng-icon>
                            <span>{{ item.startDate | date:'d/M/y' }}</span>
                            <span class="opacity-50">←</span>
                            <span>{{ item.endDate ? (item.endDate | date:'d/M/y') : ('employee.history.until_now' | translate) }}</span>
                          </div>

                          <!-- Achievement -->
                          @if (item.achievement > 0) {
                            <div class="flex items-center gap-1.5 pt-1 border-t border-sf-border/30">
                              <ng-icon name="heroSparkles" class="text-sf-success text-xs shrink-0"></ng-icon>
                              <span class="text-[10px] font-black text-sf-success">
                                {{ 'employee.history.achievement_label' | translate: { amount: (item.achievement | number:'1.0-0') } }}
                              </span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- ── NO-TEAM / GAP EVENT ─────────────────────── -->
                    @else {
                      <div class="relative pr-12 group">
                        <div class="absolute right-0 top-3 w-9 h-9 rounded-xl border-2 z-10 flex items-center justify-center
                                    bg-sf-elevated border-sf-border/60 text-sf-muted transition-all group-hover:border-sf-border">
                          <ng-icon name="heroClock" class="text-base"></ng-icon>
                        </div>

                        <div class="p-4 rounded-2xl border border-sf-border/30 bg-sf-surface/50
                                    group-hover:border-sf-border transition-all space-y-3">
                          <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black text-sf-muted uppercase tracking-wider">{{ 'employee.history.type_no_team' | translate }}</span>
                            <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-sf-bg border border-sf-border/50 text-sf-muted">
                              {{ item.durationDays }} يوم
                            </span>
                          </div>

                          <p class="text-sm font-medium text-sf-muted leading-tight">{{ 'employee.history.no_team_label' | translate }}</p>

                          <div class="flex items-center gap-1.5 text-[10px] font-bold text-sf-subtle">
                            <ng-icon name="heroCalendar" class="text-xs shrink-0"></ng-icon>
                            <span>{{ item.startDate | date:'d/M/y' }}</span>
                            <span class="opacity-50">←</span>
                            <span>{{ item.endDate ? (item.endDate | date:'d/M/y') : ('employee.history.until_now' | translate) }}</span>
                          </div>
                        </div>
                      </div>
                    }

                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-down { animation: slide-down 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    :host { display: block; }

    /* Quarter stepper shimmer bar animation */
    @keyframes qs-shimmer { 0%{background-position:0%} 50%{background-position:100%} 100%{background-position:0%} }
    .qs-shimmer { animation: qs-shimmer 3s ease infinite; }

    /* ═══ LIGHTBOX ══════════════════════════════════════════════ */
    .lb-backdrop {
      position: fixed; inset: 0; z-index: 500;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
      background: radial-gradient(ellipse at 25% 20%, rgba(99,55,255,0.22) 0%, transparent 55%),
                  radial-gradient(ellipse at 75% 80%, rgba(236,72,153,0.15) 0%, transparent 50%),
                  rgba(4, 3, 12, 0.88);
      backdrop-filter: blur(24px) saturate(1.3);
      animation: lb-in 0.25s ease forwards;
    }
    @keyframes lb-in { from { opacity: 0 } to { opacity: 1 } }

    /* Ambient orbs */
    .lb-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(90px);
               animation: lb-drift 9s ease-in-out infinite alternate; }
    .lb-orb-1 { width: 500px; height: 500px; top: -15%; left: -10%;
                background: radial-gradient(circle, rgba(99,55,255,0.28), transparent 70%); }
    .lb-orb-2 { width: 420px; height: 420px; bottom: -15%; right: -8%;
                background: radial-gradient(circle, rgba(236,72,153,0.22), transparent 70%);
                animation-delay: -4s; }
    .lb-orb-3 { width: 280px; height: 280px; top: 40%; left: 60%;
                background: radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%);
                animation-delay: -7s; }
    @keyframes lb-drift { from{transform:translate(0,0)scale(1)} to{transform:translate(40px,-25px)scale(1.12)} }

    /* Card */
    .lb-card {
      position: relative; display: flex; flex-direction: column; align-items: center; gap: 28px;
      padding: 48px 40px 40px;
      background: linear-gradient(150deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.25) 100%);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; max-width: 380px; width: 100%;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 50px 100px rgba(0,0,0,0.75), 0 0 80px rgba(99,55,255,0.1);
      animation: lb-card-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes lb-card-in {
      from { opacity: 0; transform: scale(0.82) translateY(24px) }
      to   { opacity: 1; transform: scale(1) translateY(0) }
    }

    /* Aurora rings */
    .lb-ring-wrap { position: relative; width: 260px; height: 260px; display: flex; align-items: center; justify-content: center; }
    .lb-ring {
      position: absolute; border-radius: 50%;
      background: conic-gradient(from 0deg, #6337ff, #a855f7, #ec4899, #f97316, #06b6d4, #6337ff 360deg);
    }
    .lb-ring-1 { inset: -5px; animation: lb-spin 4s linear infinite; }
    .lb-ring-2 { inset: -10px; opacity: 0.35; filter: blur(10px); animation: lb-spin 4s linear infinite reverse; }
    .lb-ring-dots {
      position: absolute; inset: -20px; border-radius: 50%;
      border: 1px dashed rgba(255,255,255,0.12);
      animation: lb-spin 22s linear infinite; background: none;
    }
    @keyframes lb-spin { to { transform: rotate(360deg); } }

    /* Photo circle */
    .lb-photo-circle {
      position: relative; width: 250px; height: 250px; border-radius: 50%; overflow: hidden;
      background: #0c0a14; z-index: 1;
      box-shadow: 0 0 40px rgba(0,0,0,0.8);
    }
    .lb-photo { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* Shimmer sweep on the photo */
    .lb-photo-circle::after {
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%);
      background-size: 200% 100%;
      animation: lb-shimmer 0.7s 0.3s ease forwards;
    }
    @keyframes lb-shimmer {
      from { background-position: -100% 0; opacity: 1 }
      to   { background-position: 220% 0; opacity: 0 }
    }

    /* Name & info */
    .lb-info { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .lb-name {
      font-size: 1.5rem; font-weight: 900; color: #fff; letter-spacing: -0.02em;
      text-shadow: 0 2px 20px rgba(99,55,255,0.4);
      animation: lb-text-in 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both;
    }
    .lb-title {
      font-size: 0.78rem; font-weight: 700; color: rgba(99,55,255,0.85);
      letter-spacing: 0.04em;
      animation: lb-text-in 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both;
    }
    .lb-dept {
      font-size: 0.68rem; font-weight: 600; color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.12em;
      animation: lb-text-in 0.5s 0.25s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes lb-text-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

    /* Close button */
    .lb-close {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.15s;
    }
    .lb-close:hover { background: rgba(255,255,255,0.13); color: #fff; transform: rotate(90deg); }
    .badge { 
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-success { 
      background-color: rgba(var(--sf-success-rgb), 0.1); 
      color: var(--sf-success); 
    }
    .badge-error { 
      background-color: rgba(var(--sf-danger-rgb), 0.1); 
      color: var(--sf-danger); 
    }
    .badge-warning { 
      background-color: rgba(var(--sf-accent-rgb), 0.1); 
      color: var(--sf-accent); 
    }
    .badge-secondary { 
      background-color: rgba(var(--sf-muted-rgb), 0.1); 
      color: var(--sf-muted); 
    }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private saleService     = inject(SaleService);
  private destroyRef = inject(DestroyRef);
  private themeService    = inject(ThemeService);
  private confirmDialog   = inject(ConfirmDialogService);
  private toastService    = inject(ToastService);
  private translate       = inject(TranslateService);
  private langService     = inject(LanguageService);

  employee         = signal<Employee | null>(null);
  stats            = signal<any>(null);
  history          = signal<any[]>([]);
  sales            = signal<any[]>([]);
  lightboxOpen     = signal(false);

  // Local quarter navigation (independent from global navbar)
  viewQuarter   = signal(this.themeService.currentQuarter());
  globalQuarter = this.themeService.currentQuarter;   // read-only, from settings
  availableYears = getAvailableYears(2, 1);
  viewYear      = computed(() => parseInt(this.viewQuarter().split('-')[1]));
  viewQ         = computed(() => parseInt(this.viewQuarter().split('-')[0].replace('Q', '')));
  formatQ       = formatQuarter;
  pickerOpen    = signal(false);
  isHistorical  = computed(() => this.viewQuarter() !== this.themeService.currentQuarter());

  setYear(y: number) { this.viewQuarter.set(`Q${this.viewQ()}-${y}`); }
  setQ(q: number)    { this.viewQuarter.set(`Q${q}-${this.viewYear()}`); }

  stepQuarter(delta: -1 | 1) {
    let q = this.viewQ() + delta;
    let y = this.viewYear();
    if (q < 1) { q = 4; y--; }
    if (q > 4) { q = 1; y++; }
    this.viewQuarter.set(`Q${q}-${y}`);
  }

  jumpToNow() {
    this.viewQuarter.set(this.themeService.currentQuarter());
    this.pickerOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.qs-root')) this.pickerOpen.set(false);
  }

  // Deactivation panel
  deactivateOpen    = signal(false);
  deactivateEndDate = '';
  saving            = signal(false);

  // Inline end-date editing
  endDateEditing = signal(false);
  endDateEditVal = '';

  constructor() {
    effect(() => {
      const qId = this.viewQuarter();
      const emp = this.employee();
      if (emp) {
        this.employeeService.getEmployee(emp._id, qId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res: ApiResponse<Employee>) => {
            this.employee.set(res.data);
          }
        });
        if (emp.department === 'Sales') this.loadStats(emp._id, qId);
        this.loadSales(emp._id, qId);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.lightboxOpen()) this.lightboxOpen.set(false); }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadEmployee(params['id']);
        this.loadHistory(params['id']);
      }
    });
  }

  loadEmployee(id: string) {
    this.employeeService.getEmployee(id, this.viewQuarter()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: ApiResponse<Employee>) => {
        this.employee.set(res.data);
      }
    });
  }

  loadStats(id: string, quarterId: string) {
    this.employeeService.getTargetProgress(id, quarterId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.stats.set(res.data);
      }
    });
  }

  loadHistory(id: string) {
    this.employeeService.getTeamHistory(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.history.set(res.data.timeline);
      }
    });
  }

  loadSales(id: string, quarterId: string) {
    this.saleService.getSales({ employeeId: id, quarterId, limit: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.success) this.sales.set(res.data);
      }
    });
  }

  todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ── Deactivation flow ─────────────────────────────────────────
  openDeactivatePanel() {
    this.deactivateEndDate = this.todayIso();
    this.endDateEditing.set(false);
    this.deactivateOpen.set(true);
  }

  confirmDeactivate() {
    const emp = this.employee();
    if (!emp || !this.deactivateEndDate) return;
    this.saving.set(true);
    this.employeeService.updateEmployee(emp._id, { isActive: false, endDate: this.deactivateEndDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.deactivateOpen.set(false);
          if (res.success) {
            this.employee.set(res.data);
            this.employeeService.invalidateCache();
            this.toastService.showSuccess(this.translate.instant('employee.detail.deactivate_success', { name: emp.name, date: new Date(this.deactivateEndDate).toLocaleDateString(this.langService.currentLocale()) }));
          }
        },
        error: () => {
          this.saving.set(false);
          this.toastService.showError(this.translate.instant('common.error_generic'));
        }
      });
  }

  async reactivate() {
    const emp = this.employee();
    if (!emp) return;
    const ok = await this.confirmDialog.confirm({
      title: this.translate.instant('employee.detail.reactivate_title'),
      message: this.translate.instant('employee.detail.reactivate_msg', { name: emp.name }),
      confirmLabel: this.translate.instant('employee.detail.reactivate_btn'),
      type: 'info',
    });
    if (!ok) return;
    this.saving.set(true);
    this.employeeService.updateEmployee(emp._id, { isActive: true, endDate: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.success) {
            this.employee.set(res.data);
            this.employeeService.invalidateCache();
            this.toastService.showSuccess(this.translate.instant('employee.detail.reactivate_success', { name: emp.name }));
          }
        },
        error: () => { this.saving.set(false); }
      });
  }

  // ── Inline end-date edit ───────────────────────────────────────
  startEditEndDate(emp: any) {
    const raw = emp.endDate || emp.updatedAt;
    this.endDateEditVal = raw ? new Date(raw).toISOString().split('T')[0] : this.todayIso();
    this.endDateEditing.set(true);
  }

  saveEndDate() {
    const emp = this.employee();
    if (!emp || !this.endDateEditVal) return;
    this.saving.set(true);
    this.employeeService.updateEmployee(emp._id, { endDate: this.endDateEditVal })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.endDateEditing.set(false);
          if (res.success) {
            this.employee.set(res.data);
            this.toastService.showSuccess(this.translate.instant('employee.detail.end_date_updated'));
          }
        },
        error: () => {
          this.saving.set(false);
          this.toastService.showError(this.translate.instant('common.error_generic'));
        }
      });
  }

  goBack() {
    this.router.navigate(['/employees']);
  }



  async deleteEmployee() {
    const emp = this.employee();
    if (!emp) return;

    const ok = await this.confirmDialog.confirm({
      title: this.translate.instant('employee.detail.delete_title'),
      message: this.translate.instant('employee.detail.delete_msg', { name: emp.name }),
      confirmLabel: this.translate.instant('common.delete'),
      type: 'danger',
    });
    if (ok) {
      this.themeService.loading.set(true);
      this.employeeService.deleteEmployee(emp._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.themeService.loading.set(false);
          this.router.navigate(['/employees']);
        },
        error: () => this.themeService.loading.set(false),
      });
    }
  }

}
