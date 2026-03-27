import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - Listar productos vendibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const activo = searchParams.get('activo')
    const search = searchParams.get('search')

    const where: Prisma.ProductoVendibleWhereInput = {}

    if (categoria) {
      where.categoria = categoria as any
    }

    if (activo !== null && activo !== undefined) {
      where.activo = activo === 'true'
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ]
    }

    const productos = await db.productoVendible.findMany({
      where,
      include: {
        _count: {
          select: {
            preciosCliente: true,
            preciosHistorico: true
          }
        }
      },
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' }
      ]
    })

    // Obtener último precio de cada producto
    const productosConPrecio = await Promise.all(
      productos.map(async (producto) => {
        const ultimoPrecio = await db.historicoPrecioProducto.findFirst({
          where: { productoVendibleId: producto.id },
          orderBy: { fechaVigencia: 'desc' }
        })

        return {
          ...producto,
          precioActual: ultimoPrecio?.precioNuevo || producto.precioBase || 0,
          ultimoCambioPrecio: ultimoPrecio?.createdAt || null
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: productosConPrecio
    })
  } catch (error) {
    console.error('Error fetching productos vendibles:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos vendibles' },
      { status: 500 }
    )
  }
}

// POST - Crear producto vendible
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      codigo,
      nombre,
      descripcion,
      categoria,
      subcategoria,
      especie,
      tipoVenta,
      unidadMedida,
      precioBase,
      moneda,
      alicuotaIva,
      requiereTrazabilidad
    } = body

    // Verificar que el código no exista
    const existente = await db.productoVendible.findUnique({
      where: { codigo }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un producto con ese código' },
        { status: 400 }
      )
    }

    const producto = await db.productoVendible.create({
      data: {
        codigo,
        nombre,
        descripcion,
        categoria,
        subcategoria,
        especie: especie || null,
        tipoVenta: tipoVenta || 'POR_KG',
        unidadMedida: unidadMedida || 'KG',
        precioBase: precioBase || null,
        moneda: moneda || 'ARS',
        alicuotaIva: alicuotaIva || 21,
        requiereTrazabilidad: requiereTrazabilidad || false
      }
    })

    // Si hay precio base, crear registro en historico
    if (precioBase && precioBase > 0) {
      await db.historicoPrecioProducto.create({
        data: {
          productoVendibleId: producto.id,
          precioNuevo: precioBase,
          moneda: moneda || 'ARS',
          motivo: 'Precio inicial'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: producto,
      message: `Producto ${nombre} creado exitosamente`
    })
  } catch (error) {
    console.error('Error creating producto vendible:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear producto vendible' },
      { status: 500 }
    )
  }
}
