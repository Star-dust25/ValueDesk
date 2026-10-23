-- =============================================================
-- ValueDesk · Datos Iniciales ITIL 4 (Seed Data)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Insertar Activos CMDB
INSERT INTO public.assets (id, name, type, serial, assigned_to, status, location, cost, warranty_until, notes)
VALUES
  ('AST-101', 'MacBook Pro 14 M2', 'Laptop', 'C02G45XPQ6L4', 'Maria Garcia', 'en_uso', 'Sucursal Central - Piso 3', 1999.00, now() + interval '180 days', 'Equipo asignado al area comercial.'),
  ('AST-102', 'Dell Latitude 5430', 'Laptop', 'DL-8823190-X', 'Ana Rivas', 'en_uso', 'Edificio Norte - TI', 1250.00, now() + interval '45 days', 'Garantia ProSupport proxima a vencer.'),
  ('AST-103', 'Servidor PowerEdge R750', 'Servidor', 'SRV-R750-01', 'Infraestructura', 'en_uso', 'Data Center Principal (Rack 04)', 8450.00, now() + interval '520 days', 'Host principal de bases de datos de produccion.'),
  ('AST-104', 'Switch Cisco Catalyst 9200', 'Red', 'FOC2419S02A', 'Redes y Comunicaciones', 'en_uso', 'Rack Distribucion Piso 2', 2890.00, now() + interval '300 days', 'Core switch sucursal norte.'),
  ('AST-105', 'Lenovo ThinkPad T14', 'Laptop', 'PF-3990812-Y', 'Sin asignar', 'disponible', 'Almacen de TI', 1100.00, now() + interval '360 days', 'Listo para configuracion y entrega a nuevos ingresos.')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Artículos de Conocimiento (KB)
INSERT INTO public.kb_articles (id, title, category, summary, content, author, helpful_yes, helpful_no, views)
VALUES
  ('KB-101', 'Guia de configuracion y desbloqueo de VPN', 'Redes', 'Instrucciones paso a paso para resolver fallos de conexion remota FortiClient y restablecer token OTP.', '1. Abra FortiClient.\n2. Verifique que la direccion del gateway sea vpn.andinaretail.com.\n3. Ingrese su usuario corporativo y clave de red.\n4. Si el token OTP falla, espere 30 segundos a que expire el codigo actual e intente con el nuevo codigo.\n5. Si el error persiste (codigo -8), contacte a la Mesa de Ayuda indicando su direccion IP local.', 'Ana Rivas', 18, 1, 84),
  ('KB-102', 'Procedimiento de recuperacion de clave ERP', 'Accesos', 'Como restablecer contrasenas del ERP corporativo mediante autoservicio de forma segura.', '1. Ingrese al portal https://auth.andinaretail.com\n2. Haga clic en ¿Olvido su contrasena?\n3. Ingrese su correo institucional.\n4. Recibira un enlace seguro valido por 15 minutos.\n5. La nueva clave debe contener minimo 10 caracteres, mayusculas, minusculas y numeros.', 'Equipo TI', 32, 2, 140),
  ('KB-103', 'Configuracion de firma digital y correo en Outlook', 'Software', 'Manual rapido para sincronizar cuenta corporativa Microsoft 365 y plantilla oficial de firma.', 'Descargue el complemento oficial desde el portal de autoservicio y aplique la plantilla estandar aprobada por el area de Comunicaciones.', 'Jorge Torres', 14, 0, 65)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Tickets Iniciales
INSERT INTO public.tickets (id, title, description, service, type, priority, status, position, assignee, asset_id, kb_id, comments, created_at, updated_at)
VALUES
  ('INC-101', 'VPN no conecta desde casa', 'Error de autenticacion al conectar con FortiClient (codigo de error -8).', 'red', 'incidente', 'alta', 'nuevo', 0, 'Ana Rivas', 'AST-101', 'KB-101', '[{"id":"c1","author":"Maria Garcia","role":"usuario","text":"Intente reinstalar la aplicacion pero sigue saliendo el mismo error al pedir el token.","created_at":"2026-10-22T17:00:00Z"},{"id":"c2","author":"Ana Rivas","role":"agente","text":"Revisando logs en el firewall corporativo. Bloqueo temporal por intentos fallidos resuelto.","created_at":"2026-10-22T17:30:00Z"}]'::jsonb, now() - interval '2 hours', now() - interval '1 hour'),
  ('REQ-204', 'Alta de laptop para nuevo ingreso', 'Ingresa el lunes al area de Ventas. Requiere paqueteria Office y ERP.', 'equipo', 'solicitud', 'media', 'nuevo', 1, 'Sin asignar', 'AST-105', NULL, '[]'::jsonb, now() - interval '5 hours', now() - interval '5 hours'),
  ('INC-102', 'Monitor parpadea en Caja 3', 'Sucursal Central. El cable HDMI parece danado.', 'equipo', 'incidente', 'media', 'en_progreso', 0, 'Ana Rivas', 'AST-102', NULL, '[]'::jsonb, now() - interval '6 hours', now() - interval '1 hour'),
  ('REQ-203', 'Acceso a Power BI de Finanzas', 'Aprobado por jefatura. Requiere rol de visualizacion en el workspace corporativo.', 'acceso', 'solicitud', 'baja', 'en_progreso', 1, 'Ana Rivas', NULL, 'KB-102', '[]'::jsonb, now() - interval '8 hours', now() - interval '2 hours'),
  ('INC-099', 'Impresora de bodega sin papel membretado', 'El sensor de bandeja no detecta hojas.', 'equipo', 'incidente', 'baja', 'resuelto', 0, 'Ana Rivas', NULL, NULL, '[]'::jsonb, now() - interval '24 hours', now() - interval '20 hours')
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Solicitudes de Cambio RFC
INSERT INTO public.changes (id, title, type, risk, status, requester, approver, service, scheduled_start, scheduled_end, description, backout_plan, created_at)
VALUES
  ('CHG-101', 'Actualizacion de Firmware en Switches Core', 'normal', 'medio', 'pendiente', 'Ana Rivas', NULL, 'Redes', now() + interval '2 days', now() + interval '2 days' + interval '2 hours', 'Actualizacion de seguridad preventiva en switches Cisco Catalyst 9200 de sucursal central.', 'Revertir a la version previa de IOS-XE almacenada en la particion secundaria del bootloader.', now() - interval '1 day'),
  ('CHG-102', 'Parche de seguridad urgente en Servidor de Base de Datos', 'emergencia', 'alto', 'aprobado', 'Jorge Torres', 'Jorge Torres', 'Infraestructura', now() + interval '6 hours', now() + interval '7 hours', 'Aplicacion de parche de vulnerabilidad critico en PostgreSQL.', 'Restauracion de snapshot de disco previo y failover a replica standby.', now() - interval '4 hours')
ON CONFLICT (id) DO NOTHING;
