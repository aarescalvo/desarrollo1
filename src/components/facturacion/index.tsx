'use client'

import { useState, useEffect } from 'react'
import {
  FileText, DollarSign, CheckCircle, XCircle, Eye,
  Plus, Search, Loader2, Printer, RefreshCw, Edit,
  Trash2, CreditCard, History, BarChart3, Package,
  ShoppingCart, TrendingUp, Calendar, Users, Settings,
  ChevronDown, ChevronUp, AlertCircle, Check, X, Tag,
  ArrowUpDown, Save, TrendingDown
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

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
  _count?: { items: number }
}

interface ProductoVendible {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria: string
  subcategoria?: string
  especie?: string
  tipoVenta: string
  unidadMedida: string
  precioBase?: number
  precioActual: number
  moneda: string
  alicuotaIva: number
  activo: boolean
  requiereTrazabilidad?: boolean
  _count?: { preciosCliente: number; preciosHistorico: number }
}

interface HistoricoPrecio {
  id: string
  productoVendibleId: string
  precioAnterior?: number
  precioNuevo: number
  fechaVigencia: string
  moneda: string
  motivo?: string
  observaciones?: string
  variacionPorcentaje?: string | null
}

interface PrecioCliente {
  id: string
  productoVendibleId: string
  clienteId: string
  precioEspecial: number
  moneda: string
  fechaDesde: string
  fechaHasta?: string
  activo: boolean
  productoVendible?: { id: string; nombre: string; codigo: string }
  cliente?: { id: string; nombre: string }
}

interface Props { operador: Operador }

const CATEGORIAS_PRODUCTO = [
  { value: 'PRODUCTO_CARNICO', label: 'Producto Cárnico' },
  { value: 'SERVICIO_FAENA', label: 'Servicio de Faena' },
  { value: 'MENUDENCIA', label: 'Menudencia' },
  { value: 'SUBPRODUCTO', label: 'Subproducto' },
  { value: 'OTRO', label: 'Otro' },
]

