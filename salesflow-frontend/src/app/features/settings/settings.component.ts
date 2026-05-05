import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SettingService, Setting } from '@core/services/setting.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroCog6Tooth, heroShieldCheck, heroSwatch, heroGlobeAlt, heroPlus, heroCheck, heroXMark } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ReactiveFormsModule],
  providers: [
    provideIcons({ heroCog6Tooth, heroShieldCheck, heroSwatch, heroGlobeAlt, heroPlus, heroCheck, heroXMark })
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
              <button (click)="openModal('saleSource')" class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 hover:bg-sf-primary/10 px-3 py-1.5 rounded-lg transition-all">
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
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold text-sf-muted uppercase">{{ s.value }}</span>
                    <button (click)="deleteSetting(s._id)" class="opacity-0 group-hover:opacity-100 p-1 text-sf-muted hover:text-sf-danger transition-all">
                      <ng-icon name="heroXMark"></ng-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Collection Percentages -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
            <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
              <h3 class="text-lg font-display font-bold text-sf-text">نسب التحصيل</h3>
              <button (click)="openModal('collectionPercentage')" class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 hover:bg-sf-primary/10 px-3 py-1.5 rounded-lg transition-all">
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
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold text-sf-muted uppercase">{{ s.value }}%</span>
                    <button (click)="deleteSetting(s._id)" class="opacity-0 group-hover:opacity-100 p-1 text-sf-muted hover:text-sf-danger transition-all">
                      <ng-icon name="heroXMark"></ng-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          </section>
        </div>
      </div>

      <!-- Add Setting Modal -->
      <div *ngIf="showModal()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="absolute inset-0 bg-sf-bg/80 backdrop-blur-md" (click)="closeModal()"></div>
        <div class="glass-card w-full max-w-md p-8 rounded-[2rem] border border-sf-border shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 text-right">
          <h2 class="text-2xl font-display font-bold text-sf-text mb-6">
            {{ currentType() === 'saleSource' ? 'إضافة مصدر مبيعات جديد' : 'إضافة نسبة تحصيل جديدة' }}
          </h2>

          <form [formGroup]="form" (ngSubmit)="saveSetting()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الاسم (العرض)</label>
              <input type="text" formControlName="label" placeholder="مثال: فيسبوك"
                     class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all">
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">القيمة (النظام)</label>
              <input type="text" formControlName="value" placeholder="مثal: facebook"
                     class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all">
            </div>

            <div class="grid grid-cols-2 gap-4 mt-8">
              <button type="button" (click)="closeModal()" class="py-4 rounded-2xl bg-sf-surface border border-sf-border text-sf-text font-bold hover:bg-sf-bg transition-all">
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
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .shadow-glow-purple { box-shadow: 0 0 15px rgba(147, 51, 234, 0.3); }
  `]
})
export class SettingsComponent implements OnInit {
  private settingService = inject(SettingService);
  private fb = inject(FormBuilder);

  settings = signal<Setting[]>([]);
  showModal = signal(false);
  currentType = signal<string>('');
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      label: ['', [Validators.required]],
      value: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.settingService.getAllSettings().subscribe(res => {
      if (res.success) {
        this.settings.set(res.data);
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
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Error saving setting');
      }
    });
  }

  deleteSetting(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعداد؟')) return;
    
    this.settingService.deleteSetting(id).subscribe({
      next: () => this.loadSettings(),
      error: (err) => alert(err.error?.message || 'Error deleting setting')
    });
  }
}
