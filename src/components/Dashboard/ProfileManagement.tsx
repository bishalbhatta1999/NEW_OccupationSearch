import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  MapPin,
  Upload,
  Save,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { auth, db, storage } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ui/ToastContainer';

/** 
 * Type definition for your user's Firestore fields.
 * Adjust as necessary to match your actual schema.
 */
interface ProfileData {
  // Personal
  firstName: string;
  lastName: string;
  role: string;
  dob: string;
  email: string;
  mobile: string;
  profilePicture: string;

  // Address
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;

  // Registration (if needed)
  agentNumber: string;
  qualifiedCounsellors: string;
  solicitorRegistration: string;
  otherDetail: string;
  publishInfo: boolean;
}

interface InputWithLabelProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

/** 
 * Simple controlled input with a label. 
 * Reusable for your form fields.
 */
const InputWithLabel: React.FC<InputWithLabelProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
}) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const ProfileManagement: React.FC = () => {
  /** 
   * Our custom toast hook. 
   * Show or remove toasts for success/error messages.
   */
  const { showToast, toasts, removeToast } = useToast();

  const [profile, setProfile] = useState<ProfileData>({
    // Personal
    firstName: '',
    lastName: '',
    role: '',
    dob: '',
    email: '',
    mobile: '',
    profilePicture: '',

    // Address
    country: 'Australia',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',

    // Registration (if needed)
    agentNumber: '',
    qualifiedCounsellors: '',
    solicitorRegistration: '',
    otherDetail: '',
    publishInfo: false,
  });

  // Single "loading" boolean for data fetching + saving
  const [loading, setLoading] = useState<boolean>(true);
  // For generic top-level errors (like “Not logged in”)
  const [error, setError] = useState<string | null>(null);
  // For showing a success message when profile is saved
  const [saveSuccess, setSaveSuccess] = useState(false);

  // For retrieving a file from `<input type="file" />`
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------------
  // 1. Load existing user profile from Firestore
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!auth.currentUser) {
        setError('Please sign in to manage your account');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data() || {};
          setProfile(prev => ({
            ...prev,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            role: data.role || '',
            dob: data.dob || '',
            email: data.email || '',
            mobile: data.phone || '',
            profilePicture: data.profilePicture || '',

            // Address
            country: data.country || 'Australia',
            state: data.state || '',
            city: data.city || '',
            addressLine1: data.addressLine1 || '',
            addressLine2: data.addressLine2 || '',
          }));
        }
        setError(null);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // ------------------------------------------------------------------
  // 2. Controlled Input => handle text changes
  // ------------------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // ------------------------------------------------------------------
  // 3. Handle file selection => validate + store as dataURL for preview
  // ------------------------------------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type => only JPEG or PNG
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      showToast('Only JPG and PNG files are allowed', 'error');
      return;
    }
    // Validate file size => 2MB
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be less than 2MB', 'error');
      return;
    }

    try {
      // Convert to base64 dataURL for immediate preview
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          // Mark this new base64 as the “profilePicture”
          setProfile(prev => ({ ...prev, profilePicture: reader.result as string }));
        }
      };
      reader.onerror = () => showToast('Failed to read the image file', 'error');
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file:', err);
      showToast('An error occurred while processing the image', 'error');
    }
  };

  // Let user pick a file
  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  // ------------------------------------------------------------------
  // 4. Remove existing / newly selected image
  // ------------------------------------------------------------------
  const handleRemoveImage = () => {
    setProfile(prev => ({ ...prev, profilePicture: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ------------------------------------------------------------------
  // 5. Save => Upload new image if needed => update Firestore
  // ------------------------------------------------------------------
  const handleSaveProfile = async () => {
    if (!auth.currentUser) {
      setError('Please sign in to save changes');
      return;
    }

    setLoading(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);

      // Prepare data to update
      const updateData: Record<string, any> = {
        firstName: profile.firstName || null,
        lastName: profile.lastName || null,
        role: profile.role || null,
        dob: profile.dob || null,
        phone: profile.mobile || null,
        email: profile.email || null,

        // Address
        country: profile.country || null,
        state: profile.state || null,
        city: profile.city || null,
        addressLine1: profile.addressLine1 || null,
        addressLine2: profile.addressLine2 || null,

        updatedAt: new Date().toISOString(),
      };

      // Remove keys whose values are null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null) {
          delete updateData[key];
        }
      });

      // If new image => profilePicture is base64
      if (profile.profilePicture.startsWith('data:')) {
        // 1) Remove old image if any
        const oldRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        try {
          await deleteObject(oldRef);
        } catch (err) {
          console.log('No old profile picture or error ignoring:', err);
        }

        // 2) Determine correct content type from base64
        //    e.g. "data:image/png;base64,..." => "image/png"
        let contentType = 'image/jpeg';
        if (profile.profilePicture.includes('image/png')) {
          contentType = 'image/png';
        }
        // 3) Upload new
        const newRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        await uploadString(newRef, profile.profilePicture, 'data_url', {
          contentType,
        });

        // 4) getDownloadURL
        const downloadURL = await getDownloadURL(newRef);
        updateData.profilePicture = downloadURL;
      } else if (profile.profilePicture === '') {
        // If user removed the image => delete from storage + remove from Firestore
        const removeRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        try {
          await deleteObject(removeRef);
        } catch (err) {
          console.log('No old profile picture or error ignoring:', err);
        }
        updateData.profilePicture = '';
      }
      // else if it starts with "http..." => do nothing, keep existing image

      // Update Firestore doc
      await updateDoc(userRef, updateData);

      // If we just stored a new image or removed it, reflect that in local state
      setProfile(prev => ({
        ...prev,
        profilePicture: updateData.profilePicture ?? prev.profilePicture,
      }));

      setSaveSuccess(true);
      showToast('Profile updated successfully', 'success');

      // Optionally hide success after 3s
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to update profile. Please try again.');
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // If user not signed in, or error
  if (!auth.currentUser && !error) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-700">Please sign in to access your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl animate-fadeIn">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <p>Profile updated successfully!</p>
          </div>
        </div>
      )}

      {/* Personal Details */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
          </div>

          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div
              className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg 
                          flex items-center justify-center overflow-hidden"
            >
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Remove Image Button */}
            {profile.profilePicture && (
              <button
                onClick={handleRemoveImage}
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-5 h-5" />
                Remove Image
              </button>
            )}
          </div>

          {/* Personal Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputWithLabel
              label="First Name"
              name="firstName"
              value={profile.firstName}
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="Last Name"
              name="lastName"
              value={profile.lastName}
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="Role"
              name="role"
              value={profile.role}
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="Date of Birth"
              name="dob"
              value={profile.dob}
              type="date"
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="Email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
              type="email"
            />
            <InputWithLabel
              label="Mobile Number"
              name="mobile"
              value={profile.mobile}
              onChange={handleInputChange}
              type="tel"
            />
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Address Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputWithLabel
              label="Address Line 1"
              name="addressLine1"
              value={profile.addressLine1}
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="Address Line 2"
              name="addressLine2"
              value={profile.addressLine2}
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="City"
              name="city"
              value={profile.city}
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="State"
              name="state"
              value={profile.state}
              onChange={handleInputChange}
            />
            <InputWithLabel
              label="Country"
              name="country"
              value={profile.country}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          disabled={loading}
          onClick={handleSaveProfile}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileManagement;