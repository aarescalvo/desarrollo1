import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener sugerencias FIFO para despacho
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const producto = searchParams.get('producto')
    const camaraId = searchParams.get('camaraId')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Construir filtro base - solo productos pendientes o empacados
    const where: any = {
      estado: { in: ['PENDIENTE', 'EMPACADO'] }
    }

    if (producto) {
      where.producto = { contains: producto, mode: 'insensitive' }
    }

    if (camaraId) {
      where.camaraId = camaraId
    }

    // Obtener productos ordenados por fecha de ingreso (FIFO)
    const productosFIFO = await db.registroEmpaque.findMany({
      where,
      include: {
        camara: true,
        lote: {
          include: {
            ingresos: {
              include: {
                camaraOrigen: true
              }
            }
          }
        }
      },
      orderBy: [
        { fechaVencimiento: 'asc' },  // Primero los que vencen antes
        { fechaIngreso: 'asc' }        // Luego por fecha de ingreso (FIFO)
      ],
      take: limit
    })

    // Calcular días en stock y estado FIFO
    const hoy = new Date()
    const productosConAnalisis = productosFIFO.map(p => {
      const fechaVenc = p.fechaVencimiento ? new Date(p.fechaVencimiento) : null
      const fechaIngreso = new Date(p.fechaIngreso)
      
      const diasEnStock = Math.floor((hoy.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24))
      const diasRestantes = fechaVenc 
        ? Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Determinar prioridad FIFO
      let prioridadFIFO: 'CRITICO' | 'ALTA' | 'MEDIA' | 'BAJA' = 'BAJA'
      let razon = ''

      if (diasRestantes !== null && diasRestantes < 0) {
        prioridadFIFO = 'CRITICO'
        razon = 'Producto vencido'
      } else if (diasRestantes !== null && diasRestantes <= 3) {
        prioridadFIFO = 'CRITICO'
        razon = `Vence en ${diasRestantes} días`
      } else if (diasRestantes !== null && diasRestantes <= 7) {
        prioridadFIFO = 'ALTA'
        razon = `Vence en ${diasRestantes} días`
      } else if (diasEnStock > 14) {
        prioridadFIFO = 'ALTA'
        razon = `${diasEnStock} días en stock`
      } else if (diasEnStock > 7) {
        prioridadFIFO = 'MEDIA'
        razon = `${diasEnStock} días en stock`
      } else {
        prioridadFIFO = 'BAJA'
        razon = 'Producto fresco'
      }

      return {
        ...p,
        diasEnStock,
        diasRestantes,
        prioridadFIFO,
        razonFIFO: razon
      }
    })

    // Agrupar por producto para resumen
    const resumenPorProducto = productosConAnalisis.reduce((acc, p) => {
      const key = p.producto
      if (!acc[key]) {
        acc[key] = {
          producto: p.producto,
          totalUnidades: 0,
          totalKg: 0,
          critico: 0,
          alta: 0,
          media: 0,
          baja: 0,
          kgCritico: 0
        }
      }
      
      acc[key].totalUnidades += p.cantidad
      acc[key].totalKg += p.pesoKg * p.cantidad
      
      if (p.prioridadFIFO === 'CRITICO') {
        acc[key].critico++
        acc[key].kgCritico += p.pesoKg * p.cantidad
      }
      if (p.prioridadFIFO === 'ALTA') acc[key].alta++
      if (p.prioridadFIFO === 'MEDIA') acc[key].media++
      if (p.prioridadFIFO === 'BAJA') acc[key].baja++
      
      return acc
    }, {} as Record<string, any>)

    // Estadísticas generales
    const stats = {
      totalProductos: productosConAnalisis.length,
      totalKg: productosConAnalisis.reduce((sum, p) => sum + p.pesoKg * p.cantidad, 0),
      criticos: productosConAnalisis.filter(p => p.prioridadFIFO === 'CRITICO').length,
      kgCriticos: productosConAnalisis
        .filter(p => p.prioridadFIFO === 'CRITICO')
        .reduce((sum, p) => sum + p.pesoKg * p.cantidad, 0),
      altaPrioridad: productosConAnalisis.filter(p => p.prioridadFIFO === 'ALTA').length,
      productosSinVencimiento: productosConAnalisis.filter(p => !p.fechaVencimiento).length
    }

    return NextResponse.json({
      success: true,
      data: productosConAnalisis,
      resumenPorProducto: Object.values(resumenPorProducto),
      stats
    })
  } catch (error) {
    console.error('Error fetching FIFO:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener sugerencias FIFO' },
      { status: 500 }
    )
  }
}

// POST - Registrar despacho según FIFO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paqueteIds, despachoId, observaciones } = body

    if (!paqueteIds || !Array.isArray(paqueteIds) || paqueteIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requieren IDs de paquetes' },
        { status: 400 }
      )
    }

    // Actualizar estado de los paquetes
    const actualizados = await Promise.all(
      paqueteIds.map(paqueteId =>
        db.registroEmpaque.update({
          where: { id: paqueteId },
          data: {
            estado: 'DESPACHADO',
            fechaDespacho: new Date(),
            observaciones: observaciones 
              ? `Despachado: ${observaciones}` 
              : 'Despachado según FIFO'
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: actualizados,
      message: `${actualizados.length} paquetes despachados según FIFO`
    })
  } catch (error) {
    console.error('Error despacho FIFO:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar despacho FIFO' },
      { status: 500 }
    )
  }
}
