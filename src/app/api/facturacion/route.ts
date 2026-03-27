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

    if (clienteId && clienteId !== '_TODOS_') {
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
        .reduce((sum, f) => sum + (f.total?.toNumber?.() || f.total || 0), 0),
      saldoPendiente: facturas
        .filter(f => f.estado === 'PENDIENTE')
        .reduce((sum, f) => {
          const total = f.total?.toNumber?.() || f.total || 0
          const pagado = f.pagos.reduce((s, p) => s + (p.monto?.toNumber?.() || p.monto || 0), 0)
          return sum + (total - pagado)
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
      { success: false, error: 'Error al obtener facturas: ' + (error instanceof Error ? error.message : String(error)) },
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
      condicionVenta = 'CONTADO',
      remito,
      observaciones,
      detalles,
      operadorId,
      tipoIva = 21 // Porcentaje de IVA, default 21%
    } = body

    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: 'Cliente es requerido' },
        { status: 400 }
      )
    }

    if (!detalles || detalles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe agregar al menos un item' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await db.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
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
      const cantidad = Number(det.cantidad) || 0
      const precio = Number(det.precioUnitario) || 0
      subtotal += cantidad * precio
    }
    
    const ivaRate = Number(tipoIva) / 100 || 0.21
    const iva = subtotal * ivaRate
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
            tipoProducto?: string
            descripcion: string
            cantidad: number
            unidad?: string
            precioUnitario: number
            tropaCodigo?: string
            garron?: number
            mediaResId?: string
            pesoKg?: number
          }) => ({
            tipoProducto: det.tipoProducto || 'OTRO',
            descripcion: det.descripcion || '',
            cantidad: Number(det.cantidad) || 0,
            unidad: det.unidad || 'KG',
            precioUnitario: Number(det.precioUnitario) || 0,
            precioConfirmado: true,
            subtotal: (Number(det.cantidad) || 0) * (Number(det.precioUnitario) || 0),
            tropaCodigo: det.tropaCodigo,
            garron: det.garron,
            mediaResId: det.mediaResId,
            pesoKg: det.pesoKg ? Number(det.pesoKg) : null
          }))
        }
      },
      include: {
        cliente: true,
        detalles: true
      }
    })

    return NextResponse.json({
      success: true,
      data: factura,
      message: `Factura ${numero} creada exitosamente`
    })
  } catch (error) {
    console.error('Error creating factura:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear factura: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
