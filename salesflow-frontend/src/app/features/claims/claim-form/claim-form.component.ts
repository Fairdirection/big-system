import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClaimService } from '@core/services/claim.service';
import { Claim } from '@core/models/claim.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronRight, heroCheckBadge, heroDocumentText, heroCalendarDays, heroBanknotes } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({ heroChevronRight, heroCheckBadge, heroDocumentText, heroCalendarDays, heroBanknotes })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20" *ngIf="claim() as c">
      <!-- Header -->
      <header class="flex items-center gap-4">
        <button [routerLink]="['/claims']" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
          <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-display font-black text-sf-text tracking-tight">إدارة المطالبة</h1>
            <app-badge [color]="getStatusColor(c.status)">{{ translateStatus(c.status) }}</app-badge>
          </div>
          <p class="text-sf-muted font-medium mt-1">{{ c.claimNumber }} • {{ c.projectName }}</p>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Details -->
        <div class="md:col-span-2 space-y-6">
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl">
            <h3 class="text-lg font-bold text-sf-text mb-6 border-b border-sf-border/30 pb-4">معلومات المبيعة</h3>
            
            <div class="grid grid-cols-2 gap-6">
              <div>
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">رقم المبيعة</span>
                <p class="text-sm font-semibold text-sf-text">{{ c.saleNumber }}</p>
              </div>
              <div>
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">العميل</span>
                <p class="text-sm font-semibold text-sf-text">{{ c.clientName }}</p>
              </div>
              <div class="col-span-2">
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">الوحدة</span>
                <p class="text-sm font-semibold text-sf-text">{{ c.projectName }} - {{ c.unitNumber }}</p>
              </div>
            </div>

            <div class="mt-8 p-4 bg-sf-primary/10 border border-sf-primary/20 rounded-2xl flex justify-between items-center">
              <div>
                <span class="text-xs font-bold text-sf-primary uppercase tracking-widest block">العمولة المستحقة</span>
                <span class="text-2xl font-display font-black text-sf-primary">{{ c.commissionDue | currencyEgp }}</span>
              </div>
              <ng-icon name="heroBanknotes" class="text-3xl text-sf-primary opacity-50"></ng-icon>
            </div>
          </section>

          @if (c.status === 'collected') {
            <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl bg-sf-success/5">
              <h3 class="text-lg font-bold text-sf-success mb-6 flex items-center gap-2">
                <ng-icon name="heroCheckBadge"></ng-icon>
                <span>تم التحصيل بنجاح</span>
              </h3>
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">تاريخ التحصيل</span>
                  <p class="text-sm font-semibold text-sf-text">{{ c.collectionDate | date:'longDate' }}</p>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest block mb-1">المبلغ المحصل</span>
                  <p class="text-sm font-black text-sf-success">{{ c.collectedAmount | currencyEgp }}</p>
                </div>
              </div>
            </section>
          }
        </div>

        <!-- Actions / Collection Form -->
        <div class="space-y-6">
          @if (c.status !== 'collected') {
            <section class="glass-card p-6 rounded-3xl border border-sf-border shadow-2xl space-y-6">
              <h3 class="text-md font-bold text-sf-text tracking-tight">تسجيل عملية التحصيل</h3>
              
              <form [formGroup]="collectForm" (ngSubmit)="onCollect()" class="space-y-4">
                <div class="space-y-2">
                  <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">تاريخ التحصيل</label>
                  <div class="relative">
                    <ng-icon name="heroCalendarDays" class="absolute right-3 top-1/2 -translate-y-1/2 text-sf-muted"></ng-icon>
                    <input type="date" formControlName="collectionDate" 
                           class="w-full pr-10 pl-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-success/30 transition-all outline-none">
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold text-sf-muted uppercase tracking-widest mr-1">المبلغ الفعلي المحصل</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-sf-muted">EGP</span>
                    <input type="number" formControlName="collectedAmount" 
                           class="w-full pr-4 pl-12 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-sf-success/30 transition-all outline-none text-left">
                  </div>
                </div>

                <button type="submit" [disabled]="collectForm.invalid || submitting()"
                        class="w-full btn btn-success py-3 flex items-center justify-center gap-2 shadow-lg shadow-sf-success/10">
                  @if (submitting()) {
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  } @else {
                    <ng-icon name="heroCheckBadge"></ng-icon>
                  }
                  <span>إتمام التحصيل</span>
                </button>
              </form>
            </section>
          }

          <section class="glass-card p-6 rounded-3xl border border-sf-border shadow-2xl space-y-4">
            <h3 class="text-sm font-bold text-sf-text">إجراءات أخرى</h3>
            <button class="w-full btn btn-secondary text-xs py-2 flex items-center justify-center gap-2">
              <ng-icon name="heroDocumentText"></ng-icon>
              <span>تحميل الفاتورة</span>
            </button>
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
export class ClaimFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);

  claim = signal<Claim | null>(null);
  submitting = signal(false);

  collectForm = this.fb.group({
    collectionDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    collectedAmount: [0, [Validators.required, Validators.min(1)]]
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
            collectedAmount: res.data.commissionDue
          });
        }
      });
    }
  }

  onCollect() {
    if (this.collectForm.invalid || !this.claim()) return;
    
    this.submitting.set(true);
    const data = this.collectForm.value as any;
    
    this.claimService.collectClaim(this.claim()!._id, data).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.loadClaim();
        }
      },
      error: () => this.submitting.set(false)
    });
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'collected': return 'محصلة';
      case 'pending': return 'قيد الانتظار';
      case 'submitted': return 'تم التقديم';
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
}
