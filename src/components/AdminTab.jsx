import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Users,
    Trash2,
    UserCheck,
    Plus,
    Pencil,
    Check,
} from 'lucide-react'
import axios from 'axios'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import config from '../config'
import { cn } from '../utils/cn'
import { cycleTableSort } from '../utils/tableSort'
import Modal from './Modal'
import { Button, SearchInput, Table, Pagination, SelectDropdown } from './ui'
import EmptyState from './EmptyState'

const API_URL = config.API_URL

const modalInputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/25'

function formatDateDDMMYY(dateString) {
    if (!dateString) return '—'
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return '—'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

/** Role pills — Manager purple, Sales blue (matches Manage Team mocks). */
function getRoleBadgeClass(role) {
    const r = String(role || '').toUpperCase()
    if (r === 'MANAGER') return 'bg-violet-100 text-violet-800'
    if (r === 'SALES') return 'bg-sky-100 text-sky-800'
    if (r === 'ADMIN') return 'bg-indigo-100 text-indigo-800'
    if (r === 'SUPER_USER') return 'bg-rose-100 text-rose-800'
    return 'bg-gray-100 text-gray-800'
}

function formatRoleLabel(role) {
    if (!role) return ''
    return String(role)
        .split('_')
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ')
}

function getEditRoleValues(isSuperUser, editingUserRole) {
    if (isSuperUser) return ['USER', 'ADMIN', 'MANAGER', 'SALES', 'SUPER_USER']
    if (editingUserRole === 'ADMIN') return ['ADMIN', 'MANAGER', 'SALES']
    return ['MANAGER', 'SALES']
}

function getCreateRoleValues(isSuperUser) {
    if (isSuperUser) return ['ADMIN', 'MANAGER', 'SALES']
    return ['MANAGER', 'SALES']
}

function RoleCheckOptions({ value, onChange, options, disabled }) {
    return (
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Role">
            {options.map((role) => {
                const selected = value === role
                return (
                    <button
                        key={role}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={disabled}
                        onClick={() => onChange(role)}
                        className={cn(
                            'flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left transition sm:px-4',
                            selected
                                ? 'border-brand-teal  shadow-sm ring-1 ring-brand-teal/20'
                                : 'border-gray-200 bg-white hover:border-gray-300',
                            disabled && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        <span className="text-sm font-semibold text-gray-900">{formatRoleLabel(role)}</span>
                        {selected ? (
                        <span
                            className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full  transition-colors',
                                // selected
                                //     ? 'border-brand-teal bg-brand-teal text-white'
                                //     : 'border-gray-300 bg-white text-transparent'
                            )}
                            aria-hidden
                        >
                            <img src="/svgs/whatsapp/check.svg" alt="Check" className="h-5 w-5 object-contain" />
                        </span>
                        ) : null}
                    </button>
                )
            })}
        </div>
    )
}

export default function AdminTab() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [tenants, setTenants] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [tenantFilter, setTenantFilter] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [updating, setUpdating] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [newUserFullName, setNewUserFullName] = useState('')
    const [newUserRole, setNewUserRole] = useState('MANAGER')
    const [newUserTenantId, setNewUserTenantId] = useState('')
    const [newUserIsActive, setNewUserIsActive] = useState(true)
    const [creating, setCreating] = useState(false)
    const [editUser, setEditUser] = useState(null)
    const [editFullName, setEditFullName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editRole, setEditRole] = useState('')
    const [editStatusActive, setEditStatusActive] = useState(true)
    const [userSort, setUserSort] = useState({ column: null, dir: null })
    const { showToast, ToastContainer } = useToast()

    const isSuperUser = currentUser?.role === 'SUPER_USER' || currentUser?.is_super_user
    const isAdmin = currentUser?.role === 'ADMIN' || isSuperUser

    useEffect(() => {
        fetchUsers()
        if (isSuperUser) {
            fetchTenants()
        }
    }, [page, searchQuery, tenantFilter])

    const fetchTenants = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tenants/`, { params: { page: 1, page_size: 1000 } })
            setTenants(response.data.items || [])
        } catch (error) {
            console.error('Failed to fetch tenants:', error)
        }
    }

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params = { page, page_size: pageSize }
            if (searchQuery.trim()) {
                params.search = searchQuery.trim()
            }
            if (isSuperUser && tenantFilter) {
                params.tenant_id = tenantFilter
            }
            const response = await axios.get(`${API_URL}/api/auth/users`, { params })
            setUsers(response.data.items)
            setTotalPages(response.data.pages)
        } catch (error) {
            console.error('Failed to fetch users:', error)
            if (error.response?.status === 403) {
                showToast('Access denied. Admin privileges required.', 'error')
            } else {
                showToast('Failed to fetch users: ' + (error.response?.data?.detail || error.message), 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value)
        setPage(1)
    }

    const openEditUser = (user) => {
        setEditUser(user)
        setEditFullName(user.full_name || '')
        setEditEmail(user.email || '')
        setEditRole(user.role || 'MANAGER')
        setEditStatusActive(Boolean(user.is_active))
    }

    const closeEditUser = () => {
        setEditUser(null)
        setEditFullName('')
        setEditEmail('')
        setEditRole('')
        setEditStatusActive(true)
    }

    const resetCreateForm = () => {
        setNewUserEmail('')
        setNewUserPassword('')
        setNewUserFullName('')
        setNewUserRole('MANAGER')
        setNewUserTenantId('')
        setNewUserIsActive(true)
    }

    const handleSaveUserDetails = async () => {
        if (!editUser) return
        setUpdating(true)
        try {
            await axios.patch(`${API_URL}/api/auth/users/${editUser.id}`, {
                full_name: editFullName.trim() || null,
                email: editEmail.trim(),
                role: editRole,
            })
            if (canToggleActive(editUser) && editStatusActive !== Boolean(editUser.is_active)) {
                await axios.patch(`${API_URL}/api/auth/users/${editUser.id}/status`, {
                    is_active: editStatusActive,
                })
            }
            showToast('User updated successfully', 'success')
            closeEditUser()
            fetchUsers()
        } catch (error) {
            console.error('Failed to update user:', error)
            showToast('Failed to update user: ' + (error.response?.data?.detail || error.message), 'error')
        } finally {
            setUpdating(false)
        }
    }

    const setUserActive = async (userId, nextActive) => {
        setUpdating(true)
        try {
            await axios.patch(`${API_URL}/api/auth/users/${userId}/status`, { is_active: nextActive })
            showToast(nextActive ? 'User activated' : 'User deactivated', 'success')
            fetchUsers()
        } catch (error) {
            console.error('Failed to update status:', error)
            showToast(error.response?.data?.detail || error.message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handleCreateUser = async () => {
        if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserFullName.trim()) {
            showToast('Please fill in all fields', 'error')
            return
        }

        if (isSuperUser && newUserRole === 'ADMIN' && !newUserTenantId) {
            showToast('Please select a tenant for Admin user', 'error')
            return
        }

        setCreating(true)
        try {
            let createdId = null
            if (isSuperUser && newUserRole === 'ADMIN') {
                const res = await axios.post(`${API_URL}/api/auth/users/admin`, {
                    email: newUserEmail.trim(),
                    password: newUserPassword,
                    full_name: newUserFullName.trim(),
                    tenant_id: newUserTenantId
                })
                createdId = res.data?.id
                showToast('Admin user created successfully', 'success')
            } else {
                const res = await axios.post(`${API_URL}/api/auth/users`, {
                    email: newUserEmail.trim(),
                    password: newUserPassword,
                    full_name: newUserFullName.trim(),
                    role: newUserRole
                })
                createdId = res.data?.id
                showToast(`${newUserRole} user created successfully`, 'success')
            }
            if (createdId && !newUserIsActive) {
                await axios.patch(`${API_URL}/api/auth/users/${createdId}/status`, { is_active: false })
            }
            setIsCreateModalOpen(false)
            resetCreateForm()
            fetchUsers()
        } catch (error) {
            console.error('Failed to create user:', error)
            const errorMessage = error.response?.data?.detail || error.message
            if (error.response?.status === 403) {
                showToast(errorMessage, 'error')
            } else {
                showToast('Failed to create user: ' + errorMessage, 'error')
            }
        } finally {
            setCreating(false)
        }
    }

    const getTenantName = (tenantId) => {
        if (!tenantId) return 'N/A'
        const tenant = tenants.find(t => t.id === tenantId)
        return tenant?.name || 'Unknown'
    }

    const sortedUsers = useMemo(() => {
        const list = [...users]
        const key = userSort.column
        const dir = userSort.dir
        if (!key || !dir) return list
        const mult = dir === 'asc' ? 1 : -1
        list.sort((a, b) => {
            let cmp = 0
            if (key === 'created_at') {
                cmp = new Date(a.created_at || 0) - new Date(b.created_at || 0)
            } else if (key === 'role') {
                cmp = String(a.role || '').localeCompare(String(b.role || ''))
            } else if (key === 'email') {
                cmp = String(a.email || '').localeCompare(String(b.email || ''))
            } else if (key === 'tenant') {
                cmp = getTenantName(a.tenant_id).localeCompare(getTenantName(b.tenant_id))
            } else {
                cmp = String(a.full_name || '').localeCompare(String(b.full_name || ''))
            }
            return cmp * mult
        })
        return list
    }, [users, userSort, tenants])

    const onUserSort = useCallback((columnId) => {
        setUserSort((prev) => cycleTableSort(columnId, prev))
    }, [])

    const handleDeactivateClick = (user) => {
        if (!window.confirm('Deactivate this user? They will no longer be able to sign in.')) return
        setUserActive(user.id, false)
    }

    const canToggleActive = (user) => {
        if (user.role === 'SUPER_USER' && !isSuperUser) return false
        if (user.id === currentUser?.id) return false
        return true
    }

    return (
        <>
            <ToastContainer />
            <div className="mx-auto flex min-h-[calc(100vh-6.5rem)] flex-col p-6">
                <div className="mb-4 shrink-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Add and Manage Users</h2>
                            <p className="mt-1 text-sm text-gray-600">Manage users and account activation</p>
                        </div>
                        {(isSuperUser || isAdmin) && (
                            <Button
                                type="button"
                                variant="primary"
                                className="shrink-0 gap-2 px-5"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <Plus className="h-4 w-4" strokeWidth={2} />
                                Add User
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex shrink-0 flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-bold text-gray-900">All Users</h3>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                            { users.length !== 0 &&
                            <SearchInput
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search here..."
                                className="w-full md:min-w-[440px]"
                                dashboardInput
                            />
}
                            {isSuperUser && (
                                <select
                                    value={tenantFilter}
                                    onChange={(e) => {
                                        setTenantFilter(e.target.value)
                                        setPage(1)
                                    }}
                                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-teal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/25"
                                >
                                    <option value="">All Tenants</option>
                                    {tenants.filter((t) => t.is_active).map((tenant) => (
                                        <option key={tenant.id} value={tenant.id}>
                                            {tenant.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-16">
                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-brand-teal" />
                            <p className="mt-4 text-sm text-gray-500">Loading users…</p>
                        </div>
                    ) : users.length === 0 ? (
                        searchQuery.trim() || tenantFilter ? (
                            <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-16 text-center">
                                <p className="text-sm font-medium text-gray-700">No users found</p>
                                <p className="mt-2 text-sm text-gray-500">
                                    No results match your filters. Try adjusting search or tenant.
                                </p>
                            </div>
                        ) : (
                            <EmptyState
                                icon="/admin/users"
                                title="No users added yet"
                                description="Once you add a user, it will appear here."
                                spacious={false}
                            />
                        )
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
                            <Table
                                columns={[
                                    {
                                        id: 'full_name',
                                        label: 'Full name',
                                        sortable: true,
                                        render: (row) => (
                                            <span className={cn(!row.is_active && 'text-gray-400')}>
                                                {row.full_name || '—'}
                                                {!row.is_active ? (
                                                    <span className="ml-2 text-xs font-medium text-gray-400">
                                                        (Inactive)
                                                    </span>
                                                ) : null}
                                            </span>
                                        ),
                                    },
                                    { id: 'email', label: 'Email', sortable: true, accessor: 'email' },
                                    ...(isSuperUser
                                        ? [
                                              {
                                                  id: 'tenant',
                                                  label: 'Organization',
                                                  sortable: true,
                                                  accessor: (row) => getTenantName(row.tenant_id),
                                              },
                                          ]
                                        : []),
                                    {
                                        id: 'role',
                                        label: 'Role',
                                        sortable: true,
                                        render: (row) => (
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                    getRoleBadgeClass(row.role)
                                                )}
                                            >
                                                {formatRoleLabel(row.role)}
                                            </span>
                                        ),
                                    },
                                    {
                                        id: 'created_at',
                                        label: 'Created',
                                        sortable: true,
                                        accessor: (row) => formatDateDDMMYY(row.created_at),
                                    },
                                    {
                                        id: 'actions',
                                        label: 'Actions',
                                        sortable: false,
                                        headerClassName: 'w-[120px]',
                                        cellClassName: 'w-[120px]',
                                        render: (row) => (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditUser(row)}
                                                    disabled={updating || (row.role === 'SUPER_USER' && !isSuperUser)}
                                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                                                    aria-label="Edit user"
                                                >
                                                    <Pencil className="h-4 w-4" strokeWidth={2} />
                                                </button>
                                                {row.is_active && canToggleActive(row) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeactivateClick(row)}
                                                        disabled={updating}
                                                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                        aria-label="Deactivate user"
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                                                    </button>
                                                ) : null}
                                                {!row.is_active && canToggleActive(row) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setUserActive(row.id, true)}
                                                        disabled={updating}
                                                        className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                                                        aria-label="Activate user"
                                                    >
                                                        <UserCheck className="h-4 w-4" strokeWidth={2} />
                                                    </button>
                                                ) : null}
                                            </div>
                                        ),
                                    },
                                ]}
                                data={sortedUsers}
                                keyExtractor={(row) => row.id}
                                onSortClick={onUserSort}
                                sortColumnId={userSort.column}
                                sortDirection={userSort.dir}
                                className="!pt-0 sm:!pt-0"
                                minWidth="880px"
                            />
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                className="shrink-0 border-t border-gray-100 pb-4"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Only mount when editUser is set — Modal returns null when closed but children JSX still evaluates */}
            {editUser ? (
                <Modal
                    isOpen
                    onClose={closeEditUser}
                    title="Edit User"
                    panelClassName="rounded-xl shadow-xl max-h-[min(92vh,680px)]"
                >
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900">Full Name</label>
                                <input
                                    type="text"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    className={modalInputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900">Email</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className={modalInputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900">Role</label>
                                <RoleCheckOptions
                                    value={editRole}
                                    onChange={setEditRole}
                                    options={getEditRoleValues(isSuperUser, editUser.role)}
                                    disabled={editUser.role === 'SUPER_USER' && !isSuperUser}
                                />
                            </div>
                            <SelectDropdown
                                label="Status"
                                variant="field"
                                value={editStatusActive ? 'active' : 'inactive'}
                                onChange={(v) => setEditStatusActive(v === 'active')}
                                disabled={!canToggleActive(editUser)}
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                                leading={
                                    <span
                                        className={cn(
                                            'inline-block h-2 w-2 shrink-0 rounded-full',
                                            // editStatusActive ? 'bg-emerald-500' : 'bg-gray-400'
                                        )}
                                        aria-hidden
                                    />
                                }
                            />
                        </div>
                        <div className="mt-4 flex shrink-0 gap-3 border-t border-gray-100 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-[44px] flex-1"
                                onClick={closeEditUser}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                className="min-h-[44px] flex-1"
                                onClick={handleSaveUserDetails}
                                disabled={updating}
                            >
                                {updating ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            ) : null}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    resetCreateForm()
                }}
                title="Add New User"
                panelClassName="rounded-xl shadow-xl max-h-[min(92vh,680px)]"
            >
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">Full Name</label>
                            <input
                                type="text"
                                value={newUserFullName}
                                onChange={(e) => setNewUserFullName(e.target.value)}
                                placeholder="John Doe"
                                className={modalInputClass}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">Email</label>
                            <input
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="john@example.com"
                                className={modalInputClass}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">Password</label>
                            <input
                                type="password"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                placeholder="••••••••"
                                className={modalInputClass}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900">Role</label>
                            <RoleCheckOptions
                                value={newUserRole}
                                onChange={setNewUserRole}
                                options={getCreateRoleValues(isSuperUser)}
                                disabled={false}
                            />
                        </div>
                        <SelectDropdown
                            label="Status"
                            variant="field"
                            value={newUserIsActive ? 'active' : 'inactive'}
                            onChange={(v) => setNewUserIsActive(v === 'active')}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            leading={
                                <span
                                    className={cn(
                                        'inline-block h-2 w-2 shrink-0 rounded-full',
                                        newUserIsActive ? 'bg-emerald-500' : 'bg-gray-400'
                                    )}
                                    aria-hidden
                                />
                            }
                        />
                        {isSuperUser && newUserRole === 'ADMIN' && (
                            <SelectDropdown
                                label="Tenant"
                                variant="field"
                                value={newUserTenantId || ''}
                                onChange={setNewUserTenantId}
                                options={[
                                    { value: '', label: 'Select a tenant' },
                                    ...tenants
                                        .filter((t) => t.is_active)
                                        .map((t) => ({ value: t.id, label: t.name })),
                                ]}
                            />
                        )}
                    </div>
                    <div className="mt-4 flex shrink-0 gap-3 border-t border-gray-100 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-[44px] flex-1"
                            onClick={() => {
                                setIsCreateModalOpen(false)
                                resetCreateForm()
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            className="min-h-[44px] flex-1"
                            onClick={handleCreateUser}
                            disabled={creating}
                        >
                            {creating ? 'Adding…' : 'Add User'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
