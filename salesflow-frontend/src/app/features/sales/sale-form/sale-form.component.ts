import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SaleService } from '@core/services/sale.service';
import { ClientService } from '@core/services/client.service';
import { EmployeeService } from '@core/services/employee.service';
import { SettingService } from '@core/services/setting.service';
import { InputComponent } from '@shared/components/input/input.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronLeft, heroCheck, heroUserPlus, heroTrash, heroExclamationCircle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, NgIconComponent, CurrencyEgpPipe],
  providers: [
    provideIcons({ heroChevronLeft, heroCheck, heroUserPlus, heroTrash, heroExclamationCircle })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 relative">
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
                  [disabled]="isSubmitting()"
                  [class.opacity-50]="form.invalid || sellerTotalShare() !== 100"
                  class="bg-sf-primary text-white px-8 py-3 rounded-2xl font-bold shadow-glow-purple flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
            @if (isSubmitting()) {
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            } @else {
              <ng-icon name="heroCheck"></ng-icon>
            }
            <span>حفظ المبيعة</span>
          </button>
        </div>
      </header>

      <form *ngIf="!isLoading(); else skeleton" [formGroup]="form" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Client & Project Section -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-primary rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">تفاصيل المشروع والعميل</h3>
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
                <select formControlName="clientId" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all h-[42px]">
                  <option [value]="null">اختر العميل</option>
                  @for (client of clients(); track client._id) {
                    <option [value]="client._id">{{ client.name }}</option>
                  }
                </select>
                <p class="text-[10px] text-sf-muted mr-1">يجب أن يكون العميل مسجلاً مسبقاً في النظام</p>
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
                <app-input type="number" formControlName="unitValue" placeholder="0.00"
                           [hasError]="isInvalid('unitValue')"
                           errorMessage="سعر التعاقد مطلوب"
                           hint="إجمالي سعر الوحدة في العقد"></app-input>
              </div>
            </div>
          </section>

          <!-- Sellers Section -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-sf-border/30">
              <div class="flex items-center gap-3">
                <div class="w-2 h-6 bg-sf-secondary rounded-full"></div>
                <h3 class="text-lg font-display font-bold text-sf-text">توزيع فريق المبيعات</h3>
              </div>
              <button type="button" (click)="addSeller()" 
                      [disabled]="sellers.length >= 4"
                      class="text-xs font-black text-sf-primary uppercase tracking-widest flex items-center gap-2 hover:bg-sf-primary/10 px-3 py-1.5 rounded-lg transition-all">
                <ng-icon name="heroUserPlus"></ng-icon>
                إضافة بائع
              </button>
            </div>

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
                               hint="نسبة العمولة لهذا البائع"></app-input>
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
                <span>يجب أن يكون إجمالي النسب 100% بالضبط (الحالي: {{ sellerTotalShare() }}%)</span>
              </div>
            }
          </section>
        </div>

        <!-- Sidebar / Config -->
        <div class="space-y-8">
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 sticky top-8">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-info rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">إعدادات المبيعة</h3>
            </div>

            <div class="space-y-4">
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
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">تحصيل المطور %</label>
                <select formControlName="developerCollectionPercentage" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text focus:ring-2 focus:ring-sf-primary/50 outline-none h-[42px]">
                  @for (c of collections(); track c._id) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                </select>
                <p class="text-[10px] text-sf-muted mr-1">نسبة ما تم تحصيله من إجمالي قيمة الوحدة</p>
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

              <div class="space-y-2">
                <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">نسبة العمولة %</label>
                <app-input type="number" formControlName="contractCommissionPercentage" placeholder="0.0"
                           [hasError]="isInvalid('contractCommissionPercentage')"
                           errorMessage="النسبة مطلوبة"
                           hint="النسبة المتفق عليها مع المطور"></app-input>
              </div>
            </div>

            <!-- Summary Preview -->
            <div class="mt-8 p-6 bg-sf-primary/5 rounded-2xl border border-sf-primary/20 space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-sf-muted uppercase">إجمالي العمولة</span>
                <span class="text-sm font-black text-sf-text">{{ calculatedGross() | currencyEgp }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-sf-muted uppercase">صافي الربح (تقديري)</span>
                <span class="text-sm font-black text-sf-primary">{{ calculatedNet() | currencyEgp }}</span>
              </div>
            </div>
          </section>
        </div>
      </form>

      <!-- Bottom Action Bar (Mobile/Secondary) -->
      <div class="flex justify-end pt-8 border-t border-sf-border/30">
        <button (click)="submit()" 
                [disabled]="isSubmitting()"
                [class.opacity-50]="form.invalid || sellerTotalShare() !== 100"
                class="bg-sf-primary text-white px-12 py-4 rounded-2xl font-bold shadow-glow-purple flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
          @if (isSubmitting()) {
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          } @else {
            <ng-icon name="heroCheck" class="text-xl"></ng-icon>
          }
          <span class="text-lg">حفظ بيانات المبيعة النهائية</span>
        </button>
      </div>

      <ng-template #skeleton>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <div class="lg:col-span-2 space-y-8">
            <div class="glass-card p-8 h-64 rounded-3xl border border-sf-border skeleton"></div>
            <div class="glass-card p-8 h-96 rounded-3xl border border-sf-border skeleton"></div>
          </div>
          <div class="glass-card p-8 h-96 rounded-3xl border border-sf-border skeleton"></div>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
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

  form!: FormGroup;
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  saleId: string | null = null;
  
  clients = signal<any[]>([]);
  employees = signal<any[]>([]);
  sources = signal<any[]>([]);
  collections = signal<any[]>([]);

  ngOnInit() {
    this.initForm();
    this.loadData();
    this.checkEditMode();
    
    // Listen to changes for live calculation
    this.form.valueChanges.subscribe(() => {
      this.updateCalculations();
    });
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
            invoiceStatus: sale.invoiceStatus,
            status: sale.status || 'draft',
          });
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
      developerCollectionPercentage: [100, [Validators.required]],
      contractCommissionPercentage: [2.5, [Validators.required, Validators.min(0)]],
      invoiceStatus: ['Not Issued'],
      status: ['confirmed', [Validators.required]],
      sellers: this.fb.array([])
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
    return this.sellers.value.reduce((sum: number, s: any) => sum + (s.sharePercentage || 0), 0);
  }

  calculatedGross() {
    const val = this.form.get('unitValue')?.value || 0;
    const rate = this.form.get('contractCommissionPercentage')?.value || 0;
    const collection = (this.form.get('developerCollectionPercentage')?.value || 100) / 100;
    return val * (rate / 100) * collection;
  }

  calculatedNet() {
    return this.calculatedGross() / 1.14;
  }

  updateCalculations() {
    // Logic for updating derived fields if needed
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack() {
    this.router.navigate(['/sales']);
  }

  submit() {
    if (this.form.invalid || this.sellerTotalShare() !== 100) {
      this.form.markAllAsTouched();
      // Optional: scroll to first error or show a toast
      return;
    }

    this.isSubmitting.set(true);
    const obs = this.isEditMode()
      ? this.saleService.updateSale(this.saleId!, this.form.value)
      : this.saleService.createSale(this.form.value);

    obs.subscribe({
      next: () => this.router.navigate(['/sales']),
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'حدث خطأ أثناء حفظ المبيعة. يرجى التأكد من البيانات والمحاولة مرة أخرى.');
      }
    });
  }
}
