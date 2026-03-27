'use client'

import { useState, useEffect } from 'react'
import { 
  Package, Save, X, Loader2, Plus, Edit, Trash2, Search,
  DollarSign, FileText, Globe, Tag, Thermometer, Truck, Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

const CATEGORIAS = [
  { value: 'PRODUCTO_CARNICO', label: 'Producto Cárnico' },
  { value: 'MENUDENCIA', label: 'Menudencia' },
  { value: 'SERVICIO_FAENA', label: 'Servicio de Faena' },
  { value: 'SERVICIO_ALMACENAMIENTO', label: 'Servicio Almacenamiento' },
  { value: 'SERVICIO_PROCESO', label: 'Servicio de Proceso' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'SUBPRODUCTO', label: 'Subproducto' },
  { value: 'OTRO', label: 'Otro' },
]

const TIPOS_VENTA = [
  { value: 'POR_KG', label: 'Por Kg' },
  { value: 'POR_UNIDAD', label: 'Por Unidad' },
  { value: 'POR_ANIMAL', label: 'Por Animal' },
  { value: 'POR_HORA', label: 'Por Hora' },
  { value: 'FIJO', label: 'Precio Fijo' },
]

const UNIDADES = [
  { value: 'KG', label: 'Kilogramos' },
  { value: 'UN', label: 'Unidades' },
  { value: 'ANIMAL', label: 'Animal' },
]

const IDIOMAS = [
  { value: 'ES', label: 'Español' },
  { value: 'EN', label: 'Inglés' },
  { value: 'PT', label: 'Portugués' },
  { value: 'ES_EN', label: 'Español / Inglés' },
  { value: 'ES_EN_PT', label: 'Español / Inglés / Portugués' },
]

const TIPOS_CONSUMO = [
  { value: 'DIRECTO', label: 'Consumo Directo' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'EXPORTACION', label: 'Exportación' },
]

const ESPECIES = [
  { value: 'BOVINO', label: 'Bovino' },
  { value: 'EQUINO', label: 'Equino' },
  { value: 'OVINO', label: 'Ovino' },
  { value: 'PORCINO', label: 'Porcino' },
]

const TIPOS_CARNES = [
  { value: 'NOVILLO', label: 'Novillo' },
  { value: 'VAQUILLONA', label: 'Vaquillona' },
  { value: 'VACA', label: 'Vaca' },
  { value: 'TORO', label: 'Toro' },
  { value: 'TERNERO', label: 'Ternero' },
]

interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  tara?: number
  vencimientoDias?: number
  numeroRegistroSenasa?: string
  unidadMedida: string
  cantidadEtiquetas: number
  tieneTipificacion: boolean
  tipificacion?: string
  categoria: string
  subcategoria?: string
  especie?: string
  tipo?: string
  delCuarto?: string
  tipoVenta: string
  descripcionCircular?: string
  precioBase?: number
  precioDolar?: number
  precioEuro?: number
  precioArs?: number
  moneda: string
  alicuotaIva: number
  producidoParaCliente?: string
  productoGeneral: boolean
  productoReporteRinde: boolean
  tipoTrabajo?: string
  idiomaEtiqueta?: string
  formatoEtiqueta?: string
  textoEtiqueta?: string
  textoEspanol?: string
  textoIngles?: string
  textoTercerIdioma?: string
  temperaturaTransporte?: string
  tipoConsumo?: string
  empresa?: string
  tipoTrabajoId?: string
  tipoCarne?: string
  activo: boolean
  requiereTrazabilidad: boolean
  precioActual?: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface FormData {
  codigo: string
  nombre: string
  descripcion: string
  tara: number
  vencimientoDias: number
  numeroRegistroSenasa: string
  unidadMedida: string
  cantidadEtiquetas: number
  tieneTipificacion: boolean
  tipificacion: string
  categoria: string
  subcategoria: string
  especie: string
  tipo: string
  delCuarto: string
  tipoVenta: string
  descripcionCircular: string
  precioBase: number
  precioDolar: number
  precioEuro: number
  precioArs: number
  moneda: string
  alicuotaIva: number
  producidoParaCliente: string
  productoGeneral: boolean
  productoReporteRinde: boolean
  tipoTrabajo: string
  idiomaEtiqueta: string
  formatoEtiqueta: string
  textoEtiqueta: string
  textoEspanol: string
  textoIngles: string
  textoTercerIdioma: string
  temperaturaTransporte: string
  tipoConsumo: string
  empresa: string
  tipoTrabajoId: string
  tipoCarne: string
  activo: boolean
  requiereTrazabilidad: boolean
}

const initialFormData: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tara: 0,
  vencimientoDias: 0,
  numeroRegistroSenasa: '',
  unidadMedida: 'KG',
  cantidadEtiquetas: 1,
  tieneTipificacion: false,
  tipificacion: '',
  categoria: 'PRODUCTO_CARNICO',
  subcategoria: '',
  especie: 'BOVINO',
  tipo: '',
  delCuarto: '',
  tipoVenta: 'POR_KG',
  descripcionCircular: '',
  precioBase: 0,
  precioDolar: 0,
  precioEuro: 0,
  precioArs: 0,
  moneda: 'ARS',
  alicuotaIva: 21,
  producidoParaCliente: '',
  productoGeneral: false,
  productoReporteRinde: false,
  tipoTrabajo: '',
  idiomaEtiqueta: 'ES',
  formatoEtiqueta: '',
  textoEtiqueta: '',
  textoEspanol: '',
  textoIngles: '',
  textoTercerIdioma: '',
  temperaturaTransporte: '',
  tipoConsumo: 'DIRECTO',
  empresa: '',
  tipoTrabajoId: '',
  tipoCarne: '',
  activo: true,
  requiereTrazabilidad: false,
}

