import React, { useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { OnestFont } from '../../../assets';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onAvatarSelect?: (avatarId: string) => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onAvatarSelect
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
      if (onAvatarSelect) {
        onAvatarSelect(selectedAvatar);
      }
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
        <DialogPanel className="mx-auto max-w-lg w-full rounded-xl bg-pure-white p-6 shadow-lg">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-6">
            <DialogTitle className="text-lg text-text-blue-black">
              <OnestFont weight={700} lineHeight="relaxed">
                Choose Profile Picture
              </OnestFont>
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-unavailable-button hover:text-text-grey"
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
              className={`flex-1 py-3 px-4 text-sm rounded-lg transition-colors ${
                activeTab === 'upload'
                  ? 'bg-logo-blue text-pure-white'
                  : 'bg-light-background-blue text-text-grey hover:bg-light-background-blue/80'
              }`}
            >
              <OnestFont weight={500} lineHeight="relaxed">
                Upload Photo
              </OnestFont>
            </button>
            <button
              onClick={() => setActiveTab('avatar')}
              className={`flex-1 py-3 px-4 text-sm rounded-lg transition-colors ml-2 ${
                activeTab === 'avatar'
                  ? 'bg-logo-blue text-pure-white'
                  : 'bg-light-background-blue text-text-grey hover:bg-light-background-blue/80'
              }`}
            >
              <OnestFont weight={500} lineHeight="relaxed">
                Choose Avatar
              </OnestFont>
            </button>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'avatar' ? (
              <>
                {/* Avatar Selection */}
                <div className="text-center mb-4">
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                    Select one of our preset avatars
                  </OnestFont>
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
                            ? 'border-logo-blue bg-logo-blue/10' 
                            : 'border-light-background-blue bg-pure-white hover:border-elegant-blue hover:shadow-sm'
                        }`}
                      >
                        <div className="text-2xl mb-2">{avatar.icon}</div>
                        <OnestFont weight={500} lineHeight="relaxed" className="text-xs text-text-blue-black leading-tight block">
                          {avatar.label}
                        </OnestFont>
                        <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey leading-tight block mt-1">
                          {avatar.description}
                        </OnestFont>
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
                      ? 'border-logo-blue bg-logo-blue/10' 
                      : 'border-light-background-blue bg-light-background-blue hover:border-elegant-blue'
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
                      className="w-10 h-10 text-unavailable-button mx-auto" 
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
                  
                  <OnestFont weight={500} lineHeight="relaxed" className="text-base text-text-blue-black mb-1">
                    Click to upload or drag and drop
                  </OnestFont>
                  
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                    PNG, JPEG under 15 MB
                  </OnestFont>
                  
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
              className="px-6 py-3 rounded-lg text-sm text-text-grey bg-pure-white border border-light-background-blue hover:bg-light-background-blue transition-colors"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                Cancel
              </OnestFont>
            </button>
            {(canSave || activeTab === 'upload') && (
              <button
                onClick={handleSaveChanges}
                disabled={!canSave && activeTab === 'avatar'}
                className="px-6 py-3 rounded-lg text-sm text-pure-white bg-logo-blue hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <OnestFont weight={500} lineHeight="relaxed">
                  Save Changes
                </OnestFont>
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default ProfilePictureModal;