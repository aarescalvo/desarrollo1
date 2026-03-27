'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, DollarSign, CheckCircle, XCircle, Eye,
  Plus, Search, Loader2, Printer, RefreshCw, Edit,
  Trash2, CreditCard, History, BarChart3, Package,
  ShoppingCart, TrendingUp, Calendar, Users, Settings,
  ChevronDown, ChevronUp, AlertCircle, Check, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface Operador { id: string; nombre: string; rol: string }

interface DetalleFactura {
  id?: string
  tipoProducto: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  precioSugerido?: number
  precioConfirmado: boolean
  subtotal: number
  tropaCodigo?: string
  garron?: number
  pesoKg?: number
  productoVendibleId?: string
  despachoId?: string
}

interface Pago {
  id: string
  monto: number
  formaPago: string
  referencia?: string
  observaciones?: string
  fecha: string
}

interface Factura {
  id: string
  numero: string
  fecha: string
  cliente: { id: string; nombre: string; cuit?: string }
  clienteId: string
  condicionVenta?: string
  remito?: string
  observaciones?: string
  subtotal: number
  iva: number
  total: number
  estado: 'PENDIENTE' | 'EMITIDA' | 'PAGADA' | 'ANULADA'
  detalles: DetalleFactura[]
  pagos: Pago[]
  totalPagado?: number
  saldoPendiente?: number
}

interface Cliente {
  id: string
  nombre: string
  cuit?: string
  condicionIva?: string
}

interface Despacho {
  id: string
  numero: number
  fecha: string
  destino: string
  kgTotal: number
  cantidadMedias: number
  cliente?: { id: string; nombre: string }
  clienteId?: string
  estado: string
}

interface DespachoItem {
  id: string
  peso: number
  tropaCodigo?: string
  garron?: number
  productoVendible?: { id: string; nombre: string; precioBase?: number }
  precioSugerido: number
  fuentePrecio: string
  subtotalSugerido: number
}

interface ProductoVendible {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria: string
  tipoVenta: string
  unidadMedida: string
  precioBase?: number
  precioActual: number
  moneda: string
  alicuotaIva: number
  activo: boolean
}

interface Props { operador: Operador }

const TIPOS_PRODUCTO = [
  { value: 'MEDIA_RES', label: 'Media Res' },
  { value: 'CUARTO_DELANTERO', label: 'Cuarto Delantero' },
  { value: 'CUARTO_TRASERO', label: 'Cuarto Trasero' },
  { value: 'MENUDENCIA', label: 'Menudencia' },
  { value: 'SERVICIO_FAENA', label: 'Servicio de Faena' },
  { value: 'OTRO', label: 'Otro' },
]

const FORMAS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA', label: 'Tarjeta' },
]

const COLORES_GRAFICO = ['#FF6B35', '#004E89', '#00A878', '#D64045', '#7B68EE', '#FFD166']

