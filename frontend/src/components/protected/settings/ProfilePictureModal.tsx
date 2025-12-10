import React, { useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { RobotoFont } from '../../../assets';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'avatar'>('avatar');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar options with descriptions matching the images
  const avatarOptions = [
    { 
      id: 'curious-cat', 
      label: 'Curious Cat', 
      description: 'Playful and inquisitive',
      icon: '🐱' 
    },
    { 
      id: 'celebrating-bird', 
      label: 'Celebrating Bird', 
      description: 'Optimistic and free-spirited',
      icon: '🐦' 
    },
    { 
      id: 'careful-elephant', 
      label: 'Careful Elephant', 
      description: 'Thoughtful and analytical',
      icon: '🐘' 
    },
    { 
      id: 'protective-dog', 
      label: 'Protective Dog', 
      description: 'Loyal and dependable',
      icon: '🐶' 
    },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      if (file.size <= 15 * 1024 * 1024) { // 15MB limit
        onUpload(file);
        onClose();
      } else {
        alert('File size must be under 15MB');
      }
    } else {
      alert('Please upload a PNG or JPEG file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleSaveChanges = () => {
    if (activeTab === 'avatar' && selectedAvatar) {
      console.log('Selected avatar:', selectedAvatar);
      // Handle avatar selection logic here
    }
    // For upload tab, files are handled immediately in handleFileUpload
    onClose();
  };

  const canSave = activeTab === 'avatar' ? selectedAvatar !== null : false;

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
      
      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        {/* The actual dialog panel */}
        <DialogPanel className="mx-auto max-w-lg w-full rounded-xl bg-white p-6 shadow-lg">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-6">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              <RobotoFont weight={600}>
                Choose Profile Picture
              </RobotoFont>
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <RobotoFont weight={500}>
                Upload Photo
              </RobotoFont>
            </button>
            <button
              onClick={() => setActiveTab('avatar')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ml-2 ${
                activeTab === 'avatar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <RobotoFont weight={500}>
                Choose Avatar
              </RobotoFont>
            </button>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'avatar' ? (
              <>
                {/* Avatar Selection */}
                <div className="text-center mb-4">
                  <RobotoFont className="text-sm text-gray-600">
                    Select one of our preset avatars
                  </RobotoFont>
                </div>
                <div className="grid gap-2 grid-cols-2">
                  {avatarOptions.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.id;
                    return (
                      <div 
                        key={avatar.id} 
                        onClick={() => handleAvatarSelect(avatar.id)}
                        className={`cursor-pointer rounded-lg border p-3 text-center transition-all hover:scale-[1.01] ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-2xl mb-2">{avatar.icon}</div>
                        <RobotoFont weight={600} className="text-xs text-gray-900 leading-tight block">
                          {avatar.label}
                        </RobotoFont>
                        <RobotoFont className="text-xs text-gray-500 leading-tight block mt-1">
                          {avatar.description}
                        </RobotoFont>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* File Upload */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleUploadClick}
                >
                  {/* Upload icon */}
                  <div className="mb-3">
                    <svg 
                      className="w-10 h-10 text-gray-400 mx-auto" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                      />
                    </svg>
                  </div>
                  
                  <RobotoFont weight={500} className="text-base text-gray-900 mb-1">
                    Click to upload or drag and drop
                  </RobotoFont>
                  
                  <RobotoFont className="text-sm text-gray-500">
                    PNG, JPEG under 15 MB
                  </RobotoFont>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <RobotoFont weight={500}>
                Cancel
              </RobotoFont>
            </button>
            {(canSave || activeTab === 'upload') && (
              <button
                onClick={handleSaveChanges}
                disabled={!canSave && activeTab === 'avatar'}
                className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RobotoFont weight={500}>
                  Save Changes
                </RobotoFont>
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default ProfilePictureModal;