import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SettingService, Setting } from '@core/services/setting.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroCog6Tooth, heroShieldCheck, heroSwatch, heroGlobeAlt, heroPlus, heroCheck, heroXMark,
  heroBriefcase, heroClock, heroUsers, heroSparkles, heroLightBulb, heroInformationCircle, heroCalendarDays
} from '@ng-icons/heroicons/outline';
import { ThemeService } from '@core/services/theme.service';
import { formatQuarter, getAvailableYears, getQuarterId } from '@core/utils/quarter.utils';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ReactiveFormsModule, TranslateModule],
  providers: [
    provideIcons({
      heroCog6Tooth, heroShieldCheck, heroSwatch, heroGlobeAlt, heroPlus, heroCheck, heroXMark,
      heroBriefcase, heroClock, heroUsers, heroSparkles, heroLightBulb, heroInformationCircle, heroCalendarDays
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in pb-20">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">{{ 'settings.title' | translate }}</h1>
          <p class="text-sf-muted font-medium mt-1">{{ 'settings.subtitle' | translate }}</p>
        </div>
      </header>

      <!-- Toast Notification -->
      <div *ngIf="saveSuccessMessage()" class="fixed top-24 left-6 z-[110] bg-sf-success text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in-left border border-white/20">
        <ng-icon name="heroCheck" class="text-xl"></ng-icon>
        <span class="font-bold text-sm">{{ saveSuccessMessage() }}</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Tabs: Fully scrollable and responsive for mobile viewports -->
        <div class="lg:col-span-1 lg:h-fit flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none border-b border-sf-border/30 lg:border-b-0 lg:bg-sf-surface/80 lg:backdrop-blur-md lg:p-3 lg:rounded-3xl lg:border lg:border-sf-border/40 lg:shadow-lg">
          <button (click)="activeTab.set('lists')"
                  [class]="activeTab() === 'lists' ? 
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap shadow-sm' : 
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap border border-transparent'">
            <ng-icon name="heroSwatch" class="text-lg"></ng-icon>
            {{ 'settings.tab_lists' | translate }}
          </button>

          <button (click)="activeTab.set('regional')"
                  [class]="activeTab() === 'regional' ? 
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap shadow-sm' : 
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap border border-transparent'">
            <ng-icon name="heroGlobeAlt" class="text-lg"></ng-icon>
            {{ 'settings.tab_regional' | translate }}
          </button>

          <button (click)="activeTab.set('quarter')"
                  [class]="activeTab() === 'quarter' ?
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap shadow-sm' :
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap border border-transparent'">
            <ng-icon name="heroCalendarDays" class="text-lg"></ng-icon>
            {{ 'settings.tab_quarter' | translate }}
          </button>

          <button (click)="activeTab.set('commissionRules')"
                  [class]="activeTab() === 'commissionRules' ?
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap shadow-sm' :
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap border border-transparent'">
            <ng-icon name="heroBriefcase" class="text-lg"></ng-icon>
            {{ 'settings.tab_commission' | translate }}
          </button>

          <button (click)="activeTab.set('security')"
                  [class]="activeTab() === 'security' ? 
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap shadow-sm' : 
                  'flex-1 min-w-[130px] lg:min-w-0 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-3.5 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-xs sm:text-sm font-bold transition-all text-center lg:text-right whitespace-nowrap border border-transparent'">
            <ng-icon name="heroShieldCheck" class="text-lg"></ng-icon>
            {{ 'settings.tab_security' | translate }}
          </button>
        </div>

        <!-- Content Area -->
        <div class="lg:col-span-3 space-y-8">
          
          <!-- TAB 1: DROPDOWN VALUES LISTS -->
          <div *ngIf="activeTab() === 'lists'" class="space-y-6 animate-fade-in">
            <!-- Segmented Switcher for Nested Lists -->
            <div class="flex items-center gap-1.5 p-1 bg-sf-surface border border-sf-border rounded-2xl overflow-x-auto scrollbar-none shadow-inner">
              <button (click)="activeListSubTab.set('saleSource')"
                      [class]="activeListSubTab() === 'saleSource' ? 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 bg-sf-primary text-white rounded-xl text-xs font-bold shadow-glow-sm whitespace-nowrap' : 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 text-sf-muted hover:text-sf-text rounded-xl text-xs font-bold transition-all whitespace-nowrap'">
                <div class="flex items-center justify-center gap-2">
                  <ng-icon name="heroSwatch"></ng-icon>
                  مصادر المبيعات
                </div>
              </button>
              
              <button (click)="activeListSubTab.set('collectionPercentage')"
                      [class]="activeListSubTab() === 'collectionPercentage' ? 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 bg-sf-primary text-white rounded-xl text-xs font-bold shadow-glow-sm whitespace-nowrap' : 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 text-sf-muted hover:text-sf-text rounded-xl text-xs font-bold transition-all whitespace-nowrap'">
                <div class="flex items-center justify-center gap-2">
                  <ng-icon name="heroSwatch"></ng-icon>
                  نسب التحصيل
                </div>
              </button>

              <button (click)="activeListSubTab.set('invoiceType')"
                      [class]="activeListSubTab() === 'invoiceType' ? 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 bg-sf-primary text-white rounded-xl text-xs font-bold shadow-glow-sm whitespace-nowrap' : 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 text-sf-muted hover:text-sf-text rounded-xl text-xs font-bold transition-all whitespace-nowrap'">
                <div class="flex items-center justify-center gap-2">
                  <ng-icon name="heroSwatch"></ng-icon>
                  طرق السداد
                </div>
              </button>

              <button (click)="activeListSubTab.set('tax')"
                      [class]="activeListSubTab() === 'tax' ? 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 bg-sf-primary text-white rounded-xl text-xs font-bold shadow-glow-sm whitespace-nowrap' : 
                      'flex-1 min-w-[120px] sm:min-w-0 px-4 py-3 text-sf-muted hover:text-sf-text rounded-xl text-xs font-bold transition-all whitespace-nowrap'">
                <div class="flex items-center justify-center gap-2">
                  <ng-icon name="heroBriefcase"></ng-icon>
                  الضرائب
                </div>
              </button>
            </div>

            <!-- Subtab Content Display -->
            <div class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right animate-fade-in">
              <!-- Sale Sources Container -->
              <div *ngIf="activeListSubTab() === 'saleSource'" class="space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text">مصادر المبيعات</h3>
                    <p class="text-xs text-sf-muted mt-1">تحديد القنوات التسويقية ومصادر جلب العملاء الجدد.</p>
                  </div>
                  <button (click)="openModal('saleSource')" class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 bg-sf-primary/5 hover:bg-sf-primary/10 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                    <ng-icon name="heroPlus" class="text-sm"></ng-icon>
                    إضافة مصدر
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (s of getSettingsByType('saleSource'); track s._id) {
                    <div class="flex items-center justify-between p-4 bg-sf-bg/40 rounded-2xl border border-sf-border/70 hover:border-sf-primary/30 transition-all group">
                      <div class="flex items-center gap-3">
                        <div class="w-2.5 h-2.5 rounded-full bg-sf-primary"></div>
                        <span class="text-sm font-semibold text-sf-text">{{ s.label }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-[10px] font-bold text-sf-muted uppercase tracking-wider bg-sf-surface border border-sf-border px-2 py-0.5 rounded-md">{{ s.value }}</span>
                        <button (click)="deleteSetting(s._id)" class="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1.5 text-sf-muted hover:text-sf-danger hover:bg-sf-danger/10 rounded-lg transition-all">
                          <ng-icon name="heroXMark"></ng-icon>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="col-span-full py-12 flex flex-col items-center justify-center text-sf-muted">
                      <ng-icon name="heroSwatch" class="text-3xl opacity-30 mb-2"></ng-icon>
                      <p class="text-xs font-semibold">لا يوجد مصادر مضافة بعد.</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Collection Percentages Container -->
              <div *ngIf="activeListSubTab() === 'collectionPercentage'" class="space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text">نسب التحصيل</h3>
                    <p class="text-xs text-sf-muted mt-1">النسب المئوية المستقطعة أو المعتمدة لتحصيل العمولات والمستحقات.</p>
                  </div>
                  <button (click)="openModal('collectionPercentage')" class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 bg-sf-primary/5 hover:bg-sf-primary/10 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                    <ng-icon name="heroPlus" class="text-sm"></ng-icon>
                    إضافة نسبة
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (s of getSettingsByType('collectionPercentage'); track s._id) {
                    <div class="flex items-center justify-between p-4 bg-sf-bg/40 rounded-2xl border border-sf-border/70 hover:border-sf-primary/30 transition-all group">
                      <div class="flex items-center gap-3">
                        <div class="w-2.5 h-2.5 rounded-full bg-sf-info"></div>
                        <span class="text-sm font-semibold text-sf-text">{{ s.label }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-bold text-sf-info font-mono">{{ s.value }}%</span>
                        <button (click)="deleteSetting(s._id)" class="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1.5 text-sf-muted hover:text-sf-danger hover:bg-sf-danger/10 rounded-lg transition-all">
                          <ng-icon name="heroXMark"></ng-icon>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="col-span-full py-12 flex flex-col items-center justify-center text-sf-muted">
                      <ng-icon name="heroSwatch" class="text-3xl opacity-30 mb-2"></ng-icon>
                      <p class="text-xs font-semibold">لا يوجد نسب تحصيل مضافة بعد.</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Invoice/Payment Types Container -->
              <div *ngIf="activeListSubTab() === 'invoiceType'" class="space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text">طرق السداد المتاحة</h3>
                    <p class="text-xs text-sf-muted mt-1">تحديد خيارات سداد الدفعات وأنواع عقود الفواتير المقبولة.</p>
                  </div>
                  <button (click)="openModal('invoiceType')" class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 bg-sf-primary/5 hover:bg-sf-primary/10 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                    <ng-icon name="heroPlus" class="text-sm"></ng-icon>
                    إضافة طريقة سداد
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (s of getSettingsByType('invoiceType'); track s._id) {
                    <div class="flex items-center justify-between p-4 bg-sf-bg/40 rounded-2xl border border-sf-border/70 hover:border-sf-primary/30 transition-all group">
                      <div class="flex items-center gap-3">
                        <div class="w-2.5 h-2.5 rounded-full bg-sf-warning"></div>
                        <span class="text-sm font-semibold text-sf-text">{{ s.label }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-[10px] font-bold text-sf-muted uppercase tracking-wider bg-sf-surface border border-sf-border px-2 py-0.5 rounded-md font-mono">{{ s.value }}</span>
                        <button (click)="deleteSetting(s._id)" class="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1.5 text-sf-muted hover:text-sf-danger hover:bg-sf-danger/10 rounded-lg transition-all">
                          <ng-icon name="heroXMark"></ng-icon>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="col-span-full py-12 flex flex-col items-center justify-center text-sf-muted">
                      <ng-icon name="heroSwatch" class="text-3xl opacity-30 mb-2"></ng-icon>
                      <p class="text-xs font-semibold">لا يوجد طرق سداد مضافة بعد.</p>
                    </div>
                  }
                </div>
              </div>

              <!-- System Taxes Container -->
              <div *ngIf="activeListSubTab() === 'tax'" class="space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text">الضرائب المتاحة في النظام</h3>
                    <p class="text-xs text-sf-muted mt-1">معدلات ونسب الضرائب المطبقة على عقود ومبيعات النظام.</p>
                  </div>
                  <button (click)="openModal('tax')" class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 bg-sf-primary/5 hover:bg-sf-primary/10 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                    <ng-icon name="heroPlus" class="text-sm"></ng-icon>
                    إضافة ضريبة
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (s of getSettingsByType('tax'); track s._id) {
                    <div class="flex items-center justify-between p-4 bg-sf-bg/40 rounded-2xl border border-sf-border/70 hover:border-sf-primary/30 transition-all group">
                      <div class="flex items-center gap-3">
                        <div class="w-2.5 h-2.5 rounded-full bg-sf-danger"></div>
                        <span class="text-sm font-semibold text-sf-text">{{ s.label }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-bold text-sf-danger font-mono">{{ s.value }}%</span>
                        <button (click)="deleteSetting(s._id)" class="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1.5 text-sf-muted hover:text-sf-danger hover:bg-sf-danger/10 rounded-lg transition-all">
                          <ng-icon name="heroXMark"></ng-icon>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="col-span-full py-12 flex flex-col items-center justify-center text-sf-muted">
                      <ng-icon name="heroBriefcase" class="text-3xl opacity-30 mb-2"></ng-icon>
                      <p class="text-xs font-semibold">لا يوجد قيم ضرائب مضافة بعد.</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: REGIONAL PREFERENCES -->
          <div *ngIf="activeTab() === 'regional'" class="space-y-8 animate-fade-in">
            <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
              <div class="pb-4 border-b border-sf-border/30">
                <h3 class="text-lg font-display font-bold text-sf-text">تفضيلات اللغة والمنطقة</h3>
                <p class="text-xs text-sf-muted mt-1">تخصيص لغة النظام والعملة الافتراضية وصيغ العرض المفضلة لديك.</p>
              </div>

              <form [formGroup]="regionalForm" (ngSubmit)="saveRegionalSettings()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Language Selection -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">اللغة المفضلة</label>
                    <select formControlName="language" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
                      <option value="ar">العربية (الأصلية)</option>
                      <option value="en">English (الإنجليزية)</option>
                    </select>
                  </div>

                  <!-- Currency Symbol -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">رمز العملة الافتراضي</label>
                    <select formControlName="currency" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>

                  <!-- Timezone -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المنطقة الزمنية</label>
                    <select formControlName="timezone" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
                      <option value="Africa/Cairo">توقيت القاهرة (UTC+02:00)</option>
                      <option value="Asia/Riyadh">توقيت مكة المكرمة (UTC+03:00)</option>
                      <option value="UTC">التوقيت العالمي الموحد (UTC)</option>
                    </select>
                  </div>

                  <!-- Date Format -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">صيغة عرض التاريخ</label>
                    <select formControlName="dateFormat" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-05-07)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (07/05/2026)</option>
                    </select>
                  </div>

                </div>

                <div class="flex justify-start pt-4">
                  <button type="submit" [disabled]="regionalForm.invalid" class="px-8 py-3.5 rounded-2xl bg-sf-primary text-white font-bold shadow-glow-purple hover:brightness-110 transition-all flex items-center gap-2">
                    <ng-icon name="heroCheck"></ng-icon>
                    {{ 'settings.save_regional' | translate }}
                  </button>
                </div>
              </form>
            </section>

          </div>

          <!-- TAB: ACTIVE FINANCIAL QUARTER -->
          <div *ngIf="activeTab() === 'quarter'" class="space-y-8 animate-fade-in">
            <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
              <div class="pb-4 border-b border-sf-border/30 flex items-center gap-3">
                <div class="p-2.5 rounded-xl bg-sf-primary/10 text-sf-primary">
                  <ng-icon name="heroCalendarDays" class="text-xl"></ng-icon>
                </div>
                <div>
                  <h3 class="text-lg font-display font-bold text-sf-text">{{ 'settings.quarter_label' | translate }}</h3>
                  <p class="text-xs text-sf-muted mt-0.5">{{ 'settings.quarter_section_desc' | translate }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <!-- Year Pills — horizontally scrollable, scales to any number of years -->
                <div class="relative">
                  <div class="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    @for (year of availableYears; track year) {
                      <button type="button" (click)="selectedYear.set(year)"
                        [class]="selectedYear() === year
                          ? 'flex-shrink-0 px-4 py-2 rounded-xl bg-sf-primary text-white text-sm font-black border border-sf-primary/60 transition-all'
                          : 'flex-shrink-0 px-4 py-2 rounded-xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-text hover:border-sf-primary/40 text-sm font-bold transition-all'">
                        {{ year }}
                      </button>
                    }
                  </div>
                  <!-- Fade hint on the right edge when content overflows -->
                  <div class="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-sf-bg/80 to-transparent rounded-r-xl"></div>
                </div>

                <!-- Quarter Pills (dir=ltr keeps Q1 left regardless of language) -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" dir="ltr">
                  @for (qId of quartersForYear(); track qId) {
                    <button type="button" (click)="selectQuarter(qId)"
                      [class]="themeService.currentQuarter() === qId
                        ? 'relative flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-sf-primary/10 border-2 border-sf-primary text-sf-primary scale-[1.02] transition-all min-h-[88px]'
                        : 'relative flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-text hover:border-sf-primary/40 transition-all min-h-[88px]'">

                      <!-- "Current" badge -->
                      @if (qId === todayQuarter) {
                        <span class="absolute top-2 end-2 px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md text-[9px] font-black leading-none">
                          {{ 'settings.current_quarter_badge' | translate }}
                        </span>
                      }

                      <!-- Q label -->
                      <span class="text-sm font-black" [dir]="langService.currentLang() === 'ar' ? 'rtl' : 'ltr'">
                        {{ langService.currentLang() === 'ar'
                            ? ('الربع ' + qId.split('-')[0].replace('Q',''))
                            : qId.split('-')[0] }}
                      </span>

                      <!-- Month range subtitle -->
                      <span class="text-[10px] font-semibold opacity-60 text-center leading-tight">
                        {{ langService.currentLang() === 'ar'
                            ? quarterMonthRanges[qId.split('-')[0]].ar
                            : quarterMonthRanges[qId.split('-')[0]].en }}
                      </span>
                    </button>
                  }
                </div>
              </div>
            </section>
          </div>

          <!-- TAB 3: COMMISSION RULES -->
          <div *ngIf="activeTab() === 'commissionRules'" class="space-y-8 animate-fade-in text-right">
            <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-8">
              
              <!-- Premium Section Header -->
              <div class="pb-6 border-b border-sf-border/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="space-y-1">
                  <h3 class="text-2xl font-display font-black text-sf-text bg-gradient-to-l from-sf-primary to-sf-info bg-clip-text text-transparent flex items-center gap-2">
                    <ng-icon name="heroBriefcase" class="text-sf-primary"></ng-icon>
                    إدارة وتخصيص لائحة العمولات
                  </h3>
                  <p class="text-xs text-sf-muted font-medium">تعديل المستهدفات البيعية، فئات عمولة الشركة، وشرائح مبيعات المطور لكل مستوى وظيفي بالشركة بكل دقة.</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-3.5 py-1.5 bg-sf-primary/10 text-sf-primary text-[10px] font-black rounded-xl uppercase tracking-wider border border-sf-primary/20 flex items-center gap-1.5 shadow-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-sf-primary animate-pulse"></span>
                    لوحة المدير المالي
                  </span>
                </div>
              </div>

              <!-- Roles Selector (Horizontal Cards with Rich Metadata) -->
              <div class="space-y-3">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستوى الوظيفي المستهدف بالتعديل</label>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <button *ngFor="let role of ['BA', 'BC', 'Senior', 'SV', 'TeamLeader', 'Fresh']"
                          type="button"
                          (click)="selectedSeniority.set(role)"
                          [class]="selectedSeniority() === role ? 
                          'p-4 rounded-2xl bg-sf-primary/10 border-2 border-sf-primary text-sf-text shadow-glow-sm transform scale-[1.02] transition-all text-right flex flex-col justify-between gap-3 min-h-[100px]' : 
                          'p-4 rounded-2xl bg-sf-surface hover:bg-sf-surface/80 border border-sf-border text-sf-muted hover:text-sf-text transition-all text-right flex flex-col justify-between gap-3 min-h-[100px]'">
                    <div class="flex items-center justify-between w-full">
                      <span class="text-xs font-black" [class.text-sf-primary]="selectedSeniority() === role">{{ role }}</span>
                      <ng-icon [name]="getRoleIcon(role)" class="text-lg" [class]="selectedSeniority() === role ? 'text-sf-primary animate-bounce' : 'text-sf-muted/60'"></ng-icon>
                    </div>
                    <div class="space-y-0.5">
                      <p class="text-xs font-black leading-tight">{{ getRoleSimpleLabel(role) }}</p>
                      <p class="text-[9px] opacity-75 font-semibold leading-none">{{ getRoleSubLabel(role) }}</p>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Explanation Banner for Selected Role -->
              <div class="p-4 sm:p-5 rounded-2xl bg-sf-bg/50 border border-sf-border/60 flex items-start gap-4 transition-all">
                <div class="p-3 rounded-xl bg-sf-primary/10 text-sf-primary shadow-sm flex items-center justify-center">
                  <ng-icon name="heroInformationCircle" class="text-xl"></ng-icon>
                </div>
                <div class="space-y-1">
                  <h4 class="text-xs sm:text-sm font-black text-sf-text">آلية الاحتساب لـ {{ getRoleLabel(selectedSeniority()) }}</h4>
                  <p class="text-xs text-sf-muted leading-relaxed font-medium">{{ getRoleExplanation(selectedSeniority()) }}</p>
                </div>
              </div>

              <!-- Content for Selected Role -->
              <div *ngIf="commissionRules() && currentRoleRules" class="space-y-8 animate-fade-in">
                
                <!-- Target Settings Section -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-sf-surface/40 p-6 rounded-2xl border border-sf-border/50">
                  <!-- Normal Targets (Except Team Leader) -->
                  <div class="space-y-2" *ngIf="selectedSeniority() !== 'TeamLeader'">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستهدف الربع سنوي الافتراضي</label>
                    <div class="relative flex items-center">
                      <input type="number" 
                             [value]="currentRoleRules.target" 
                             (input)="updateTarget($event)"
                             placeholder="مثال: 27000000"
                             class="w-full pl-20 pr-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text font-mono text-left">
                      <span class="absolute left-3 px-2.5 py-1 bg-sf-surface border border-sf-border rounded-lg text-[10px] font-black text-sf-muted font-mono">EGP</span>
                    </div>
                    <div class="flex items-center justify-between mt-1.5 px-1">
                      <p class="text-[10px] text-sf-muted font-medium">المستهدف الأصلي قبل تعديله بالأيام: <span class="font-bold text-sf-text font-mono">{{ (currentRoleRules.target || 0) | number }} ج.م</span></p>
                      <span class="text-[11px] font-black text-sf-primary bg-sf-primary/10 px-2 py-0.5 rounded-lg border border-sf-primary/20 shadow-sm">
                        {{ formatArabicMillions(currentRoleRules.target) }}
                      </span>
                    </div>
                  </div>

                  <!-- Dynamic Info for Team Leader Targets -->
                  <div class="space-y-2 flex flex-col justify-center" *ngIf="selectedSeniority() === 'TeamLeader'">
                    <span class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستهدف الربع سنوي لقائد الفريق</span>
                    <div class="p-3.5 rounded-xl bg-sf-primary/5 border border-sf-primary/15 text-sf-primary font-bold text-xs flex items-center gap-2 mt-1">
                      <ng-icon name="heroUsers" class="text-base"></ng-icon>
                      <span>المستهدف يتم احتسابه ديناميكياً كمجموع لمستهدفات فريقه.</span>
                    </div>
                  </div>

                  <!-- Flat Rate (For Fresh) -->
                  <div class="space-y-2" *ngIf="selectedSeniority() === 'Fresh'">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">العمولة الثابتة لكل مليون</label>
                    <div class="relative flex items-center">
                      <input type="number" 
                             [value]="currentRoleRules.companyRate" 
                             (input)="updateFlatRate($event)"
                             placeholder="مثال: 4500"
                             class="w-full pl-24 pr-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text font-mono text-left">
                      <span class="absolute left-3 px-2.5 py-1 bg-sf-surface border border-sf-border rounded-lg text-[10px] font-black text-sf-muted font-mono">ج.م / المليون</span>
                    </div>
                    <p class="text-[10px] text-sf-muted mt-1 px-1 font-medium">يصرف هذا المبلغ كعلاوة ثابتة لكل مليون مبيعات مغلقة بنجاح.</p>
                  </div>
                </div>

                <!-- Company Tiers (Achievements Brackets) -->
                <div class="space-y-4" *ngIf="selectedSeniority() !== 'Fresh'">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-black text-sf-text flex items-center gap-2">
                      <div class="w-2 h-4 rounded-full bg-sf-primary"></div>
                      شرائح مبيعات الشركة (Company Sales Tiers)
                    </h4>
                    <button type="button" (click)="addTier()" class="text-xs font-black text-sf-primary hover:text-sf-primary/80 flex items-center gap-1.5 bg-sf-primary/5 px-3.5 py-2 rounded-xl border border-sf-primary/10 transition-all shadow-sm">
                      <ng-icon name="heroPlus" class="text-xs"></ng-icon>
                      إضافة شريحة جديدة
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div *ngFor="let tier of currentRoleRules.companyTiers; let i = index" class="p-5 rounded-2xl bg-sf-bg/40 border border-sf-border hover:border-sf-primary/30 hover:bg-sf-surface/20 transition-all flex flex-col justify-between gap-4 relative group shadow-sm">
                      <!-- Card Header -->
                      <div class="flex items-center justify-between border-b border-sf-border/30 pb-3">
                        <span class="text-xs font-black text-sf-primary bg-sf-primary/10 px-2.5 py-1 rounded-lg border border-sf-primary/20">الشريحة {{ i + 1 }}</span>
                        <button type="button" (click)="removeTier(i)" class="text-sf-muted hover:text-sf-danger p-1.5 hover:bg-sf-danger/10 rounded-lg transition-all">
                          <ng-icon name="heroXMark" class="text-base"></ng-icon>
                        </button>
                      </div>
                      <!-- Inputs Grid -->
                      <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                          <label class="text-[10px] font-black text-sf-muted uppercase tracking-wider mr-0.5">من تحقيق %</label>
                          <div class="relative flex items-center">
                            <input type="number" 
                                   [value]="tier.minAchievement" 
                                   (input)="updateTier(i, 'minAchievement', $event)"
                                   step="0.01"
                                   class="w-full px-2 py-2 bg-sf-surface border border-sf-border rounded-xl text-xs font-semibold text-sf-text font-mono text-center outline-none focus:border-sf-primary transition-all">
                            <span class="absolute left-2.5 text-[10px] text-sf-muted font-bold">%</span>
                          </div>
                        </div>
                        <div class="space-y-1">
                          <label class="text-[10px] font-black text-sf-muted uppercase tracking-wider mr-0.5">إلى تحقيق %</label>
                          <div class="relative flex items-center">
                            <input type="number" 
                                   [value]="tier.maxAchievement" 
                                   (input)="updateTier(i, 'maxAchievement', $event)"
                                   placeholder="بلا حد"
                                   class="w-full px-2 py-2 bg-sf-surface border border-sf-border rounded-xl text-xs font-semibold text-sf-text font-mono text-center outline-none focus:border-sf-primary transition-all">
                            <span class="absolute left-2.5 text-[10px] text-sf-muted font-bold">%</span>
                          </div>
                        </div>
                      </div>
                      <!-- Rate Per Million -->
                      <div class="space-y-1">
                        <label class="text-[10px] font-black text-sf-muted uppercase tracking-wider mr-0.5">العمولة لكل مليون</label>
                        <div class="relative flex items-center">
                          <input type="number" 
                                 [value]="tier.ratePerMillion" 
                                 (input)="updateTier(i, 'ratePerMillion', $event)"
                                 class="w-full pl-12 pr-3 py-2 bg-sf-surface border border-sf-border rounded-xl text-xs font-semibold text-sf-text font-mono text-left outline-none focus:border-sf-primary transition-all">
                          <span class="absolute left-3 text-[10px] text-sf-muted font-bold">ج.م</span>
                        </div>
                      </div>
                    </div>
                    
                    <div *ngIf="!currentRoleRules.companyTiers || currentRoleRules.companyTiers.length === 0" class="col-span-full py-10 flex flex-col items-center justify-center text-sf-muted bg-sf-bg/20 rounded-2xl border border-dashed border-sf-border">
                      <ng-icon name="heroSwatch" class="text-3xl opacity-30 mb-2"></ng-icon>
                      <p class="text-xs font-bold">لا يوجد شرائح معرفة حالياً. أضف شريحة جديدة للبدء.</p>
                    </div>
                  </div>
                </div>

                <!-- Personal Slabs (Personal Sales) -->
                <div class="space-y-4" *ngIf="selectedSeniority() !== 'Fresh'">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-black text-sf-text flex items-center gap-2">
                      <div class="w-2 h-4 rounded-full bg-sf-info"></div>
                      شرائح المبيعات الشخصية (Personal Sales Slabs)
                    </h4>
                    <button type="button" (click)="addSlab()" class="text-xs font-black text-sf-info hover:text-sf-info/80 flex items-center gap-1.5 bg-sf-info/5 px-3.5 py-2 rounded-xl border border-sf-info/10 transition-all shadow-sm">
                      <ng-icon name="heroPlus" class="text-xs"></ng-icon>
                      إضافة شريحة شخصية
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div *ngFor="let slab of currentRoleRules.personalSlabs; let i = index" class="p-5 rounded-2xl bg-sf-bg/40 border border-sf-border hover:border-sf-info/30 hover:bg-sf-surface/20 transition-all flex flex-col justify-between gap-4 relative group shadow-sm">
                      <!-- Card Header -->
                      <div class="flex items-center justify-between border-b border-sf-border/30 pb-3">
                        <span class="text-xs font-black text-sf-info bg-sf-info/10 px-2.5 py-1 rounded-lg border border-sf-info/20">شريحة شخصية {{ i + 1 }}</span>
                        <button type="button" (click)="removeSlab(i)" class="text-sf-muted hover:text-sf-danger p-1.5 hover:bg-sf-danger/10 rounded-lg transition-all">
                          <ng-icon name="heroXMark" class="text-base"></ng-icon>
                        </button>
                      </div>
                      <!-- Inputs Grid -->
                      <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                          <label class="text-[10px] font-black text-sf-muted uppercase tracking-wider mr-0.5">من عمولة المطور %</label>
                          <div class="relative flex items-center">
                            <input type="number" 
                                   [value]="slab.minRate" 
                                   (input)="updateSlab(i, 'minRate', $event)"
                                   step="0.1"
                                   class="w-full px-2 py-2 bg-sf-surface border border-sf-border rounded-xl text-xs font-semibold text-sf-text font-mono text-center outline-none focus:border-sf-info transition-all">
                            <span class="absolute left-2.5 text-[10px] text-sf-muted font-bold">%</span>
                          </div>
                        </div>
                        <div class="space-y-1">
                          <label class="text-[10px] font-black text-sf-muted uppercase tracking-wider mr-0.5">إلى عمولة المطور %</label>
                          <div class="relative flex items-center">
                            <input type="number" 
                                   [value]="slab.maxRate" 
                                   (input)="updateSlab(i, 'maxRate', $event)"
                                   step="0.1"
                                   placeholder="بلا حد"
                                   class="w-full px-2 py-2 bg-sf-surface border border-sf-border rounded-xl text-xs font-semibold text-sf-text font-mono text-center outline-none focus:border-sf-info transition-all">
                            <span class="absolute left-2.5 text-[10px] text-sf-muted font-bold">%</span>
                          </div>
                        </div>
                      </div>
                      <!-- Rate Per Million & useCompanyTiers Checkbox -->
                      <div class="space-y-3">
                        <div class="space-y-1">
                          <label class="text-[10px] font-black text-sf-muted uppercase tracking-wider mr-0.5">العمولة لكل مليون</label>
                          <div class="relative flex items-center">
                            <input type="number" 
                                   [value]="slab.ratePerMillion" 
                                   [disabled]="slab.useCompanyTiers"
                                   (input)="updateSlab(i, 'ratePerMillion', $event)"
                                   class="w-full pl-12 pr-3 py-2 bg-sf-surface border border-sf-border rounded-xl text-xs font-semibold text-sf-text font-mono text-left outline-none focus:border-sf-info transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <span class="absolute left-3 text-[10px] text-sf-muted font-bold">ج.م</span>
                          </div>
                        </div>
                        
                        <div class="flex items-center gap-2 pt-2.5 border-t border-sf-border/30" *ngIf="selectedSeniority() !== 'Fresh' && selectedSeniority() !== 'TeamLeader'">
                          <input type="checkbox" 
                                 [checked]="slab.useCompanyTiers" 
                                 (change)="updateSlab(i, 'useCompanyTiers', $event)"
                                 [id]="'check_slab_' + i"
                                 class="w-4 h-4 text-sf-primary focus:ring-sf-primary/50 border-sf-border rounded cursor-pointer transition-all">
                          <label [for]="'check_slab_' + i" class="text-[11px] font-black text-sf-muted cursor-pointer select-none leading-none">الربط التلقائي بشرائح مبيعات الشركة</label>
                        </div>
                      </div>
                    </div>
                    
                    <div *ngIf="!currentRoleRules.personalSlabs || currentRoleRules.personalSlabs.length === 0" class="col-span-full py-10 flex flex-col items-center justify-center text-sf-muted bg-sf-bg/20 rounded-2xl border border-dashed border-sf-border">
                      <ng-icon name="heroSwatch" class="text-3xl opacity-30 mb-2"></ng-icon>
                      <p class="text-xs font-bold">لا يوجد شرائح شخصية معرفة حالياً. أضف شريحة للبدء.</p>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="flex justify-start pt-6 border-t border-sf-border/30">
                  <button type="button" (click)="saveCommissionRules()" class="px-8 py-4 rounded-2xl bg-sf-primary text-white font-black shadow-glow-purple hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2">
                    <ng-icon name="heroCheck" class="text-lg"></ng-icon>
                    {{ 'settings.commission_save' | translate }}
                  </button>
                </div>

              </div>
            </section>
          </div>

          <!-- TAB 4: SECURITY & AUTHENTICATION -->
          <div *ngIf="activeTab() === 'security'" class="space-y-8 animate-fade-in">
            <!-- Password Change -->
            <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
              <div class="pb-4 border-b border-sf-border/30">
                <h3 class="text-lg font-display font-bold text-sf-text">تغيير كلمة المرور</h3>
                <p class="text-xs text-sf-muted mt-1">تأكد من استخدام كلمة مرور قوية وغير مكررة لحماية حسابك.</p>
              </div>

              <form [formGroup]="securityForm" (ngSubmit)="changePassword()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">كلمة المرور الحالية</label>
                    <input type="password" formControlName="currentPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">كلمة المرور الجديدة</label>
                    <input type="password" formControlName="newPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">تأكيد كلمة المرور</label>
                    <input type="password" formControlName="confirmPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
                  </div>
                </div>

                <div class="flex justify-start pt-4">
                  <button type="submit" [disabled]="securityForm.invalid" class="px-8 py-3.5 rounded-2xl bg-sf-primary text-white font-bold shadow-glow-purple hover:brightness-110 transition-all flex items-center gap-2">
                    <ng-icon name="heroCheck"></ng-icon>
                    تحديث كلمة المرور
                  </button>
                </div>
              </form>
            </section>

            <!-- Advanced Security Toggles -->
            <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
              <div class="pb-4 border-b border-sf-border/30">
                <h3 class="text-lg font-display font-bold text-sf-text">إعدادات الأمان المتقدمة</h3>
              </div>

              <div class="space-y-6 divide-y divide-sf-border/30">
                <!-- Two Factor Authentication Toggle -->
                <div class="flex items-center justify-between pt-4 first:pt-0">
                  <div class="space-y-1">
                    <h4 class="text-sm font-bold text-sf-text">المصادقة الثنائية (Two-Factor Authentication)</h4>
                    <p class="text-xs text-sf-muted">تطلب إدخال رمز أمان مرسل إلى بريدك أو هاتفك عند تسجيل الدخول الجديد.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="is2faEnabled()" (change)="toggle2fa()" class="sr-only peer">
                    <div class="w-11 h-6 bg-sf-border/50 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sf-primary"></div>
                  </label>
                </div>

                <!-- Session Timeout -->
                <div class="flex items-center justify-between pt-6">
                  <div class="space-y-1">
                    <h4 class="text-sm font-bold text-sf-text">مدة بقاء الجلسة نشطة (Session Timeout)</h4>
                    <p class="text-xs text-sf-muted">يتم تسجيل الخروج تلقائياً في حال عدم وجود أي نشاط خلال الفترة المحددة.</p>
                  </div>
                  <select (change)="updateSessionTimeout($event)" class="px-4 py-2 bg-sf-bg border border-sf-border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all text-sf-text">
                    <option value="30">30 دقيقة</option>
                    <option value="60" selected>1 ساعة (الافتراضي)</option>
                    <option value="240">4 ساعات</option>
                    <option value="never">عدم تسجيل الخروج تلقائياً</option>
                  </select>
                </div>

                <!-- Active Sessions Log -->
                <div class="pt-6 space-y-4">
                  <div class="space-y-1">
                    <h4 class="text-sm font-bold text-sf-text">الأجهزة المتصلة حالياً</h4>
                    <p class="text-xs text-sf-muted">قائمة بالأجهزة والمتصفحات التي قامت بتسجيل الدخول إلى حسابك مؤخراً.</p>
                  </div>

                  <div class="space-y-3 mt-4">
                    <div class="flex items-center justify-between p-4 bg-sf-bg/50 rounded-2xl border border-sf-border">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-sf-primary/10 text-sf-primary flex items-center justify-center text-xs font-bold">PC</div>
                        <div class="space-y-0.5">
                          <span class="text-xs font-bold text-sf-text">Chrome on Windows (جهازك الحالي)</span>
                          <span class="text-[10px] text-sf-success font-semibold flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-sf-success animate-pulse"></span>
                            نشط الآن
                          </span>
                        </div>
                      </div>
                      <span class="text-[10px] text-sf-muted font-bold">القاهرة، مصر</span>
                    </div>

                    <div class="flex items-center justify-between p-4 bg-sf-bg/30 rounded-2xl border border-sf-border/50">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-sf-muted/10 text-sf-muted flex items-center justify-center text-xs font-bold">MB</div>
                        <div class="space-y-0.5">
                          <span class="text-xs font-bold text-sf-text">Safari on iPhone 15 Pro</span>
                          <span class="text-[10px] text-sf-muted font-semibold">منذ ساعتين</span>
                        </div>
                      </div>
                      <span class="text-[10px] text-sf-muted font-bold">الإسكندرية، مصر</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>

      <!-- Add Setting Modal -->
      <div *ngIf="showModal()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="absolute inset-0 bg-sf-bg/80 backdrop-blur-md" (click)="closeModal()"></div>
        <div class="glass-card w-full max-w-md p-6 sm:p-8 rounded-[2rem] border border-sf-border shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 text-right">
          <h2 class="text-2xl font-display font-bold text-sf-text mb-6">
            {{ getModalTitle() }}
          </h2>

          <form [formGroup]="form" (ngSubmit)="saveSetting()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الاسم (العرض)</label>
              <input type="text" formControlName="label" [placeholder]="getLabelPlaceholder()"
                     class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text">
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">القيمة (النظام)</label>
              <input type="text" formControlName="value" [placeholder]="getValuePlaceholder()"
                     class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold text-sf-text font-mono">
            </div>

            <div class="grid grid-cols-2 gap-4 mt-8">
              <button type="button" (click)="closeModal()" class="py-4 rounded-2xl bg-sf-surface border border-sf-border text-sf-text font-bold hover:bg-sf-bg transition-all font-semibold">
                إلغاء
              </button>
              <button type="submit" [disabled]="form.invalid" class="py-4 rounded-2xl bg-sf-primary text-white font-bold shadow-glow-purple hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <ng-icon name="heroCheck"></ng-icon>
                <span>تأكيد الإضافة</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slide-in-left { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slide-in-left { animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .shadow-glow-purple { box-shadow: 0 0 15px rgba(147, 51, 234, 0.3); }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class SettingsComponent implements OnInit {
  private settingService = inject(SettingService);
  private confirmDialog  = inject(ConfirmDialogService);
  private fb = inject(FormBuilder);
  public themeService = inject(ThemeService);
  private translate = inject(TranslateService);
  public langService = inject(LanguageService);

  settings = signal<Setting[]>([]);
  activeTab = signal<'lists' | 'regional' | 'quarter' | 'commissionRules' | 'security'>('lists');
  activeListSubTab = signal<'saleSource' | 'collectionPercentage' | 'invoiceType' | 'tax'>('saleSource');
  showModal = signal(false);
  currentType = signal<string>('');
  saveSuccessMessage = signal<string | null>(null);
  is2faEnabled = signal(localStorage.getItem('sf_2fa') === 'true');

  readonly availableYears: number[] = getAvailableYears(2, 1);
  selectedYear = signal<number>(parseInt(this.themeService.currentQuarter().split('-')[1], 10));
  readonly todayQuarter: string = getQuarterId(new Date());
  quartersForYear = computed<string[]>(() => [1, 2, 3, 4].map(q => `Q${q}-${this.selectedYear()}`));
  readonly quarterMonthRanges: Record<string, { en: string; ar: string }> = {
    Q1: { en: 'Jan – Mar', ar: 'يناير – مارس' },
    Q2: { en: 'Apr – Jun', ar: 'أبريل – يونيو' },
    Q3: { en: 'Jul – Sep', ar: 'يوليو – سبتمبر' },
    Q4: { en: 'Oct – Dec', ar: 'أكتوبر – ديسمبر' },
  };

  commissionRules = signal<any>(null);
  selectedSeniority = signal<string>('BA');

  form: FormGroup;
  securityForm: FormGroup;
  regionalForm: FormGroup;

  constructor() {
    this.form = this.fb.group({
      label: ['', [Validators.required]],
      value: ['', [Validators.required]],
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.regionalForm = this.fb.group({
      language: [this.settingService.preferredLanguage(), [Validators.required]],
      currency: [this.settingService.preferredCurrency(), [Validators.required]],
      timezone: [this.settingService.preferredTimezone(), [Validators.required]],
      dateFormat: [this.settingService.preferredDateFormat(), [Validators.required]],
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  loadSettings() {
    this.settingService.getAllSettings().subscribe(res => {
      if (res.success) {
        this.settings.set(res.data);
        const rulesSetting = res.data.find(s => s.type === 'commissionRules');
        if (rulesSetting) {
          try {
            this.commissionRules.set(JSON.parse(rulesSetting.value));
          } catch (e) {
            console.error('Error parsing commission rules:', e);
          }
        }
      }
    });
  }

  getSettingsByType(type: string) {
    return this.settings().filter(s => s.type === type && s.isActive !== false);
  }

  openModal(type: string) {
    this.currentType.set(type);
    this.form.reset();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  showToast(message: string) {
    this.saveSuccessMessage.set(message);
    setTimeout(() => {
      this.saveSuccessMessage.set(null);
    }, 4000);
  }

  saveSetting() {
    if (this.form.invalid) return;

    const data = {
      ...this.form.value,
      type: this.currentType(),
      sortOrder: this.getSettingsByType(this.currentType()).length + 1
    };

    this.settingService.createSetting(data).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadSettings();
          this.closeModal();
          this.showToast(this.translate.instant('settings.saved_success'));
        }
      },
      error: (err) => {
        this.showToast('خطأ أثناء الحفظ: ' + (err.error?.message || 'حاول مرة أخرى'));
      }
    });
  }

  async deleteSetting(id: string) {
    const ok = await this.confirmDialog.confirm({
      title: this.translate.instant('settings.delete_title'),
      message: this.translate.instant('settings.delete_msg'),
      confirmLabel: this.translate.instant('common.delete'),
      type: 'danger',
    });
    if (!ok) return;
    
    this.settingService.deleteSetting(id).subscribe({
      next: () => {
        this.loadSettings();
        this.showToast(this.translate.instant('settings.deleted_success'));
      },
      error: (err) => this.showToast('خطأ أثناء الحذف: ' + (err.error?.message || 'حاول مرة أخرى'))
    });
  }

  saveRegionalSettings() {
    if (this.regionalForm.invalid) return;
    const val = this.regionalForm.value;
    
    this.settingService.updatePreferences({
      language: val.language,
      currency: val.currency,
      timezone: val.timezone,
      dateFormat: val.dateFormat
    });
    
    this.showToast(this.translate.instant('settings.regional_saved'));
  }

  changePassword() {
    if (this.securityForm.invalid) return;
    this.securityForm.reset();
    this.showToast(this.translate.instant('settings.password_changed'));
  }

  toggle2fa() {
    const nextVal = !this.is2faEnabled();
    this.is2faEnabled.set(nextVal);
    localStorage.setItem('sf_2fa', String(nextVal));
    this.showToast(nextVal ? 'تم تفعيل المصادقة الثنائية بنجاح!' : 'تم تعطيل المصادقة الثنائية.');
  }

  updateSessionTimeout(event: any) {
    const timeout = event.target.value;
    localStorage.setItem('sf_session_timeout', timeout);
    this.showToast('تم تحديث مدة صلاحية الجلسة بنجاح!');
  }

  getModalTitle() {
    switch (this.currentType()) {
      case 'saleSource':
        return 'إضافة مصدر مبيعات جديد';
      case 'collectionPercentage':
        return 'إضافة نسبة تحصيل جديدة';
      case 'invoiceType':
        return 'إضافة نوع سداد / فاتورة جديد';
      case 'tax':
        return 'إضافة ضريبة جديدة في النظام';
      default:
        return 'إضافة إعداد جديد';
    }
  }

  getLabelPlaceholder() {
    switch (this.currentType()) {
      case 'saleSource':
        return 'مثال: فيسبوك';
      case 'collectionPercentage':
        return 'مثال: الدفعة الأولى';
      case 'invoiceType':
        return 'مثال: شيك بنكي';
      case 'tax':
        return 'مثال: ضريبة القيمة المضافة';
      default:
        return 'أدخل الاسم المعروض';
    }
  }

  getValuePlaceholder() {
    switch (this.currentType()) {
      case 'saleSource':
        return 'مثال: facebook';
      case 'collectionPercentage':
        return 'مثال: 10 (القيمة بالنسبة المئوية)';
      case 'invoiceType':
        return 'مثال: bank_check';
      case 'tax':
        return 'مثال: 14 (أدخل النسبة المئوية للضريبة)';
      default:
        return 'أدخل القيمة البرمجية';
    }
  }

  selectQuarter(quarterId: string): void {
    this.themeService.setQuarter(quarterId);
    this.selectedYear.set(parseInt(quarterId.split('-')[1], 10));
    this.showToast(this.translate.instant('settings.quarter_changed'));
  }

  formatQ(q: string): string {
    return formatQuarter(q, this.langService.currentLang() === 'ar' ? 'ar' : 'en');
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'BA': return 'مستشار عقاري (BA)';
      case 'BC': return 'مستشار عقاري أول (BC)';
      case 'Senior': return 'مستشار مبيعات كبار (Senior)';
      case 'SV': return 'مشرف مبيعات (SV)';
      case 'TeamLeader': return 'قائد فريق (Team Leader)';
      case 'Fresh': return 'موظف حديث التعيين (Fresh)';
      default: return role;
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'BA': return 'heroBriefcase';
      case 'BC': return 'heroBriefcase';
      case 'Senior': return 'heroSparkles';
      case 'SV': return 'heroClock';
      case 'TeamLeader': return 'heroUsers';
      case 'Fresh': return 'heroLightBulb';
      default: return 'heroBriefcase';
    }
  }

  getRoleSimpleLabel(role: string): string {
    switch (role) {
      case 'BA': return 'مستشار عقاري';
      case 'BC': return 'مستشار أول';
      case 'Senior': return 'مستشار كبار';
      case 'SV': return 'مشرف مبيعات';
      case 'TeamLeader': return 'قائد فريق';
      case 'Fresh': return 'حديث التعيين';
      default: return role;
    }
  }

  getRoleSubLabel(role: string): string {
    switch (role) {
      case 'BA': return 'مبتدئ / عادي';
      case 'BC': return 'مبيعات متقدمة';
      case 'Senior': return 'مبيعات كبار';
      case 'SV': return 'إشراف ومتابعة';
      case 'TeamLeader': return 'إدارة فريق عمل';
      case 'Fresh': return 'تدريب وعمولة فلات';
      default: return '';
    }
  }

  getRoleExplanation(role: string): string {
    switch (role) {
      case 'BA':
      case 'BC':
      case 'Senior':
        return 'يحسب مستهدف هذه الفئة للأيام الفعلية. يمكن تعديل المستهدف الربع سنوي. تخضع العمولات لشرائح مبيعات الشركة (عند تفعيل الربط) أو شرائح مبيعات المطور الشخصية.';
      case 'SV':
        return 'مشرف المبيعات لديه مستهدف خاص به يتم تعديله بعدد الأيام الفعلية. تحسب العمولات على شرائح مبيعات الشركة أو شرائح المبيعات الشخصية.';
      case 'TeamLeader':
        return 'قائد الفريق لا يحتاج لتحديد مستهدف ربع سنوي؛ حيث يتم حسابه تلقائياً من (مجموع مستهدفات جميع أعضاء فريقه بما فيهم المشرفين). تحسب علاوته بناءً على مبيعات فريقه الإجمالية المنجزة مضروبةً في شرائح مبيعات الشركة.';
      case 'Fresh':
        return 'الموظف الجديد حديث التعيين لا تنطبق عليه أي شرائح معقدة، وإنما يحصل على عمولة ثابتة (Flat Rate) لكل مليون مبيعات يقوم بإنجازها شخصياً.';
      default:
        return '';
    }
  }

  formatArabicMillions(value: number | null | undefined): string {
    if (!value) return '0 جنيه';
    if (value >= 1000000) {
      const millions = value / 1000000;
      return `${millions % 1 === 0 ? millions : millions.toFixed(2)} مليون جنيه`;
    }
    return `${value.toLocaleString(this.langService.currentLocale())} جنيه`;
  }

  get currentRoleRules() {
    return this.commissionRules()?.[this.selectedSeniority()];
  }

  updateTarget(event: any) {
    const val = Number(event.target.value);
    const rules = { ...this.commissionRules() };
    if (rules[this.selectedSeniority()]) {
      rules[this.selectedSeniority()].target = val;
      this.commissionRules.set(rules);
    }
  }

  updateFlatRate(event: any) {
    const val = Number(event.target.value);
    const rules = { ...this.commissionRules() };
    if (rules[this.selectedSeniority()]) {
      rules[this.selectedSeniority()].companyRate = val;
      this.commissionRules.set(rules);
    }
  }

  updateTier(index: number, field: string, event: any) {
    const val = event.target.value === '' ? undefined : Number(event.target.value);
    const rules = { ...this.commissionRules() };
    const roleRules = rules[this.selectedSeniority()];
    if (roleRules && roleRules.companyTiers && roleRules.companyTiers[index]) {
      roleRules.companyTiers[index][field] = val;
      this.commissionRules.set(rules);
    }
  }

  addTier() {
    const rules = { ...this.commissionRules() };
    const roleRules = rules[this.selectedSeniority()];
    if (roleRules) {
      if (!roleRules.companyTiers) {
        roleRules.companyTiers = [];
      }
      roleRules.companyTiers.push({ minAchievement: 0, maxAchievement: 100, ratePerMillion: 4500 });
      this.commissionRules.set(rules);
    }
  }

  removeTier(index: number) {
    const rules = { ...this.commissionRules() };
    const roleRules = rules[this.selectedSeniority()];
    if (roleRules && roleRules.companyTiers) {
      roleRules.companyTiers.splice(index, 1);
      this.commissionRules.set(rules);
    }
  }

  updateSlab(index: number, field: string, event: any) {
    let val: any;
    if (field === 'useCompanyTiers') {
      val = event.target.checked;
    } else {
      val = event.target.value === '' ? undefined : Number(event.target.value);
    }
    const rules = { ...this.commissionRules() };
    const roleRules = rules[this.selectedSeniority()];
    if (roleRules && roleRules.personalSlabs && roleRules.personalSlabs[index]) {
      roleRules.personalSlabs[index][field] = val;
      this.commissionRules.set(rules);
    }
  }

  addSlab() {
    const rules = { ...this.commissionRules() };
    const roleRules = rules[this.selectedSeniority()];
    if (roleRules) {
      if (!roleRules.personalSlabs) {
        roleRules.personalSlabs = [];
      }
      roleRules.personalSlabs.push({ minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 });
      this.commissionRules.set(rules);
    }
  }

  removeSlab(index: number) {
    const rules = { ...this.commissionRules() };
    const roleRules = rules[this.selectedSeniority()];
    if (roleRules && roleRules.personalSlabs) {
      roleRules.personalSlabs.splice(index, 1);
      this.commissionRules.set(rules);
    }
  }

  saveCommissionRules() {
    const payload = { value: JSON.stringify(this.commissionRules()) };
    const rulesSetting = this.settings().find(s => s.type === 'commissionRules');

    const request$ = rulesSetting
      ? this.settingService.updateSetting(rulesSetting._id, payload)
      : this.settingService.createSetting({
          type: 'commissionRules',
          label: 'لائحة العمولات',
          value: payload.value,
          isDefault: true,
          isActive: true,
          sortOrder: 0
        });

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.loadSettings();
          this.showToast(this.translate.instant('settings.commission_saved'));
        }
      },
      error: (err) => {
        this.showToast('خطأ أثناء حفظ قواعد العمولات: ' + (err.error?.message || 'حاول مرة أخرى'));
      }
    });
  }
}
