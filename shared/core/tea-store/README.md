# TEAStore

A generic, reusable CRUD component built on the TEA (The Elm Architecture) pattern. TEAStore provides type-safe state management for any entity with full CRUD operations, async handling, and React integration.

## Features

- **Generic Type Support** - Works with any entity type that has an `id` field
- **Full CRUD Operations** - Create, Read, Update, Delete with async handling
- **RemoteData Integration** - Built-in loading/error/success states for all operations
- **TEA Architecture Compliant** - Uses existing `Cmd`, `Return`, `RemoteData`, and `Engine` patterns
- **React Hook** - Easy integration with React components via `useTEAStore` hook
- **Convenience Methods** - Pre-built actions for common operations
- **Type Safety** - Full TypeScript support with generic types

## Installation

TEAStore is part of the shared core. Import it from:

```typescript
import { useTEAStore, Entity, TEAStoreConfig } from '@core/tea-store';
```

## Quick Start

### 1. Define Your Entity

```typescript
import { Entity } from '@core/tea-store';

interface User extends Entity {
    id: string;
    name: string;
    email: string;
    role: string;
}
```

### 2. Create Service Functions

```typescript
const userService = {
    fetchAll: async () => {
        const response = await apiClient.get('/users');
        return response.data;
    },
    fetchOne: async (id: string) => {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },
    create: async (data: Omit<User, 'id'>) => {
        const response = await apiClient.post('/users', data);
        return response.data;
    },
    update: async (id: string, data: Partial<User>) => {
        const response = await apiClient.put(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await apiClient.delete(`/users/${id}`);
    },
};
```

### 3. Use the Hook in Your Component

```typescript
import { useTEAStore, TEAStoreConfig } from '@core/tea-store';
import { RemoteData } from '@core/remote.data';

const userConfig: TEAStoreConfig<User> = {
    fetchAll: userService.fetchAll,
    fetchOne: userService.fetchOne,
    create: userService.create,
    update: userService.update,
    delete: userService.delete,
    onError: (error) => console.error('User operation failed:', error),
};

function UserManagementScreen() {
    const { model, actions } = useTEAStore(userConfig);

    return (
        <View>
            {/* List View */}
            {RemoteData.fold({
                notAsked: () => <Text>Press refresh to load users</Text>,
                loading: () => <ActivityIndicator />,
                failure: (error) => <Text>Error: {String(error)}</Text>,
                success: (users) => (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => actions.selectItem(item.id)}>
                                <Text>{item.name} - {item.email}</Text>
                            </TouchableOpacity>
                        )}
                    />
                ),
            }, model.items)}

            {/* Create Button */}
            <Button title="Add User" onPress={actions.startCreate} />

            {/* Edit Mode */}
            {model.isEditing && model.editingId && (
                <UserForm
                    user={RemoteData.withDefault(null, model.selectedItem)}
                    onSave={(data) => actions.update(model.editingId!, data)}
                    onCancel={actions.cancelEdit}
                />
            )}

            {/* Create Mode */}
            {model.isCreating && (
                <UserForm
                    user={null}
                    onSave={(data) => actions.create(data)}
                    onCancel={actions.cancelEdit}
                />
            )}
        </View>
    );
}
```

## API Reference

### `useTEAStore<T>(config, autoFetch?)`

Creates a TEAStore instance with React integration.

**Parameters:**
- `config: TEAStoreConfig<T>` - Configuration object with CRUD service functions
- `autoFetch?: boolean` - Whether to automatically fetch all items on mount (default: `true`)

**Returns:**
```typescript
{
    model: TEAStoreState<T>;      // Current store state
    dispatch: (msg) => void;       // Dispatch function
    actions: Actions<T>;             // Convenience methods
    store: Store;                   // Zustand store reference
}
```

### `TEAStoreConfig<T>`

Configuration object for TEAStore.

```typescript
interface TEAStoreConfig<T extends Entity> {
    fetchAll: () => Promise<T[]>;
    fetchOne: (id: string) => Promise<T>;
    create: (data: Omit<T, 'id'>) => Promise<T>;
    update: (id: string, data: Partial<T>) => Promise<T>;
    delete: (id: string) => Promise<void>;
    initialData?: T[];
    onError?: (error: any) => void;
}
```

### `TEAStoreState<T>`

Store state object.

```typescript
interface TEAStoreState<T extends Entity> {
    items: WebData<T[]>;           // Collection of all entities
    selectedItem: WebData<T>;        // Currently selected entity
    operationStatus: WebData<T>;     // Status of last operation
    isCreating: boolean;             // Whether in create mode
    isEditing: boolean;              // Whether in edit mode
    editingId: string | null;         // ID of entity being edited
}
```

### Actions

Convenience methods provided by the hook:

