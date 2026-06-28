'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  isAdmin: boolean
  isAuthenticated: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  demoMode: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [demoLoggedIn, setDemoLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const demoMode = !isSupabaseConfigured

  const refreshAdminStatus = useCallback(
    async (user: User | null) => {
      if (!user) {
        setIsAdmin(false)
        return
      }
      setIsAdmin(await fetchIsAdmin(user.id))
    },
    [],
  )

  useEffect(() => {
    if (demoMode) {
      setLoading(false)
      return
    }
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      void refreshAdminStatus(data.session?.user ?? null).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void refreshAdminStatus(nextSession?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [demoMode, refreshAdminStatus])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (demoMode) {
        if (!email.trim()) throw new Error('Email is required')
        setDemoLoggedIn(true)
        setIsAdmin(true)
        return
      }

      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const admin = data.user ? await fetchIsAdmin(data.user.id) : false
      if (!admin) {
        await supabase.auth.signOut()
        throw new Error(
          'This account does not have admin access. Contact the store owner.',
        )
      }

      setSession(data.session)
      setIsAdmin(true)
    },
    [demoMode],
  )

  const signOut = useCallback(async () => {
    if (demoMode) {
      setDemoLoggedIn(false)
      setIsAdmin(false)
      return
    }
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }, [demoMode])

  const isAuthenticated = demoMode ? demoLoggedIn : Boolean(session)

  const value = useMemo(
    () => ({
      session: demoMode ? null : session,
      user: demoMode ? null : (session?.user ?? null),
      isAdmin: demoMode ? demoLoggedIn && isAdmin : isAdmin,
      isAuthenticated,
      loading,
      signIn,
      signOut,
      demoMode,
    }),
    [
      session,
      isAdmin,
      isAuthenticated,
      loading,
      signIn,
      signOut,
      demoMode,
      demoLoggedIn,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
