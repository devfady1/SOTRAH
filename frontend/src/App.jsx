import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Activity,
  Radio,
  Thermometer,
  Cpu,
  Wifi,
  Satellite,
  MapPin,
  AlertTriangle,
  Server,
  ShieldCheck,
  BatteryCharging,
  Layers,
  Play,
  Pause,
  Volume2,
  Check,
  Sparkles,
  ArrowUpLeft,
  Users,
  GraduationCap,
  Wallet,
  Eye,
  Compass,
} from 'lucide-react';

import {
  CIRCULAR_MODULES,
  EXPLODED_LAYERS,
  SPEC_ICONS_14,
} from './data/sotrahData';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function App() {
  const mainRef = useRef(null);
  const wheelRef = useRef(null);
  const heroChassisRef = useRef(null);
  const explodedSectionRef = useRef(null);
  const explodedContainerRef = useRef(null);

  // Interactive States
  const [selectedModule, setSelectedModule] = useState(CIRCULAR_MODULES[0]);
  const [heroViewMode, setHeroViewMode] = useState('matrix'); // 'matrix' | 'front' | 'back' | 'overview'
  const [isExploded, setIsExploded] = useState(true);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Waveform Player State (Section 3 - matching 00:04 in Raycast Video)
  const [isPlayingWave, setIsPlayingWave] = useState(false);
  const [waveMode, setWaveMode] = useState('hr'); // 'hr' | 'rr' | 'sos'
  const [waveTick, setWaveTick] = useState(0);

  // Bento Card Interactive Tabs (Section 4 - matching 00:05 in Raycast Video)
  const [leftBentoTab, setLeftBentoTab] = useState('mesh'); // 'mesh' | 'gateway' | 'lte' | 'hardware'
  const [rightBentoTab, setRightBentoTab] = useState('safety'); // 'safety' | 'hr' | 'mobile'

  // Section 5 Spec 14-Icon Grid State
  const [activeSpecTile, setActiveSpecTile] = useState(SPEC_ICONS_14[0]);

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);

  // Web Audio Radar Pulse / Heartbeat Synthesizer when Waveform Player is active
  useEffect(() => {
    if (!isPlayingWave) return;
    let audioCtx = null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    } catch {
      // Ignore audio restrictions if blocked
    }

    const interval = setInterval(() => {
      setWaveTick((t) => (t + 1) % 48);
      if (audioCtx && audioCtx.state === 'running') {
        setWaveTick((currentTick) => {
          if (currentTick % 12 === 0) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(waveMode === 'sos' ? 740 : 520, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.11);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
          }
          return currentTick;
        });
      }
    }, 95);

    return () => {
      clearInterval(interval);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isPlayingWave, waveMode]);

  // Master GSAP Animations matching the Raycast Video
  useGSAP(
    () => {
      // 1. Navbar & Hero Stagger Reveal
      const tl = gsap.timeline();
      tl.fromTo(
        '.ray-navbar',
        { y: -35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }
      )
        .fromTo(
          '.hero-fade-up',
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, stagger: 0.11, ease: 'power3.out' },
          '-=0.45'
        )
        .fromTo(
          '.hero-hardware-stage',
          { y: 55, opacity: 0, rotateX: 16, scale: 0.94 },
          { y: 0, opacity: 1, rotateX: 6, scale: 1, duration: 1.15, ease: 'expo.out' },
          '-=0.45'
        );

      // 2. Hero Hardware Stage 3D Scroll Scrub (00:00 -> 00:02 in Video)
      gsap.to('.hero-chassis', {
        rotateX: 0,
        scale: 1.02,
        y: -18,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-hardware-stage',
          start: 'top 75%',
          end: 'bottom 20%',
          scrub: 1,
        },
      });

      // 3. Section 2: Circular Ring of 12 Modules Rotation on Scroll (00:02 -> 00:03 in Video)
      gsap.fromTo(
        wheelRef.current,
        { rotation: -45, scale: 0.88, opacity: 0.4 },
        {
          rotation: 135,
          scale: 1,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.section-circular-wheel',
            start: 'top 85%',
            end: 'bottom 15%',
            scrub: 1.2,
          },
        }
      );

      // 4. Section 3: Pinned Scroll-Driven Exploded Layer Stack & Radar Modes
      ScrollTrigger.create({
        trigger: explodedSectionRef.current,
        start: 'top top',
        end: '+=2400',
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);
          const idx = Math.min(
            EXPLODED_LAYERS.length - 1,
            Math.floor(p * EXPLODED_LAYERS.length)
          );
          setActiveLayerIndex(idx);
          setWaveTick(Math.floor(p * 96));
          if (p < 0.36) {
            setWaveMode('hr');
          } else if (p < 0.72) {
            setWaveMode('rr');
          } else {
            setWaveMode('sos');
          }
        },
      });

      // 5. Section 4: Bento Grid Cards Reveal (00:05 in Video)
      gsap.fromTo(
        '.bento-card',
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.16,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.section-bento',
            start: 'top 78%',
          },
        }
      );

      // 6. Section 5: Horizon Edge-Lit Hardware & Spec Matrix Reveal (00:06 -> 00:08 in Video)
      gsap.fromTo(
        '.horizon-hardware-bar',
        { scaleX: 0.78, opacity: 0, y: 30 },
        {
          scaleX: 1,
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: '.section-specs-matrix',
            start: 'top 78%',
          },
        }
      );

      gsap.fromTo(
        '.spec-block-anim',
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.09,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.specs-columns-wrap',
            start: 'top 82%',
          },
        }
      );

      // 7. Section 6: Diagonal Laser Light Beams Animation (00:09 in Video)
      gsap.fromTo(
        '.laser-beam',
        { x: -120, opacity: 0, scaleX: 0.6 },
        {
          x: 0,
          opacity: 1,
          scaleX: 1,
          stagger: 0.18,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.laser-beams-stage',
            start: 'top 88%',
          },
        }
      );
    },
    { scope: mainRef }
  );

  // Subtle Mouse Parallax on Hero Hardware Chassis
  const handleHeroMouseMove = (e) => {
    if (!heroChassisRef.current) return;
    const rect = heroChassisRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(heroChassisRef.current, {
      rotateY: x * 7,
      rotateX: -y * 7 + 4,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const handleHeroMouseLeave = () => {
    if (!heroChassisRef.current) return;
    gsap.to(heroChassisRef.current, {
      rotateY: 0,
      rotateX: 4,
      duration: 0.7,
      ease: 'power3.out',
    });
  };

  return (
    <div ref={mainRef} style={{ minHeight: '100vh', background: 'var(--bg-obsidian)', position: 'relative' }}>
      {/* =====================================================================
          FLOATING GLASSMORPHIC NAVBAR (00:00 in Raycast Video)
      ===================================================================== */}
      <div className="ray-navbar-wrap">
        <nav className="ray-navbar">
          {/* Brand Logo */}
          <a
            href="#vest-hero"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#fff',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 93, 26, 0.14)',
                border: '1px solid rgba(255, 93, 26, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
              }}
            >
              <img src="/assets/logo.png" alt="Sotrah Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>Sotrah</span>
              <span style={{ color: '#ff5d1a', fontWeight: 700, fontSize: '15px' }}>سُترة</span>
            </div>
          </a>

          {/* Navigation Links */}
          <ul className="nav-links">
            <li><a href="#vest-hero">السترة الذكية</a></li>
            <li><a href="#circular-modules">وحدات الاستشعار</a></li>
            <li><a href="#exploded-radar">رادار 60GHz والعزل</a></li>
            <li><a href="#bento-platform">منصة HR-ERP</a></li>
            <li><a href="#specs-matrix">المواصفات الهندسية</a></li>
          </ul>

          {/* Right Action CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="#specs-matrix" className="btn-ray-white">
              <span>المواصفات الكاملة · Specs</span>
              <ArrowUpLeft size={15} />
            </a>
          </div>
        </nav>
      </div>

      {/* =====================================================================
          SECTION 1: HERO SECTION (00:00 - 00:01 in Raycast Video)
      ===================================================================== */}
      <header
        id="vest-hero"
        style={{
          paddingTop: '140px',
          paddingBottom: '90px',
          paddingLeft: '20px',
          paddingRight: '20px',
          textAlign: 'center',
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Top Dual Partner Badge (Like [Raycast] × [NuPhy] in 00:00) */}
        <div
          className="hero-fade-up"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '14px',
            padding: '7px 16px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '26px',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: '#e4e7ee', fontWeight: 600 }}>
            <img src="/assets/logo.png" alt="Sotrah" style={{ width: '18px', height: '18px' }} />
            SOTRAH IIoT
          </span>
          <span style={{ color: '#565b66', fontSize: '12px' }}>×</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              color: '#ff7838',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            60GHz RADAR · MEDICAL HR-ERP
          </span>
        </div>

        {/* Main Hero Title */}
        <h1
          className="hero-fade-up"
          style={{
            fontSize: 'clamp(36px, 5.6vw, 66px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.12,
            color: '#ffffff',
            marginBottom: '18px',
          }}
        >
          سُترة الأمان الذكية{' '}
          <span
            style={{
              display: 'block',
              fontSize: 'clamp(24px, 3.6vw, 44px)',
              fontWeight: 600,
              color: '#9ba1ae',
              marginTop: '6px',
            }}
          >
            The Sotrah 60GHz Smart Safety Vest
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p
          className="hero-fade-up"
          style={{
            maxWidth: '670px',
            margin: '0 auto 32px',
            fontSize: 'clamp(15px, 1.35vw, 18px)',
            lineHeight: 1.7,
            color: '#858a96',
            fontWeight: 400,
          }}
        >
          منظومة تخطيط موارد المؤسسات الطبية الذكية (<strong style={{ color: '#d5d9e2' }}>Medical HR-ERP</strong>) ومراقبة
          المؤشرات الحيوية وسلامة العاملين لا تلامسياً عبر الملابس باستخدام رادار الموجات المليمترية{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: '#ff7838' }}>60GHz</span> وإنترنت الأشياء الصناعي.
        </p>

        {/* Two Centered CTA Buttons (Matching "Sold out" + "Watch video" in 00:00) */}
        <div
          className="hero-fade-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <a href="#circular-modules" className="btn-ray-white">
            <span>استكشف وحدات السترة · Explore Hardware</span>
          </a>
          <button type="button" onClick={() => setDemoModalOpen(true)} className="btn-ray-dark">
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#fff',
                color: '#050608',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={10} fill="#050608" />
            </span>
            <span>استعراض معمارية النظام · Interactive Pitch</span>
          </button>
        </div>

        {/* =====================================================================
            HERO HARDWARE STAGE (The Rim-Lit Console matching the Keyboard at 00:00)
        ===================================================================== */}
        <div
          className="hero-hardware-stage"
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
        >
          {/* Ambient Top Orange/Copper Rim Light */}
          <div className="hero-rim-glow" />

          <div ref={heroChassisRef} className="hero-chassis">
            <div className="hero-chassis-inner">
              {/* Top Telemetry Status Bar inside Hardware Console */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingBottom: '16px',
                  marginBottom: '18px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '5px 11px',
                      borderRadius: '7px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#34d399',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    HR 82 BPM · RR 16/MIN
                  </span>

                  <span
                    style={{
                      padding: '5px 11px',
                      borderRadius: '7px',
                      background: 'rgba(255, 93, 26, 0.12)',
                      border: '1px solid rgba(255, 93, 26, 0.35)',
                      color: '#ff854d',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                    }}
                  >
                    60GHz mmWave RADAR
                  </span>

                  <span
                    style={{
                      padding: '5px 11px',
                      borderRadius: '7px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                    }}
                  >
                    IP67 EPOXY & SILICONE SEALED
                  </span>
                </div>

                {/* View Mode Switcher Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'matrix', label: 'المصفوفة الهندسية (Hardware Matrix)' },
                    { id: 'overview', label: 'السترة الذكية (Smart Vest)' },
                    { id: 'front', label: 'تشريح الأمام (Front Sensors)' },
                    { id: 'back', label: 'تشريح الخلف (Back & Battery)' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setHeroViewMode(mode.id)}
                      style={{
                        padding: '6px 11px',
                        borderRadius: '7px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        background: heroViewMode === mode.id ? '#ff5d1a' : 'rgba(255,255,255,0.05)',
                        color: heroViewMode === mode.id ? '#fff' : '#9ca3af',
                        border: '1px solid rgba(255,255,255,0.09)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Console Body: Either Interactive Anodized Hardware Matrix OR Real Vest Photos */}
              {heroViewMode === 'matrix' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.15fr 0.85fr',
                    gap: '20px',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Left: Dark Anodized Sensor Cap Array (Inspired by the Raycast Keyboard Grid) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '10px',
                      background: '#050608',
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {CIRCULAR_MODULES.map((mod, idx) => {
                      const isSelected = selectedModule.id === mod.id;
                      const isSOS = mod.id === 'sos-trigger';
                      return (
                        <div
                          key={mod.id}
                          onClick={() => setSelectedModule(mod)}
                          className={`sensor-cap ${isSelected ? 'active' : ''} ${isSOS ? 'orange-accent' : ''}`}
                          style={{
                            padding: '13px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '86px',
                            textAlign: 'right',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: isSOS ? '#fff' : mod.accent,
                                boxShadow: `0 0 8px ${isSOS ? '#fff' : mod.accent}`,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '10px',
                                color: isSOS ? 'rgba(255,255,255,0.85)' : '#6e7380',
                              }}
                            >
                              0{idx + 1}
                            </span>
                          </div>

                          <div>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#fff',
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {mod.code}
                            </div>
                            <div
                              style={{
                                fontSize: '10.5px',
                                color: isSOS ? '#ffe4d6' : '#8d929e',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {mod.shortLabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Live Vest Centerpiece & Active Module Readout */}
                  <div
                    style={{
                      background: 'radial-gradient(circle at 50% 35%, rgba(255, 93, 26, 0.16), rgba(10, 12, 16, 0.95) 72%)',
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textAlign: 'right',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img
                        src="/assets/vest_overview.png"
                        alt="Sotrah Vest"
                        style={{
                          width: '128px',
                          height: '165px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.85))',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '5px',
                            background: 'rgba(255, 93, 26, 0.16)',
                            color: '#ff7a42',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            marginBottom: '8px',
                          }}
                        >
                          {selectedModule.badge}
                        </div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                          {selectedModule.titleAr}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#7c818d', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
                          {selectedModule.titleEn}
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#a5aab6', lineHeight: 1.6 }}>
                          {selectedModule.descAr}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                      }}
                    >
                      <span style={{ color: '#10b981', fontWeight: 600 }}>LIVE READOUT: {selectedModule.metric}</span>
                      <span style={{ color: '#777c88' }}>{selectedModule.spec}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#06070a',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '320px',
                  }}
                >
                  {heroViewMode === 'overview' && (
                    <img
                      src="/assets/Gemini_Generated_Image_8afogk8afogk8afo_1.png"
                      alt="Sotrah Full Hardware Breakdown"
                      style={{ maxHeight: '360px', width: 'auto', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }}
                    />
                  )}
                  {heroViewMode === 'front' && (
                    <img
                      src="/assets/vest_front.jpg"
                      alt="Sotrah Front Hardware"
                      style={{ maxHeight: '360px', width: 'auto', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }}
                    />
                  )}
                  {heroViewMode === 'back' && (
                    <img
                      src="/assets/vest_back.jpg"
                      alt="Sotrah Back Hardware"
                      style={{ maxHeight: '360px', width: 'auto', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          SECTION 2: CIRCULAR ORBIT OF 12 MODULES (00:02 - 00:03 in Raycast Video)
          "Your shortcuts in plain sight" -> "مؤشراتك الحيوية في مرمى البصر"
      ===================================================================== */}
      <section
        id="circular-modules"
        className="section-circular-wheel"
        style={{
          maxWidth: '1140px',
          margin: '0 auto',
          padding: '110px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          alignItems: 'center',
          gap: '56px',
        }}
      >
        {/* Text Column (Matching Left Column in 00:02) */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              color: '#ff6321',
              letterSpacing: '0.08em',
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}
          >
            12 INTEGRATED HARDWARE & TELEMETRY NODES
          </div>
          <h2 className="headline-two-tone" style={{ marginBottom: '18px' }}>
            <span className="tone-bright">مؤشراتك الحيوية وسلامتك</span>
            <br />
            <span className="tone-muted">في مرمى البصر لحظياً.</span>
          </h2>
          <p style={{ color: '#858a96', fontSize: '16px', lineHeight: 1.75, marginBottom: '28px', maxWidth: '470px' }}>
            تضم سترة «سُترة» <strong style={{ color: '#e2e5ec' }}>12 وحدة استشعار واتصال مدمجة</strong> تعمل بتناغم تام،
            بدايةً من رادار الموجات المليمترية 60GHz غير التلامسي ومستشعر الحرارة تحت الحمراء، وصولاً إلى زر الطوارئ المخصص
            وشبكة الـ Mesh الذاتية.
          </p>

          {/* Active Module Spotlight Card */}
          <div
            style={{
              background: 'rgba(18, 20, 27, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '470px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: selectedModule.accent,
                }}
              >
                [{selectedModule.code}] // {selectedModule.shortLabel}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#d1d5db',
                }}
              >
                {selectedModule.metric}
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              {selectedModule.titleAr}
            </div>
            <p style={{ fontSize: '13.5px', color: '#9ca3af', lineHeight: 1.65, marginBottom: '10px' }}>
              {selectedModule.descAr}
            </p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6b7280' }}>
              SPEC: {selectedModule.spec}
            </div>
          </div>
        </div>

        {/* Right Column: The 360° Rotating Hardware Keycap Ring (Exact match to 00:02 in Video) */}
        <div className="wheel-stage">
          {/* Center Core Emblem inside the Ring */}
          <div
            style={{
              position: 'absolute',
              width: '148px',
              height: '148px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 93, 26, 0.16) 0%, rgba(9, 10, 14, 0.95) 72%)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              boxShadow: '0 0 60px rgba(255, 93, 26, 0.15)',
              textAlign: 'center',
              padding: '12px',
            }}
          >
            <img src="/assets/logo.png" alt="Sotrah Core" style={{ width: '42px', height: '42px', marginBottom: '6px' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
              {selectedModule.code}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#ff6321' }}>
              {selectedModule.shortLabel}
            </span>
          </div>

          {/* Rotating Ring of 12 Anodized Sensor Caps */}
          <div ref={wheelRef} className="wheel-ring">
            {CIRCULAR_MODULES.map((mod, index) => {
              const total = CIRCULAR_MODULES.length;
              const angleDeg = (index * 360) / total;
              const angleRad = (angleDeg * Math.PI) / 180;
              const radius = 192;
              const x = Math.cos(angleRad) * radius;
              const y = Math.sin(angleRad) * radius;
              const isSelected = selectedModule.id === mod.id;

              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`wheel-cap ${isSelected ? 'is-selected' : ''}`}
                  style={{
                    transform: `translate(${x}px, ${y}px) rotate(${angleDeg + 90}deg)`,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: mod.accent,
                      boxShadow: `0 0 8px ${mod.accent}`,
                      marginBottom: '5px',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {mod.code}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '8.5px',
                      color: '#858a96',
                      marginTop: '2px',
                    }}
                  >
                    {mod.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: PINNED SCROLL-DRIVEN EXPLODED LAYER STACK + SPECS + WAVEFORM
          "Mechanical feel. Quiet by design." -> "استشعار لا تلامسي. معزول ومؤمّن بالتصميم."
      ===================================================================== */}
      <section
        id="exploded-radar"
        ref={explodedSectionRef}
        className="section-exploded"
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '82px 24px 28px',
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            alignItems: 'center',
            gap: '54px',
          }}
        >
          {/* Right Column in RTL: Exploded 5-Layer Isometric Stack */}
          <div ref={explodedContainerRef} style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: '4px 9px',
                    borderRadius: '6px',
                    background: 'rgba(255, 93, 26, 0.15)',
                    border: '1px solid rgba(255, 93, 26, 0.4)',
                    color: '#ff7838',
                    fontWeight: 700,
                  }}
                >
                  LAYER 0{activeLayerIndex + 1} / 0{EXPLODED_LAYERS.length}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#858a96' }}>
                  SCROLL TO CYCLE ARCHITECTURE
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsExploded(!isExploded)}
                className="btn-ray-dark"
                style={{ padding: '5px 11px', fontSize: '11.5px' }}
              >
                <Layers size={13} color="#ff5d1a" />
                <span>{isExploded ? 'دمج الطبقات (Assemble)' : 'تفكيك الطبقات (Explode)'}</span>
              </button>
            </div>

            {/* Vertical Laser Progress Bar & 5 Layers */}
            <div
              style={{
                position: 'relative',
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: isExploded ? '11px' : '5px',
                transition: 'gap 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* Background Guide Track */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  bottom: '14px',
                  right: '32px',
                  width: '2px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  zIndex: 0,
                }}
              />
              {/* Active Scroll Laser Fill */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '32px',
                  width: '2px',
                  height: `${Math.max(8, scrollProgress * 92)}%`,
                  background: 'linear-gradient(180deg, #ff5d1a, #10b981, #38bdf8)',
                  boxShadow: '0 0 12px rgba(255, 93, 26, 0.8)',
                  zIndex: 1,
                  transition: 'height 0.15s ease-out',
                }}
              />

              {EXPLODED_LAYERS.map((layer, idx) => {
                const isActive = activeLayerIndex === idx;
                return (
                  <div
                    key={layer.step}
                    onClick={() => setActiveLayerIndex(idx)}
                    className="exploded-layer-card"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(32, 35, 48, 0.98) 0%, rgba(15, 17, 25, 0.98) 100%)'
                        : 'rgba(13, 15, 21, 0.82)',
                      border: `1px solid ${isActive ? layer.color : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '14px',
                      padding: isActive ? '15px 18px' : '11px 16px',
                      cursor: 'pointer',
                      transform: isExploded
                        ? `perspective(900px) rotateX(${isActive ? '4deg' : '7deg'}) translateX(${
                            isActive ? '-10px' : '0px'
                          }) scale(${isActive ? 1.015 : 0.985})`
                        : 'none',
                      boxShadow: isActive
                        ? `0 18px 40px rgba(0,0,0,0.82), 0 0 28px ${layer.color}33`
                        : '0 6px 16px rgba(0,0,0,0.45)',
                      opacity: isActive ? 1 : 0.68,
                      transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isActive ? layer.color : `${layer.color}1f`,
                            border: `1px solid ${layer.color}`,
                            color: isActive ? '#050608' : layer.color,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isActive ? `0 0 14px ${layer.color}` : 'none',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {layer.step}
                        </span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{layer.titleAr}</div>
                          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#7c818d' }}>
                            {layer.titleEn}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isActive ? `${layer.color}24` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isActive ? `${layer.color}66` : 'transparent'}`,
                          color: isActive ? '#ffffff' : '#9ca3af',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {layer.tag}
                      </span>
                    </div>

                    {/* Active Layer Detail Expands Smoothly on Scroll */}
                    {isActive && (
                      <p
                        style={{
                          fontSize: '12.5px',
                          color: '#b4bac6',
                          marginTop: '9px',
                          lineHeight: 1.6,
                          paddingRight: '40px',
                        }}
                      >
                        {layer.detailAr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Column in RTL: Headline + Dynamic Highlighted 2x3 Spec Bars + Interactive Waveform Player */}
          <div style={{ textAlign: 'right' }}>
            <h2 className="headline-two-tone" style={{ marginBottom: '14px' }}>
              <span className="tone-bright">استشعار حيوي لا تلامسي. </span>
              <span className="tone-muted">معزول ومؤمّن بالتصميم.</span>
            </h2>
            <p style={{ color: '#858a96', fontSize: '15px', lineHeight: 1.72, marginBottom: '26px' }}>
              يرصد رادار <strong style={{ color: '#e2e5ec' }}>60GHz mmWave</strong> نبض القلب والتنفس بدقة عبر الملابس دون
              حاجة لأي أقطاب تلامس الجلد، بينما تحمي طبقة السيليكون المطاطي والريزن الإيبوكسي (<strong style={{ color: '#e2e5ec' }}>IP67</strong>)
              كافة الدوائر من العرق والمياه والغبار الصناعي.
            </p>

            {/* 2x3 Technical Spec Bars with Active Highlight synced to Scroll Layer */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                columnGap: '24px',
                rowGap: '4px',
                marginBottom: '26px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {[
                { key: 'RADAR FREQUENCY', val: '60 ± 0.5 GHz', matchLayer: 1 },
                { key: 'SHIFT PAYLOAD', val: '≤ 0.5 MB / 10H', matchLayer: 2 },
                { key: 'THERMAL ACCURACY', val: '± 0.2 °C (IR)', matchLayer: 1 },
                { key: 'SENSING TYPE', val: 'NON-CONTACT', matchLayer: 0 },
                { key: 'BATTERY LIFE', val: '10+ HRS (5Ah)', matchLayer: 4 },
                { key: 'ENCAPSULATION', val: 'IP67 EPOXY/RTV', matchLayer: 3 },
              ].map((spec) => {
                const isSpecHighlighted = activeLayerIndex === spec.matchLayer;
                const activeColor = EXPLODED_LAYERS[activeLayerIndex]?.color || '#ff5d1a';
                return (
                  <div
                    key={spec.key}
                    className="spec-row-pair"
                    style={{
                      borderBottomColor: isSpecHighlighted ? activeColor : 'rgba(255, 255, 255, 0.08)',
                      background: isSpecHighlighted ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      borderRadius: '6px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span className="spec-key" style={{ color: isSpecHighlighted ? '#e2e8f0' : '#777c88' }}>
                      {spec.key}
                    </span>
                    <span
                      className="spec-val"
                      style={{ color: isSpecHighlighted ? activeColor : '#f3f5f8' }}
                    >
                      {spec.val}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Interactive Waveform Pill Player (Auto-cycles modes on scroll + manual click) */}
            <div
              style={{
                background: 'rgba(18, 20, 27, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} color="#ff5d1a" />
                  <span>معاينة الإشارة الحيوية للرادار (Live Radar Signal):</span>
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'hr', label: 'النبض 82 BPM', color: '#10b981' },
                    { id: 'rr', label: 'التنفس 16 RPM', color: '#38bdf8' },
                    { id: 'sos', label: 'طوارئ السقوط SOS', color: '#ef4444' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setWaveMode(m.id)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        background: waveMode === m.id ? `${m.color}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${waveMode === m.id ? m.color : 'rgba(255,255,255,0.08)'}`,
                        color: waveMode === m.id ? '#fff' : '#858a96',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: '#08090d',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  direction: 'ltr',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsPlayingWave(!isPlayingWave)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isPlayingWave ? '#ff5d1a' : '#ffffff',
                    color: isPlayingWave ? '#ffffff' : '#060709',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 0 16px rgba(255,255,255,0.2)',
                  }}
                >
                  {isPlayingWave ? <Pause size={14} /> : <Play size={14} fill="#060709" />}
                </button>

                {/* 44 Waveform Bars */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '28px',
                    gap: '2px',
                  }}
                >
                  {Array.from({ length: 44 }).map((_, idx) => {
                    const phase = (idx + waveTick) % 12;
                    let barHeight = 6;
                    if (waveMode === 'hr') {
                      barHeight = phase === 0 ? 26 : phase === 1 ? 18 : phase === 6 ? 14 : 5 + ((idx * 7) % 8);
                    } else if (waveMode === 'rr') {
                      barHeight = Math.round(14 + Math.sin((idx + waveTick) * 0.35) * 10);
                    } else {
                      barHeight = (idx + waveTick) % 4 === 0 ? 26 : 8;
                    }
                    const isActiveBar = (idx + waveTick) % 12 === 0;
                    const activeColor =
                      waveMode === 'sos' ? '#ef4444' : waveMode === 'rr' ? '#38bdf8' : '#10b981';

                    return (
                      <span
                        key={idx}
                        style={{
                          width: '3px',
                          height: `${barHeight}px`,
                          borderRadius: '2px',
                          background: isActiveBar
                            ? activeColor
                            : idx < Math.max(12, Math.floor(scrollProgress * 44))
                            ? 'rgba(255, 255, 255, 0.8)'
                            : 'rgba(255, 255, 255, 0.22)',
                          transition: 'height 0.12s ease, background 0.12s ease',
                        }}
                      />
                    );
                  })}
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#858a96', flexShrink: 0 }}>
                  {waveMode === 'hr' ? '82 BPM' : waveMode === 'rr' ? '16 RPM' : 'SOS 2.4G'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: BENTO GRID SHOWCASE (00:05 in Raycast Video)
          "Remarkably slim. Big on features." -> "تصميم مدمج وخفيف. عملاق في المهام الحرجة."
      ===================================================================== */}
      <section
        id="bento-platform"
        className="section-bento"
        style={{
          maxWidth: '1140px',
          margin: '0 auto',
          padding: '100px 24px',
        }}
      >
        <div style={{ marginBottom: '42px', textAlign: 'right' }}>
          <h2 className="headline-two-tone">
            <span className="tone-bright">تصميم مدمج وخفيف.</span>
            <br />
            <span className="tone-muted">عملاق في المهام الميدانية والسحابية.</span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Left Bento Card: Dual-Mode Edge & Cellular Architecture */}
          <div className="bento-card" style={{ padding: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#ff6321' }}>
                  DUAL-MODE CONNECTIVITY // EDGE + LTE-M
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#34d399',
                  }}
                >
                  OFFLINE-RESILIENT
                </span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                {leftBentoTab === 'mesh' && 'الوضع الداخلي: شبكة متداخلة ذاتية ESP-Mesh'}
                {leftBentoTab === 'gateway' && 'بوابة الحافة المحلية: Raspberry Pi 4 Edge Gateway'}
                {leftBentoTab === 'lte' && 'الوضع الخارجي: اتصال خلوي SIM7000G LTE-M'}
                {leftBentoTab === 'hardware' && 'توزيع هندسي متوازن داخل البطانة المبطنة'}
              </h3>

              <p style={{ fontSize: '14px', color: '#8f94a0', lineHeight: 1.65, marginBottom: '20px' }}>
                {leftBentoTab === 'mesh' &&
                  'تتواصل سترات العمال داخل المصنع تلقائياً عبر شبكة Wi-Fi ESP-Mesh وتمرر القراءات ببروتوكول MQTT خفيف الوزن دون الحاجة لنقاط تغطية تقليدية.'}
                {leftBentoTab === 'gateway' &&
                  'تعالج البوابة المحلية إنذارات السقوط والطوارئ داخل المصنع في أجزاء من الثانية، وتخزن البيانات محلياً (Offline Backup) عند انقطاع الإنترنت ثم تزامنها تلقائياً.'}
                {leftBentoTab === 'lte' &&
                  'عند خروج العامل في مأمورية خارجية، تتحول السترة تلقائياً لشريحة SIM7000G وتحديد الموقع NEO-8M GPS باستهلاك لا يتجاوز 0.5 ميجابايت طوال الوردية (10 ساعات).'}
                {leftBentoTab === 'hardware' &&
                  'توزيع مدروس للرادار في الأمام والبطارية المسطحة 5000mAh ووحدة الجيروسكوب في الخلف داخل حافظات مرنة معزولة بالإيبوكسي.'}
              </p>

              {/* Visual Diagram Stage inside Left Bento */}
              <div
                style={{
                  background: '#07080c',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '20px',
                  minHeight: '235px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '14px',
                }}
              >
                {leftBentoTab === 'hardware' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <img
                      src="/assets/vest_front.jpg"
                      alt="Front Sensors"
                      style={{ width: '100%', height: '190px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                    <img
                      src="/assets/vest_back.jpg"
                      alt="Back Modules"
                      style={{ width: '100%', height: '190px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                  </div>
                ) : (
                  <>
                    {/* Live Interactive Architecture Nodes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', direction: 'ltr' }}>
                      <div
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          background: 'rgba(255, 93, 26, 0.1)',
                          border: '1px solid rgba(255, 93, 26, 0.4)',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                          ESP32 VESTS
                        </div>
                        <div style={{ fontSize: '11px', color: '#ff854d', marginTop: '4px' }}>60GHz + IR + IMU</div>
                      </div>

                      <div
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          background: leftBentoTab === 'lte' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          border: `1px solid ${leftBentoTab === 'lte' ? '#38bdf8' : '#10b981'}`,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                          {leftBentoTab === 'lte' ? 'SIM7000G LTE-M' : 'RPi 4 GATEWAY'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          {leftBentoTab === 'lte' ? '≤ 0.5 MB / 10h Shift' : 'Mosquitto MQTT Broker'}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          background: 'rgba(168, 85, 247, 0.12)',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                          SOTRAH CLOUD
                        </div>
                        <div style={{ fontSize: '11px', color: '#c084fc', marginTop: '4px' }}>Django + PostgreSQL</div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        color: '#9ca3af',
                        direction: 'ltr',
                      }}
                    >
                      <span>PROTOCOL: MQTT OVER TLS / WEBSOCKETS</span>
                      <span style={{ color: '#10b981' }}>LATENCY: &lt; 220ms</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Pill Buttons at Bottom of Left Bento (Exact match to Rotary Knob / Universal Layout pills at 00:05) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '22px' }}>
              {[
                { id: 'mesh', label: 'الوضع الداخلي ESP-Mesh' },
                { id: 'gateway', label: 'البوابة المحلية RPi 4' },
                { id: 'lte', label: 'الوضع الخارجي LTE-M' },
                { id: 'hardware', label: 'تشريح السترة (Front/Back)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeftBentoTab(tab.id)}
                  className={`bento-pill-btn ${leftBentoTab === tab.id ? 'active' : ''}`}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: leftBentoTab === tab.id ? '#ff5d1a' : '#525866',
                    }}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Bento Card: Cloud Medical HR-ERP & Live SOS Dashboard */}
          <div className="bento-card" style={{ padding: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#10b981' }}>
                  SOTRAH.COM CLOUD // MEDICAL HR-ERP
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'rgba(255, 93, 26, 0.14)',
                    color: '#ff7a42',
                  }}
                >
                  LIVE WEBSOCKETS
                </span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                {rightBentoTab === 'safety' && 'خريطة السلامة المهنية والاستغاثة اللحظية (Live HSE & SOS)'}
                {rightBentoTab === 'hr' && 'أتمتة الموارد البشرية والحضور بالسياج الجغرافي (HR-ERP)'}
                {rightBentoTab === 'mobile' && 'تطبيق الميدان للمشرفين وفرق التدخل السريع'}
              </h3>

              <p style={{ fontSize: '14px', color: '#8f94a0', lineHeight: 1.65, marginBottom: '18px' }}>
                {rightBentoTab === 'safety' &&
                  'لوحة تحكم حية تعرض مواقع العمال ومؤشراتهم الحيوية لحظياً، مع إنذارات صوتية ومرئية فورية عند رصد سقوط عامل أو إجهاد حراري.'}
                {rightBentoTab === 'hr' &&
                  'تسجيل الحضور والانصراف تلقائياً بمجرد دخول أو مغادرة نطاق الموقع (Geofencing) وحساب ساعات العمل الفعلية وأوقات الراحة.'}
                {rightBentoTab === 'mobile' &&
                  'واجهة هاتف محمول فورية لمشرف الوردية ومسؤول السلامة لتلقي إشعارات الطوارئ والوصول لإحداثيات العامل المصاب فوراً.'}
              </p>

              {/* Mockup Showcase Stage */}
              <div
                style={{
                  background: '#07080c',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '235px',
                }}
              >
                {rightBentoTab === 'safety' && (
                  <img
                    src="/assets/dashboard_live.png"
                    alt="Sotrah Live Safety Map Dashboard"
                    style={{ width: '100%', maxHeight: '230px', objectFit: 'contain', borderRadius: '10px' }}
                  />
                )}
                {rightBentoTab === 'hr' && (
                  <img
                    src="/assets/dashboard_hr.png"
                    alt="Sotrah Automated HR-ERP Dashboard"
                    style={{ width: '100%', maxHeight: '230px', objectFit: 'contain', borderRadius: '10px' }}
                  />
                )}
                {rightBentoTab === 'mobile' && (
                  <img
                    src="/assets/mobile_preview.png"
                    alt="Sotrah Mobile App"
                    style={{ maxHeight: '230px', width: 'auto', objectFit: 'contain', borderRadius: '10px' }}
                  />
                )}
              </div>
            </div>

            {/* Interactive Pill Buttons at Bottom of Right Bento */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '22px' }}>
              {[
                { id: 'safety', label: 'خريطة السلامة والطوارئ SOS' },
                { id: 'hr', label: 'نظام الحضور الذكي HR-ERP' },
                { id: 'mobile', label: 'تطبيق الهاتف للمشرفين' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightBentoTab(tab.id)}
                  className={`bento-pill-btn ${rightBentoTab === tab.id ? 'active' : ''}`}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: rightBentoTab === tab.id ? '#10b981' : '#525866',
                    }}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: FULL-WIDTH HORIZON + MONOSPACE SPECIFICATION MATRIX (00:06 - 00:09)
          "Everything that you love about Raycast, now on your desk"
      ===================================================================== */}
      <section
        id="specs-matrix"
        className="section-specs-matrix"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '110px 24px 70px',
        }}
      >
        {/* Centered Header + CTA (Matching 00:06 in Video) */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.8vw, 46px)',
              fontWeight: 700,
              lineHeight: 1.22,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              maxWidth: '720px',
              margin: '0 auto 22px',
            }}
          >
            كل ما تحتاجه لحماية فريقك وإدارة منشأتك، الآن في منظومة واحدة
          </h2>
          <button type="button" onClick={() => setDemoModalOpen(true)} className="btn-ray-white">
            <span>استعرض المخطط المعماري · System Architecture</span>
          </button>
        </div>

        {/* Edge-Lit Hardware Horizon Silhouette (Exact match to the rim-lit profile bar at 00:06) */}
        <div
          className="horizon-hardware-bar"
          style={{
            position: 'relative',
            margin: '0 auto 64px',
            maxWidth: '940px',
            height: '86px',
            borderRadius: '18px 18px 8px 8px',
            background: 'linear-gradient(180deg, #1b1e26 0%, #0d0f14 55%, #060709 100%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 -12px 55px rgba(255, 93, 26, 0.32), inset 0 2px 1px rgba(255, 190, 150, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 24px',
            overflow: 'hidden',
          }}
        >
          {/* Glowing Top Edge Line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '8%',
              right: '8%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #ff6321, #ffffff, #ff6321, transparent)',
            }}
          />
          {['60GHz RADAR', 'MLX90614 IR', 'MPU6050 IMU', 'ESP32 MESH', 'SIM7000G LTE-M', 'NEO-8M GPS', 'RPi 4 GATEWAY', 'IP67 SEAL'].map(
            (slot) => (
              <div
                key={slot}
                style={{
                  padding: '7px 12px',
                  borderRadius: '7px',
                  background: 'rgba(5, 6, 8, 0.75)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: '#c8ccd4',
                }}
              >
                {slot}
              </div>
            )
          )}
        </div>

        {/* Two-Column Monospace Technical Specification Matrix (Exact match to 00:07 - 00:08) */}
        <div
          className="specs-columns-wrap"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '54px',
            direction: 'ltr',
          }}
        >
          {/* LEFT COLUMN: CUSTOM MODULES (14 Icon Grid) + HARDWARE SPECIFICATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '42px' }}>
            {/* 14-Icon Grid (Matching CUSTOM KEYCAPS 2x7 grid in 00:07) */}
            <div className="spec-block-anim">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#e5e7eb',
                  letterSpacing: '0.06em',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>INTEGRATED SENSORS & MODULES</span>
                <span style={{ color: '#ff6321' }}>{activeSpecTile.label}</span>
              </div>

              <div className="custom-caps-grid">
                {SPEC_ICONS_14.map((item) => (
                  <div
                    key={item.code}
                    onMouseEnter={() => setActiveSpecTile(item)}
                    onClick={() => setActiveSpecTile(item)}
                    className={`custom-cap-tile ${activeSpecTile.code === item.code ? 'active' : ''}`}
                    title={`${item.label} — ${item.sub}`}
                  >
                    <span style={{ fontWeight: 700 }}>{item.code}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SPECIFICATION TABLE */}
            <div className="spec-block-anim">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#e5e7eb',
                  letterSpacing: '0.06em',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                SPECIFICATION
              </div>

              <div className="spec-row-pair">
                <span className="spec-key">BIOMETRIC RADAR</span>
                <span className="spec-val">60GHz mmWave NON-CONTACT</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">THERMAL SENSOR</span>
                <span className="spec-val">MLX90614 INFRARED</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">MOTION & FALL IMU</span>
                <span className="spec-val">MPU6050 6-AXIS GYRO/ACCEL</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">MICROCONTROLLER</span>
                <span className="spec-val">ESP32-WROOM-32U DUAL-CORE</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">LOCAL EDGE GATEWAY</span>
                <span className="spec-val">RASPBERRY PI 4 (4GB) MQTT</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">LOCAL WORKER ALERT</span>
                <span className="spec-val">VIBRATION + BUZZER + RGB LED</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">BATTERY CAPACITY</span>
                <span className="spec-val">5,000 mAh Li-Po + BMS</span>
              </div>

              {/* Engineering Credits (Exact match to "Designed by Raycast and Engineered by NuPhy" at 00:08) */}
              <div
                style={{
                  marginTop: '28px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: '#6d7280',
                  lineHeight: 1.7,
                }}
              >
                <div>Designed & Engineered by Sotrah Graduation Team (8 Engineers)</div>
                <div>Supervised by Dr. Mahmoud Hardan · New Assiut Tech. Univ.</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: POWER & PROTECTION + CONNECTION + MATERIALS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '42px' }}>
            {/* POWER & PROTECTION */}
            <div className="spec-block-anim">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#e5e7eb',
                  letterSpacing: '0.06em',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                ENDURANCE & PROTECTION
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">CONTINUOUS SHIFT TIME</span>
                <span className="spec-val">10+ HOURS / CHARGE</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">CHEMICAL SEALING</span>
                <span className="spec-val">EPOXY RESIN & RTV SILICONE</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">PROTECTION TARGET</span>
                <span className="spec-val">IP67 SWEAT / DUST / WATER</span>
              </div>
            </div>

            {/* CONNECTION */}
            <div className="spec-block-anim">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#e5e7eb',
                  letterSpacing: '0.06em',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                CONNECTION & CLOUD STACK
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">HYBRID MODE</span>
                <span className="spec-val">WI-FI ESP-MESH, LTE-M OR GPS</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">INDOOR FACTORY LATENCY</span>
                <span className="spec-val">&lt; 250 ms (LOCAL BROKER)</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">OUTDOOR CELLULAR DATA</span>
                <span className="spec-val">≤ 0.5 MB / 10H SHIFT</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">CLOUD PLATFORM</span>
                <span className="spec-val">DJANGO · REACT · POSTGRESQL</span>
              </div>
            </div>

            {/* MATERIALS & BUDGET */}
            <div className="spec-block-anim">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#e5e7eb',
                  letterSpacing: '0.06em',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                MATERIALS & PROTOTYPE SCOPE
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">OUTER VEST SHELL</span>
                <span className="spec-val">HIGH-VISIBILITY SAFETY PPE</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">MODULE ENCLOSURES</span>
                <span className="spec-val">3D-PRINTED FLEXIBLE TPU</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">PROTOTYPE UNITS</span>
                <span className="spec-val">3 SMART VESTS + 1 EDGE GW</span>
              </div>
              <div className="spec-row-pair">
                <span className="spec-key">GEOFENCE ACCURACY</span>
                <span className="spec-val" style={{ color: '#ff7838' }}>2.5 m CEP (NEO-8M GNSS)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: DIAGONAL LASER BEAMS + FOOTER (00:09 - 00:12 in Raycast Video)
      ===================================================================== */}
      <div className="laser-beams-stage">
        <div className="laser-beam" style={{ left: '22%', top: '38%' }} />
        <div
          className="laser-beam"
          style={{
            left: '38%',
            top: '28%',
            width: '620px',
            height: '82px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.25) 20%, rgba(255, 93, 26, 0.78) 65%, rgba(255, 180, 110, 0.92) 85%, transparent 100%)',
          }}
        />
        <div className="laser-beam" style={{ left: '54%', top: '45%', opacity: 0.7 }} />
      </div>

      {/* Multi-Column Footer + Newsletter Box (Matching 00:10 - 00:12 in Raycast Video) */}
      <footer
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '40px 24px 90px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
            gap: '36px',
            marginBottom: '64px',
          }}
        >
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <img src="/assets/logo.png" alt="Sotrah" style={{ width: '30px', height: '30px' }} />
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>Sotrah | سُترة</span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#777c88', lineHeight: 1.7 }}>
              سُترة .. لأن سلامتك تهمنا
              <br />
              Safer People .. Smarter Workplaces
            </p>
          </div>

          {/* Column 1 */}
          <div>
            <div style={footerTitleStyle}>المنظومة (Ecosystem)</div>
            <ul style={footerListStyle}>
              <li><a href="#vest-hero">السترة الذكية 60GHz</a></li>
              <li><a href="#circular-modules">المستشعرات المدمجة</a></li>
              <li><a href="#exploded-radar">العزل الكيميائي IP67</a></li>
              <li><a href="#bento-platform">بوابة Raspberry Pi 4</a></li>
              <li><a href="#specs-matrix">المواصفات الفنية</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <div style={footerTitleStyle}>المنصة السحابية (SaaS)</div>
            <ul style={footerListStyle}>
              <li><a href="#bento-platform">خريطة السلامة الحية</a></li>
              <li><a href="#bento-platform">نظام الحضور Geofencing</a></li>
              <li><a href="#bento-platform">إنذارات السقوط SOS</a></li>
              <li><a href="#bento-platform">تطبيق الميدان والمشرف</a></li>
              <li><a href="#specs-matrix">مؤشرات الأداء والتحقق</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <div style={footerTitleStyle}>البنية التقنية (Stack)</div>
            <ul style={footerListStyle}>
              <li><span>Django REST Backend</span></li>
              <li><span>React + Vite + GSAP</span></li>
              <li><span>PostgreSQL Database</span></li>
              <li><span>Mosquitto MQTT Broker</span></li>
              <li><span>ESP-Mesh & SIM7000G</span></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <div style={footerTitleStyle}>الجامعة والإشراف</div>
            <ul style={footerListStyle}>
              <li><span>جامعة أسيوط الجديدة التكنولوجية</span></li>
              <li><span>كلية تكنولوجيا الصناعة والطاقة</span></li>
              <li><span>قسم تكنولوجيا المعلومات</span></li>
              <li><span>إشراف: د. محمود حردان</span></li>
              <li><a href="https://github.com/devfady1/SOTRAH" target="_blank" rel="noreferrer">GitHub Repository ↗</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Newsletter / Demo Box (Exact match to "Subscribe to our newsletter" box at 00:11 - 00:12) */}
        <div
          style={{
            background: 'rgba(17, 19, 25, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ maxWidth: '380px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              اشترك في تحديثات منظومة سُترة الصناعية.
            </div>
            <div style={{ fontSize: '13.5px', color: '#7e838f', lineHeight: 1.6 }}>
              احصل على تقارير الاختبارات الميدانية ومستجدات إطلاق الجيل الأول من اللوحة المدمجة (Custom PCB).
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '280px', maxWidth: '460px' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewsletterSent(true);
              }}
              style={{ display: 'flex', gap: '8px', marginBottom: '10px', direction: 'ltr' }}
            >
              <input
                type="email"
                required
                placeholder="engineer@sotrah.com"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '9px',
                  background: '#08090d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '13.5px',
                }}
              />
              <button type="submit" className="btn-ray-white">
                {newsletterSent ? 'تم الاشتراك ✓' : 'Subscribe'}
              </button>
            </form>
            <div style={{ fontSize: '11px', color: '#636875', lineHeight: 1.5 }}>
              بتسجيل بريدك الإلكتروني فإنك توافق على سياسة خصوصية البيانات الصحية والصناعية الخاصة بمنصة sotrah.com.
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Pitch / Architecture Modal */}
      {demoModalOpen && (
        <div
          onClick={() => setDemoModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 280,
            background: 'rgba(3, 4, 7, 0.86)',
            backdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '880px',
              width: '100%',
              background: '#0d0f15',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 30px 90px rgba(0,0,0,0.9)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                المخطط المعماري المتكامل لمنظومة سُترة (IoT Nodes + Edge + Cloud ERP)
              </div>
              <button type="button" onClick={() => setDemoModalOpen(false)} className="btn-ray-dark" style={{ padding: '6px 12px' }}>
                إغلاق ✕
              </button>
            </div>
            <img
              src="/assets/Gemini_Generated_Image_jzzlbnjzzlbnjzzl.png"
              alt="Sotrah Architecture"
              style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '12px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const footerTitleStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#e5e7eb',
  marginBottom: '14px',
};

const footerListStyle = {
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  fontSize: '13px',
  color: '#7d828f',
};