export function FacturacionModule({ operador }: Props) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<ProductoVendible[]>([])
  const [despachosPendientes, setDespachosPendientes] = useState<Despacho[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [pagoOpen, setPagoOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [despachosOpen, setDespachosOpen] = useState(false)
  const [productosOpen, setProductosOpen] = useState(false)
  
  // Factura seleccionada
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [filtroClienteId, setFiltroClienteId] = useState<string>('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Tabs
  const [tabActivo, setTabActivo] = useState('facturas')
  
  // Formulario nueva/editar factura
  const [formData, setFormData] = useState({
    clienteId: '',
    condicionVenta: 'CONTADO',
    remito: '',
    observaciones: '',
    detalles: [] as DetalleFactura[]
  })
  
  // Facturar desde remitos
  const [despachosSeleccionados, setDespachosSeleccionados] = useState<string[]>([])
  const [itemsFacturar, setItemsFacturar] = useState<any[]>([])
  const [serviciosAdicionales, setServiciosAdicionales] = useState<any[]>([])
  const [clienteDespacho, setClienteDespacho] = useState<Cliente | null>(null)
  
  // Formulario pago
  const [pagoData, setPagoData] = useState({
    monto: 0,
    formaPago: 'EFECTIVO',
    referencia: '',
    observaciones: ''
  })
  
  // Datos de gráficos
  const [datosGrafico, setDatosGrafico] = useState<any[]>([])
  const [tipoGrafico, setTipoGrafico] = useState<'semanal' | 'mensual' | 'porCliente'>('semanal')
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    pagadas: 0,
    montoTotal: 0,
    saldoPendiente: 0
  })

  // Cargar datos iniciales
  useEffect(() => {
    fetchFacturas()
    fetchClientes()
    fetchProductos()
  }, [])

  // Efecto para cargar gráficos cuando cambia el tab
  useEffect(() => {
    if (tabActivo === 'informes') {
      fetchDatosGrafico()
    }
  }, [tabActivo, tipoGrafico, filtroClienteId])

  const fetchFacturas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado)
      if (filtroClienteId) params.append('clienteId', filtroClienteId)
      if (filtroFechaDesde) params.append('desde', filtroFechaDesde)
      if (filtroFechaHasta) params.append('hasta', filtroFechaHasta)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/facturacion?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setFacturas(data.data)
        setStats(data.stats)
      }
    } catch {
      toast.error('Error al cargar las facturas')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      if (data.success) {
        setClientes(data.data)
      }
    } catch {
      console.error('Error cargando clientes')
    }
  }

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos-vendibles?activo=true')
      const data = await res.json()
      if (data.success) {
        setProductos(data.data)
      }
    } catch {
      console.error('Error cargando productos')
    }
  }

  const fetchDespachosPendientes = async (clienteId?: string) => {
    try {
      const params = clienteId ? `?clienteId=${clienteId}` : ''
      const res = await fetch(`/api/facturacion/desde-remitos${params}`)
      const data = await res.json()
      if (data.success) {
        setDespachosPendientes(data.data)
      }
    } catch {
      toast.error('Error al cargar despachos')
    }
  }

  const fetchDatosGrafico = async () => {
    try {
      const params = new URLSearchParams()
      params.append('tipo', tipoGrafico)
      if (filtroClienteId) params.append('clienteId', filtroClienteId)
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde)
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta)

      const res = await fetch(`/api/facturacion/informes?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setDatosGrafico(data.data)
      }
    } catch {
      toast.error('Error al cargar datos del gráfico')
    }
  }

  // Nueva factura
  const handleNuevaFactura = () => {
    setFormData({
      clienteId: '',
      condicionVenta: 'CONTADO',
      remito: '',
      observaciones: '',
      detalles: [{ 
        tipoProducto: 'OTRO', 
        descripcion: '', 
        cantidad: 1, 
        unidad: 'KG', 
        precioUnitario: 0, 
        precioSugerido: 0,
        precioConfirmado: false,
        subtotal: 0 
      }]
    })
    setDialogOpen(true)
  }

  // Abrir diálogo de facturar desde remitos
  const handleFacturarDesdeRemitos = async () => {
    await fetchDespachosPendientes()
    setDespachosSeleccionados([])
    setItemsFacturar([])
    setServiciosAdicionales([])
    setClienteDespacho(null)
    setDespachosOpen(true)
  }

  // Seleccionar despacho y cargar items
  const handleSeleccionarDespacho = async (despachoId: string) => {
    const isSelected = despachosSeleccionados.includes(despachoId)
    
    if (isSelected) {
      // Deseleccionar
      setDespachosSeleccionados(prev => prev.filter(id => id !== despachoId))
      setItemsFacturar(prev => prev.filter(item => item.despachoId !== despachoId))
    } else {
      // Seleccionar y cargar items
      try {
        const res = await fetch(`/api/facturacion/desde-remitos?despachoId=${despachoId}`)
        const data = await res.json()
        if (data.success) {
          setDespachosSeleccionados(prev => [...prev, despachoId])
          setItemsFacturar(prev => [...prev, ...data.items])
          
          // Si hay cliente, establecerlo
          if (data.despacho.cliente && !clienteDespacho) {
            setClienteDespacho(data.despacho.cliente)
          }
        }
      } catch {
        toast.error('Error al cargar items del despacho')
      }
    }
  }

  // Actualizar precio de un item
  const actualizarPrecioItem = (index: number, precio: number) => {
    setItemsFacturar(prev => {
      const nuevos = [...prev]
      nuevos[index] = {
        ...nuevos[index],
        precioUnitario: precio,
        precioConfirmado: true,
        subtotalSugerido: precio * nuevos[index].peso
      }
      return nuevos
    })
  }

  // Agregar servicio adicional
  const agregarServicio = () => {
    setServiciosAdicionales(prev => [...prev, {
      productoVendibleId: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0
    }])
  }

  // Actualizar servicio
  const actualizarServicio = (index: number, field: string, value: any) => {
    setServiciosAdicionales(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [field]: value }
      
      if (field === 'cantidad' || field === 'precioUnitario') {
        nuevos[index].subtotal = nuevos[index].cantidad * nuevos[index].precioUnitario
      }
      
      // Si selecciona un producto, cargar datos
      if (field === 'productoVendibleId' && value) {
        const producto = productos.find(p => p.id === value)
        if (producto) {
          nuevos[index].descripcion = producto.nombre
          nuevos[index].precioUnitario = producto.precioActual || 0
          nuevos[index].subtotal = nuevos[index].cantidad * nuevos[index].precioUnitario
        }
      }
      
      return nuevos
    })
  }

  // Eliminar servicio
  const eliminarServicio = (index: number) => {
    setServiciosAdicionales(prev => prev.filter((_, i) => i !== index))
  }

  // Eliminar item
  const eliminarItem = (index: number) => {
    setItemsFacturar(prev => prev.filter((_, i) => i !== index))
  }

  // Generar factura desde remitos
  const handleGenerarFacturaDesdeRemitos = async () => {
    if (!clienteDespacho?.id) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    if (itemsFacturar.length === 0 && serviciosAdicionales.length === 0) {
      toast.error('Debe agregar items o servicios')
      return
    }

    // Verificar que todos los precios estén confirmados
    const itemsSinPrecio = itemsFacturar.filter(item => !item.precioConfirmado && item.precioUnitario === 0)
    if (itemsSinPrecio.length > 0) {
      toast.error(`Hay ${itemsSinPrecio.length} items sin precio. Confirme los precios antes de facturar.`)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/facturacion/desde-remitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteDespacho.id,
          despachoIds: despachosSeleccionados,
          items: itemsFacturar.map(item => ({
            tipoProducto: 'MEDIA_RES',
            descripcion: item.productoVendible?.nombre || 'Media Res',
            cantidad: item.peso,
            unidad: 'KG',
            precioUnitario: item.precioUnitario,
            precioSugerido: item.precioSugerido,
            pesoKg: item.peso,
            tropaCodigo: item.tropaCodigo,
            garron: item.garron,
            productoVendibleId: item.productoVendible?.id,
            despachoId: item.despachoId
          })),
          servicios: serviciosAdicionales,
          operadorId: operador.id,
          condicionVenta: 'CONTADO'
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setDespachosOpen(false)
        fetchFacturas()
      } else {
        toast.error(data.error || 'Error al generar factura')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Editar factura
  const handleEditar = (factura: Factura) => {
    setFacturaSeleccionada(factura)
    setFormData({
      clienteId: factura.clienteId,
      condicionVenta: factura.condicionVenta || 'CONTADO',
      remito: factura.remito || '',
      observaciones: factura.observaciones || '',
      detalles: factura.detalles.length > 0 ? factura.detalles : [
        { tipoProducto: 'OTRO', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0, precioConfirmado: false, subtotal: 0 }
      ]
    })
    setEditOpen(true)
  }

  // Ver detalle
  const handleVerDetalle = async (factura: Factura) => {
    try {
      const res = await fetch(`/api/facturacion/${factura.id}`)
      const data = await res.json()
      if (data.success) {
        setFacturaSeleccionada(data.data)
        setViewOpen(true)
      }
    } catch {
      toast.error('Error al cargar detalle')
    }
  }

  // Agregar item manual
  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      detalles: [...prev.detalles, { tipoProducto: 'OTRO', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0, precioConfirmado: false, subtotal: 0 }]
    }))
  }

  // Eliminar item manual
  const eliminarItemForm = (index: number) => {
    if (formData.detalles.length <= 1) return
    setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }))
  }

  // Actualizar item manual
  const actualizarItem = (index: number, field: keyof DetalleFactura, value: string | number | boolean) => {
    setFormData(prev => {
      const nuevosDetalles = [...prev.detalles]
      nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value }
      
      // Calcular subtotal
      if (field === 'cantidad' || field === 'precioUnitario') {
        nuevosDetalles[index].subtotal = nuevosDetalles[index].cantidad * nuevosDetalles[index].precioUnitario
      }
      
      return { ...prev, detalles: nuevosDetalles }
    })
  }

  // Guardar factura
  const handleGuardar = async (esEdicion = false) => {
    if (!formData.clienteId) {
      toast.error('Debe seleccionar un cliente')
      return
    }
    if (formData.detalles.length === 0 || formData.detalles.every(d => !d.descripcion)) {
      toast.error('Debe agregar al menos un item')
      return
    }

    setSaving(true)
    try {
      const url = esEdicion ? `/api/facturacion/${facturaSeleccionada?.id}` : '/api/facturacion'
      const method = esEdicion ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Factura guardada')
        setDialogOpen(false)
        setEditOpen(false)
        fetchFacturas()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Registrar pago
  const handleRegistrarPago = async () => {
    if (!facturaSeleccionada || pagoData.monto <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/facturacion/${facturaSeleccionada.id}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pagoData,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setPagoOpen(false)
        setPagoData({ monto: 0, formaPago: 'EFECTIVO', referencia: '', observaciones: '' })
        fetchFacturas()
        handleVerDetalle(facturaSeleccionada)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  // Anular factura
  const handleAnular = async () => {
    if (!facturaSeleccionada) return

    setSaving(true)
    try {
      const res = await fetch(`/api/facturacion/${facturaSeleccionada.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setDeleteOpen(false)
        fetchFacturas()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al anular')
    } finally {
      setSaving(false)
    }
  }

  // Imprimir
  const handleImprimir = (factura: Factura) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const subtotal = factura.subtotal || 0
      const iva = factura.iva || 0
      const total = factura.total || 0
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Factura ${factura.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; }
            .row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; width: 200px; color: #555; }
            .value { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
            .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">FACTURA</div>
            <div>N° ${factura.numero}</div>
            <div>Fecha: ${new Date(factura.fecha).toLocaleDateString('es-AR')}</div>
          </div>
          <div class="row">
            <span class="label">Cliente:</span>
            <span class="value">${factura.cliente?.nombre || 'N/A'}</span>
          </div>
          ${factura.cliente?.cuit ? `<div class="row"><span class="label">CUIT:</span><span class="value">${factura.cliente.cuit}</span></div>` : ''}
          ${factura.condicionVenta ? `<div class="row"><span class="label">Condición:</span><span class="value">${factura.condicionVenta}</span></div>` : ''}
          
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>P. Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(factura.detalles || []).map(d => `
                <tr>
                  <td>${d.descripcion}</td>
                  <td>${d.cantidad} ${d.unidad}</td>
                  <td>$${d.precioUnitario.toFixed(2)}</td>
                  <td>$${d.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="row"><span class="label">Subtotal:</span><span class="value">$${subtotal.toFixed(2)}</span></div>
          <div class="row"><span class="label">IVA (21%):</span><span class="value">$${iva.toFixed(2)}</span></div>
          <div class="total">Total: $${total.toFixed(2)}</div>
          
          <div class="footer">
            <p>Solemar Alimentaria - Sistema de Trazabilidad</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Calcular totales del formulario
  const calcularTotalesForm = () => {
    const subtotal = formData.detalles.reduce((sum, d) => sum + d.subtotal, 0)
    const iva = subtotal * 0.21
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  // Calcular totales de facturar desde remitos
  const calcularTotalesRemitos = () => {
    const subtotalItems = itemsFacturar.reduce((sum, item) => sum + (item.precioUnitario || 0) * item.peso, 0)
    const subtotalServicios = serviciosAdicionales.reduce((sum, s) => sum + s.subtotal, 0)
    const subtotal = subtotalItems + subtotalServicios
    const iva = subtotal * 0.21
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  // Filtrar facturas
  const facturasFiltradas = facturas.filter(f => {
    const matchEstado = filtroEstado === 'TODOS' || f.estado === filtroEstado
    const matchSearch = !searchTerm || 
      f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchEstado && matchSearch
  })

  // Badge de estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'EMITIDA': return <Badge className="bg-blue-100 text-blue-700">Emitida</Badge>
      case 'PAGADA': return <Badge className="bg-emerald-100 text-emerald-700">Pagada</Badge>
      case 'ANULADA': return <Badge className="bg-red-100 text-red-700">Anulada</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              Facturación
            </h1>
            <p className="text-stone-500 mt-1">Gestión completa de facturas, remitos y precios</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={fetchFacturas} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleFacturarDesdeRemitos} variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Facturar Remitos
            </Button>
            <Button onClick={handleNuevaFactura} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tabActivo} onValueChange={setTabActivo}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="facturas" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Facturas
            </TabsTrigger>
            <TabsTrigger value="porCliente" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Por Cliente
            </TabsTrigger>
            <TabsTrigger value="informes" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Informes
            </TabsTrigger>
          </TabsList>

          {/* Tab Facturas */}
          <TabsContent value="facturas" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('TODOS')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg"><FileText className="w-5 h-5 text-stone-600" /></div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Total</p>
                      <p className="text-2xl font-bold text-stone-800">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PENDIENTE')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="w-5 h-5 text-amber-600" /></div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Pendientes</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PAGADA')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Pagadas</p>
                      <p className="text-2xl font-bold text-emerald-600">{stats.pagadas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg"><DollarSign className="w-5 h-5 text-stone-600" /></div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Monto Total</p>
                      <p className="text-lg font-bold text-stone-800">{formatCurrency(stats.montoTotal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg"><DollarSign className="w-5 h-5 text-red-600" /></div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Saldo Pendiente</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(stats.saldoPendiente)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      placeholder="Buscar por número o cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los estados</SelectItem>
                      <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                      <SelectItem value="EMITIDA">Emitidas</SelectItem>
                      <SelectItem value="PAGADA">Pagadas</SelectItem>
                      <SelectItem value="ANULADA">Anuladas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los clientes</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Facturas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Listado de Facturas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : facturasFiltradas.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay facturas que mostrar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Número</TableHead>
                          <TableHead className="font-semibold">Fecha</TableHead>
                          <TableHead className="font-semibold">Cliente</TableHead>
                          <TableHead className="font-semibold">Total</TableHead>
                          <TableHead className="font-semibold">Pagado</TableHead>
                          <TableHead className="font-semibold">Saldo</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturasFiltradas.map((factura) => {
                          const totalPagado = factura.pagos?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
                          const saldo = (factura.total || 0) - totalPagado
                          
                          return (
                            <TableRow key={factura.id} className="hover:bg-stone-50">
                              <TableCell className="font-mono font-medium">{factura.numero}</TableCell>
                              <TableCell>{new Date(factura.fecha).toLocaleDateString('es-AR')}</TableCell>
                              <TableCell>{factura.cliente?.nombre || 'N/A'}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(factura.total)}</TableCell>
                              <TableCell className="text-emerald-600">{formatCurrency(totalPagado)}</TableCell>
                              <TableCell className={saldo > 0 ? 'text-red-600 font-medium' : 'text-emerald-600'}>
                                {formatCurrency(saldo)}
                              </TableCell>
                              <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleVerDetalle(factura)}
                                    title="Ver detalle"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {factura.estado !== 'ANULADA' && factura.estado !== 'PAGADA' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditar(factura)}
                                        title="Editar"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => { setFacturaSeleccionada(factura); setPagoData({ ...pagoData, monto: saldo }); setPagoOpen(true) }}
                                        title="Registrar pago"
                                        className="text-emerald-600"
                                      >
                                        <CreditCard className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleImprimir(factura)}
                                    title="Imprimir"
                                    disabled={factura.estado === 'ANULADA'}
                                  >
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                  {factura.estado !== 'ANULADA' && factura.estado !== 'PAGADA' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => { setFacturaSeleccionada(factura); setDeleteOpen(true) }}
                                      title="Anular"
                                      className="text-red-500"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Por Cliente */}
          <TabsContent value="porCliente" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Facturación por Cliente
                </CardTitle>
                <CardDescription>Resumen de facturación y saldos por cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                    <SelectTrigger className="w-full md:w-80">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los clientes</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {filtroClienteId ? (
                  <div className="space-y-4">
                    {/* Mostrar facturas del cliente seleccionado */}
                    {facturasFiltradas.filter(f => f.clienteId === filtroClienteId).length === 0 ? (
                      <div className="py-8 text-center text-stone-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>El cliente no tiene facturas</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {facturasFiltradas
                          .filter(f => f.clienteId === filtroClienteId)
                          .map(factura => {
                            const totalPagado = factura.pagos?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
                            const saldo = (factura.total || 0) - totalPagado
                            
                            return (
                              <Card key={factura.id} className="border">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold">{factura.numero}</p>
                                      <p className="text-sm text-stone-500">{new Date(factura.fecha).toLocaleDateString('es-AR')}</p>
                                    </div>
                                    {getEstadoBadge(factura.estado)}
                                  </div>
                                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-stone-500">Total</p>
                                      <p className="font-semibold">{formatCurrency(factura.total)}</p>
                                    </div>
                                    <div>
                                      <p className="text-stone-500">Pagado</p>
                                      <p className="font-semibold text-emerald-600">{formatCurrency(totalPagado)}</p>
                                    </div>
                                    <div>
                                      <p className="text-stone-500">Saldo</p>
                                      <p className={`font-semibold ${saldo > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(saldo)}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-stone-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Seleccione un cliente para ver su facturación</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Informes */}
          <TabsContent value="informes" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Informes de Facturación
                </CardTitle>
                <CardDescription>Gráficos semanales y mensuales de facturación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Controles */}
                <div className="flex flex-col md:flex-row gap-3">
                  <Select value={tipoGrafico} onValueChange={(v) => setTipoGrafico(v as any)}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="porCliente">Por Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los clientes</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gráfico */}
                {datosGrafico.length > 0 && (
                  <div className="h-80 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      {tipoGrafico === 'porCliente' ? (
                        <BarChart data={datosGrafico.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                          <YAxis dataKey="clienteNombre" type="category" width={120} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="total" fill="#FF6B35" name="Total Facturado" />
                        </BarChart>
                      ) : (
                        <LineChart data={datosGrafico}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={tipoGrafico === 'semanal' ? 'fecha' : 'mes'} />
                          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="total" stroke="#FF6B35" strokeWidth={2} name="Total" />
                          <Line type="monotone" dataKey="pagado" stroke="#00A878" strokeWidth={2} name="Pagado" />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {datosGrafico.length === 0 && (
                  <div className="py-12 text-center text-stone-400">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay datos para mostrar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Nueva Factura */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Nueva Factura
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(v) => setFormData({ ...formData, clienteId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condición de Venta</Label>
                <Select
                  value={formData.condicionVenta}
                  onValueChange={(v) => setFormData({ ...formData, condicionVenta: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTADO">Contado</SelectItem>
                    <SelectItem value="CUENTA_CORRIENTE">Cuenta Corriente</SelectItem>
                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Remito</Label>
                <Input
                  value={formData.remito}
                  onChange={(e) => setFormData({ ...formData, remito: e.target.value })}
                  placeholder="N° de remito (opcional)"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items / Detalle</Label>
                <Button type="button" variant="outline" size="sm" onClick={agregarItem}>
                  <Plus className="w-4 h-4 mr-1" /> Agregar Item
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead className="w-32">Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-20">Cant.</TableHead>
                      <TableHead className="w-20">Unidad</TableHead>
                      <TableHead className="w-28">P. Unit.</TableHead>
                      <TableHead className="w-28">Subtotal</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.detalles.map((det, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select
                            value={det.tipoProducto}
                            onValueChange={(v) => actualizarItem(idx, 'tipoProducto', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_PRODUCTO.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={det.descripcion}
                            onChange={(e) => actualizarItem(idx, 'descripcion', e.target.value)}
                            placeholder="Descripción del item"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={det.cantidad}
                            onChange={(e) => actualizarItem(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                            className="h-9 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={det.unidad}
                            onValueChange={(v) => actualizarItem(idx, 'unidad', v)}
                          >
                            <SelectTrigger className="h-9 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KG">KG</SelectItem>
                              <SelectItem value="UN">UN</SelectItem>
                              <SelectItem value="LT">LT</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={det.precioUnitario}
                            onChange={(e) => actualizarItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                            className="h-9 w-28"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(det.subtotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarItemForm(idx)}
                            disabled={formData.detalles.length <= 1}
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totales */}
            <div className="bg-stone-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calcularTotalesForm().subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (21%):</span>
                <span>{formatCurrency(calcularTotalesForm().iva)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calcularTotalesForm().total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => handleGuardar(false)}
              disabled={saving || !formData.clienteId}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Crear Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Facturar desde Remitos */}
      <Dialog open={despachosOpen} onOpenChange={setDespachosOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Facturar desde Remitos
            </DialogTitle>
            <DialogDescription>
              Seleccione los remitos pendientes y confirme los precios para generar la factura
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Paso 1: Seleccionar despachos */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">1</span>
                Seleccionar Remitos Pendientes
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>N° Despacho</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>KG Total</TableHead>
                      <TableHead>Medias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despachosPendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-stone-400">
                          No hay remitos pendientes de facturar
                        </TableCell>
                      </TableRow>
                    ) : (
                      despachosPendientes.map((despacho) => (
                        <TableRow 
                          key={despacho.id} 
                          className={`hover:bg-stone-50 cursor-pointer ${despachosSeleccionados.includes(despacho.id) ? 'bg-emerald-50' : ''}`}
                          onClick={() => handleSeleccionarDespacho(despacho.id)}
                        >
                          <TableCell>
                            <Checkbox 
                              checked={despachosSeleccionados.includes(despacho.id)}
                              onCheckedChange={() => {}}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{despacho.numero}</TableCell>
                          <TableCell>{new Date(despacho.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>{despacho.cliente?.nombre || '-'}</TableCell>
                          <TableCell>{despacho.destino}</TableCell>
                          <TableCell>{despacho.kgTotal.toFixed(2)} KG</TableCell>
                          <TableCell>{despacho.cantidadMedias}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Paso 2: Revisar items y precios */}
            {itemsFacturar.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">2</span>
                  Revisar Items y Precios
                  <Badge variant="outline" className="ml-2">{itemsFacturar.length} items</Badge>
                </h3>
                <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-stone-50 sticky top-0">
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead className="text-right">KG</TableHead>
                        <TableHead className="text-right">Precio Sugerido</TableHead>
                        <TableHead className="text-right">Precio a Facturar</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsFacturar.map((item, idx) => (
                        <TableRow key={idx} className={item.precioConfirmado ? 'bg-emerald-50/50' : ''}>
                          <TableCell>{item.productoVendible?.nombre || 'Media Res'}</TableCell>
                          <TableCell>{item.tropaCodigo || '-'}</TableCell>
                          <TableCell className="text-right">{item.peso.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-stone-500">{formatCurrency(item.precioSugerido)}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{item.fuentePrecio}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={item.precioUnitario || item.precioSugerido || 0}
                              onChange={(e) => actualizarPrecioItem(idx, parseFloat(e.target.value) || 0)}
                              className="w-28 h-8 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency((item.precioUnitario || item.precioSugerido || 0) * item.peso)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarItem(idx)}
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Paso 3: Agregar servicios adicionales */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">3</span>
                  Servicios Adicionales (Opcional)
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={agregarServicio}>
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
              {serviciosAdicionales.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-stone-50">
                      <TableRow>
                        <TableHead>Producto/Servicio</TableHead>
                        <TableHead className="w-32">Descripción</TableHead>
                        <TableHead className="w-20">Cant.</TableHead>
                        <TableHead className="w-28">P. Unit.</TableHead>
                        <TableHead className="w-28">Subtotal</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviciosAdicionales.map((serv, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Select
                              value={serv.productoVendibleId}
                              onValueChange={(v) => actualizarServicio(idx, 'productoVendibleId', v)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {productos
                                  .filter(p => p.categoria.includes('SERVICIO') || p.categoria === 'OTRO')
                                  .map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={serv.descripcion}
                              onChange={(e) => actualizarServicio(idx, 'descripcion', e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={serv.cantidad}
                              onChange={(e) => actualizarServicio(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={serv.precioUnitario}
                              onChange={(e) => actualizarServicio(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                              className="h-8 w-28"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(serv.subtotal)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarServicio(idx)}
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="bg-stone-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calcularTotalesRemitos().subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (21%):</span>
                <span>{formatCurrency(calcularTotalesRemitos().iva)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calcularTotalesRemitos().total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDespachosOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleGenerarFacturaDesdeRemitos}
              disabled={saving || itemsFacturar.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Generar Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Detalle */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Factura {facturaSeleccionada?.numero}</DialogTitle>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Cliente</Label>
                  <p className="font-semibold">{facturaSeleccionada.cliente?.nombre}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Fecha</Label>
                  <p>{new Date(facturaSeleccionada.fecha).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Condición</Label>
                  <p>{facturaSeleccionada.condicionVenta || '-'}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Estado</Label>
                  {getEstadoBadge(facturaSeleccionada.estado)}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">P. Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturaSeleccionada.detalles?.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {d.descripcion}
                          {d.tropaCodigo && <span className="text-xs text-stone-400 ml-2">({d.tropaCodigo})</span>}
                        </TableCell>
                        <TableCell className="text-right">{d.cantidad} {d.unidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.precioUnitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-stone-50 rounded-lg p-4 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(facturaSeleccionada.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>{formatCurrency(facturaSeleccionada.iva)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(facturaSeleccionada.total)}</span>
                </div>
              </div>

              {/* Pagos */}
              {facturaSeleccionada.pagos && facturaSeleccionada.pagos.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Pagos Realizados</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-stone-50">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Forma</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturaSeleccionada.pagos.map((p, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{new Date(p.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell>{p.formaPago}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatCurrency(p.monto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
            <Button onClick={() => handleImprimir(facturaSeleccionada!)}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pago */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Factura: {facturaSeleccionada?.numero} - Total: {formatCurrency(facturaSeleccionada?.total || 0)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  value={pagoData.monto}
                  onChange={(e) => setPagoData({ ...pagoData, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pago</Label>
                <Select value={pagoData.formaPago} onValueChange={(v) => setPagoData({ ...pagoData, formaPago: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGO.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input
                value={pagoData.referencia}
                onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })}
                placeholder="N° de cheque, transferencia, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={pagoData.observaciones}
                onChange={(e) => setPagoData({ ...pagoData, observaciones: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPagoOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarPago} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Anular */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Factura</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea anular la factura {facturaSeleccionada?.numero}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleAnular} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Anular Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
