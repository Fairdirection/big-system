import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { LayoutService } from '@core/services/layout.service';
import {
  heroSquares2x2,
  heroCurrencyDollar,
  heroDocumentText,
  heroUsers,
  heroEllipsisHorizontal,
} from '@ng-icons/heroicons/outline';

interface BottomNavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({
    heroSquares2x2, heroCurrencyDollar, heroDocumentText, heroUsers, heroEllipsisHorizontal,
  })],
  template: `
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16
                bg-sf-surface/95 backdrop-blur-md border-t border-sf-border/50
                flex items-stretch justify-around
                shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
         dir="rtl">

      @for (item of items; track item.path) {
        <a [routerLink]="item.path"
           routerLinkActive
           #rla="routerLinkActive"
           class="flex flex-col items-center justify-center gap-0.5 flex-1
                  transition-all duration-200 relative pt-1"
           [class.text-sf-primary]="rla.isActive"
           [class.text-sf-muted]="!rla.isActive">

          <!-- Active indicator dot -->
          @if (rla.isActive) {
            <span class="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5
                         bg-sf-primary rounded-b-full"></span>
          }

          <div class="p-1 rounded-lg transition-all duration-200"
               [class.bg-sf-primary/10]="rla.isActive">
            <ng-icon [name]="item.icon" class="text-[20px]" />
          </div>
          <span class="text-[9px] font-black tracking-tight">{{ item.label }}</span>
        </a>
      }

      <!-- More → opens sidebar overlay -->
      <button (click)="openMore()"
              class="flex flex-col items-center justify-center gap-0.5 flex-1
                     text-sf-muted transition-all duration-200 pt-1">
        <div class="p-1 rounded-lg">
          <ng-icon name="heroEllipsisHorizontal" class="text-[20px]" />
        </div>
        <span class="text-[9px] font-black tracking-tight">المزيد</span>
      </button>
    </nav>
  `,
})
export class BottomNavComponent {
  private layout = inject(LayoutService);

  items: BottomNavItem[] = [
    { path: '/dashboard', label: 'الرئيسية', icon: 'heroSquares2x2' },
    { path: '/sales',     label: 'المبيعات',  icon: 'heroCurrencyDollar' },
    { path: '/claims',    label: 'المطالبات', icon: 'heroDocumentText' },
    { path: '/employees', label: 'الموظفين',  icon: 'heroUsers' },
  ];

  openMore() { this.layout.mobileMenuOpen.set(true); }
}
