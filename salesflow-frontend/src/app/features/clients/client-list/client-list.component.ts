import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ClientService } from '@core/services/client.service';
import { Client } from '@core/models/client.model';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroUserGroup, heroEnvelope, heroPhone, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';
import { ListToolbarComponent } from '@shared/components/list-toolbar/list-toolbar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, NgIconComponent, RouterLink, ListToolbarComponent, TranslateModule],
  providers: [
    provideIcons({ heroPlus, heroUserGroup, heroEnvelope, heroPhone, heroPencil, heroTrash })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in text-right" dir="rtl">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">{{ 'client.list.title' | translate }}</h1>
          <p class="text-sf-muted font-medium mt-1">إدارة علاقات العملاء وسجل الاتصالات.</p>
        </div>
        <button [routerLink]="['new']" class="btn btn-primary flex items-center gap-2">
          <ng-icon name="heroPlus"></ng-icon>
          <span>{{ 'client.list.add' | translate }}</span>
        </button>
      </header>

      <!-- Toolbar -->
      <app-list-toolbar
        placeholder="بحث بالاسم، الكود، أو معلومات الاتصال..."
        [statusOptions]="statusOptions"
        [activeStatus]="statusFilter()"
        [count]="filteredClients().length"
        [loading]="loading()"
        (searchChange)="onSearch($event)"
        (statusChange)="onStatusChange($event)"
      />

      <!-- Client Table -->
      <div class="bg-sf-surface border border-sf-border shadow-sm rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse table-compact">
            <thead>
              <tr class="bg-sf-surface/50 border-b border-sf-border text-right">
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest">اسم العميل</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest">معلومات الاتصال</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-center">الكود</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-center">الحالة</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sf-border/50" *ngIf="!loading(); else skeleton">
              @for (client of filteredClients(); track client._id) {
                <tr class="group row-financial-hover">
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-sf-bg border border-sf-border flex items-center justify-center text-sf-primary font-bold shadow-inner">
                        {{ client.name.charAt(0) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-sf-text group-hover:text-sf-primary transition-colors">{{ client.name }}</span>
                        <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">عميل مسجل</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 text-xs text-sf-muted">
                        <ng-icon name="heroEnvelope" class="text-sf-primary/70"></ng-icon>
                        <span class="font-financial">{{ client.email || 'لا يوجد بريد' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-sf-muted">
                        <ng-icon name="heroPhone" class="text-sf-primary/70"></ng-icon>
                        <span class="font-financial">{{ client.phone }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-center font-financial">
                    <span class="px-2 py-1 bg-sf-bg border border-sf-border rounded text-[10px] font-bold text-sf-muted uppercase tracking-widest">
                      {{ client.code }}
                    </span>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center justify-center gap-1.5">
                      <div class="w-1.5 h-1.5 rounded-full" [class.bg-sf-success]="client.isActive" [class.bg-sf-muted]="!client.isActive"></div>
                      <span class="text-xs font-semibold text-sf-text">{{ client.isActive ? 'نشط' : 'غير نشط' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-left">
                    <div class="flex items-center justify-end gap-2">
                      <button [routerLink]="[client._id]" class="btn-icon p-2 text-sf-muted hover:text-sf-primary hover:bg-sf-primary/10 rounded-lg transition-all" title="تعديل">
                        <ng-icon name="heroPencil"></ng-icon>
                      </button>
                      <button (click)="deleteClient(client)" class="btn-icon p-2 text-sf-muted hover:text-sf-danger hover:bg-sf-danger/10 rounded-lg transition-all" title="حذف">
                        <ng-icon name="heroTrash"></ng-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center justify-center gap-3">
                      <div class="w-16 h-16 rounded-2xl bg-sf-elevated border border-sf-border border-dashed
                                  flex items-center justify-center text-sf-subtle">
                        <ng-icon name="heroUserGroup" class="text-2xl"></ng-icon>
                      </div>
                      <div>
                        <h3 class="text-base font-bold text-sf-text">لا يوجد عملاء</h3>
                        <p class="text-sm text-sf-muted mt-1">
                          {{ statusFilter() !== 'all' ? 'لا يوجد عملاء بهذه الحالة.' : 'ابدأ بإضافة أول عميل لك.' }}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <ng-template #skeleton>
        <tr *ngFor="let i of [1,2,3,4,5]">
          <td colspan="5" class="px-6 py-5">
            <div class="h-12 bg-sf-surface rounded-xl skeleton"></div>
          </td>
        </tr>
      </ng-template>
    </div>
  `,
  styles: [``]
})
export class ClientListComponent implements OnInit {
  private clientService  = inject(ClientService);
  private confirmDialog  = inject(ConfirmDialogService);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  clients      = signal<Client[]>([]);
  loading      = signal(true);
  searchQuery  = signal('');
  statusFilter = signal('all');
  filteredClients = signal<Client[]>([]);

  readonly statusOptions = [
    { value: 'all',      label: 'الكل' },
    { value: 'active',   label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
  ];

  ngOnInit() { this.loadClients(); }

  loadClients() {
    this.loading.set(true);
    this.clientService.getClients().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) { this.clients.set(res.data); this.applyFilter(); }
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(query: string)       { this.searchQuery.set(query); this.applyFilter(); }
  onStatusChange(status: string) { this.statusFilter.set(status); this.applyFilter(); }

  applyFilter() {
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();

    let list = this.clients();
    if (st === 'active')   list = list.filter(c => c.isActive);
    if (st === 'inactive') list = list.filter(c => !c.isActive);
    if (q) list = list.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q),
    );
    this.filteredClients.set(list);
  }

  async deleteClient(client: Client) {
    const ok = await this.confirmDialog.confirm({
      title: this.translate.instant('client.list.delete_title'),
      message: this.translate.instant('client.list.delete_msg'),
      confirmLabel: this.translate.instant('common.delete'),
      type: 'danger',
    });
    if (ok) {
      this.clientService.deleteClient(client._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.loadClients(),
      });
    }
  }
}
