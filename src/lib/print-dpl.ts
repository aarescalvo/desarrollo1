/**
 * Utilidad de impresión DPL para impresoras Datamax Mark II
 * Formato de rótulo: 5cm alto x 10cm ancho (203 DPI)
 * 
 * DPL (Datamax Programming Language) - Comandos básicos:
 * <STX>L = Inicio de formato de etiqueta (STX = ASCII 2)
 * D11 = Configuración de dimensiones
 * H14 = Velocidad de impresión
 * PG = Print mode: gap
 * E = Fin de formato y impresión
 * 
 * Comandos de texto:
 * 1K = Posición horizontal (dots)
 * 1V = Posición vertical (dots)
 * 2f = Tamaño de fuente
 * 3c = Color (0000 = negro)
 * e = Texto a imprimir
 * 
 * Código de barras:
 * 2B5201 = Code 128, altura 52 dots
 */

// Dimensiones del rótulo 5x10cm a 203 DPI
const LABEL_WIDTH_MM = 100 // 10 cm = 100mm
const LABEL_HEIGHT_MM = 50  // 5 cm = 50mm
const DPI = 203

// Conversión mm a dots (203 DPI)
const mmToDots = (mm: number) => Math.round(mm * DPI / 25.4)

interface DatosRotuloPesaje {
  tropa: string
  numeroAnimal: number | string
  peso: number | string
  codigo?: string
  fecha?: string
}

/**
 * Genera código DPL para imprimir rótulo de pesaje individual
 * Formato: 5cm alto x 10cm ancho (etiqueta horizontal)
 * 
 * Contenido:
 *   - Número de animal (RESALTADO - tamaño muy grande)
 *   - Número de tropa
 *   - Peso en kg
 *   - Código de barras Code 128
 */
export function generarRotuloDPL(datos: DatosRotuloPesaje): string {
  const tropa = datos.tropa || ''
  const numero = String(datos.numeroAnimal || '0')
  const peso = String(datos.peso || '0')
  const fecha = datos.fecha || new Date().toLocaleDateString('es-AR')
  
  // Generar código de barras: Tropa + Número (ej: B20260123-001)
  const codigoBarras = datos.codigo || `${tropa.replace(/\s/g, '')}-${numero.padStart(3, '0')}`

  // DPL para Datamax Mark II - 5x10cm
  let dpl = ''
  
  // <STX>L = Start label format
  dpl += String.fromCharCode(2) + 'L\n'
  dpl += 'D11\n'              // Set label dimensions
  dpl += 'H14\n'              // Print speed 4 ips
  dpl += 'PG\n'               // Print mode: gap
  dpl += 'C0010\n'            // Copies

  // ===== NÚMERO DE ANIMAL - MUY GRANDE Y RESALTADO =====
  // Posición: centrado arriba
  dpl += '1K0150\n'           // X position
  dpl += '1V0020\n'           // Y position
  dpl += '2f440\n'            // Font size muy grande
  dpl += '3c0000\n'           // Color negro
  dpl += `eANIMAL #${numero}\n`

  // ===== TROPA =====
  dpl += '1K0150\n'
  dpl += '1V0120\n'
  dpl += '2f220\n'            // Font size mediano
  dpl += '3c0000\n'
  dpl += `eTROPA: ${tropa}\n`

  // ===== PESO EN kg - DESTACADO =====
  dpl += '1K0150\n'
  dpl += '1V0180\n'
  dpl += '2f330\n'            // Font size grande
  dpl += '3c0000\n'
  dpl += `ePESO: ${peso} kg\n`

  // ===== CÓDIGO DE BARRAS CODE 128 =====
  // Posición: abajo, centrado
  dpl += '1K0080\n'           // X position
  dpl += '1V0260\n'           // Y position
  dpl += '2B5201\n'           // Code 128, altura 52 dots
  dpl += '3c0000\n'           // Color negro
  dpl += `e${codigoBarras}\n`

  // Finalizar y imprimir
  dpl += 'E\n'

  return dpl
}

/**
 * Versión alternativa más simple usando comandos DPL básicos
 * Sin código de barras - solo texto
 */
export function generarRotuloDPLSimple(datos: DatosRotuloPesaje): string {
  const tropa = datos.tropa || 'N/A'
  const numero = String(datos.numeroAnimal || '0')
  const peso = String(datos.peso || '0')

  let dpl = ''
  
  // <STX>L = Start label format
  dpl += String.fromCharCode(2) + 'L\n'
  dpl += 'D11\n'
  dpl += 'H14\n'
  dpl += 'PG\n'
  dpl += 'C0002\n'            // 2 copias
  
  // Número de animal - MUY GRANDE centrado
  dpl += '1K0200\n'
  dpl += '1V0040\n'
  dpl += '2f550\n'            // Font muy grande
  dpl += '3c0000\n'
  dpl += `e${numero}\n`
  
  // Tropa
  dpl += '1K0150\n'
  dpl += '1V0200\n'
  dpl += '2f280\n'
  dpl += '3c0000\n'
  dpl += `eTropa: ${tropa}\n`
  
  // Peso
  dpl += '1K0150\n'
  dpl += '1V0280\n'
  dpl += '2f350\n'
  dpl += '3c0000\n'
  dpl += `e${peso} kg\n`
  
  dpl += 'E\n'
  
  return dpl
}

