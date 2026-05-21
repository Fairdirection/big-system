import {
  Component, ChangeDetectionStrategy, inject, signal, output, input,
  DestroyRef, HostListener, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@core/services/auth.service';
import { EmployeeService } from '@core/services/employee.service';
import { ToastService } from '@core/services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ░░ BACKDROP ░░ -->
    <div class="avatar-backdrop" (click)="onBackdropClick($event)">

      <!-- Ambient orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <!-- ░░ CARD ░░ -->
      <div class="avatar-card" (click)="$event.stopPropagation()">

        <!-- Scan line sweep (entry) -->
        <div class="scan-sweep"></div>

        <!-- Corner accents -->
        <span class="corner corner-tl"></span>
        <span class="corner corner-tr"></span>
        <span class="corner corner-bl"></span>
        <span class="corner corner-br"></span>

        <!-- ── TOP BAR ── -->
        <div class="card-header">
          <div class="header-text">
            <p class="header-label">{{ 'avatar.title' | translate }}</p>
            <p class="header-sub">{{ 'avatar.subtitle' | translate }}</p>
          </div>
          <button class="close-btn" (click)="close.emit()" aria-label="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" class="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- ── AVATAR STAGE ── -->
        <div class="stage">

          <!-- Aurora ring layers -->
          <div class="ring-track">
            <div class="ring-aurora" [class.ring-drag]="isDragging()"></div>
            <div class="ring-aurora ring-aurora-2" [class.ring-drag]="isDragging()"></div>
            <div class="ring-dots" [class.ring-drag]="isDragging()"></div>
          </div>

          <!-- Drop zone / preview -->
          <div class="drop-zone group"
               [class.dragging]="isDragging()"
               [class.has-image]="!!preview()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave()"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">

            <!-- Shimmer sweep (plays after image loads) -->
            @if (shimmer()) {
              <div class="shimmer-sweep"></div>
            }

            @if (preview()) {
              <!-- Preview image -->
              <img [src]="preview()" class="avatar-img" [class.img-in]="imgLoaded()"
                   (load)="onImgLoad()" />

              <!-- Camera overlay on hover -->
              <div class="camera-overlay">
                <div class="shutter-ring"></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                     stroke-linecap="round" stroke-linejoin="round" class="camera-icon">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span class="camera-label">{{ 'avatar.change' | translate }}</span>
              </div>
            } @else {
              <!-- Empty state -->
              <div class="empty-zone" [class.empty-drag]="isDragging()">
                <div class="upload-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                       stroke-linecap="round" stroke-linejoin="round" class="upload-icon">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p class="upload-text">
                  {{ isDragging() ? ('avatar.drop_here' | translate) : ('avatar.drag_here' | translate) }}
                </p>
              </div>
            }

            <!-- Drag particle burst -->
            @if (isDragging()) {
              <div class="drag-particles">
                @for (p of particles; track p) {
                  <span class="particle" [style]="p"></span>
                }
              </div>
            }
          </div>

          <!-- Format hint -->
          <p class="format-hint">{{ 'avatar.format_hint' | translate }}</p>
        </div>

        <!-- Hidden file input -->
        <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif"
               class="sr-only" (change)="onFileSelected($event)" />

        <!-- ── ERROR ── -->
        @if (error()) {
          <div class="error-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" class="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error() }}
          </div>
        }

        <!-- ── ACTIONS ── -->
        <div class="actions">
          <!-- Save -->
          <button class="btn-save"
                  [disabled]="!preview() || saving() || preview() === currentAvatar()"
                  (click)="save()">
            @if (saving()) {
              <span class="spinner"></span>
              <span>{{ 'avatar.saving' | translate }}</span>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ 'avatar.save' | translate }}</span>
            }
          </button>

          <!-- Secondary row -->
          <div class="secondary-row">
            @if (currentAvatar()) {
              <button class="btn-remove" [disabled]="saving()" (click)="removeAvatar()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                {{ 'avatar.remove' | translate }}
              </button>
            }
            <button class="btn-cancel" (click)="close.emit()">
              {{ 'avatar.cancel' | translate }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       BACKDROP
    ═══════════════════════════════════════════ */
    .avatar-backdrop {
      position: fixed;
      inset: 0;
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: radial-gradient(ellipse at 30% 20%, rgba(99,55,255,0.18) 0%, transparent 60%),
                  radial-gradient(ellipse at 70% 80%, rgba(236,72,153,0.12) 0%, transparent 55%),
                  rgba(0,0,0,0.82);
      backdrop-filter: blur(20px) saturate(1.4);
      animation: bd-in 0.3s ease forwards;
    }
    @keyframes bd-in { from { opacity:0 } to { opacity:1 } }

    /* Ambient orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      animation: orb-drift 8s ease-in-out infinite alternate;
    }
    .orb-1 { width:400px; height:400px; top:-10%; left:-5%;
              background: radial-gradient(circle, rgba(99,55,255,0.25), transparent 70%); }
    .orb-2 { width:350px; height:350px; bottom:-10%; right:-5%;
              background: radial-gradient(circle, rgba(236,72,153,0.2), transparent 70%);
              animation-delay: -3s; }
    .orb-3 { width:250px; height:250px; top:40%; left:55%;
              background: radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%);
              animation-delay: -6s; }
    @keyframes orb-drift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(30px, -20px) scale(1.1); }
    }

    /* ═══════════════════════════════════════════
       CARD
    ═══════════════════════════════════════════ */
    .avatar-card {
      position: relative;
      width: 100%;
      max-width: 380px;
      background: linear-gradient(145deg,
        rgba(255,255,255,0.06) 0%,
        rgba(255,255,255,0.02) 50%,
        rgba(0,0,0,0.2) 100%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 28px;
      padding: 28px;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.04) inset,
        0 40px 80px rgba(0,0,0,0.7),
        0 0 60px rgba(99,55,255,0.08);
      overflow: hidden;
      animation: card-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes card-in {
      from { opacity:0; transform: scale(0.88) translateY(20px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }

    /* Scan sweep on enter */
    .scan-sweep {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(99,55,255,0.07) 50%,
        transparent 100%);
      transform: translateY(-100%);
      animation: scan 0.6s 0.1s ease forwards;
      pointer-events: none;
      z-index: 1;
    }
    @keyframes scan {
      from { transform: translateY(-100%); }
      to   { transform: translateY(200%); }
    }

    /* Corner accents */
    .corner {
      position: absolute;
      width: 18px;
      height: 18px;
      pointer-events: none;
      opacity: 0.5;
    }
    .corner-tl { top:12px; left:12px;  border-top: 1.5px solid rgba(99,55,255,0.8); border-left: 1.5px solid rgba(99,55,255,0.8); border-radius: 4px 0 0 0; }
    .corner-tr { top:12px; right:12px; border-top: 1.5px solid rgba(99,55,255,0.8); border-right: 1.5px solid rgba(99,55,255,0.8); border-radius: 0 4px 0 0; }
    .corner-bl { bottom:12px; left:12px;  border-bottom: 1.5px solid rgba(99,55,255,0.8); border-left: 1.5px solid rgba(99,55,255,0.8); border-radius: 0 0 0 4px; }
    .corner-br { bottom:12px; right:12px; border-bottom: 1.5px solid rgba(99,55,255,0.8); border-right: 1.5px solid rgba(99,55,255,0.8); border-radius: 0 0 4px 0; }

    /* ═══════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════ */
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
      position: relative;
      z-index: 2;
    }
    .header-label {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .header-sub {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.45);
      font-weight: 500;
      margin-top: 3px;
    }
    .close-btn {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .close-btn:hover {
      background: rgba(255,255,255,0.12);
      color: #fff;
      transform: rotate(90deg);
    }

    /* ═══════════════════════════════════════════
       STAGE
    ═══════════════════════════════════════════ */
    .stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 2;
      margin-bottom: 24px;
    }

    /* ── Aurora Ring ── */
    .ring-track {
      position: relative;
      width: 220px;
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ring-aurora {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        #6337ff, #a855f7, #ec4899, #f97316, #06b6d4,
        #6337ff 360deg
      );
      animation: aurora-spin 4s linear infinite;
      transition: all 0.4s;
    }
    .ring-aurora-2 {
      inset: -8px;
      opacity: 0.35;
      filter: blur(8px);
      animation: aurora-spin 4s linear infinite reverse;
    }
    .ring-drag { animation-duration: 1.2s !important; filter: blur(0) !important; }
    .ring-aurora-2.ring-drag { filter: blur(12px) !important; opacity: 0.7 !important; }

    /* Dot ring */
    .ring-dots {
      position: absolute;
      inset: -16px;
      border-radius: 50%;
      border: 1px dashed rgba(255,255,255,0.12);
      animation: aurora-spin 20s linear infinite;
      transition: all 0.4s;
    }
    .ring-dots.ring-drag {
      border-color: rgba(99,55,255,0.5);
      animation-duration: 4s !important;
    }

    @keyframes aurora-spin { to { transform: rotate(360deg); } }

    /* ── Drop zone ── */
    .drop-zone {
      position: absolute;
      inset: 5px;
      border-radius: 50%;
      cursor: pointer;
      overflow: hidden;
      background: rgba(12,10,20,0.9);
      border: 2px solid transparent;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s;
      z-index: 1;
    }
    .drop-zone.dragging {
      transform: scale(1.04);
      border-color: rgba(99,55,255,0.6);
    }
    .drop-zone:hover { transform: scale(1.02); }
    .drop-zone.has-image:hover { transform: scale(1.015); }

    /* ── Avatar image ── */
    .avatar-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    .avatar-img.img-in { opacity: 1; }

    /* ── Shimmer sweep ── */
    .shimmer-sweep {
      position: absolute;
      inset: 0;
      z-index: 3;
      border-radius: 50%;
      background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(255,255,255,0.35) 50%,
        transparent 70%
      );
      background-size: 200% 100%;
      animation: shimmer 0.7s ease forwards;
      pointer-events: none;
    }
    @keyframes shimmer {
      from { background-position: -100% 0; opacity:1; }
      to   { background-position: 200% 0; opacity:0; }
    }

    /* ── Camera overlay ── */
    .camera-overlay {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(2px);
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 2;
    }
    .drop-zone:hover .camera-overlay { opacity: 1; }
    .shutter-ring {
      position: absolute;
      inset: 12px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.2);
      animation: shutter-pulse 1.5s ease-in-out infinite;
    }
    @keyframes shutter-pulse {
      0%, 100% { transform: scale(1); opacity:0.3; }
      50%       { transform: scale(0.92); opacity:0.7; }
    }
    .camera-icon {
      width: 32px;
      height: 32px;
      color: #fff;
      filter: drop-shadow(0 0 8px rgba(99,55,255,0.8));
      position: relative;
      z-index: 1;
    }
    .camera-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: rgba(255,255,255,0.85);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      position: relative;
      z-index: 1;
    }

    /* ── Empty zone ── */
    .empty-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      height: 100%;
      padding: 20px;
      transition: all 0.3s;
    }
    .upload-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(99,55,255,0.12);
      border: 1px solid rgba(99,55,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }
    .drop-zone:hover .upload-icon-wrap {
      background: rgba(99,55,255,0.25);
      transform: scale(1.1) translateY(-3px);
    }
    .empty-drag .upload-icon-wrap {
      background: rgba(99,55,255,0.3);
      border-color: rgba(99,55,255,0.7);
      box-shadow: 0 0 20px rgba(99,55,255,0.4);
      transform: scale(1.15);
    }
    .upload-icon {
      width: 22px;
      height: 22px;
      color: rgba(99,55,255,0.9);
    }
    .upload-text {
      font-size: 0.62rem;
      font-weight: 700;
      color: rgba(255,255,255,0.45);
      text-align: center;
      letter-spacing: 0.03em;
    }

    /* ── Drag particles ── */
    .drag-particles { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }
    .particle {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: rgba(99,55,255,0.9);
      animation: particle-float 1.5s ease-in-out infinite;
      box-shadow: 0 0 6px rgba(99,55,255,0.8);
    }
    @keyframes particle-float {
      0%   { transform: translate(0,0) scale(0); opacity:0; }
      30%  { opacity:1; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity:0; }
    }

    /* ── Format hint ── */
    .format-hint {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.3);
      font-weight: 500;
      letter-spacing: 0.04em;
    }

    /* ═══════════════════════════════════════════
       ERROR
    ═══════════════════════════════════════════ */
    .error-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #fca5a5;
      margin-bottom: 16px;
      animation: card-in 0.2s ease forwards;
      position: relative;
      z-index: 2;
    }

    /* ═══════════════════════════════════════════
       ACTIONS
    ═══════════════════════════════════════════ */
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      z-index: 2;
    }
    .btn-save {
      width: 100%;
      padding: 14px;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: 0.02em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #6337ff 0%, #a855f7 50%, #ec4899 100%);
      background-size: 200% 200%;
      border: none;
      box-shadow: 0 0 25px rgba(99,55,255,0.45), 0 4px 16px rgba(0,0,0,0.4);
      transition: all 0.3s ease;
      animation: btn-shimmer 3s ease infinite;
    }
    @keyframes btn-shimmer {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    .btn-save::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }
    .btn-save:hover::before { transform: translateX(100%); }
    .btn-save:hover:not(:disabled) {
      box-shadow: 0 0 40px rgba(99,55,255,0.65), 0 6px 24px rgba(0,0,0,0.5);
      transform: translateY(-1px);
    }
    .btn-save:active:not(:disabled) { transform: scale(0.97); }
    .btn-save:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      box-shadow: none;
      animation: none;
    }

    .secondary-row {
      display: flex;
      gap: 8px;
    }
    .btn-remove, .btn-cancel {
      flex: 1;
      padding: 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
      border: none;
    }
    .btn-remove {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      color: #fca5a5;
    }
    .btn-remove:hover:not(:disabled) {
      background: rgba(239,68,68,0.18);
      border-color: rgba(239,68,68,0.4);
      color: #fff;
    }
    .btn-remove:disabled { opacity:0.4; cursor:not-allowed; }
    .btn-cancel {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
    }
    .btn-cancel:hover {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.85);
    }

    /* Spinner */
    .spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255,255,255,0.25);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* SR only */
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border-width:0; }
  `]
})
export class AvatarUploadComponent implements OnInit {
  currentAvatar = input<string | null | undefined>(null);
  /** Pass an employee ID to save to that employee instead of the logged-in user. */
  employeeId    = input<string | null | undefined>(null);

  close  = output<void>();
  saved  = output<string | null>();

  private auth            = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private toast           = inject(ToastService);
  private translate       = inject(TranslateService);
  private destroyRef      = inject(DestroyRef);

  preview   = signal<string | null>(null);
  isDragging = signal(false);
  saving    = signal(false);
  error     = signal<string | null>(null);
  shimmer   = signal(false);
  imgLoaded = signal(false);

  readonly particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * 360;
    const dist  = 45 + Math.random() * 20;
    const tx    = Math.cos((angle * Math.PI) / 180) * dist + 'px';
    const ty    = Math.sin((angle * Math.PI) / 180) * dist + 'px';
    const delay = (Math.random() * 0.8).toFixed(2) + 's';
    return `--tx:${tx};--ty:${ty};top:${50 + Math.sin((angle * Math.PI) / 180) * 35}%;left:${50 + Math.cos((angle * Math.PI) / 180) * 35}%;animation-delay:${delay}`;
  });

  ngOnInit() {
    if (this.currentAvatar()) {
      this.preview.set(this.currentAvatar()!);
      this.imgLoaded.set(true);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.close.emit(); }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as Element).classList.contains('avatar-backdrop')) this.close.emit();
  }

  onDragOver(e: DragEvent)  { e.preventDefault(); e.stopPropagation(); this.isDragging.set(true); }
  onDragLeave()              { this.isDragging.set(false); }

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

  onImgLoad() {
    this.imgLoaded.set(true);
    this.shimmer.set(true);
    setTimeout(() => this.shimmer.set(false), 800);
  }

  private processFile(file: File) {
    this.error.set(null);
    if (!file.type.startsWith('image/')) {
      this.error.set(this.translate.instant('avatar.error_type')); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set(this.translate.instant('avatar.error_size')); return;
    }
    this.imgLoaded.set(false);
    this.compressImage(file).then(b64 => this.preview.set(b64));
  }

  private compressImage(file: File, size = 300, quality = 0.9): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Center-square crop — let CSS handle the circular display.
        // Do NOT clip to circle here: JPEG has no transparency so
        // an arc clip produces black corners that distort the image.
        const min = Math.min(img.width, img.height);
        const sx  = (img.width  - min) / 2;
        const sy  = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
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
    this.persist(avatarUrl).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.showSuccess(this.translate.instant('avatar.saved_success'));
        this.saved.emit(avatarUrl);
        this.close.emit();
      },
      error: () => {
        this.saving.set(false);
        this.error.set(this.translate.instant('avatar.error_save'));
      }
    });
  }

  removeAvatar() {
    this.saving.set(true);
    this.persist(null).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.showSuccess(this.translate.instant('avatar.removed_success'));
        this.saved.emit(null);
        this.close.emit();
      },
      error: () => {
        this.saving.set(false);
        this.error.set(this.translate.instant('avatar.error_remove'));
      }
    });
  }

  /** Route save to employee service or auth service depending on context. */
  private persist(avatarUrl: string | null): Observable<any> {
    const empId = this.employeeId();
    if (empId) {
      return this.employeeService.updateEmployee(empId, { avatarUrl } as any);
    }
    return this.auth.updateAvatar(avatarUrl);
  }
}
