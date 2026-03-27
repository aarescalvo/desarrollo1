import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - Listar facturas con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const search = searchParams.get('search')

    const where: Prisma.FacturaWhereInput = {}

    if (estado && estado !== 'TODOS') {
      where.estado = estado as 'PENDIENTE' | 'EMITIDA' | 'PAGADA' | 'ANULADA'
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) where.fecha.lte = new Date(hasta)
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const facturas = await db.factura.findMany({
      where,
      include: {
        cliente: true,
        detalles: true,
        pagos: {
          orderBy: { fecha: 'desc' }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    // Calcular totales
    const stats = {
      total: facturas.length,
      pendientes: facturas.filter(f => f.estado === 'PENDIENTE').length,
      pagadas: facturas.filter(f => f.estado === 'PAGADA').length,
      montoTotal: facturas
        .filter(f => f.estado !== 'ANULADA')
        .reduce((sum, f) => sum + f.total.toNumber(), 0),
      saldoPendiente: facturas
        .filter(f => f.estado === 'PENDIENTE')
        .reduce((sum, f) => {
          const pagado = f.pagos.reduce((s, p) => s + p.monto.toNumber(), 0)
          return sum + (f.total.toNumber() - pagado)
        }, 0)
    }

    return NextResponse.json({
      success: true,
      data: facturas,
      stats
    })
  } catch (error) {
    console.error('Error fetching facturas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

// POST - Crear factura con detalles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      condicionVenta,
      remito,
      observaciones,
      detalles,
      operadorId
    } = body

    if (!clienteId || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cliente y detalles son requeridos' },
        { status: 400 }
      )
    }

    // Obtener ultimo numero de factura
    const ultimaFactura = await db.factura.findFirst({
      orderBy: { numeroInterno: 'desc' }
    })
    const numeroInterno = (ultimaFactura?.numeroInterno || 0) + 1
    const numero = `0001-${String(numeroInterno).padStart(8, '0')}`

    // Calcular totales
    let subtotal = 0
    for (const det of detalles) {
      subtotal += det.cantidad * det.precioUnitario
    }
    const iva = subtotal * 0.21 // IVA 21%
    const total = subtotal + iva

    // Crear factura con detalles
    const factura = await db.factura.create({
      data: {
        numero,
        numeroInterno,
        clienteId,
        fecha: new Date(),
        subtotal,
        iva,
        total,
        estado: 'PENDIENTE',
        condicionVenta,
        remito,
        observaciones,
        operadorId,
        detalles: {
          create: detalles.map((det: {
            tipoProducto: string
            descripcion: string
            cantidad: number
            unidad: string
            precioUnitario: number
            subtotal: number
            tropaCodigo?: string
            garron?: number
            mediaResId?: string
            pesoKg?: number
          }) => ({
            tipoProducto: det.tipoProducto,
            descripcion: det.descripcion,
            cantidad: det.cantidad,
            unidad: det.unidad || 'KG',
            precioUnitario: det.precioUnitario,
            subtotal: det.cantidad * det.precioUnitario,
            tropaCodigo: det.tropaCodigo,
            garron: det.garron,
            mediaResId: det.mediaResId,
            pesoKg: det.pesoKg
          }))
        }
      },
      include: {
        cliente: true,
        detalles: true
      }
    })

    // Guardar historico de precios
    for (const det of detalles) {
      if (det.descripcion && det.precioUnitario > 0) {
        await db.historicoPrecio.upsert({
          where: {
            clienteId_producto: {
              clienteId,
              producto: det.descripcion
            }
          },
          create: {
            clienteId,
            producto: det.descripcion,
            precio: det.precioUnitario
          },
          update: {
            precio: det.precioUnitario,
            fecha: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: factura,
      message: `Factura ${numero} creada exitosamente`
    })
  } catch (error) {
    console.error('Error creating factura:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear factura' },
      { status: 500 }
    )
  }
}
