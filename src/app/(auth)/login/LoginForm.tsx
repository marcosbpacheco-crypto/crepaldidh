'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import Image from 'next/image'

const initialState = {
  error: '',
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await login(formData)
      if (result?.error) {
        return { error: result.error }
      }
      return { error: '' }
    },
    initialState
  )

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
          {state.error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
            E-mail Corporativo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all text-sm"
              placeholder="seu.nome@empresa.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            <a href="#" className="text-xs font-semibold text-brand-teal hover:text-brand-teal/80 transition-colors">
              Esqueceu a senha?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-full shadow-md shadow-brand-teal/25 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-70 transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
      >
        {pending ? (
          <Image 
            src="/logo-icon.png" 
            alt="Carregando..." 
            width={24} 
            height={24} 
            className="animate-spin"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        ) : (
          <>
            Entrar no Sistema
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
}
