import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

/** Define the shape of the form data */
interface ProspectFormData {
  name: string;
  email: string;
  phone: string;
  notes: string[];
}

/** Define props for the modal */
interface ProspectFormModalProps {
  /** Whether the modal is currently open or not */
  isOpen: boolean;
  /** Handler to close the modal (e.g., setIsOpen(false)) */
  onClose: () => void;
  /**
   * (Optional) Callback when the user submits the form.
   * You could still call this after adding to Firestore if you want parent updates.
   */
  onSubmit?: (data: ProspectFormData) => Promise<void> | void;

  /** Optionally let parent supply initial field values, if needed. */
  initialData?: Partial<ProspectFormData>;
  /** Optional: If you want a custom title, pass it. Otherwise default to "Add Prospect". */
  title?: string;
}

/**
 * A reusable modal form for adding/editing a prospect's basic info + notes.
 */
const ProspectFormModal: React.FC<ProspectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Add Prospect",
}) => {
  // Local state for form fields
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [notes, setNotes] = useState<string[]>(initialData?.notes || []);

  if (!isOpen) {
    return null; // If closed, render nothing
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // We'll create a new prospect doc with status = "Lead" and a placeholder for "client"
      const newProspect = {
        client: "", // We will set this to docRef.id right after creation
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.map(n => n.trim()).filter(Boolean),
        status: "Lead",
        // You could also add an activities array if you want:
        // activities: [
        //   {
        //     id: Date.now().toString(),
        //     type: 'note',
        //     content: 'Prospect created',
        //     createdAt: new Date(),
        //     createdBy: '...',
        //   }
        // ]
      };

      const docRef = await addDoc(collection(db, 'prospects'), newProspect);
      // Immediately update the "client" field to match the doc ID
      await updateDoc(doc(db, 'prospects', docRef.id), { client: docRef.id });

      // If a parent onSubmit callback was provided, call it
      if (onSubmit) {
        await onSubmit({ name, email, phone, notes });
      }

      // Close the modal
      onClose();
    } catch (err) {
      console.error("Error adding document:", err);
    }
  };

  // Dynamic notes logic
  const handleAddNote = () => {
    setNotes((prev) => [...prev, ""]);
  };

  const handleNoteChange = (index: number, value: string) => {
    setNotes((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveNote = (index: number) => {
    setNotes((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 px-2 py-1 text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>

        <h3 className="text-xl font-semibold mb-4">{title}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grid layout for name, email, phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            {notes.map((note, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter note"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNote(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
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

          {/* Action Buttons */}
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProspectFormModal;