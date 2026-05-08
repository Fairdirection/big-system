import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CelebrationService {
  private audioContext: AudioContext | null = null;

  /**
   * Pre-creates or resumes the AudioContext synchronously during user gesture (click)
   * to satisfy Chrome/browser auto-play policies.
   */
  unlockAudio() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (e) {
      console.warn('Could not unlock/initialize AudioContext:', e);
    }
  }

  /**
   * Triggers a gorgeous fullscreen dual-cannon confetti explosion
   * (Silent - visual-only as requested by the user).
   */
  celebrate() {
    // Sound play disabled as per user request
    // this.playSuccessChime();
    this.launchConfettiCannons();
  }

  private playSuccessChime() {
    try {
      this.unlockAudio();
      if (!this.audioContext) return;
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      
      // Beautiful ascending major 7th chord (C5 - E5 - G5 - B5 - C6) for a relaxing, luxurious sound
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Pure, soothing sine wave
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        // Soft envelope: Instant but clicking-safe attack, smooth exponential decay
        gainNode.gain.setValueAtTime(0, now + idx * 0.08);
        gainNode.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.55);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch (e) {
      console.warn('Web Audio API success sound blocked or unsupported:', e);
    }
  }

  private launchConfettiCannons() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    interface Particle {
      x: number;
      y: number;
      color: string;
      size: number;
      vx: number;
      vy: number;
      rotation: number;
      vRotation: number;
      opacity: number;
      shape: 'rect' | 'circle';
    }

    const particles: Particle[] = [];
    const colors = [
      '#8B5CF6', // Purple Neon
      '#10B981', // Emerald Warm
      '#3B82F6', // Blue Sleek
      '#F59E0B', // Amber Gold
      '#EC4899', // Pink Vivid
      '#06B6D4'  // Cyan Bright
    ];

    const count = 180;
    for (let i = 0; i < count; i++) {
      const isLeft = i < count / 2;
      particles.push({
        x: isLeft ? 0 : width,
        y: height * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        vx: (isLeft ? 1 : -1) * (Math.random() * 14 + 10),
        vy: -Math.random() * 18 - 12,
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    let lastTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 16.67; // Normalized to 60fps
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      let activeParticles = 0;

      particles.forEach(p => {
        if (p.opacity <= 0) return;

        activeParticles++;

        // Update positions with gravity and friction
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 0.42 * delta; // Gravity force
        p.vx *= Math.pow(0.975, delta); // Friction
        p.rotation += p.vRotation * delta;

        // Fast fade-out when falling off the screen or slow fade-out mid-air
        if (p.y > height * 0.85) {
          p.opacity -= 0.02 * delta;
        } else {
          p.opacity -= 0.004 * delta;
        }

        if (p.opacity < 0) p.opacity = 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (activeParticles > 0) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    };

    requestAnimationFrame(animate);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    setTimeout(() => {
      window.removeEventListener('resize', handleResize);
    }, 8000);
  }
}
