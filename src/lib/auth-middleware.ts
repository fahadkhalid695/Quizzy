import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface DecodedToken {
  userId: string
  email: string
  role: 'teacher' | 'student' | 'admin'
  iat: number
  exp: number
}

export async function verifyToken(token: string): Promise<DecodedToken | null> {
  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'your-secret-key'
    ) as DecodedToken
    return decoded
  } catch (error) {
    return null
  }
}

export function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export async function protectedRoute(
  request: NextRequest,
  requiredRole?: 'teacher' | 'student' | 'admin'
): Promise<DecodedToken | NextResponse> {
  const token = extractTokenFromHeader(request)

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  const decoded = await verifyToken(token)

  if (!decoded) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid token' },
      { status: 401 }
    )
  }

  if (requiredRole && decoded.role !== requiredRole && decoded.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  return decoded
}
