import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SaleService } from '@core/services/sale.service';
import { ClientService } from '@core/services/client.service';
import { EmployeeService } from '@core/services/employee.service';
import { ToastService } from '@core/services/toast.service';
import { SettingService } from '@core/services/setting.service';
import { CelebrationService } from '@core/services/celebration.service';
import { InputComponent } from '@shared/components/input/input.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronLeft, heroChevronRight, heroCheck, heroUserPlus, heroTrash, heroExclamationCircle, heroXMark } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, NgIconComponent, CurrencyEgpPipe],
  providers: [
    provideIcons({ heroChevronLeft, heroChevronRight, heroCheck, heroUserPlus, heroTrash, heroExclamationCircle, heroXMark })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 relative text-right" dir="rtl">
      <!-- Sticky Header -->
      <header class="sticky top-0 z-40 py-4 bg-sf-bg/80 backdrop-blur-md border-b border-sf-border/50 -mx-6 px-6 flex items-center justify-between transition-all duration-300">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
            <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
          </button>
          <div>
            <h1 class="text-2xl font-display font-bold text-sf-text">
              {{ isEditMode() ? 'تعديل بيانات المبيعة' : 'إدخال مبيعة جديدة' }}
            </h1>
            <p class="text-[10px] font-bold text-sf-muted uppercase tracking-widest mt-0.5">
              {{ isEditMode() ? 'تحديث السجلات الحالية' : 'إضافة سجل مبيعات جديد' }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="goBack()" class="px-5 py-2.5 text-xs font-bold text-sf-muted hover:text-sf-text transition-colors uppercase tracking-widest">إلغاء</button>
          <button (click)="submit()" 
                  [disabled]="isSubmitting() || form.invalid"
                  class="bg-sf-primary text-white px-8 py-3 rounded-2xl font-bold shadow-glow-purple flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all">
            @if (isSubmitting()) {
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            } @else {
              <ng-icon name="heroCheck"></ng-icon>
            }
            <span>حفظ النهائي</span>
          </button>
        </div>
      </header>

      <!-- Progress Stepper Header -->
      <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-md mb-8">
        <div class="flex items-center justify-between relative">
          <!-- Connector line -->
          <div class="absolute top-1/2 left-4 right-4 h-0.5 bg-sf-border/50 -translate-y-1/2 z-0"></div>
          
          <!-- Stepper circles -->
          <div class="flex items-center justify-between w-full relative z-10">
            <!-- Step 1 -->
            <button type="button" (click)="setStep(1)" class="flex flex-col items-center gap-2 group outline-none">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2"
                   [class.bg-sf-primary]="currentStep() === 1"
                   [class.text-white]="currentStep() === 1"
                   [class.border-sf-primary]="currentStep() === 1"
                   [class.bg-sf-success]="currentStep() > 1"
                   [class.text-white]="currentStep() > 1"
                   [class.border-sf-success]="currentStep() > 1"
                   [class.bg-sf-bg]="currentStep() < 1"
                   [class.text-sf-muted]="currentStep() < 1"
                   [class.border-sf-border]="currentStep() < 1">
                @if (currentStep() > 1) {
                  <ng-icon name="heroCheck" class="text-sm"></ng-icon>
                } @else {
                  <span>1</span>
                }
              </div>
              <span class="text-xs font-bold transition-all"
                    [class.text-sf-primary]="currentStep() === 1"
                    [class.text-sf-success]="currentStep() > 1"
                    [class.text-sf-muted]="currentStep() < 1">البيانات الأساسية</span>
            </button>

            <!-- Step 2 -->
            <button type="button" (click)="setStep(2)" [disabled]="!isStepValid(1)" class="flex flex-col items-center gap-2 group outline-none disabled:opacity-50">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2"
                   [class.bg-sf-primary]="currentStep() === 2"
                   [class.text-white]="currentStep() === 2"
                   [class.border-sf-primary]="currentStep() === 2"
                   [class.bg-sf-success]="currentStep() > 2"
                   [class.text-white]="currentStep() > 2"
                   [class.border-sf-success]="currentStep() > 2"
                   [class.bg-sf-bg]="currentStep() < 2"
                   [class.text-sf-muted]="currentStep() < 2"
                   [class.border-sf-border]="currentStep() < 2">
                @if (currentStep() > 2) {
                  <ng-icon name="heroCheck" class="text-sm"></ng-icon>
                } @else {
                  <span>2</span>
                }
              </div>
              <span class="text-xs font-bold transition-all"
                    [class.text-sf-primary]="currentStep() === 2"
                    [class.text-sf-success]="currentStep() > 2"
                    [class.text-sf-muted]="currentStep() < 2">توزيع العمولات</span>
            </button>

            <!-- Step 3 -->
            <button type="button" (click)="setStep(3)" [disabled]="!isStepValid(2)" class="flex flex-col items-center gap-2 group outline-none disabled:opacity-50">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2"
                   [class.bg-sf-primary]="currentStep() === 3"
                   [class.text-white]="currentStep() === 3"
                   [class.border-sf-primary]="currentStep() === 3"
                   [class.bg-sf-success]="currentStep() > 3"
                   [class.text-white]="currentStep() > 3"
                   [class.border-sf-success]="currentStep() > 3"
                   [class.bg-sf-bg]="currentStep() < 3"
                   [class.text-sf-muted]="currentStep() < 3"
                   [class.border-sf-border]="currentStep() < 3">
                @if (currentStep() > 3) {
                  <ng-icon name="heroCheck" class="text-sm"></ng-icon>
                } @else {
                  <span>3</span>
                }
              </div>
              <span class="text-xs font-bold transition-all"
                    [class.text-sf-primary]="currentStep() === 3"
                    [class.text-sf-success]="currentStep() > 3"
                    [class.text-sf-muted]="currentStep() < 3">الحسابات والضرائب</span>
            </button>

            <!-- Step 4 -->
            <button type="button" (click)="setStep(4)" [disabled]="!isStepValid(3)" class="flex flex-col items-center gap-2 group outline-none disabled:opacity-50">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2"
                   [class.bg-sf-primary]="currentStep() === 4"
                   [class.text-white]="currentStep() === 4"
                   [class.border-sf-primary]="currentStep() === 4"
                   [class.bg-sf-bg]="currentStep() < 4"
                   [class.text-sf-muted]="currentStep() < 4"
                   [class.border-sf-border]="currentStep() < 4">
                <span>4</span>
              </div>
              <span class="text-xs font-bold transition-all"
                    [class.text-sf-primary]="currentStep() === 4"
                    [class.text-sf-muted]="currentStep() < 4">المراجعة والتأكيد</span>
            </button>
          </div>
        </div>
      </div>

      <form *ngIf="!isLoading(); else skeleton" [formGroup]="form" class="space-y-8 text-right">
        
        <!-- ==================== STEP 1 ==================== -->
        <div *ngIf="currentStep() === 1" class="space-y-6 animate-fade-in">
          <!-- Client & Project Section -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-primary rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">تفاصيل المشروع والعميل والوحدة</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">اسم المشروع</label>
                <app-input formControlName="projectName" placeholder="مثال: سكاي لاين ريزيدنس"
                           [hasError]="isInvalid('projectName')"
                           errorMessage="اسم المشروع مطلوب"
                           hint="اسم المشروع العقاري أو الكومباوند"></app-input>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">العميل</label>
                <div class="flex gap-2">
                  <select formControlName="clientId" class="flex-1 px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all h-[42px]">
                    <option [value]="null">اختر العميل</option>
                    @for (client of clients(); track client._id) {
                      <option [value]="client._id">{{ client.name }}</option>
                    }
                  </select>
                  <button type="button" (click)="openQuickClientModal()" 
                          class="p-2.5 bg-sf-primary/10 hover:bg-sf-primary/25 border border-sf-primary/20 text-sf-primary rounded-xl transition-all flex items-center justify-center h-[42px] w-[42px] shrink-0"
                          title="تسجيل عميل سريع">
                    <ng-icon name="heroUserPlus" class="text-lg"></ng-icon>
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">رقم الوحدة</label>
                <app-input formControlName="unitNumber" placeholder="مثال: A-101"
                           [hasError]="isInvalid('unitNumber')"
                           errorMessage="رقم الوحدة مطلوب"
                           hint="الرقم التعريفي للوحدة"></app-input>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">نوع الوحدة</label>
                <app-input formControlName="unitType" placeholder="مثال: شقة"
                           [hasError]="isInvalid('unitType')"
                           errorMessage="نوع الوحدة مطلوب"
                           hint="شقة، فيلا، تجاري، إلخ"></app-input>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">سعر التعاقد (ج.م)</label>
                <app-input type="number" formControlName="unitValue" placeholder="0.00" [isAccounting]="true"
                           [hasError]="isInvalid('unitValue')"
                           errorMessage="سعر التعاقد مطلوب"
                           hint="إجمالي سعر الوحدة في العقد"></app-input>
              </div>
            </div>
          </section>

          <!-- Sale Setup Settings Section -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-info rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">إعدادات وتاريخ المبيعة</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">تاريخ التعاقد</label>
                <app-input type="date" formControlName="contractDate"
                           [hasError]="isInvalid('contractDate')"
                           errorMessage="تاريخ التعاقد مطلوب"
                           hint="التاريخ المسجل في العقد"></app-input>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">مصدر المبيعة</label>
                <select formControlName="source" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text focus:ring-2 focus:ring-sf-primary/50 outline-none h-[42px]">
                  @for (s of sources(); track s._id) {
                    <option [value]="s.value">{{ s.label }}</option>
                  }
                </select>
                <p class="text-[10px] text-sf-muted mr-1">كيف وصل العميل للشركة؟</p>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">حالة البيعة</label>
                <select formControlName="status" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text focus:ring-2 focus:ring-sf-primary/50 outline-none h-[42px]">
                  <option value="draft">مسودة (غير محسوبة)</option>
                  <option value="confirmed">مؤكدة (محسوبة)</option>
                  <option value="collected">محصلة</option>
                </select>
                <p class="text-[10px] text-sf-muted mr-1">المبيعات المؤكدة فقط تظهر في الإحصائيات</p>
              </div>
            </div>
          </section>
        </div>

        <!-- ==================== STEP 2 ==================== -->
        <div *ngIf="currentStep() === 2" class="space-y-6 animate-fade-in">
          <!-- Sellers Section -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
              <div class="flex items-center gap-3">
                <div class="w-2 h-6 bg-sf-secondary rounded-full"></div>
                <h3 class="text-lg font-display font-bold text-sf-text">توزيع فريق المبيعات المستحقين للعمولة</h3>
              </div>
              <button type="button" (click)="addSeller()" 
                      [disabled]="sellers.length >= 4"
                      class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 hover:bg-sf-primary/10 px-3 py-1.5 rounded-lg transition-all">
                <ng-icon name="heroUserPlus"></ng-icon>
                إضافة بائع جديد
              </button>
            </div>

            <!-- Segmented Progress Bar Visualizer -->
            @if (sellers.length > 0) {
              <div class="space-y-3 p-4 bg-sf-bg/20 border border-sf-border/40 rounded-2xl">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-sf-muted">مؤشر توزيع النسب التفاعلي:</span>
                  <span class="font-mono-numbers font-black px-2.5 py-1 rounded-full text-xs" 
                        [class.bg-sf-success/10]="sellerTotalShare() === 100" 
                        [class.text-sf-success]="sellerTotalShare() === 100"
                        [class.bg-sf-error/10]="sellerTotalShare() !== 100" 
                        [class.text-sf-error]="sellerTotalShare() !== 100">
                    {{ sellerTotalShare() }}% / 100%
                  </span>
                </div>
                
                <!-- Progress Bar Container -->
                <div class="w-full h-5 bg-sf-bg border border-sf-border/50 rounded-xl overflow-hidden flex transition-all duration-500 shadow-inner">
                  @for (s of sellers.value; track $index; let i = $index) {
                    @if (s.sharePercentage > 0) {
                      <div class="h-full transition-all duration-500 ease-out flex items-center justify-center text-[10px] font-mono-numbers font-black text-white"
                           [class.bg-sf-primary]="i === 0"
                           [class.bg-sf-secondary]="i === 1"
                           [class.bg-sf-success]="i === 2"
                           [class.bg-sf-info]="i === 3"
                           [style.width.%]="s.sharePercentage">
                        @if (s.sharePercentage >= 10) {
                          <span>{{ s.sharePercentage }}%</span>
                        }
                      </div>
                    }
                  }
                </div>
                
                <!-- Quick legend -->
                <div class="flex flex-wrap gap-4 pt-1 border-t border-sf-border/20">
                  @for (s of sellers.value; track $index; let i = $index) {
                    @if (s.employeeId) {
                      <div class="flex items-center gap-2 text-[10px] font-bold text-sf-muted">
                        <span class="w-2.5 h-2.5 rounded-full"
                              [class.bg-sf-primary]="i === 0"
                              [class.bg-sf-secondary]="i === 1"
                              [class.bg-sf-success]="i === 2"
                              [class.bg-sf-info]="i === 3"></span>
                        <span>{{ getEmployeeName(s.employeeId) }} ({{ s.sharePercentage }}%)</span>
                      </div>
                    }
                  }
                </div>
              </div>
            }

            <div class="space-y-4" formArrayName="sellers">
              @for (seller of sellers.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="flex items-end gap-4 p-4 bg-sf-bg/30 rounded-2xl border border-sf-border/50 group">
                  <div class="flex-1 space-y-2">
                    <label class="text-[10px] font-bold text-sf-muted uppercase tracking-widest mr-1">البائع #{{ i + 1 }}</label>
                    <select formControlName="employeeId" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all h-[42px]">
                      <option [value]="null">اختر البائع</option>
                      @for (emp of employees(); track emp._id) {
                        <option [value]="emp._id">{{ emp.name }} ({{ emp.code }})</option>
                      }
                    </select>
                  </div>
                  <div class="w-32 space-y-2">
                    <label class="text-[10px] font-bold text-sf-muted uppercase tracking-widest mr-1">النسبة %</label>
                    <app-input type="number" formControlName="sharePercentage" placeholder="0"
                               hint="نسبة المشاركة من العمولة"></app-input>
                  </div>
                  <button type="button" (click)="removeSeller(i)" 
                          class="p-2.5 text-sf-muted hover:text-sf-error hover:bg-sf-error/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <ng-icon name="heroTrash"></ng-icon>
                  </button>
                </div>
              }
            </div>

            @if (sellers.length > 0 && sellerTotalShare() !== 100) {
              <div class="p-3 bg-sf-error/10 border border-sf-error/20 rounded-xl text-sf-error text-xs font-bold flex items-center gap-2">
                <ng-icon name="heroExclamationCircle"></ng-icon>
                <span>تنبيه: يجب أن يكون إجمالي نسب المشاركة للبائعين مساويًا لـ 100% تمامًا (الحالي: {{ sellerTotalShare() }}%)</span>
              </div>
            }
          </section>
        </div>

        <!-- ==================== STEP 3 ==================== -->
        <div *ngIf="currentStep() === 3" class="space-y-6 animate-fade-in">
          <!-- Calculations and Taxes -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-success rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">العمليات الحسابية والضرائب المخصصة</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- النسبة المحصلة من المطور -->
              <div class="space-y-2">
                <label class="text-sm font-black text-sf-text/90 uppercase tracking-wide mr-1">النسبة المحصلة من المطور (%)</label>
                <app-input type="number" formControlName="developerCollectionPercentage" placeholder="100"
                           [hasError]="isInvalid('developerCollectionPercentage')"
                           errorMessage="النسبة مطلوبة"
                           hint="مثال: 50% أو 100%"></app-input>
              </div>

              <!-- نسبة العمولة فى العقد -->
              <div class="space-y-2">
                <label class="text-sm font-black text-sf-text/90 uppercase tracking-wide mr-1">نسبة العمولة في العقد (%)</label>
                <app-input type="number" formControlName="contractCommissionPercentage" placeholder="2.5"
                           [hasError]="isInvalid('contractCommissionPercentage')"
                           errorMessage="النسبة مطلوبة"
                           hint="نسبة عمولة التعاقد المتفق عليها"></app-input>
              </div>

              <!-- النسبة المحصلة الاولى -->
              <div class="space-y-2">
                <label class="text-sm font-black text-sf-text/90 uppercase tracking-wide mr-1">النسبة المحصلة الأولى (%)</label>
                <app-input type="number" formControlName="collectedCommissionPercentage" placeholder="1.25"
                           [hasError]="isInvalid('collectedCommissionPercentage')"
                           errorMessage="النسبة مطلوبة"
                           hint="نسبة العقد × نسبة تحصيل المطور"></app-input>
              </div>
            </div>

            <!-- اختيار الضرائب المحددة في الإعدادات -->
            @if (taxes().length > 0) {
              <div class="space-y-4 p-6 bg-sf-primary/5 border border-sf-primary/10 rounded-3xl text-right">
                <span class="text-sm font-black text-sf-primary uppercase tracking-wide block mb-1">الضرائب المتاحة في الإعدادات (اضغط للتطبيق المباشر):</span>
                <div class="flex flex-wrap gap-3">
                  @for (t of taxes(); track t._id) {
                    <button type="button" (click)="toggleTax(t)"
                            [class]="isTaxChecked(t) ? 
                            'px-5 py-3 rounded-2xl border-2 border-sf-danger bg-sf-danger/10 text-sf-danger text-sm font-bold transition-all flex items-center gap-2.5 scale-102 shadow-glow-red' : 
                            'px-5 py-3 rounded-2xl border border-sf-border bg-sf-surface hover:bg-sf-bg/50 text-sf-text text-sm font-semibold transition-all flex items-center gap-2.5'">
                      <div class="w-2.5 h-2.5 rounded-full" [class]="isTaxChecked(t) ? 'bg-sf-danger animate-ping' : 'bg-sf-muted/50'"></div>
                      <span>{{ t.label }} ({{ t.value }}%)</span>
                      @if (isTaxChecked(t)) {
                        <ng-icon name="heroCheck" class="text-sm"></ng-icon>
                      }
                    </button>
                  }
                </div>
              </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-sf-border/10">
              <!-- نسبة ضريبة القيمة المضافة -->
              <div class="space-y-2">
                <label class="text-sm font-black text-sf-text/90 uppercase tracking-wide mr-1">نسبة ضريبة القيمة المضافة (%)</label>
                <app-input type="number" formControlName="vatPercentage" placeholder="14"
                           [hasError]="isInvalid('vatPercentage')"
                           errorMessage="النسبة مطلوبة"
                           hint="النسبة الافتراضية 14% للقيمة المضافة"></app-input>
              </div>

              <!-- نسبة ضريبة الخصم من المنبع -->
              <div class="space-y-2">
                <label class="text-sm font-black text-sf-text/90 uppercase tracking-wide mr-1">نسبة ضريبة الخصم من المنبع (%)</label>
                <app-input type="number" formControlName="withholdingTaxPercentage" placeholder="5"
                           [hasError]="isInvalid('withholdingTaxPercentage')"
                           errorMessage="النسبة مطلوبة"
                           hint="النسبة الافتراضية 5% لخدمات الوساطة"></app-input>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-sf-border/20">
              <!-- العمولة شاملة القيمة المضافة -->
              <div class="space-y-2">
                <label class="text-sm font-black text-sf-text/90 uppercase tracking-wide mr-1">العمولة شاملة القيمة المضافة (ج.م)</label>
                <app-input type="number" formControlName="grossCommissionWithVAT" placeholder="0.00" [isAccounting]="true"
                           [hasError]="isInvalid('grossCommissionWithVAT')"
                           errorMessage="المبلغ مطلوب"
                           hint="إجمالي قيمة عمولة المبيعة شاملة الـ VAT"></app-input>
              </div>

              <!-- مبلغ الشيك / مبلغ الفاتورة -->
              <div class="space-y-2">
                <label class="text-sm font-black text-sf-text/90 uppercase tracking-wide mr-1">مبلغ الشيك / مبلغ الفاتورة (ج.م)</label>
                <app-input type="number" formControlName="invoiceAmount" placeholder="0.00" [isAccounting]="true"
                           [hasError]="isInvalid('invoiceAmount')"
                           errorMessage="المبلغ مطلوب"
                           hint="المبلغ النهائي المستحق للتحصيل (مبلغ الشيك)"></app-input>
              </div>
            </div>

            <!-- Summary Preview Cards -->
            <div class="mt-8 p-6 bg-sf-primary/5 rounded-3xl border-2 border-sf-primary/30 space-y-4">
              <div class="flex justify-between items-center text-right">
                <span class="text-sm font-black text-sf-text uppercase">إجمالي العمولة شاملة القيمة المضافة (Gross)</span>
                <span class="text-xl font-black font-mono text-sf-text">{{ calculatedGross() | currencyEgp }}</span>
              </div>
              <div class="flex justify-between items-center text-right border-t border-sf-border/20 pt-3">
                <span class="text-sm font-black text-sf-text uppercase">صافي إيراد الشركة غير شامل الضريبة (Net)</span>
                <span class="text-xl font-black font-mono text-sf-primary">{{ calculatedNet() | currencyEgp }}</span>
              </div>
              <div class="flex justify-between items-center text-right border-t border-sf-border/20 pt-3">
                <span class="text-sm font-black text-sf-text uppercase">قيمة ضريبة القيمة المضافة ({{ form.get('vatPercentage')?.value }}% VAT)</span>
                <span class="text-lg font-black font-mono text-neon-pink">{{ (calculatedGross() - calculatedNet()) | currencyEgp }}</span>
              </div>
              <div class="flex justify-between items-center text-right border-t border-sf-border/20 pt-3">
                <span class="text-sm font-black text-sf-text uppercase">قيمة خصم ضريبة من المنبع ({{ form.get('withholdingTaxPercentage')?.value }}% WHT)</span>
                <span class="text-lg font-black font-mono text-sf-danger">- {{ form.get('withholdingTax')?.value | currencyEgp }}</span>
              </div>
              <div class="flex justify-between items-center border-t-2 border-sf-border pt-3">
                <span class="text-sm font-extrabold text-sf-success uppercase">مبلغ الفاتورة النهائي (مبلغ الشيك المستحق)</span>
                <span class="text-3xl font-black font-mono text-sf-success shadow-glow-green px-4 py-1.5 bg-sf-success/10 rounded-xl">{{ form.get('invoiceAmount')?.value | currencyEgp }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- ==================== STEP 4 ==================== -->
        <div *ngIf="currentStep() === 4" class="space-y-6 animate-fade-in">
          <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 text-right">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-success rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">مراجعة البيانات وتأكيد الحفظ</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Project & Client Summary Card -->
              <div class="p-6 bg-sf-bg/40 border border-sf-border/60 rounded-2xl space-y-4">
                <h4 class="text-sm font-black text-sf-primary uppercase tracking-wider border-b border-sf-border/20 pb-2">بيانات العقد والوحدة</h4>
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span class="text-sf-muted font-bold block">اسم المشروع</span>
                    <span class="text-sf-text font-black text-sm">{{ form.get('projectName')?.value }}</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold block">العميل</span>
                    <span class="text-sf-text font-black text-sm">{{ getClientName(form.get('clientId')?.value) }}</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold block">الوحدة</span>
                    <span class="text-sf-text font-black text-sm">{{ form.get('unitType')?.value }} #{{ form.get('unitNumber')?.value }}</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold block">سعر التعاقد</span>
                    <span class="text-sf-success font-black text-sm">{{ form.get('unitValue')?.value | currencyEgp }}</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold block">تاريخ التعاقد</span>
                    <span class="text-sf-text font-mono text-sm">{{ form.get('contractDate')?.value }}</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold block">مصدر المبيعة</span>
                    <span class="text-sf-text font-black text-sm">{{ getSourceName(form.get('source')?.value) }}</span>
                  </div>
                </div>
              </div>

              <!-- Financial Calculations Summary Card -->
              <div class="p-6 bg-sf-bg/40 border border-sf-border/60 rounded-2xl space-y-4">
                <h4 class="text-sm font-black text-sf-success uppercase tracking-wider border-b border-sf-border/20 pb-2">التفصيل المالي والضرائب</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-sf-muted font-bold text-xs block">نسبة عمولة العقد</span>
                    <span class="text-sf-text font-black text-base">{{ form.get('contractCommissionPercentage')?.value }}%</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold text-xs block">تحصيل المطور</span>
                    <span class="text-sf-text font-black text-base">{{ form.get('developerCollectionPercentage')?.value }}%</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold text-xs block">النسبة المحصلة الأولى</span>
                    <span class="text-sf-text font-black text-base">{{ form.get('collectedCommissionPercentage')?.value }}%</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold text-xs block">نسبة القيمة المضافة</span>
                    <span class="text-sf-text font-black text-base">{{ form.get('vatPercentage')?.value }}%</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold text-xs block">قيمة ضريبة القيمة المضافة</span>
                    <span class="text-neon-pink font-black text-base font-mono">{{ (form.get('grossCommissionWithVAT')?.value - form.get('netRevenue')?.value) | currencyEgp }}</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold text-xs block">نسبة الخصم من المنبع</span>
                    <span class="text-sf-text font-black text-base">{{ form.get('withholdingTaxPercentage')?.value }}%</span>
                  </div>
                  <div>
                    <span class="text-sf-muted font-bold text-xs block">قيمة ضريبة الخصم</span>
                    <span class="text-sf-danger font-black text-base font-mono">{{ form.get('withholdingTax')?.value | currencyEgp }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Big Financial Highlights -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div class="p-4 bg-sf-primary/5 border border-sf-primary/20 rounded-2xl text-center">
                <span class="text-sm font-black text-sf-muted block">العمولة شاملة VAT</span>
                <span class="text-xl font-black font-mono text-sf-text block mt-1">{{ form.get('grossCommissionWithVAT')?.value | currencyEgp }}</span>
              </div>
              <div class="p-4 bg-sf-info/5 border border-sf-info/20 rounded-2xl text-center">
                <span class="text-sm font-black text-sf-muted block">صافي الإيراد (قبل الضريبة)</span>
                <span class="text-xl font-black font-mono text-sf-primary block mt-1">{{ form.get('netRevenue')?.value | currencyEgp }}</span>
              </div>
              <div class="p-4 bg-sf-success/5 border border-sf-success/20 rounded-2xl text-center shadow-md">
                <span class="text-sm font-black text-sf-success block">مبلغ الفاتورة النهائي (مبلغ الشيك)</span>
                <span class="text-3xl font-black font-mono text-sf-success block mt-1 shadow-glow-green py-1 bg-sf-success/5 rounded-xl">{{ form.get('invoiceAmount')?.value | currencyEgp }}</span>
              </div>
            </div>

            <!-- Assigned Sellers Summary List -->
            <div class="p-6 bg-sf-bg/40 border border-sf-border/60 rounded-2xl space-y-3 mt-6">
              <h4 class="text-sm font-black text-sf-secondary uppercase tracking-wider border-b border-sf-border/20 pb-2">فريق المبيعات المستحقين للعمولات</h4>
              <div class="space-y-2">
                @for (s of sellers.value; track $index; let i = $index) {
                  @if (s.employeeId) {
                    <div class="flex justify-between items-center text-xs p-3 bg-sf-surface border border-sf-border/30 rounded-xl">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full"
                              [class.bg-sf-primary]="i === 0"
                              [class.bg-sf-secondary]="i === 1"
                              [class.bg-sf-success]="i === 2"
                              [class.bg-sf-info]="i === 3"></span>
                        <span class="font-bold text-sf-text">{{ getEmployeeName(s.employeeId) }}</span>
                      </div>
                      <div class="flex gap-4 font-mono">
                        <span class="text-sf-muted">النسبة: <strong class="text-sf-text">{{ s.sharePercentage }}%</strong></span>
                        <span class="text-sf-muted">قيمة الاستحقاق: <strong class="text-sf-success">{{ (form.get('invoiceAmount')?.value || 0) * (s.sharePercentage / 100) | currencyEgp }}</strong></span>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>

            <!-- Final Readiness Check banner -->
            @if (form.valid && sellerTotalShare() === 100) {
              <div class="p-4 bg-sf-success/10 border border-sf-success/20 rounded-2xl text-sf-success text-xs font-bold flex items-center gap-3 mt-6">
                <ng-icon name="heroCheck" class="text-lg"></ng-icon>
                <span>كل البيانات مدخلة بشكل صحيح ومكتملة وجاهزة للحفظ والترحيل إلى الدفاتر المحاسبية.</span>
              </div>
            } @else {
              <div class="p-4 bg-sf-error/10 border border-sf-error/20 rounded-2xl text-sf-error text-xs font-bold flex items-center gap-3 mt-6">
                <ng-icon name="heroExclamationCircle" class="text-lg"></ng-icon>
                <span>تنبيه: هناك بعض البيانات غير المكتملة أو الخاطئة في الخطوات السابقة، يرجى العودة وتعديلها.</span>
              </div>
            }
          </div>
        </div>

        <!-- Stepper Bottom Navigation Controls -->
        <div class="flex justify-between items-center pt-6 border-t border-sf-border/30">
          <!-- Previous Button -->
          <button type="button" 
                  *ngIf="currentStep() > 1" 
                  (click)="prevStep()" 
                  class="flex items-center gap-2 px-6 py-3 bg-sf-surface hover:bg-sf-surface/80 border border-sf-border text-sf-text font-bold rounded-2xl transition-all">
            <ng-icon name="heroChevronRight" class="text-sm"></ng-icon>
            <span>السابق</span>
          </button>
          <div *ngIf="currentStep() === 1"></div>

          <!-- Next Button or Submit -->
          <button type="button" 
                  *ngIf="currentStep() < 4" 
                  (click)="nextStep()" 
                  [disabled]="!isStepValid(currentStep())"
                  class="flex items-center gap-2 px-8 py-3 bg-sf-primary text-white font-bold rounded-2xl shadow-glow-purple hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all">
            <span>التالي</span>
            <ng-icon name="heroChevronLeft" class="text-sm"></ng-icon>
          </button>

          <button type="button" 
                  *ngIf="currentStep() === 4" 
                  (click)="submit()" 
                  [disabled]="isSubmitting() || form.invalid"
                  class="flex items-center gap-2 px-10 py-3 bg-sf-success text-white font-bold rounded-2xl shadow-glow-profit hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all">
            @if (isSubmitting()) {
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            } @else {
              <ng-icon name="heroCheck" class="text-sm"></ng-icon>
            }
            <span>تأكيد وحفظ المبيعة النهائية</span>
          </button>
        </div>

      </form>

      <ng-template #skeleton>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <!-- Main Form Skeleton -->
          <div class="lg:col-span-2 space-y-8">
            <div class="glass-card p-8 rounded-3xl border border-sf-border/40 space-y-6">
              <!-- Section Header -->
              <div class="flex items-center gap-3">
                <div class="w-2 h-6 bg-sf-primary/20 rounded-full"></div>
                <div class="h-4 bg-sf-muted/10 rounded-full w-48"></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div class="space-y-2">
                  <div class="h-3 bg-sf-muted/10 rounded-full w-24"></div>
                  <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-3 bg-sf-muted/10 rounded-full w-16"></div>
                  <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                  <div class="h-3 bg-sf-muted/10 rounded-full w-16"></div>
                  <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-3 bg-sf-muted/10 rounded-full w-20"></div>
                  <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-3 bg-sf-muted/10 rounded-full w-24"></div>
                  <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
                </div>
              </div>
            </div>

            <div class="glass-card p-8 rounded-3xl border border-sf-border/40 space-y-6">
              <div class="flex items-center gap-3">
                <div class="w-2 h-6 bg-sf-secondary/20 rounded-full"></div>
                <div class="h-4 bg-sf-muted/10 rounded-full w-40"></div>
              </div>
              <div class="h-24 bg-sf-muted/5 rounded-2xl w-full"></div>
              <div class="space-y-4">
                <div class="flex items-end gap-4 p-4 bg-sf-bg/30 rounded-2xl border border-sf-border/30">
                  <div class="flex-1 space-y-2">
                    <div class="h-3 bg-sf-muted/10 rounded-full w-20"></div>
                    <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
                  </div>
                  <div class="w-32 space-y-2">
                    <div class="h-3 bg-sf-muted/10 rounded-full w-12"></div>
                    <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar Skeleton -->
          <div class="glass-card p-8 rounded-3xl border border-sf-border/40 space-y-6 h-[500px]">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/20">
              <div class="w-2 h-6 bg-sf-info/20 rounded-full"></div>
              <div class="h-4 bg-sf-muted/10 rounded-full w-32"></div>
            </div>
            <div class="space-y-6">
              <div class="space-y-2">
                <div class="h-3 bg-sf-muted/10 rounded-full w-24"></div>
                <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
              </div>
              <div class="space-y-2">
                <div class="h-3 bg-sf-muted/10 rounded-full w-28"></div>
                <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
              </div>
              <div class="space-y-2">
                <div class="h-3 bg-sf-muted/10 rounded-full w-32"></div>
                <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
              </div>
              <div class="space-y-2">
                <div class="h-3 bg-sf-muted/10 rounded-full w-20"></div>
                <div class="h-10 bg-sf-muted/5 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- Quick Create Client Modal -->
      @if (showQuickClientModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sf-bg/60 backdrop-blur-md animate-fade-in">
          <div class="glass-card max-w-md w-full p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 relative animate-scale-up" [formGroup]="quickClientForm">
            <button type="button" (click)="closeQuickClientModal()" class="absolute top-6 left-6 p-1.5 hover:bg-sf-surface rounded-lg text-sf-muted hover:text-sf-text transition-colors">
              <ng-icon name="heroXMark" class="text-lg"></ng-icon>
            </button>

            <div class="space-y-1 text-right">
              <h3 class="text-lg font-display font-bold text-sf-text">تسجيل عميل جديد وسريع</h3>
              <p class="text-xs text-sf-muted">أدخل بيانات العميل الأساسية لحفظه واختياره فوراً</p>
            </div>

            <div class="space-y-4 text-right">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-sf-muted uppercase tracking-widest mr-1">الاسم الكامل *</label>
                <app-input formControlName="name" placeholder="مثال: أحمد زيدان"
                           [hasError]="quickClientInvalid('name')"
                           errorMessage="الاسم مطلوب"></app-input>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-sf-muted uppercase tracking-widest mr-1">رقم الهاتف *</label>
                <app-input formControlName="phone" placeholder="مثال: 01515124909"
                           [hasError]="quickClientInvalid('phone')"
                           errorMessage="رقم الهاتف مطلوب"></app-input>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-sf-muted uppercase tracking-widest mr-1">البريد الإلكتروني</label>
                <app-input formControlName="email" placeholder="example@domain.com"></app-input>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-sf-muted uppercase tracking-widest mr-1">الشركة</label>
                <app-input formControlName="company" placeholder="مثال: Fair Direction"></app-input>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="button" (click)="closeQuickClientModal()" class="px-4 py-2 text-xs font-bold text-sf-muted hover:text-sf-text transition-colors uppercase">إلغاء</button>
              <button type="button" (click)="submitQuickClient()" class="bg-sf-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-glow-purple flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                <ng-icon name="heroCheck"></ng-icon>
                <span>تسجيل واختيار</span>
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scale-up { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  `]
})
export class SaleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private saleService = inject(SaleService);
  private clientService = inject(ClientService);
  private employeeService = inject(EmployeeService);
  private settingService = inject(SettingService);
  private toastService = inject(ToastService);
  private celebrationService = inject(CelebrationService);

  currentStep = signal(1);
  saleId: string | null = null;
  form!: FormGroup;
  quickClientForm!: FormGroup;
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  showQuickClientModal = signal(false);
  
  clients = signal<any[]>([]);
  employees = signal<any[]>([]);
  sources = signal<any[]>([]);
  collections = signal<any[]>([]);
  taxes = signal<any[]>([]);

  private isCalculating = false;

  ngOnInit() {
    this.initForm();
    this.loadData();
    this.checkEditMode();
    this.setupFinancialCalculations();
  }

  private checkEditMode() {
    this.saleId = this.route.snapshot.paramMap.get('id');
    if (this.saleId) {
      this.isEditMode.set(true);
      this.isLoading.set(true);
      this.saleService.getSale(this.saleId).subscribe({
        next: (res) => {
          const sale = res.data;
          this.sellers.clear();
          
          if (sale.sellers && sale.sellers.length > 0) {
            sale.sellers.forEach(s => {
              // Extract ID if populated
              const empId = (s.employeeId as any)?._id || s.employeeId;
              this.sellers.push(this.fb.group({
                employeeId: [empId, Validators.required],
                sharePercentage: [s.sharePercentage, [Validators.required, Validators.min(1), Validators.max(100)]]
              }));
            });
          }

          this.form.patchValue({
            projectName: sale.projectName,
            clientId: (sale.clientId as any)?._id || sale.clientId,
            unitNumber: sale.unitNumber,
            unitType: sale.unitType,
            unitValue: sale.unitValue,
            contractDate: sale.contractDate ? new Date(sale.contractDate).toISOString().split('T')[0] : '',
            source: sale.source,
            developerCollectionPercentage: sale.developerCollectionPercentage,
            contractCommissionPercentage: sale.contractCommissionPercentage,
            collectedCommissionPercentage: sale.collectedCommissionPercentage,
            vatPercentage: sale.vatPercentage || 14,
            withholdingTaxPercentage: sale.withholdingTaxPercentage || 5,
            grossCommissionWithVAT: sale.grossCommissionWithVAT,
            netRevenue: sale.netRevenue,
            withholdingTax: sale.withholdingTax,
            invoiceAmount: sale.invoiceAmount,
            invoiceStatus: sale.invoiceStatus,
            status: sale.status || 'draft',
          }, { emitEvent: false });
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.goBack();
        }
      });
    }
  }

  private initForm() {
    this.form = this.fb.group({
      projectName: ['', [Validators.required]],
      clientId: [null, [Validators.required]],
      unitNumber: ['', [Validators.required]],
      unitType: ['', [Validators.required]],
      unitValue: [null, [Validators.required, Validators.min(0)]],
      contractDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      source: ['Private', [Validators.required]],
      
      developerCollectionPercentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      contractCommissionPercentage: [2.5, [Validators.required, Validators.min(0)]],
      collectedCommissionPercentage: [2.5, [Validators.required, Validators.min(0)]],
      
      vatPercentage: [14, [Validators.required, Validators.min(0), Validators.max(100)]],
      withholdingTaxPercentage: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
      
      grossCommissionWithVAT: [0, [Validators.required, Validators.min(0)]],
      netRevenue: [0, [Validators.required, Validators.min(0)]],
      withholdingTax: [0, [Validators.required, Validators.min(0)]],
      invoiceAmount: [0, [Validators.required, Validators.min(0)]],

      invoiceStatus: ['Not Issued'],
      status: ['confirmed', [Validators.required]],
      sellers: this.fb.array([])
    });

    this.quickClientForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['20', [Validators.required]],
      email: [''],
      company: ['']
    });

    // Add initial seller only if not in edit mode (edit mode will load its own sellers)
    if (!this.saleId) {
      this.addSeller();
    }
  }

  private loadData() {
    this.clientService.getClients().subscribe(res => this.clients.set(res.data));
    this.employeeService.getEmployees().subscribe(res => this.employees.set(res.data));
    this.settingService.getSettingsByType('saleSource').subscribe(res => this.sources.set(res.data));
    this.settingService.getSettingsByType('collectionPercentage').subscribe(res => this.collections.set(res.data));
    this.settingService.getSettingsByType('tax').subscribe(res => this.taxes.set(res.data));
  }

  get sellers() { return this.form.get('sellers') as FormArray; }

  addSeller() {
    const sellerForm = this.fb.group({
      employeeId: [null, Validators.required],
      sharePercentage: [this.sellers.length === 0 ? 100 : 0, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
    this.sellers.push(sellerForm);
  }

  removeSeller(index: number) {
    this.sellers.removeAt(index);
  }

  sellerTotalShare() {
    return this.sellers.value.reduce((sum: number, s: any) => sum + (Number(s.sharePercentage) || 0), 0);
  }

  getEmployeeName(id: string): string {
    const emp = this.employees().find(e => e._id === id);
    return emp ? emp.name : 'البائع...';
  }

  isTaxChecked(tax: any): boolean {
    const label = tax.label || '';
    const isDeduct = label.includes('خصم') || label.includes('منبع') || label.includes('أرباح');
    if (isDeduct) {
      return Number(this.form.get('withholdingTaxPercentage')?.value) === Number(tax.value);
    } else {
      return Number(this.form.get('vatPercentage')?.value) === Number(tax.value);
    }
  }

  toggleTax(tax: any) {
    const label = tax.label || '';
    const isDeduct = label.includes('خصم') || label.includes('منبع') || label.includes('أرباح');
    const targetControl = isDeduct ? 'withholdingTaxPercentage' : 'vatPercentage';
    const currentValue = Number(this.form.get(targetControl)?.value);
    const taxValue = Number(tax.value);

    if (currentValue === taxValue) {
      this.form.get(targetControl)?.setValue(0);
    } else {
      this.form.get(targetControl)?.setValue(taxValue);
    }
  }

  calculatedGross() {
    return this.form?.get('grossCommissionWithVAT')?.value || 0;
  }

  calculatedNet() {
    return this.form?.get('netRevenue')?.value || 0;
  }

  private round2(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  private setupFinancialCalculations() {
    const fields = [
      'unitValue',
      'contractCommissionPercentage',
      'developerCollectionPercentage',
      'collectedCommissionPercentage',
      'vatPercentage',
      'withholdingTaxPercentage',
      'grossCommissionWithVAT',
      'netRevenue',
      'withholdingTax',
      'invoiceAmount'
    ];

    fields.forEach(field => {
      this.form.get(field)?.valueChanges.subscribe(val => {
        if (this.isCalculating) return;
        this.isCalculating = true;
        this.recalculateFrom(field, val);
        this.isCalculating = false;
      });
    });
  }

  private recalculateFrom(changedField: string, val: any) {
    const unitValue = Number(this.form.get('unitValue')?.value) || 0;
    const contractCommissionPercentage = Number(this.form.get('contractCommissionPercentage')?.value) || 0;
    const developerCollectionPercentage = Number(this.form.get('developerCollectionPercentage')?.value) || 0;
    const vatPercentage = Number(this.form.get('vatPercentage')?.value) || 0;
    const withholdingTaxPercentage = Number(this.form.get('withholdingTaxPercentage')?.value) || 0;
    
    let collectedCommissionPercentage = Number(this.form.get('collectedCommissionPercentage')?.value) || 0;
    let grossCommissionWithVAT = Number(this.form.get('grossCommissionWithVAT')?.value) || 0;
    let netRevenue = Number(this.form.get('netRevenue')?.value) || 0;
    let withholdingTax = Number(this.form.get('withholdingTax')?.value) || 0;
    let invoiceAmount = Number(this.form.get('invoiceAmount')?.value) || 0;

    if (
      changedField === 'unitValue' || 
      changedField === 'contractCommissionPercentage' || 
      changedField === 'developerCollectionPercentage'
    ) {
      collectedCommissionPercentage = this.round2(contractCommissionPercentage * (developerCollectionPercentage / 100));
      grossCommissionWithVAT = this.round2((collectedCommissionPercentage / 100) * unitValue);
      netRevenue = this.round2(grossCommissionWithVAT / (1 + (vatPercentage / 100)));
      withholdingTax = this.round2(netRevenue * (withholdingTaxPercentage / 100));
      invoiceAmount = this.round2(grossCommissionWithVAT - withholdingTax);
    } 
    else if (changedField === 'collectedCommissionPercentage') {
      collectedCommissionPercentage = Number(val) || 0;
      grossCommissionWithVAT = this.round2((collectedCommissionPercentage / 100) * unitValue);
      netRevenue = this.round2(grossCommissionWithVAT / (1 + (vatPercentage / 100)));
      withholdingTax = this.round2(netRevenue * (withholdingTaxPercentage / 100));
      invoiceAmount = this.round2(grossCommissionWithVAT - withholdingTax);
    } 
    else if (changedField === 'vatPercentage') {
      const vat = Number(val) || 0;
      netRevenue = this.round2(grossCommissionWithVAT / (1 + (vat / 100)));
      withholdingTax = this.round2(netRevenue * (withholdingTaxPercentage / 100));
      invoiceAmount = this.round2(grossCommissionWithVAT - withholdingTax);
    } 
    else if (changedField === 'withholdingTaxPercentage') {
      const wht = Number(val) || 0;
      withholdingTax = this.round2(netRevenue * (wht / 100));
      invoiceAmount = this.round2(grossCommissionWithVAT - withholdingTax);
    } 
    else if (changedField === 'grossCommissionWithVAT') {
      grossCommissionWithVAT = Number(val) || 0;
      netRevenue = this.round2(grossCommissionWithVAT / (1 + (vatPercentage / 100)));
      withholdingTax = this.round2(netRevenue * (withholdingTaxPercentage / 100));
      invoiceAmount = this.round2(grossCommissionWithVAT - withholdingTax);
    } 
    else if (changedField === 'netRevenue') {
      netRevenue = Number(val) || 0;
      grossCommissionWithVAT = this.round2(netRevenue * (1 + (vatPercentage / 100)));
      withholdingTax = this.round2(netRevenue * (withholdingTaxPercentage / 100));
      invoiceAmount = this.round2(grossCommissionWithVAT - withholdingTax);
    } 
    else if (changedField === 'withholdingTax') {
      withholdingTax = Number(val) || 0;
      invoiceAmount = this.round2(grossCommissionWithVAT - withholdingTax);
    } 
    else if (changedField === 'invoiceAmount') {
      invoiceAmount = Number(val) || 0;
      withholdingTax = this.round2(grossCommissionWithVAT - invoiceAmount);
    }

    this.form.patchValue({
      collectedCommissionPercentage,
      grossCommissionWithVAT,
      netRevenue,
      withholdingTax,
      invoiceAmount
    }, { emitEvent: false });
  }

  quickClientInvalid(controlName: string): boolean {
    const control = this.quickClientForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openQuickClientModal() {
    this.quickClientForm.reset({
      name: '',
      phone: '20',
      email: '',
      company: ''
    });
    this.showQuickClientModal.set(true);
  }

  closeQuickClientModal() {
    this.showQuickClientModal.set(false);
  }

  submitQuickClient() {
    if (this.quickClientForm.invalid) {
      this.quickClientForm.markAllAsTouched();
      return;
    }

    this.clientService.createClient(this.quickClientForm.value).subscribe({
      next: (res) => {
        const newClient = res.data;
        this.clients.set([...this.clients(), newClient]);
        this.form.patchValue({ clientId: newClient._id });
        this.closeQuickClientModal();
        this.toastService.showSuccess(`تم تسجيل العميل السريع ${newClient.name} واختياره بنجاح!`);
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || 'حدث خطأ أثناء تسجيل العميل السريع.');
      }
    });
  }

  setStep(step: number) {
    if (step < 1 || step > 4) return;
    // Ensure all steps prior to target are valid
    for (let i = 1; i < step; i++) {
      if (!this.isStepValid(i)) {
        this.toastService.showWarning(`الرجاء إكمال البيانات المطلوبة في الخطوة ${i} أولاً.`);
        return;
      }
    }
    this.currentStep.set(step);
  }

  nextStep() {
    const current = this.currentStep();
    if (current < 4 && this.isStepValid(current)) {
      this.currentStep.set(current + 1);
    } else {
      this.toastService.showWarning('يرجى التحقق من ملء كافة الحقول المطلوبة بشكل صحيح قبل الانتقال للخطوة التالية.');
    }
  }

  prevStep() {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
    }
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      const s1Fields = ['projectName', 'clientId', 'unitNumber', 'unitType', 'unitValue', 'contractDate', 'source', 'status'];
      return s1Fields.every(field => this.form.get(field)?.valid);
    }
    if (step === 2) {
      return this.sellers.valid && this.sellerTotalShare() === 100;
    }
    if (step === 3) {
      const s3Fields = ['developerCollectionPercentage', 'contractCommissionPercentage', 'collectedCommissionPercentage', 'vatPercentage', 'withholdingTaxPercentage', 'grossCommissionWithVAT', 'netRevenue', 'withholdingTax', 'invoiceAmount'];
      return s3Fields.every(field => this.form.get(field)?.valid);
    }
    return this.form.valid;
  }

  getClientName(id: string): string {
    const client = this.clients().find(c => c._id === id);
    return client ? client.name : 'غير محدد';
  }

  getSourceName(sourceVal: string): string {
    const src = this.sources().find(s => s.value === sourceVal);
    return src ? src.label : sourceVal || 'غير محدد';
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack() {
    this.router.navigate(['/sales']);
  }

  submit() {
    // 1. Pre-unlock AudioContext synchronously during user click gesture to bypass Chrome security policies
    this.celebrationService.unlockAudio();

    if (this.form.invalid || this.sellerTotalShare() !== 100) {
      this.form.markAllAsTouched();
      if (this.sellerTotalShare() !== 100) {
        this.toastService.showWarning('تنبيه: يجب أن يكون مجموع نسب المشاركة للبائعين مساويًا لـ 100% تمامًا.');
      } else {
        this.toastService.showWarning('تنبيه: يرجى التحقق من ملء جميع الحقول المطلوبة بشكل صحيح قبل الحفظ.');
      }
      return;
    }

    this.isSubmitting.set(true);
    const obs = this.isEditMode()
      ? this.saleService.updateSale(this.saleId!, this.form.value)
      : this.saleService.createSale(this.form.value);

    obs.subscribe({
      next: () => {
        this.toastService.showSuccess(this.isEditMode() ? 'تم تحديث المبيعة وتعديل الحسابات بنجاح!' : 'تم حفظ المبيعة وتسوية العمولات بنجاح!');
        
        if (!this.isEditMode()) {
          // Trigger the gorgeous confetti explosion & synthesized success sound
          this.celebrationService.celebrate();
        }

        // Delay route navigation by 800ms so the user sees and hears the celebration on the current page before transition
        setTimeout(() => {
          this.router.navigate(['/sales']);
        }, 800);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          // Show a general error message
          this.toastService.showError('حدث خطأ في التحقق من البيانات. يرجى مراجعة الحقول التالية:');
          
          // Display each field error with its friendly Arabic label and translated rule
          err.error.errors.forEach((e: any) => {
            const friendlyField = this.translateField(e.field);
            let msg = e.message || '';
            
            // Translate common validation message keywords to friendly Arabic
            if (msg.includes('is required') || msg.includes('must not be empty') || msg.includes('required')) {
              msg = 'هذا الحقل مطلوب ولا يمكن تركه فارغاً';
            } else if (msg.includes('must be a number') || msg.includes('must be a float') || msg.includes('must be a double')) {
              msg = 'يجب إدخال قيمة رقمية صحيحة';
            } else if (msg.includes('must be greater than or equal to')) {
              const val = msg.match(/[-+]?[0-9]*\.?[0-9]+/)?.[0] || '0';
              msg = `يجب أن تكون القيمة أكبر من أو تساوي ${val}`;
            } else if (msg.includes('must be less than or equal to')) {
              const val = msg.match(/[-+]?[0-9]*\.?[0-9]+/)?.[0] || '100';
              msg = `يجب أن تكون القيمة أقل من أو تساوي ${val}`;
            }
            
            this.toastService.showWarning(`⚠️ حقل [ ${friendlyField} ]: ${msg}`);
          });
        } else {
          this.toastService.showError(err.error?.message || 'حدث خطأ أثناء حفظ المبيعة. يرجى التأكد من البيانات والمحاولة مرة أخرى.');
        }
      }
    });
  }

  translateField(field: string): string {
    if (!field) return 'حقل غير معروف';
    
    // Check nested array properties
    if (field.includes('employeeId')) return 'الموظف في فريق المبيعات';
    if (field.includes('sharePercentage')) return 'نسبة مشاركة الموظف';
    if (field.startsWith('sellers')) return 'فريق المبيعات';

    const fieldTranslations: { [key: string]: string } = {
      projectName: 'اسم المشروع',
      clientId: 'العميل',
      unitNumber: 'رقم الوحدة',
      unitType: 'نوع الوحدة',
      unitValue: 'سعر التعاقد',
      contractDate: 'تاريخ التعاقد',
      source: 'مصدر المبيعة',
      developerCollectionPercentage: 'نسبة تحصيل المطور',
      contractCommissionPercentage: 'نسبة عمولة العقد',
      collectedCommissionPercentage: 'النسبة المحصلة الأولى',
      vatPercentage: 'نسبة القيمة المضافة',
      withholdingTaxPercentage: 'نسبة الخصم من المنبع',
      grossCommissionWithVAT: 'العمولة شاملة القيمة المضافة',
      netRevenue: 'صافي الإيراد قبل الضريبة',
      withholdingTax: 'قيمة ضريبة الخصم',
      invoiceAmount: 'مبلغ الفاتورة النهائي',
      status: 'حالة المبيعة',
      sellers: 'فريق المبيعات'
    };

    return fieldTranslations[field] || field;
  }
}
