import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { RUTA_INICIO } from '../lib/api';
import { useSesion } from '../lib/sesion';

export function Ingresar() {
  const { usuario, ingresar } = useSesion();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await ingresar(correo, clave);
      navigate(RUTA_INICIO[u.rol], { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const campo =
    'w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-300 text-[15px] text-[#0f2a3d] placeholder:text-slate-400 focus:outline-none focus:border-[#48a6a7] focus:ring-4 focus:ring-[#48a6a7]/15 transition';

  return (
    <div data-tema="claro" className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Lado de la imagen */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#08121c] p-12 text-white">
        <motion.img
          src="/images/mission_invoices_investigation.webp"
          alt=""
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08121c] via-[#08121c]/60 to-[#08121c]/40" />
        <Link to="/" className="relative">
          <img src="/marca/udh-logo-blanco.webp" alt="Universidad de Huánuco" className="h-11 w-auto" />
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative space-y-4 max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7fd0d1]">Laboratorio de auditoría tributaria</p>
          <p className="font-display text-4xl font-extrabold leading-[1.1]">
            Cada factura cuenta una historia.
            <br />
            <span className="text-[#f2b632]">Aprende a leerla.</span>
          </p>
          <p className="text-white/70">Casos ficticios con empresas de Huánuco. Errores reales que un contador debe detectar.</p>
        </motion.div>
      </div>

      {/* Formulario */}
      <div className="flex flex-col px-6 sm:px-12 py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0f2a3d]">
            <ArrowLeft className="w-4 h-4" /> Volver a la portada
          </Link>
          <img src="/marca/udh-logo-oscuro.webp" alt="" className="h-8 w-auto lg:hidden" />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.form
            onSubmit={enviar}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="space-y-2">
              <p className="font-display font-extrabold text-[#0f2a3d] leading-none">
                AUDIT <span className="text-[#48a6a7]">LAB</span>
              </p>
              <h1 className="font-display text-3xl font-extrabold text-[#0f2a3d] tracking-tight">Ingresa a tu laboratorio</h1>
              <p className="text-slate-500 text-sm">Usa el correo y la contraseña que te entregó tu docente o la administración.</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-[#0f2a3d]">Correo</span>
                <span className="relative block mt-1.5">
                  <Mail className="w-[18px] h-[18px] text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="email" autoComplete="username" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tucodigo@udh.edu.pe" className={campo} />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#0f2a3d]">Contraseña</span>
                <span className="relative block mt-1.5">
                  <Lock className="w-[18px] h-[18px] text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type={ver ? 'text' : 'password'} autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••••" className={`${campo} pr-12`} />
                  <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {ver ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </span>
              </label>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              disabled={enviando}
              className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#48a6a7] hover:bg-[#3d9495] text-white font-semibold transition-colors shadow-lg shadow-[#48a6a7]/25 disabled:opacity-60"
            >
              {enviando ? 'Ingresando…' : 'Ingresar'}
              {!enviando && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>

            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-5">
              ¿No tienes cuenta u olvidaste tu contraseña? Pídele al administrador del laboratorio que la cree o la restablezca.
            </p>
          </motion.form>
        </div>
        <p className="text-[11px] text-slate-400 text-center">Escuela Profesional de Contabilidad · Universidad de Huánuco</p>
      </div>
    </div>
  );
}
