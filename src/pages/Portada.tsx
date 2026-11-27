import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, FileSearch, FolderCheck, GraduationCap, Mail, Network, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_MISSIONS } from '../data/missionsData';
import { RUTA_INICIO } from '../lib/api';
import { MISIONES_ACTIVAS } from '../lib/reglas';
import { useSesion } from '../lib/sesion';

const aparecer = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const },
};

function Antetitulo({ children, claro = false }: { children: ReactNode; claro?: boolean }) {
  return <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${claro ? 'text-[#7fd0d1]' : 'text-[#2f8f90]'}`}>{children}</p>;
}

/** Título que aparece palabra por palabra. */
function TituloAnimado({ lineas }: { lineas: string[] }) {
  let n = 0;
  return (
    <h1 className="font-display font-extrabold tracking-tight text-white text-4xl sm:text-6xl lg:text-7xl leading-[1.02]">
      {lineas.map((linea, i) => (
        <span key={i} className="block">
          {linea.split(' ').map((p) => {
            const k = n++;
            return (
              <motion.span
                key={k}
                className="inline-block mr-[0.25em]"
                initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.25 + k * 0.07, duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {i === 1 && p.startsWith('practica') ? <span className="text-[#f2b632]">{p}</span> : p}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/** Esquela de SUNAT que entra flotando en la portada. */
function EsquelaFlotante() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, rotate: 6 }}
      animate={{ opacity: 1, x: 0, rotate: 2 }}
      transition={{ delay: 1.1, duration: 0.8, type: 'spring', damping: 16 }}
      className="hidden xl:block absolute right-10 2xl:right-24 top-1/2 -translate-y-1/2 w-[340px]"
    >
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="relative">
        <div className="absolute -inset-3 rounded-3xl bg-[#48a6a7]/20 blur-2xl" />
        <div className="relative bg-[#fbfaf6] rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#c8102e] to-[#1f3a68]" />
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-[#c8102e]">Buzón SOL · Esquela</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Vence en 3 días</span>
            </div>
            <p className="font-display font-bold text-slate-900 leading-snug">Esquela de Citación N° 0048-2026 – Crédito Fiscal IGV</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Se detectaron inconsistencias en el crédito fiscal declarado (S/ 18,450.00). Presente su Registro de Compras y medios de pago.
            </p>
            <div className="flex gap-2 pt-1">
              {['F001-000482', 'REG 8.1', 'PDT 621'].map((d) => (
                <span key={d} className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 text-slate-600">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, type: 'spring' }}
          className="absolute -left-10 -bottom-8 bg-[#0f2a3d] text-white rounded-xl px-4 py-3 shadow-xl border border-white/10 flex items-center gap-3"
        >
          <span className="w-9 h-9 rounded-lg bg-[#f2b632] text-[#1a1406] font-display font-black flex items-center justify-center">S</span>
          <span>
            <span className="block text-[10px] text-white/60 uppercase tracking-wider">Rango obtenido</span>
            <span className="block text-sm font-semibold">+1,240 XP · Auditor impecable</span>
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Encabezado() {
  const { usuario } = useSesion();
  const [solido, setSolido] = useState(false);
  useEffect(() => {
    const f = () => setSolido(window.scrollY > 40);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${solido ? 'bg-white/90 backdrop-blur shadow-sm' : ''}`}>
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={solido ? '/marca/udh-logo-oscuro.webp' : '/marca/udh-logo-blanco.webp'} alt="Universidad de Huánuco" className="h-10 w-auto" />
          <span className={`hidden sm:block h-8 w-px ${solido ? 'bg-slate-300' : 'bg-white/30'}`} />
          <span className={`hidden sm:block font-display font-extrabold leading-none text-sm ${solido ? 'text-[#0f2a3d]' : 'text-white'}`}>
            AUDIT
            <br />
            <span className="text-[#48a6a7]">LAB</span>
          </span>
        </Link>
        <nav className={`hidden md:flex items-center gap-8 text-[15px] font-medium ${solido ? 'text-[#0f2a3d]' : 'text-white'}`}>
          <a href="#experiencia" className="hover:text-[#48a6a7] transition-colors">La experiencia</a>
          <a href="#casos" className="hover:text-[#48a6a7] transition-colors">Casos</a>
          <a href="#como-funciona" className="hover:text-[#48a6a7] transition-colors">Cómo funciona</a>
        </nav>
        <Link
          to={usuario ? RUTA_INICIO[usuario.rol] : '/ingresar'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#48a6a7] hover:bg-[#3d9495] text-white text-sm font-semibold transition-colors shadow-lg shadow-[#48a6a7]/30"
        >
          {usuario ? 'Ir a mi panel' : 'Ingresar'} <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}

export function Portada() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const fondoY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const textoOpacidad = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const casos = INITIAL_MISSIONS.filter((m) => (MISIONES_ACTIVAS as readonly string[]).includes(m.id));

  return (
    <div data-tema="claro" className="bg-white text-[#0f2a3d]">
      <Encabezado />

      {/* Portada con foto */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center overflow-hidden bg-[#08121c]">
        <motion.img
          src="/images/hero_mission_audit_desk.webp"
          alt=""
          style={{ y: fondoY }}
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08121c] via-[#08121c]/80 to-[#08121c]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08121c] via-transparent to-[#08121c]/50" />

        <motion.div style={{ opacity: textoOpacidad }} className="relative max-w-[1240px] w-full mx-auto px-5 sm:px-8 pt-28 pb-20">
          <div className="max-w-3xl space-y-7">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Antetitulo claro>Laboratorio de auditoría tributaria · UDH</Antetitulo>
            </motion.div>
            <TituloAnimado lineas={['La contabilidad se estudia.', 'La auditoría se practica.']} />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-lg text-white/80 max-w-xl leading-relaxed">
              Recibe una esquela de SUNAT, revisa facturas y registros, encuentra lo que no cuadra y defiende tu expediente. Como en una fiscalización de verdad.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="flex flex-wrap gap-3">
              <Link to="/ingresar" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#48a6a7] hover:bg-[#3d9495] text-white font-semibold transition-all hover:gap-3 shadow-xl shadow-[#48a6a7]/30">
                Comenzar mi práctica <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link to="/ingresar?registro=1" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/30 bg-white/5 backdrop-blur text-white font-semibold hover:bg-white/15 transition-colors">
                Soy alumno: crear mi cuenta <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-xs text-white/50 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Escuela Profesional de Contabilidad · Universidad de Huánuco
            </motion.p>
          </div>
        </motion.div>
        <EsquelaFlotante />

        <motion.a
          href="#experiencia"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          aria-label="Bajar"
        >
          <ArrowDown className="w-5 h-5" />
        </motion.a>
      </section>

      {/* Tira de beneficios */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-8 grid sm:grid-cols-3 gap-6">
          {[
            { i: FileSearch, t: 'Casos tributarios', d: 'IGV, renta, inventarios y fehaciencia' },
            { i: ShieldCheck, t: 'Evidencia que se investiga', d: 'Facturas, guías, kardex y PDT 621' },
            { i: BarChart3, t: 'Seguimiento docente', d: 'Avance real de cada alumno' },
          ].map((x, k) => (
            <motion.div key={x.t} {...aparecer} transition={{ ...aparecer.transition, delay: k * 0.1 }} className="flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-[#48a6a7]/12 text-[#2f8f90] flex items-center justify-center">
                <x.i className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-semibold">{x.t}</span>
                <span className="block text-sm text-slate-500">{x.d}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* La experiencia */}
      <section id="experiencia" className="bg-[#f4f8f9] py-24 scroll-mt-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-12">
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <motion.div {...aparecer} className="space-y-3">
              <Antetitulo>Aprender haciendo</Antetitulo>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
                Tu conocimiento.
                <br />
                Ahora, en acción.
              </h2>
            </motion.div>
            <motion.p {...aparecer} className="text-slate-600 md:text-right md:max-w-sm md:ml-auto">
              Cada misión es un expediente completo. La teoría la pones a prueba cuando tienes que decidir qué factura sustenta el crédito fiscal.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: '/01', i: Mail, t: 'Recibe la esquela.', d: 'El caso llega como en la vida real: una esquela de SUNAT y un mensaje urgente de la gerencia.' },
              { n: '/02', i: Network, t: 'Investiga la evidencia.', d: 'Inspecciona comprobantes, cruza registros, clasifica documentos y encuentra dónde se rompe la cadena probatoria.' },
              { n: '/03', i: FolderCheck, t: 'Defiende tu expediente.', d: 'Toma decisiones frente a SUNAT, arma tu expediente y recibe tu rango con la explicación de cada error.' },
            ].map((c, k) => (
              <motion.div
                key={c.n}
                {...aparecer}
                transition={{ ...aparecer.transition, delay: k * 0.12 }}
                whileHover={{ y: -6 }}
                className="group relative bg-white rounded-2xl p-7 shadow-[0_1px_2px_rgba(15,42,61,.06),0_12px_32px_-16px_rgba(15,42,61,.25)] overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full border-[14px] border-[#48a6a7]/8 group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-start justify-between">
                  <span className="w-12 h-12 rounded-xl bg-[#48a6a7]/12 text-[#2f8f90] flex items-center justify-center">
                    <c.i className="w-5 h-5" />
                  </span>
                  <span className="font-mono text-sm font-semibold text-[#2f8f90]">{c.n}</span>
                </div>
                <h3 className="font-display text-xl font-bold mt-8">{c.t}</h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{c.d}</p>
                <div className="mt-8 flex gap-1.5">
                  <span className="h-1 w-8 rounded-full bg-[#48a6a7]/40 group-hover:w-14 transition-all" />
                  <span className="h-1 w-3 rounded-full bg-[#f2b632]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos */}
      <section id="casos" className="py-24 bg-white scroll-mt-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-10">
          <motion.div {...aparecer} className="space-y-3 max-w-2xl">
            <Antetitulo>Los casos</Antetitulo>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">Empresas de Huánuco. Problemas de verdad.</h2>
            <p className="text-slate-600">Empresas y RUC ficticios, situaciones que un contador enfrenta cada mes.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {casos.map((m, k) => (
              <motion.div
                key={m.id}
                {...aparecer}
                transition={{ ...aparecer.transition, delay: k * 0.08 }}
                className={`group relative rounded-2xl overflow-hidden h-80 ${k === 0 ? 'lg:col-span-2' : ''}`}
              >
                <img src={m.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08121c] via-[#08121c]/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white space-y-1.5 translate-y-3 group-hover:translate-y-0 transition-transform">
                  <p className="text-[11px] font-mono text-[#f2b632]">
                    {m.number} · {m.difficulty}
                  </p>
                  <h3 className="font-display text-lg font-bold leading-tight">{m.title}</h3>
                  <p className="text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">{m.taxInvestigated}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cifras */}
      <section className="bg-[#0f2a3d] text-white py-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            ['5', 'casos completos'],
            ['5', 'fases de auditoría'],
            ['6', 'competencias medidas'],
            ['7', 'rangos de auditor'],
          ].map(([n, t], k) => (
            <motion.div key={t} {...aparecer} transition={{ ...aparecer.transition, delay: k * 0.1 }} className="text-center">
              <p className="font-display text-5xl font-extrabold text-[#f2b632]">{n}</p>
              <p className="text-sm text-white/70 mt-1">{t}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-24 bg-[#f4f8f9] scroll-mt-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12">
          <motion.div {...aparecer} className="lg:col-span-5 space-y-4">
            <Antetitulo>Del aula a la fiscalización</Antetitulo>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
              Prepara tu caso.
              <br />
              Defiéndelo ante SUNAT.
            </h2>
            <p className="text-slate-600">Tres roles trabajan juntos para que cada práctica cuente.</p>
            <Link to="/ingresar" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#48a6a7] hover:bg-[#3d9495] text-white font-semibold transition-colors">
              Estoy listo para empezar <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <div className="lg:col-span-7 space-y-4">
            {[
              { n: '01', i: GraduationCap, t: 'El estudiante resuelve', d: 'Entra con su cuenta, resuelve casos, sube de rango y compite en el podio de su aula.' },
              { n: '02', i: Users, t: 'El docente acompaña', d: 'Ve qué competencias domina cada alumno, qué errores se repiten y qué temas reforzar en clase.' },
              { n: '03', i: UserCog, t: 'La administración organiza', d: 'Crea las cuentas, asigna alumnos a cada docente y sigue el uso del laboratorio.' },
            ].map((p, k) => (
              <motion.div key={p.n} {...aparecer} transition={{ ...aparecer.transition, delay: k * 0.12 }} className="flex gap-5 bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,42,61,.06),0_12px_32px_-18px_rgba(15,42,61,.25)]">
                <span className="font-display text-3xl font-extrabold text-[#48a6a7]/40 w-12 shrink-0">{p.n}</span>
                <span className="w-11 h-11 rounded-xl bg-[#f2b632]/15 text-[#a86a0a] flex items-center justify-center shrink-0">
                  <p.i className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-display font-bold text-lg">{p.t}</span>
                  <span className="block text-sm text-slate-600 mt-1">{p.d}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Llamado final */}
      <section className="relative overflow-hidden bg-[#08121c] text-white">
        <img src="/images/mission_invoices_investigation.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08121c] to-[#08121c]/60" />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-24 grid md:grid-cols-2 gap-10 items-center">
          <motion.div {...aparecer} className="space-y-4">
            <Antetitulo claro>El próximo paso es tuyo</Antetitulo>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold leading-[1.05]">
              Tu primera fiscalización
              <br />
              empieza aquí.
            </h2>
            <p className="text-white/70 max-w-md">No necesitas saberlo todo. Solo las ganas de revisar, equivocarte, aprender y volver a intentarlo.</p>
          </motion.div>
          <motion.div {...aparecer} className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-7 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7fd0d1]">Casos ficticios. Aprendizaje real.</p>
            <p className="font-display text-2xl font-bold">Ingresa con la cuenta que te dio tu docente o la administración.</p>
            <Link to="/ingresar" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#48a6a7] hover:bg-[#3d9495] font-semibold transition-colors">
              Ingresar a AUDIT LAB <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-[#061019] text-white/60 text-sm">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/marca/udh-logo-blanco.webp" alt="Universidad de Huánuco" className="h-9 w-auto opacity-80" />
          <p className="text-center">Escuela Profesional de Contabilidad · Casos y RUC ficticios, sin conexión real con SUNAT.</p>
          <p>© {new Date().getFullYear()} UDH</p>
        </div>
      </footer>
    </div>
  );
}
