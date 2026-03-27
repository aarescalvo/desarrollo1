'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, DollarSign, CheckCircle, XCircle, Eye,
  Plus, Search, Loader2, Printer, RefreshCw, Edit,
  Trash2, ChevronDown, ChevronUp, CreditCard, History
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
import { toast } from 'sonner'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador { id: string; nombre: string; rol: string }

interface DetalleFactura {
  id?: string
  tipoProducto: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  subtotal: number
  tropaCodigo?: string
  garron?: number
  pesoKg?: number
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

export function FacturacionModule({ operador }: Props) {
  const { getTexto } = useEditor()
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [pagoOpen, setPagoOpen] = useState(false)
  const [historicoOpen, setHistoricoOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  
  // Factura seleccionada
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Formulario nueva/editar factura
  const [formData, setFormData] = useState({
    clienteId: '',
    condicionVenta: 'CONTADO',
    remito: '',
    observaciones: '',
    detalles: [] as DetalleFactura[]
  })
  
  // Formulario pago
  const [pagoData, setPagoData] = useState({
    monto: 0,
    formaPago: 'EFECTIVO',
    referencia: '',
    observaciones: ''
  })
  
  // Historico de precios
  const [historicoPrecios, setHistoricoPrecios] = useState<{producto: string; precio: number; fecha: string}[]>([])
  
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
  }, [])

  const fetchFacturas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/facturacion')
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