const TIPOS_VENTA = [
  { value: 'POR_KG', label: 'Por Kg' },
  { value: 'POR_UNIDAD', label: 'Por Unidad' },
  { value: 'SERVICIO', label: 'Servicio' },
]

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
  // ========== ESTADOS GENERALES ==========
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<ProductoVendible[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tabActivo, setTabActivo] = useState('facturas')
  
  // ========== ESTADOS DE FILTROS ==========
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [filtroClienteId, setFiltroClienteId] = useState<string>('_TODOS_')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // ========== ESTADOS DE DIÁLOGOS ==========
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [pagoOpen, setPagoOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [despachosOpen, setDespachosOpen] = useState(false)
  const [productoDialogOpen, setProductoDialogOpen] = useState(false)
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [precioClienteDialogOpen, setPrecioClienteDialogOpen] = useState(false)
  
  // ========== ESTADOS DE FACTURAS ==========
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  const [formData, setFormData] = useState({
    clienteId: '',
    condicionVenta: 'CONTADO',
    remito: '',
    observaciones: '',
    tipoIva: 21, // Porcentaje de IVA
    detalles: [] as DetalleFactura[]
  })
  
  // ========== ESTADOS DE DESPACHOS ==========
  const [despachosPendientes, setDespachosPendientes] = useState<Despacho[]>([])
  const [despachosSeleccionados, setDespachosSeleccionados] = useState<string[]>([])
  const [itemsFacturar, setItemsFacturar] = useState<any[]>([])
  const [serviciosAdicionales, setServiciosAdicionales] = useState<any[]>([])
  const [clienteDespacho, setClienteDespacho] = useState<Cliente | null>(null)
  
  // ========== ESTADOS DE PAGOS ==========
  const [pagoData, setPagoData] = useState({
    monto: 0,
    formaPago: 'EFECTIVO',
    referencia: '',
    observaciones: ''
  })
  
  // ========== ESTADOS DE PRODUCTOS ==========
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoVendible | null>(null)
  const [productoForm, setProductoForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'PRODUCTO_CARNICO',
    subcategoria: '',
    especie: '',
    tipoVenta: 'POR_KG',
    unidadMedida: 'KG',
    precioBase: 0,
    moneda: 'ARS',
    alicuotaIva: 21,
    requiereTrazabilidad: false
  })
  
  // ========== ESTADOS DE HISTÓRICO ==========
  const [historicoPrecios, setHistoricoPrecios] = useState<HistoricoPrecio[]>([])
  const [productoHistorico, setProductoHistorico] = useState<ProductoVendible | null>(null)
  const [nuevoPrecioForm, setNuevoPrecioForm] = useState({
    precioNuevo: 0,
    motivo: '',
    observaciones: ''
  })
  
  // ========== ESTADOS DE PRECIOS POR CLIENTE ==========
  const [preciosCliente, setPreciosCliente] = useState<PrecioCliente[]>([])
  const [precioClienteForm, setPrecioClienteForm] = useState({
    productoVendibleId: '',
    clienteId: '',
    precioEspecial: 0,
    moneda: 'ARS'
  })
  
  // ========== ESTADOS DE GRÁFICOS ==========
  const [datosGrafico, setDatosGrafico] = useState<any[]>([])
  const [tipoGrafico, setTipoGrafico] = useState<'semanal' | 'mensual' | 'porCliente'>('semanal')
  
  // ========== ESTADÍSTICAS ==========
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    pagadas: 0,
    montoTotal: 0,
    saldoPendiente: 0
  })

  // ========== EFECTOS ==========
  useEffect(() => {
    fetchFacturas()
    fetchClientes()
    fetchProductos()
  }, [])

  useEffect(() => {
    if (tabActivo === 'informes') {
      fetchDatosGrafico()
    }
  }, [tabActivo, tipoGrafico, filtroClienteId, filtroFechaDesde, filtroFechaHasta])

  useEffect(() => {
    if (tabActivo === 'preciosCliente') {
      fetchPreciosCliente()
    }
  }, [tabActivo])

  // ========== FUNCIONES DE FETCH ==========
  const fetchFacturas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado)
      if (filtroClienteId && filtroClienteId !== '_TODOS_') params.append('clienteId', filtroClienteId)
      if (filtroFechaDesde) params.append('desde', filtroFechaDesde)
      if (filtroFechaHasta) params.append('hasta', filtroFechaHasta)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/facturacion?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setFacturas(data.data)
        setStats(data.stats || stats)
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
      const res = await fetch('/api/productos-vendibles')
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
      if (filtroClienteId && filtroClienteId !== '_TODOS_') params.append('clienteId', filtroClienteId)
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

  const fetchHistoricoPrecios = async (productoId: string) => {
    try {
      const res = await fetch(`/api/historico-precios-producto?productoVendibleId=${productoId}`)
      const data = await res.json()
      if (data.success) {
        setHistoricoPrecios(data.data.historicoLista || [])
        setProductoHistorico(data.data.producto)
      }
    } catch {
      toast.error('Error al cargar histórico de precios')
    }
  }

  const fetchPreciosCliente = async () => {
    try {
      const res = await fetch('/api/precios-cliente')
      const data = await res.json()
      if (data.success) {
        setPreciosCliente(data.data || [])
      }
    } catch {
      console.error('Error cargando precios por cliente')
    }
  }

  // ========== FUNCIONES DE PRODUCTOS ==========
  const handleNuevoProducto = () => {
    setProductoSeleccionado(null)
    setProductoForm({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: 'PRODUCTO_CARNICO',
      subcategoria: '',
      especie: '',
      tipoVenta: 'POR_KG',
      unidadMedida: 'KG',
      precioBase: 0,
      moneda: 'ARS',
      alicuotaIva: 21,
      requiereTrazabilidad: false
    })
    setProductoDialogOpen(true)
  }

  const handleEditarProducto = (producto: ProductoVendible) => {
    setProductoSeleccionado(producto)
    setProductoForm({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria,
      subcategoria: producto.subcategoria || '',
      especie: producto.especie || '',
      tipoVenta: producto.tipoVenta,
      unidadMedida: producto.unidadMedida,
      precioBase: producto.precioBase || 0,
      moneda: producto.moneda,
      alicuotaIva: producto.alicuotaIva,
      requiereTrazabilidad: producto.requiereTrazabilidad || false
    })
    setProductoDialogOpen(true)
  }

  const handleGuardarProducto = async () => {
    if (!productoForm.codigo || !productoForm.nombre) {
      toast.error('Código y nombre son requeridos')
      return
    }

    setSaving(true)
    try {
      const url = productoSeleccionado 
        ? `/api/productos-vendibles/${productoSeleccionado.id}`
        : '/api/productos-vendibles'
      const method = productoSeleccionado ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoForm)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Producto guardado')
        setProductoDialogOpen(false)
        fetchProductos()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleVerHistorico = (producto: ProductoVendible) => {
    setProductoHistorico(producto)
    setNuevoPrecioForm({ precioNuevo: producto.precioActual || 0, motivo: '', observaciones: '' })
    fetchHistoricoPrecios(producto.id)
    setHistoricoDialogOpen(true)
  }

  const handleGuardarNuevoPrecio = async () => {
    if (!productoHistorico || nuevoPrecioForm.precioNuevo <= 0) {
      toast.error('Ingrese un precio válido')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/historico-precios-producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoVendibleId: productoHistorico.id,
          precioNuevo: nuevoPrecioForm.precioNuevo,
          motivo: nuevoPrecioForm.motivo,
          observaciones: nuevoPrecioForm.observaciones
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchHistoricoPrecios(productoHistorico.id)
        fetchProductos()
        setNuevoPrecioForm({ precioNuevo: 0, motivo: '', observaciones: '' })
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al guardar precio')
    } finally {
      setSaving(false)
    }
  }

  // ========== FUNCIONES DE PRECIOS POR CLIENTE ==========
  const handleNuevoPrecioCliente = () => {
    setPrecioClienteForm({
      productoVendibleId: '',
      clienteId: '',
      precioEspecial: 0,
      moneda: 'ARS'
    })
    setPrecioClienteDialogOpen(true)
  }

  const handleGuardarPrecioCliente = async () => {
    if (!precioClienteForm.productoVendibleId || !precioClienteForm.clienteId || precioClienteForm.precioEspecial <= 0) {
      toast.error('Complete todos los campos')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/precios-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(precioClienteForm)
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Precio por cliente guardado')
        setPrecioClienteDialogOpen(false)
        fetchPreciosCliente()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ========== FUNCIONES DE FACTURAS ==========
  const handleNuevaFactura = () => {
    setFormData({
      clienteId: '',
      condicionVenta: 'CONTADO',
      remito: '',
      observaciones: '',
      tipoIva: 21,
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

  const handleFacturarDesdeRemitos = async () => {
    await fetchDespachosPendientes()
    setDespachosSeleccionados([])
    setItemsFacturar([])
    setServiciosAdicionales([])
    setClienteDespacho(null)
    setDespachosOpen(true)
  }

  const handleSeleccionarDespacho = async (despachoId: string) => {
    const isSelected = despachosSeleccionados.includes(despachoId)
    
    if (isSelected) {
      setDespachosSeleccionados(prev => prev.filter(id => id !== despachoId))
      setItemsFacturar(prev => prev.filter(item => item.despachoId !== despachoId))
    } else {
      try {
        const res = await fetch(`/api/facturacion/desde-remitos?despachoId=${despachoId}`)
        const data = await res.json()
        if (data.success) {
          setDespachosSeleccionados(prev => [...prev, despachoId])
          setItemsFacturar(prev => [...prev, ...data.items])
          
          if (data.despacho.cliente && !clienteDespacho) {
            setClienteDespacho(data.despacho.cliente)
          }
        }
      } catch {
        toast.error('Error al cargar items del despacho')
      }
    }
  }

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

  const eliminarItem = (index: number) => {
    setItemsFacturar(prev => prev.filter((_, i) => i !== index))
  }

  const agregarServicio = () => {
    setServiciosAdicionales(prev => [...prev, {
      productoVendibleId: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0
    }])
  }

  const actualizarServicio = (index: number, field: string, value: any) => {
    setServiciosAdicionales(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [field]: value }
      
      if (field === 'cantidad' || field === 'precioUnitario') {
        nuevos[index].subtotal = nuevos[index].cantidad * nuevos[index].precioUnitario
      }
      
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

  const eliminarServicio = (index: number) => {
    setServiciosAdicionales(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerarFacturaDesdeRemitos = async () => {
    if (!clienteDespacho?.id) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    if (itemsFacturar.length === 0 && serviciosAdicionales.length === 0) {
      toast.error('Debe agregar items o servicios')
      return
    }

    const itemsSinPrecio = itemsFacturar.filter(item => !item.precioUnitario || item.precioUnitario === 0)
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

  const handleEditar = (factura: Factura) => {
    setFacturaSeleccionada(factura)
    // Calcular tipoIva desde los valores de la factura
    const tipoIvaCalculado = factura.subtotal > 0 
      ? Math.round((factura.iva / factura.subtotal) * 100) 
      : 21
    setFormData({
      clienteId: factura.clienteId,
      condicionVenta: factura.condicionVenta || 'CONTADO',
      remito: factura.remito || '',
      observaciones: factura.observaciones || '',
      tipoIva: tipoIvaCalculado,
      detalles: factura.detalles.length > 0 ? factura.detalles : [
        { tipoProducto: 'OTRO', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0, precioConfirmado: false, subtotal: 0 }
      ]
    })
    setEditOpen(true)
  }

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

  const handleGuardarFactura = async (esEdicion = false) => {
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
        if (facturaSeleccionada) handleVerDetalle(facturaSeleccionada)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

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

  // ========== FUNCIONES DE UI ==========
  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      detalles: [...prev.detalles, { tipoProducto: 'OTRO', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0, precioConfirmado: false, subtotal: 0 }]
    }))
  }

  const eliminarItemForm = (index: number) => {
    if (formData.detalles.length <= 1) return
    setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }))
  }

  const actualizarItem = (index: number, field: keyof DetalleFactura, value: string | number | boolean) => {
    setFormData(prev => {
      const nuevosDetalles = [...prev.detalles]
      nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value }
      
      if (field === 'cantidad' || field === 'precioUnitario') {
        nuevosDetalles[index].subtotal = nuevosDetalles[index].cantidad * nuevosDetalles[index].precioUnitario
      }
      
      return { ...prev, detalles: nuevosDetalles }
    })
  }

  const calcularTotalesForm = () => {
    const subtotal = formData.detalles.reduce((sum, d) => sum + d.subtotal, 0)
    const ivaRate = (formData.tipoIva || 21) / 100
    const iva = subtotal * ivaRate
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  const calcularTotalesRemitos = () => {
    const subtotalItems = itemsFacturar.reduce((sum, item) => sum + (item.precioUnitario || 0) * item.peso, 0)
    const subtotalServicios = serviciosAdicionales.reduce((sum, s) => sum + s.subtotal, 0)
    const subtotal = subtotalItems + subtotalServicios
    const iva = subtotal * 0.21
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  const facturasFiltradas = facturas.filter(f => {
    const matchEstado = filtroEstado === 'TODOS' || f.estado === filtroEstado
    const matchSearch = !searchTerm || 
      f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchEstado && matchSearch
  })

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

  const handleImprimir = (factura: Factura) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
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
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">FACTURA</div>
            <div>N° ${factura.numero}</div>
            <div>Fecha: ${new Date(factura.fecha).toLocaleDateString('es-AR')}</div>
          </div>
          <div class="row"><span class="label">Cliente:</span><span class="value">${factura.cliente?.nombre || 'N/A'}</span></div>
          ${factura.cliente?.cuit ? `<div class="row"><span class="label">CUIT:</span><span class="value">${factura.cliente.cuit}</span></div>` : ''}
          <table>
            <thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
            <tbody>
              ${(factura.detalles || []).map(d => `
                <tr><td>${d.descripcion}</td><td>${d.cantidad} ${d.unidad}</td><td>$${d.precioUnitario.toFixed(2)}</td><td>$${d.subtotal.toFixed(2)}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="row"><span class="label">Subtotal:</span><span class="value">$${(factura.subtotal || 0).toFixed(2)}</span></div>
          <div class="row"><span class="label">IVA (21%):</span><span class="value">$${(factura.iva || 0).toFixed(2)}</span></div>
          <div class="total">Total: $${(factura.total || 0).toFixed(2)}</div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

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
            <p className="text-stone-500 mt-1">Gestión completa de facturas, productos, precios y remitos</p>
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

        {/* Tabs Principales */}
        <Tabs value={tabActivo} onValueChange={setTabActivo}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="facturas" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Facturas
            </TabsTrigger>
            <TabsTrigger value="productos" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="preciosCliente" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Precios Cliente
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

          {/* TAB: FACTURAS */}
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
                      <SelectItem value="_TODOS_">Todos los clientes</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchFacturas} variant="outline">
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Facturas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold">Listado de Facturas</CardTitle>
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
                  <ScrollArea className="max-h-[500px]">
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
                                  <Button variant="ghost" size="icon" onClick={() => handleVerDetalle(factura)} title="Ver detalle">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {factura.estado !== 'ANULADA' && factura.estado !== 'PAGADA' && (
                                    <>
                                      <Button variant="ghost" size="icon" onClick={() => handleEditar(factura)} title="Editar">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => { setFacturaSeleccionada(factura); setPagoData({ ...pagoData, monto: saldo }); setPagoOpen(true) }} title="Registrar pago" className="text-emerald-600">
                                        <CreditCard className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button variant="ghost" size="icon" onClick={() => handleImprimir(factura)} title="Imprimir" disabled={factura.estado === 'ANULADA'}>
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                  {factura.estado !== 'ANULADA' && factura.estado !== 'PAGADA' && (
                                    <Button variant="ghost" size="icon" onClick={() => { setFacturaSeleccionada(factura); setDeleteOpen(true) }} title="Anular" className="text-red-500">
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
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: PRODUCTOS Y SERVICIOS */}
          <TabsContent value="productos" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Catálogo de Productos y Servicios
                </CardTitle>
                <Button onClick={handleNuevoProducto} className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : productos.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay productos registrados</p>
                    <Button onClick={handleNuevoProducto} className="mt-4 bg-amber-500 hover:bg-amber-600">
                      Agregar primer producto
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Código</TableHead>
                          <TableHead className="font-semibold">Nombre</TableHead>
                          <TableHead className="font-semibold">Categoría</TableHead>
                          <TableHead className="font-semibold">Tipo</TableHead>
                          <TableHead className="font-semibold">Precio Actual</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productos.map((producto) => (
                          <TableRow key={producto.id} className="hover:bg-stone-50">
                            <TableCell className="font-mono">{producto.codigo}</TableCell>
                            <TableCell className="font-medium">{producto.nombre}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{CATEGORIAS_PRODUCTO.find(c => c.value === producto.categoria)?.label || producto.categoria}</Badge>
                            </TableCell>
                            <TableCell>{TIPOS_VENTA.find(t => t.value === producto.tipoVenta)?.label || producto.tipoVenta}</TableCell>
                            <TableCell className="font-medium text-emerald-600">{formatCurrency(producto.precioActual || 0)}</TableCell>
                            <TableCell>
                              {producto.activo ? (
                                <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
                              ) : (
                                <Badge className="bg-stone-100 text-stone-500">Inactivo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleVerHistorico(producto)} title="Ver histórico de precios">
                                  <History className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditarProducto(producto)} title="Editar">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: PRECIOS POR CLIENTE */}
          <TabsContent value="preciosCliente" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  Precios Especiales por Cliente
                </CardTitle>
                <Button onClick={handleNuevoPrecioCliente} className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Precio
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {preciosCliente.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay precios especiales configurados</p>
                    <Button onClick={handleNuevoPrecioCliente} className="mt-4 bg-amber-500 hover:bg-amber-600">
                      Configurar primer precio
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Cliente</TableHead>
                          <TableHead className="font-semibold">Producto</TableHead>
                          <TableHead className="font-semibold">Precio Especial</TableHead>
                          <TableHead className="font-semibold">Vigencia</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preciosCliente.map((precio) => (
                          <TableRow key={precio.id} className="hover:bg-stone-50">
                            <TableCell className="font-medium">{precio.cliente?.nombre || 'N/A'}</TableCell>
                            <TableCell>{precio.productoVendible?.nombre || 'N/A'}</TableCell>
                            <TableCell className="font-medium text-emerald-600">{formatCurrency(precio.precioEspecial)}</TableCell>
                            <TableCell>
                              {new Date(precio.fechaDesde).toLocaleDateString('es-AR')}
                              {precio.fechaHasta && ` - ${new Date(precio.fechaHasta).toLocaleDateString('es-AR')}`}
                            </TableCell>
                            <TableCell>
                              {precio.activo ? (
                                <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
                              ) : (
                                <Badge className="bg-stone-100 text-stone-500">Inactivo</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: POR CLIENTE */}
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
                      <SelectItem value="_TODOS_">Todos los clientes</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {filtroClienteId !== '_TODOS_' ? (
                  <div className="space-y-3">
                    {facturasFiltradas.filter(f => f.clienteId === filtroClienteId).length === 0 ? (
                      <div className="py-8 text-center text-stone-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>El cliente no tiene facturas</p>
                      </div>
                    ) : (
                      facturasFiltradas
                        .filter(f => f.clienteId === filtroClienteId)
                        .map(factura => {
                          const totalPagado = factura.pagos?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
                          const saldo = (factura.total || 0) - totalPagado
                          
                          return (
                            <Card key={factura.id} className="border border-stone-200">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-mono font-semibold">{factura.numero}</p>
                                    <p className="text-sm text-stone-500">{new Date(factura.fecha).toLocaleDateString('es-AR')}</p>
                                  </div>
                                  {getEstadoBadge(factura.estado)}
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-stone-400">Total</p>
                                    <p className="font-semibold">{formatCurrency(factura.total)}</p>
                                  </div>
                                  <div>
                                    <p className="text-stone-400">Pagado</p>
                                    <p className="font-semibold text-emerald-600">{formatCurrency(totalPagado)}</p>
                                  </div>
                                  <div>
                                    <p className="text-stone-400">Saldo</p>
                                    <p className={`font-semibold ${saldo > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(saldo)}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
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

          {/* TAB: INFORMES Y GRÁFICOS */}
          <TabsContent value="informes" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Gráficos de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Controles del gráfico */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <Select value={tipoGrafico} onValueChange={(v) => setTipoGrafico(v as any)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="porCliente">Por Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} className="w-44" placeholder="Desde" />
                  <Input type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} className="w-44" placeholder="Hasta" />
                  <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_TODOS_">Todos los clientes</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gráfico */}
                {datosGrafico.length > 0 ? (
                  <ChartContainer 
                    config={{
                      total: { label: "Total", color: "#FF6B35" }
                    }} 
                    className="h-80"
                  >
                    {tipoGrafico === 'porCliente' ? (
                      <BarChart data={datosGrafico.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="clienteNombre" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total" fill="#FF6B35" name="Total Facturado" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <AreaChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="total" stroke="#FF6B35" fillOpacity={1} fill="url(#colorTotal)" name="Total Facturado" />
                      </AreaChart>
                    )}
                  </ChartContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-stone-400">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay datos para mostrar</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ========== DIÁLOGOS ========== */}

        {/* Diálogo Nueva/Editar Factura */}
        <Dialog open={dialogOpen || editOpen} onOpenChange={(v) => { setDialogOpen(v); setEditOpen(v) }}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editOpen ? 'Editar Factura' : 'Nueva Factura'}</DialogTitle>
              <DialogDescription>Complete los datos de la factura</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={formData.clienteId} onValueChange={(v) => setFormData(prev => ({ ...prev, clienteId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condición de Venta</Label>
                  <Select value={formData.condicionVenta} onValueChange={(v) => setFormData(prev => ({ ...prev, condicionVenta: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTADO">Contado</SelectItem>
                      <SelectItem value="CUENTA_CORRIENTE">Cuenta Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de IVA</Label>
                  <Select value={String(formData.tipoIva || 21)} onValueChange={(v) => setFormData(prev => ({ ...prev, tipoIva: parseFloat(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="21">IVA 21%</SelectItem>
                      <SelectItem value="10.5">IVA 10.5%</SelectItem>
                      <SelectItem value="0">Sin IVA (0%)</SelectItem>
                      <SelectItem value="27">IVA 27%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Remito</Label>
                <Input value={formData.remito} onChange={(e) => setFormData(prev => ({ ...prev, remito: e.target.value }))} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Items</Label>
                  <Button onClick={agregarItem} size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Agregar Item</Button>
                </div>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {formData.detalles.map((detalle, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 bg-stone-50 rounded">
                        <div className="col-span-3">
                          <Label className="text-xs">Descripción</Label>
                          <Input value={detalle.descripcion} onChange={(e) => actualizarItem(idx, 'descripcion', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Cantidad</Label>
                          <Input type="number" value={detalle.cantidad} onChange={(e) => actualizarItem(idx, 'cantidad', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Unidad</Label>
                          <Input value={detalle.unidad} onChange={(e) => actualizarItem(idx, 'unidad', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Precio Unit.</Label>
                          <Input type="number" value={detalle.precioUnitario} onChange={(e) => actualizarItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Subtotal</Label>
                          <p className="font-medium">{formatCurrency(detalle.subtotal)}</p>
                        </div>
                        <div className="col-span-2">
                          {formData.detalles.length > 1 && (
                            <Button onClick={() => eliminarItemForm(idx)} size="sm" variant="ghost" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <Label>Observaciones</Label>
                <Textarea value={formData.observaciones} onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))} />
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(calcularTotalesForm().subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA ({formData.tipoIva || 21}%):</span><span>{formatCurrency(calcularTotalesForm().iva)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCurrency(calcularTotalesForm().total)}</span></div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); setEditOpen(false) }}>Cancelar</Button>
              <Button onClick={() => handleGuardarFactura(editOpen)} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Facturar desde Remitos */}
        <Dialog open={despachosOpen} onOpenChange={setDespachosOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Facturar desde Remitos</DialogTitle>
              <DialogDescription>Seleccione los remitos a facturar y confirme los precios</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Selector de Cliente */}
              <div>
                <Label>Cliente</Label>
                <Select value={clienteDespacho?.id || ''} onValueChange={(v) => {
                  const cliente = clientes.find(c => c.id === v)
                  setClienteDespacho(cliente || null)
                }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {/* Despachos pendientes */}
              <div>
                <Label>Remitos Pendientes</Label>
                <ScrollArea className="max-h-40 border rounded">
                  {despachosPendientes.length === 0 ? (
                    <div className="p-4 text-center text-stone-400">No hay remitos pendientes</div>
                  ) : (
                    <div className="divide-y">
                      {despachosPendientes.map((despacho) => (
                        <div key={despacho.id} className="flex items-center gap-3 p-2 hover:bg-stone-50">
                          <Checkbox checked={despachosSeleccionados.includes(despacho.id)} onCheckedChange={() => handleSeleccionarDespacho(despacho.id)} />
                          <div className="flex-1">
                            <p className="font-medium">Remito #{despacho.numero}</p>
                            <p className="text-sm text-stone-500">{despacho.kgTotal} kg - {despacho.cantidadMedias} medias</p>
                          </div>
                          <Badge variant="outline">{new Date(despacho.fecha).toLocaleDateString('es-AR')}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Items a facturar */}
              {itemsFacturar.length > 0 && (
                <div>
                  <Label>Items a Facturar (confirme precios)</Label>
                  <ScrollArea className="max-h-60 border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Peso (kg)</TableHead>
                          <TableHead>Precio Sugerido</TableHead>
                          <TableHead>Precio a Facturar</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsFacturar.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.productoVendible?.nombre || 'Media Res'}</TableCell>
                            <TableCell>{item.peso}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{formatCurrency(item.precioSugerido)}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={item.precioUnitario || ''} 
                                onChange={(e) => actualizarPrecioItem(idx, parseFloat(e.target.value) || 0)}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency((item.precioUnitario || 0) * item.peso)}</TableCell>
                            <TableCell>
                              <Button onClick={() => eliminarItem(idx)} size="sm" variant="ghost" className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Servicios adicionales */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Servicios Adicionales</Label>
                  <Button onClick={agregarServicio} size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Agregar Servicio</Button>
                </div>
                {serviciosAdicionales.length > 0 && (
                  <div className="space-y-2">
                    {serviciosAdicionales.map((servicio, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-end p-2 bg-stone-50 rounded">
                        <div className="col-span-2">
                          <Select value={servicio.productoVendibleId} onValueChange={(v) => actualizarServicio(idx, 'productoVendibleId', v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                            <SelectContent>
                              {productos.filter(p => p.categoria === 'SERVICIO_FAENA' || p.tipoVenta === 'SERVICIO').map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Cantidad</Label>
                          <Input type="number" value={servicio.cantidad} onChange={(e) => actualizarServicio(idx, 'cantidad', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div>
                          <Label className="text-xs">Precio</Label>
                          <Input type="number" value={servicio.precioUnitario} onChange={(e) => actualizarServicio(idx, 'precioUnitario', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(servicio.subtotal)}</span>
                          <Button onClick={() => eliminarServicio(idx)} size="sm" variant="ghost" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(calcularTotalesRemitos().subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA (21%):</span><span>{formatCurrency(calcularTotalesRemitos().iva)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCurrency(calcularTotalesRemitos().total)}</span></div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDespachosOpen(false)}>Cancelar</Button>
              <Button onClick={handleGenerarFacturaDesdeRemitos} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generar Factura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Ver Detalle */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle de Factura {facturaSeleccionada?.numero}</DialogTitle>
            </DialogHeader>
            
            {facturaSeleccionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-stone-400">Cliente</Label><p className="font-medium">{facturaSeleccionada.cliente?.nombre}</p></div>
                  <div><Label className="text-stone-400">Fecha</Label><p>{new Date(facturaSeleccionada.fecha).toLocaleDateString('es-AR')}</p></div>
                  <div><Label className="text-stone-400">Estado</Label>{getEstadoBadge(facturaSeleccionada.estado)}</div>
                  <div><Label className="text-stone-400">Condición</Label><p>{facturaSeleccionada.condicionVenta || 'Contado'}</p></div>
                </div>

                <div>
                  <Label className="text-stone-400">Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>P. Unit.</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturaSeleccionada.detalles?.map((d, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{d.descripcion}</TableCell>
                          <TableCell>{d.cantidad} {d.unidad}</TableCell>
                          <TableCell>{formatCurrency(d.precioUnitario)}</TableCell>
                          <TableCell>{formatCurrency(d.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(facturaSeleccionada.subtotal)}</span></div>
                  <div className="flex justify-between"><span>IVA (21%):</span><span>{formatCurrency(facturaSeleccionada.iva)}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCurrency(facturaSeleccionada.total)}</span></div>
                </div>

                {facturaSeleccionada.pagos && facturaSeleccionada.pagos.length > 0 && (
                  <div>
                    <Label className="text-stone-400">Pagos Realizados</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Forma</TableHead>
                          <TableHead>Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturaSeleccionada.pagos.map((pago, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{new Date(pago.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell>{pago.formaPago}</TableCell>
                            <TableCell className="text-emerald-600">{formatCurrency(pago.monto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setViewOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Registrar Pago */}
        <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
              <DialogDescription>Factura: {facturaSeleccionada?.numero}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Saldo Pendiente</Label>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(facturaSeleccionada ? (facturaSeleccionada.total - (facturaSeleccionada.pagos?.reduce((s, p) => s + p.monto, 0) || 0)) : 0)}</p>
              </div>
              <div>
                <Label>Monto a Pagar</Label>
                <Input type="number" value={pagoData.monto} onChange={(e) => setPagoData(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Forma de Pago</Label>
                <Select value={pagoData.formaPago} onValueChange={(v) => setPagoData(prev => ({ ...prev, formaPago: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGO.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Referencia</Label>
                <Input value={pagoData.referencia} onChange={(e) => setPagoData(prev => ({ ...prev, referencia: e.target.value }))} placeholder="N° de transferencia, cheque, etc." />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPagoOpen(false)}>Cancelar</Button>
              <Button onClick={handleRegistrarPago} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Confirmar Anulación */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anular Factura</DialogTitle>
              <DialogDescription>¿Está seguro que desea anular la factura {facturaSeleccionada?.numero}?</DialogDescription>
            </DialogHeader>
            <div className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Esta acción no se puede deshacer
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAnular} disabled={saving} variant="destructive">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Anular Factura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Producto */}
        <Dialog open={productoDialogOpen} onOpenChange={setProductoDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{productoSeleccionado ? 'Editar Producto' : 'Nuevo Producto/Servicio'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input value={productoForm.codigo} onChange={(e) => setProductoForm(prev => ({ ...prev, codigo: e.target.value }))} />
              </div>
              <div>
                <Label>Nombre *</Label>
                <Input value={productoForm.nombre} onChange={(e) => setProductoForm(prev => ({ ...prev, nombre: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Descripción</Label>
                <Textarea value={productoForm.descripcion} onChange={(e) => setProductoForm(prev => ({ ...prev, descripcion: e.target.value }))} />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={productoForm.categoria} onValueChange={(v) => setProductoForm(prev => ({ ...prev, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PRODUCTO.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Venta</Label>
                <Select value={productoForm.tipoVenta} onValueChange={(v) => setProductoForm(prev => ({ ...prev, tipoVenta: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_VENTA.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidad de Medida</Label>
                <Input value={productoForm.unidadMedida} onChange={(e) => setProductoForm(prev => ({ ...prev, unidadMedida: e.target.value }))} />
              </div>
              <div>
                <Label>Precio Base</Label>
                <Input type="number" value={productoForm.precioBase} onChange={(e) => setProductoForm(prev => ({ ...prev, precioBase: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Alícuota IVA (%)</Label>
                <Input type="number" value={productoForm.alicuotaIva} onChange={(e) => setProductoForm(prev => ({ ...prev, alicuotaIva: parseFloat(e.target.value) || 21 }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Checkbox checked={productoForm.requiereTrazabilidad} onCheckedChange={(v) => setProductoForm(prev => ({ ...prev, requiereTrazabilidad: !!v }))} />
                <Label>Requiere trazabilidad</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setProductoDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleGuardarProducto} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Histórico de Precios */}
        <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Precios: {productoHistorico?.nombre}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Registrar nuevo precio */}
              <Card className="border border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Actualizar Precio</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Precio Actual</Label>
                    <p className="text-2xl font-bold">{formatCurrency(productoHistorico?.precioActual || 0)}</p>
                  </div>
                  <div>
                    <Label>Nuevo Precio</Label>
                    <Input type="number" value={nuevoPrecioForm.precioNuevo} onChange={(e) => setNuevoPrecioForm(prev => ({ ...prev, precioNuevo: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label>Motivo</Label>
                    <Input value={nuevoPrecioForm.motivo} onChange={(e) => setNuevoPrecioForm(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Actualización, inflación, etc." />
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Button onClick={handleGuardarNuevoPrecio} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Nuevo Precio
                  </Button>
                </CardContent>
              </Card>

              {/* Tabla histórico */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Precio Anterior</TableHead>
                    <TableHead>Precio Nuevo</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoPrecios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-stone-400">Sin histórico de precios</TableCell>
                    </TableRow>
                  ) : (
                    historicoPrecios.map((h, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(h.fechaVigencia).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{h.precioAnterior ? formatCurrency(h.precioAnterior) : '-'}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(h.precioNuevo)}</TableCell>
                        <TableCell>
                          {h.variacionPorcentaje && (
                            <Badge className={parseFloat(h.variacionPorcentaje) >= 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                              {parseFloat(h.variacionPorcentaje) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                              {h.variacionPorcentaje}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-stone-500">{h.motivo || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setHistoricoDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Precio por Cliente */}
        <Dialog open={precioClienteDialogOpen} onOpenChange={setPrecioClienteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Precio Especial por Cliente</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Select value={precioClienteForm.clienteId} onValueChange={(v) => setPrecioClienteForm(prev => ({ ...prev, clienteId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Producto</Label>
                <Select value={precioClienteForm.productoVendibleId} onValueChange={(v) => setPrecioClienteForm(prev => ({ ...prev, productoVendibleId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                  <SelectContent>
                    {productos.map((p) => (<SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Precio Especial</Label>
                <Input type="number" value={precioClienteForm.precioEspecial} onChange={(e) => setPrecioClienteForm(prev => ({ ...prev, precioEspecial: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPrecioClienteDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleGuardarPrecioCliente} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
