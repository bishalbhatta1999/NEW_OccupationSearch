import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import {
  Search,
  Plus,
  Download,
  Trash2,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  Calendar,
} from 'lucide-react';

// Types
interface Prospect {
  key: string;    // Firestore doc ID
  client: string; // Now will be "OSCXX" format
  name: string;
  email: string;
  phone: string;
  status: 'Lead' | 'New' | 'Contacted' | 'Qualified' | 'Lost';
  notes: ProspectNote[];
  activities: Activity[];
  companyId: string;
  userId: string;
  createdAt: string;
}

interface ProspectNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

interface Activity {
  id: string;
  type: 'note' | 'meeting' | 'status_change' | 'communication';
  content: string;
  createdAt: Date;
  createdBy: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    meetingDate?: Date;
    communicationType?: string;
  };
}

// Our view states for this component
type ViewMode = 'LIST' | 'CREATE' | 'DETAIL';

/**
 * A full-page Prospect Management component that:
 *  - Lists prospects (with Grid/List toggle)
 *  - Lets you create new prospects (status default = "Lead")
 *  - Lets you view a detail page for each prospect and edit it.
 */
const ProspectManagement: React.FC = () => {
  const [view, setView] = useState<ViewMode>('LIST');
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  // For toggling between grid layout and list layout in the LIST view
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  // All prospects in Firestore
  const [prospects, setProspects] = useState<Prospect[]>([]);

  // For searching by name, email, phone, or client
  const [searchText, setSearchText] = useState('');

  // For CREATE mode: a simple form
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // The selected prospect (for DETAIL mode)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // For editing the prospect in DETAIL mode
  const [editMode, setEditMode] = useState(false);
  const [detailForm, setDetailForm] = useState({
    client: '',
    name: '',
    email: '',
    phone: '',
    status: 'Lead' as Prospect['status'],
  });

  // For adding a note in the DETAIL mode
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // 1. Subscribe to "prospects" collection in Firestore
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!auth.currentUser) return;

    let unsubscribe: (() => void) | undefined;

    const fetchUsers = async () => {
      try {
        if (!auth.currentUser) {
          setError('No authenticated user');
          return;
        }

        // Get user's company ID
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          setError('User document not found');
          return;
        }
        const userData = userDoc.data();
        setUserCompanyId(userData.companyId || null);

        setLoading(true);
        setError(null);

        // Query prospects for user's company only
        const prospectsRef = collection(db, 'prospects');
        const q = query(
          prospectsRef,
          where('companyId', '==', userData.companyId)
        );

        // Set up real-time listener
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const fetched: Prospect[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                key: docSnap.id,           
                client: data.client || '', 
                name: data.name,
                email: data.email,
                phone: data.phone,
                status: data.status,
                companyId: data.companyId,
                userId: data.userId,
                createdAt: data.createdAt,
                // Convert Timestamps -> JS Dates
                notes: (data.notes || []).map((n: any) => ({
                  ...n,
                  createdAt: n.createdAt?.toDate
                    ? n.createdAt.toDate()
                    : new Date(n.createdAt),
                })),
                activities: (data.activities || []).map((a: any) => ({
                  ...a,
                  createdAt: a.createdAt?.toDate
                    ? a.createdAt.toDate()
                    : new Date(a.createdAt),
                })),
              } as Prospect;
            });
            setProspects(fetched);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching prospects:', err);
            setError('Failed to load prospects');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error fetching prospects:', err);
        setError('Failed to load prospects');
        setLoading(false);
      }
    };

    fetchUsers();

    // Cleanup: unsubscribe if it exists
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [auth.currentUser]);

  // ----------------------------------------------------------------
  // 2. Filtered prospects by search text
  // ----------------------------------------------------------------
  const filteredProspects = prospects.filter((p) => {
    const combined = `${p.client} ${p.name} ${p.email} ${p.phone} ${p.status}`.toLowerCase();
    return combined.includes(searchText.toLowerCase());
  });

  // ----------------------------------------------------------------
  // 3. Export to CSV
  // ----------------------------------------------------------------
  const handleExportCSV = () => {
    const csvLines = [['Client', 'Name', 'Email', 'Phone', 'Status', 'Notes'].join(',')];
    prospects.forEach((p) => {
      const notesArray = p.notes.map((note) => note.content.replace(/,/g, ' '));
      csvLines.push([
        p.client,
        p.name,
        p.email,
        p.phone,
        p.status,
        notesArray.join('; '),
      ].join(','));
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'prospects.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------------------
  // 4. Create a New Prospect
  //    client ID in the format "OSC<number>"
  // ----------------------------------------------------------------
  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !userCompanyId) {
      throw new Error('User not authenticated or no company ID');
    }

    try {
      const newProspect = {
        // We'll fill `client` after we get the docRef back
        client: '', 
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        status: 'Lead' as Prospect['status'],
        notes: [],
        activities: [
          {
            id: Date.now().toString(),
            type: 'note',
            content: 'Prospect created',
            createdAt: new Date(),
            createdBy: auth.currentUser?.email || 'Unknown',
          },
        ],
        companyId: userCompanyId,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      // 1) Add the doc
      const docRef = await addDoc(collection(db, 'prospects'), newProspect);

      // 2) Build your custom client ID string. 
      //    Below is a naive approach using existing prospects count + 1. 
      //    Adjust as needed (random, auto-increment, etc.).
      const clientNumber = prospects.length + 1;
      const customClientId = `OSC${clientNumber}`;

      // 3) Update that doc with client = customClientId
      await updateDoc(doc(db, 'prospects', docRef.id), { client: customClientId });

      // Reset form, go back to list
      setCreateForm({ name: '', email: '', phone: '' });
      setView('LIST');
    } catch (err) {
      console.error('Error creating prospect:', err);
    }
  };

  // ----------------------------------------------------------------
  // 5. Select a Prospect -> Go to DETAIL
  // ----------------------------------------------------------------
  const handleSelectProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setEditMode(false); // read-only by default
    setDetailForm({
      client: prospect.client,
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone,
      status: prospect.status,
    });
    setView('DETAIL');
  };

  // ----------------------------------------------------------------
  // 6. Delete a Prospect
  // ----------------------------------------------------------------
  const handleDeleteProspect = async (prospect: Prospect, e: React.MouseEvent) => {
    e.stopPropagation(); // don't open detail
    if (!auth.currentUser) return;
    if (!window.confirm(`Are you sure you want to delete ${prospect.name}?`)) return;

    try {
      await deleteDoc(doc(db, 'prospects', prospect.key));
    } catch (err) {
      console.error('Error deleting prospect:', err);
    }
  };

  // ----------------------------------------------------------------
  // 7. Update Prospect (DETAIL mode)
  // ----------------------------------------------------------------
  const handleSaveDetail = async () => {
    if (!selectedProspect) return;
    if (!auth.currentUser) return;

    try {
      const { client, name, email, phone, status } = detailForm;
      const updates: any = {
        client,
        name,
        email,
        phone,
        status,
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid,
      };

      // If the status changed, add a 'status_change' activity
      if (status !== selectedProspect.status) {
        const statusActivity = {
          id: Date.now().toString(),
          type: 'status_change',
          content: `Status changed from ${selectedProspect.status} to ${status}`,
          createdAt: new Date(),
          createdBy: auth.currentUser?.email || 'Unknown',
          metadata: {
            oldStatus: selectedProspect.status,
            newStatus: status,
          },
        };
        const currentActivities = selectedProspect.activities || [];
        updates.activities = [...currentActivities, statusActivity];
      }

      await updateDoc(doc(db, 'prospects', selectedProspect.key), updates);

      setEditMode(false);
      // Update local state so detail page is in sync
      setSelectedProspect((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error('Error updating prospect:', err);
    }
  };

  // ----------------------------------------------------------------
  // 8. Add a Note (DETAIL mode)
  // ----------------------------------------------------------------
  const handleAddNote = async () => {
    if (!selectedProspect) return;
    if (!newNote.trim()) return;
    if (!auth.currentUser) return;

    try {
      const note: ProspectNote = {
        id: Date.now().toString(),
        content: newNote.trim(),
        createdAt: new Date(),
        createdBy: auth.currentUser.email || 'Unknown',
      };
      const activity: Activity = {
        id: Date.now().toString(),
        type: 'note',
        content: newNote.trim(),
        createdAt: new Date(),
        createdBy: auth.currentUser.email || 'Unknown',
      };

      const newNotes = [...selectedProspect.notes, note];
      const newActivities = [...selectedProspect.activities, activity];

      await updateDoc(doc(db, 'prospects', selectedProspect.key), {
        notes: newNotes,
        activities: newActivities,
      });

      // Clear input
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  // ----------------------------------------------------------------
  // RENDER: LIST VIEW
  // ----------------------------------------------------------------
  const renderListView = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Prospect Management</h2>
          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Toggle Grid / List */}
            <button
              onClick={() => setLayout((prev) => (prev === 'grid' ? 'list' : 'grid'))}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              {layout === 'grid' ? 'View as List' : 'View as Grid'}
            </button>

            {/* Add Prospect (go to CREATE mode) */}
            <button
              onClick={() => {
                setCreateForm({ name: '', email: '', phone: '' });
                setView('CREATE');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Prospect
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Prospects */}
        {layout === 'grid' ? (
          // GRID layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProspects.map((prospect) => (
              <div
                key={prospect.key}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer relative"
                onClick={() => handleSelectProspect(prospect)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {prospect.name}
                    </h3>
                    <p className="text-sm text-gray-500">{prospect.email}</p>
                    <p className="text-sm text-gray-500">{prospect.phone}</p>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteProspect(prospect, e)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      prospect.status === 'Lead'
                        ? 'bg-purple-100 text-purple-800'
                        : prospect.status === 'New'
                        ? 'bg-blue-100 text-blue-800'
                        : prospect.status === 'Contacted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : prospect.status === 'Qualified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {prospect.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // LIST layout
          <div className="space-y-2">
            {filteredProspects.map((prospect) => (
              <div
                key={prospect.key}
                className="border-b py-3 px-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelectProspect(prospect)}
              >
                <div>
                  <div className="font-semibold">{prospect.name}</div>
                  <div className="text-sm text-gray-500">{prospect.email}</div>
                  <div className="text-sm text-gray-500">{prospect.phone}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      prospect.status === 'Lead'
                        ? 'bg-purple-100 text-purple-800'
                        : prospect.status === 'New'
                        ? 'bg-blue-100 text-blue-800'
                        : prospect.status === 'Contacted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : prospect.status === 'Qualified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {prospect.status}
                  </span>
                  <button
                    onClick={(e) => handleDeleteProspect(prospect, e)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------------------
  // RENDER: CREATE VIEW
  // ----------------------------------------------------------------
  const renderCreateView = () => (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Add New Prospect</h3>
        <button
          onClick={() => setView('LIST')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
      </div>
      <form onSubmit={handleCreateProspect} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex justify-end mt-6 gap-3">
          <button
            type="button"
            onClick={() => setView('LIST')}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Prospect
          </button>
        </div>
      </form>
    </div>
  );

  // ----------------------------------------------------------------
  // RENDER: DETAIL VIEW
  // ----------------------------------------------------------------
  const renderDetailView = () => {
    if (!selectedProspect) return null;

    // Sort activities newest -> oldest
    const activitiesSorted = [...selectedProspect.activities].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setView('LIST');
              setSelectedProspect(null);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Prospects
          </button>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Prospect
            </button>
          ) : (
            <button
              onClick={handleSaveDetail}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>

        {/* Prospect Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4 max-w-xl">
          {/* Client (disabled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <input
              type="text"
              value={detailForm.client}
              className="w-full px-3 py-2 border rounded-lg bg-gray-100"
              disabled
            />
          </div>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            {editMode ? (
              <input
                type="text"
                value={detailForm.name}
                onChange={(e) => setDetailForm({ ...detailForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{detailForm.name}</p>
            )}
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {editMode ? (
              <input
                type="email"
                value={detailForm.email}
                onChange={(e) => setDetailForm({ ...detailForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{detailForm.email}</p>
            )}
          </div>
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {editMode ? (
              <input
                type="tel"
                value={detailForm.phone}
                onChange={(e) => setDetailForm({ ...detailForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800">{detailForm.phone}</p>
            )}
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {editMode ? (
              <select
                value={detailForm.status}
                onChange={(e) =>
                  setDetailForm({ ...detailForm, status: e.target.value as Prospect['status'] })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Lead">Lead</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
              </select>
            ) : (
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  detailForm.status === 'Lead'
                    ? 'bg-purple-100 text-purple-800'
                    : detailForm.status === 'New'
                    ? 'bg-blue-100 text-blue-800'
                    : detailForm.status === 'Contacted'
                    ? 'bg-yellow-100 text-yellow-800'
                    : detailForm.status === 'Qualified'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {detailForm.status}
              </span>
            )}
          </div>
        </div>

        {/* Add Note */}
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-xl space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Add Note</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note..."
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddNote}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-xl">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h4>
          {activitiesSorted.length === 0 ? (
            <p className="text-sm text-gray-500">No activities yet.</p>
          ) : (
            <div className="relative space-y-6">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 w-0.5 bg-gray-200 h-full" />
              {activitiesSorted.map((act) => (
                <div key={act.id} className="relative pl-10">
                  {/* Icon Circle */}
                  <div className="absolute left-0 p-2 rounded-full bg-white border-2 border-blue-500">
                    {act.type === 'note' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                    {act.type === 'status_change' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {act.type === 'meeting' && (
                      <Calendar className="w-4 h-4 text-purple-500" />
                    )}
                    {act.type === 'communication' && (
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  {/* Activity Content */}
                  <div className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">
                        {act.type === 'note'
                          ? 'Note'
                          : act.type === 'status_change'
                          ? 'Status Change'
                          : act.type === 'meeting'
                          ? 'Meeting'
                          : 'Communication'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {act.createdAt.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{act.content}</p>
                    {act.metadata && act.type === 'status_change' && (
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500 mr-1">Old:</span>
                        <span className="font-medium">{act.metadata.oldStatus}</span>
                        <span className="mx-1 text-gray-400">→</span>
                        <span className="font-medium">{act.metadata.newStatus}</span>
                      </div>
                    )}
                    <div className="mt-1 text-xs text-gray-500">
                      By: {act.createdBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------
  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      {view === 'LIST' && renderListView()}
      {view === 'CREATE' && renderCreateView()}
      {view === 'DETAIL' && renderDetailView()}
    </div>
  );
};

export default ProspectManagement;