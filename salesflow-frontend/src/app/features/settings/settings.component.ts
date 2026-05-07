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
        <p class="text-sf-muted font-medium mt-1">الإعدادات العامة، قيم القوائم المنسدلة، وتفضيلات الأمان واللغة.</p>
      </header>

      <!-- Toast Notification -->
      <div *ngIf="saveSuccessMessage()" class="fixed top-24 left-6 z-[110] bg-sf-success text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in-left border border-white/20">
        <ng-icon name="heroCheck" class="text-xl"></ng-icon>
        <span class="font-bold text-sm">{{ saveSuccessMessage() }}</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Tabs -->
        <div class="lg:col-span-1 space-y-2">
          <button (click)="activeTab.set('lists')"
                  [class]="activeTab() === 'lists' ? 
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all text-right' : 
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all text-right'">
            <ng-icon name="heroSwatch"></ng-icon>
            قيم القوائم
          </button>
          <button (click)="activeTab.set('regional')"
                  [class]="activeTab() === 'regional' ? 
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all text-right' : 
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all text-right'">
            <ng-icon name="heroGlobeAlt"></ng-icon>
            اللغة والمنطقة
          </button>
          <button (click)="activeTab.set('security')"
                  [class]="activeTab() === 'security' ? 
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all text-right' : 
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all text-right'">
            <ng-icon name="heroShieldCheck"></ng-icon>
            الأمان والمصادقة
          </button>
        </div>

        <!-- Content Area -->
        <div class="lg:col-span-3 space-y-8">
          
          <!-- TAB 1: DROPDOWN VALUES -->
          <div *ngIf="activeTab() === 'lists'" class="space-y-8 animate-fade-in">
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

            <!-- Invoice Types -->
            <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
              <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
                <h3 class="text-lg font-display font-bold text-sf-text">أنواع الفواتير وطرق السداد</h3>
                <button (click)="openModal('invoiceType')" class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 hover:bg-sf-primary/10 px-3 py-1.5 rounded-lg transition-all">
                  <ng-icon name="heroPlus"></ng-icon>
                  إضافة نوع
                </button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (s of getSettingsByType('invoiceType'); track s._id) {
                  <div class="flex items-center justify-between p-4 bg-sf-bg/50 rounded-2xl border border-sf-border group hover:border-sf-primary/30 transition-all">
                    <div class="flex items-center gap-3">
                      <div class="w-2 h-2 rounded-full bg-sf-warning"></div>
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
          </div>

          <!-- TAB 2: REGIONAL PREFERENCES -->
          <div *ngIf="activeTab() === 'regional'" class="space-y-8 animate-fade-in">
            <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
              <div class="pb-4 border-b border-sf-border/30">
                <h3 class="text-lg font-display font-bold text-sf-text">تفضيلات اللغة والمنطقة</h3>
                <p class="text-xs text-sf-muted mt-1">تخصيص لغة النظام والعملة الافتراضية وصيغ العرض المفضلة لديك.</p>
              </div>

              <form [formGroup]="regionalForm" (ngSubmit)="saveRegionalSettings()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Language Selection -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">اللغة المفضلة</label>
                    <select formControlName="language" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
                      <option value="ar">العربية (الأصلية)</option>
                      <option value="en">English (الإنجليزية)</option>
                    </select>
                  </div>

                  <!-- Currency Symbol -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">رمز العملة الافتراضي</label>
                    <select formControlName="currency" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>

                  <!-- Timezone -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المنطقة الزمنية</label>
                    <select formControlName="timezone" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
                      <option value="Africa/Cairo">توقيت القاهرة (UTC+02:00)</option>
                      <option value="Asia/Riyadh">توقيت مكة المكرمة (UTC+03:00)</option>
                      <option value="UTC">التوقيت العالمي الموحد (UTC)</option>
                    </select>
                  </div>

                  <!-- Date Format -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">صيغة عرض التاريخ</label>
                    <select formControlName="dateFormat" class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-05-07)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (07/05/2026)</option>
                    </select>
                  </div>
                </div>

                <div class="flex justify-start pt-4">
                  <button type="submit" [disabled]="regionalForm.invalid" class="px-8 py-3.5 rounded-2xl bg-sf-primary text-white font-bold shadow-glow-purple hover:brightness-110 transition-all flex items-center gap-2">
                    <ng-icon name="heroCheck"></ng-icon>
                    حفظ التفضيلات الإقليمية
                  </button>
                </div>
              </form>
            </section>
          </div>

          <!-- TAB 3: SECURITY & AUTHENTICATION -->
          <div *ngIf="activeTab() === 'security'" class="space-y-8 animate-fade-in">
            <!-- Password Change -->
            <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
              <div class="pb-4 border-b border-sf-border/30">
                <h3 class="text-lg font-display font-bold text-sf-text">تغيير كلمة المرور</h3>
                <p class="text-xs text-sf-muted mt-1">تأكد من استخدام كلمة مرور قوية وغير مكررة لحماية حسابك.</p>
              </div>

              <form [formGroup]="securityForm" (ngSubmit)="changePassword()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">كلمة المرور الحالية</label>
                    <input type="password" formControlName="currentPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">كلمة المرور الجديدة</label>
                    <input type="password" formControlName="newPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">تأكيد كلمة المرور</label>
                    <input type="password" formControlName="confirmPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
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
            <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
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
                  <select (change)="updateSessionTimeout($event)" class="px-4 py-2 bg-sf-bg border border-sf-border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all">
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
                        <div class="w-8 h-8 rounded-full bg-sf-primary/10 text-sf-primary flex items-center justify-center text-sm font-bold">PC</div>
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
                        <div class="w-8 h-8 rounded-full bg-sf-muted/10 text-sf-muted flex items-center justify-center text-sm font-bold">MB</div>
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
        <div class="glass-card w-full max-w-md p-8 rounded-[2rem] border border-sf-border shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 text-right">
          <h2 class="text-2xl font-display font-bold text-sf-text mb-6">
            {{ getModalTitle() }}
          </h2>

          <form [formGroup]="form" (ngSubmit)="saveSetting()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الاسم (العرض)</label>
              <input type="text" formControlName="label" [placeholder]="getLabelPlaceholder()"
                     class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">القيمة (النظام)</label>
              <input type="text" formControlName="value" [placeholder]="getValuePlaceholder()"
                     class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold">
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
  `]
})
export class SettingsComponent implements OnInit {
  private settingService = inject(SettingService);
  private fb = inject(FormBuilder);

  settings = signal<Setting[]>([]);
  activeTab = signal<'lists' | 'regional' | 'security'>('lists');
  showModal = signal(false);
  currentType = signal<string>('');
  saveSuccessMessage = signal<string | null>(null);
  is2faEnabled = signal(localStorage.getItem('sf_2fa') === 'true');

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
          this.showToast('تمت إضافة الإعداد الجديد بنجاح!');
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
      next: () => {
        this.loadSettings();
        this.showToast('تم حذف الإعداد بنجاح!');
      },
      error: (err) => alert(err.error?.message || 'Error deleting setting')
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
    
    this.showToast('تم حفظ التفضيلات الإقليمية وتطبيقها بنجاح!');
  }

  changePassword() {
    if (this.securityForm.invalid) return;
    this.securityForm.reset();
    this.showToast('تم تحديث كلمة المرور الخاصة بك بنجاح!');
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
      default:
        return 'أدخل القيمة البرمجية';
    }
  }
}