  const fetchHistoricoPrecios = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/historico-precios?clienteId=${clienteId}`)
      const data = await res.json()
      if (data.success) {
        setHistoricoPrecios(data.data)
      }
    } catch {
      console.error('Error cargando historico')
    }
  }

  // Nueva factura
  const handleNuevaFactura = () => {
    setFormData({
      clienteId: '',
      condicionVenta: 'CONTADO',
      remito: '',
      observaciones: '',
      detalles: [{ tipoProducto: 'OTRO', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0, subtotal: 0 }]
    })
    setDialogOpen(true)
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
        { tipoProducto: 'OTRO', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0, subtotal: 0 }
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

  // Agregar item
  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      detalles: [...prev.detalles, { tipoProducto: 'OTRO', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0, subtotal: 0 }]
    }))
  }

  // Eliminar item
  const eliminarItem = (index: number) => {
    if (formData.detalles.length <= 1) return
    setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }))
  }

  // Actualizar item
  const actualizarItem = (index: number, field: keyof DetalleFactura, value: string | number) => {
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

  // Buscar precio historico
  const buscarPrecioHistorico = (descripcion: string) => {
    if (!formData.clienteId || !descripcion) return
    const historico = historicoPrecios.find(h => 
      h.producto.toLowerCase().includes(descripcion.toLowerCase())
    )
    if (historico) {
      const index = formData.detalles.findIndex(d => d.descripcion === descripcion)
      if (index >= 0) {
        actualizarItem(index, 'precioUnitario', historico.precio)
        toast.info(`Precio anterior: $${historico.precio.toFixed(2)}`)
      }
    }
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
        // Actualizar factura seleccionada
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
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <FileText className="w-8 h-8 text-amber-500" />
                <TextoEditable id="titulo-facturacion" original="Facturación" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="subtitulo-facturacion" original="Gestión completa de facturas y pagos" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchFacturas} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={handleNuevaFactura} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </div>
          </div>
        </EditableBlock>

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
                  onValueChange={(v) => { setFormData({ ...formData, clienteId: v }); fetchHistoricoPrecios(v) }}
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
                            onBlur={() => buscarPrecioHistorico(det.descripcion)}
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
                            onClick={() => eliminarItem(idx)}
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

      {/* Dialog Editar Factura */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-600" />
              Editar Factura {facturaSeleccionada?.numero}
            </DialogTitle>
          </DialogHeader>
          
          {/* Mismo contenido que nueva factura */}
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(v) => { setFormData({ ...formData, clienteId: v }); fetchHistoricoPrecios(v) }}
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
            
            {/* Items - igual que nueva factura */}
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
                            onClick={() => eliminarItem(idx)}
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
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => handleGuardar(true)}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit className="w-4 h-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Detalle */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-600" />
              Factura {facturaSeleccionada?.numero}
            </DialogTitle>
            <DialogDescription>
              {facturaSeleccionada?.cliente?.nombre} - {getEstadoBadge(facturaSeleccionada?.estado || 'PENDIENTE')}
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-stone-500">Fecha</p>
                  <p className="font-medium">{new Date(facturaSeleccionada.fecha).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Condición</p>
                  <p className="font-medium">{facturaSeleccionada.condicionVenta || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Remito</p>
                  <p className="font-medium">{facturaSeleccionada.remito || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">CUIT Cliente</p>
                  <p className="font-medium">{facturaSeleccionada.cliente?.cuit || 'N/A'}</p>
                </div>
              </div>

              {/* Detalles */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cant.</TableHead>
                      <TableHead>P. Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturaSeleccionada.detalles?.map((det, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{TIPOS_PRODUCTO.find(t => t.value === det.tipoProducto)?.label || det.tipoProducto}</TableCell>
                        <TableCell>{det.descripcion}</TableCell>
                        <TableCell>{det.cantidad} {det.unidad}</TableCell>
                        <TableCell>{formatCurrency(det.precioUnitario)}</TableCell>
                        <TableCell>{formatCurrency(det.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totales */}
              <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(facturaSeleccionada.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (21%):</span>
                  <span>{formatCurrency(facturaSeleccionada.iva)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(facturaSeleccionada.total)}</span>
                </div>
              </div>

              {/* Pagos */}
              {facturaSeleccionada.pagos && facturaSeleccionada.pagos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Pagos Registrados</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-emerald-50">
                          <TableHead>Fecha</TableHead>
                          <TableHead>Forma de Pago</TableHead>
                          <TableHead>Referencia</TableHead>
                          <TableHead>Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturaSeleccionada.pagos.map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell>{new Date(pago.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell>{FORMAS_PAGO.find(f => f.value === pago.formaPago)?.label || pago.formaPago}</TableCell>
                            <TableCell>{pago.referencia || '-'}</TableCell>
                            <TableCell className="text-emerald-600 font-medium">{formatCurrency(pago.monto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="bg-emerald-50 rounded-lg p-3 flex justify-between">
                    <span className="font-medium">Total Pagado:</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(facturaSeleccionada.pagos.reduce((sum, p) => sum + (p.monto || 0), 0))}
                    </span>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-3 flex justify-between">
                    <span className="font-medium">Saldo Pendiente:</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(facturaSeleccionada.saldoPendiente || 0)}
                    </span>
                  </div>
                </div>
              )}

              {facturaSeleccionada.observaciones && (
                <div className="space-y-1">
                  <p className="text-xs text-stone-500">Observaciones</p>
                  <p className="text-sm bg-stone-50 p-2 rounded">{facturaSeleccionada.observaciones}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
            {facturaSeleccionada && facturaSeleccionada.estado !== 'PAGADA' && facturaSeleccionada.estado !== 'ANULADA' && (
              <Button
                onClick={() => { setViewOpen(false); setPagoData({ ...pagoData, monto: facturaSeleccionada.saldoPendiente || 0 }); setPagoOpen(true) }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pago */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Registrar Pago
            </DialogTitle>
            <DialogDescription>
              Factura: {facturaSeleccionada?.numero}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-stone-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Total Factura:</span>
                <span className="font-medium">{formatCurrency(facturaSeleccionada?.total || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Pagado:</span>
                <span className="text-emerald-600">{formatCurrency(facturaSeleccionada?.pagos?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Saldo Pendiente:</span>
                <span className="text-amber-600">{formatCurrency(facturaSeleccionada?.saldoPendiente || 0)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monto a Pagar *</Label>
              <Input
                type="number"
                value={pagoData.monto}
                onChange={(e) => setPagoData({ ...pagoData, monto: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              <Select
                value={pagoData.formaPago}
                onValueChange={(v) => setPagoData({ ...pagoData, formaPago: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGO.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pagoData.formaPago === 'TRANSFERENCIA' && (
              <div className="space-y-2">
                <Label>N° de Referencia</Label>
                <Input
                  value={pagoData.referencia}
                  onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })}
                  placeholder="N° de comprobante"
                />
              </div>
            )}

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
            <Button
              onClick={handleRegistrarPago}
              disabled={saving || pagoData.monto <= 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Anular */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Anular Factura
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            ¿Está seguro que desea anular la factura <strong>{facturaSeleccionada?.numero}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAnular}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Anulando...' : 'Anular Factura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FacturacionModule
