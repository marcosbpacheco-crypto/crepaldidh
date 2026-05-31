import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Prevent crash if user hasn't configured Supabase yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-site request forgery (CSRF) attacks, CORS, and token
  // spoofing.
  // IMPORTANT: DO NOT USE getSession(). It is not secure. Use getUser() instead.
  let user = null
  try {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()
    user = supabaseUser
  } catch (error) {
    // Supabase está inativo/indisponível localmente
  }

  // Verifica o cookie de bypass local para desenvolvimento
  const isMockDev = request.cookies.get('sb-mock-session')?.value === 'true'
  const finalUser = user || (isMockDev ? { id: 'mock-user-id', email: 'admin@crepaldidh.com.br' } : null)

  // Define protected routes that require authentication
  // Any route that isn't login or register is considered protected for now
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')

  if (!finalUser && !isAuthRoute && !isPortalRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access auth routes, redirect to dashboard
  if (finalUser && isAuthRoute && !isPortalRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
