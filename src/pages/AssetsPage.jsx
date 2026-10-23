import { useState, useMemo } from 'react'
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '../hooks/useAssets'
import { ASSET_TYPES, ASSET_STATUSES, labelOf } from '../data/constants'
import { warrantyState, computeAssetMetrics } from '../lib/metrics'
import { formatMoney, formatDate } from '../lib/format'
import { matches } from '../lib/text'
import { downloadCSV } from '../lib/csv'
import { useCan } from '../lib/permissions'
import { useUIStore } from '../store/useUIStore'
import Modal from '../components/Modal'
import './AssetsPage.css'

export default function AssetsPage() {
  const { data: assets = [], isLoading } = useAssets()
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const deleteAsset = useDeleteAsset()
  const can = useCan()
  const showToast = useUIStore((s) => s.showToast)

  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('Todos')
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const [editingAsset, setEditingAsset] = useState(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  const metrics = useMemo(() => computeAssetMetrics(assets), [assets])

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchText = matches(query, a.name, a.serial, a.assigned_to, a.location, a.notes)
      const matchType = selectedType === 'Todos' || a.type === selectedType
      const matchStatus = selectedStatus === 'Todos' || a.status === selectedStatus
      return matchText && matchType && matchStatus
    })
  }, [assets, query, selectedType, selectedStatus])

  const handleExportCSV = () => {
    downloadCSV('cmdb-activos.csv', assets, [
      { label: 'ID', key: 'id' },
      { label: 'Nombre', key: 'name' },
      { label: 'Tipo', key: 'type' },
      { label: 'Nro de Serie', key: 'serial' },
      { label: 'Asignado a', key: 'assigned_to' },
      { label: 'Estado', value: (a) => labelOf(ASSET_STATUSES, a.status) },
      { label: 'Ubicación', key: 'location' },
      { label: 'Costo USD', key: 'cost' },
      { label: 'Garantía hasta', value: (a) => formatDate(a.warranty_until) },
    ])
  }

  const handleSaveAsset = async (e) => {
    e.preventDefault()
    const form = e.target
    const formData = new FormData(form)
    const payload = {
      name: formData.get('name').trim(),
      type: formData.get('type'),
      serial: formData.get('serial').trim(),
      assigned_to: formData.get('assigned_to').trim() || 'Sin asignar',
      status: formData.get('status'),
      location: formData.get('location').trim(),
      cost: Number(formData.get('cost')) || 0,
      warranty_until: formData.get('warranty_until') || null,
      notes: formData.get('notes').trim(),
    }

    if (!payload.name || !payload.serial) {
      showToast('Nombre y número de serie son obligatorios', 'error')
      return
    }

    try {
      if (editingAsset?.id) {
        await updateAsset.mutateAsync({ id: editingAsset.id, ...payload })
        showToast(`Activo ${editingAsset.id} actualizado`)
      } else {
        const created = await createAsset.mutateAsync(payload)
        showToast(`Activo ${created.id} registrado en la CMDB`)
      }
      setIsNewModalOpen(false)
      setEditingAsset(null)
    } catch (err) {
      showToast(`Error al guardar: ${err.message}`, 'error')
    }
  }

  const handleDeleteAsset = async (id) => {
    if (!window.confirm(`¿Confirmas la baja definitiva del activo ${id}?`)) return
    try {
      await deleteAsset.mutateAsync(id)
      showToast(`Activo ${id} eliminado`)
      setEditingAsset(null)
    } catch (err) {
      showToast(`Error al eliminar: ${err.message}`, 'error')
    }
  }

  if (isLoading) {
    return <div className="container section muted">Cargando inventario CMDB…</div>
  }

  return (
    <div className="container">
      <header className="page-head assets-head">
        <div>
          <p className="subtitle">Gestión de Activos TI (ITAM & CMDB) · ITIL 4</p>
          <h1 className="h2">Inventario de Activos de Servicio</h1>
          <p className="muted">
            Registro centralizado de elementos de configuración (CI): hardware, servidores, licencias y
            vigencia de garantías para garantizar la continuidad operativa.
          </p>
        </div>
        <div className="assets-head__actions">
          <button type="button" className="btn btn--ghost" onClick={handleExportCSV}>
            Exportar CSV
          </button>
          {can('assets:edit') && (
            <button
              type="button"
              className="btn btn--primary"
              id="new-asset-btn"
              onClick={() => {
                setEditingAsset(null)
                setIsNewModalOpen(true)
              }}
            >
              + Nuevo Activo
            </button>
          )}
        </div>
      </header>

      {/* Resumen de inventario */}
      <section className="assets-summary" aria-label="Resumen de inventario">
        <div className="summary-pill">
          <span className="muted">Total Activos:</span>
          <b>{metrics.total}</b>
        </div>
        <div className="summary-pill">
          <span className="muted">Valor Inventariado:</span>
          <b className="accent">{formatMoney(metrics.value)}</b>
        </div>
        <div className="summary-pill">
          <span className="muted">En uso:</span>
          <b>{metrics.inUse}</b>
        </div>
        {metrics.warrantySoon.length > 0 && (
          <div className="summary-pill summary-pill--warning">
            <span>Alerta: {metrics.warrantySoon.length} garantías próximas a expirar</span>
          </div>
        )}
      </section>

      {/* Barra de Filtros y Búsqueda */}
      <div className="assets-toolbar">
        <div className="assets-search">
          <input
            id="assets-search-input"
            type="search"
            className="input"
            placeholder="Buscar por activo, serie, asignado, ubicación…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="assets-filters">
          <select
            className="select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filtrar por tipo"
          >
            <option value="Todos">Tipo: Todos</option>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className="select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="Todos">Estado: Todos</option>
            {ASSET_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Activos Responsive Flat */}
      <div className="card assets-table-card">
        <div className="table-responsive">
          <table className="assets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Activo</th>
                <th>Tipo</th>
                <th>Nro de Serie</th>
                <th>Asignado a</th>
                <th>Estado</th>
                <th>Garantía</th>
                <th>Costo</th>
                {can('assets:edit') && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={can('assets:edit') ? 9 : 8} className="table-empty">
                    No se encontraron activos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((a) => {
                  const wState = warrantyState(a)
                  return (
                    <tr key={a.id} id={`asset-row-${a.id}`}>
                      <td className="asset-id">{a.id}</td>
                      <td>
                        <div className="asset-name-cell">
                          <b>{a.name}</b>
                          {a.location && <span className="muted text-xs">{a.location}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="tag tag--outline">{a.type}</span>
                      </td>
                      <td className="font-mono text-xs">{a.serial}</td>
                      <td>{a.assigned_to}</td>
                      <td>
                        <span className={`tag tag--status-${a.status}`}>
                          {labelOf(ASSET_STATUSES, a.status)}
                        </span>
                      </td>
                      <td>
                        {a.warranty_until ? (
                          <span
                            className={`warranty-badge warranty-badge--${wState}`}
                            title={`Vence: ${formatDate(a.warranty_until)}`}
                          >
                            {wState === 'expired' && 'Expirada'}
                            {wState === 'soon' && 'Por vencer (<60d)'}
                            {wState === 'ok' && formatDate(a.warranty_until)}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="asset-cost">{formatMoney(a.cost)}</td>
                      {can('assets:edit') && (
                        <td>
                          <button
                            type="button"
                            className="btn btn--ghost asset-edit-btn"
                            onClick={() => {
                              setEditingAsset(a)
                              setIsNewModalOpen(true)
                            }}
                          >
                            Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Activo */}
      <Modal
        id="asset-modal"
        open={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false)
          setEditingAsset(null)
        }}
        title={editingAsset ? `Editar ${editingAsset.id}` : 'Registrar Nuevo Activo'}
        subtitle="CMDB · Gestión de Configuración"
      >
        <form className="form" onSubmit={handleSaveAsset}>
          <div className="form__row">
            <label className="field">
              <span className="field__label">Nombre del Activo <span className="req">*</span></span>
              <input
                name="name"
                className="input"
                defaultValue={editingAsset?.name || ''}
                placeholder="Ej. MacBook Pro 16 M3"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Tipo <span className="req">*</span></span>
              <select name="type" className="select" defaultValue={editingAsset?.type || 'Laptop'}>
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Número de Serie <span className="req">*</span></span>
              <input
                name="serial"
                className="input"
                defaultValue={editingAsset?.serial || ''}
                placeholder="Ej. SN-9812-4402"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Estado Operativo</span>
              <select name="status" className="select" defaultValue={editingAsset?.status || 'en_uso'}>
                {ASSET_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Asignado a (Persona o Área)</span>
              <input
                name="assigned_to"
                className="input"
                defaultValue={editingAsset?.assigned_to || ''}
                placeholder="Ej. Ana R. / Datacenter"
              />
            </label>
            <label className="field">
              <span className="field__label">Ubicación Física</span>
              <input
                name="location"
                className="input"
                defaultValue={editingAsset?.location || ''}
                placeholder="Ej. Sucursal Central - Piso 2"
              />
            </label>
          </div>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Costo Adquisición (USD)</span>
              <input
                name="cost"
                type="number"
                step="1"
                min="0"
                className="input"
                defaultValue={editingAsset?.cost ?? ''}
                placeholder="Ej. 1200"
              />
            </label>
            <label className="field">
              <span className="field__label">Vencimiento de Garantía</span>
              <input
                name="warranty_until"
                type="date"
                className="input"
                defaultValue={editingAsset?.warranty_until?.split('T')[0] || ''}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Notas Técnicas / Especificaciones</span>
            <textarea
              name="notes"
              className="textarea"
              defaultValue={editingAsset?.notes || ''}
              placeholder="Detalles de hardware, versión de firmware, IP asignada…"
            />
          </label>

          <div className="form__actions form__actions--split">
            {editingAsset && can('assets:delete') ? (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => handleDeleteAsset(editingAsset.id)}
              >
                Eliminar Activo
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setIsNewModalOpen(false)
                  setEditingAsset(null)
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                Guardar Activo
              </button>
            </div>
          </div>
        </form>
      </Modal>
      <div style={{ height: 'var(--space-12)' }} />
    </div>
  )
}
