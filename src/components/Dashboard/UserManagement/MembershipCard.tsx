import React, { useState } from 'react';
import { Users, UserPlus, Shield, Trash2, Edit2 } from 'lucide-react';
import { addMember, removeMember, updateMemberRole, type MemberRole } from '../../../lib/membership';

interface Member {
  userId: string;
  role: MemberRole;
  email: string;
  name: string;
  avatar?: string;
}

interface MembershipCardProps {
  tenantId: string;
  members: Member[];
  onMemberUpdate: () => void;
}

export default function MembershipCard({ tenantId, members, onMemberUpdate }: MembershipCardProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member');
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    try {
      // Check if company has reached user limit
      const companyRef = doc(db, 'companies', tenantId);
      const companySnap = await getDoc(companyRef);
      
      if (!companySnap.exists()) {
        throw new Error('Company not found');
      }
      
      const companyData = companySnap.data();
      if (companyData.users.length >= companyData.maxUsers) {
        throw new Error('Maximum number of users reached (3)');
      }

      // In a real app, you'd send an invitation email here
      // For now, we'll just create the membership
      await addMember(tenantId, inviteEmail, selectedRole);
      
      // Update company users array
      await updateDoc(companyRef, {
        users: [...companyData.users, inviteEmail],
        updatedAt: new Date().toISOString()
      });

      onMemberUpdate();
      setShowInviteModal(false);
      setInviteEmail('');
      setSelectedRole('member');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember(tenantId, userId);
      onMemberUpdate();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: MemberRole) => {
    try {
      await updateMemberRole(tenantId, userId, newRole);
      onMemberUpdate();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-600">{members.length} members</p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="divide-y divide-gray-200">
        {members.map((member) => (
          <div key={member.userId} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.userId, e.target.value as MemberRole)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>

                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Invite Team Member</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}