"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, Globe, CheckCircle, AlertCircle, Loader2, ArrowRight, Twitter, Linkedin, Github } from "lucide-react";
import { submitWaitlist, type WaitlistFormState } from "@/app/actions";
import AnimatedSection from "./AnimatedSection";

const initialState: WaitlistFormState = {
  success: false,
  message: "",
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={isPending}
      whileHover={!isPending ? { scale: 1.02 } : {}}
      whileTap={!isPending ? { scale: 0.98 } : {}}
      className="w-full relative overflow-hidden group flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-sm font-bold text-dark-base bg-gradient-to-r from-neon-cyan to-neon-purple disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-dark-base" />
          <span>Processando sua inscrição...</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          <span>Solicitar Acesso Beta</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </>
      )}
    </motion.button>
  );
}

export default function WaitlistSection() {
  const [state, setState] = useState<WaitlistFormState>(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function formAction(formData: FormData) {
    startTransition(async () => {
      const result = await submitWaitlist(state, formData);
      setState(result);
    });
  }

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  return (
    <section id="waitlist" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/10 via-transparent to-neon-cyan/5 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan" />
            </span>
            <span className="text-xs font-semibold text-neon-cyan tracking-wider uppercase">
              Beta Limitado — 47 Vagas Restantes
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6">
            <span className="text-white">Pare de Adivinhar.</span>
            <br />
            <span className="text-gradient-cyan-purple">Comece a Diagnosticar.</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Solicite acesso beta e ganhe um{" "}
            <span className="text-white font-semibold">White Glove onboarding gratuito</span>
            — configuramos seu CAPI, auditamos seu funil e mostramos exatamente onde você está
            perdendo dinheiro.
          </p>
        </AnimatedSection>

        {/* Form card */}
        <AnimatedSection delay={0.1}>
          <div className="relative glass-card rounded-3xl border border-dark-border/60 overflow-hidden">
            {/* Top glow accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-20 bg-neon-cyan/10 blur-2xl pointer-events-none" />

            <div className="relative p-8 lg:p-10">
              <AnimatePresence mode="wait">
                {state.success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-8"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 mb-5">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Você está na lista!
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                      {state.message}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-neon-cyan" />
                      <span>Verifique seu e-mail para confirmação</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <form ref={formRef} action={formAction} className="space-y-5">
                      {/* Global error */}
                      <AnimatePresence>
                        {state.message && !state.success && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10"
                          >
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-sm text-red-400">{state.message}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor="email"
                            className="block text-xs font-semibold text-gray-400 uppercase tracking-wider"
                          >
                            E-mail Corporativo
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                              type="email"
                              id="email"
                              name="email"
                              placeholder="you@company.com"
                              autoComplete="email"
                              className={`w-full bg-dark-surface border rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all duration-200 ${
                                state.errors?.email
                                  ? "border-red-500/60"
                                  : "border-dark-border hover:border-gray-600"
                              }`}
                            />
                          </div>
                          {state.errors?.email && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {state.errors.email[0]}
                            </p>
                          )}
                        </div>

                        {/* Website */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor="website"
                            className="block text-xs font-semibold text-gray-400 uppercase tracking-wider"
                          >
                            URL do Site / Loja
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                              type="text"
                              id="website"
                              name="website"
                              placeholder="yourstore.com"
                              autoComplete="url"
                              className={`w-full bg-dark-surface border rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all duration-200 ${
                                state.errors?.website
                                  ? "border-red-500/60"
                                  : "border-dark-border hover:border-gray-600"
                              }`}
                            />
                          </div>
                          {state.errors?.website && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {state.errors.website[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      <SubmitButton isPending={isPending} />

                      <p className="text-center text-xs text-gray-600">
                        Não é necessário cartão de crédito. Ao se inscrever, você concorda com nossa{" "}
                        <a href="#" className="text-gray-500 hover:text-gray-400 underline">
                          Política de Privacidade
                        </a>
                        .
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </AnimatedSection>

        {/* Trust badges */}
        <AnimatedSection delay={0.2} className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
            {[
              "White Glove Setup Incluído",
              "Sem Contratos de Fidelidade",
              "SOC 2 Compliant",
              "Resposta em até 48h",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-neon-cyan/60" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>

      {/* Footer bottom bar */}
      <div className="relative mt-24 border-t border-dark-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm">
                <span className="text-gradient-cyan-purple">FunnelGuard</span>
                <span className="text-white"> AI</span>
              </span>
            </div>

            <p className="text-xs text-gray-700 text-center">
              &copy; {new Date().getFullYear()} FunnelGuard AI. All rights reserved.
            </p>

            <div className="flex items-center gap-3">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    aria-label={link.label}
                    className="w-8 h-8 rounded-lg border border-dark-border flex items-center justify-center text-gray-600 hover:text-gray-400 hover:border-gray-600 transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
