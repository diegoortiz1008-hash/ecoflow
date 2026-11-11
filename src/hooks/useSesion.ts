import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sesion } from '../types/domain'
import { useRepository } from './useRepository'

/** Sesión actual (Supabase Auth) y escucha de login/logout. */
export function useSesion() {
  const repo = useRepository()
  const [state, setState] = useState<{ sesion: Sesion | null; loaded: boolean }>({ sesion: null, loaded: false })

  useEffect(() => {
    let active = true
    const refresh = () => repo.getSesion().then((sesion) => active && setState({ sesion, loaded: true }))
    void refresh()
    const sub = supabase?.auth.onAuthStateChange(() => void refresh())
    return () => {
      active = false
      sub?.data.subscription.unsubscribe()
    }
  }, [repo])

  return { sesion: state.sesion, isLoading: !state.loaded }
}
