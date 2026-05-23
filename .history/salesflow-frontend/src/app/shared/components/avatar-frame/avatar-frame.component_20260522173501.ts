import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from "@angular/core";
import { CommonModule } from "@angular/common";

// Avatar background/text per level (level-7 keyed as "7_variant")
const COLORS: Record<string, { bg: string; text: string }> = {
  "1": { bg: "#E6F1FB", text: "#0C447C" },
  "2": { bg: "#EAF3DE", text: "#27500A" },
  "3": { bg: "#FAEEDA", text: "#633806" },
  "4": { bg: "#EEEDFE", text: "#26215C" },
  "5": { bg: "#FAECE7", text: "#4A1B0C" },
  "6": { bg: "#FFF8E6", text: "#7A4F00" },
  "7_sales": { bg: "#fff4f0", text: "#712B13" },
  "7_it": { bg: "#0a0f1a", text: "#00e5a0" },
  "7_ops": { bg: "#f5f0fe", text: "#3C3489" },
  "7_accounts": { bg: "#f0faf4", text: "#1a5c36" },
  "7_hr": { bg: "#1a0a2e", text: "#c084fc" },
};

@Component({
  selector: "app-avatar-frame",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      /* ── Core keyframes ───────────────────────────────── */
      @keyframes af-spin-cw {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes af-spin-ccw {
        to {
          transform: rotate(-360deg);
        }
      }
      @keyframes af-dash {
        to {
          stroke-dashoffset: -40;
        }
      }
      @keyframes af-blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.2;
        }
      }
      @keyframes af-pulseop {
        0%,
        100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }
      @keyframes af-fadeloop {
        0%,
        100% {
          opacity: 0.15;
        }
        50% {
          opacity: 0.85;
        }
      }
      @keyframes af-scalepulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.15);
        }
      }
      @keyframes af-dashhr {
        to {
          stroke-dashoffset: -60;
        }
      }

      /* ── Levels 1–6: 90×90 viewBox, origin 45 45 ─────── */
      .af-spin-cw {
        animation: af-spin-cw 8s linear infinite;
        transform-origin: 45px 45px;
        transform-box: view-box;
      }
      .af-spin-ccw {
        animation: af-spin-ccw 6s linear infinite;
        transform-origin: 45px 45px;
        transform-box: view-box;
      }
      .af-spin-12 {
        animation: af-spin-cw 12s linear infinite;
        transform-origin: 45px 45px;
        transform-box: view-box;
      }
      .af-tl-ccw9 {
        animation: af-spin-ccw 9s linear infinite;
        transform-origin: 45px 45px;
        transform-box: view-box;
      }
      .af-tl-cw20 {
        animation: af-spin-cw 20s linear infinite;
        transform-origin: 45px 45px;
        transform-box: view-box;
      }
      .af-dash {
        animation: af-dash 1.5s linear infinite;
      }

      /* ── Level 7 managers: 100×100 viewBox, origin 50 50 */
      .af-mgr-cw {
        animation: af-spin-cw 10s linear infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }
      .af-mgr-ccw {
        animation: af-spin-ccw 7s linear infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }
      .af-mgr-cw14 {
        animation: af-spin-cw 14s linear infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }
      .af-mgr-cw12 {
        animation: af-spin-cw 12s linear infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }
      .af-mgr-ccw9 {
        animation: af-spin-ccw 9s linear infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }
      .af-mgr-dash {
        animation: af-dash 1.2s linear infinite;
      }
      .af-blink1 {
        animation: af-blink 1.8s ease-in-out 0s infinite;
      }
      .af-blink2 {
        animation: af-blink 1.8s ease-in-out 0.6s infinite;
      }
      .af-blink3 {
        animation: af-blink 1.8s ease-in-out 1.2s infinite;
      }
      .af-pulseop {
        animation: af-pulseop 2.5s ease-in-out infinite;
      }

      /* ── HR Manager: 100×100 viewBox (scaled from 120), origin 50 50 */
      .af-hr-cw {
        animation: af-spin-cw 16s linear infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }
      .af-hr-ccw {
        animation: af-spin-ccw 10s linear infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }
      .af-hr-run {
        animation: af-dashhr 1.8s linear infinite;
      }
      .af-fl1 {
        animation: af-fadeloop 2.2s ease-in-out 0s infinite;
      }
      .af-fl2 {
        animation: af-fadeloop 2.2s ease-in-out 0.55s infinite;
      }
      .af-fl3 {
        animation: af-fadeloop 2.2s ease-in-out 1.1s infinite;
      }
      .af-fl4 {
        animation: af-fadeloop 2.2s ease-in-out 1.65s infinite;
      }
      .af-sp {
        animation: af-scalepulse 3s ease-in-out infinite;
        transform-origin: 50px 50px;
        transform-box: view-box;
      }

      app-avatar-frame {
        display: inline-block;
      }
    `,
  ],
  template: `
    <div
      style="position:relative;width:90px;height:90px;flex-shrink:0;display:inline-block;"
    >
      <!-- Inner avatar circle (60×60, centred at 15,15) -->
      <div
        style="position:absolute;width:60px;height:60px;top:15px;left:15px;
                  border-radius:50%;overflow:hidden;
                  display:flex;align-items:center;justify-content:center;
                  font-family:'Cairo',sans-serif;font-weight:900;font-size:1.25rem;
                  user-select:none;"
        [style.background-color]="colors.bg"
        [style.color]="colors.text"
      >
        @if (avatarUrl) {
          <img
            [src]="avatarUrl"
            style="width:100%;height:100%;object-fit:cover;"
            alt=""
          />
        } @else {
          {{ initials }}
        }
      </div>

      <!-- Decorative SVG frame -->
      <svg
        style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"
        [attr.viewBox]="level === 7 ? '0 0 100 100' : '0 0 90 90'"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        @switch (level) {
          <!-- ══════════════════════════════════════════════
               LEVEL 1 · FRESH — flowing dashed rings
          ══════════════════════════════════════════════ -->
          @case (1) {
            <circle
              cx="45"
              cy="45"
              r="40"
              stroke="#378ADD"
              stroke-width="1.5"
              stroke-dasharray="6 4"
              class="af-dash"
            />
            <circle
              cx="45"
              cy="45"
              r="34"
              stroke="#B5D4F4"
              stroke-width="0.8"
              stroke-dasharray="3 6"
            />
          }

          <!-- ══════════════════════════════════════════════
               LEVEL 2 · BA — orbiting dot constellation
          ══════════════════════════════════════════════ -->
          @case (2) {
            <circle
              cx="45"
              cy="45"
              r="40"
              stroke="#97C459"
              stroke-width="1.5"
              stroke-dasharray="1 7"
              stroke-linecap="round"
            />
            <g class="af-spin-cw">
              <circle cx="45" cy="5" r="3" fill="#639922" />
              <circle cx="45" cy="85" r="3" fill="#639922" />
              <circle cx="5" cy="45" r="3" fill="#97C459" />
              <circle cx="85" cy="45" r="3" fill="#97C459" />
              <circle cx="16" cy="16" r="2" fill="#C0DD97" />
              <circle cx="74" cy="74" r="2" fill="#C0DD97" />
            </g>
          }

          <!-- ══════════════════════════════════════════════
               LEVEL 3 · BC — spinning diamond + reverse ring
          ══════════════════════════════════════════════ -->
          @case (3) {
            <path
              d="M45 5 Q55 15 85 45 Q55 75 45 85 Q35 75 5 45 Q35 15 45 5Z"
              stroke="#EF9F27"
              stroke-width="1.5"
              stroke-dasharray="5 3"
              class="af-spin-cw"
            />
            <circle
              cx="45"
              cy="45"
              r="35"
              stroke="#FAC775"
              stroke-width="1"
              stroke-dasharray="8 4"
              class="af-spin-ccw"
            />
          }

          <!-- ══════════════════════════════════════════════
               LEVEL 4 · SENIOR — starburst + reverse ticks
          ══════════════════════════════════════════════ -->
          @case (4) {
            <g class="af-spin-cw">
              <polygon
                points="45,4 53,19 70,14 65,31 80,38 66,47 72,64 55,61 49,78
                        38,64 21,70 26,53 10,46 24,37 18,20 35,24"
                stroke="#7F77DD"
                stroke-width="1.2"
                fill="none"
              />
            </g>
            <g class="af-spin-ccw">
              <line
                x1="45"
                y1="7"
                x2="45"
                y2="12"
                stroke="#534AB7"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="45"
                y1="78"
                x2="45"
                y2="83"
                stroke="#534AB7"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="7"
                y1="45"
                x2="12"
                y2="45"
                stroke="#534AB7"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="78"
                y1="45"
                x2="83"
                y2="45"
                stroke="#534AB7"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </g>
          }

          <!-- ══════════════════════════════════════════════
               LEVEL 5 · SV — outer ring + reverse arrows + 8-dot orbit
          ══════════════════════════════════════════════ -->
          @case (5) {
            <circle
              cx="45"
              cy="45"
              r="41"
              stroke="#D85A30"
              stroke-width="1"
              stroke-dasharray="8 3"
              class="af-spin-cw"
            />
            <g class="af-spin-ccw">
              <path d="M45 5 L47.5 10 L45 8 L42.5 10Z" fill="#D85A30" />
              <path d="M45 85 L47.5 80 L45 82 L42.5 80Z" fill="#D85A30" />
              <path d="M5 45 L10 42.5 L8 45 L10 47.5Z" fill="#D85A30" />
              <path d="M85 45 L80 42.5 L82 45 L80 47.5Z" fill="#D85A30" />
            </g>
            <g class="af-spin-12">
              <circle cx="45" cy="7" r="2" fill="#F0997B" />
              <circle cx="73" cy="17" r="2" fill="#F0997B" />
              <circle cx="83" cy="45" r="2" fill="#F0997B" />
              <circle cx="73" cy="73" r="2" fill="#F0997B" />
              <circle cx="45" cy="83" r="2" fill="#F0997B" />
              <circle cx="17" cy="73" r="2" fill="#F0997B" />
              <circle cx="7" cy="45" r="2" fill="#F0997B" />
              <circle cx="17" cy="17" r="2" fill="#F0997B" />
            </g>
            <circle
              cx="45"
              cy="45"
              r="35"
              stroke="#F5C4B3"
              stroke-width="0.8"
              stroke-dasharray="12 4"
            />
            <circle
              cx="45"
              cy="45"
              r="30"
              stroke="#FAECE7"
              stroke-width="0.8"
              stroke-dasharray="2 5"
            />
          }

          <!-- ══════════════════════════════════════════════
               LEVEL 6 · TEAM LEADER — gold diamond orbit + double rings
          ══════════════════════════════════════════════ -->
          @case (6) {
            <!-- Outer slow gold ring -->
            <circle
              cx="45"
              cy="45"
              r="41"
              stroke="#F5C542"
              stroke-width="1.5"
              stroke-dasharray="12 3 2 3"
              class="af-tl-cw20"
            />
            <!-- 8 counter-rotating diamond ornaments -->
            <g class="af-tl-ccw9">
              <path d="M45,4 L47.5,7.5 L45,11 L42.5,7.5Z" fill="#F5C542" />
              <path d="M45,79 L47.5,82.5 L45,86 L42.5,82.5Z" fill="#F5C542" />
              <path d="M4,45 L7.5,47.5 L11,45 L7.5,42.5Z" fill="#F5C542" />
              <path d="M79,45 L82.5,47.5 L86,45 L82.5,42.5Z" fill="#F5C542" />
              <path
                d="M15,15 L17.8,18.5 L15,22 L12.2,18.5Z"
                fill="#E8A000"
                opacity="0.8"
              />
              <path
                d="M75,15 L77.8,18.5 L75,22 L72.2,18.5Z"
                fill="#E8A000"
                opacity="0.8"
              />
              <path
                d="M15,75 L17.8,78.5 L15,82 L12.2,78.5Z"
                fill="#E8A000"
                opacity="0.8"
              />
              <path
                d="M75,75 L77.8,78.5 L75,82 L72.2,78.5Z"
                fill="#E8A000"
                opacity="0.8"
              />
            </g>
            <!-- Middle reverse ring -->
            <circle
              cx="45"
              cy="45"
              r="34"
              stroke="#E8A000"
              stroke-width="0.8"
              stroke-dasharray="6 4"
              class="af-spin-ccw"
              style="animation-duration:15s"
            />
            <!-- Inner static ring -->
            <circle
              cx="45"
              cy="45"
              r="28"
              stroke="#FFF0AD"
              stroke-width="0.6"
              stroke-dasharray="2 4"
            />
          }

          <!-- ══════════════════════════════════════════════
               LEVEL 7 · MANAGERS — 5 role-specific variants
               viewBox = 0 0 100 100 for all manager frames
          ══════════════════════════════════════════════ -->
          @case (7) {
            @switch (variant) {
              @case ("it") {
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="#00e5a0"
                  stroke-width="0.8"
                  stroke-dasharray="2 4"
                  class="af-mgr-dash"
                />
                <g class="af-mgr-cw">
                  <text
                    x="50"
                    y="7"
                    text-anchor="middle"
                    font-family="monospace"
                    font-size="9"
                    fill="#00e5a0"
                    opacity="0.9"
                  >
                    &lt;/&gt;
                  </text>
                  <text
                    x="93"
                    y="53"
                    text-anchor="middle"
                    font-family="monospace"
                    font-size="7"
                    fill="#00b377"
                    opacity="0.7"
                  >
                    &#123;&#125;
                  </text>
                  <text
                    x="50"
                    y="97"
                    text-anchor="middle"
                    font-family="monospace"
                    font-size="7"
                    fill="#00e5a0"
                    opacity="0.8"
                  >
                    ( )
                  </text>
                  <text
                    x="7"
                    y="53"
                    text-anchor="middle"
                    font-family="monospace"
                    font-size="7"
                    fill="#00b377"
                    opacity="0.7"
                  >
                    []
                  </text>
                </g>
                <g class="af-mgr-ccw">
                  <circle cx="50" cy="4" r="2.5" fill="#00e5a0" />
                  <circle cx="96" cy="50" r="2.5" fill="#00e5a0" />
                  <circle cx="50" cy="96" r="2.5" fill="#00e5a0" />
                  <circle cx="4" cy="50" r="2.5" fill="#00e5a0" />
                  <line
                    x1="50"
                    y1="4"
                    x2="55"
                    y2="10"
                    stroke="#00e5a0"
                    stroke-width="0.8"
                    opacity="0.5"
                  />
                  <line
                    x1="96"
                    y1="50"
                    x2="90"
                    y2="45"
                    stroke="#00e5a0"
                    stroke-width="0.8"
                    opacity="0.5"
                  />
                  <line
                    x1="50"
                    y1="96"
                    x2="45"
                    y2="90"
                    stroke="#00e5a0"
                    stroke-width="0.8"
                    opacity="0.5"
                  />
                  <line
                    x1="4"
                    y1="50"
                    x2="10"
                    y2="55"
                    stroke="#00e5a0"
                    stroke-width="0.8"
                    opacity="0.5"
                  />
                </g>
                <circle
                  cx="50"
                  cy="13"
                  r="1.5"
                  fill="#00ff99"
                  class="af-blink1"
                />
                <circle
                  cx="87"
                  cy="50"
                  r="1.5"
                  fill="#00ff99"
                  class="af-blink2"
                />
                <circle
                  cx="50"
                  cy="87"
                  r="1.5"
                  fill="#00ff99"
                  class="af-blink3"
                />
                <circle
                  cx="13"
                  cy="50"
                  r="1.5"
                  fill="#00ff99"
                  class="af-blink1"
                />
                <polygon
                  points="50,20 65,28 65,45 50,53 35,45 35,28"
                  stroke="#004d36"
                  stroke-width="0.8"
                  fill="none"
                  class="af-pulseop"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  stroke="#003d2a"
                  stroke-width="1"
                  stroke-dasharray="4 3"
                />
              }

              @case ("accounts") {
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="#1d9e75"
                  stroke-width="1"
                  stroke-dasharray="8 4"
                  class="af-mgr-cw"
                />
                <g class="af-mgr-ccw" opacity="0.85">
                  <rect
                    x="44"
                    y="2"
                    width="4"
                    height="8"
                    rx="1"
                    fill="#1d9e75"
                  />
                  <rect
                    x="44"
                    y="90"
                    width="4"
                    height="8"
                    rx="1"
                    fill="#1d9e75"
                  />
                  <rect
                    x="94"
                    y="44"
                    width="4"
                    height="8"
                    rx="1"
                    fill="#1d9e75"
                    transform="rotate(90,96,50)"
                  />
                  <rect
                    x="2"
                    y="44"
                    width="4"
                    height="8"
                    rx="1"
                    fill="#1d9e75"
                    transform="rotate(90,4,50)"
                  />
                </g>
                <g class="af-mgr-cw14">
                  <text
                    x="19"
                    y="19"
                    font-size="8"
                    fill="#0f6e56"
                    opacity="0.8"
                    text-anchor="middle"
                    font-weight="bold"
                  >
                    $
                  </text>
                  <text
                    x="81"
                    y="19"
                    font-size="8"
                    fill="#0f6e56"
                    opacity="0.8"
                    text-anchor="middle"
                    font-weight="bold"
                  >
                    €
                  </text>
                  <text
                    x="81"
                    y="84"
                    font-size="8"
                    fill="#0f6e56"
                    opacity="0.8"
                    text-anchor="middle"
                    font-weight="bold"
                  >
                    £
                  </text>
                  <text
                    x="19"
                    y="84"
                    font-size="8"
                    fill="#0f6e56"
                    opacity="0.8"
                    text-anchor="middle"
                    font-weight="bold"
                  >
                    ¥
                  </text>
                </g>
                <g class="af-pulseop">
                  <polyline
                    points="20,65 33,55 43,60 57,45 70,48 80,35"
                    stroke="#5DCAA5"
                    stroke-width="1.2"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <polygon points="80,35 76,40 84,40" fill="#5DCAA5" />
                </g>
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="#9FE1CB"
                  stroke-width="0.8"
                  stroke-dasharray="3 5"
                />
                <line
                  x1="50"
                  y1="14"
                  x2="50"
                  y2="20"
                  stroke="#1d9e75"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <line
                  x1="86"
                  y1="50"
                  x2="80"
                  y2="50"
                  stroke="#1d9e75"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <line
                  x1="50"
                  y1="80"
                  x2="50"
                  y2="86"
                  stroke="#1d9e75"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <line
                  x1="14"
                  y1="50"
                  x2="20"
                  y2="50"
                  stroke="#1d9e75"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              }

              @case ("ops") {
                <g class="af-mgr-cw">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    stroke="#7F77DD"
                    stroke-width="1"
                    stroke-dasharray="6 2 1 2"
                    fill="none"
                  />
                  <rect
                    x="47"
                    y="2"
                    width="6"
                    height="7"
                    rx="1"
                    fill="#7F77DD"
                  />
                  <rect
                    x="47"
                    y="91"
                    width="6"
                    height="7"
                    rx="1"
                    fill="#7F77DD"
                  />
                  <rect
                    x="91"
                    y="47"
                    width="7"
                    height="6"
                    rx="1"
                    fill="#7F77DD"
                  />
                  <rect
                    x="2"
                    y="47"
                    width="7"
                    height="6"
                    rx="1"
                    fill="#7F77DD"
                  />
                  <rect
                    x="76"
                    y="14"
                    width="6"
                    height="7"
                    rx="1"
                    fill="#AFA9EC"
                    transform="rotate(45,79,17)"
                  />
                  <rect
                    x="76"
                    y="79"
                    width="6"
                    height="7"
                    rx="1"
                    fill="#AFA9EC"
                    transform="rotate(-45,79,83)"
                  />
                  <rect
                    x="14"
                    y="79"
                    width="6"
                    height="7"
                    rx="1"
                    fill="#AFA9EC"
                    transform="rotate(45,17,83)"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="6"
                    height="7"
                    rx="1"
                    fill="#AFA9EC"
                    transform="rotate(-45,17,17)"
                  />
                </g>
                <g class="af-mgr-ccw">
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    stroke="#534AB7"
                    stroke-width="0.8"
                    stroke-dasharray="4 3"
                    fill="none"
                  />
                  <rect
                    x="47"
                    y="15"
                    width="5"
                    height="5"
                    rx="1"
                    fill="#534AB7"
                  />
                  <rect
                    x="47"
                    y="79"
                    width="5"
                    height="5"
                    rx="1"
                    fill="#534AB7"
                  />
                  <rect
                    x="79"
                    y="47"
                    width="5"
                    height="5"
                    rx="1"
                    fill="#534AB7"
                  />
                  <rect
                    x="15"
                    y="47"
                    width="5"
                    height="5"
                    rx="1"
                    fill="#534AB7"
                  />
                </g>
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#CECBF6"
                  stroke-width="0.6"
                  stroke-dasharray="2 6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="3"
                  fill="#7F77DD"
                  class="af-pulseop"
                />
              }

              @case ("sales") {
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="#D85A30"
                  stroke-width="1.2"
                  stroke-dasharray="10 3"
                  class="af-mgr-cw"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#F0997B"
                  stroke-width="0.6"
                  stroke-dasharray="5 5"
                  class="af-mgr-ccw"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  stroke="#F5C4B3"
                  stroke-width="0.8"
                  stroke-dasharray="3 6"
                />
                <g class="af-mgr-cw12">
                  <line
                    x1="50"
                    y1="4"
                    x2="50"
                    y2="16"
                    stroke="#D85A30"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <line
                    x1="50"
                    y1="84"
                    x2="50"
                    y2="96"
                    stroke="#D85A30"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <line
                    x1="4"
                    y1="50"
                    x2="16"
                    y2="50"
                    stroke="#D85A30"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <line
                    x1="84"
                    y1="50"
                    x2="96"
                    y2="50"
                    stroke="#D85A30"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </g>
                <g class="af-mgr-ccw9">
                  <polygon
                    points="18,15 22,8 26,15"
                    fill="#D85A30"
                    opacity="0.8"
                  />
                  <polygon
                    points="75,15 79,8 83,15"
                    fill="#D85A30"
                    opacity="0.8"
                  />
                  <polygon
                    points="18,85 22,92 26,85"
                    fill="#F0997B"
                    opacity="0.7"
                  />
                  <polygon
                    points="75,85 79,92 83,85"
                    fill="#F0997B"
                    opacity="0.7"
                  />
                </g>
                <text
                  x="50"
                  y="7"
                  text-anchor="middle"
                  font-size="7"
                  fill="#993C1D"
                  font-weight="bold"
                  class="af-blink2"
                >
                  %
                </text>
                <circle
                  cx="50"
                  cy="50"
                  r="4"
                  stroke="#D85A30"
                  stroke-width="1"
                  fill="none"
                  class="af-pulseop"
                />
                <circle cx="50" cy="50" r="1.5" fill="#D85A30" />
              }

              @default {
                <!-- Outer marching ring -->
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="#7c3aed"
                  stroke-width="0.8"
                  stroke-dasharray="4 5"
                  class="af-hr-run"
                />
                <!-- DNA double helix + rung dots spinning CW -->
                <g class="af-hr-cw">
                  <!-- Strand A -->
                  <path
                    d="M50,4.2 C60,4.2 68.3,13.3 68.3,23.3 C68.3,33.3 60,42.5 50,42.5
                            C40,42.5 31.7,51.7 31.7,61.7 C31.7,71.7 40,80.8 50,80.8
                            C60,80.8 68.3,71.7 68.3,61.7 C68.3,51.7 60,42.5 50,42.5
                            C40,42.5 31.7,33.3 31.7,23.3 C31.7,13.3 40,4.2 50,4.2Z"
                    stroke="#a855f7"
                    stroke-width="1.2"
                    fill="none"
                    stroke-dasharray="6 3"
                  />
                  <!-- Strand B -->
                  <path
                    d="M50,8.3 C58.3,8.3 65,16.7 65,26.7 C65,36.7 58.3,43.3 50,43.3
                            C41.7,43.3 35,51.7 35,61.7 C35,70 41.7,76.7 50,76.7
                            C58.3,76.7 65,70 65,61.7 C65,51.7 58.3,43.3 50,43.3
                            C41.7,43.3 35,36.7 35,26.7 C35,16.7 41.7,8.3 50,8.3Z"
                    stroke="#c084fc"
                    stroke-width="0.7"
                    fill="none"
                    stroke-dasharray="3 6"
                    opacity="0.6"
                  />
                  <!-- Rung dots -->
                  <circle
                    cx="50"
                    cy="15"
                    r="2.5"
                    fill="#7c3aed"
                    class="af-fl1"
                  />
                  <circle cx="64" cy="27" r="2" fill="#a855f7" class="af-fl2" />
                  <circle
                    cx="64"
                    cy="50"
                    r="2.5"
                    fill="#7c3aed"
                    class="af-fl3"
                  />
                  <circle cx="64" cy="73" r="2" fill="#a855f7" class="af-fl4" />
                  <circle
                    cx="50"
                    cy="85"
                    r="2.5"
                    fill="#7c3aed"
                    class="af-fl1"
                  />
                  <circle cx="36" cy="73" r="2" fill="#a855f7" class="af-fl2" />
                  <circle
                    cx="36"
                    cy="50"
                    r="2.5"
                    fill="#7c3aed"
                    class="af-fl3"
                  />
                  <circle cx="36" cy="27" r="2" fill="#a855f7" class="af-fl4" />
                </g>
                <!-- Inner concentric arcs reverse spin -->
                <g class="af-hr-ccw">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="#6d28d9"
                    stroke-width="0.8"
                    stroke-dasharray="10 6"
                    fill="none"
                  />
                  <path
                    d="M50,15 A35,35 0 0,1 85,50"
                    stroke="#a855f7"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    opacity="0.5"
                  />
                  <path
                    d="M85,50 A35,35 0 0,1 50,85"
                    stroke="#a855f7"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    opacity="0.5"
                  />
                </g>
                <!-- Innermost static ring -->
                <circle
                  cx="50"
                  cy="50"
                  r="29"
                  stroke="#4c1d95"
                  stroke-width="0.7"
                  stroke-dasharray="2 4"
                />
                <!-- Centre bloom — 6 petals pulsing -->
                <g class="af-sp">
                  <ellipse
                    cx="50"
                    cy="40"
                    rx="3"
                    ry="6"
                    fill="#7c3aed"
                    opacity="0.5"
                  />
                  <ellipse
                    cx="50"
                    cy="40"
                    rx="3"
                    ry="6"
                    fill="#7c3aed"
                    opacity="0.5"
                    transform="rotate(60,50,50)"
                  />
                  <ellipse
                    cx="50"
                    cy="40"
                    rx="3"
                    ry="6"
                    fill="#7c3aed"
                    opacity="0.5"
                    transform="rotate(120,50,50)"
                  />
                  <ellipse
                    cx="50"
                    cy="40"
                    rx="3"
                    ry="6"
                    fill="#7c3aed"
                    opacity="0.5"
                    transform="rotate(180,50,50)"
                  />
                  <ellipse
                    cx="50"
                    cy="40"
                    rx="3"
                    ry="6"
                    fill="#7c3aed"
                    opacity="0.5"
                    transform="rotate(240,50,50)"
                  />
                  <ellipse
                    cx="50"
                    cy="40"
                    rx="3"
                    ry="6"
                    fill="#7c3aed"
                    opacity="0.5"
                    transform="rotate(300,50,50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="4.2"
                    fill="#a855f7"
                    opacity="0.7"
                  />
                </g>
              }
            }
          }
        }
      </svg>
    </div>
  `,
})
export class AvatarFrameComponent {
  @Input() level: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1;
  @Input() variant: string = "";
  @Input() initials: string = "";
  @Input() avatarUrl: string | null = null;

  get colors() {
    const key =
      this.level === 7 ? `7_${this.variant || "sales"}` : `${this.level}`;
    return COLORS[key] ?? COLORS["1"];
  }
}
