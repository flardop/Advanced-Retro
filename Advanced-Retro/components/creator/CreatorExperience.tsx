'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import styles from './creator.module.css';

const displayFont = Bebas_Neue({ subsets: ['latin'], weight: '400' });
const bodyFont = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

const heroName = 'JOEL RIVERA RODRIGUEZ';
const scrambleAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const skills = [
  'UX/UI Design',
  'Web Development',
  'Next.js',
  'E-commerce',
  'Brand Identity',
  'Editorial Design',
  'Social Media',
  'Storytelling',
];

const projects = [
  {
    title: 'AdvancedRetro.es',
    description:
      'Tienda retro profesional. E-commerce construido desde cero con Next.js, sistema de inventario, comunidad, subastas y mystery boxes.',
    meta: 'E-commerce · Next.js · Full Stack',
    status: 'ACTIVO',
    href: '/',
    accent: 'from-sky-400/60 via-cyan-300/22 to-transparent',
  },
  {
    title: 'Retroville',
    description:
      'Universo narrativo original. Una ciudad oscura y cómica donde el hardware olvidado sigue vivo. En desarrollo para noviembre 2026.',
    meta: 'World Building · Narrative Design',
    status: 'EN DESARROLLO',
    href: '/retroville',
    accent: 'from-violet-500/55 via-fuchsia-400/20 to-transparent',
  },
  {
    title: 'Motionographer',
    description:
      'Diseño, programación, gestión editorial y redes sociales para una plataforma internacional de animación y motion design.',
    meta: 'Design · Dev · Content',
    status: '2023–2024',
    href: 'https://motionographer.com',
    accent: 'from-orange-400/60 via-amber-300/20 to-transparent',
  },
  {
    title: 'Escritura & Publicaciones',
    description:
      'Varios libros publicados. Actualmente trabajando en el proyecto más ambicioso: una obra narrativa de largo aliento.',
    meta: 'Escritura · Narrativa',
    status: 'EN PROCESO',
    href: '#contacto',
    accent: 'from-emerald-400/60 via-lime-300/18 to-transparent',
  },
];

const values = [
  {
    title: 'Creatividad sin límites',
    body: 'Cada proyecto es una oportunidad de experimentar, probar y construir algo con identidad propia.',
  },
  {
    title: 'Persistencia real',
    body: 'Los errores forman parte del proceso. Lo importante es seguir iterando hasta que la experiencia funcione de verdad.',
  },
  {
    title: 'Generosidad activa',
    body: 'Me interesa crear cosas que otros puedan disfrutar, entender y usar con confianza.',
  },
];

