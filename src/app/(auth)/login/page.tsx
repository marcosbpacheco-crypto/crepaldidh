'use client'

import { LoginForm } from './LoginForm'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side: Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-brand-blue overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image 
            src="/login-hero.png" 
            alt="Desenvolvimento Humano" 
            fill
            className="object-cover"
            priority
          />
        </motion.div>
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-brand-blue/40 to-transparent"></div>
        
        {/* Floating Content on the Image */}
        <div className="relative z-10 w-full h-full flex flex-col justify-end p-20">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-brand-teal/20 text-brand-teal text-xs font-bold tracking-widest uppercase mb-6 border border-brand-teal/30">
              Evolução Constante
            </span>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Potencializando pessoas,<br/> 
              <span className="text-brand-teal">alavancando negócios.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-lg leading-relaxed">
              Gestão estratégica de capital humano para empresas que buscam alta performance e cultura de engajamento.
            </p>
          </motion.div>
          
          {/* Subtle decoration elements */}
          <div className="mt-16 flex gap-8">
            <div className="flex flex-col">
              <span className="text-white text-2xl font-bold">100%</span>
              <span className="text-slate-400 text-xs uppercase tracking-tighter">Seguro e Criptografado</span>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-white text-2xl font-bold">ERP</span>
              <span className="text-slate-400 text-xs uppercase tracking-tighter">SaaS de Alta Gestão</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 lg:px-20 bg-slate-50 relative">
        {/* Floating Background Shapes for Modern Feel */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto relative z-10"
        >
          <div className="mb-12">
            <Image 
              src="/logo-full.png" 
              alt="CrepaldiDH Logo" 
              width={300} 
              height={75} 
              className="object-contain mb-10"
              priority
            />
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo</h2>
            <p className="text-slate-500 mt-2">Acesse sua conta para gerenciar sua operação.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-slate-100">
            <LoginForm />
          </div>

          <p className="mt-12 text-center text-slate-400 text-sm">
            © 2026 Crepaldi Desenvolvimento Humano.<br/>
            Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
