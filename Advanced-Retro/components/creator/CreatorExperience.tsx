'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  ExternalLink,
  Globe,
  Mail,
  MonitorPlay,
  Phone,
  Play,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import styles from './creator.module.css';

const displayFont = Bebas_Neue({ subsets: ['latin'], weight: '400' });
const bodyFont = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

const heroName = 'JOEL RIVERA RODRIGUEZ';
const scrambleAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/joel-rivera-rodriguez-7140a6334/',
    detail: 'Perfil profesional',
    icon: BriefcaseBusiness,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/joel_riiveraa/',
    detail: 'Proceso, vida y updates',
    icon: Camera,
  },
  {
    label: 'Twitch',
    href: 'https://www.twitch.tv/flardop',
    detail: 'Streaming y comunidad',
    icon: MonitorPlay,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@JoelGamer44',
    detail: 'Vídeo y archivo creativo',
    icon: Play,
  },
  {
    label: 'Kickstarter',
    href: 'https://www.kickstarter.com/profile/1318310768',
    detail: 'Proyectos y campañas',
    icon: Rocket,
  },
  {
    label: 'Wix Portfolio',
    href: 'https://flardop44.wixsite.com/portafolio-joel/acerca-de',
    detail: 'Portafolio original',
    icon: Globe,
  },
];

const capabilities = [
  'Diseño UX/UI',
  'Desarrollo web',
  'Next.js',
  'WordPress',
  'Wix',
  'Figma',
  'HTML / CSS / JS',
  'E-commerce',
  'Dirección creativa',
  'Storytelling',
  'Editorial',
  'Social Media',
];

const workHighlights = [
  {
    title: 'Motionographer',
    role: 'Diseñador web y gestor de contenidos digitales',
    tools: 'Wix, WordPress, Figma, HTML5, PHP, JavaScript, SVG, Slack, Monday, Adobe Suite.',
    body:
      'Mi etapa más formativa. Aquí descubrí cómo unir criterio visual, desarrollo real, gestión editorial y ritmo de producción. Fue también el entorno desde el que viajé a Nueva York para trabajar y aprender.',
  },
  {
    title: 'F5 Festival',
    role: 'Gestor de proyectos web y soporte técnico',
    tools: 'WordPress, Wix, PHP, JavaScript.',
    body:
      'Coordinación, soporte y desarrollo alrededor de una experiencia de festival digital. Trabajo orientado a contenido vivo, organización y resolución de problemas sin romper el ritmo del proyecto.',
  },
  {
    title: 'Gestión de RRHH y Contenidos',
    role: 'Community Manager y especialista en marketing digital',
    tools: 'Instagram, TikTok, Vimeo, LinkedIn, Flodesk, Brevo, Notion.',
    body:
      'Estrategia social, piezas rápidas, campañas y organización del ecosistema de comunicación. Aprendí a adaptar tono, formato y mensaje sin perder intención.',
  },
  {
    title: 'Motion Awards',
    role: 'Desarrollador y diseñador de interactividad web',
    tools: 'WordPress, HTML5, CSS, JavaScript, Elementor, Figma.',
    body:
      'Diseño e implementación de páginas con foco en interacción, eventos y claridad visual. Una experiencia útil para equilibrar espectáculo visual y usabilidad.',
  },
  {
    title: 'Alma Mater',
    role: 'Consultor de UX/UI y desarrollador web',
    tools: 'Figma, WordPress, herramientas de desarrollo web.',
    body:
      'Revisión de estructura, responsive, navegación y experiencia visual. Trabajo de criterio: mejorar lo existente para que gane claridad, consistencia y lectura.',
  },
  {
    title: 'Proyectos técnicos y funcionalidades avanzadas',
    role: 'Desarrollador Full Stack / Soporte técnico',
    tools: 'PHP, JavaScript, HTML5, APIs externas, SVG, TinyPNG, Squoosh.',
    body:
      'Optimización, integraciones, seguridad, mantenimiento y resolución de incidencias. El tipo de trabajo menos visible, pero clave para que todo funcione de verdad.',
  },
];

