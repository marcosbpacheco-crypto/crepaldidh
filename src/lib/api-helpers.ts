import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function missingEnv(name: string): never {
  throw new Error(`API: ${name} is not configured`)
}

export function parseJson(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => {
    throw new Error('Invalid JSON body')
  })
}
