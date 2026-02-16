# Plan de Refactorización: Sistema Offline-First Agnóstico de Dominio

## Objetivo
Transformar el sistema offline-first actual en un sistema completamente agnóstico de dominio, donde cualquier entidad pueda registrarse en el `DOMAIN_ENTITY_REGISTRY` sin requerir modificaciones de código específicas.

## Archivos Impactados

### 1. `sync.strategies.ts`
- **Problema**: Estrategias específicas codificadas para entidades como `BetPushStrategy`, `DrawsPullStrategy`
- **Solución**: Implementar estrategias genéricas basadas en el tipo de sincronización (PULL, PUSH, SYNC, LOCAL_ONLY)

### 2. `sync.worker.ts`
- **Problema**: Lógica condicional específica para entidades conocidas
- **Solución**: Implementar un sistema dinámico que lea la configuración del `DOMAIN_ENTITY_REGISTRY`

### 3. `storage.service.ts`
- **Problema**: Aunque hay un motor genérico, aún hay lógica específica para ciertas entidades
- **Solución**: Asegurar que todas las operaciones sean completamente genéricas

### 4. `types.ts`
- **Problema**: Las estrategias están codificadas en el registro de estrategias
- **Solución**: Asegurar que el sistema pueda trabajar con cualquier entidad registrada

## Posibles Mejoras

### 1. Estrategias Genéricas Basadas en Configuración
```typescript
// Estrategia genérica que opera basada en la configuración de la entidad
interface GenericSyncStrategy {
  sync(entityConfig: DomainEntityConfig, item?: SyncQueueItem): Promise<boolean>;
}
```

### 2. Sistema de Resolución Dinámica
Implementar un sistema que resuelva dinámicamente qué estrategia usar basada en la configuración:
- Si `syncStrategy` es `'PUSH'` → usar lógica de envío al backend
- Si `syncStrategy` es `'PULL'` → usar lógica de obtención desde backend
- Si `syncStrategy` es `'SYNC'` → combinar ambas
- Si `syncStrategy` es `'LOCAL_ONLY'` → omitir sincronización con backend

### 3. Registro de Estrategias Configurable
En lugar de tener estrategias codificadas, permitir que el sistema pueda registrar estrategias personalizadas:
```typescript
const strategyRegistry = {
  'PUSH': new GenericPushStrategy(),
  'PULL': new GenericPullStrategy(),
  'SYNC': new GenericSyncStrategy(),
  'LOCAL_ONLY': new LocalOnlyStrategy(),
};
```

### 4. Configuración Extendida de Entidades
Extender la interfaz `DomainEntityConfig` para soportar propiedades adicionales:
- Funciones de transformación personalizadas
- Configuración de reintentos específicos por entidad
- Prioridades de sincronización dinámicas

### 5. Sistema de Hooks de Dominio
Agregar puntos de extensión para que cada entidad pueda definir su comportamiento específico:
- Funciones de validación personalizadas
- Transformadores de datos específicos
- Lógica de resolución de conflictos

## Pasos de Implementación

### Fase 1: Análisis y Diseño
- [ ] Revisar completamente la lógica actual de estrategias
- [ ] Diseñar las interfaces genéricas para estrategias
- [ ] Definir el sistema de resolución dinámica

### Fase 2: Implementación de Estrategias Genéricas
- [ ] Crear `GenericPushStrategy`
- [ ] Crear `GenericPullStrategy`
- [ ] Crear `GenericSyncStrategy`
- [ ] Crear `LocalOnlyStrategy`

### Fase 3: Refactorización del Worker
- [ ] Eliminar lógica condicional específica de entidades
- [ ] Implementar sistema dinámico de resolución de estrategias
- [ ] Asegurar que el worker utilice únicamente la configuración declarativa

### Fase 4: Refactorización del Almacenamiento
- [ ] Asegurar que todas las operaciones de almacenamiento sean genéricas
- [ ] Mantener compatibilidad hacia atrás
- [ ] Implementar sistema de eventos genérico

### Fase 5: Pruebas y Validación
- [ ] Probar con entidades existentes (BETS, DRAWS, SUMMARY, RULES)
- [ ] Probar con nuevas entidades registradas dinámicamente
- [ ] Validar rendimiento y estabilidad

### Fase 6: Documentación y Ejemplo
- [ ] Documentar cómo registrar nuevas entidades
- [ ] Proporcionar ejemplos de uso
- [ ] Actualizar comentarios y JSDoc

## Beneficios Esperados

1. **Mayor Flexibilidad**: Cualquier nueva entidad puede agregarse mediante configuración sin código adicional
2. **Menor Acoplamiento**: Las estrategias no estarán ligadas a entidades específicas
3. **Facilidad de Mantenimiento**: Menos código condicional y lógica dispersa
4. **Escalabilidad**: El sistema puede manejar nuevas entidades sin cambios estructurales
5. **Reutilización de Código**: Estrategias genéricas reutilizables para múltiples entidades

## Consideraciones de Seguridad

- Asegurar que la configuración dinámica no permita inyección de código
- Validar las configuraciones antes de usarlas
- Implementar controles de acceso si es necesario para diferentes entidades