```typescript
{
    fetchAll: () => void;                    // Fetch all entities
    fetchOne: (id: string) => void;         // Fetch single entity
    create: (data: Omit<T, 'id'>) => void; // Create new entity
    update: (id: string, data: Partial<T>) => void; // Update entity
    delete: (id: string) => void;            // Delete entity
    selectItem: (id: string | null) => void;  // Select entity
    startCreate: () => void;                  // Start create mode
    startEdit: (id: string) => void;        // Start edit mode
    cancelEdit: () => void;                   // Cancel edit/create mode
    clearError: () => void;                   // Clear operation status
    reset: () => void;                       // Reset store to initial state
}
```

## Advanced Usage

### Manual Store Creation

If you need more control, you can create the store manually:

```typescript
import { createTEAStoreUpdate } from '@core/tea-store';
import { createElmStore } from '@core/engine';
import { effectHandlers } from '@core/effect_handlers';

const { initial, update } = createTEAStoreUpdate<User>(userConfig);
const store = createElmStore(initial, update);

// Use store directly
store.getState().dispatch({ type: 'FETCH_ALL_REQUESTED' });
store.subscribe((state) => console.log(state.model));
```

### Custom Error Handling

```typescript
const config: TEAStoreConfig<User> = {
    // ... service functions
    onError: (error) => {
        // Custom error handling
        if (error.status === 401) {
            // Redirect to login
        } else if (error.status === 403) {
            // Show permission error
        } else {
            // Show generic error
            Alert.alert('Error', error.message);
        }
    },
};
```

### Initial Data

```typescript
const config: TEAStoreConfig<User> = {
    // ... service functions
    initialData: [
        { id: '1', name: 'John', email: 'john@example.com', role: 'admin' },
        { id: '2', name: 'Jane', email: 'jane@example.com', role: 'user' },
    ],
};
```

### Disable Auto-Fetch

```typescript
// Don't fetch on mount
const { model, actions } = useTEAStore(userConfig, false);

// Fetch manually when needed
useEffect(() => {
    if (shouldFetch) {
        actions.fetchAll();
    }
}, [shouldFetch]);
```

## Examples

### User Management

See the Quick Start section above for a complete user management example.

### Bet Management

```typescript
interface Bet extends Entity {
    id: string;
    amount: number;
    numbers: number[];
    drawId: string;
}

const betConfig: TEAStoreConfig<Bet> = {
    fetchAll: () => BetService.getAll(),
    fetchOne: (id) => BetService.getById(id),
    create: (data) => BetService.create(data),
    update: (id, data) => BetService.update(id, data),
    delete: (id) => BetService.delete(id),
};

function BetManagementScreen() {
    const { model, actions } = useTEAStore(betConfig);
    // ... implementation
}
```

### Draw Management

```typescript
interface Draw extends Entity {
    id: string;
    name: string;
    date: string;
    status: 'open' | 'closed';
}

const drawConfig: TEAStoreConfig<Draw> = {
    fetchAll: () => DrawService.getAll(),
    fetchOne: (id) => DrawService.getById(id),
    create: (data) => DrawService.create(data),
    update: (id, data) => DrawService.update(id, data),
    delete: (id) => DrawService.delete(id),
};

function DrawManagementScreen() {
    const { model, actions } = useTEAStore(drawConfig);
    // ... implementation
}
```

## Architecture

TEAStore follows the TEA (The Elm Architecture) pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Component                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  useTEAStore(config)                         │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │  model: TEAStoreState<T>             │   │   │
│  │  │  actions: Actions<T>                  │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ dispatch(msg)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              TEAStore Update Function                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  update(model, msg) -> (model, cmd)       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ cmd
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              TEA Engine (Zustand)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  executeCmd(cmd) -> effectHandlers           │   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ async operations
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Effect Handlers                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  HTTP, TASK, NAVIGATE, etc.               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Always define your entity interface** extending `Entity`
2. **Create service functions** that return Promises
3. **Use RemoteData.fold** for rendering different states
4. **Handle errors** with the `onError` callback
5. **Use convenience methods** instead of dispatching messages directly
6. **Reset store** when navigating away from the screen
7. **Clear errors** after showing them to the user

## Troubleshooting

### Store not updating

Make sure you're using the `model` from the hook return value, not a cached reference:

```typescript
// ❌ Wrong
const { model, actions } = useTEAStore(config);
const cachedModel = model; // Don't cache this!

// ✅ Correct
const { model, actions } = useTEAStore(config);
// Use model directly in your render
```

### Type errors

Ensure your entity interface extends `Entity`:

```typescript
// ❌ Wrong
interface User {
    id: string;
    name: string;
}

// ✅ Correct
interface User extends Entity {
    id: string;
    name: string;
}
```

### Async operations not working

Make sure your service functions return Promises:

```typescript
// ❌ Wrong
const userService = {
    fetchAll: () => apiClient.get('/users'), // Returns AxiosPromise, not Promise
};

// ✅ Correct
const userService = {
    fetchAll: async () => {
        const response = await apiClient.get('/users');
        return response.data;
    },
};
```

## License

Part of the Game Reset project.
