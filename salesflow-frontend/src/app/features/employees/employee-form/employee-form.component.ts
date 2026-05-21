import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, computed, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '@core/services/employee.service';
import { TeamService } from '@core/services/team.service';
import { ThemeService } from '@core/services/theme.service';
import { InputComponent } from '@shared/components/input/input.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronLeft, heroCheck, heroArrowUpTray, heroTrash, heroCamera } from '@ng-icons/heroicons/outline';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, NgIconComponent, TranslateModule],
  providers: [
    provideIcons({ heroChevronLeft, heroCheck, heroArrowUpTray, heroTrash, heroCamera })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
            <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
          </button>
          <h1 class="text-3xl font-display font-bold text-sf-text">
            {{ isEditMode() ? ('employee.form.edit_title' | translate) : ('employee.form.add_title' | translate) }}
          </h1>
        </div>
        <div class="flex flex-col items-end gap-1">
          <button (click)="submit()" [disabled]="isSubmitting()" 
                  class="btn btn-primary px-8 flex items-center gap-2">
            <ng-icon *ngIf="!isSubmitting()" name="heroCheck"></ng-icon>
            <span *ngIf="isSubmitting()" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ isSubmitting() ? ('common.saving' | translate) : ('employee.form.save_btn' | translate) }}</span>
          </button>
          <p *ngIf="form.invalid && form.touched" class="text-[10px] text-sf-error font-bold">يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح.</p>
        </div>
      </header>

      <!-- Global Error Message -->
      <div *ngIf="errorMessage()" class="p-4 bg-sf-error/10 border border-sf-error/30 rounded-2xl flex items-center gap-3 text-sf-error animate-fade-in">
        <div class="w-2 h-2 bg-sf-error rounded-full animate-pulse"></div>
        <p class="text-sm font-bold">{{ errorMessage() }}</p>
      </div>

      <form *ngIf="!isLoading(); else skeleton" [formGroup]="form" class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-8">

        <!-- ── Avatar Upload ──────────────────────────────────── -->
        <section class="space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">{{ 'employee.form.avatar_section' | translate }}</h3>
            <span class="text-[10px] font-bold text-sf-muted bg-sf-surface border border-sf-border px-2 py-0.5 rounded-full">{{ 'common.optional' | translate }}</span>
          </div>

          @if (rawPhotoSrc()) {
            <!-- ── INLINE CROP EDITOR: full image visible, circular mask shows crop area ── -->
            <div class="space-y-4">

              <!-- Full-width crop viewport -->
              <div #cropContainerEl
                   class="relative w-full rounded-2xl overflow-hidden border border-sf-primary/30 select-none"
                   style="height:300px;background:#0c0a14;touch-action:none;"
                   [style.cursor]="cropPanning() ? 'grabbing' : 'grab'"
                   (pointerdown)="onCropPanStart($event)"
                   (pointermove)="onCropPanMove($event)"
                   (pointerup)="onCropPanEnd()"
                   (pointercancel)="onCropPanEnd()"
                   (wheel)="onCropWheel($event)">

                <!-- The full image, panned & zoomed -->
                <img [src]="rawPhotoSrc()"
                     style="position:absolute;top:0;left:0;transform-origin:0 0;pointer-events:none;user-select:none;transition:opacity 0.3s"
                     [style.opacity]="cropImgLoaded() ? '1' : '0'"
                     [style.transform]="cropImgTransform()"
                     (load)="onCropImgLoad($event)" />

                <!-- Dark overlay with circular hole — shows exactly what will be cropped -->
                <div class="absolute inset-0 pointer-events-none transition-none"
                     [style.background]="cropOverlayBg()"></div>

                <!-- Crop circle border (always exactly 210px = final avatar size) -->
                <div class="absolute pointer-events-none rounded-full"
                     style="width:210px;height:210px;transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 0 1px rgba(255,255,255,0.15),0 2px 16px rgba(0,0,0,0.5)"
                     [style.left.px]="cropCenterX()"
                     [style.top.px]="cropCenterY()">
                  <!-- Rule-of-thirds grid inside crop circle (shown while dragging) -->
                  <div style="position:absolute;inset:0;overflow:hidden;border-radius:50%">
                    <div style="position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;transition:opacity 0.15s"
                         [style.opacity]="cropPanning() ? '1' : '0'">
                      <div style="grid-column:1/-1;border-bottom:1px solid rgba(255,255,255,0.35)"></div>
                      <div style="grid-column:1/-1;border-bottom:1px solid rgba(255,255,255,0.35)"></div>
                      <div style="border-right:1px solid rgba(255,255,255,0.35);grid-row:1/-1"></div>
                      <div style="border-right:1px solid rgba(255,255,255,0.35);grid-row:1/-1"></div>
                    </div>
                  </div>
                </div>

                <!-- Hint (fades out while dragging) -->
                <div class="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none transition-opacity duration-200"
                     [style.opacity]="cropPanning() ? '0' : '1'">
                  <span class="px-3 py-1 rounded-full text-[10px] font-semibold text-white/60"
                        style="background:rgba(0,0,0,0.45);backdrop-filter:blur(4px)">
                    {{ 'avatar.drag_hint' | translate }}
                  </span>
                </div>
              </div>

              <!-- Zoom row -->
              <div class="flex items-center gap-3 w-full max-w-[280px] mx-auto">
                <button type="button" (click)="stepCropZoom(-0.15)"
                        class="w-8 h-8 rounded-lg bg-sf-surface border border-sf-border flex items-center justify-center text-sf-muted hover:text-sf-text hover:border-sf-primary/50 transition-all flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="w-3.5 h-3.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <div class="relative flex-1 h-1.5 rounded-full bg-sf-border">
                  <div class="absolute top-0 left-0 h-full rounded-full bg-sf-primary transition-[width]" [style.width.%]="(cropZoom() - 1) / 2 * 100"></div>
                  <input type="range" min="1" max="3" step="0.01" [value]="cropZoom()" (input)="onCropZoomSlider($event)"
                         style="-webkit-appearance:none;appearance:none"
                         class="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0" />
                </div>
                <button type="button" (click)="stepCropZoom(0.15)"
                        class="w-8 h-8 rounded-lg bg-sf-surface border border-sf-border flex items-center justify-center text-sf-muted hover:text-sf-text hover:border-sf-primary/50 transition-all flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="w-3.5 h-3.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-3 flex-wrap justify-center">
                <button type="button" (click)="resetCropPosition()"
                        class="px-4 py-2 rounded-xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-text text-xs font-bold flex items-center gap-1.5 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                  </svg>
                  {{ 'avatar.reset' | translate }}
                </button>
                <button type="button" (click)="cancelCrop()"
                        class="px-4 py-2 rounded-xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-text text-xs font-bold transition-all">
                  {{ 'avatar.cancel' | translate }}
                </button>
                <button type="button" (click)="confirmCrop()"
                        class="px-4 py-2 rounded-xl bg-sf-primary text-white font-bold text-xs flex items-center gap-1.5 transition-all hover:bg-sf-primary/90">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ 'avatar.crop_save' | translate }}
                </button>
              </div>
            </div>

          } @else {
            <!-- ── PREVIEW / UPLOAD ── -->
            <div class="flex items-center gap-6">
              <div
                (dragover)="onAvatarDragOver($event)"
                (dragleave)="isDraggingAvatar.set(false)"
                (drop)="onAvatarDrop($event)"
                (click)="avatarFileInput.click()"
                class="relative w-24 h-24 rounded-2xl flex-shrink-0 cursor-pointer group transition-all duration-200 select-none"
                [class.ring-2]="isDraggingAvatar()"
                [class.ring-sf-primary]="isDraggingAvatar()"
                [class.scale-105]="isDraggingAvatar()">

                @if (avatarPreview()) {
                  <img [src]="avatarPreview()!"
                       class="w-full h-full rounded-2xl object-cover border border-sf-border/40 shadow-md" />
                  <div class="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100
                               flex items-center justify-center transition-opacity duration-200">
                    <ng-icon name="heroCamera" class="text-white text-xl"></ng-icon>
                  </div>
                } @else {
                  <div class="w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all duration-200"
                       [class.border-sf-primary]="isDraggingAvatar()"
                       [class.bg-sf-primary/5]="isDraggingAvatar()"
                       [class.border-sf-border]="!isDraggingAvatar()"
                       [class.bg-sf-surface]="!isDraggingAvatar()">
                    <ng-icon name="heroArrowUpTray" class="text-sf-muted text-xl group-hover:text-sf-primary transition-colors"></ng-icon>
                    <span class="text-[9px] font-bold text-sf-muted group-hover:text-sf-primary transition-colors text-center leading-tight px-1">
                      {{ isDraggingAvatar() ? ('avatar.drop_here' | translate) : ('avatar.drag_here' | translate) }}
                    </span>
                  </div>
                }
              </div>

              <div class="flex-1 space-y-3">
                <div>
                  <p class="text-sm font-bold text-sf-text">{{ avatarPreview() ? ('employee.form.avatar_selected' | translate) : ('employee.form.avatar_choose' | translate) }}</p>
                  <p class="text-[11px] text-sf-muted mt-0.5">{{ 'avatar.format_hint' | translate }}</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" (click)="avatarFileInput.click()"
                          class="px-4 py-2 rounded-xl bg-sf-primary/10 hover:bg-sf-primary/20 border border-sf-primary/20
                                 text-sf-primary font-bold text-xs transition-all flex items-center gap-1.5">
                    <ng-icon name="heroArrowUpTray" class="text-sm"></ng-icon>
                    {{ avatarPreview() ? ('employee.form.avatar_change' | translate) : ('employee.form.avatar_choose_btn' | translate) }}
                  </button>

                  @if (avatarPreview()) {
                    <button type="button" (click)="adjustCrop()"
                            class="px-4 py-2 rounded-xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-text font-bold text-xs transition-all flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/>
                        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                      </svg>
                      {{ 'avatar.adjust' | translate }}
                    </button>
                    <button type="button" (click)="removeAvatar()"
                            class="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs transition-all flex items-center gap-1.5">
                      <ng-icon name="heroTrash" class="text-sm"></ng-icon>
                      {{ 'common.delete' | translate }}
                    </button>
                  }
                </div>

                @if (avatarError()) {
                  <p class="text-xs font-bold text-sf-error">{{ avatarError() }}</p>
                }
              </div>
            </div>
          }

          <input #avatarFileInput type="file" accept="image/jpeg,image/png,image/webp"
                 class="hidden" (change)="onAvatarFileSelected($event)" />
        </section>

        <!-- Identity -->
        <section class="space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">الهوية الشخصية</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الاسم الكامل</label>
              <app-input formControlName="name" placeholder="مثال: أحمد محمد" 
                         [hasError]="isInvalid('name')"
                         errorMessage="الاسم الكامل مطلوب"
                         hint="يرجى كتابة الاسم كما هو في البطاقة الشخصية"></app-input>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">كود الموظف (اختياري)</label>
              <app-input formControlName="code" placeholder="مثال: 125" 
                         hint="اتركه فارغاً للتوليد التلقائي، أو اكتب رقماً وسيقوم النظام بتحويله تلقائياً لصيغة EMP-0125"></app-input>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الرقم القومي</label>
              <app-input formControlName="nationalId" placeholder="14 رقم"
                         [hasError]="isInvalid('nationalId')"
                         errorMessage="يرجى إدخال 14 رقماً صحيحاً"
                         hint="تأكد من إدخال 14 رقماً صحيحاً"></app-input>
            </div>
          </div>
        </section>

        <!-- Professional -->
        <section class="space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">التفاصيل المهنية</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">القسم</label>
              <select formControlName="department" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text h-[42px] focus:ring-2 focus:ring-sf-primary/50 outline-none">
                <option value="Sales">المبيعات</option>
                <option value="Operations">العمليات</option>
                <option value="Marketing">التسويق</option>
                <option value="Finance">المالية</option>
                <option value="IT">تكنولوجيا المعلومات</option>
                <option value="HR">الموارد البشرية</option>
                <option value="TopManagement">الإدارة العليا</option>
              </select>
              <p class="text-[10px] text-sf-muted mr-1">القسم الوظيفي التابع له الموظف</p>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المسمى الوظيفي</label>
              <app-input formControlName="jobTitle" placeholder="مثال: مسؤول مبيعات"
                         [hasError]="isInvalid('jobTitle')"
                         errorMessage="المسمى الوظيفي مطلوب"
                         hint="المسمى المعتمد في العقد"></app-input>
            </div>
            <div class="space-y-2" *ngIf="department() === 'Sales'">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستوى الوظيفي</label>
              <select formControlName="seniorityLevel" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text h-[42px] focus:ring-2 focus:ring-sf-primary/50 outline-none">
                <option value="Fresh">مبتدئ (Fresh)</option>
                <option value="BA">مساعد (BA)</option>
                <option value="BC">استشاري (BC)</option>
                <option value="Senior">سينيور (Senior)</option>
                <option value="SV">مشرف (SV)</option>
                <option value="TeamLeader">قائد فريق</option>
                <option value="SalesManager">مدير مبيعات</option>
              </select>
              <p class="text-[10px] text-sf-muted mr-1">يحدد صلاحيات الموظف في النظام</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2" *ngIf="department() === 'Sales'">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستهدف الربعي (ج.م)</label>
              <app-input type="number" formControlName="target" placeholder="0.00" [isAccounting]="true"
                         [hint]="getTargetHint()"></app-input>
            </div>
            <div class="space-y-2" [class.md:col-span-2]="department() !== 'Sales'">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">تاريخ التعيين</label>
              <app-input type="date" formControlName="hireDate"
                         [hasError]="isInvalid('hireDate')"
                         errorMessage="تاريخ التعيين مطلوب"
                         hint="تاريخ بدء العمل الفعلي"></app-input>
            </div>
          </div>

          <div *ngIf="isEditMode()" class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-sf-border/30 animate-fade-in">
            <div class="flex items-center gap-3 p-4 rounded-2xl bg-sf-surface border border-sf-border">
              <input type="checkbox" formControlName="isActive" id="isActiveCheck"
                     class="w-5 h-5 rounded-lg border-sf-border text-sf-primary focus:ring-sf-primary cursor-pointer">
              <label for="isActiveCheck" class="text-sm font-bold text-sf-text cursor-pointer">الموظف على رأس العمل (نشط)</label>
            </div>
            <div *ngIf="!form.get('isActive')?.value" class="space-y-2 animate-fade-in">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">تاريخ انتهاء العمل (المغادرة)</label>
              <app-input type="date" formControlName="endDate"
                         hint="آخر يوم عمل فعلي للموظف"></app-input>
            </div>
          </div>
        </section>

        <!-- Contact -->
        <section class="space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">معلومات الاتصال</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">البريد الإلكتروني للعمل</label>
              <app-input type="email" formControlName="email" placeholder="email@fairdirection.com"
                         [hasError]="isInvalid('email')"
                         errorMessage="يرجى إدخال بريد إلكتروني صالح"
                         hint="سيتم استخدامه لتسجيل الدخول"></app-input>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">رقم الهاتف</label>
              <app-input formControlName="phone" placeholder="01XXXXXXXXX"
                         [hasError]="isInvalid('phone')"
                         errorMessage="يرجى إدخال رقم هاتف صحيح"
                         hint="يفضل رقم الواتساب للتواصل"></app-input>
            </div>
          </div>
        </section>

        <!-- Organizational Assignment (Teams) -->
        <section *ngIf="department() === 'Sales'" class="space-y-6 animate-fade-in">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">إسناد الفريق وإدارة المبيعات</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Regular Seller Team Dropdown -->
            <div *ngIf="isRegularSeller()" class="space-y-2 md:col-span-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الفريق الحالي</label>
              <select formControlName="currentTeamId" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text h-[42px] focus:ring-2 focus:ring-sf-primary/50 outline-none">
                <option [ngValue]="null">لا ينتمي لأي فريق</option>
                <option *ngFor="let team of regularTeams()" [value]="team._id">
                  {{ team.name }} (قائد الفريق: {{ team.teamLeaderId?.name || 'غير معين' }})
                </option>
              </select>
              <p class="text-[10px] text-sf-muted mr-1">الفريق الذي سينضم إليه مسؤول المبيعات الحالي</p>
            </div>

            <!-- Team Leader's Sales Manager Dropdown -->
            <div *ngIf="seniorityLevel() === 'TeamLeader'" class="space-y-2 md:col-span-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">مدير المبيعات المشرف (المدير المباشر)</label>
              <select formControlName="managerId" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text h-[42px] focus:ring-2 focus:ring-sf-primary/50 outline-none">
                <option *ngIf="salesManagers().length === 0" [value]="ceoEmployee()?._id || '69f60230c2120b7ce02988dd'">
                  المدير العام ({{ ceoEmployee()?.name || 'الإدارة العليا' }})
                </option>
                <option *ngFor="let mgr of salesManagers()" [value]="mgr._id">
                  {{ mgr.name }} (كود: {{ mgr.code || 'بدون كود' }})
                </option>
              </select>
              <p class="text-[10px] text-sf-muted mr-1">مدير المبيعات الذي يتبعه قائد الفريق الحالي</p>
            </div>

            <!-- Team Leader's Team Members Multi-select Cards -->
            <div *ngIf="seniorityLevel() === 'TeamLeader'" class="space-y-4 col-span-full">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">أعضاء الفريق (مسؤولو المبيعات النشطون)</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <div *ngFor="let member of unassignedSellers()" (click)="toggleTeamMember(member._id)"
                     class="p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group"
                     [class.bg-sf-primary/10]="isTeamMemberSelected(member._id)"
                     [class.border-sf-primary/50]="isTeamMemberSelected(member._id)"
                     [class.border-sf-border]="!isTeamMemberSelected(member._id)"
                     [class.bg-sf-surface]="!isTeamMemberSelected(member._id)">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-sf-border">
                      @if (member.avatarUrl) {
                        <img [src]="member.avatarUrl" class="w-full h-full object-cover" />
                      } @else {
                        <div class="w-full h-full bg-sf-bg flex items-center justify-center text-xs font-black text-sf-primary group-hover:bg-sf-primary group-hover:text-white transition-colors">
                          {{ member.name.charAt(0) }}
                        </div>
                      }
                    </div>
                    <div>
                      <span class="text-xs font-bold text-sf-text block">{{ member.name }}</span>
                      <span class="text-[9px] text-sf-muted block">الرتبة: {{ member.seniorityLevel }} (كود: {{ member.code || 'بدون كود' }})</span>
                      <span class="text-[10px] font-bold block mt-1" [class.text-sf-primary]="member.currentTeamId" [class.text-sf-muted]="!member.currentTeamId">
                        الفريق الحالي: {{ getEmployeeTeamName(member) }}
                      </span>
                    </div>
                  </div>
                  <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all"
                       [class.bg-sf-primary]="isTeamMemberSelected(member._id)"
                       [class.border-sf-primary]="isTeamMemberSelected(member._id)"
                       [class.border-sf-border]="!isTeamMemberSelected(member._id)">
                    <ng-icon *ngIf="isTeamMemberSelected(member._id)" name="heroCheck" class="text-white text-xs"></ng-icon>
                  </div>
                </div>
                <div *ngIf="unassignedSellers().length === 0" class="col-span-full py-8 text-center border-2 border-dashed border-sf-border rounded-2xl bg-sf-surface/20">
                  <p class="text-xs font-bold text-sf-muted uppercase tracking-widest">لا يوجد مسؤولو مبيعات متاحين للإضافة حالياً</p>
                </div>
              </div>
            </div>

            <!-- Sales Manager Managed Teams Multi-select Cards -->
            <div *ngIf="isSalesManager()" class="space-y-4 col-span-full">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الفرق الخاضعة لإدارة هذا المدير</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <div *ngFor="let team of regularTeams()" (click)="toggleManagedTeam(team._id)"
                     class="p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group"
                     [class.bg-sf-primary/10]="isManagedTeamSelected(team._id)"
                     [class.border-sf-primary/50]="isManagedTeamSelected(team._id)"
                     [class.border-sf-border]="!isManagedTeamSelected(team._id)"
                     [class.bg-sf-surface]="!isManagedTeamSelected(team._id)">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-sf-bg border border-sf-border flex items-center justify-center text-xs font-black text-sf-primary group-hover:bg-sf-primary group-hover:text-white transition-colors">
                      {{ team.name.charAt(0) }}
                    </div>
                    <div>
                      <span class="text-xs font-bold text-sf-text block">{{ team.name }}</span>
                      <span class="text-[9px] text-sf-muted block">قائد الفريق: {{ team.teamLeaderId?.name || 'غير معين' }}</span>
                    </div>
                  </div>
                  <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all"
                       [class.bg-sf-primary]="isManagedTeamSelected(team._id)"
                       [class.border-sf-primary]="isManagedTeamSelected(team._id)"
                       [class.border-sf-border]="!isManagedTeamSelected(team._id)">
                    <ng-icon *ngIf="isManagedTeamSelected(team._id)" name="heroCheck" class="text-white text-xs"></ng-icon>
                  </div>
                </div>
                <div *ngIf="regularTeams().length === 0" class="col-span-full py-8 text-center border-2 border-dashed border-sf-border rounded-2xl bg-sf-surface/20">
                  <p class="text-xs font-bold text-sf-muted uppercase tracking-widest">لا يوجد فرق مبيعات نشطة حالياً</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>

      <ng-template #skeleton>
        <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-12 animate-pulse">
          <div class="h-8 w-48 bg-sf-surface skeleton rounded-lg"></div>
          <div class="grid grid-cols-2 gap-8">
            <div class="h-16 bg-sf-surface skeleton rounded-xl" *ngFor="let i of [1,2,3,4,5,6]"></div>
          </div>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class EmployeeFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);
  private teamService = inject(TeamService);
  private cdr = inject(ChangeDetectorRef);
  private themeService = inject(ThemeService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  errorMessage = signal<string | null>(null);
  employeeId: string | null = null;

  // Avatar upload state
  avatarPreview    = signal<string | null>(null);
  isDraggingAvatar = signal(false);
  avatarError      = signal<string | null>(null);

  // Inline crop state
  rawPhotoSrc   = signal<string | null>(null);
  cropPanX      = signal(0);
  cropPanY      = signal(0);
  cropZoom      = signal(1);
  cropNatW      = signal(0);
  cropNatH      = signal(0);
  cropImgLoaded = signal(false);
  cropPanning   = signal(false);
  cropCenterX   = signal(300);
  cropCenterY   = signal(150);

  // Image moves so its center (+ pan offset) sits on the crop circle center
  cropImgTransform = computed(() => {
    if (!this.cropImgLoaded() || !this.cropNatW() || !this.cropNatH()) return '';
    const cs = Math.max(210 / this.cropNatW(), 210 / this.cropNatH());
    const ts = cs * this.cropZoom();
    const tx = this.cropCenterX() + this.cropPanX() - (this.cropNatW() * ts) / 2;
    const ty = this.cropCenterY() + this.cropPanY() - (this.cropNatH() * ts) / 2;
    return `translate(${tx}px, ${ty}px) scale(${ts})`;
  });

  // Dark overlay with a circular hole at the crop circle center (radius 105px)
  cropOverlayBg = computed(() => {
    const cx = this.cropCenterX(), cy = this.cropCenterY();
    return `radial-gradient(circle at ${cx}px ${cy}px, transparent 104px, rgba(0,0,0,0.62) 105.5px)`;
  });

  @ViewChild('cropContainerEl') cropContainerEl?: ElementRef<HTMLDivElement>;

  private _cropBlobUrl:    string | null = null;
  private _cropDragging  = false;
  private _cropLastX     = 0;
  private _cropLastY     = 0;
  private _origBase64:   string | null = null;
  private _savedCrop     = { panX: 0, panY: 0, zoom: 1 };

  teams = signal<any[]>([]);
  salesEmployees = signal<any[]>([]);
  ceoEmployee = signal<any | null>(null);
  department = signal('Sales');
  seniorityLevel = signal('Fresh');

  salesManagers = computed(() => {
    return this.salesEmployees().filter(emp => emp.seniorityLevel === 'SalesManager');
  });

  currentTeamLeaderMembers = computed(() => {
    const tlTeam = this.teams().find(t => t.teamLeaderId?._id === this.employeeId);
    return tlTeam ? tlTeam.memberIds || [] : [];
  });

  unassignedSellers = computed(() => {
    return this.salesEmployees().filter(emp => 
      ['Fresh', 'BA', 'BC', 'Senior', 'SV'].includes(emp.seniorityLevel) && emp.isActive
    );
  });

  isRegularSeller = computed(() => {
    if (this.department() !== 'Sales') return false;
    return ['Fresh', 'BA', 'BC', 'Senior', 'SV'].includes(this.seniorityLevel());
  });

  isSalesManager = computed(() => {
    return this.department() === 'Sales' && this.seniorityLevel() === 'SalesManager';
  });

  regularTeams = computed(() => {
    return this.teams().filter(t => t.teamLeaderId?.seniorityLevel === 'TeamLeader' || !t.teamLeaderId?.seniorityLevel);
  });

  ngOnInit() {
    this.initForm();
    this.loadCeo();
    this.checkEditMode();
    this.loadTeams();
    this.loadSalesEmployees();
  }

  loadCeo() {
    this.employeeService.getEmployees({ department: 'TopManagement', isActive: 'true' }).subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          const ceo = res.data[0];
          this.ceoEmployee.set(ceo);
          const currentManagerId = this.form.get('managerId')?.value;
          if (currentManagerId === '69f60230c2120b7ce02988dd' || !currentManagerId) {
            this.form.get('managerId')?.setValue(ceo._id);
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading CEO:', err)
    });
  }

  loadSalesEmployees() {
    this.employeeService.getSalesEmployees().subscribe({
      next: (res) => {
        if (res.success) {
          this.salesEmployees.set(res.data);
          // Auto-assign first Sales Manager to TeamLeader if adding new
          if (!this.isEditMode() && this.form.get('seniorityLevel')?.value === 'TeamLeader') {
            const managers = this.salesManagers();
            if (managers.length > 0) {
              this.form.get('managerId')?.setValue(managers[0]._id);
            } else if (this.ceoEmployee()) {
              this.form.get('managerId')?.setValue(this.ceoEmployee()._id);
            }
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading sales employees:', err)
    });
  }

  loadTeams() {
    this.teamService.getTeams().subscribe({
      next: (res) => {
        if (res.success) {
          this.teams.set(res.data);
          this.syncSalesManagerTeams();
          this.syncTeamLeaderMembers();
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading teams:', err)
    });
  }

  getEmployeeTeamName(emp: any): string {
    if (!emp.currentTeamId) return 'بدون فريق';
    if (typeof emp.currentTeamId === 'object') {
      return emp.currentTeamId.name || 'بدون فريق';
    }
    const team = this.teams().find(t => t._id === emp.currentTeamId);
    return team ? team.name : 'بدون فريق';
  }

  syncSalesManagerTeams() {
    const dept = this.form?.get('department')?.value;
    const seniority = this.form?.get('seniorityLevel')?.value;
    if (this.isEditMode() && dept === 'Sales' && seniority === 'SalesManager') {
      const smTeam = this.teams().find(t => t.teamLeaderId?._id === this.employeeId);
      if (smTeam) {
        const tlIds = smTeam.memberIds.map((m: any) => m._id || m);
        const selectedTeamIds = this.teams()
          .filter(t => t.teamLeaderId && tlIds.includes(t.teamLeaderId._id))
          .map(t => t._id);
        this.form.patchValue({ managedTeamIds: selectedTeamIds });
      }
    }
  }

  isManagedTeamSelected(teamId: string): boolean {
    const selected = this.form.get('managedTeamIds')?.value || [];
    return selected.includes(teamId);
  }

  toggleManagedTeam(teamId: string) {
    const selected = [...(this.form.get('managedTeamIds')?.value || [])];
    const index = selected.indexOf(teamId);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(teamId);
    }
    this.form.get('managedTeamIds')?.setValue(selected);
    this.form.get('managedTeamIds')?.markAsDirty();
  }

  syncTeamLeaderMembers() {
    const dept = this.form?.get('department')?.value;
    const seniority = this.form?.get('seniorityLevel')?.value;
    if (this.isEditMode() && dept === 'Sales' && seniority === 'TeamLeader') {
      const tlTeam = this.teams().find(t => t.teamLeaderId?._id === this.employeeId);
      if (tlTeam) {
        const memberIds = tlTeam.memberIds.map((m: any) => m._id || m);
        this.form.patchValue({ teamMemberIds: memberIds });
      }
    }
  }

  isTeamMemberSelected(memberId: string): boolean {
    const selected = this.form.get('teamMemberIds')?.value || [];
    return selected.includes(memberId);
  }

  toggleTeamMember(memberId: string) {
    const selected = [...(this.form.get('teamMemberIds')?.value || [])];
    const index = selected.indexOf(memberId);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(memberId);
    }
    this.form.get('teamMemberIds')?.setValue(selected);
    this.form.get('teamMemberIds')?.markAsDirty();
  }

  private checkEditMode() {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode.set(true);
      this.isLoading.set(true);
      this.employeeService.getEmployee(this.employeeId, this.themeService.currentQuarter()).subscribe({
        next: (res) => {
          const emp = res.data;
          this.form.patchValue({
            name: emp.name,
            nationalId: emp.nationalId,
            department: emp.department,
            jobTitle: emp.jobTitle,
            seniorityLevel: emp.seniorityLevel,
            target: emp.target,
            hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '',
            isActive: emp.isActive !== false,
            endDate: emp.endDate ? new Date(emp.endDate).toISOString().split('T')[0] : '',
            email: emp.email,
            phone: emp.phone,
            code: emp.code,
            currentTeamId: emp.currentTeamId?._id || emp.currentTeamId || null,
            managerId: emp.managerId?._id || emp.managerId || this.ceoEmployee()?._id || '69f60230c2120b7ce02988dd',
            avatarUrl: emp.avatarUrl || null
          });
          if (emp.avatarUrl) {
            this.avatarPreview.set(emp.avatarUrl);
          }
          if (emp.avatarOriginalUrl) {
            this._origBase64 = emp.avatarOriginalUrl;
          }
          if (emp.avatarCrop) {
            this._savedCrop = { panX: emp.avatarCrop.panX || 0, panY: emp.avatarCrop.panY || 0, zoom: emp.avatarCrop.zoom || 1 };
          }
          this.department.set(emp.department || 'Sales');
          this.seniorityLevel.set(emp.seniorityLevel || 'Fresh');
          this.syncSalesManagerTeams();
          this.syncTeamLeaderMembers();
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
      name: ['', [Validators.required]],
      nationalId: ['', [Validators.required, Validators.pattern(/^[0-9]{14}$/)]],
      department: ['Sales', [Validators.required]],
      jobTitle: [''],
      seniorityLevel: ['Fresh'],
      target: [0],
      hireDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      isActive: [true],
      endDate: [''],
      email: ['', [Validators.email]],
      phone: [''],
      code: [''],
      managerId: [this.ceoEmployee()?._id || '69f60230c2120b7ce02988dd'], // General Manager / CEO
      currentTeamId: [null],
      managedTeamIds: [[]],
      teamMemberIds: [[]],
      avatarUrl: [null]
    });

    this.form.get('isActive')?.valueChanges.subscribe(active => {
      if (!active && !this.form.get('endDate')?.value) {
        this.form.get('endDate')?.setValue(new Date().toISOString().split('T')[0]);
      }
      this.cdr.markForCheck();
    });

    this.department.set(this.form.get('department')?.value || 'Sales');
    this.seniorityLevel.set(this.form.get('seniorityLevel')?.value || 'Fresh');

    // Handle conditional seniority level
    this.form.get('department')?.valueChanges.subscribe(dept => {
      this.department.set(dept || '');
      if (dept !== 'Sales') {
        this.form.get('seniorityLevel')?.setValue(null);
        this.form.get('target')?.setValue(0);
        this.form.get('currentTeamId')?.setValue(null);
        this.form.get('managedTeamIds')?.setValue([]);
      } else {
        this.form.get('seniorityLevel')?.setValue('Fresh');
      }
      this.cdr.markForCheck();
    });

    this.form.get('seniorityLevel')?.valueChanges.subscribe(val => {
      this.seniorityLevel.set(val || '');
      this.syncSalesManagerTeams();
      this.syncTeamLeaderMembers();

      // If changed to TeamLeader and managerId is still General Manager/CEO, set to first SalesManager if available
      const currentMgr = this.form.get('managerId')?.value;
      if (val === 'TeamLeader' && (currentMgr === '69f60230c2120b7ce02988dd' || currentMgr === this.ceoEmployee()?._id)) {
        const managers = this.salesManagers();
        if (managers.length > 0) {
          this.form.get('managerId')?.setValue(managers[0]._id);
        }
      }
      this.cdr.markForCheck();
    });
  }

  // ── Avatar upload ────────────────────────────────────────────────
  onAvatarDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingAvatar.set(true);
  }

  onAvatarDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingAvatar.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.processAvatarFile(file);
  }

  onAvatarFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processAvatarFile(file);
    (e.target as HTMLInputElement).value = '';
  }

  private processAvatarFile(file: File) {
    this.avatarError.set(null);
    if (!file.type.startsWith('image/')) {
      this.avatarError.set(this.translate.instant('avatar.error_type'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError.set(this.translate.instant('avatar.error_size'));
      return;
    }
    this.revokeCropBlobUrl();
    this._cropBlobUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = (ev) => { this._origBase64 = ev.target?.result as string; };
    reader.readAsDataURL(file);
    this.cropPanX.set(0); this.cropPanY.set(0); this.cropZoom.set(1);
    this._savedCrop = { panX: 0, panY: 0, zoom: 1 };
    this.cropImgLoaded.set(false);
    this.rawPhotoSrc.set(this._cropBlobUrl);
    setTimeout(() => this.measureCropContainer(), 0);
  }

  removeAvatar() {
    this.avatarPreview.set(null);
    this.form.get('avatarUrl')?.setValue(null);
    this.form.get('avatarUrl')?.markAsDirty();
    this.avatarError.set(null);
    this._origBase64 = null;
    this._savedCrop  = { panX: 0, panY: 0, zoom: 1 };
  }

  // ── Inline crop ──────────────────────────────────────────────────
  onCropImgLoad(e: Event) {
    const img = e.target as HTMLImageElement;
    this.cropNatW.set(img.naturalWidth);
    this.cropNatH.set(img.naturalHeight);
    this.cropImgLoaded.set(true);
    this.applyCropPan(this.cropPanX(), this.cropPanY());
  }

  onCropPanStart(e: PointerEvent) {
    e.preventDefault();
    this._cropDragging = true;
    this._cropLastX = e.clientX; this._cropLastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.cropPanning.set(true);
  }
  onCropPanMove(e: PointerEvent) {
    if (!this._cropDragging) return;
    e.preventDefault();
    this.applyCropPan(this.cropPanX() + e.clientX - this._cropLastX, this.cropPanY() + e.clientY - this._cropLastY);
    this._cropLastX = e.clientX; this._cropLastY = e.clientY;
  }
  onCropPanEnd() { this._cropDragging = false; this.cropPanning.set(false); }

  onCropWheel(e: WheelEvent) { e.preventDefault(); this.applyCropZoom(this.cropZoom() - e.deltaY * 0.001); }
  onCropZoomSlider(e: Event) { this.applyCropZoom(parseFloat((e.target as HTMLInputElement).value)); }
  stepCropZoom(d: number)    { this.applyCropZoom(this.cropZoom() + d); }
  resetCropPosition()        { this.cropPanX.set(0); this.cropPanY.set(0); this.cropZoom.set(1); }

  cancelCrop() { this.revokeCropBlobUrl(); this.rawPhotoSrc.set(null); }

  adjustCrop() {
    const src = this._origBase64 || this.avatarPreview();
    if (!src) return;
    this.rawPhotoSrc.set(src);
    this.cropPanX.set(this._savedCrop.panX);
    this.cropPanY.set(this._savedCrop.panY);
    this.cropZoom.set(this._savedCrop.zoom);
    this.cropImgLoaded.set(false);
    setTimeout(() => this.measureCropContainer(), 0);
  }

  private measureCropContainer() {
    const el = this.cropContainerEl?.nativeElement;
    if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w > 0 && h > 0) {
      this.cropCenterX.set(Math.round(w / 2));
      this.cropCenterY.set(Math.round(h / 2));
      this.applyCropPan(this.cropPanX(), this.cropPanY());
    }
  }

  confirmCrop() {
    const src = this.rawPhotoSrc();
    if (!src || !this.cropNatW() || !this.cropNatH()) return;
    const panX = this.cropPanX(), panY = this.cropPanY(), zoom = this.cropZoom();
    const nw = this.cropNatW(), nh = this.cropNatH();
    const output = 300, container = 210;
    const canvas = document.createElement('canvas');
    canvas.width = output; canvas.height = output;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const cs = Math.max(container / nw, container / nh);
      const ts = cs * zoom;
      const sx = -(105 + panX) / ts + nw / 2;
      const sy = -(105 + panY) / ts + nh / 2;
      const sw = container / ts;
      ctx.drawImage(img, sx, sy, sw, sw, 0, 0, output, output);
      const base64 = canvas.toDataURL('image/jpeg', 0.92);
      this.avatarPreview.set(base64);
      this.form.get('avatarUrl')?.setValue(base64);
      this.form.get('avatarUrl')?.markAsDirty();
      this._savedCrop = { panX, panY, zoom };
      this.revokeCropBlobUrl();
      this.rawPhotoSrc.set(null);
      this.cdr.markForCheck();
    };
    img.src = src;
  }

  private applyCropZoom(z: number) {
    this.cropZoom.set(Math.max(1, Math.min(3, z)));
    this.applyCropPan(this.cropPanX(), this.cropPanY());
  }

  private applyCropPan(x: number, y: number) {
    if (!this.cropImgLoaded() || !this.cropNatW() || !this.cropNatH()) {
      this.cropPanX.set(x); this.cropPanY.set(y); return;
    }
    const cs = Math.max(210 / this.cropNatW(), 210 / this.cropNatH());
    const ts = cs * this.cropZoom();
    const maxX = Math.max(0, this.cropNatW() * ts / 2 - 105);
    const maxY = Math.max(0, this.cropNatH() * ts / 2 - 105);
    this.cropPanX.set(Math.max(-maxX, Math.min(maxX, x)));
    this.cropPanY.set(Math.max(-maxY, Math.min(maxY, y)));
  }

  private revokeCropBlobUrl() {
    if (this._cropBlobUrl) { URL.revokeObjectURL(this._cropBlobUrl); this._cropBlobUrl = null; }
  }

  ngOnDestroy() { this.revokeCropBlobUrl(); }
  // ─────────────────────────────────────────────────────────────────

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack() {
    this.router.navigate(['/employees']);
  }

  submit() {
    if (this.form.invalid) {
      console.log('Form is invalid:', this.form.errors);
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          console.log(`Field ${key} is invalid:`, control.errors);
        }
      });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const data: any = { ...this.form.value };
    data.avatarOriginalUrl = this._origBase64 || null;
    data.avatarCrop        = { ...this._savedCrop };

    if (data.department !== 'Sales') {
      delete data.currentTeamId;
      delete data.managedTeamIds;
      delete data.teamMemberIds;
    } else {
      if (this.isRegularSeller()) {
        delete data.managedTeamIds;
        delete data.teamMemberIds;
      } else if (this.isSalesManager()) {
        delete data.currentTeamId;
        delete data.teamMemberIds;
      } else if (this.form.get('seniorityLevel')?.value === 'TeamLeader') {
        delete data.currentTeamId;
        delete data.managedTeamIds;
      } else {
        delete data.currentTeamId;
        delete data.managedTeamIds;
        delete data.teamMemberIds;
      }
    }

    if (!data.endDate || data.isActive) {
      data.endDate = null;
    }
    
    const obs = this.isEditMode() 
      ? this.employeeService.updateEmployee(this.employeeId!, data, this.themeService.currentQuarter())
      : this.employeeService.createEmployee(data, this.themeService.currentQuarter());

    obs.subscribe({
      next: () => {
        this.employeeService.invalidateCache();
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        console.error('Submit error:', err);
        this.isSubmitting.set(false);
        
        // Handle specific backend errors
        if (err.status === 409) {
          const msg = err.error?.message || '';
          if (msg.includes('nationalId')) {
            this.errorMessage.set(this.translate.instant('employee.form.duplicate_national_id'));
          } else if (msg.includes('email')) {
            this.errorMessage.set(this.translate.instant('employee.form.duplicate_email'));
          } else {
            this.errorMessage.set(this.translate.instant('employee.form.duplicate_generic'));
          }
        } else if (err.status === 400) {
          const validationErrors = err.error?.errors;
          if (validationErrors && validationErrors.length > 0) {
            const msgs = validationErrors.map((e: any) => {
              let fieldArabic = e.field;
              if (e.field === 'teamMemberIds') fieldArabic = 'أعضاء الفريق';
              if (e.field === 'managerId') fieldArabic = 'مدير المبيعات المشرف';
              if (e.field === 'nationalId') fieldArabic = 'الرقم القومي';
              if (e.field === 'email') fieldArabic = 'البريد الإلكتروني';
              if (e.field === 'phone') fieldArabic = 'رقم الهاتف';
              if (e.field === 'name') fieldArabic = 'الاسم';
              if (e.field === 'jobTitle') fieldArabic = 'المسمى الوظيفي';
              if (e.field === 'target') fieldArabic = 'المستهدف';
              return `(${fieldArabic}: ${e.message})`;
            }).join('، ');
            this.errorMessage.set(`${this.translate.instant('employee.form.validation_error')} ${msgs}`);
          } else {
            this.errorMessage.set(err.error?.message || this.translate.instant('common.required_fields'));
          }
        } else {
          this.errorMessage.set(this.translate.instant('common.error_generic'));
        }
      }
    });
  }

  getTargetHint(): string {
    const seniority = this.form?.get('seniorityLevel')?.value;
    if (seniority === 'TeamLeader') {
      return 'بما أنه قائد فريق، سيتم حساب المستهدف تلقائياً من مجموع فريقه بمجرد أن يكون له فريق، وفي حال عدم وجود فريق سيتم استخدام القيمة المدخلة هنا كحالة استثنائية.';
    }
    if (seniority === 'SalesManager') {
      return 'بما أنه مدير مبيعات، سيتم حساب المستهدف تلقائياً من مجموع مستهدفات قادة الفرق التابعين له بمجرد أن يكون له فريق، وفي حال عدم وجود فريق سيتم استخدام القيمة المدخلة هنا كحالة استثنائية.';
    }
    return 'المبلغ المطلوب تحقيقه خلال 3 أشهر';
  }
}
