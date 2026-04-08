/**
 * Seed para crear el rótulo de MEDIA RES para Zebra ZT230
 * TrazaSole v3.7.24
 *
 * Formato: ZPL II (Zebra Programming Language)
 * Tamaño: 100mm ancho × 150mm alto (10cm × 15cm)
 * DPI: 203
 */

import { db } from '../src/lib/db'

async function main() {
  console.log('🔄 Creando rótulo MEDIA RES para Zebra ZT230...')

  // Verificar si ya existe
  const existente = await db.rotulo.findFirst({
    where: { tipo: 'MEDIA_RES' }
  })

  // ZPL Template - se procesarán las variables {VAR}
  const templateZPL = crearTemplateZPL()

  // Variables disponibles en el template
  const variables = JSON.stringify([
    { nombre: 'LOGO_SOLEMAR', descripcion: 'Logo de Solemar en formato GRF' },
    { nombre: 'LOGO_SENASA', descripcion: 'Logo de SENASA en formato GRF' },
    { nombre: 'NOMBRE_CLIENTE', descripcion: 'Nombre del titular de faena' },
    { nombre: 'CUIT_CLIENTE', descripcion: 'CUIT del cliente' },
    { nombre: 'MATRICULA_CLIENTE', descripcion: 'Matrícula del cliente' },
    { nombre: 'FECHA_FAENA', descripcion: 'Fecha de faena (DD/MM/YYYY)' },
    { nombre: 'TROPA', descripcion: 'Número de tropa' },
    { nombre: 'GARRON', descripcion: 'Número de garrón' },
    { nombre: 'LADO', descripcion: 'Lado de la media (DER/IZQ)' },
    { nombre: 'CLASIFICACION', descripcion: 'Clasificación del cuarto (A/T/D)' },
    { nombre: 'KG', descripcion: 'Peso en kilogramos' },
    { nombre: 'VENCIMIENTO', descripcion: 'Fecha de vencimiento (fecha faena + 13 días)' },
    { nombre: 'CODIGO_BARRAS', descripcion: 'Código de barras: TROPA-GARRON-LADO-CLASIF' }
  ])

  if (existente) {
    console.log('⚠️  Ya existe un rótulo MEDIA_RES, actualizando...')
    await db.rotulo.update({
      where: { id: existente.id },
      data: {
        nombre: 'Rótulo Media Res - Zebra ZT230',
        codigo: 'MEDIA_RES_ZT230',
        tipo: 'MEDIA_RES',
        tipoImpresora: 'ZEBRA',
        modeloImpresora: 'ZT230',
        ancho: 100,  // mm
        alto: 150,   // mm
        dpi: 203,
        contenido: templateZPL,
        variables: variables,
        diasConsumo: 13,
        temperaturaMax: 5.0,
        esDefault: true,
        activo: true
      }
    })
    console.log('✅ Rótulo actualizado')
  } else {
    await db.rotulo.create({
      data: {
        nombre: 'Rótulo Media Res - Zebra ZT230',
        codigo: 'MEDIA_RES_ZT230',
        tipo: 'MEDIA_RES',
        tipoImpresora: 'ZEBRA',
        modeloImpresora: 'ZT230',
        ancho: 100,  // mm
        alto: 150,   // mm
        dpi: 203,
        contenido: templateZPL,
        variables: variables,
        diasConsumo: 13,
        temperaturaMax: 5.0,
        esDefault: true,
        activo: true
      }
    })
    console.log('✅ Rótulo creado')
  }
}

function crearTemplateZPL(): string {
  // ZPL para Zebra ZT230 - 203 DPI
  // Tamaño: 100mm (4 pulgadas) ancho, alto variable
  // Los logos se cargarán dinámicamente desde public/logos/

  return `^XA
^FX Configuracion de etiqueta - TrazaSole v3.7.24
^CI28
^PW800
^LL1200
^FO0,20

^FX ============ ENCABEZADO - LOGO SOLEMAR ============
^FO280,30^GFA,200,200,10,{LOGO_SOLEMAR}
^FO100,90^A0N,28,28^FDESTABLECIMIENTO FAENADOR SOLEMAR ALIMENTARIA S.A^FS
^FO240,125^A0N,26,26^FDEST. OFICIAL N 3986^FS
^FO260,160^A0N,24,24^FDCUIT: 30-70919450-6^FS
^FO245,195^A0N,24,24^FDMATRICULA N: 300^FS
^FO95,230^A0N,22,22^FDRUTA NAC. N 22, KM 1043 - CHIMPAY - RIO NEGRO^FS

^FX ============ LINEA SEPARADORA ============
^FO50,270^GB700,3,3^FS

^FX ============ DATOS DEL CLIENTE ============
^FO80,290^A0N,24,24^FDTITULAR DE FAENA: {NOMBRE_CLIENTE}^FS
^FO80,320^A0N,24,24^FDCUIT N: {CUIT_CLIENTE}^FS
^FO80,350^A0N,24,24^FDMATRICULA N: {MATRICULA_CLIENTE}^FS

^FX ============ LINEA SEPARADORA ============
^FO50,385^GB700,3,3^FS

^FX ============ TIPO DE PRODUCTO ============
^FO180,410^A0N,28,28^FDCARNE VACUNA CON HUESO ENFRIADA^FS

^FX ============ LOGO SENASA CON LEYENDA ============
^FO80,460^GFA,150,150,10,{LOGO_SENASA}
^FO220,480^A0N,22,22^FDSENASA N 3986/141334/1^FS
^FO220,510^A0N,22,22^FDINDUSTRIA ARGENTINA^FS

^FX ============ MEDIA RES DESTACADO ============
^FO200,560^GB400,60,40^FS
^FO240,575^A0N,45,45^FDMEDIA RES^FS

^FX ============ LINEA SEPARADORA ============
^FO50,650^GB700,3,3^FS

^FX ============ DATOS VARIABLES ============
^FO80,680^A0N,26,26^FDFECHA FAENA: {FECHA_FAENA}^FS
^FO450,680^A0N,26,26^FDTROPA N: {TROPA}^FS
^FO80,720^A0N,26,26^FDGARRON N: {GARRON} {LADO}^FS
^FO450,720^A0N,26,26^FDCLASIF: {CLASIFICACION}^FS
^FO80,760^A0N,28,28^FDVENTA AL PESO: {KG} KG^FS

^FX ============ MENSAJES INFORMATIVOS ============
^FO150,820^A0N,24,24^FDMANTENER REFRIGERADO A MENOS DE 5C^FS
^FO100,860^A0N,24,24^FDCONSUMIR PREFERENTEMENTE ANTES DEL DIA: {VENCIMIENTO}^FS

^FX ============ LINEA SEPARADORA ============
^FO50,900^GB700,3,3^FS

^FX ============ CODIGO DE BARRAS ============
^FO180,930^BY3,3,80^BCN,80,N,N,N^FD{CODIGO_BARRAS}^FS
^FO200,1020^A0N,24,24^FD{CODIGO_BARRAS}^FS

^FX Fin de etiqueta
^XZ`
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
