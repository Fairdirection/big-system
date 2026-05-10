import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClaimService } from '@core/services/claim.service';
import { ToastService } from '@core/services/toast.service';
import { Claim } from '@core/models/claim.model';
import { CelebrationService } from '@core/services/celebration.service';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { InputComponent } from '@shared/components/input/input.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroChevronRight, 
  heroCheckBadge, 
  heroDocumentText, 
  heroCalendarDays, 
  heroBanknotes,
  heroTrash,
  heroPencilSquare,
  heroCheck,
  heroXMark,
  heroExclamationTriangle,
  heroPaperAirplane,
  heroClock
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink, InputComponent],
  providers: [
    provideIcons({ 
      heroChevronRight, 
      heroCheckBadge, 
      heroDocumentText, 
      heroCalendarDays, 
      heroBanknotes,
      heroTrash,
      heroPencilSquare,
      heroCheck,
      heroXMark,
      heroExclamationTriangle,
      heroPaperAirplane,
      heroClock
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20" *ngIf="claim() as c">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sf-border/30 pb-6">
        <div class="flex items-center gap-4">
          <button [routerLink]="['/claims']" class="p-2.5 hover:bg-sf-surface rounded-2xl border border-sf-border/50 transition-colors">
            <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
          </button>
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-3xl font-display font-black text-sf-text tracking-tight">إدارة المطالبة الماليّة</h1>
              <app-badge [color]="getStatusColor(c.status)">{{ translateStatus(c.status) }}</app-badge>
            </div>
            <p class="text-sf-muted font-medium mt-1">{{ c.claimNumber }} • مبيعة مرجعية رقم {{ c.saleNumber }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end md:self-auto">
          <button (click)="printInvoice(c)" class="btn btn-secondary flex items-center gap-2 text-xs py-2.5">
            <ng-icon name="heroDocumentText"></ng-icon>
            <span>طباعة الفاتورة</span>
          </button>
          
          <button (click)="onDeleteClaim(c._id)" class="btn btn-error-outline flex items-center gap-2 text-xs py-2.5">
            <ng-icon name="heroTrash"></ng-icon>
            <span>حذف المطالبة</span>
          </button>
        </div>
      </header>

      <!-- Status Timeline -->
      <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-md">
        <h3 class="text-xs font-bold text-sf-muted uppercase tracking-widest mb-6">مسار المطالبة والتحصيل</h3>
        <div class="grid grid-cols-4 gap-4 relative">
          <!-- Progress Line -->
          <div class="absolute top-[21px] left-[12.5%] right-[12.5%] h-1 bg-sf-border rounded-full -z-10">
            <div class="h-full bg-sf-primary transition-all duration-500 rounded-full" [style.width]="getTimelineProgress(c.status)"></div>
          </div>

          <!-- Step 1: Pending -->
          <div class="flex flex-col items-center text-center">
            <div class="w-11 h-11 rounded-full flex items-center justify-center transition-all border-2"
                 [ngClass]="c.status === 'pending' ? 'bg-sf-warning text-white border-sf-warning shadow-lg shadow-sf-warning/20' : 'bg-white dark:bg-sf-surface text-sf-muted border-sf-border'">
              <ng-icon name="heroClock" class="text-lg"></ng-icon>
            </div>
            <span class="text-xs font-bold mt-2 text-sf-text">قيد الانتظار</span>
            <span class="text-[9px] text-sf-muted font-semibold mt-0.5">مطالبة مبدئية</span>
          </div>

          <!-- Step 2: Submitted -->
          <div class="flex flex-col items-center text-center">
            <div class="w-11 h-11 rounded-full flex items-center justify-center transition-all border-2"
                 [ngClass]="c.status === 'submitted' ? 'bg-sf-primary text-white border-sf-primary shadow-lg shadow-sf-primary/20' : (isPastStep(c.status, 'submitted') ? 'bg-sf-primary/10 text-sf-primary border-sf-primary' : 'bg-white dark:bg-sf-surface text-sf-muted border-sf-border')">
              <ng-icon name="heroPaperAirplane" class="text-lg"></ng-icon>
            </div>
            <span class="text-xs font-bold mt-2 text-sf-text">تم التقديم</span>
            <span class="text-[9px] text-sf-muted font-semibold mt-0.5">أرسلت للمطور</span>
          </div>

          <!-- Step 3: Disputed -->
          <div class="flex flex-col items-center text-center">
            <div class="w-11 h-11 rounded-full flex items-center justify-center transition-all border-2"
                 [ngClass]="c.status === 'disputed' ? 'bg-sf-error text-white border-sf-error shadow-lg shadow-sf-error/20' : 'bg-white dark:bg-sf-surface text-sf-muted border-sf-border'">
              <ng-icon name="heroExclamationTriangle" class="text-lg"></ng-icon>
            </div>
            <span class="text-xs font-bold mt-2 text-sf-text">منازع عليها</span>
            <span class="text-[9px] text-sf-muted font-semibold mt-0.5">ملاحظات معلقة</span>
          </div>

          <!-- Step 4: Collected -->
          <div class="flex flex-col items-center text-center">
            <div class="w-11 h-11 rounded-full flex items-center justify-center transition-all border-2"
                 [ngClass]="c.status === 'collected' ? 'bg-sf-success text-white border-sf-success shadow-lg shadow-sf-success/20' : 'bg-white dark:bg-sf-surface text-sf-muted border-sf-border'">
              <ng-icon name="heroCheckBadge" class="text-lg"></ng-icon>
            </div>
            <span class="text-xs font-bold mt-2 text-sf-text">محصلة بالكامل</span>
            <span class="text-[9px] text-sf-muted font-semibold mt-0.5">دخلت الخزينة</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Details Column -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- View/Edit Container -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl relative overflow-hidden">
            
            <!-- Standard View Mode -->
            <div *ngIf="!isEditing(); else editModeTpl" class="space-y-8 animate-fade-in">
              <div class="flex justify-between items-center border-b border-sf-border/30 pb-4">
                <h3 class="text-lg font-bold text-sf-text">بيانات المطالبة الحالية</h3>
                <button (click)="enableEditMode(c)" class="btn btn-secondary flex items-center gap-2 text-xs py-1.5 px-3">
                  <ng-icon name="heroPencilSquare"></ng-icon>
                  <span>تعديل البيانات</span>
                </button>
              </div>
              
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">العميل والمطور</span>
                  <p class="text-sm font-bold text-sf-text">{{ c.clientName || 'غير محدد' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">المشروع والوحدة</span>
                  <p class="text-sm font-bold text-sf-text">{{ c.projectName }} - وحدة رقم {{ c.unitNumber }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">تاريخ التحصيل المتوقع</span>
                  <p class="text-sm font-semibold text-sf-text">{{ c.expectedCollectionDate ? (c.expectedCollectionDate | date:'longDate') : 'غير محدد' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">موقف الفاتورة الضريبية</span>
                  <p class="text-sm font-semibold text-sf-text bg-sf-surface/80 px-3 py-1 rounded-xl border border-sf-border w-fit">{{ c.invoiceStatus || 'غير محدد' }}</p>
                </div>
              </div>

              <!-- Financial Highlights -->
              <div class="mt-8 p-5 bg-sf-primary/5 border border-sf-primary/20 rounded-2xl flex justify-between items-center">
                <div>
                  <span class="text-xs font-bold text-sf-primary uppercase tracking-widest block mb-1">قيمة العمولة المستحقة للتحصيل</span>
                  <span class="text-3xl font-display font-black text-sf-primary">{{ c.commissionDue | currencyEgp }}</span>
                </div>
                <div class="w-12 h-12 rounded-full bg-sf-primary/10 flex items-center justify-center border border-sf-primary/20 text-sf-primary text-xl">
                  <ng-icon name="heroBanknotes"></ng-icon>
                </div>
              </div>

              <!-- Extra Notes -->
              <div *ngIf="c.notes" class="pt-6 border-t border-sf-border/30">
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-2">ملاحظات ومعلومات المعاملة</span>
                <p class="text-sm font-semibold text-sf-text bg-sf-surface p-4 rounded-2xl border border-sf-border whitespace-pre-line">{{ c.notes }}</p>
              </div>
            </div>

            <!-- Inline Edit Mode Template -->
            <ng-template #editModeTpl>
              <form [formGroup]="editForm" (ngSubmit)="onSaveClaim(c._id)" class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-sf-border/30 pb-4">
                  <h3 class="text-lg font-bold text-sf-text flex items-center gap-2">
                    <ng-icon name="heroPencilSquare" class="text-sf-primary"></ng-icon>
                    <span>تعديل معالم المطالبة</span>
                  </h3>
                  <div class="flex gap-2">
                    <button type="button" (click)="isEditing.set(false)" class="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <ng-icon name="heroXMark"></ng-icon>
                      <span>إلغاء</span>
                    </button>
                    <button type="submit" [disabled]="editForm.invalid || submitting()" class="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <ng-icon name="heroCheck"></ng-icon>
                      <span>حفظ التعديلات</span>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Commission Due -->
                  <div class="space-y-2">
                    <app-input type="number" formControlName="commissionDue" label="العمولة المستحقة (EGP)" [isAccounting]="true"></app-input>
                  </div>

                  <!-- Expected Collection Date -->
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">تاريخ التحصيل المتوقع</label>
                    <input type="date" formControlName="expectedCollectionDate" 
                           class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/30 transition-all outline-none">
                  </div>

                  <!-- Invoice Status -->
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">موقف الفاتورة الضريبية</label>
                    <select formControlName="invoiceStatus" 
                            class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/30 transition-all outline-none">
                      <option value="فاتورة عادية ضريبية">فاتورة عادية ضريبية</option>
                      <option value="فاتورة عادية غير ضريبية">فاتورة عادية غير ضريبية</option>
                      <option value="فاتورة إلكترونية ضريبية">فاتورة إلكترونية ضريبية</option>
                    </select>
                  </div>

                  <!-- Claim Status -->
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">حالة المطالبة الحالية</label>
                    <select formControlName="status" 
                            class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-sf-primary/30 transition-all outline-none">
                      <option value="pending">قيد الانتظار (Pending)</option>
                      <option value="submitted">تم التقديم للمطور (Submitted)</option>
                      <option value="disputed">منازع عليها (Disputed)</option>
                      <option value="collected">محصلة بالكامل (Collected)</option>
                    </select>
                  </div>
                </div>

                <!-- Notes -->
                <div class="space-y-2">
                  <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">ملاحظات ومعلومات المعاملة</label>
                  <textarea formControlName="notes" rows="4" placeholder="اكتب أي ملاحظات إدارية، رقم الفاتورة أو تفاصيل التواصل..."
                            class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/30 transition-all outline-none resize-none"></textarea>
                </div>
              </form>
            </ng-template>
          </section>

          <!-- Fully Collected Receipt Details -->
          <section *ngIf="c.status === 'collected'" class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl bg-sf-success/5 space-y-6">
            <h3 class="text-lg font-bold text-sf-success flex items-center gap-2">
              <ng-icon name="heroCheckBadge"></ng-icon>
              <span>تم تحصيل وإغلاق المطالبة بالكامل</span>
            </h3>
            <div class="grid grid-cols-2 gap-6">
              <div>
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">تاريخ التحصيل الفعلي</span>
                <p class="text-sm font-bold text-sf-text">{{ c.collectionDate | date:'longDate' }}</p>
              </div>
              <div>
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">المبلغ المحصل الفعلي</span>
                <p class="text-sm font-black text-sf-success">{{ c.collectedAmount | currencyEgp }}</p>
              </div>
            </div>
            <div *ngIf="c.notes" class="pt-4 border-t border-sf-success/10">
              <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">مستندات التحصيل المرفقة</span>
              <p class="text-sm font-semibold text-sf-text bg-white/50 dark:bg-sf-surface p-4 rounded-2xl border border-sf-border/30 whitespace-pre-line">{{ c.notes }}</p>
            </div>
          </section>
        </div>

        <!-- Right Side Form Actions -->
        <div class="space-y-6">
          <!-- Live Status Modifier Card -->
          <section *ngIf="c.status !== 'collected'" class="glass-card p-6 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <h3 class="text-md font-bold text-sf-text tracking-tight flex items-center gap-2">
              <ng-icon name="heroCheckBadge" class="text-sf-success text-xl"></ng-icon>
              <span>تسجيل وإتمام التحصيل</span>
            </h3>
            
            <form [formGroup]="collectForm" (ngSubmit)="onCollect()" class="space-y-4">
              <div class="space-y-2">
                <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">تاريخ التحصيل الفعلي</label>
                <div class="relative">
                  <ng-icon name="heroCalendarDays" class="absolute right-3 top-1/2 -translate-y-1/2 text-sf-muted"></ng-icon>
                  <input type="date" formControlName="collectionDate" 
                         class="w-full pr-10 pl-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-success/30 transition-all outline-none">
                </div>
              </div>

              <div class="space-y-2">
                <app-input type="number" formControlName="collectedAmount" label="المبلغ الفعلي المستلم" [isAccounting]="true"></app-input>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">ملاحظات الحوالة والتحصيل</label>
                <textarea formControlName="notes" placeholder="ملاحظات الحوالة، رقم الشيك أو وسيلة الاستلام..." rows="3"
                          class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-success/30 transition-all outline-none resize-none"></textarea>
              </div>

              <button type="submit" [disabled]="collectForm.invalid || submitting()"
                      class="w-full btn btn-success py-3 flex items-center justify-center gap-2 shadow-lg shadow-sf-success/10">
                @if (submitting()) {
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                } @else {
                  <ng-icon name="heroCheckBadge"></ng-icon>
                }
                <span>إيداع وتحصيل</span>
              </button>
            </form>
          </section>

          <!-- Quick Status Switcher Card -->
          <section class="glass-card p-6 rounded-3xl border border-sf-border shadow-2xl space-y-4">
            <h3 class="text-sm font-bold text-sf-text">إجراءات إدارية سريعة</h3>
            
            <div class="grid grid-cols-1 gap-2">
              <button *ngIf="c.status !== 'submitted'" (click)="onUpdateStatus(c._id, 'submitted')" 
                      class="w-full btn btn-secondary text-xs py-2 flex items-center justify-center gap-2 hover:bg-sf-primary/5 hover:text-sf-primary transition-all">
                <ng-icon name="heroPaperAirplane" class="text-sf-primary"></ng-icon>
                <span>تغيير الحالة إلى: تم التقديم للمطور</span>
              </button>

              <button *ngIf="c.status !== 'disputed'" (click)="onUpdateStatus(c._id, 'disputed')" 
                      class="w-full btn btn-secondary text-xs py-2 flex items-center justify-center gap-2 hover:bg-sf-error/5 hover:text-sf-error transition-all">
                <ng-icon name="heroExclamationTriangle" class="text-sf-error"></ng-icon>
                <span>تغيير الحالة إلى: منازع عليها</span>
              </button>

              <button *ngIf="c.status !== 'pending'" (click)="onUpdateStatus(c._id, 'pending')" 
                      class="w-full btn btn-secondary text-xs py-2 flex items-center justify-center gap-2 hover:bg-sf-warning/5 hover:text-sf-warning transition-all">
                <ng-icon name="heroClock" class="text-sf-warning"></ng-icon>
                <span>إعادة تعيين قيد الانتظار</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [
    `@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`
  ]
})
export class ClaimFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);
  private toastService = inject(ToastService);
  private celebrationService = inject(CelebrationService);

  claim = signal<Claim | null>(null);
  submitting = signal(false);
  isEditing = signal(false);

  // Quick Collection Form
  collectForm = this.fb.group({
    collectionDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    collectedAmount: [0, [Validators.required, Validators.min(1)]],
    notes: ['', []]
  });

  // Edit Claim Form
  editForm = this.fb.group({
    commissionDue: [0, [Validators.required, Validators.min(1)]],
    expectedCollectionDate: ['', [Validators.required]],
    invoiceStatus: ['', [Validators.required]],
    status: ['', [Validators.required]],
    notes: ['', []]
  });

  ngOnInit() {
    this.loadClaim();
  }

  loadClaim() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.claimService.getClaim(id).subscribe(res => {
        if (res.success) {
          this.claim.set(res.data);
          this.collectForm.patchValue({
            collectedAmount: res.data.commissionDue,
            notes: res.data.notes || ''
          });
        }
      });
    }
  }

  enableEditMode(c: Claim) {
    let formattedDate = '';
    if (c.expectedCollectionDate) {
      formattedDate = new Date(c.expectedCollectionDate).toISOString().split('T')[0];
    }
    
    this.editForm.patchValue({
      commissionDue: c.commissionDue,
      expectedCollectionDate: formattedDate,
      invoiceStatus: c.invoiceStatus || 'فاتورة عادية ضريبية',
      status: c.status,
      notes: c.notes || ''
    });
    this.isEditing.set(true);
  }

  onSaveClaim(id: string) {
    if (this.editForm.invalid) return;

    this.submitting.set(true);
    const data = this.editForm.value as any;

    this.claimService.updateClaim(id, data).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.isEditing.set(false);
        if (res.success) {
          this.loadClaim();
          this.toastService.showSuccess('تم تحديث بيانات المطالبة المالية بنجاح.');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.showError(err.error?.message || 'حدث خطأ أثناء تحديث بيانات المطالبة.');
      }
    });
  }

  onUpdateStatus(id: string, status: 'pending' | 'submitted' | 'collected' | 'disputed') {
    // 1. Pre-unlock AudioContext synchronously during click gesture to bypass Chrome security policies
    if (status === 'collected') {
      this.celebrationService.unlockAudio();
    }

    this.submitting.set(true);
    this.claimService.updateClaim(id, { status }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.loadClaim();
          this.toastService.showSuccess(`تم تحديث حالة المطالبة إلى: ${this.translateStatus(status)}.`);
          if (status === 'collected') {
            this.celebrationService.celebrate();
          }
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.showError(err.error?.message || 'حدث خطأ أثناء تغيير حالة المطالبة.');
      }
    });
  }

  onCollect() {
    // 1. Pre-unlock AudioContext synchronously during click gesture to bypass Chrome security policies
    this.celebrationService.unlockAudio();

    if (this.collectForm.invalid || !this.claim()) {
      if (this.collectForm.invalid) {
        this.toastService.showWarning('تنبيه: يرجى التحقق من صحة وقيمة مبلغ التحصيل المدخل.');
      }
      return;
    }
    
    this.submitting.set(true);
    const data = this.collectForm.value as any;
    
    this.claimService.collectClaim(this.claim()!._id, data).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.loadClaim();
          this.toastService.showSuccess('تم تسجيل إيداع وتحصيل المطالبة بنجاح!');
          this.celebrationService.celebrate();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.showError(err.error?.message || 'حدث خطأ أثناء إتمام عملية التحصيل.');
      }
    });
  }

  onDeleteClaim(id: string) {
    const c = this.claim();
    if (!c) return;

    // Navigate to list instantly
    this.router.navigate(['/claims']);

    // Show a Success Toast with the Undo countdown action
    this.toastService.showWithUndo(
      `تم حذف المطالبة المالية ${c.claimNumber} بنجاح.`,
      () => {
        // UNDO callback: Navigate back to detail page and show recovery toast
        this.router.navigate(['/claims', c._id]);
        this.toastService.showSuccess('تم استعادة المطالبة والتراجع عن الحذف.');
      },
      () => {
        // COMMIT callback: silently execute the delete on backend database
        this.claimService.deleteClaim(id).subscribe();
      }
    );
  }

  // Timeline Helper Methods
  getTimelineProgress(status: string): string {
    switch (status) {
      case 'pending': return '0%';
      case 'submitted': return '33.33%';
      case 'disputed': return '66.66%';
      case 'collected': return '100%';
      default: return '0%';
    }
  }

  isPastStep(currentStatus: string, step: string): boolean {
    const order = ['pending', 'submitted', 'disputed', 'collected'];
    return order.indexOf(currentStatus) >= order.indexOf(step);
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'collected': return 'محصلة بالكامل';
      case 'pending': return 'قيد الانتظار';
      case 'submitted': return 'تم التقديم للمطور';
      case 'disputed': return 'منازع عليها';
      default: return status;
    }
  }

  getStatusColor(status: string): any {
    switch (status) {
      case 'collected': return 'success';
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'disputed': return 'error';
      default: return 'gray';
    }
  }

  printInvoice(c: Claim) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedDate = new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(c.collectionDate || new Date()));
    
    const formattedCommission = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(c.commissionDue);
    const formattedCollected = c.collectedAmount ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(c.collectedAmount) : '-';

    const statusStampText = c.status === 'collected' ? 'محصلة بالكامل' : 'قيد الانتظار';
    const statusStampClass = c.status === 'collected' ? 'stamp-paid' : 'stamp-pending';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة مطالبة - ${c.claimNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            font-size: 14px;
            line-height: 1.6;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            position: relative;
            border: 1px solid #e2e8f0;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 25px;
            margin-bottom: 35px;
          }
          .logo-area h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #3b82f6;
            letter-spacing: -0.05em;
          }
          .logo-area p {
            margin: 5px 0 0 0;
            color: #64748b;
            font-size: 12px;
            font-weight: 600;
          }
          .invoice-details {
            text-align: left;
          }
          .invoice-details h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
          }
          .invoice-details p {
            margin: 5px 0 0 0;
            color: #64748b;
            font-size: 13px;
          }
          .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .party-box {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
          }
          .party-box h4 {
            margin: 0 0 10px 0;
            font-size: 12px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
          .party-box p {
            margin: 5px 0;
            font-weight: 600;
            color: #1e293b;
          }
          .party-box .title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
          }
          .items-table th {
            background-color: #f1f5f9;
            color: #475569;
            text-align: right;
            padding: 12px 16px;
            font-size: 12px;
            font-weight: 700;
            border-bottom: 2px solid #e2e8f0;
          }
          .items-table td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            font-weight: 600;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .totals-box {
            width: 300px;
            border-top: 2px solid #e2e8f0;
            padding-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
          }
          .total-row.grand-total {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            font-size: 18px;
            font-weight: 900;
            color: #3b82f6;
          }
          .stamp {
            position: absolute;
            top: 140px;
            left: 80px;
            border: 4px dashed;
            border-radius: 10px;
            padding: 10px 20px;
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            transform: rotate(-12deg);
            opacity: 0.85;
            user-select: none;
          }
          .stamp-paid {
            color: #10b981;
            border-color: #10b981;
            background-color: rgba(16, 185, 129, 0.05);
          }
          .stamp-pending {
            color: #f59e0b;
            border-color: #f59e0b;
            background-color: rgba(245, 158, 11, 0.05);
          }
          .footer-note {
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
            margin-top: 50px;
            border-top: 1px dashed #e2e8f0;
            padding-top: 20px;
          }
          @media print {
            body { padding: 0; }
            .invoice-container { border: none; box-shadow: none; padding: 0; }
            .stamp { left: 40px; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="stamp ${statusStampClass}">${statusStampText}</div>
          
          <div class="header">
            <div class="logo-area" style="display: flex; align-items: center; gap: 15px;">
              <img src="/logo.png" alt="Fair Direction Logo" style="width: 45px; height: 45px; object-fit: contain; border-radius: 8px;" />
              <div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #3b82f6;">فير دايركشن</h1>
                <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px; font-weight: 600;">المنصة الذكية لإدارة مبيعات العقارات</p>
              </div>
            </div>
            <div class="invoice-details">
              <h2>مطالبة عمولة مبيعات</h2>
              <p>المعرف: ${c.claimNumber}</p>
              <p>تاريخ الاستحقاق: ${new Date(c.expectedCollectionDate || c.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div class="parties">
            <div class="party-box">
              <h4>الجهة المستحقة للعمولة</h4>
              <p class="title">شركة فير دايركشن للتطوير العقاري (Fair Direction)</p>
              <p>الموقع الإلكتروني: fairdirection.com</p>
              <p>رقم مبيعة مرجعي: ${c.saleNumber}</p>
            </div>
            <div class="party-box">
              <h4>العميل والمشروع</h4>
              <p class="title">${c.clientName || 'غير محدد'}</p>
              <p>المشروع: ${c.projectName}</p>
              <p>الوحدة: ${c.unitNumber}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 10%">#</th>
                <th style="width: 50%">تفاصيل البند</th>
                <th style="text-align: left; width: 40%">القيمة المالية المستحقة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>١</td>
                <td>عمولة مبيعات مستحقة عن الوحدة رقم (${c.unitNumber}) بمشروع (${c.projectName})</td>
                <td style="text-align: left;">${formattedCommission}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-box">
              <div class="total-row">
                <span>المبلغ المستحق:</span>
                <span>${formattedCommission}</span>
              </div>
              <div class="total-row">
                <span>ضريبة القيمة المضافة (0%):</span>
                <span>ج.م ٠٫٠٠</span>
              </div>
              <div class="total-row grand-total">
                <span>الإجمالي المحصل:</span>
                <span>${formattedCollected}</span>
              </div>
            </div>
          </div>

          ${c.notes ? `
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; margin-top: 20px;">
              <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">ملاحظات التحصيل والمعاملة</h4>
              <p style="margin: 0; font-weight: 600; color: #1e293b; font-size: 13px;">${c.notes}</p>
            </div>
          ` : ''}

          <div class="footer-note">
            <p>تم توليد هذه الوثيقة آلياً من نظام فير دايركشن لإدارة المبيعات العقارية. جميع الحقوق محفوظة لعام ٢٠٢٦.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}
