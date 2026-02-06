/**
 * Example implementation of TEAStore for User entity.
 * 
 * This file demonstrates how to use TEAStore to manage users
 * with full CRUD operations.
 */

import { useTEAStore, Entity, TEAStoreConfig } from './index';
import { RemoteData } from '../remote.data';
import { View, Text, FlatList, TouchableOpacity, Button, ActivityIndicator, StyleSheet } from 'react-native';

// ============================================
// 1. Define Your Entity
// ============================================

interface User extends Entity {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'moderator';
    createdAt: string;
}

// ============================================
// 2. Create Service Functions
// ============================================

// Mock API service - replace with your actual API calls
const userService = {
    fetchAll: async (): Promise<User[]> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', createdAt: '2024-01-01' },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', createdAt: '2024-01-02' },
            { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'moderator', createdAt: '2024-01-03' },
        ];
    },

    fetchOne: async (id: string): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const users = await userService.fetchAll();
        const user = users.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return user;
    },

    create: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
    },

    update: async (id: string, data: Partial<User>): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 400));
        const users = await userService.fetchAll();
        const user = users.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return { ...user, ...data };
    },

    delete: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        // Simulate deletion
        console.log('Deleted user:', id);
    },
};

// ============================================
// 3. Create Configuration
// ============================================

const userConfig: TEAStoreConfig<User> = {
    fetchAll: userService.fetchAll,
    fetchOne: userService.fetchOne,
    create: userService.create,
    update: userService.update,
    delete: userService.delete,
    onError: (error) => {
        console.error('User operation failed:', error);
        // You could show an alert here
        // Alert.alert('Error', error.message);
    },
};

// ============================================
// 4. Create Components
// ============================================

/**
 * User list item component
 */
function UserItem({ user, onPress, onEdit, onDelete }: {
    user: User;
    onPress: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.itemContent}>
                <View style={styles.itemInfo}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                    <Text style={styles.role}>{user.role}</Text>
                </View>
                <View style={styles.itemActions}>
                    <Button title="Edit" onPress={onEdit} />
                    <Button title="Delete" onPress={onDelete} color="red" />
                </View>
            </View>
        </TouchableOpacity>
    );
}

/**
 * User form component for create/edit
 */
function UserForm({ user, onSave, onCancel }: {
    user: User | null;
    onSave: (data: Omit<User, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}) {
    const [name, setName] = React.useState(user?.name || '');
    const [email, setEmail] = React.useState(user?.email || '');
    const [role, setRole] = React.useState<'admin' | 'user' | 'moderator'>(user?.role || 'user');

    const handleSave = () => {
        if (!name || !email) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        onSave({ name, email, role });
    };

    return (
        <View style={styles.form}>
            <Text style={styles.formTitle}>{user ? 'Edit User' : 'Create User'}</Text>
            
            <Text style={styles.label}>Name</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleButtons}>
                {(['admin', 'user', 'moderator'] as const).map((r) => (
                    <TouchableOpacity
                        key={r}
                        style={[
                            styles.roleButton,
                            role === r && styles.roleButtonActive,
                        ]}
                        onPress={() => setRole(r)}
                    >
                        <Text style={[
                            styles.roleButtonText,
                            role === r && styles.roleButtonTextActive,
                        ]}>
                            {r}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.formActions}>
                <Button title="Cancel" onPress={onCancel} />
                <Button title="Save" onPress={handleSave} />
            </View>
        </View>
    );
}

/**
 * Main user management screen
 */
export function UserManagementScreen() {
    const { model, actions } = useTEAStore(userConfig);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>User Management</Text>
                <Button title="Add User" onPress={actions.startCreate} />
            </View>

            {/* Operation Status */}
            {RemoteData.fold({
                notAsked: () => null,
                loading: () => null,
                failure: (error) => (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>Error: {String(error)}</Text>
                        <Button title="Dismiss" onPress={actions.clearError} />
                    </View>
                ),
                success: () => (
                    <View style={styles.successBanner}>
                        <Text style={styles.successText}>Operation successful!</Text>
                        <Button title="Dismiss" onPress={actions.clearError} />
                    </View>
                ),
            }, model.operationStatus)}

            {/* List View */}
            {RemoteData.fold({
                notAsked: () => (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No users loaded</Text>
                        <Button title="Load Users" onPress={actions.fetchAll} />
                    </View>
                ),
                loading: () => (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" />
                        <Text style={styles.loadingText}>Loading users...</Text>
                    </View>
                ),
                failure: (error) => (
                    <View style={styles.error}>
                        <Text style={styles.errorText}>Error loading users: {String(error)}</Text>
                        <Button title="Retry" onPress={actions.fetchAll} />
                    </View>
                ),
                success: (users) => (
                    users.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No users found</Text>
                            <Button title="Create First User" onPress={actions.startCreate} />
                        </View>
                    ) : (
                        <FlatList
                            data={users}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <UserItem
                                    user={item}
                                    onPress={() => actions.selectItem(item.id)}
                                    onEdit={() => actions.startEdit(item.id)}
                                    onDelete={() => actions.delete(item.id)}
                                />
                            )}
                        />
                    )
                ),
            }, model.items)}

            {/* Create/Edit Modal */}
            {(model.isCreating || model.isEditing) && (
                <View style={styles.modal}>
                    <View style={styles.modalContent}>
                        <UserForm
                            user={RemoteData.withDefault(null, model.selectedItem)}
                            onSave={(data) => {
                                if (model.isEditing && model.editingId) {
                                    actions.update(model.editingId, data);
                                } else {
                                    actions.create(data);
                                }
                            }}
                            onCancel={actions.cancelEdit}
                        />
                    </View>
                </View>
            )}

            {/* Detail View */}
            {RemoteData.fold({
                notAsked: () => null,
                loading: () => null,
                failure: () => null,
                success: (user) => (
                    <View style={styles.detail}>
                        <Text style={styles.detailTitle}>User Details</Text>
                        <Text style={styles.detailText}>Name: {user.name}</Text>
                        <Text style={styles.detailText}>Email: {user.email}</Text>
                        <Text style={styles.detailText}>Role: {user.role}</Text>
                        <Text style={styles.detailText}>Created: {user.createdAt}</Text>
                        <Button title="Close" onPress={() => actions.selectItem(null)} />
                    </View>
                ),
            }, model.selectedItem)}
        </View>
    );
}

// ============================================
// 5. Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    itemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    role: {
        fontSize: 12,
        color: '#999',
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    form: {
        padding: 16,
        backgroundColor: '#fff',
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    roleButtonText: {
        fontSize: 14,
        color: '#333',
    },
    roleButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    formActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    modal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    detail: {
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailText: {
        fontSize: 16,
        marginBottom: 8,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    error: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        marginBottom: 16,
        textAlign: 'center',
    },
    errorBanner: {
        backgroundColor: '#ffebee',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    successBanner: {
        backgroundColor: '#e8f5e9',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    successText: {
        color: '#2e7d32',
        fontSize: 14,
    },
});
