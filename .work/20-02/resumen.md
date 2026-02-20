### Resumen de la Sesión de Debugging 1. El Problema
La vista DRAWS_LIST_PLUGIN_VIEW se quedaba permanentemente en estado NotAsked (sin cargar datos) después de actualizar los servicios al patrón Result . El usuario tenía que hacer un "pull-to-refresh" manual para ver los datos.
 2. Causa Raíz Identificada
El problema no estaba en el plugin de sorteos en sí, sino en el flujo de datos del Usuario :

1. Validación Estricta Fallida : El archivo user.dto.ts usaba una validación estricta ( io-ts ) que rechazaba al usuario si faltaba el campo commission_rate en su estructura.
2. Efecto Dominó : Al fallar la validación, adaptAuthUser retornaba null o un usuario incompleto sin structureId .
3. Bloqueo de Carga : La función triggerInitialLoad en auth.handler.ts tiene una guarda explícita: if (!model.userStructureId) return . Al no haber ID de estructura, nunca se disparaba la carga automática de sorteos. 3. Soluciones Implementadas
- Corrección de DTO : Modifiqué user.dto.ts para asignar un valor por defecto ( 0 ) a commissionRate si viene nulo del backend. Esto asegura que el contrato se cumpla y se extraiga el structureId correctamente.
- Mejora en Suscripciones : Actualicé external.gateway.ts para usar Sub.watchStore en lugar de Sub.kernel . Esto garantiza que el Dashboard reaccione de forma fiable a los cambios en el store de autenticación.
- Limpieza : Se eliminó el useEffect manual que forzaba el refresco, ya que ahora el flujo reactivo debería funcionar por sí mismo.