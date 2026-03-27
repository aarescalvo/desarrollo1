import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener un producto vendible por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const producto = await db.productoVendible.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            preciosCliente: true,
            preciosHistorico: true
          }
        }
      }
    })

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Obtener último precio
    const ultimoPrecio = await db.historicoPrecioProducto.findFirst({
      where: { productoVendibleId: id },
      orderBy: { fechaVigencia: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...producto,
        precioActual: ultimoPrecio?.precioNuevo || producto.precioBase || 0
      }
    })
  } catch (error) {
    console.error('Error obteniendo producto vendible:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto vendible
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      requiereTrazabilidad,
      activo
    } = body

    // Verificar que el producto existe
    const existente = await db.productoVendible.findUnique({
      where: { id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Si se cambia el código, verificar que no exista otro con ese código
    if (codigo && codigo !== existente.codigo) {
      const conEseCodigo = await db.productoVendible.findUnique({
        where: { codigo }
      })
      if (conEseCodigo) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un producto con ese código' },
          { status: 400 }
        )
      }
    }

    const producto = await db.productoVendible.update({
      where: { id },
      data: {
        codigo: codigo || existente.codigo,
        nombre: nombre || existente.nombre,
        descripcion: descripcion !== undefined ? descripcion : existente.descripcion,
        categoria: categoria || existente.categoria,
        subcategoria: subcategoria !== undefined ? subcategoria : existente.subcategoria,
        especie: especie !== undefined ? especie : existente.especie,
        tipoVenta: tipoVenta || existente.tipoVenta,
        unidadMedida: unidadMedida || existente.unidadMedida,
        precioBase: precioBase !== undefined ? precioBase : existente.precioBase,
        moneda: moneda || existente.moneda,
        alicuotaIva: alicuotaIva !== undefined ? alicuotaIva : existente.alicuotaIva,
        requiereTrazabilidad: requiereTrazabilidad !== undefined ? requiereTrazabilidad : existente.requiereTrazabilidad,
        activo: activo !== undefined ? activo : existente.activo
      }
    })

    return NextResponse.json({
      success: true,
      data: producto,
      message: `Producto ${producto.nombre} actualizado`
    })
  } catch (error) {
    console.error('Error actualizando producto vendible:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE - Desactivar producto vendible
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar que el producto existe
    const existente = await db.productoVendible.findUnique({
      where: { id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // En lugar de eliminar, desactivamos
    await db.productoVendible.update({
      where: { id },
      data: { activo: false }
    })

    return NextResponse.json({
      success: true,
      message: `Producto ${existente.nombre} desactivado`
    })
  } catch (error) {
    console.error('Error desactivando producto vendible:', error)
    return NextResponse.json(
      { success: false, error: 'Error al desactivar producto' },
      { status: 500 }
    )
  }
}
