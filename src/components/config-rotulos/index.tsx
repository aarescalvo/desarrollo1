'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Tag, Loader2, Power, Trash2, Upload, Eye, FileText, Printer, 
  Download, Copy, Info, Variable, FileCode, Check, ChevronDown, ChevronRight,
  Settings, Star, Play, X, Edit, Palette, Layout, Type, Square, 
  QrCode, Save, RotateCcw, Plus, Move, Barcode as BarcodeIcon
} from 'lucide-react'
import { TipoRotulo } from '@prisma/client'
import { Textarea } from '@/components/ui/textarea'
import { VisualEditor, RotuloElement } from './VisualEditor'

interface Operador { id: string; nombre: string; rol: string }
interface Props { operador: Operador }

// Categorías de uso para asignar rótulos
const CATEGORIAS_USO = [
  { value: 'MEDIA_RES', label: 'Media Res', descripcion: 'Rótulo para medias res en romaneo' },
  { value: 'PESAJE_INDIVIDUAL', label: 'Pesaje Individual', descripcion: 'Rótulo para pesaje de animales vivos' },
  { value: 'CUARTO', label: 'Cuarto', descripcion: 'Rótulo para cuartos' },
  { value: 'MENUDENCIA', label: 'Menudencia', descripcion: 'Rótulo para menudencias' },
  { value: 'PRODUCTO_GENERAL', label: 'Producto General', descripcion: 'Rótulo genérico para productos' },
  { value: 'PRODUCTO_ESPECIFICO', label: 'Producto Específico', descripcion: 'Rótulo para un producto en particular' },
]

const TIPOS_IMPRESORA = [
  { value: 'ZEBRA', label: 'Zebra (ZPL)', extensiones: ['.zpl', '.prn', '.nlbl'] },
  { value: 'DATAMAX', label: 'Datamax (DPL)', extensiones: ['.dpl'] },
]

const MODELOS_IMPRESORA = {
  ZEBRA: [
    { value: 'ZT410', label: 'Zebra ZT410 (300 DPI)', dpi: 300, descripcion: 'Industrial, alta resolución' },
    { value: 'ZT230', label: 'Zebra ZT230 (203 DPI)', dpi: 203, descripcion: 'Industrial, estándar' },
    { value: 'ZT411', label: 'Zebra ZT411 (300 DPI)', dpi: 300, descripcion: 'Industrial, conectividad avanzada' },
    { value: 'ZD420', label: 'Zebra ZD420 (203 DPI)', dpi: 203, descripcion: 'Desktop' },
    { value: 'OTRO_ZEBRA', label: 'Otra Zebra', dpi: 203, descripcion: 'Otro modelo Zebra' },
  ],
  DATAMAX: [
    { value: 'MARK_II', label: 'Datamax Mark II (203 DPI)', dpi: 203, descripcion: 'Industrial, robusta' },
    { value: 'I-4208', label: 'Datamax I-4208 (203 DPI)', dpi: 203, descripcion: 'Industrial' },
    { value: 'I-4210', label: 'Datamax I-4210 (203 DPI)', dpi: 203, descripcion: 'Industrial, alta velocidad' },
    { value: 'OTRO_DATAMAX', label: 'Otra Datamax', dpi: 203, descripcion: 'Otro modelo Datamax' },
  ]
}

// Variables disponibles para editor visual
const VARIABLES_DISPONIBLES = [
  { id: 'NUMERO', nombre: 'Número de Animal', ejemplo: '15' },
  { id: 'TROPA', nombre: 'Código de Tropa', ejemplo: 'B 2026 0012' },
  { id: 'TIPO', nombre: 'Tipo de Animal', ejemplo: 'VA' },
  { id: 'PESO', nombre: 'Peso', ejemplo: '452' },
  { id: 'CODIGO', nombre: 'Código Completo', ejemplo: 'B20260012-015' },
  { id: 'RAZA', nombre: 'Raza', ejemplo: 'Angus' },
  { id: 'FECHA', nombre: 'Fecha', ejemplo: '20/03/2026' },
  { id: 'FECHA_VENC', nombre: 'Fecha Vencimiento', ejemplo: '19/04/2026' },
  { id: 'PRODUCTO', nombre: 'Producto', ejemplo: 'MEDIA RES' },
  { id: 'GARRON', nombre: 'Garrón', ejemplo: '42' },
  { id: 'LADO', nombre: 'Lado', ejemplo: 'I' },
  { id: 'SIGLA', nombre: 'Sigla', ejemplo: 'A' },
  { id: 'PESO_NETO', nombre: 'Peso Neto', ejemplo: '118.5' },
  { id: 'USUARIO_FAENA', nombre: 'Usuario Faena', ejemplo: 'Juan Pérez' },
  { id: 'MATRICULA', nombre: 'Matrícula', ejemplo: '12345' },
  { id: 'CODIGO_BARRAS', nombre: 'Código de Barras', ejemplo: 'B202600120151' },
  { id: 'CUIT', nombre: 'CUIT', ejemplo: '20-12345678-9' },
  { id: 'ESTABLECIMIENTO', nombre: 'Establecimiento', ejemplo: 'FRIGORIFICO EJEMPLO' },
  { id: 'DIAS_CONSUMO', nombre: 'Días de Consumo', ejemplo: '30' },
]

