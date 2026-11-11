import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Field, Input } from './ui/field'

/** Inicio de sesión con Supabase Auth (solo en modo conectado). */
export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    const { error } = (await supabase?.auth.signInWithPassword({ email, password })) ?? { error: null }
    setEnviando(false)
    if (error) setError('Credenciales inválidas.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>☀️ EcoFlow</CardTitle>
          <CardDescription>Inicia sesión con tu cuenta corporativa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Field id="email" label="Correo"><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field id="password" label="Contraseña"><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
