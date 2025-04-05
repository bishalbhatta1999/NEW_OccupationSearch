import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  deleteDoc,
  setDoc,
  where
} from 'firebase/firestore';
import { db, auth, isSuperAdmin } from '../../lib/firebase';
import MembershipCard from './UserManagement/MembershipCard';
import { getUserMemberships, getTenantMembers } from '../../lib/membership';
import type { MemberRole } from '../../lib/membership';
import TenantManagement from '../SuperAdmin/TenantManagement';
import { useUser } from '../../contexts/UserContext';
import { 
  Shield,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Search,
  Plus
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  role: string; // e.g. 'superAdmin', 'user', 'editor'
}

interface Member {
  userId: string;
  role: MemberRole;
  email: string;
  name: string;
  avatar?: string;
}

const UserManagement: React.FC = () => {
  const { currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users: if admin/superAdmin, fetch all; otherwise, fetch only current user
  const fetchUsers = async () => {
    try {
      if (!auth.currentUser) {
        setError('No authenticated user');
        setIsLoading(false);
        return;
      }

      const superAdminCheck = await isSuperAdmin(auth.currentUser.uid);
      setIsSuperAdminUser(superAdminCheck);
      
      if (superAdminCheck || currentUser?.isAdmin) {
        const usersRef = collection(db, 'users');
        // If superAdmin, get all users. If admin, get users from same company
        const q = superAdminCheck 
          ? query(usersRef)
          : query(usersRef, where('companyId', '==', currentUser?.companyId));

        const snapshot = await getDocs(q);
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(userData);
        setError(null);

        // Get current user's tenant
        const memberships = await getUserMemberships(auth.currentUser.uid);
        if (memberships.length > 0) {
          setCurrentTenantId(memberships[0].tenantId);
          // Fetch members for this tenant
          const tenantMembers = await getTenantMembers(memberships[0].tenantId);
          const memberDetails = await Promise.all(
            tenantMembers.map(async (m) => {
              const userDoc = await getDoc(doc(db, 'users', m.userId));
              const userData = userDoc.data();
              return {
                userId: m.userId,
                role: m.role,
                email: userData?.email || '',
                name: `${userData?.firstName} ${userData?.lastName}`,
                avatar: userData?.profilePicture
              };
            })
          );
          setMembers(memberDetails);
        }
      } else {
        // Non-admin: only fetch own document
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUsers([{ id: userSnap.id, ...userSnap.data() } as User]);
        } else {
          setUsers([]);
          setError('No user data found');
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const searchStr = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchStr) ||
      user.lastName.toLowerCase().includes(searchStr) ||
      user.email.toLowerCase().includes(searchStr)
    );
  });

  // Toggle admin status for a given user
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isAdmin: !currentStatus });
      await fetchUsers();
    } catch (err) {
      console.error('Error updating admin status:', err);
      setError('Failed to update admin status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  // Invitation: only available for superAdmin
  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    try {
      // For demonstration, we create a "pending" user document with invite details.
      // In a production app, you'd send an invitation email and securely create the user.
      const userDocRef = doc(db, 'users', inviteEmail);
      await setDoc(userDocRef, {
        firstName: '',
        lastName: '',
        email: inviteEmail,
        phone: '',
        role: inviteRole,
        isAdmin: false,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      alert('Invitation sent!');
      setInviteEmail('');
      setInviteRole('user');
      setShowInviteModal(false);
      await fetchUsers();
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Failed to invite user');
    }
  };

  const renderListView = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add User Button */}
            <button
              onClick={() => setView('CREATE')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCreateView = () => {
    return (
      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Add New User</h3>
          <button
            onClick={() => setView('LIST')}
            className="text-gray-600 hover:text-gray-800"
          >
            Back to List
          </button>
        </div>
        {/* Add your create user form here */}
        <p className="text-gray-600">Create user form implementation here</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      {/* Show Tenant Management for Super Admins */}
      {isSuperAdminUser && (
        <div className="mb-12">
          <TenantManagement /> 
          <hr className="my-8 border-gray-200" />
        </div>
      )}
      
      {/* User Management Section */}
      {view === 'LIST' && renderListView()}
      {view === 'CREATE' && renderCreateView()}
    </div>
  );
};

export default UserManagement;