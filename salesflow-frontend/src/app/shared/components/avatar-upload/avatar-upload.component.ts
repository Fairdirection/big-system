import {
  Component, ChangeDetectionStrategy, inject, signal, output, input,
  DestroyRef, HostListener, OnInit, OnDestroy, computed, ElementRef, viewChild
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

      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <!-- ░░ CARD ░░ -->
      <div class="avatar-card" (click)="$event.stopPropagation()">

        <div class="scan-sweep"></div>
        <span class="corner corner-tl"></span>
        <span class="corner corner-tr"></span>
        <span class="corner corner-bl"></span>
        <span class="corner corner-br"></span>

        <!-- ── HEADER ── -->
        <div class="card-header">
          <div class="header-text">
            <p class="header-label">{{ 'avatar.title' | translate }}</p>
            <p class="header-sub">
              @if (rawPhotoSrc()) {
                {{ 'avatar.drag_hint' | translate }}
              } @else {
                {{ 'avatar.subtitle' | translate }}
              }
            </p>
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

          <div style="position:relative;width:220px;height:220px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">

            <!-- Aurora rings -->
            <div class="ring-aurora" [class.ring-drag]="fileDragging()"></div>
            <div class="ring-aurora ring-aurora-2" [class.ring-drag]="fileDragging()"></div>
            <div class="ring-dots" [class.ring-drag]="fileDragging()"></div>

            <!-- Drop zone -->
            <div class="drop-zone"
                 style="position:relative;width:210px;height:210px;flex-shrink:0;"
                 [class.is-panning]="isPanning()"
                 (dragover)="onFileDragOver($event)"
                 (dragleave)="onFileDragLeave()"
                 (drop)="onFileDrop($event)">

              @if (rawPhotoSrc()) {
                <!-- ── CROP / PAN MODE ── -->
                <div class="pan-layer"
                     [style.cursor]="isPanning() ? 'grabbing' : 'grab'"
                     (pointerdown)="onPanStart($event)"
                     (pointermove)="onPanMove($event)"
                     (pointerup)="onPanEnd()"
                     (pointercancel)="onPanEnd()"
                     (wheel)="onWheel($event)">
                  <img [src]="rawPhotoSrc()"
                       class="pan-img"
                       [class.pan-loaded]="imgLoaded()"
                       [style.transform]="imgTransform()"
                       (load)="onImgLoad($event)" />
                </div>

                @if (shimmer()) { <div class="shimmer-sweep"></div> }

                <!-- Grid overlay while cropping -->
                <div class="crop-grid" [class.crop-grid-visible]="isPanning()">
                  <div class="crop-grid-h"></div>
                  <div class="crop-grid-h"></div>
                  <div class="crop-grid-v"></div>
                  <div class="crop-grid-v"></div>
                </div>

              } @else if (preview()) {
                <!-- ── EXISTING PHOTO ── -->
                <img [src]="preview()" class="avatar-img img-in" />
                <div class="camera-overlay">
                  <div class="shutter-ring" (click)="fileInput.click()"></div>
                  <div style="display:flex; flex-direction:column; gap:8px; z-index:2; position:relative;">
                    @if (currentOriginalAvatar()) {
                      <button class="crop-action-btn" (click)="adjustExisting($event)" style="background:rgba(255,255,255,0.15)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                        Adjust
                      </button>
                    }
                    <button class="crop-action-btn" (click)="fileInput.click()" style="background:rgba(255,255,255,0.15)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Change
                    </button>
                  </div>
                </div>

              } @else {
                <!-- ── EMPTY STATE ── -->
                <div class="empty-zone" [class.empty-drag]="fileDragging()"
                     (click)="fileInput.click()">
                  <div class="upload-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                         stroke-linecap="round" stroke-linejoin="round" class="upload-icon">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p class="upload-text">
                    {{ fileDragging() ? ('avatar.drop_here' | translate) : ('avatar.drag_here' | translate) }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- ── ZOOM SLIDER (crop mode only) ── -->
          @if (rawPhotoSrc()) {
            <div class="zoom-row">
              <button class="zoom-step-btn" (click)="stepZoom(-0.15)" aria-label="zoom out">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" class="w-3.5 h-3.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>

              <div class="slider-track">
                <input type="range" min="1" max="3" step="0.01"
                       [value]="zoom()"
                       (input)="onZoomSlider($event)"
                       class="zoom-slider" />
                <div class="slider-fill" [style.width.%]="(zoom() - 1) / 2 * 100"></div>
              </div>

              <button class="zoom-step-btn" (click)="stepZoom(0.15)" aria-label="zoom in">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" class="w-3.5 h-3.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
            </div>

            <!-- Reset + Change buttons -->
            <div class="crop-actions">
              <button class="crop-action-btn" (click)="resetCrop()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                </svg>
                {{ 'avatar.reset' | translate }}
              </button>
              <button class="crop-action-btn" (click)="fileInput.click()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {{ 'avatar.choose_btn' | translate }}
              </button>
            </div>
          } @else {
            <p class="format-hint">{{ 'avatar.format_hint' | translate }}</p>
          }
        </div>

        <!-- Hidden file input -->
        <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif"
               class="sr-only" (change)="onFileSelected($event)" />

        <!-- ── ERROR ── -->
        @if (error()) {
          <div class="error-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" class="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error() }}
          </div>
        }

        <!-- ── ACTIONS ── -->
        <div class="actions">
          <button class="btn-save"
                  [disabled]="!hasContent() || saving()"
                  (click)="save()">
            @if (saving()) {
              <span class="spinner"></span>
              <span>{{ 'avatar.saving' | translate }}</span>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ rawPhotoSrc() ? ('avatar.crop_save' | translate) : ('avatar.save' | translate) }}</span>
            }
          </button>

          <div class="secondary-row">
            @if (currentAvatar()) {
              <button class="btn-remove" [disabled]="saving()" (click)="removeAvatar()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
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
    /* ═══ BACKDROP ═══════════════════════════════════════════ */
    .avatar-backdrop {
      position: fixed; inset: 0; z-index: 300;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
      background: radial-gradient(ellipse at 30% 20%, rgba(99,55,255,0.18) 0%, transparent 60%),
                  radial-gradient(ellipse at 70% 80%, rgba(236,72,153,0.12) 0%, transparent 55%),
                  rgba(0,0,0,0.82);
      backdrop-filter: blur(20px) saturate(1.4);
      animation: bd-in 0.3s ease forwards;
    }
    @keyframes bd-in { from { opacity:0 } to { opacity:1 } }

    .orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none;
           animation: orb-drift 8s ease-in-out infinite alternate; }
    .orb-1 { width:400px;height:400px;top:-10%;left:-5%;
              background:radial-gradient(circle,rgba(99,55,255,0.25),transparent 70%); }
    .orb-2 { width:350px;height:350px;bottom:-10%;right:-5%;
              background:radial-gradient(circle,rgba(236,72,153,0.2),transparent 70%);animation-delay:-3s; }
    .orb-3 { width:250px;height:250px;top:40%;left:55%;
              background:radial-gradient(circle,rgba(6,182,212,0.15),transparent 70%);animation-delay:-6s; }
    @keyframes orb-drift { from{transform:translate(0,0)scale(1)} to{transform:translate(30px,-20px)scale(1.1)} }

    /* ═══ CARD ════════════════════════════════════════════════ */
    .avatar-card {
      position:relative; width:100%; max-width:380px;
      background:linear-gradient(145deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 50%,rgba(0,0,0,0.2) 100%);
      border:1px solid rgba(255,255,255,0.1); border-radius:28px; padding:28px;
      box-shadow:0 0 0 1px rgba(255,255,255,0.04) inset,0 40px 80px rgba(0,0,0,0.7),0 0 60px rgba(99,55,255,0.08);
      overflow:hidden;
      animation: card-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    @keyframes card-in { from{opacity:0;transform:scale(0.88)translateY(20px)} to{opacity:1;transform:scale(1)translateY(0)} }

    .scan-sweep {
      position:absolute;inset:0;
      background:linear-gradient(180deg,transparent 0%,rgba(99,55,255,0.07) 50%,transparent 100%);
      transform:translateY(-100%); animation:scan 0.6s 0.1s ease forwards; pointer-events:none; z-index:1;
    }
    @keyframes scan { from{transform:translateY(-100%)} to{transform:translateY(200%)} }

    .corner { position:absolute;width:18px;height:18px;pointer-events:none;opacity:0.5; }
    .corner-tl{top:12px;left:12px;border-top:1.5px solid rgba(99,55,255,0.8);border-left:1.5px solid rgba(99,55,255,0.8);border-radius:4px 0 0 0;}
    .corner-tr{top:12px;right:12px;border-top:1.5px solid rgba(99,55,255,0.8);border-right:1.5px solid rgba(99,55,255,0.8);border-radius:0 4px 0 0;}
    .corner-bl{bottom:12px;left:12px;border-bottom:1.5px solid rgba(99,55,255,0.8);border-left:1.5px solid rgba(99,55,255,0.8);border-radius:0 0 0 4px;}
    .corner-br{bottom:12px;right:12px;border-bottom:1.5px solid rgba(99,55,255,0.8);border-right:1.5px solid rgba(99,55,255,0.8);border-radius:0 0 4px 0;}

    /* ═══ HEADER ══════════════════════════════════════════════ */
    .card-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;position:relative;z-index:2; }
    .header-label { font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1.2; }
    .header-sub { font-size:0.72rem;color:rgba(255,255,255,0.45);font-weight:500;margin-top:3px; }
    .close-btn {
      width:30px;height:30px;display:flex;align-items:center;justify-content:center;
      border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
      color:rgba(255,255,255,0.5);cursor:pointer;transition:all 0.15s;flex-shrink:0;
    }
    .close-btn:hover { background:rgba(255,255,255,0.12);color:#fff;transform:rotate(90deg); }

    /* ═══ STAGE ═══════════════════════════════════════════════ */
    .stage { display:flex;flex-direction:column;align-items:center;gap:14px;position:relative;z-index:2;margin-bottom:20px; }

    /* Aurora rings */
    .ring-aurora {
      position:absolute;inset:-4px;border-radius:50%;
      background:conic-gradient(from 0deg,#6337ff,#a855f7,#ec4899,#f97316,#06b6d4,#6337ff 360deg);
      animation:aurora-spin 4s linear infinite;transition:all 0.4s;
    }
    .ring-aurora-2 { inset:-8px;opacity:0.35;filter:blur(8px);animation:aurora-spin 4s linear infinite reverse; }
    .ring-drag { animation-duration:1.2s!important; }
    .ring-aurora-2.ring-drag { filter:blur(12px)!important;opacity:0.7!important; }
    .ring-dots {
      position:absolute;inset:-16px;border-radius:50%;
      border:1px dashed rgba(255,255,255,0.12);animation:aurora-spin 20s linear infinite;transition:all 0.4s;
    }
    .ring-dots.ring-drag { border-color:rgba(99,55,255,0.5);animation-duration:4s!important; }
    @keyframes aurora-spin { to { transform:rotate(360deg); } }

    /* Drop zone */
    .drop-zone {
      border-radius:50%;overflow:hidden;background:rgba(12,10,20,0.9);
      border:2px solid transparent;transition:border-color 0.3s;
    }
    .drop-zone.is-panning { border-color:rgba(99,55,255,0.4); }

    /* Pan layer (fills the circle, catches pointer events) */
    .pan-layer { position:absolute;inset:0;overflow:hidden;border-radius:50%;touch-action:none; }

    /* The raw image being cropped */
    .pan-img {
      position:absolute;top:0;left:0;
      transform-origin:0 0;
      pointer-events:none;user-select:none;
      opacity:0;transition:opacity 0.3s ease;
    }
    .pan-img.pan-loaded { opacity:1; }

    /* Rule-of-thirds grid (shown while dragging) */
    .crop-grid {
      position:absolute;inset:0;border-radius:50%;pointer-events:none;
      display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;
      opacity:0;transition:opacity 0.2s;
    }
    .crop-grid-visible { opacity:1; }
    .crop-grid-h {
      grid-column:1/-1;border-bottom:1px solid rgba(255,255,255,0.25);
    }
    .crop-grid-h:last-of-type { border-bottom:none; }
    .crop-grid-v {
      border-right:1px solid rgba(255,255,255,0.25);grid-row:1/-1;
    }
    .crop-grid-v:last-of-type { border-right:none; }

    /* Existing avatar */
    .avatar-img { position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.5s; }
    .avatar-img.img-in { opacity:1; }

    /* Camera overlay */
    .camera-overlay {
      position:absolute;inset:0;border-radius:50%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:6px;
      background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);
      opacity:0;transition:opacity 0.2s;cursor:pointer;
    }
    .drop-zone:hover .camera-overlay { opacity:1; }
    .shutter-ring { position:absolute;inset:12px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.2);animation:shutter-pulse 1.5s ease-in-out infinite; }
    @keyframes shutter-pulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(0.92);opacity:0.7} }
    .camera-icon { width:32px;height:32px;color:#fff;filter:drop-shadow(0 0 8px rgba(99,55,255,0.8));position:relative;z-index:1; }
    .camera-label { font-size:0.65rem;font-weight:800;color:rgba(255,255,255,0.85);letter-spacing:0.1em;text-transform:uppercase;position:relative;z-index:1; }

    /* Empty state */
    .empty-zone { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;height:100%;padding:20px;cursor:pointer; }
    .upload-icon-wrap {
      width:52px;height:52px;border-radius:50%;background:rgba(99,55,255,0.12);border:1px solid rgba(99,55,255,0.3);
      display:flex;align-items:center;justify-content:center;transition:all 0.3s;
    }
    .drop-zone:hover .upload-icon-wrap,
    .empty-drag .upload-icon-wrap { background:rgba(99,55,255,0.3);border-color:rgba(99,55,255,0.7);box-shadow:0 0 20px rgba(99,55,255,0.4);transform:scale(1.1); }
    .upload-icon { width:22px;height:22px;color:rgba(99,55,255,0.9); }
    .upload-text { font-size:0.62rem;font-weight:700;color:rgba(255,255,255,0.45);text-align:center; }

    /* Shimmer */
    .shimmer-sweep {
      position:absolute;inset:0;z-index:3;border-radius:50%;pointer-events:none;
      background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.35) 50%,transparent 70%);
      background-size:200% 100%;animation:shimmer 0.7s ease forwards;
    }
    @keyframes shimmer { from{background-position:-100% 0;opacity:1} to{background-position:200% 0;opacity:0} }

    .format-hint { font-size:0.65rem;color:rgba(255,255,255,0.3);font-weight:500;letter-spacing:0.04em; }

    /* ═══ ZOOM CONTROLS ═══════════════════════════════════════ */
    .zoom-row {
      display:flex;align-items:center;gap:10px;width:100%;max-width:240px;
    }
    .zoom-step-btn {
      width:28px;height:28px;border-radius:8px;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
      color:rgba(255,255,255,0.6);cursor:pointer;transition:all 0.15s;
    }
    .zoom-step-btn:hover { background:rgba(99,55,255,0.25);border-color:rgba(99,55,255,0.5);color:#fff; }

    .slider-track { position:relative;flex:1;height:4px;border-radius:4px;background:rgba(255,255,255,0.1); }
    .slider-fill {
      position:absolute;top:0;left:0;height:100%;border-radius:4px;
      background:linear-gradient(90deg,#6337ff,#a855f7);pointer-events:none;transition:width 0.05s;
    }
    .zoom-slider {
      position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0;
      -webkit-appearance:none;appearance:none;
    }
    /* Widen the hit area */
    .slider-track::before {
      content:'';position:absolute;inset:-8px;
    }

    /* Crop action buttons */
    .crop-actions { display:flex;gap:8px; }
    .crop-action-btn {
      display:flex;align-items:center;gap:5px;
      padding:5px 12px;border-radius:10px;font-size:0.68rem;font-weight:700;cursor:pointer;
      background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
      color:rgba(255,255,255,0.5);transition:all 0.2s;
    }
    .crop-action-btn:hover { background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.85); }

    /* ═══ ERROR ═══════════════════════════════════════════════ */
    .error-bar {
      display:flex;align-items:center;gap:8px;padding:10px 14px;
      background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:12px;
      font-size:0.72rem;font-weight:600;color:#fca5a5;margin-bottom:16px;animation:card-in 0.2s ease forwards;position:relative;z-index:2;
    }

    /* ═══ ACTIONS ══════════════════════════════════════════════ */
    .actions { display:flex;flex-direction:column;gap:10px;position:relative;z-index:2; }
    .btn-save {
      width:100%;padding:14px;border-radius:16px;font-size:0.85rem;font-weight:800;color:#fff;
      letter-spacing:0.02em;display:flex;align-items:center;justify-content:center;gap:8px;
      cursor:pointer;position:relative;overflow:hidden;border:none;
      background:linear-gradient(135deg,#6337ff 0%,#a855f7 50%,#ec4899 100%);
      background-size:200% 200%;
      box-shadow:0 0 25px rgba(99,55,255,0.45),0 4px 16px rgba(0,0,0,0.4);
      transition:all 0.3s;animation:btn-shimmer 3s ease infinite;
    }
    @keyframes btn-shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    .btn-save::before {
      content:'';position:absolute;inset:0;
      background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%);
      transform:translateX(-100%);transition:transform 0.5s;
    }
    .btn-save:hover::before { transform:translateX(100%); }
    .btn-save:hover:not(:disabled) { box-shadow:0 0 40px rgba(99,55,255,0.65),0 6px 24px rgba(0,0,0,0.5);transform:translateY(-1px); }
    .btn-save:active:not(:disabled) { transform:scale(0.97); }
    .btn-save:disabled { opacity:0.35;cursor:not-allowed;box-shadow:none;animation:none; }

    .secondary-row { display:flex;gap:8px; }
    .btn-remove,.btn-cancel { flex:1;padding:10px;border-radius:12px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;border:none; }
    .btn-remove { background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#fca5a5; }
    .btn-remove:hover:not(:disabled) { background:rgba(239,68,68,0.18);border-color:rgba(239,68,68,0.4);color:#fff; }
    .btn-remove:disabled { opacity:0.4;cursor:not-allowed; }
    .btn-cancel { background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5); }
    .btn-cancel:hover { background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.85); }

    .spinner { width:15px;height:15px;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0; }
  `]
})
export class AvatarUploadComponent implements OnInit, OnDestroy {
  currentAvatar = input<string | null | undefined>(null);
  currentOriginalAvatar = input<string | null | undefined>(null);
  currentCrop = input<{panX: number, panY: number, zoom: number} | null | undefined>(null);
  employeeId    = input<string | null | undefined>(null);

  close  = output<void>();
  saved  = output<string | null>();

  private auth            = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private toast           = inject(ToastService);
  private translate       = inject(TranslateService);
  private destroyRef      = inject(DestroyRef);

  // Existing / final photo
  preview   = signal<string | null>(null);

  // Crop mode state
  rawPhotoSrc = signal<string | null>(null);
  panX        = signal(0);
  panY        = signal(0);
  zoom        = signal(1);
  natW        = signal(0);
  natH        = signal(0);

  // UI state
  isPanning   = signal(false);
  fileDragging = signal(false);
  shimmer     = signal(false);
  imgLoaded   = signal(false);
  saving      = signal(false);
  error       = signal<string | null>(null);

  hasContent  = computed(() => !!this.rawPhotoSrc() || !!this.preview());

  // Computed CSS transform for the pan image
  imgTransform = computed(() => {
    if (!this.imgLoaded() || !this.natW() || !this.natH()) return '';
    const coverScale = Math.max(210 / this.natW(), 210 / this.natH());
    const totalScale = coverScale * this.zoom();
    const tx = 105 + this.panX() - (this.natW() * totalScale) / 2;
    const ty = 105 + this.panY() - (this.natH() * totalScale) / 2;
    return `translate(${tx}px, ${ty}px) scale(${totalScale})`;
  });

  private _blobUrl: string | null = null;
  private _dragging = false;
  private _lastX = 0;
  private _lastY = 0;
  private _originalBase64: string | null = null;

  ngOnInit() {
    if (this.currentAvatar()) {
      this.preview.set(this.currentAvatar()!);
      if (this.currentOriginalAvatar()) {
        this._originalBase64 = this.currentOriginalAvatar()!;
      }
    }
  }

  ngOnDestroy() {
    this.revokeBlobUrl();
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.close.emit(); }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as Element).classList.contains('avatar-backdrop')) this.close.emit();
  }

  // ── File drag-and-drop (onto the circle) ──────────────────
  onFileDragOver(e: DragEvent)  { e.preventDefault(); e.stopPropagation(); this.fileDragging.set(true); }
  onFileDragLeave()              { this.fileDragging.set(false); }
  onFileDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    this.fileDragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.loadFileForCropping(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.loadFileForCropping(file);
    (e.target as HTMLInputElement).value = '';
  }

  private loadFileForCropping(file: File) {
    this.error.set(null);
    if (!file.type.startsWith('image/')) {
      this.error.set(this.translate.instant('avatar.error_type')); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set(this.translate.instant('avatar.error_size')); return;
    }
    this.revokeBlobUrl();
    this._blobUrl = URL.createObjectURL(file);
    this.rawPhotoSrc.set(this._blobUrl);
    this.preview.set(null);
    this.panX.set(0); this.panY.set(0); this.zoom.set(1);
    this.imgLoaded.set(false);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this._originalBase64 = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  adjustExisting(e: Event) {
    e.stopPropagation();
    const origUrl = this.currentOriginalAvatar();
    if (!origUrl) return;
    this.rawPhotoSrc.set(origUrl);
    this.preview.set(null);
    const crop = this.currentCrop();
    if (crop) {
      this.panX.set(crop.panX || 0);
      this.panY.set(crop.panY || 0);
      this.zoom.set(crop.zoom || 1);
    } else {
      this.resetCrop();
    }
    this.imgLoaded.set(false);
  }

  onImgLoad(e: Event) {
    const img = e.target as HTMLImageElement;
    this.natW.set(img.naturalWidth);
    this.natH.set(img.naturalHeight);
    this.imgLoaded.set(true);
    this.applyPan(this.panX(), this.panY());
    this.shimmer.set(true);
    setTimeout(() => this.shimmer.set(false), 800);
  }

  // ── Pan (drag) ────────────────────────────────────────────
  onPanStart(e: PointerEvent) {
    if (!this.rawPhotoSrc()) return;
    e.preventDefault();
    this._dragging = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.isPanning.set(true);
  }

  onPanMove(e: PointerEvent) {
    if (!this._dragging) return;
    e.preventDefault();
    const dx = e.clientX - this._lastX;
    const dy = e.clientY - this._lastY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this.applyPan(this.panX() + dx, this.panY() + dy);
  }

  onPanEnd() {
    this._dragging = false;
    this.isPanning.set(false);
  }

  // ── Zoom ──────────────────────────────────────────────────
  onWheel(e: WheelEvent) {
    if (!this.rawPhotoSrc()) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    this.applyZoom(this.zoom() + delta);
  }

  onZoomSlider(e: Event) {
    this.applyZoom(parseFloat((e.target as HTMLInputElement).value));
  }

  stepZoom(delta: number) {
    this.applyZoom(this.zoom() + delta);
  }

  resetCrop() {
    this.panX.set(0); this.panY.set(0); this.zoom.set(1);
  }

  private applyZoom(z: number) {
    const clamped = Math.max(1, Math.min(3, z));
    this.zoom.set(clamped);
    this.applyPan(this.panX(), this.panY()); // re-clamp pan after zoom
  }

  // Max pan ensures the image always covers the circle
  private applyPan(x: number, y: number) {
    if (!this.imgLoaded() || !this.natW() || !this.natH()) {
      this.panX.set(x);
      this.panY.set(y);
      return;
    }
    const coverScale = Math.max(210 / this.natW(), 210 / this.natH());
    const totalScale = coverScale * this.zoom();
    const rw = this.natW() * totalScale;
    const rh = this.natH() * totalScale;
    const maxX = Math.max(0, rw / 2 - 105);
    const maxY = Math.max(0, rh / 2 - 105);
    this.panX.set(Math.max(-maxX, Math.min(maxX, x)));
    this.panY.set(Math.max(-maxY, Math.min(maxY, y)));
  }

  // ── Save ──────────────────────────────────────────────────
  async save() {
    if (this.saving()) return;
    let avatarUrl: string | null = null;

    if (this.rawPhotoSrc()) {
      try { avatarUrl = await this.cropToCanvas(); }
      catch { this.error.set(this.translate.instant('avatar.error_save')); return; }
    } else {
      avatarUrl = this.preview();
    }
    if (!avatarUrl) return;

    this.saving.set(true);
    
    const cropParams = this.rawPhotoSrc() ? {
      panX: this.panX(),
      panY: this.panY(),
      zoom: this.zoom()
    } : undefined;

    this.persist(avatarUrl, this._originalBase64, cropParams).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.persist(null, null, null).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  // ── Canvas crop ───────────────────────────────────────────
  private cropToCanvas(): Promise<string> {
    return new Promise((resolve, reject) => {
      const src = this.rawPhotoSrc();
      if (!src) { reject('No source'); return; }

      const img = new Image();
      img.onload = () => {
        const outputSize = 300;
        const containerSize = 210;
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d')!;

        const nw = img.naturalWidth;
        const nh = img.naturalHeight;

        // Scale needed so the image covers the 210×210 container at zoom=1
        const coverScale = Math.max(containerSize / nw, containerSize / nh);
        // Total rendering scale (cover + user zoom)
        const totalScale = coverScale * this.zoom();

        // Source rect in image pixels corresponding to the visible 210×210 circle
        const sx = -(105 + this.panX()) / totalScale + nw / 2;
        const sy = -(105 + this.panY()) / totalScale + nh / 2;
        const sw = containerSize / totalScale;

        ctx.drawImage(img, sx, sy, sw, sw, 0, 0, outputSize, outputSize);

        this.revokeBlobUrl();
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject('Image load failed');
      img.src = src;
    });
  }

  private persist(avatarUrl: string | null, avatarOriginalUrl?: string | null, avatarCrop?: any): Observable<any> {
    const empId = this.employeeId();
    const payload = { avatarUrl, avatarOriginalUrl, avatarCrop };
    if (empId) return this.employeeService.updateEmployee(empId, payload as any);
    return this.auth.updateAvatar(payload);
  }

  private revokeBlobUrl() {
    if (this._blobUrl) { URL.revokeObjectURL(this._blobUrl); this._blobUrl = null; }
  }
}
