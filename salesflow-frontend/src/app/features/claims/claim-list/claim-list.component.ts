import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimService } from '@core/services/claim.service';
import { Claim } from '@core/models/claim.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroDocumentText, heroCheckBadge, heroExclamationCircle, heroClock, heroArrowPath } from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({ heroDocumentText, heroCheckBadge, heroExclamationCircle, heroClock, heroArrowPath })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">مطالبات العمولات</h1>
          <p class="text-sf-muted font-medium mt-1">تتبع وإدارة حالة التحصيل لجميع المبيعات المؤكدة.</p>
        </div>
        <button class="btn btn-secondary flex items-center gap-2">
          <ng-icon name="heroArrowPath"></ng-icon>
          <span>مزامنة المطالبات</span>
        </button>
      </header>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="!loading(); else skeleton">
        @for (claim of claims(); track claim._id) {
          <div class="glass-card rounded-2xl border border-sf-border shadow-xl flex flex-col overflow-hidden">
            <!-- Card Header -->
            <div class="p-5 border-b border-sf-border/30 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sf-surface flex items-center justify-center text-sf-primary border border-sf-border">
                  <ng-icon name="heroDocumentText" class="text-xl"></ng-icon>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-sf-text">{{ claim.claimNumber }}</h3>
                  <span class="text-[10px] font-black text-sf-muted uppercase tracking-tighter">{{ claim.saleNumber }}</span>
                </div>
              </div>
              <app-badge [color]="getStatusColor(claim.status)">{{ translateStatus(claim.status) }}</app-badge>
            </div>

            <!-- Card Body -->
            <div class="p-5 flex-1 space-y-4">
              <div>
                <h4 class="text-xs font-bold text-sf-muted uppercase tracking-widest mb-1">المشروع والوحدة</h4>
                <p class="text-sm font-semibold text-sf-text line-clamp-1">{{ claim.projectName }} • {{ claim.unitNumber }}</p>
                <p class="text-[10px] font-medium text-sf-muted mt-0.5">{{ claim.clientName }}</p>
              </div>

              <div class="p-4 bg-sf-bg/50 rounded-xl border border-sf-border/50">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">العمولة المستحقة</span>
                  <span class="text-sm font-black text-sf-primary">{{ claim.commissionDue | currencyEgp }}</span>
                </div>
                @if (claim.status === 'collected') {
                  <div class="flex items-center justify-between pt-2 mt-2 border-t border-sf-border/30">
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">تم التحصيل في</span>
                    <span class="text-xs font-bold text-sf-success">{{ claim.collectionDate | date:'mediumDate' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Card Footer -->
            <div class="p-4 bg-sf-surface/20 border-t border-sf-border/30 flex items-center justify-between">
              <button [routerLink]="[claim._id]" class="text-xs font-black text-sf-primary hover:underline uppercase tracking-widest">
                إدارة المطالبة
              </button>
              
              <div class="flex items-center gap-2">
                @if (claim.status === 'pending') {
                  <ng-icon name="heroClock" class="text-sf-warning" title="Pending Collection"></ng-icon>
                } @else if (claim.status === 'collected') {
                  <ng-icon name="heroCheckBadge" class="text-sf-success" title="Fully Collected"></ng-icon>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-32 flex flex-col items-center justify-center text-sf-muted">
            <ng-icon name="heroDocumentText" class="text-5xl mb-4 opacity-10"></ng-icon>
            <h3 class="text-xl font-bold italic">لم يتم العثور على مطالبات نشطة</h3>
            <p class="text-sm font-medium">يتم إنشاء المطالبات تلقائيًا من المبيعات المؤكدة.</p>
          </div>
        }
      </div>

      <ng-template #skeleton>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="h-64 bg-sf-surface rounded-2xl border border-sf-border skeleton" *ngFor="let i of [1,2,3]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .glass-card {
      backdrop-filter: blur(12px);
    }
    
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ClaimListComponent implements OnInit {
  private claimService = inject(ClaimService);
  claims = signal<Claim[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loading.set(true);
    this.claimService.getClaims().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.claims.set(res.data);
        }
      },
      error: () => this.loading.set(false)
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
