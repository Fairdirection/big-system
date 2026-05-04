import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingService, Setting } from '@core/services/setting.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroCog6Tooth, heroShieldCheck, heroSwatch, heroGlobeAlt, heroPlus } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({ heroCog6Tooth, heroShieldCheck, heroSwatch, heroGlobeAlt, heroPlus })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in pb-20">
      <!-- Header -->
      <header>
        <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">إعدادات النظام</h1>
        <p class="text-sf-muted font-medium mt-1">الإعدادات العامة، قيم القوائم المنسدلة، وتفضيلات الأمان.</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Tabs -->
        <div class="lg:col-span-1 space-y-2">
          <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all text-right">
            <ng-icon name="heroSwatch"></ng-icon>
            قيم القوائم
          </button>
          <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all text-right">
            <ng-icon name="heroGlobeAlt"></ng-icon>
            اللغة والمنطقة
          </button>
          <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all text-right">
            <ng-icon name="heroShieldCheck"></ng-icon>
            الأمان والمصادقة
          </button>
        </div>

        <!-- Content Area -->
        <div class="lg:col-span-3 space-y-8">
          <!-- Sale Sources -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
            <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
              <h3 class="text-lg font-display font-bold text-sf-text">مصادر المبيعات</h3>
              <button class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2">
                <ng-icon name="heroPlus"></ng-icon>
                إضافة مصدر
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (s of getSettingsByType('saleSource'); track s._id) {
                <div class="flex items-center justify-between p-4 bg-sf-bg/50 rounded-2xl border border-sf-border group hover:border-sf-primary/30 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-sf-primary"></div>
                    <span class="text-sm font-semibold text-sf-text">{{ s.label }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase">{{ s.value }}</span>
                </div>
              }
            </div>
          </section>

          <!-- Collection Percentages -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
            <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
              <h3 class="text-lg font-display font-bold text-sf-text">نسب التحصيل</h3>
              <button class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2">
                <ng-icon name="heroPlus"></ng-icon>
                إضافة نسبة
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (s of getSettingsByType('collectionPercentage'); track s._id) {
                <div class="flex items-center justify-between p-4 bg-sf-bg/50 rounded-2xl border border-sf-border group hover:border-sf-primary/30 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-sf-info"></div>
                    <span class="text-sm font-semibold text-sf-text">{{ s.label }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase">{{ s.value }}%</span>
                </div>
              }
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class SettingsComponent implements OnInit {
  private settingService = inject(SettingService);
  settings = signal<Setting[]>([]);

  ngOnInit() {
    this.settingService.getAllSettings().subscribe(res => {
      if (res.success) {
        this.settings.set(res.data);
      }
    });
  }

  getSettingsByType(type: string) {
    return this.settings().filter(s => s.type === type);
  }
}