const featuredProjects = [
  {
    title: 'AdvancedRetro.es',
    strap: 'E-commerce · Producto digital · Universo propio',
    href: '/',
    external: false,
    body:
      'Una tienda retro profesional construida desde cero con visión de producto. Inventario, comunidad, subastas, mystery boxes y una identidad visual propia.',
    accent: 'from-sky-400/60 via-cyan-300/20 to-transparent',
  },
  {
    title: 'Retroville',
    strap: 'Serie · Worldbuilding · Dirección creativa',
    href: '/retroville',
    external: false,
    body:
      'Un universo narrativo original donde el hardware olvidado sigue vivo. Personajes, ciudad, iconografía, transporte, lore y tono de serie en construcción.',
    accent: 'from-violet-500/60 via-fuchsia-400/20 to-transparent',
  },
  {
    title: 'Escritura y publicaciones',
    strap: 'Narrativa · Libros · Proyecto de largo aliento',
    href: '#contacto',
    external: false,
    body:
      'Tengo varios libros publicados y llevo tiempo trabajando en una obra mucho más ambiciosa. La escritura forma parte central de cómo pienso y construyo mundos.',
    accent: 'from-emerald-400/55 via-lime-300/18 to-transparent',
  },
];

const storyBlocks = [
  {
    title: 'De la curiosidad al criterio',
    body:
      'Desde niño me consideré una persona creativa y original. Mientras muchos a mi alrededor eran más cerrados o rutinarios, yo pasaba los días dibujando, construyendo y creando. También disfrutaba de los videojuegos y la Nintendo DS, pero siempre con una mirada de curiosidad y experimentación.',
    image: '/images/creator/joel-childhood-road.jpg',
    alt: 'Joel de niño en una calle de tierra',
    caption: 'Curiosidad, juego y construcción desde el principio.',
  },
  {
    title: 'Crear desde lo cercano',
    body:
      'Mi historia creativa no sale solo de las pantallas o de los juegos. También viene de mi familia, de los recuerdos que me acompañan y de la necesidad de construir algo propio con sentido.',
    image: '/images/creator/joel-parents-photo.png',
    alt: 'Joel de niño con sus padres en una foto familiar antigua',
    caption: 'Lo personal también forma parte del porqué de todo esto.',
  },
  {
    title: 'Aprender haciendo',
    body:
      'He intentado muchas cosas y no todas salieron bien. Pero cada proyecto me enseñó algo nuevo. Aprendí que los errores no son un freno, sino parte natural del proceso creativo y técnico.',
    image: '/images/creator/joel-memory-collage.png',
    alt: 'Collage de fotos de la infancia de Joel',
    caption: 'Mi portafolio no es solo trabajo: también es recorrido.',
  },
];

const strengths = [
  'Interfaces con jerarquía clara y dirección visual real.',
  'Producto digital con intención, no demos sin profundidad.',
  'Capacidad de escribir, diseñar, programar y ordenar sistemas.',
  'Narrativa y construcción de universos como valor diferencial.',
  'Aprendizaje constante y tolerancia alta a resolver problemas difíciles.',
  'Trabajo muy implicado, muy cabezota y orientado a que las cosas salgan bien.',
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
      { threshold: 0.18 }
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
        <div className="mx-auto grid w-full max-w-[1460px] gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.72fr)] lg:items-center">
          <div>
            <p
              data-reveal
              className={`${styles.reveal} inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-sky-100/80`}
            >
              <Sparkles className="h-4 w-4" />
              Portfolio · UX/UI · Desarrollo · Narrativa
            </p>
            <h1
              data-reveal
              className={`${styles.reveal} ${displayFont.className} mt-6 text-[4.4rem] uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-[5.8rem] lg:text-[7rem] xl:text-[7.8rem]`}
            >
              <span className={styles.glitchTitle} data-text={displayName}>
                {displayName}
              </span>
            </h1>
            <p
              data-reveal
              className={`${styles.reveal} mt-4 text-sm uppercase tracking-[0.28em] text-white/60 sm:text-base`}
            >
              UX/UI & Web Designer · Developer · Creator
            </p>
            <p
              data-reveal
              className={`${styles.reveal} mt-6 max-w-[40rem] text-lg leading-8 text-slate-300 sm:text-[1.22rem]`}
            >
              Diseño experiencias digitales, construyo producto real y desarrollo universos con identidad. Este portfolio reúne mi recorrido, mi forma de pensar y el trabajo que mejor explica cómo construyo.
            </p>

            <div data-reveal className={`${styles.reveal} mt-8 flex flex-wrap gap-3`}>
              <a
                href="#trabajo"
                data-cursor="interactive"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66c0f4,#8e6dff)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.25)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Ver trabajo
                <ArrowDown className="h-4 w-4" />
              </a>
              <a
                href="mailto:flardop44@gmail.com"
                data-cursor="interactive"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                <Mail className="h-4 w-4" />
                flardop44@gmail.com
              </a>
              <a
                href="tel:+34690380559"
                data-cursor="interactive"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-transparent px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-primary/40 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                690 380 559
              </a>
            </div>

            <div data-reveal className={`${styles.reveal} mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3`}>
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="interactive"
                    className="group rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-primary/45 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center gap-3 text-white">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-sky-200">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{link.label}</p>
                        <p className="truncate text-xs text-slate-400 transition group-hover:text-slate-300">{link.detail}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
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

      <section id="resumen" ref={registerSection(1)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1460px] gap-10 lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-[rgba(10,14,24,0.78)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8 lg:p-10">
            <p data-reveal className={`${styles.reveal} text-xs uppercase tracking-[0.3em] text-sky-200/70`}>Acerca de</p>
            <h2 data-reveal className={`${styles.reveal} ${displayFont.className} mt-5 text-5xl uppercase leading-none text-white sm:text-6xl`}>
              Un portfolio que crece conmigo
            </h2>
            <div data-reveal className={`${styles.reveal} mt-8 space-y-6 text-lg leading-9 text-slate-200 sm:text-[1.16rem]`}>
              <p>¡Hola! Soy Joel Rivera Rodriguez, un apasionado del diseño web y el desarrollo de experiencias digitales. Este espacio es mi lienzo para compartir contigo mi recorrido profesional, mis habilidades y el trabajo creativo que he ido construyendo.</p>
              <p>Aquí reúno mis estudios, los sitios web que he diseñado y desarrollado, las empresas y proyectos con los que he colaborado, y también mis exploraciones personales. Me interesa mostrar no solo trabajos terminados, sino proceso, crecimiento, criterio y versatilidad.</p>
              <p>Mi objetivo no es enseñar piezas bonitas sin contexto, sino demostrar cómo combino creatividad, habilidades técnicas y resolución de problemas para construir experiencias digitales con identidad.</p>
              <p>Este portfolio es un espacio en evolución constante. Resume quién soy, lo que hago y hacia dónde quiero dirigir profesionalmente mi trabajo.</p>
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24">
            <aside data-reveal className={`${styles.reveal} rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl`}>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200/70">Capacidades</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {capabilities.map((skill) => (
                  <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100">
                    {skill}
                  </span>
                ))}
              </div>
            </aside>

            <aside data-reveal className={`${styles.reveal} rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,34,0.9),rgba(10,14,22,0.94))] p-6 backdrop-blur-xl`}>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200/70">En qué destaco</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section id="historia" ref={registerSection(2)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1460px]">
          <div data-reveal className={`${styles.reveal} mb-10 max-w-[56rem]`}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Historia</p>
            <h2 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white sm:text-6xl`}>
              De niño creativo a constructor de producto y universos
            </h2>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {storyBlocks.map((block) => (
              <article
                key={block.title}
                data-reveal
                className={`${styles.reveal} overflow-hidden rounded-[1.9rem] border border-white/10 bg-[rgba(10,14,24,0.72)] shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl`}
              >
                <div className="relative aspect-[5/4] overflow-hidden border-b border-white/10 bg-black/20">
                  <Image
                    src={block.image}
                    alt={block.alt}
                    fill
                    sizes="(max-width: 1280px) 100vw, 32vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6 sm:p-7">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/70">Memoria</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{block.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-300">{block.body}</p>
                  <p className="mt-5 text-sm leading-7 text-slate-400">{block.caption}</p>
                </div>
              </article>
            ))}
          </div>

          <div
            data-reveal
            className={`${styles.reveal} mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(9,13,22,0.76)] p-4 backdrop-blur-xl sm:p-6`}
          >
            <div className="relative aspect-[16/7] overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/20">
              <Image
                src="/images/creator/joel-memory-collage.png"
                alt="Collage de infancia de Joel Rivera Rodriguez"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="trabajo" ref={registerSection(3)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1460px]">
          <div data-reveal className={`${styles.reveal} mb-10 max-w-[58rem]`}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Experiencia</p>
            <h2 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white sm:text-6xl`}>
              Proyectos, roles y sistemas en los que he trabajado
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              Mi portfolio no se limita a una sola disciplina. He trabajado entre diseño, desarrollo, contenido, estrategia digital y soporte técnico. Ese cruce es parte de mi valor.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {workHighlights.map((item) => (
              <article
                key={item.title}
                data-reveal
                className={`${styles.reveal} rounded-[1.9rem] border border-white/10 bg-[rgba(10,14,24,0.76)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-8`}
              >
                <p className="text-xs uppercase tracking-[0.26em] text-sky-200/70">{item.role}</p>
                <h3 className="mt-4 text-3xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-300">{item.body}</p>
                <div className="mt-6 rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
                  <span className="font-semibold text-white">Herramientas:</span> {item.tools}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proyectos" ref={registerSection(4)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1460px]">
          <div data-reveal className={`${styles.reveal} mb-10 max-w-[52rem]`}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Proyectos propios</p>
            <h2 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white sm:text-6xl`}>
              Donde junto visión, diseño, desarrollo y narrativa
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featuredProjects.map((project) => {
              const cardContent = (
                <>
                  <div className={`${styles.cardGlow} bg-gradient-to-br ${project.accent}`} />
                  <div className="relative z-10 flex h-full flex-col">
                    <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">
                      {project.strap}
                    </span>
                    <h3 className="mt-6 text-3xl font-semibold text-white">{project.title}</h3>
                    <p className="mt-4 max-w-[38rem] text-base leading-8 text-slate-300">{project.body}</p>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition group-hover:text-white">
                      Ver proyecto
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </>
              );

              return (
                <Link
                  key={project.title}
                  href={project.href}
                  data-reveal
                  data-cursor="interactive"
                  className={`${styles.reveal} ${styles.card3d} group relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[rgba(10,14,24,0.78)] p-6 backdrop-blur-xl sm:p-8`}
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

      <section id="contacto" ref={registerSection(5)} className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1460px] rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,30,0.96),rgba(8,12,20,0.98))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.64fr)_minmax(360px,0.36fr)] lg:items-start">
            <div>
              <p data-reveal className={`${styles.reveal} text-xs uppercase tracking-[0.3em] text-sky-200/70`}>Contacto</p>
              <h2 data-reveal className={`${styles.reveal} ${displayFont.className} mt-4 text-5xl uppercase leading-none text-white sm:text-6xl`}>
                Portfolio online, listo para LinkedIn y para trabajar conmigo
              </h2>
              <p data-reveal className={`${styles.reveal} mt-5 max-w-[44rem] text-base leading-8 text-slate-300 sm:text-lg`}>
                Si buscas diseño con criterio, producto con identidad, una web que tenga sentido o alguien capaz de unir dirección creativa y ejecución, podemos hablar.
              </p>

              <div data-reveal className={`${styles.reveal} mt-8 grid gap-3 sm:grid-cols-2`}>
                <a
                  href="mailto:flardop44@gmail.com"
                  data-cursor="interactive"
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-primary/40 hover:bg-white/[0.07]"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-sky-200/70">Email</p>
                  <p className="mt-2 text-lg font-semibold text-white">flardop44@gmail.com</p>
                </a>
                <a
                  href="tel:+34690380559"
                  data-cursor="interactive"
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-primary/40 hover:bg-white/[0.07]"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-sky-200/70">Teléfono</p>
                  <p className="mt-2 text-lg font-semibold text-white">690 380 559</p>
                </a>
              </div>

              <div data-reveal className={`${styles.reveal} mt-8 flex flex-wrap gap-3`}>
                <Link
                  href="/contacto"
                  data-cursor="interactive"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66c0f4,#8e6dff)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.25)] transition hover:brightness-110"
                >
                  Ir a contacto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://flardop44.wixsite.com/portafolio-joel/acerca-de"
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="interactive"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/[0.08]"
                >
                  Ver portfolio Wix
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div data-reveal className={`${styles.reveal} rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6`}>
              <p className="text-xs uppercase tracking-[0.26em] text-sky-200/70">Redes y plataformas</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="interactive"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-primary/40 hover:text-white"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{link.label}</p>
                      <p className="truncate text-xs text-slate-400">{link.detail}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