export function ConfigProductosModule({ operador }: { operador: Operador }) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  
  const [busqueda, setBusqueda] = useState('')
  const [formData, setFormData] = useState<FormData>(initialFormData)

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/productos-vendibles')
      const data = await res.json()
      if (data.success) {
        setProductos(data.data)
      }
    } catch (error) {
      console.error('Error fetching productos:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
    setProductoEditando(null)
    setFormData(initialFormData)
    setDialogOpen(true)
  }

  const handleEditar = (producto: Producto) => {
    setProductoEditando(producto)
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      tara: producto.tara || 0,
      vencimientoDias: producto.vencimientoDias || 0,
      numeroRegistroSenasa: producto.numeroRegistroSenasa || '',
      unidadMedida: producto.unidadMedida || 'KG',
      cantidadEtiquetas: producto.cantidadEtiquetas || 1,
      tieneTipificacion: producto.tieneTipificacion || false,
      tipificacion: producto.tipificacion || '',
      categoria: producto.categoria || 'PRODUCTO_CARNICO',
      subcategoria: producto.subcategoria || '',
      especie: producto.especie || 'BOVINO',
      tipo: producto.tipo || '',
      delCuarto: producto.delCuarto || '',
      tipoVenta: producto.tipoVenta || 'POR_KG',
      descripcionCircular: producto.descripcionCircular || '',
      precioBase: producto.precioBase || 0,
      precioDolar: producto.precioDolar || 0,
      precioEuro: producto.precioEuro || 0,
      precioArs: producto.precioArs || 0,
      moneda: producto.moneda || 'ARS',
      alicuotaIva: producto.alicuotaIva || 21,
      producidoParaCliente: producto.producidoParaCliente || '',
      productoGeneral: producto.productoGeneral || false,
      productoReporteRinde: producto.productoReporteRinde || false,
      tipoTrabajo: producto.tipoTrabajo || '',
      idiomaEtiqueta: producto.idiomaEtiqueta || 'ES',
      formatoEtiqueta: producto.formatoEtiqueta || '',
      textoEtiqueta: producto.textoEtiqueta || '',
      textoEspanol: producto.textoEspanol || '',
      textoIngles: producto.textoIngles || '',
      textoTercerIdioma: producto.textoTercerIdioma || '',
      temperaturaTransporte: producto.temperaturaTransporte || '',
      tipoConsumo: producto.tipoConsumo || 'DIRECTO',
      empresa: producto.empresa || '',
      tipoTrabajoId: producto.tipoTrabajoId || '',
      tipoCarne: producto.tipoCarne || '',
      activo: producto.activo,
      requiereTrazabilidad: producto.requiereTrazabilidad || false,
    })
    setDialogOpen(true)
  }

  const handleEliminar = async (producto: Producto) => {
    if (!confirm(`¿Desactivar el producto ${producto.nombre}?`)) return
    
    try {
      const res = await fetch(`/api/productos-vendibles/${producto.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchProductos()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al desactivar producto')
    }
  }

  const handleGuardar = async () => {
    if (!formData.codigo.trim()) {
      toast.error('El código es requerido')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const url = productoEditando 
        ? `/api/productos-vendibles/${productoEditando.id}`
        : '/api/productos-vendibles'
      const method = productoEditando ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setDialogOpen(false)
        fetchProductos()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Error al guardar producto')
    } finally {
      setSaving(false)
    }
  }

  const productosFiltrados = productos.filter(p => {
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      return (
        p.nombre.toLowerCase().includes(termino) ||
        p.codigo.toLowerCase().includes(termino) ||
        (p.descripcion?.toLowerCase().includes(termino))
      )
    }
    return true
  })

  const formatPrecio = (precio: number | undefined) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio || 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Configuración de Productos
            </h1>
            <p className="text-stone-500">Gestión de productos y servicios del frigorífico</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Productos</p>
                  <p className="text-xl font-bold">{productos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Activos</p>
                  <p className="text-xl font-bold text-green-600">
                    {productos.filter(p => p.activo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Precio Promedio</p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatPrecio(productos.reduce((sum, p) => sum + (p.precioActual || 0), 0) / (productos.length || 1))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Con Registro SENASA</p>
                  <p className="text-xl font-bold text-blue-600">
                    {productos.filter(p => p.numeroRegistroSenasa).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                className="pl-9"
                placeholder="Buscar por código, nombre o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Productos ({productosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead>Venc.</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.map((producto) => (
                      <TableRow key={producto.id} className={!producto.activo ? 'opacity-50' : ''}>
                        <TableCell className="font-mono text-sm">{producto.codigo}</TableCell>
                        <TableCell className="font-medium">{producto.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CATEGORIAS.find(c => c.value === producto.categoria)?.label || producto.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrecio(producto.precioActual || producto.precioArs)}
                        </TableCell>
                        <TableCell>
                          {producto.vencimientoDias ? `${producto.vencimientoDias} días` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              producto.activo 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {producto.activo ? 'ACTIVO' : 'INACTIVO'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditar(producto)} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEliminar(producto)}
                              title="Desactivar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Dialog Nuevo/Editar Producto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                Complete los datos del producto
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basicos" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="basicos">Datos Básicos</TabsTrigger>
                <TabsTrigger value="clasificacion">Clasificación</TabsTrigger>
                <TabsTrigger value="precios">Precios</TabsTrigger>
                <TabsTrigger value="etiquetas">Etiquetas</TabsTrigger>
                <TabsTrigger value="logistica">Logística</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="max-h-[60vh]">
                {/* TAB: DATOS BÁSICOS */}
                <TabsContent value="basicos" className="space-y-4 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Código *</Label>
                      <Input
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                        placeholder="MR001"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Media Res Bovina"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción del producto..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Tara (kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.tara}
                        onChange={(e) => setFormData({ ...formData, tara: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Vencimiento (días)</Label>
                      <Input
                        type="number"
                        value={formData.vencimientoDias}
                        onChange={(e) => setFormData({ ...formData, vencimientoDias: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>N° Registro SENASA</Label>
                      <Input
                        value={formData.numeroRegistroSenasa}
                        onChange={(e) => setFormData({ ...formData, numeroRegistroSenasa: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Unidad</Label>
                      <Select value={formData.unidadMedida} onValueChange={(v) => setFormData({ ...formData, unidadMedida: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNIDADES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cant. Etiquetas</Label>
                      <Input
                        type="number"
                        value={formData.cantidadEtiquetas}
                        onChange={(e) => setFormData({ ...formData, cantidadEtiquetas: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label>Tiene Tipificación</Label>
                      <div className="flex items-center h-10">
                        <Checkbox
                          checked={formData.tieneTipificacion}
                          onCheckedChange={(checked) => setFormData({ ...formData, tieneTipificacion: checked as boolean })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Tipificación</Label>
                      <Input
                        value={formData.tipificacion}
                        onChange={(e) => setFormData({ ...formData, tipificacion: e.target.value })}
                        placeholder="A, B, C..."
                        disabled={!formData.tieneTipificacion}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="activo"
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
                      />
                      <Label htmlFor="activo">Producto Activo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trazabilidad"
                        checked={formData.requiereTrazabilidad}
                        onCheckedChange={(checked) => setFormData({ ...formData, requiereTrazabilidad: checked as boolean })}
                      />
                      <Label htmlFor="trazabilidad">Requiere Trazabilidad</Label>
                    </div>
                  </div>
                </TabsContent>
                
                {/* TAB: CLASIFICACIÓN */}
                <TabsContent value="clasificacion" className="space-y-4 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Categoría</Label>
                      <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subcategoría</Label>
                      <Input
                        value={formData.subcategoria}
                        onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                        placeholder="Ej: Cortes de novillo"
                      />
                    </div>
                    <div>
                      <Label>Especie</Label>
                      <Select value={formData.especie} onValueChange={(v) => setFormData({ ...formData, especie: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ESPECIES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Input
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        placeholder="Ej: Corte, Menudencia"
                      />
                    </div>
                    <div>
                      <Label>Del Cuarto</Label>
                      <Select value={formData.delCuarto} onValueChange={(v) => setFormData({ ...formData, delCuarto: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_NINGUNO_">Ninguno</SelectItem>
                          <SelectItem value="DELANTERO">Delantero</SelectItem>
                          <SelectItem value="TRASERO">Trasero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo de Carne</Label>
                      <Select value={formData.tipoCarne} onValueChange={(v) => setFormData({ ...formData, tipoCarne: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_CARNES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Venta</Label>
                      <Select value={formData.tipoVenta} onValueChange={(v) => setFormData({ ...formData, tipoVenta: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_VENTA.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Descripción para Circular</Label>
                      <Input
                        value={formData.descripcionCircular}
                        onChange={(e) => setFormData({ ...formData, descripcionCircular: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="productoGeneral"
                        checked={formData.productoGeneral}
                        onCheckedChange={(checked) => setFormData({ ...formData, productoGeneral: checked as boolean })}
                      />
                      <Label htmlFor="productoGeneral">Producto General</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="productoReporteRinde"
                        checked={formData.productoReporteRinde}
                        onCheckedChange={(checked) => setFormData({ ...formData, productoReporteRinde: checked as boolean })}
                      />
                      <Label htmlFor="productoReporteRinde">Producto Reporte Rinde</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Producido para Cliente</Label>
                    <Input
                      value={formData.producidoParaCliente}
                      onChange={(e) => setFormData({ ...formData, producidoParaCliente: e.target.value })}
                      placeholder="Cliente específico si aplica"
                    />
                  </div>
                </TabsContent>
                
                {/* TAB: PRECIOS */}
                <TabsContent value="precios" className="space-y-4 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Precio Base</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.precioBase}
                        onChange={(e) => setFormData({ ...formData, precioBase: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Precio ARS</Label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.precioArs}
                          onChange={(e) => setFormData({ ...formData, precioArs: parseFloat(e.target.value) || 0 })}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Precio USD</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.precioDolar}
                          onChange={(e) => setFormData({ ...formData, precioDolar: parseFloat(e.target.value) || 0 })}
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Precio EUR</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.precioEuro}
                          onChange={(e) => setFormData({ ...formData, precioEuro: parseFloat(e.target.value) || 0 })}
                          className="pl-7"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Moneda Principal</Label>
                      <Select value={formData.moneda} onValueChange={(v) => setFormData({ ...formData, moneda: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                          <SelectItem value="USD">Dólares (USD)</SelectItem>
                          <SelectItem value="EUR">Euros (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Alícuota IVA (%)</Label>
                      <Select value={String(formData.alicuotaIva)} onValueChange={(v) => setFormData({ ...formData, alicuotaIva: parseFloat(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="21">21%</SelectItem>
                          <SelectItem value="10.5">10.5%</SelectItem>
                          <SelectItem value="0">0% (Exento)</SelectItem>
                          <SelectItem value="27">27%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                {/* TAB: ETIQUETAS */}
                <TabsContent value="etiquetas" className="space-y-4 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Idioma Etiqueta</Label>
                      <Select value={formData.idiomaEtiqueta} onValueChange={(v) => setFormData({ ...formData, idiomaEtiqueta: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {IDIOMAS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Formato Etiqueta</Label>
                      <Input
                        value={formData.formatoEtiqueta}
                        onChange={(e) => setFormData({ ...formData, formatoEtiqueta: e.target.value })}
                        placeholder="Ej: 100x50mm"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Trabajo</Label>
                      <Input
                        value={formData.tipoTrabajo}
                        onChange={(e) => setFormData({ ...formData, tipoTrabajo: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Texto para Etiqueta</Label>
                    <Textarea
                      value={formData.textoEtiqueta}
                      onChange={(e) => setFormData({ ...formData, textoEtiqueta: e.target.value })}
                      placeholder="Texto que aparecerá en la etiqueta..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="flex items-center gap-1"><Globe className="w-4 h-4" /> Texto Español</Label>
                      <Textarea
                        value={formData.textoEspanol}
                        onChange={(e) => setFormData({ ...formData, textoEspanol: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1"><Globe className="w-4 h-4" /> Texto Inglés</Label>
                      <Textarea
                        value={formData.textoIngles}
                        onChange={(e) => setFormData({ ...formData, textoIngles: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1"><Globe className="w-4 h-4" /> Tercer Idioma</Label>
                      <Textarea
                        value={formData.textoTercerIdioma}
                        onChange={(e) => setFormData({ ...formData, textoTercerIdioma: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* TAB: LOGÍSTICA */}
                <TabsContent value="logistica" className="space-y-4 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="flex items-center gap-1"><Thermometer className="w-4 h-4" /> Temperatura Transporte</Label>
                      <Input
                        value={formData.temperaturaTransporte}
                        onChange={(e) => setFormData({ ...formData, temperaturaTransporte: e.target.value })}
                        placeholder="Ej: -18°C, Refrigerado"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Consumo</Label>
                      <Select value={formData.tipoConsumo} onValueChange={(v) => setFormData({ ...formData, tipoConsumo: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_CONSUMO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="flex items-center gap-1"><Building className="w-4 h-4" /> Empresa</Label>
                      <Input
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        placeholder="Empresa productora"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Trabajo ID</Label>
                      <Input
                        value={formData.tipoTrabajoId}
                        onChange={(e) => setFormData({ ...formData, tipoTrabajoId: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <DialogFooter className="flex justify-between mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Salir
              </Button>
              <div className="flex gap-2">
                {productoEditando && (
                  <Button 
                    variant="destructive" 
                    onClick={() => { handleEliminar(productoEditando); setDialogOpen(false); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <Button 
                  onClick={handleGuardar} 
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Guardando...' : 'Aceptar'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfigProductosModule
