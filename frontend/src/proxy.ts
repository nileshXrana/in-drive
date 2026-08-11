import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {

    const token = request.cookies.get('access_token')?.value;
    const { pathname } = request.nextUrl;

    if (token) {
        if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    } else {
        if (pathname === '/dashboard' || pathname === '/rider-dashboard' || pathname === '/') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard', '/rider-dashboard', '/login', '/signup', '/'],
};
