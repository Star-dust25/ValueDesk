import { img } from '../lib/images'

/**
 * Catálogo de servicios (ITIL: "Comprometer"). Cada servicio define su SLA y los valores
 * por defecto con los que se pre-llena un ticket al solicitarlo.
 */
export const SERVICES = [
  {
    id: 'acceso',
    name: 'Gestión de accesos',
    category: 'Seguridad',
    sla: '4 h',
    description: 'Altas, bajas y permisos a sistemas, VPN y carpetas compartidas.',
    priority: 'media',
    image: img('photo-1555949963-aa79dcee981c'),
  },
  {
    id: 'equipo',
    name: 'Equipo de cómputo',
    category: 'Hardware',
    sla: '48 h',
    description: 'Asignación, reemplazo o reparación de laptops y estaciones de trabajo.',
    priority: 'media',
    image: img('photo-1498050108023-c5249f4df085'),
  },
  {
    id: 'software',
    name: 'Instalación de software',
    category: 'Software',
    sla: '8 h',
    description: 'Instalación y licenciamiento de aplicaciones aprobadas.',
    priority: 'baja',
    image: img('photo-1517694712202-14dd9538aa97'),
  },
  {
    id: 'red',
    name: 'Red y VPN',
    category: 'Conectividad',
    sla: '2 h',
    description: 'Conectividad cableada, Wi-Fi y acceso remoto seguro.',
    priority: 'alta',
    image: img('photo-1518770660439-4636190af475'),
  },
  {
    id: 'correo',
    name: 'Correo y colaboración',
    category: 'Software',
    sla: '4 h',
    description: 'Buzones, listas de distribución, calendarios y videollamadas.',
    priority: 'media',
    image: img('photo-1531482615713-2afd69097998'),
  },
  {
    id: 'activos',
    name: 'Gestión de activos',
    category: 'Hardware',
    sla: '24 h',
    description: 'Registro, traslado y baja de activos de TI inventariados.',
    priority: 'baja',
    image: img('photo-1551434678-e076c223a692'),
  },
]

export const CATEGORIES = ['Todas', ...new Set(SERVICES.map((s) => s.category))]

export const serviceById = (id) => SERVICES.find((s) => s.id === id)
