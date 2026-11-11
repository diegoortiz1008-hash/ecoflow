import { useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { Dashboard } from './components/Dashboard'
import { LoginForm } from './components/LoginForm'
import { RepositoryProvider } from './context/RepositoryProvider'
import { useSesion } from './hooks/useSesion'
import { supabase } from './lib/supabase'
import { createDemoRepository, DEMO_USUARIOS } from './services/demoRepository'
import { createSupabaseRepository } from './services/supabaseRepository'

// Modo demo: un único repositorio en memoria; la sesión activa se cambia desde el selector.
const demoSesion = { actual: DEMO_USUARIOS[0] }
const demoRepo = createDemoRepository({ getSesion: () => demoSesion.actual })

function DemoApp() {
  const [sesion, setSesion] = useState(DEMO_USUARIOS[0])
  const cambiarUsuario = (userId: string) => {
    const nueva = DEMO_USUARIOS.find((u) => u.userId === userId) ?? DEMO_USUARIOS[0]
    demoSesion.actual = nueva
    setSesion(nueva)
  }

  return (
    <RepositoryProvider repository={demoRepo}>
      <AppShell sesion={sesion} modo="demo" usuariosDemo={DEMO_USUARIOS} onCambiarUsuario={cambiarUsuario}>
        <Dashboard key={sesion.userId} sesion={sesion} />
      </AppShell>
    </RepositoryProvider>
  )
}

function SupabaseApp() {
  const repo = useMemo(() => createSupabaseRepository(supabase!), [])
  return (
    <RepositoryProvider repository={repo}>
      <SupabaseSession />
    </RepositoryProvider>
  )
}

function SupabaseSession() {
  const { sesion, isLoading } = useSesion()
  if (isLoading) return <p className="p-8 text-slate-500">Cargando sesión…</p>
  if (!sesion) return <LoginForm />
  return (
    <AppShell sesion={sesion} modo="supabase">
      <Dashboard key={sesion.userId} sesion={sesion} />
    </AppShell>
  )
}

export default function App() {
  return supabase ? <SupabaseApp /> : <DemoApp />
}
