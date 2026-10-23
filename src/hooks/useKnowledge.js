import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRepo } from '../lib/repo'

const agoDays = (d) => new Date(Date.now() - d * 86_400_000).toISOString()

const SEED_KB = [
  {
    id: 'KB-101',
    title: 'Cómo configurar la VPN corporativa desde casa',
    category: 'Conectividad',
    summary: 'Guía paso a paso para instalar FortiClient y autenticarse con token 2FA.',
    content: `### Requisitos previos
1. Laptop corporativa o equipo personal autorizado con antivirus activo.
2. Credenciales de red corporativa y app Microsoft Authenticator en tu celular.

### Pasos de configuración:
1. Descarga el cliente VPN desde el portal oficial de TI o abre **FortiClient** si ya está instalado.
2. En la configuración de conexión remota, ingresa la dirección de gateway corporativo: \`vpn.andina-retail.com\`.
3. Puerto: **443** (SSL-VPN).
4. Introduce tu usuario corporativo (ej. \`mgarcia\`) y contraseña de red.
5. Te llegará una notificación de aprobación a tu celular (2FA). Presiona **Aprobar**.
6. Una vez conectado, el ícono en la barra de tareas cambiará a color verde.

> **Importante:** Si el cliente muestra el error *“Credenciales inválidas”*, comprueba que no tengas activo el Bloqueo de Mayúsculas o solicita un reinicio de contraseña desde el Catálogo de Servicios.`,
    author: 'Carlos P.',
    helpful_yes: 28,
    helpful_no: 2,
    views: 142,
    created_at: agoDays(45),
    updated_at: agoDays(5),
  },
  {
    id: 'KB-102',
    title: 'Configuración y optimización de Outlook / Correo en la nube',
    category: 'Software',
    summary: 'Solución a problemas de sincronización lenta y tamaño de buzón en Microsoft 365.',
    content: `### Solución a lentitud de sincronización:
1. En Outlook, ve a **Archivo → Configuración de la cuenta → Configuración de la cuenta**.
2. Selecciona tu correo y pulsa **Cambiar**.
3. En la barra de *Modo caché de Exchange*, reduce el período de descarga a **6 meses** o **1 año**.
4. Haz clic en **Siguiente** y luego en **Finalizar**. Reinicia Outlook.

### Limpieza de buzón:
- Vacía periódicamente la carpeta **Elementos eliminados**.
- Si tu buzón supera el 90% de capacidad (aviso amarillo), solicita la activación del **Buzón de archivo en línea** mediante una solicitud de servicio.`,
    author: 'Ana R.',
    helpful_yes: 19,
    helpful_no: 1,
    views: 89,
    created_at: agoDays(60),
    updated_at: agoDays(12),
  },
  {
    id: 'KB-103',
    title: 'Política de seguridad de contraseñas y doble factor (2FA)',
    category: 'Seguridad',
    summary: 'Reglas de complejidad, rotación periódica y qué hacer si perdiste tu dispositivo 2FA.',
    content: `### Reglas obligatorias de contraseñas:
- Longitud mínima de **12 caracteres**.
- Debe contener al menos una mayúscula, un número y un símbolo especial (ej. \`#\`, \`$\`, \`!\`).
- Vigencia de 90 días naturales. No se pueden repetir las últimas 5 contraseñas.

### ¿Perdiste tu teléfono 2FA?
Por protocolo de seguridad, no se restablecen accesos 2FA por correo ni mensajería informal.
1. Comunícate telefónicamente con la Mesa de Ayuda (anexo 2000) o acércate personalmente a la oficina de TI.
2. Deberás validar tu identidad con tu documento de identidad y confirmación de tu jefatura directa.`,
    author: 'Jorge T.',
    helpful_yes: 34,
    helpful_no: 3,
    views: 210,
    created_at: agoDays(90),
    updated_at: agoDays(20),
  },
  {
    id: 'KB-104',
    title: 'Guía de uso y cuidado de Laptops Corporativas',
    category: 'Hardware',
    summary: 'Buenas prácticas para maximizar la vida útil del equipo y la batería.',
    content: `### Recomendaciones de cuidado:
- Evita usar la laptop sobre camas, sofás o superficies de tela que obstruyan las rejillas de ventilación.
- Utiliza siempre el cargador original provisto por TI (65W Type-C).
- En traslados entre sucursales, transporta el equipo apagado o suspendido dentro de la mochila acolchada oficial.
- Para limpieza de pantalla, utiliza un paño de microfibra ligeramente humedecido con agua; nunca productos químicos corrosivos como alcohol en gel.`,
    author: 'Luis M.',
    helpful_yes: 15,
    helpful_no: 0,
    views: 64,
    created_at: agoDays(30),
    updated_at: agoDays(10),
  },
]

export const kbRepo = createRepo('kb_articles', SEED_KB, { prefix: 'KB' })
const KEY = ['kb_articles']

export function useKnowledge() {
  return useQuery({ queryKey: KEY, queryFn: () => kbRepo.list() })
}

export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) =>
      kbRepo.create({
        ...input,
        helpful_yes: 0,
        helpful_no: 0,
        views: 1,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) =>
      kbRepo.update(id, { ...patch, updated_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => kbRepo.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useVoteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, helpful }) => {
      const articles = await kbRepo.list()
      const target = articles.find((a) => a.id === id)
      if (!target) return
      const patch = helpful
        ? { helpful_yes: (target.helpful_yes || 0) + 1 }
        : { helpful_no: (target.helpful_no || 0) + 1 }
      await kbRepo.update(id, patch)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