interface VariableDetectada {
  variable: string
  campo: string
  descripcion: string
}

// El tipo RotuloElement viene de VisualEditor.tsx e incluye IMAGEN

interface Rotulo {
  id: string
  nombre: string
  codigo: string
  tipo: TipoRotulo
  categoria?: string | null
  tipoImpresora: string
  modeloImpresora?: string | null
  ancho: number
  alto: number
  dpi: number
  contenido: string
  variables?: string | null
  nombreArchivo?: string | null
  diasConsumo?: number | null
  temperaturaMax?: number | null
  activo: boolean
  esDefault: boolean
  esBinario?: boolean
  elementos?: RotuloElement[]
}

export function ConfigRotulosModule({ operador }: Props) {
  const [rotulos, setRotulos] = useState<Rotulo[]>([])
  const [loading, setLoading] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [modalImportar, setModalImportar] = useState(false)
  const [modalPreview, setModalPreview] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalEditor, setModalEditor] = useState(false)
  const [rotuloSeleccionado, setRotuloSeleccionado] = useState<Rotulo | null>(null)
  const [previewProcesado, setPreviewProcesado] = useState('')
  const [imprimiendo, setImprimiendo] = useState(false)
  
  // Configuración de impresora para prueba
  const [impresoraIp, setImpresoraIp] = useState('')
  const [impresoraPuerto, setImpresoraPuerto] = useState('9100')
  
  // Formulario de edición
  const [editandoContenido, setEditandoContenido] = useState('')
  const [editandoNombre, setEditandoNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  
  // Editor visual
  const [editandoRotuloVisual, setEditandoRotuloVisual] = useState<Rotulo | null>(null)
  const [elementosVisuales, setElementosVisuales] = useState<RotuloElement[]>([])
  
  // Formulario de importación
  const [archivo, setArchivo] = useState<File | null>(null)
  const [contenidoArchivo, setContenidoArchivo] = useState('')
  const [archivoBinario, setArchivoBinario] = useState<ArrayBuffer | null>(null)
  const [esBinario, setEsBinario] = useState(false)
  const [variablesDetectadas, setVariablesDetectadas] = useState<VariableDetectada[]>([])
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [categoriaUso, setCategoriaUso] = useState('MEDIA_RES')
  const [tipoImpresora, setTipoImpresora] = useState('ZEBRA')
  const [modeloImpresora, setModeloImpresora] = useState('ZT410')
  const [ancho, setAncho] = useState(80)
  const [alto, setAlto] = useState(50)
  const [dpi, setDpi] = useState(203)
  const [verContenido, setVerContenido] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Datos de prueba para previsualización
  const datosPrueba: Record<string, string> = {
    'FECHA': '17/03/2026',
    'FECHA_FAENA': '17/03/2026',
    'FECHA_VENC': '16/04/2026',
    'TROPA': 'B 2026 0001',
    'GARRON': '0001',
    'PESO': '125.50',
    'PRODUCTO': 'MEDIA RES',
    'ESTABLECIMIENTO': 'FRIGORIFICO EJEMPLO',
    'NRO_ESTABLECIMIENTO': '3986',
    'USUARIO_FAENA': 'JUAN PEREZ',
    'CUIT': '20-12345678-9',
    'MATRICULA': 'MAT-001234',
    'CODIGO_BARRAS': '1234567890123',
    'LOTE': 'L2026001',
    'LADO': 'I',
    'SIGLA': 'A',
    'DIAS_CONSUMO': '30',
    'TEMP_MAX': '5°C',
    'NUMERO': '15',
    'TIPO': 'VA',
    'RAZA': 'Angus',
    'PESO_NETO': '118.5',
  }

  // Cargar rótulos
  const cargarRotulos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rotulos')
      if (response.ok) {
        const data = await response.json()
        setRotulos(Array.isArray(data) ? data : (data.data || []))
      }
    } catch (error) {
      console.error('Error al cargar rótulos:', error)
      toast.error('Error al cargar rótulos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRotulos()
  }, [])

  // Procesar ZPL con datos de prueba
  const procesarZplConDatos = (contenido: string, datos: Record<string, string>): string => {
    let resultado = contenido
    Object.entries(datos).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi')
      resultado = resultado.replace(regex, value)
    })
    resultado = resultado.replace(/\{\{[A-Z_0-9]+\}\}/g, '---')
    return resultado
  }

  // Ver preview del rótulo
  const handlePreview = (rotulo: Rotulo) => {
    setRotuloSeleccionado(rotulo)
    
    if (rotulo.esBinario) {
      setPreviewProcesado(`[ARCHIVO BINARIO - ZEBRA DESIGNER]
      
Archivo: ${rotulo.nombreArchivo || 'N/A'}
Tamaño: ${rotulo.ancho}x${rotulo.alto}mm
DPI: ${rotulo.dpi}
Tipo: ${rotulo.tipoImpresora}

Este archivo se enviará DIRECTAMENTE a la impresora.
Configure la IP y use "Imprimir Prueba".`)
    } else {
      const procesado = procesarZplConDatos(rotulo.contenido, datosPrueba)
      setPreviewProcesado(procesado)
    }
    
    setModalPreview(true)
  }

  // Imprimir prueba
  const handleImprimirPrueba = async () => {
    if (!rotuloSeleccionado) return
    if (!impresoraIp) {
      toast.error('Ingrese la IP de la impresora para imprimir')
      return
    }
    
    setImprimiendo(true)
    try {
      const response = await fetch('/api/rotulos/imprimir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rotuloId: rotuloSeleccionado.id,
          datos: datosPrueba,
          cantidad: 1,
          impresoraIp: impresoraIp,
          impresoraPuerto: parseInt(impresoraPuerto) || 9100
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success(`Impresión de prueba enviada a ${impresoraIp}:${impresoraPuerto}`)
      } else {
        toast.error(result.error || result.details || 'Error al imprimir')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar a impresora')
    } finally {
      setImprimiendo(false)
    }
  }

  // Seleccionar archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    const extensionesValidas = ['zpl', 'prn', 'dpl', 'nlbl', 'lbl', 'txt']
    
    if (!extensionesValidas.includes(extension || '')) {
      toast.error('El archivo debe ser .zpl, .prn, .nlbl, .lbl, .dpl o .txt')
      return
    }

    if (extension === 'dpl') {
      setTipoImpresora('DATAMAX')
      setModeloImpresora('MARK_II')
      setDpi(203)
    } else {
      setTipoImpresora('ZEBRA')
      setModeloImpresora('ZT410')
      setDpi(300)
    }

    setArchivo(file)
    
    if (extension === 'nlbl' || extension === 'lbl') {
      const buffer = await file.arrayBuffer()
      setArchivoBinario(buffer)
      setEsBinario(true)
      
      const bytes = new Uint8Array(buffer)
      const sizeKB = (bytes.length / 1024).toFixed(2)
      
      setContenidoArchivo(`[ARCHIVO ZEBRA DESIGNER - ${extension.toUpperCase()}]

Archivo: ${file.name}
Tamaño: ${sizeKB} KB

Este archivo se enviará DIRECTAMENTE a la impresora Zebra.`)
      setVariablesDetectadas([])
      toast.info('Archivo Zebra Designer detectado. Se enviará directo a impresora.')
    } else {
      const contenido = await file.text()
      setContenidoArchivo(contenido)
      setEsBinario(false)
      setArchivoBinario(null)
      
      const variables = detectarVariables(contenido, extension === 'dpl' ? 'DATAMAX' : 'ZEBRA')
      setVariablesDetectadas(variables)
    }
    
    const nombreBase = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    setNombre(nombreBase)
    setCodigo(file.name.replace(/\.[^/.]+$/, '').toUpperCase().replace(/\s+/g, '_'))
  }

  // Detectar variables en el contenido
  const detectarVariables = (contenido: string, tipoImpresora: string): VariableDetectada[] => {
    const variables: VariableDetectada[] = []
    const encontradas = new Set<string>()
    
    const regex = tipoImpresora === 'DATAMAX' 
      ? /\{([A-Z_0-9]+)\}/g
      : /\{\{([A-Z_0-9]+)\}\}/g
    
    let match
    while ((match = regex.exec(contenido)) !== null) {
      encontradas.add(match[1])
    }

    const mapeoCampos: Record<string, { campo: string; descripcion: string }> = {
      'FECHA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
      'FECHA_FAENA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
      'FECHA_VENC': { campo: 'fechaVencimiento', descripcion: 'Fecha vencimiento' },
      'TROPA': { campo: 'tropa', descripcion: 'Código de tropa' },
      'GARRON': { campo: 'garron', descripcion: 'Número de garrón' },
      'PESO': { campo: 'peso', descripcion: 'Peso' },
      'PRODUCTO': { campo: 'nombreProducto', descripcion: 'Nombre del producto' },
      'ESTABLECIMIENTO': { campo: 'establecimiento', descripcion: 'Establecimiento' },
      'USUARIO_FAENA': { campo: 'nombreUsuarioFaena', descripcion: 'Usuario de faena' },
      'CUIT': { campo: 'cuit', descripcion: 'CUIT' },
      'MATRICULA': { campo: 'matricula', descripcion: 'Matrícula' },
      'CODIGO_BARRAS': { campo: 'codigoBarras', descripcion: 'Código de barras' },
      'LOTE': { campo: 'lote', descripcion: 'Número de lote' },
      'LADO': { campo: 'ladoMedia', descripcion: 'Lado (I/D)' },
      'SIGLA': { campo: 'siglaMedia', descripcion: 'Sigla' },
      'DIAS_CONSUMO': { campo: 'diasConsumo', descripcion: 'Días de consumo' },
    }

    encontradas.forEach(variable => {
      const mapeo = mapeoCampos[variable] || { campo: variable.toLowerCase(), descripcion: variable }
      const formatoVar = tipoImpresora === 'DATAMAX' ? `{${variable}}` : `{{${variable}}}`
      variables.push({
        variable: formatoVar,
        campo: mapeo.campo,
        descripcion: mapeo.descripcion
      })
    })

    return variables
  }

  // Subir plantilla
  const handleSubir = async () => {
    if (!archivo || !nombre || !codigo) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('nombre', nombre)
      formData.append('codigo', codigo)
      formData.append('tipo', 'MEDIA_RES')
      formData.append('tipoImpresora', tipoImpresora)
      formData.append('ancho', String(ancho))
      formData.append('alto', String(alto))
      formData.append('dpi', String(dpi))
      formData.append('contenido', contenidoArchivo)
      formData.append('variables', JSON.stringify(variablesDetectadas))
      formData.append('categoria', categoriaUso)
      formData.append('esBinario', String(esBinario))
      
      if (esBinario && archivoBinario) {
        const blob = new Blob([archivoBinario], { type: 'application/octet-stream' })
        formData.set('file', blob, archivo?.name || 'rotulo.lbl')
      }

      const response = await fetch('/api/rotulos/upload-plantilla', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Plantilla importada correctamente')
        setModalImportar(false)
        resetForm()
        cargarRotulos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al subir plantilla')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al subir plantilla')
    } finally {
      setSubiendo(false)
    }
  }

  // Eliminar rótulo
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este rótulo?')) return

    try {
      const response = await fetch(`/api/rotulos/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Rótulo eliminado')
        cargarRotulos()
      }
    } catch (error) {
      toast.error('Error al eliminar rótulo')
    }
  }

  // Toggle activo
  const handleToggleActivo = async (rotulo: Rotulo) => {
    try {
      const response = await fetch(`/api/rotulos/${rotulo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rotulo, activo: !rotulo.activo })
      })
      if (response.ok) {
        toast.success(rotulo.activo ? 'Rótulo desactivado' : 'Rótulo activado')
        cargarRotulos()
      }
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  // Establecer como default
  const handleSetDefault = async (rotulo: Rotulo) => {
    try {
      const rotulosMismaCategoria = rotulos.filter(
        r => r.categoria === rotulo.categoria && r.id !== rotulo.id && r.esDefault
      )
      
      for (const r of rotulosMismaCategoria) {
        await fetch(`/api/rotulos/${r.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...r, esDefault: false })
        })
      }
      
      const response = await fetch(`/api/rotulos/${rotulo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rotulo, esDefault: true })
      })
      
      if (response.ok) {
        toast.success('Rótulo establecido como predeterminado')
        cargarRotulos()
      }
    } catch (error) {
      toast.error('Error al establecer predeterminado')
    }
  }

  // Copiar contenido
  const handleCopiar = async (contenido: string) => {
    try {
      await navigator.clipboard.writeText(contenido)
      toast.success('Contenido copiado al portapapeles')
    } catch (error) {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  // Editar rótulo
  const handleEditar = (rotulo: Rotulo) => {
    setRotuloSeleccionado(rotulo)
    setEditandoNombre(rotulo.nombre)
    setEditandoContenido(rotulo.contenido)
    setModalEditar(true)
  }

  // Guardar edición
  const handleGuardarEdicion = async () => {
    if (!rotuloSeleccionado) return
    
    setGuardando(true)
    try {
      const response = await fetch(`/api/rotulos/${rotuloSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rotuloSeleccionado,
          nombre: editandoNombre,
          contenido: editandoContenido
        })
      })
      
      if (response.ok) {
        toast.success('Rótulo actualizado')
        setModalEditar(false)
        cargarRotulos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar cambios')
    } finally {
      setGuardando(false)
    }
  }

  // Insertar variable en el cursor
  const insertarVariable = (variable: string) => {
    const formato = `{{${variable}}}`
    setEditandoContenido(prev => prev + formato)
  }

  // Vista previa en tiempo real del contenido editado
  const previewEdicion = procesarZplConDatos(editandoContenido, datosPrueba)

  // Reset formulario
  const resetForm = () => {
    setArchivo(null)
    setContenidoArchivo('')
    setArchivoBinario(null)
    setEsBinario(false)
    setVariablesDetectadas([])
    setNombre('')
    setCodigo('')
    setCategoriaUso('MEDIA_RES')
    setTipoImpresora('ZEBRA')
    setAncho(80)
    setAlto(50)
    setDpi(203)
    setVerContenido(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ========== EDITOR VISUAL ==========
  
  // Abrir editor visual
  const handleAbrirEditorVisual = (rotulo?: Rotulo) => {
    if (rotulo) {
      setEditandoRotuloVisual(rotulo)
      setElementosVisuales(rotulo.elementos || [])
    } else {
      // Nuevo rótulo
      setEditandoRotuloVisual({
        id: '',
        nombre: 'Nuevo Rótulo',
        codigo: `ROT-${Date.now()}`,
        tipo: 'MEDIA_RES' as TipoRotulo,
        ancho: 80,
        alto: 50,
        dpi: 203,
        tipoImpresora: 'ZEBRA',
        modeloImpresora: 'ZT410',
        contenido: '',
        activo: true,
        esDefault: false,
        elementos: []
      })
      setElementosVisuales([])
    }
    setModalEditor(true)
  }

  // Agregar elemento visual
  const agregarElementoVisual = (tipo: RotuloElement['tipo']) => {
    const nuevoElemento: RotuloElement = {
      id: `el-${Date.now()}`,
      tipo,
      posX: 10,
      posY: 10 + elementosVisuales.length * 30,
      ancho: tipo === 'LINEA' ? 200 : tipo === 'IMAGEN' ? 80 : 100,
      alto: tipo === 'CODIGO_BARRAS' ? 60 : tipo === 'IMAGEN' ? 80 : 30,
      fuente: '0',
      tamano: 10,
      negrita: false,
      alineacion: 'LEFT',
      tipoCodigo: 'CODE128',
      altoCodigo: 60,
      mostrarTexto: true,
      grosorLinea: 2,
      orden: elementosVisuales.length
    }
    setElementosVisuales([...elementosVisuales, nuevoElemento])
    toast.success('Elemento agregado')
  }

  // Actualizar elemento visual
  const actualizarElementoVisual = (id: string, cambios: Partial<RotuloElement>) => {
    setElementosVisuales(prev => prev.map(el => 
      el.id === id ? { ...el, ...cambios } : el
    ))
  }

  // Eliminar elemento visual
  const eliminarElementoVisual = (id: string) => {
    setElementosVisuales(prev => prev.filter(el => el.id !== id))
    toast.success('Elemento eliminado')
  }

  // Generar ZPL desde elementos visuales
  const generarZPL = (): string => {
    if (!editandoRotuloVisual) return ''
    
    let zpl = '^XA\n'
    zpl += `^PW${Math.round(editandoRotuloVisual.ancho * editandoRotuloVisual.dpi / 25.4)}\n`
    zpl += `^LL${Math.round(editandoRotuloVisual.alto * editandoRotuloVisual.dpi / 25.4)}\n`
    
    for (const el of elementosVisuales.sort((a, b) => a.orden - b.orden)) {
      switch (el.tipo) {
        case 'TEXTO':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^A${el.fuente}N,${el.tamano},${el.tamano}\n`
          zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
          zpl += `^FS\n`
          break
        case 'CODIGO_BARRAS':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^BY2,3,${el.altoCodigo || 60}\n`
          zpl += `^BCN,${el.altoCodigo || 60},${el.mostrarTexto ? 'N' : 'Y'}\n`
          zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
          zpl += `^FS\n`
          break
        case 'LINEA':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^GB${el.ancho},${el.grosorLinea || 2},${el.grosorLinea || 2}^FD^FS\n`
          break
        case 'RECTANGULO':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^GB${el.ancho},${el.alto},${el.grosorLinea || 2}^FD^FS\n`
          break
        case 'QR':
          zpl += `^FO${el.posX},${el.posY}\n`
          zpl += `^BQN,2,${Math.round(el.tamano / 5)}\n`
          zpl += `^FD${el.textoFijo || `{{${el.campo}}}`}\n`
          zpl += `^FS\n`
          break
        case 'IMAGEN':
          if (el.imagenBase64) {
            // Para imágenes, usamos ~DY para descargar gráficos
            zpl += `~DYR:IMG${el.id},P,P,${el.ancho},${el.alto},${el.imagenBase64.length}\n`
            zpl += `^FO${el.posX},${el.posY}\n`
            zpl += `^XGR:IMG${el.id},1,1^FS\n`
          }
          break
      }
    }
    
    zpl += '^XZ'
    return zpl
  }

  // Generar DPL desde elementos visuales
  const generarDPL = (): string => {
    if (!editandoRotuloVisual) return ''
    
    let dpl = 'STX ESC A\n'
    dpl += `ESC Q ${Math.round(editandoRotuloVisual.ancho * editandoRotuloVisual.dpi / 25.4)}\n`
    dpl += `ESC q ${Math.round(editandoRotuloVisual.alto * editandoRotuloVisual.dpi / 25.4)}\n`
    
    for (const el of elementosVisuales.sort((a, b) => a.orden - b.orden)) {
      switch (el.tipo) {
        case 'TEXTO':
          dpl += `ESC T ${el.fuente};${el.posX};${el.posY};${el.tamano};${el.tamano}\n`
          dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
          break
        case 'CODIGO_BARRAS':
          dpl += `ESC B ${el.posX};${el.posY};0;CODE128;${el.altoCodigo || 60}\n`
          dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
          break
        case 'LINEA':
          dpl += `ESC L ${el.posX};${el.posY};${el.posX + el.ancho};${el.posY};${el.grosorLinea || 2}\n`
          break
        case 'RECTANGULO':
          dpl += `ESC R ${el.posX};${el.posY};${el.posX + el.ancho};${el.posY + el.alto};${el.grosorLinea || 2}\n`
          break
        case 'QR':
          dpl += `ESC Q ${el.posX};${el.posY};${el.tamano}\n`
          dpl += `${el.textoFijo || `{{${el.campo}}}`}\n`
          break
        case 'IMAGEN':
          // DPL soporta imágenes con comando I
          if (el.imagenBase64) {
            dpl += `ESC I ${el.posX};${el.posY};${el.ancho};${el.alto}\n`
            dpl += `${el.imagenBase64.substring(0, 100)}...\n`
          }
          break
      }
    }
    
    dpl += 'ETX'
    return dpl
  }

  // Guardar rótulo visual
  const handleGuardarRotuloVisual = async () => {
    if (!editandoRotuloVisual) return
    
    const contenido = editandoRotuloVisual.tipoImpresora === 'DATAMAX' 
      ? generarDPL() 
      : generarZPL()
    
    try {
      const body = {
        ...editandoRotuloVisual,
        contenido,
        elementos: elementosVisuales
      }
      
      const response = await fetch('/api/rotulos', {
        method: editandoRotuloVisual.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        toast.success('Rótulo guardado correctamente')
        setModalEditor(false)
        cargarRotulos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar rótulo')
    }
  }

  // Agrupar rótulos por categoría
  const rotulosPorCategoria = rotulos.reduce((acc, rotulo) => {
    const cat = rotulo.categoria || 'SIN_CATEGORIA'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(rotulo)
    return acc
  }, {} as Record<string, Rotulo[]>)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-500" />
            Configuración de Rótulos
          </h2>
          <p className="text-sm text-stone-500">Plantillas para impresoras Zebra y Datamax</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => handleAbrirEditorVisual()}
          >
            <Palette className="w-4 h-4 mr-2" />
            Editor Visual
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open('/VARIABLES_SOPORTADAS.txt', '_blank')}
          >
            <Variable className="w-4 h-4 mr-2" />
            Ver Variables
          </Button>
          <Button 
            onClick={() => setModalImportar(true)} 
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Plantilla
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 mb-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <strong>Flujo de trabajo:</strong> Diseñe en Zebra Designer → Use variables como {'{{FECHA}}'}, {'{{TROPA}}'} → 
                Importe la plantilla → Asigne a una categoría → Al imprimir se reemplazan las variables automáticamente.
                <br />
                <strong>Nuevo:</strong> Use el Editor Visual para crear rótulos sin Zebra Designer.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de rótulos por categoría */}
      <div className="flex-1 px-4 overflow-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : rotulos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileCode className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500">No hay plantillas configuradas</p>
              <p className="text-xs text-stone-400 mt-1">Importe una plantilla o use el Editor Visual</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={() => handleAbrirEditorVisual()}>
                  <Palette className="w-4 h-4 mr-2" />
                  Editor Visual
                </Button>
                <Button variant="outline" onClick={() => setModalImportar(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(rotulosPorCategoria).map(([categoria, rotulosCat]) => (
              <Card key={categoria} className="border-0 shadow-md">
                <CardHeader className="py-3 px-4 bg-stone-50 border-b">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {CATEGORIAS_USO.find(c => c.value === categoria)?.label || categoria}
                      <Badge variant="outline" className="font-normal">{rotulosCat.length}</Badge>
                    </span>
                    <span className="text-xs text-stone-400 font-normal">
                      {CATEGORIAS_USO.find(c => c.value === categoria)?.descripcion}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {rotulosCat.map((rotulo) => (
                      <div key={rotulo.id} className="p-3 hover:bg-stone-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={
                              rotulo.tipoImpresora === 'DATAMAX' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }>
                              {rotulo.tipoImpresora === 'DATAMAX' ? 'DPL' : 'ZPL'}
                            </Badge>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {rotulo.nombre}
                                {rotulo.esDefault && (
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                )}
                              </p>
                              <p className="text-xs text-stone-500">
                                {rotulo.codigo} • {rotulo.ancho}×{rotulo.alto}mm • {rotulo.dpi} DPI
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(rotulo)}
                              title="Vista previa"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(rotulo)}
                              title="Establecer como predeterminado"
                              disabled={rotulo.esDefault}
                            >
                              <Star className={`w-4 h-4 ${rotulo.esDefault ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopiar(rotulo.contenido)}
                              title="Copiar código"
                            >
                              <Copy className="w-4 h-4 text-stone-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(rotulo)}
                              title="Editar"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActivo(rotulo)}
                              title={rotulo.activo ? 'Desactivar' : 'Activar'}
                            >
                              <Power className={`w-4 h-4 ${rotulo.activo ? 'text-green-500' : 'text-stone-300'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(rotulo.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Importar */}
      <Dialog open={modalImportar} onOpenChange={(open) => {
        setModalImportar(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              Importar Plantilla
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Archivo */}
            <div>
              <Label>Archivo de Plantilla</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".zpl,.prn,.nlbl,.lbl,.dpl,.txt"
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-xs text-stone-500 mt-1">
                Zebra: .zpl, .prn, .nlbl, .lbl | Datamax: .dpl
              </p>
            </div>

            {/* Nombre y código */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div>
                <Label>Código</Label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
              </div>
            </div>

            {/* Tipo y Modelo de Impresora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Impresora</Label>
                <Select value={tipoImpresora} onValueChange={(v) => {
                  setTipoImpresora(v)
                  if (v === 'DATAMAX') {
                    setModeloImpresora('MARK_II')
                    setDpi(203)
                  } else {
                    setModeloImpresora('ZT410')
                    setDpi(300)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_IMPRESORA.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo</Label>
                <Select value={modeloImpresora} onValueChange={(v) => {
                  setModeloImpresora(v)
                  const modelo = MODELOS_IMPRESORA[tipoImpresora as keyof typeof MODELOS_IMPRESORA]?.find(m => m.value === v)
                  if (modelo) setDpi(modelo.dpi)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS_IMPRESORA[tipoImpresora as keyof typeof MODELOS_IMPRESORA]?.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoría de uso */}
            <div>
              <Label>Categoría de Uso</Label>
              <Select value={categoriaUso} onValueChange={setCategoriaUso}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_USO.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} - {c.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensiones */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Ancho (mm)</Label>
                <Input type="number" value={ancho} onChange={(e) => setAncho(parseInt(e.target.value) || 80)} />
              </div>
              <div>
                <Label>Alto (mm)</Label>
                <Input type="number" value={alto} onChange={(e) => setAlto(parseInt(e.target.value) || 50)} />
              </div>
              <div>
                <Label>DPI</Label>
                <Input type="number" value={dpi} onChange={(e) => setDpi(parseInt(e.target.value) || 203)} />
              </div>
            </div>

            {/* Variables detectadas */}
            {variablesDetectadas.length > 0 && (
              <div>
                <Label>Variables Detectadas ({variablesDetectadas.length})</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {variablesDetectadas.map((v, i) => (
                    <code key={i} className="text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                      {v.variable} → {v.descripcion}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido */}
            {contenidoArchivo && !esBinario && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Contenido</Label>
                  <Button variant="ghost" size="sm" onClick={() => setVerContenido(!verContenido)}>
                    {verContenido ? 'Ocultar' : 'Ver'}
                  </Button>
                </div>
                {verContenido && (
                  <Textarea
                    value={contenidoArchivo}
                    onChange={(e) => setContenidoArchivo(e.target.value)}
                    className="font-mono text-xs h-40"
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalImportar(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubir}
              disabled={subiendo || !archivo || !nombre}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Preview */}
      <Dialog open={modalPreview} onOpenChange={setModalPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              Vista Previa: {rotuloSeleccionado?.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Impresora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>IP de la Impresora</Label>
                <Input 
                  value={impresoraIp} 
                  onChange={(e) => setImpresoraIp(e.target.value)}
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <Label>Puerto</Label>
                <Input 
                  value={impresoraPuerto} 
                  onChange={(e) => setImpresoraPuerto(e.target.value)}
                  placeholder="9100"
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Código (con datos de prueba)</Label>
              <Textarea
                value={previewProcesado}
                readOnly
                className="font-mono text-xs h-64 bg-stone-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPreview(false)}>
              Cerrar
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (rotuloSeleccionado) {
                  const blob = new Blob([previewProcesado], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  const ext = rotuloSeleccionado.tipoImpresora === 'DATAMAX' ? 'dpl' : 'zpl'
                  a.download = `${rotuloSeleccionado.nombre.replace(/\s+/g, '_')}.${ext}`
                  a.click()
                  URL.revokeObjectURL(url)
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button 
              onClick={handleImprimirPrueba}
              disabled={imprimiendo || !impresoraIp}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {imprimiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
              Imprimir Prueba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-500" />
              Editar Rótulo
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Panel izquierdo: Editor */}
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={editandoNombre} onChange={(e) => setEditandoNombre(e.target.value)} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Contenido</Label>
                  <span className="text-xs text-stone-400">Variables disponibles → click para insertar</span>
                </div>
                <Textarea
                  value={editandoContenido}
                  onChange={(e) => setEditandoContenido(e.target.value)}
                  className="font-mono text-xs h-64"
                />
              </div>

              {/* Variables para insertar */}
              <div>
                <Label>Insertar Variable</Label>
                <ScrollArea className="h-32 border rounded p-2">
                  <div className="space-y-1">
                    {VARIABLES_DISPONIBLES.map(v => (
                      <div
                        key={v.id}
                        className="flex justify-between text-xs p-1 hover:bg-stone-100 rounded cursor-pointer"
                        onClick={() => insertarVariable(v.id)}
                      >
                        <code className="text-amber-600">{'{{' + v.id + '}}'}</code>
                        <span className="text-stone-500">{v.nombre}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Panel derecho: Preview */}
            <div>
              <Label>Vista Previa (con datos de prueba)</Label>
              <Textarea
                value={previewEdicion}
                readOnly
                className="font-mono text-xs h-96 bg-stone-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardarEdicion}
              disabled={guardando}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editor Visual - Pantalla Completa */}
      <Dialog open={modalEditor} onOpenChange={setModalEditor}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Editor Visual de Rótulos</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full">
            {/* Header con configuración */}
            <div className="flex items-center justify-between p-3 border-b bg-stone-50 gap-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold">Editor Visual de Rótulos</h2>
              </div>
              
              {editandoRotuloVisual && (
                <div className="flex items-center gap-3 flex-1 justify-end">
                  {/* Nombre */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-stone-500">Nombre:</Label>
                    <Input 
                      value={editandoRotuloVisual.nombre}
                      onChange={(e) => setEditandoRotuloVisual(prev => prev ? {...prev, nombre: e.target.value} : null)}
                      className="w-40 h-8"
                      placeholder="Nombre del rótulo"
                    />
                  </div>
                  
                  {/* Tipo de Impresora */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-stone-500">Impresora:</Label>
                    <Select 
                      value={editandoRotuloVisual.tipoImpresora}
                      onValueChange={(v) => setEditandoRotuloVisual(prev => prev ? {...prev, tipoImpresora: v} : null)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZEBRA">Zebra (ZPL)</SelectItem>
                        <SelectItem value="DATAMAX">Datamax (DPL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Modelo de Impresora */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-stone-500">Modelo:</Label>
                    <Select 
                      value={editandoRotuloVisual.modeloImpresora || 'ZT410'}
                      onValueChange={(v) => {
                        const modelo = MODELOS_IMPRESORA[editandoRotuloVisual.tipoImpresora as keyof typeof MODELOS_IMPRESORA]?.find(m => m.value === v)
                        setEditandoRotuloVisual(prev => prev ? {...prev, modeloImpresora: v, dpi: modelo?.dpi || 203} : null)
                      }}
                    >
                      <SelectTrigger className="w-36 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELOS_IMPRESORA[editandoRotuloVisual.tipoImpresora as keyof typeof MODELOS_IMPRESORA]?.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Ancho */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-stone-500">Ancho:</Label>
                    <Input 
                      type="number"
                      value={editandoRotuloVisual.ancho}
                      onChange={(e) => setEditandoRotuloVisual(prev => prev ? {...prev, ancho: parseInt(e.target.value) || 80} : null)}
                      className="w-16 h-8"
                    />
                    <span className="text-xs text-stone-400">mm</span>
                  </div>
                  
                  {/* Alto */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-stone-500">Alto:</Label>
                    <Input 
                      type="number"
                      value={editandoRotuloVisual.alto}
                      onChange={(e) => setEditandoRotuloVisual(prev => prev ? {...prev, alto: parseInt(e.target.value) || 50} : null)}
                      className="w-16 h-8"
                    />
                    <span className="text-xs text-stone-400">mm</span>
                  </div>
                  
                  {/* DPI */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-stone-500">DPI:</Label>
                    <span className="text-sm font-medium">{editandoRotuloVisual.dpi}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Contenido principal con VisualEditor */}
            <div className="flex-1 overflow-hidden">
              {editandoRotuloVisual && (
                <VisualEditor
                  elementos={elementosVisuales}
                  onChange={setElementosVisuales}
                  ancho={editandoRotuloVisual.ancho}
                  alto={editandoRotuloVisual.alto}
                  tipoImpresora={editandoRotuloVisual.tipoImpresora as 'ZEBRA' | 'DATAMAX'}
                  dpi={editandoRotuloVisual.dpi}
                />
              )}
            </div>

            {/* Footer con código generado */}
            <div className="border-t bg-stone-50">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setModalEditor(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleGuardarRotuloVisual}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Guardar Rótulo
                  </Button>
                </div>
                
                {editandoRotuloVisual && (
                  <div className="text-xs text-stone-500">
                    {editandoRotuloVisual.tipoImpresora} • {editandoRotuloVisual.ancho}x{editandoRotuloVisual.alto}mm • {elementosVisuales.length} elementos
                  </div>
                )}
              </div>
              {editandoRotuloVisual && (
                <div className="px-2 pb-2">
                  <Textarea
                    value={editandoRotuloVisual.tipoImpresora === 'DATAMAX' ? generarDPL() : generarZPL()}
                    readOnly
                    className="font-mono text-xs h-16 bg-stone-100"
                    placeholder="Código generado..."
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