export default function CreatorExperience() {
  const [displayName, setDisplayName] = useState(heroName);
  const [cursorPoint, setCursorPoint] = useState({ x: -100, y: -100 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorHover, setCursorHover] = useState(false);
  const sectionRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let timer = 0;
    let iteration = 0;
    const totalFrames = heroName.length + 10;

    const animate = () => {
      iteration += 0.45;
      const nextValue = heroName
        .split('')
        .map((letter, index) => {
          if (letter === ' ') return ' ';
          if (index < iteration) return heroName[index];
          return scrambleAlphabet[Math.floor(Math.random() * scrambleAlphabet.length)];
        })
        .join('');

      setDisplayName(nextValue);
      if (iteration < totalFrames) {
        timer = window.setTimeout(animate, 36) as unknown as number;
      } else {
        setDisplayName(heroName);
      }
    };

    animate();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      setCursorVisible(true);
      setCursorPoint({ x: event.clientX, y: event.clientY });
      const target = event.target as HTMLElement | null;
      setCursorHover(Boolean(target?.closest('[data-cursor="interactive"]')));
    };

    const handlePointerLeave = () => setCursorVisible(false);

    window.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealVisible);
          }
        });
      },
      { threshold: 0.2 }
    );

    const nodes = sectionRefs.current
      .filter((section): section is HTMLElement => Boolean(section))
      .flatMap((section) => Array.from(section.querySelectorAll<HTMLElement>('[data-reveal]')));

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const registerSection = (index: number) => (element: HTMLElement | null) => {
    if (!element) return;
    sectionRefs.current[index] = element;
  };

  const heroSubtitle = useMemo(
    () => 'Diseño experiencias digitales. Construyo mundos. Cuento historias.',
    []
  );

  return (
    <main className={`${bodyFont.className} ${styles.shell} min-h-screen overflow-hidden text-white`}>
      <div className={`pointer-events-none fixed inset-0 opacity-20 ${styles.gridOverlay}`} />
      <span
        className={`${styles.cursorDot} ${cursorVisible ? styles.cursorVisible : ''}`}
        style={{ left: cursorPoint.x, top: cursorPoint.y }}
      />
      <span
        className={`${styles.cursorRing} ${cursorVisible ? styles.cursorVisible : ''} ${cursorHover ? styles.cursorHover : ''}`}
        style={{ left: cursorPoint.x, top: cursorPoint.y }}
      />

      <section
        id="creator-hero"
        ref={registerSection(0)}
        className="relative flex min-h-[100svh] items-center px-5 py-20 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid w-full max-w-[1460px] gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.72fr)] lg:items-center">
          <div>
            <p data-reveal className={`${styles.reveal} inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-sky-100/80`}>
              <Sparkles className="h-4 w-4" />
              Creador de AdvancedRetro
            </p>
            <h1 data-reveal className={`${styles.reveal} ${displayFont.className} mt-6 text-[4.4rem] uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-[5.8rem] lg:text-[7.4rem] xl:text-[8rem]`}>
              <span className={styles.glitchTitle} data-text={displayName}>{displayName}</span>
            </h1>
            <p data-reveal className={`${styles.reveal} mt-4 text-sm uppercase tracking-[0.28em] text-white/60 sm:text-base`}>
              UX/UI & Web Designer · Developer · Creator
            </p>
            <p data-reveal className={`${styles.reveal} mt-6 max-w-[34rem] text-lg leading-8 text-slate-300 sm:text-[1.28rem]`}>
              {heroSubtitle}
            </p>

            <div data-reveal className={`${styles.reveal} mt-8 flex flex-wrap gap-3`}>
              <a
                href="#proyectos"
                data-cursor="interactive"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66c0f4,#8e6dff)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.25)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Ver proyectos
                <ArrowDown className="h-4 w-4" />
              </a>
              <Link
                href="/contacto"
                data-cursor="interactive"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                ¿Trabajamos juntos?
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://flardop44.wixsite.com/portafolio-joel"
                target="_blank"
                rel="noreferrer"
                data-cursor="interactive"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-transparent px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-primary/40 hover:text-white"
              >
                Portafolio original
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div data-reveal className={`${styles.reveal} ${styles.photoWrap} mx-auto w-full max-w-[520px]`}>
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,27,0.82),rgba(11,14,22,0.94))] p-4 shadow-[0_26px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6">
              <div className={`${styles.photoTone} overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/30`}>
                <Image
                  src="/images/creator/joel-color.jpg"
                  alt="Joel Rivera Rodriguez"
                  width={960}
                  height={1200}
                  priority
                  sizes="(max-width: 1024px) 84vw, 38vw"
                  className="h-auto w-full object-cover transition duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="bio" ref={registerSection(1)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1460px] gap-10 lg:grid-cols-[minmax(0,0.64fr)_minmax(320px,0.36fr)] lg:items-start">
          <div className="rounded-[2rem] border border-white/10 bg-[rgba(10,14,24,0.78)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8 lg:min-h-[68vh] lg:p-10">
            <p data-reveal className={`${styles.reveal} text-xs uppercase tracking-[0.3em] text-sky-200/70`}>Un poco de mí</p>
            <h2 data-reveal className={`${styles.reveal} ${displayFont.className} mt-5 text-5xl uppercase leading-none text-white sm:text-6xl`}>
              Diseño con contexto, no por inercia
            </h2>
            <div data-reveal className={`${styles.reveal} mt-8 max-w-[54rem] space-y-6 text-lg leading-9 text-slate-200 sm:text-[1.2rem]`}>
              <p>Desde niño me consideré una persona creativa y original. Mientras muchos a mi alrededor eran más cerrados o rutinarios, yo pasaba los días construyendo y creando.</p>
              <p>Aprendí prácticamente todo lo que sé en Motionographer, donde realicé tareas de diseño, programación, gestión editorial y redes sociales durante más de un año y medio, incluyendo un mes en Nueva York trabajando y aprendiendo.</p>
              <p>Me considero una persona emocional, pasional y perseverante. Mi objetivo es lograr independencia económica y compartir experiencias que, en mi infancia, muchas veces no tuve.</p>
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24">
            <aside data-reveal className={`${styles.reveal} rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl`}>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200/70">Habilidades</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100">
                    {skill}
                  </span>
                ))}
              </div>
            </aside>

            <aside data-reveal className={`${styles.reveal} rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,34,0.9),rgba(10,14,22,0.94))] p-6 backdrop-blur-xl`}>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200/70">Enfoque</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>Interfaces con criterio visual y jerarquía clara.</li>
                <li>Desarrollo orientado a producto real, no a demos.</li>
                <li>Universos de marca con narrativa, tono y dirección propia.</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section id="proyectos" ref={registerSection(2)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1460px]">
          <div data-reveal className={`${styles.reveal} mb-10 max-w-[52rem]`}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Proyectos</p>
            <h2 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white sm:text-6xl`}>
              E-commerce, narrativa y producto digital
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              Trabajo en proyectos que mezclan diseño, desarrollo y dirección creativa. No me interesa construir algo correcto si no tiene identidad.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project) => {
              const external = project.href.startsWith('http');
              const cardContent = (
                <>
                  <div className={`${styles.cardGlow} bg-gradient-to-br ${project.accent}`} />
                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">
                        {project.meta}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/78">{project.status}</span>
                    </div>
                    <h3 className="mt-7 text-3xl font-semibold text-white sm:text-4xl">{project.title}</h3>
                    <p className="mt-4 max-w-[38rem] text-base leading-8 text-slate-300">{project.description}</p>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition group-hover:text-white">
                      Ver proyecto
                      {external ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </div>
                  </div>
                </>
              );

              const sharedClassName = `${styles.reveal} ${styles.card3d} group relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[rgba(10,14,24,0.78)] p-6 backdrop-blur-xl sm:p-8`;

              return external ? (
                <a
                  key={project.title}
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  data-reveal
                  data-cursor="interactive"
                  className={sharedClassName}
                  onMouseMove={(event) => {
                    const element = event.currentTarget;
                    const rect = element.getBoundingClientRect();
                    const px = (event.clientX - rect.left) / rect.width;
                    const py = (event.clientY - rect.top) / rect.height;
                    element.style.setProperty('--card-rx', `${(0.5 - py) * 8}deg`);
                    element.style.setProperty('--card-ry', `${(px - 0.5) * 10}deg`);
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.setProperty('--card-rx', '0deg');
                    event.currentTarget.style.setProperty('--card-ry', '0deg');
                  }}
                >
                  {cardContent}
                </a>
              ) : (
                <Link
                  key={project.title}
                  href={project.href}
                  data-reveal
                  data-cursor="interactive"
                  className={sharedClassName}
                  onMouseMove={(event) => {
                    const element = event.currentTarget;
                    const rect = element.getBoundingClientRect();
                    const px = (event.clientX - rect.left) / rect.width;
                    const py = (event.clientY - rect.top) / rect.height;
                    element.style.setProperty('--card-rx', `${(0.5 - py) * 8}deg`);
                    element.style.setProperty('--card-ry', `${(px - 0.5) * 10}deg`);
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.setProperty('--card-rx', '0deg');
                    event.currentTarget.style.setProperty('--card-ry', '0deg');
                  }}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="values" ref={registerSection(3)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1460px]">
          <div data-reveal className={`${styles.reveal} mb-10 max-w-[52rem]`}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Cómo trabajo</p>
            <h2 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white sm:text-6xl`}>
              Criterio, constancia y humanidad
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} data-reveal className={`${styles.reveal} rounded-[1.9rem] border border-white/10 bg-[rgba(10,14,24,0.74)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-8`}>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-200/70">Valor</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{value.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-300">{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" ref={registerSection(4)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1460px] rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,30,0.96),rgba(8,12,20,0.98))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)] lg:items-end">
            <div>
              <p data-reveal className={`${styles.reveal} text-xs uppercase tracking-[0.3em] text-sky-200/70`}>Contacto</p>
              <h2 data-reveal className={`${styles.reveal} ${displayFont.className} mt-4 text-5xl uppercase leading-none text-white sm:text-6xl`}>
                ¿Trabajamos juntos?
              </h2>
              <p data-reveal className={`${styles.reveal} mt-5 max-w-[44rem] text-base leading-8 text-slate-300 sm:text-lg`}>
                Si buscas diseño con criterio, producto con identidad o una web que realmente tenga sentido dentro de una marca, podemos hablar.
              </p>
              <div data-reveal className={`${styles.reveal} mt-8 flex flex-wrap gap-3`}>
                <Link href="/contacto" data-cursor="interactive" className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66c0f4,#8e6dff)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.25)] transition hover:brightness-110">
                  Ir a contacto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://flardop44.wixsite.com/portafolio-joel"
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="interactive"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/[0.08]"
                >
                  Ver portafolio original
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div data-reveal className={`${styles.reveal} rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6`}>
              <p className="text-xs uppercase tracking-[0.26em] text-sky-200/70">Links</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <a href="https://flardop44.wixsite.com/portafolio-joel" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-primary/40 hover:text-white">
                  Wix Portfolio
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link href="/retroville" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-primary/40 hover:text-white">
                  Retroville
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-primary/40 hover:text-white">
                  AdvancedRetro.es
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
