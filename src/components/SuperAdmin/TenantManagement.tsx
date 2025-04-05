import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Building2, Users, Settings, AlertCircle, Plus } from 'lucide-react';
import type { Tenant } from '../../types/tenant';

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    domain: '',
    email: '',
    password: '',
    role: 'admin'
  });

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      setError(null);

      try {
        const tenantsRef = collection(db, 'tenants');
        const snapshot = await getDocs(tenantsRef);
        const tenantData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Tenant[];

        setTenants(tenantData);
      } catch (err) {
        console.error('Error fetching tenants:', err);
        setError('Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleStatusChange = async (tenantId: string, newStatus: Tenant['status']) => {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setTenants(prev => 
        prev.map(t => 
          t.id === tenantId ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error('Error updating tenant status:', err);
      setError('Failed to update tenant status');
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create tenant document
      const tenantRef = await addDoc(collection(db, 'tenants'), {
        name: createForm.name,
        domain: createForm.domain,
        plan: 'free',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Call Cloud Function to create user
      const functions = getFunctions();
      const createTenantUser = httpsCallable(functions, 'createTenantUser');
      await createTenantUser({
        email: createForm.email,
        password: createForm.password,
        tenantId: tenantRef.id,
        role: createForm.role
      });

      // Reset form & close modal
      setCreateForm({
        name: '',
        domain: '',
        email: '',
        password: '',
        role: 'admin'
      });
      setShowCreateModal(false);

      // Refresh tenants list
      fetchTenants();
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError('Failed to create tenant and user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
            <p className="text-sm text-gray-600">Manage all tenants and their settings</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Tenant
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {tenants.map(tenant => (
          <div 
            key={tenant.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                  <p className="text-sm text-gray-600">{tenant.domain}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                      tenant.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}
                  >
                    {tenant.status}
                  </span>
                  <select
                    value={tenant.status}
                    onChange={(e) => handleStatusChange(tenant.id, e.target.value as Tenant['status'])}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-5 h-5" />
                    <span>Plan: {tenant.plan}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Settings className="w-5 h-5" />
                    <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-5 h-5" />
                    <span>Updated: {new Date(tenant.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Tenant</h3>
            
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tenant Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Domain</label>
                <input
                  type="text"
                  value={createForm.domain}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Admin Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Admin Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Tenant'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;