/**
 * Formato ZPL para Zebra ZT410/ZT230
 * Compatible si la Datamax tiene emulación ZPL
 */
export function generarRotuloZPL(datos: DatosRotuloPesaje): string {
  const tropa = datos.tropa || 'N/A'
  const numero = String(datos.numeroAnimal || '0')
  const peso = String(datos.peso || '0')
  const codigoBarras = datos.codigo || `${tropa.replace(/\s/g, '')}-${numero.padStart(3, '0')}`

  // ZPL para etiqueta 5x10cm (394 x 787 dots a 203 DPI)
  let zpl = '^XA\n'
  
  // Configurar tamaño
  zpl += '^PW787\n'          // Print width: 10cm
  zpl += '^LL394\n'          // Label length: 5cm
  zpl += '^LH20,20\n'        // Label home

  // NÚMERO DE ANIMAL - MUY GRANDE Y RESALTADO
  zpl += '^FO30,20\n'
  zpl += '^A0N,70,70\n'      // Font muy grande
  zpl += `^FDANIMAL #${numero}^FS\n`

  // TROPA
  zpl += '^FO30,110\n'
  zpl += '^A0N,35,35\n'
  zpl += `^FDTROPA: ${tropa}^FS\n`

  // PESO
  zpl += '^FO30,160\n'
  zpl += '^A0N,45,45\n'
  zpl += `^FDPESO: ${peso} kg^FS\n`

  // CÓDIGO DE BARRAS Code 128
  zpl += '^FO50,230\n'
  zpl += '^BY2,3,50\n'       // Module width, ratio, height
  zpl += '^BCN,50,Y,N,N\n'   // Code 128, normal orientation
  zpl += `^FD${codigoBarras}^FS\n`

  // Fin
  zpl += '^XZ\n'

  return zpl
}

/**
 * Enviar código de impresión a la impresora via TCP/IP
 * Puerto estándar: 9100
 */
export async function enviarAImpresora(
  ip: string, 
  puerto: number, 
  codigo: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/imprimir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip,
        puerto,
        codigo
      })
    })

    const data = await response.json()
    
    if (data.success) {
      return { success: true }
    } else {
      return { success: false, error: data.error || 'Error de impresión' }
    }
  } catch (error) {
    console.error('Error al enviar a impresora:', error)
    return { success: false, error: 'Error de conexión con la impresora' }
  }
}

/**
 * Imprimir rótulo de pesaje individual (2 copias por defecto)
 */
export async function imprimirRotuloPesaje(
  datos: DatosRotuloPesaje,
  impresoraIp: string = '192.168.1.100',
  impresoraPuerto: number = 9100,
  cantidadCopias: number = 2
): Promise<{ success: boolean; error?: string }> {
  // Generar código DPL con código de barras
  const codigoDPL = generarRotuloDPL(datos)
  
  // Enviar cantidad de copias
  const codigoMultiplicado = Array(cantidadCopias).fill(codigoDPL).join('\n')
  
  return await enviarAImpresora(impresoraIp, impresoraPuerto, codigoMultiplicado)
}

/**
 * Imprimir usando el sistema de rótulos configurado en la base de datos
 * Busca el rótulo default para PESAJE_INDIVIDUAL y lo usa
 */
export async function imprimirRotuloDesdeConfig(
  datos: DatosRotuloPesaje,
  cantidadCopias: number = 2
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar rótulo configurado
    const rotuloRes = await fetch('/api/rotulos?tipo=PESAJE_INDIVIDUAL&esDefault=true')
    const rotuloResponse = await rotuloRes.json()
    const rotulosData = rotuloResponse.data || []
    
    if (rotulosData.length === 0) {
      // No hay rótulo configurado, usar DPL por defecto
      const codigoDPL = generarRotuloDPL(datos)
      const codigoMultiplicado = Array(cantidadCopias).fill(codigoDPL).join('\n')
      
      return await enviarAImpresora('192.168.1.100', 9100, codigoMultiplicado)
    }

    const rotulo = rotulosData[0]

    // Generar código de barras
    const codigoBarras = datos.codigo || `${datos.tropa.replace(/\s/g, '')}-${String(datos.numeroAnimal).padStart(3, '0')}`

    // Enviar a imprimir usando la API de rótulos
    const printRes = await fetch('/api/rotulos/imprimir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rotuloId: rotulo.id,
        datos: {
          NUMERO: datos.numeroAnimal,
          TROPA: datos.tropa,
          PESO: datos.peso,
          CODIGO_BARRAS: codigoBarras,
          FECHA: datos.fecha || new Date().toLocaleDateString('es-AR')
        },
        cantidad: cantidadCopias
      })
    })

    const printData = await printRes.json()
    
    return { 
      success: printData.success, 
      error: printData.error 
    }
  } catch (error) {
    console.error('Error al imprimir:', error)
    return { success: false, error: 'Error al imprimir rótulo' }
  }
}

const printDplService = {
  generarRotuloDPL,
  generarRotuloDPLSimple,
  generarRotuloZPL,
  enviarAImpresora,
  imprimirRotuloPesaje,
  imprimirRotuloDesdeConfig
}

export default printDplService
