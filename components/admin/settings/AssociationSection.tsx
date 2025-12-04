'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit, Save, X, Building } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import type { Association } from '@prisma/client';

interface AssociationSectionProps {
  association: Association;
}

export default function AssociationSection({ association }: AssociationSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: association.id, // <-- include id here
    name: association.name,
    description: association.description || '',
    logoUrl: association.logoUrl || '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Upload to Cloudinary via API
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', 'candidate'); // or "manifesto" if needed

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    if (data.success && data.url) {
      toast.success('Image uploaded!');
      setFormData((prev) => ({ ...prev, logoUrl: data.url })); // Save secure_url for later save
    } else {
      toast.error(data.error || 'Upload failed');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/association/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // id will be included
      });

      if (response.ok) {
        toast.success('Association details updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to update association details');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: association.id, // <-- reset id as well
      name: association.name,
      description: association.description || '',
      logoUrl: association.logoUrl || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Association Details</h3>
          <p className="text-muted-foreground">Manage your organization information</p>
        </div>

        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 max-w-md">
        <div>
          <Label htmlFor="associationName" className="mb-2">
            Association Name
          </Label>
          <Input
            id="associationName"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            disabled={!isEditing}
          />
        </div>

        <div>
          <Label htmlFor="associationDescription" className="mb-2">
            Description
          </Label>
          <Textarea
            id="associationDescription"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            disabled={!isEditing}
            rows={3}
          />
        </div>

        <div>
          <Label className="mb-2">Logo</Label>
          <div className="flex flex-col gap-2">
            {/* Show preview: use previewUrl if set, else formData.logoUrl */}
            {(previewUrl || formData.logoUrl) && (
              <div className="relative h-32 w-32">
                <Image
                  src={previewUrl || formData.logoUrl}
                  alt="Association Logo"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded border"
                  sizes="128px"
                  priority
                />
              </div>
            )}
            {isEditing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="mt-2"
                  title="Select association logo image"
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
