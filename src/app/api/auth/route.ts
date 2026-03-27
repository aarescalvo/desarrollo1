import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

function getClientIP(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return '127.0.0.1'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = searchParams.get('operadorId')
    
    if (!operadorId) {
      return NextResponse.json({ success: false, error: 'Operador ID requerido' }, { status: 400 })
    }
    
    const operador = await db.operador.findUnique({ where: { id: operadorId } })
    
    if (!operador || !operador.activo) {
      return NextResponse.json({ success: false, error: 'Operador no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: operador.id,
        nombre: operador.nombre,
        usuario: operador.usuario,
        rol: operador.rol,
        email: operador.email,
        permisos: {
          puedePesajeCamiones: operador.puedePesajeCamiones,
          puedePesajeIndividual: operador.puedePesajeIndividual,
          puedeMovimientoHacienda: operador.puedeMovimientoHacienda,
          puedeListaFaena: operador.puedeListaFaena,
          puedeRomaneo: operador.puedeRomaneo,
          puedeIngresoCajon: operador.puedeIngresoCajon,
          puedeMenudencias: operador.puedeMenudencias,
          puedeStock: operador.puedeStock,
          puedeReportes: operador.puedeReportes,
          puedeCCIR: operador.puedeCCIR,
          puedeFacturacion: operador.puedeFacturacion,
          puedeConfiguracion: operador.puedeConfiguracion
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error de servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuario, password, pin } = body
    
    if (usuario && password) {
      const operador = await db.operador.findFirst({
        where: { usuario: String(usuario).toLowerCase(), activo: true }
      })
      
      if (!operador) {
        return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 401 })
      }
      
      const validPassword = bcrypt.compareSync(password, operador.password)
      
      if (!validPassword) {
        return NextResponse.json({ success: false, error: 'Contraseña incorrecta' }, { status: 401 })
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: operador.id,
          nombre: operador.nombre,
          usuario: operador.usuario,
          rol: operador.rol,
          email: operador.email,
          permisos: {
            puedePesajeCamiones: operador.puedePesajeCamiones,
            puedePesajeIndividual: operador.puedePesajeIndividual,
            puedeMovimientoHacienda: operador.puedeMovimientoHacienda,
            puedeListaFaena: operador.puedeListaFaena,
            puedeRomaneo: operador.puedeRomaneo,
            puedeIngresoCajon: operador.puedeIngresoCajon,
            puedeMenudencias: operador.puedeMenudencias,
            puedeStock: operador.puedeStock,
            puedeReportes: operador.puedeReportes,
            puedeCCIR: operador.puedeCCIR,
            puedeFacturacion: operador.puedeFacturacion,
            puedeConfiguracion: operador.puedeConfiguracion
          }
        }
      })
    }
    
    if (pin) {
      const operador = await db.operador.findFirst({
        where: { pin: String(pin), activo: true }
      })
      
      if (!operador) {
        return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 401 })
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: operador.id,
          nombre: operador.nombre,
          usuario: operador.usuario,
          rol: operador.rol,
          email: operador.email,
          permisos: {
            puedePesajeCamiones: operador.puedePesajeCamiones,
            puedePesajeIndividual: operador.puedePesajeIndividual,
            puedeMovimientoHacienda: operador.puedeMovimientoHacienda,
            puedeListaFaena: operador.puedeListaFaena,
            puedeRomaneo: operador.puedeRomaneo,
            puedeIngresoCajon: operador.puedeIngresoCajon,
            puedeMenudencias: operador.puedeMenudencias,
            puedeStock: operador.puedeStock,
            puedeReportes: operador.puedeReportes,
            puedeCCIR: operador.puedeCCIR,
            puedeFacturacion: operador.puedeFacturacion,
            puedeConfiguracion: operador.puedeConfiguracion
          }
        }
      })
    }
    
    return NextResponse.json({ success: false, error: 'Credenciales requeridas' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error de servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true })
}
