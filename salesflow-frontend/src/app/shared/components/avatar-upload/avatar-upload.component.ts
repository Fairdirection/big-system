import {
  Component, ChangeDetectionStrategy, inject, signal, output, input,
  DestroyRef, HostListener, ElementRef, viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroXMark, heroArrowUpTray, heroTrash, heroCheckCircle, heroPhoto
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [provideIcons({ heroXMark, heroArrowUpTray, heroTrash, heroCheckCircle, heroPhoto })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4" (click)="onBackdropClick($event)">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-sm animate-scale-in"
           (click)="$event.stopPropagation()">
        <div class="glass-card rounded-[2rem] border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">

          <!-- Gradient header band -->
          <div class="h-1.5 w-full bg-gradient-to-r from-sf-primary via-purple-500 to-pink-500"></div>

          <div class="p-7 space-y-7">
            <!-- Header row -->
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-display font-black text-sf-text tracking-tight">صورة الملف الشخصي</h2>
                <p class="text-xs text-sf-muted font-medium mt-0.5">اسحب صورتك أو اضغط لاختيارها</p>
              </div>
              <button (click)="close.emit()"
                      class="w-8 h-8 rounded-xl bg-sf-elevated hover:bg-sf-border/40 border border-sf-border/30
                             flex items-center justify-center text-sf-muted hover:text-sf-text transition-all">
                <ng-icon name="heroXMark" class="text-base"></ng-icon>
              </button>
            </div>

            <!-- Drop Zone -->
            <div class="flex flex-col items-center gap-5">
              <div
                #dropZone
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave()"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
                class="relative w-44 h-44 rounded-full cursor-pointer transition-all duration-300 select-none group"
                [class.ring-4]="isDragging()"
                [class.ring-sf-primary]="isDragging()"
                [class.ring-offset-4]="isDragging()"
                [class.ring-offset-sf-bg]="isDragging()"
                [class.scale-105]="isDragging()">

                <!-- Image preview -->
                @if (preview()) {
                  <img [src]="preview()"
                       class="w-full h-full rounded-full object-cover border-2 border-sf-border/40 shadow-xl transition-all duration-300" />
                  <!-- Hover overlay -->
                  <div class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100
                               flex flex-col items-center justify-center transition-all duration-200 gap-1.5">
                    <ng-icon name="heroPhoto" class="text-white text-2xl"></ng-icon>
                    <span class="text-white text-[10px] font-bold">تغيير الصورة</span>
                  </div>
                } @else {
                  <!-- Empty drop zone -->
                  <div class="w-full h-full rounded-full border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-2"
                       [class.border-sf-primary]="isDragging()"
                       [class.bg-sf-primary/5]="isDragging()"
                       [class.border-sf-border]="!isDragging()"
                       [class.bg-sf-elevated/30]="!isDragging()"
                       [class.group-hover:border-sf-primary/60]="!isDragging()">
                    <div class="w-14 h-14 rounded-full bg-sf-primary/10 border border-sf-primary/20
                                flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-sf-primary/20">
                      <ng-icon name="heroArrowUpTray" class="text-sf-primary text-2xl"></ng-icon>
                    </div>
                    <p class="text-xs font-bold text-sf-muted text-center leading-tight px-4">
                      {{ isDragging() ? 'أفلت الصورة هنا' : 'اسحب صورتك هنا' }}
                    </p>
                  </div>
                }

                <!-- Drag glow ring -->
                @if (isDragging()) {
                  <div class="absolute inset-0 rounded-full ring-2 ring-sf-primary/40 animate-pulse pointer-events-none"></div>
                }
              </div>

              <!-- File format note -->
              <p class="text-[10px] text-sf-subtle font-medium">
                JPG, PNG, WEBP — بحد أقصى 5 ميغابايت
              </p>
            </div>

            <!-- Hidden file input -->
            <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                   class="hidden" (change)="onFileSelected($event)" />

            <!-- Error message -->
            @if (error()) {
              <div class="flex items-center gap-2.5 p-3.5 bg-sf-danger/10 border border-sf-danger/20 rounded-2xl text-xs font-bold text-sf-danger animate-fade-in">
                <span class="text-base">⚠</span>
                {{ error() }}
              </div>
            }

            <!-- Actions -->
            <div class="flex flex-col gap-3 pt-1">
              <!-- Save button -->
              <button (click)="save()"
                      [disabled]="!preview() || saving() || preview() === currentAvatar()"
                      class="w-full py-3.5 rounded-2xl bg-sf-primary text-white font-black text-sm
                             shadow-glow-purple hover:brightness-110 active:scale-95
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100
                             transition-all duration-200 flex items-center justify-center gap-2">
                @if (saving()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>جاري الحفظ...</span>
                } @else {
                  <ng-icon name="heroCheckCircle" class="text-lg"></ng-icon>
                  <span>حفظ الصورة</span>
                }
              </button>

              <!-- Remove / Cancel row -->
              <div class="flex gap-2">
                @if (currentAvatar()) {
                  <button (click)="removeAvatar()"
                          [disabled]="saving()"
                          class="flex-1 py-2.5 rounded-2xl bg-sf-danger/10 hover:bg-sf-danger/20
                                 text-sf-danger border border-sf-danger/20 font-bold text-xs
                                 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                    <ng-icon name="heroTrash" class="text-sm"></ng-icon>
                    حذف الصورة
                  </button>
                }
                <button (click)="close.emit()"
                        class="flex-1 py-2.5 rounded-2xl bg-sf-elevated hover:bg-sf-border/40
                               text-sf-muted hover:text-sf-text border border-sf-border/30 font-bold text-xs transition-all">
                  إلغاء
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in    { from { opacity: 0; }                           to { opacity: 1; } }
    @keyframes scale-in   { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .animate-fade-in  { animation: fade-in 0.2s ease forwards; }
    .animate-scale-in { animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  `]
})
export class AvatarUploadComponent {
  currentAvatar = input<string | null | undefined>(null);

  close = output<void>();
  saved = output<string | null>();

  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  preview    = signal<string | null>(null);
  isDragging = signal(false);
  saving     = signal(false);
  error      = signal<string | null>(null);

  ngOnInit() {
    // Pre-fill preview with existing avatar
    if (this.currentAvatar()) {
      this.preview.set(this.currentAvatar()!);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.close.emit(); }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as Element).classList.contains('fixed')) this.close.emit();
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave() { this.isDragging.set(false); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
    (e.target as HTMLInputElement).value = '';
  }

  private processFile(file: File) {
    this.error.set(null);

    if (!file.type.startsWith('image/')) {
      this.error.set('الملف المحدد ليس صورة. يرجى اختيار JPG أو PNG أو WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('حجم الصورة يتجاوز الحد المسموح (5 ميغابايت).');
      return;
    }

    this.compressImage(file).then(base64 => this.preview.set(base64));
  }

  private compressImage(file: File, size = 256, quality = 0.88): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Crop to square from center
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width  - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        // Round clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = url;
    });
  }

  save() {
    const avatarUrl = this.preview();
    if (!avatarUrl || this.saving()) return;

    this.saving.set(true);
    this.auth.updateAvatar(avatarUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.showSuccess('تم حفظ صورة الملف الشخصي بنجاح!');
          this.saved.emit(avatarUrl);
          this.close.emit();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
        }
      });
  }

  removeAvatar() {
    this.saving.set(true);
    this.auth.updateAvatar(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.showSuccess('تم حذف صورة الملف الشخصي.');
          this.saved.emit(null);
          this.close.emit();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('حدث خطأ أثناء حذف الصورة.');
        }
      });
  }
}
