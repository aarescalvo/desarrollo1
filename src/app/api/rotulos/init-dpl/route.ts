import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST - Crear rótulos DPL por defecto para Datamax Mark II
 * Formato: 6cm alto x 9cm ancho
 */
export async function POST(request: NextRequest) {
  try {
    const rotulosCreados = []

    // ========================================
    // RÓTULO PESAJE INDIVIDUAL - Formato probado del sistema anterior
    // ========================================
    const rotuloPesajeIndividual = `n
M1084
O0220
SO
d
L
D11
PO
pG
SO
A2
1e8406900410065C{CODIGO_BARRAS}
ySE1
1911A1200220110{CODIGO_BARRAS}
1911A1201950010Año: 
1911A1401940058{ANIO}
1911A1201960215Tropa:
1911A1401940270{TROPA}
1911A1201660081N° de Animal:
1911A1401650200{NUMERO}
1911A1402320006{ESTABFAENADOR}
1911A1201330010Tipificación:
1911A2401260117{LETRA}
1911A1201360215Peso:
1911A1801330270{PESO} kg
Q0001
E
`.trim()

    // Verificar si ya existe
    const existentePesaje = await db.rotulo.findFirst({
      where: { 
        codigo: 'PESAJE_INDIVIDUAL_DPL_V2',
        tipoImpresora: 'DATAMAX'
      }
    })

    if (!existentePesaje) {
      // Desmarcar otros como default
      await db.rotulo.updateMany({
        where: { 
          tipo: 'PESAJE_INDIVIDUAL',
          tipoImpresora: 'DATAMAX',
          esDefault: true 
        },
        data: { esDefault: false }
      })

      const nuevoRotulo = await db.rotulo.create({
        data: {
          nombre: 'Pesaje Individual 9x6cm - Datamax (Formato Original)',
          codigo: 'PESAJE_INDIVIDUAL_DPL_V2',
          tipo: 'PESAJE_INDIVIDUAL',
          tipoImpresora: 'DATAMAX',
          modeloImpresora: 'MARK_II',
          contenido: rotuloPesajeIndividual,
          ancho: 90,  // 9cm
          alto: 60,   // 6cm
          dpi: 203,
          activo: true,
          esDefault: true,
          descripcion: 'Rótulo 9x6cm para pesaje individual - Formato probado del sistema anterior. Código de barras, año, tropa, N° animal, tipificación y peso.',
          variables: JSON.stringify([
            { variable: 'CODIGO_BARRAS', campo: 'codigo_barras', descripcion: 'Código para barras (Tropa+Numero)' },
            { variable: 'ANIO', campo: 'anio', descripcion: 'Año de faena' },
            { variable: 'TROPA', campo: 'tropa', descripcion: 'Número de tropa' },
            { variable: 'NUMERO', campo: 'numero', descripcion: 'Número de animal' },
            { variable: 'ESTABFAENADOR', campo: 'estabfaenador', descripcion: 'Establecimiento faenador' },
            { variable: 'LETRA', campo: 'letra', descripcion: 'Letra de tipificación' },
            { variable: 'PESO', campo: 'peso', descripcion: 'Peso en kg' }
          ])
        }
      })
      rotulosCreados.push(nuevoRotulo)
    }

    // ========================================
    // RÓTULO PESAJE INDIVIDUAL - VERSIÓN COMPACTA (sin código barras)
    // ========================================
    const rotuloCompacto = `
<STX>L
D11
H14
PG
C0002

; Número animal MUY GRANDE - CENTRADO
1K0200
1V0040
2f550
3c0000
e{NUMERO}

; Tropa y Peso
1K0150
1V0200
2f280
3c0000
eTropa: {TROPA}

1K0150
1V0280
2f350
3c0000
e{PESO} kg

E
`.trim()

    const existenteCompacto = await db.rotulo.findFirst({
      where: { 
        codigo: 'PESAJE_INDIVIDUAL_COMPACTO_DPL',
        tipoImpresora: 'DATAMAX'
      }
    })

    if (!existenteCompacto) {
      const nuevoRotulo = await db.rotulo.create({
        data: {
          nombre: 'Pesaje Individual Compacto 9x6cm - Datamax',
          codigo: 'PESAJE_INDIVIDUAL_COMPACTO_DPL',
          tipo: 'PESAJE_INDIVIDUAL',
          tipoImpresora: 'DATAMAX',
          modeloImpresora: 'MARK_II',
          contenido: rotuloCompacto,
          ancho: 90,
          alto: 60,
          dpi: 203,
          activo: true,
          esDefault: false,
          descripcion: 'Rótulo compacto 9x6cm - Número grande centrado, tropa y peso.',
          variables: JSON.stringify([
            { variable: 'NUMERO', campo: 'numero', descripcion: 'Número de animal' },
            { variable: 'TROPA', campo: 'tropa', descripcion: 'Código de tropa' },
            { variable: 'PESO', campo: 'peso', descripcion: 'Peso en kg' }
          ])
        }
      })
      rotulosCreados.push(nuevoRotulo)
    }

    // ========================================
    // RÓTULO MEDIA RES - Para faena (8x12cm)
    // ========================================
    const rotuloMediaRes = `
<STX>L
D11
H14
PG
C0010

; Header empresa
1K0250
1V0010
2f200
3c0000
eSOLEMAR ALIMENTARIA

; Número Garrón GRANDE
1K0300
1V0060
2f350
3c0000
e#{GARRON}

; Tropa
1K0300
1V0140
2f220
3c0000
eTropa: {TROPA}

; Peso
1K0300
1V0200
2f280
3c0000
ePeso: {PESO} kg

; Lado
1K0550
1V0140
2f220
3c0000
eLado: {LADO}

; Fecha
1K0300
1V0280
2f160
3c0000
e{FECHA}

; Código de barras
1K0100
1V0350
2B4201
3c0000
e{CODIGO_BARRAS}

E
`.trim()

    const existenteMediaRes = await db.rotulo.findFirst({
      where: { 
        codigo: 'MEDIA_RES_DPL_V2',
        tipoImpresora: 'DATAMAX'
      }
    })

    if (!existenteMediaRes) {
      // Desmarcar otros media res como default
      await db.rotulo.updateMany({
        where: { 
          tipo: 'MEDIA_RES',
          tipoImpresora: 'DATAMAX',
          esDefault: true 
        },
        data: { esDefault: false }
      })

      const nuevoRotulo = await db.rotulo.create({
        data: {
          nombre: 'Media Res 8x12cm + Cód.Barras - Datamax',
          codigo: 'MEDIA_RES_DPL_V2',
          tipo: 'MEDIA_RES',
          tipoImpresora: 'DATAMAX',
          modeloImpresora: 'MARK_II',
          contenido: rotuloMediaRes,
          ancho: 80,
          alto: 120,
          dpi: 203,
          activo: true,
          esDefault: true,
          diasConsumo: 30,
          descripcion: 'Rótulo para medias reses con garrón, tropa, peso, lado y código de barras.',
          variables: JSON.stringify([
            { variable: 'GARRON', campo: 'garron', descripcion: 'Número de garrón' },
            { variable: 'TROPA', campo: 'tropa', descripcion: 'Código de tropa' },
            { variable: 'PESO', campo: 'peso', descripcion: 'Peso en kg' },
            { variable: 'LADO', campo: 'lado', descripcion: 'Lado (D/I)' },
            { variable: 'FECHA', campo: 'fecha', descripcion: 'Fecha' },
            { variable: 'CODIGO_BARRAS', campo: 'codigo_barras', descripcion: 'Código para barras' }
          ])
        }
      })
      rotulosCreados.push(nuevoRotulo)
    }

    return NextResponse.json({
      success: true,
      message: `${rotulosCreados.length} rótulos DPL creados para Datamax Mark II`,
      rotulos: rotulosCreados.map(r => ({
        id: r.id,
        nombre: r.nombre,
        codigo: r.codigo,
        tipo: r.tipo,
        tipoImpresora: r.tipoImpresora,
        esDefault: r.esDefault
      }))
    })

  } catch (error) {
    console.error('Error al crear rótulos DPL:', error)
    return NextResponse.json(
      { error: 'Error al crear rótulos DPL', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar rótulos DPL disponibles
 */
export async function GET() {
  try {
    const rotulos = await db.rotulo.findMany({
      where: {
        tipoImpresora: 'DATAMAX',
        activo: true
      },
      orderBy: [
        { tipo: 'asc' },
        { esDefault: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      count: rotulos.length,
      data: rotulos.map(r => ({
        id: r.id,
        nombre: r.nombre,
        codigo: r.codigo,
        tipo: r.tipo,
        modeloImpresora: r.modeloImpresora,
        ancho: r.ancho,
        alto: r.alto,
        esDefault: r.esDefault
      }))
    })
  } catch (error) {
    console.error('Error al listar rótulos DPL:', error)
    return NextResponse.json(
      { error: 'Error al listar rótulos DPL' },
      { status: 500 }
    )
  }
}
