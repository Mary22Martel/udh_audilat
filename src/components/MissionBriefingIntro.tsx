import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Shield, Sparkles, Target } from 'lucide-react';
import { Mission } from '../types/audit';
import { soundFx } from '../utils/soundFx';
import { ResilientImage } from './ResilientImage';

interface MissionBriefingIntroProps {
  mission: Mission;
  onStartGameplay: () => void;
  onCancel: () => void;
}

const MANAGER_PORTRAIT = '/images/portrait_gerente_huanuco.webp';

export const MissionBriefingIntro: React.FC<MissionBriefingIntroProps> = ({
  mission,
  onStartGameplay,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const fullLine = `“Contador, acaba de llegar el requerimiento de ${mission.companyName.replace(/\.$/, "")}. ${mission.situation} Necesito que revises cada documento antes de que venza el plazo.”`;
  const [typedLen, setTypedLen] = useState(0);

  useEffect(() => {
    setTypedLen(0);
    const interval = setInterval(() => {
      setTypedLen((prev) => {
        if (prev >= fullLine.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 3;
      });
    }, 18);
    return () => clearInterval(interval);
  }, [fullLine]);

  return (
    <div className="min-h-screen bg-[var(--c-hondo)] text-[var(--c-texto)] relative flex flex-col justify-between overflow-hidden">
      {/* Cinematic Backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <ResilientImage
          src={mission.heroImage}
          alt={mission.title}
          className="w-full h-full object-cover opacity-20 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--c-hondo)]/90 via-[var(--c-fondo)]/85 to-[var(--c-hondo)]" />
      </div>

      {/* Top Strip */}
      <header className="relative z-10 px-6 sm:px-10 py-5 flex items-center justify-between border-b border-[var(--c-linea)]">
        <div className="flex items-center gap-3 text-xs font-mono-tabular">
          <span className="text-[var(--c-oro)] font-bold">{mission.number}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[var(--c-teal)]">{mission.dossierCode}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[var(--c-suave)] hidden sm:inline">{mission.companyName}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="text-xs text-[var(--c-suave)] hover:text-[var(--c-texto)] transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              onStartGameplay();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--c-panel)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] text-xs font-medium text-[var(--c-texto)] transition-colors"
          >
            Saltar intro
          </button>
        </div>
      </header>

      {/* Main Briefing Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="max-w-4xl w-full space-y-8">
          {/* Mission Title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="space-y-2 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--c-teal)]">
              Operación de Defensa Tributaria
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[var(--c-texto)] tracking-tight">
              {mission.title}
            </h1>
            <p className="text-sm text-[var(--c-suave)]">
              {mission.procedureType} · {mission.taxInvestigated} · Período {mission.taxPeriod}
            </p>
          </motion.div>

          {step === 1 ? (
            /* BEAT 1: VISUAL NOVEL / CHARACTER BRIEFING */
            <motion.div
              key="beat-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-[var(--c-panel2)]/95 border border-[var(--c-linea)] rounded-2xl p-6 sm:p-8 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
            >
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-2">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden border-2 border-[var(--c-oro)]/60 shadow-lg">
                  <ResilientImage
                    src={MANAGER_PORTRAIT}
                    alt="Gerente General solicitando auditoría"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-[var(--c-texto)]">
                    Gerencia General
                  </p>
                  <p className="text-xs text-[var(--c-oro)]">{mission.companyName}</p>
                </div>
              </div>

              <div className="md:col-span-8 space-y-5">
                <div className="flex items-center justify-between text-xs text-[var(--c-suave)]">
                  <span className="font-semibold text-[var(--c-teal)]">Llamada prioritaria · Despacho Contable</span>
                  <span className="font-mono-tabular">Plazo: {mission.deadlineDaysLeft} días hábiles</span>
                </div>

                <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-xl p-5 min-h-[120px]">
                  <p className="text-sm sm:text-base text-[var(--c-texto)] leading-relaxed">
                    {fullLine.slice(0, typedLen)}
                    {typedLen < fullLine.length && (
                      <span className="inline-block w-1.5 h-4 bg-[var(--c-teal)] ml-1 align-middle" />
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-[var(--c-suave)]">
                    Recompensa base: <strong className="text-[var(--c-oro)] font-mono-tabular">+{mission.xpReward} XP</strong>
                  </p>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-semibold transition-colors"
                  >
                    <span>Aceptar encargo y ver objetivos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* BEAT 2: TACTICAL GAME MECHANICS & STAKES */
            <motion.div
              key="beat-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-[var(--c-panel2)]/95 border border-[var(--c-teal)]/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--c-teal)]">
                    <Shield className="w-4 h-4" />
                    <span>Escudo Fiscal (100%)</span>
                  </div>
                  <p className="text-xs text-[var(--c-suave)] leading-relaxed">
                    Cada diagnóstico erróneo o decisión riesgosa reduce la defensa tributaria de la empresa.
                  </p>
                </div>

                <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--c-oro)]">
                    <Sparkles className="w-4 h-4" />
                    <span>Racha de Combo</span>
                  </div>
                  <p className="text-xs text-[var(--c-suave)] leading-relaxed">
                    Encadena hallazgos correctos sin fallar para multiplicar la XP hasta x2.5 y alcanzar Rango S.
                  </p>
                </div>

                <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--c-texto)]">
                    <Clock className="w-4 h-4 text-[var(--c-teal)]" />
                    <span>5 Fases Tácticas</span>
                  </div>
                  <p className="text-xs text-[var(--c-suave)] leading-relaxed">
                    Inspecciona papeles, cruza registros, clasifica pruebas, conecta el tablero y decide.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--c-texto)] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[var(--c-teal)]" />
                  <span>Objetivo principal del expediente</span>
                </p>
                <p className="text-xs sm:text-sm text-[var(--c-suave)] leading-relaxed">
                  {mission.objective}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-[var(--c-suave)] hover:text-[var(--c-texto)]"
                >
                  Releer llamada de gerencia
                </button>
                <button
                  onClick={() => {
                    soundFx.playDiscovery(1);
                    onStartGameplay();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-bold transition-transform active:scale-[0.98]"
                >
                  <span>Entrar a la Sala de Auditoría</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};
