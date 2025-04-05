import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // IMPORTANT: same path as in ProspectManagement

interface ProspectFormData {
  name: string;
  email: string;
  phone: string;
  notes: string[];
}

interface ProspectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProspectFormData) => void;
  title?: string;
  initialData?: Partial<ProspectFormData>;
}

const ProspectFormModal: React.FC<ProspectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Prospect Details',
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [notes, setNotes] = useState<string[]>(initialData?.notes || []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = { name, email, phone, notes };

    // 1) Store to Firestore "prospects"
    try {
      await addDoc(collection(db, 'prospects'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      console.log('Prospect stored successfully in Firestore.');
    } catch (err) {
      console.error('Error storing prospect:', err);
      alert('Failed to store prospect in Firestore.');
    }

    // 2) Let parent do PDF or other logic
    onSubmit(formData);

    // 3) Close modal
    onClose();
  };

  // Note management
  const handleAddNote = () => {
    setNotes(prev => [...prev, '']);
  };
  const handleNoteChange = (index: number, value: string) => {
    setNotes(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  const handleRemoveNote = (index: number) => {
    setNotes(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 flex justify-center items-start">
      <div
        className="
          mt-16
          w-full
          max-w-md
          bg-white
          rounded-lg
          p-6
          shadow-lg
          relative
        "
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>

        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border rounded-lg"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            {notes.map((note, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter note"
                  value={note}
                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNote(idx)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddNote}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Note
            </button>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProspectFormModal;