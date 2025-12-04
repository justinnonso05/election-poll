'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Vote, Calendar, User, FileText, FileType2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

interface Candidate {
  id: string;
  name: string;
  manifesto: string | null;
  photoUrl: string | null;
  election: {
    id: string;
    title: string;
    startAt: string; // Changed from Date to string
    endAt: string; // Changed from Date to string
    isActive: boolean;
  };
  position: {
    id: string;
    name: string;
    order: number;
  };
  _count: {
    votes: number;
  };
}

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (candidate: Candidate) => void;
  positions: { id: string; name: string }[]; // Pass available positions as prop
}

export default function CandidateDetailModal({
  candidate,
  open,
  onClose,
  onUpdate,
  positions = [],
}: CandidateDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    manifesto: '',
    photoUrl: '',
    positionId: '', // <-- Add this line
  });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedManifestoFile, setSelectedManifestoFile] = useState<File | null>(null);
  const [manifestoPreviewName, setManifestoPreviewName] = useState<string | null>(null);
  const [manifestoUploading, setManifestoUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        manifesto: candidate.manifesto || '',
        photoUrl: candidate.photoUrl || '',
        positionId: candidate.position.id || '', // <-- Initialize from candidate
      });
    }
  }, [candidate]);

  const handleSave = async () => {
    if (!candidate) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        onUpdate({ ...candidate, ...result.data });
        setIsEditing(false);
        // Reset formData from updated candidate so display logic matches
        setFormData({
          name: result.data.name || '',
          manifesto: result.data.manifesto || '',
          photoUrl: result.data.photoUrl || '',
          positionId: result.data.position?.id || '',
        });
        toast.success(result.message || 'Candidate updated successfully');
      } else {
        toast.error(result.message || 'Failed to update candidate');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        manifesto: candidate.manifesto || '',
        photoUrl: candidate.photoUrl || '',
        positionId: candidate.position.id || '', // <-- Add this line
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper: robustly extract uploaded file URL from API response
  const getUploadedUrl = (res: any): string | undefined => {
    if (!res) return undefined;
    return (
      res?.data?.url ??
      res?.data?.upload?.url ??
      res?.upload?.url ??
      res?.url ??
      res?.secure_url ??
      undefined
    );
  };

  // Handle image upload (used when uploading directly without preview)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate) return;
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'candidate');
    formDataUpload.append('candidateId', candidate.id);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const result = await response.json();
      const url = getUploadedUrl(result);

      // Accept both HTTP OK and our API's success payload
      if ((response.ok && url) || result?.status === 'success') {
        setFormData((prev) => ({ ...prev, photoUrl: url ?? prev.photoUrl }));
        toast.success('Image uploaded!');
      } else {
        toast.error(result?.message || result?.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  // Handle photo upload (from preview flow)
  const handlePhotoUpload = async () => {
    if (!selectedPhotoFile || !candidate) return;
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedPhotoFile);
    formDataUpload.append('type', 'candidate');
    formDataUpload.append('candidateId', candidate.id);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const result = await response.json();
      const url = getUploadedUrl(result);

      if ((response.ok && url) || result?.status === 'success') {
        setFormData((prev) => ({ ...prev, photoUrl: url ?? prev.photoUrl }));
        toast.success('Image uploaded!');
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
      } else {
        toast.error(result?.message || result?.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  // Handle manifesto upload
  const handleManifestoUpload = async () => {
    if (!selectedManifestoFile || !candidate) return;
    setManifestoUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedManifestoFile);
    formDataUpload.append('type', 'manifesto');
    formDataUpload.append('candidateId', candidate.id);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const result = await response.json();
      const url = getUploadedUrl(result);

      if ((response.ok && url) || result?.status === 'success') {
        setFormData((prev) => ({ ...prev, manifesto: url ?? prev.manifesto }));
        toast.success('Manifesto uploaded!');
        setSelectedManifestoFile(null);
        setManifestoPreviewName(null);
      } else {
        toast.error(result?.message || result?.error || 'Manifesto upload failed');
      }
    } catch (error) {
      toast.error('Manifesto upload error');
    } finally {
      setManifestoUploading(false);
    }
  };

  // Handle change from the photo file input: set file and preview
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setSelectedPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(String(reader.result ?? ''));
    };
    reader.readAsDataURL(file);
  };

  // Handle change from the manifesto file input: set file and filename preview
  const handleManifestoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setSelectedManifestoFile(file);
    setManifestoPreviewName(file.name);
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Candidate Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Candidate Profile</CardTitle>

                <div className="flex items-center gap-2">
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
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Photo and Basic Info */}
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                  {/* Image preview */}
                  {photoPreview || formData.photoUrl || candidate.photoUrl ? (
                    <Image
                      src={photoPreview || formData.photoUrl || candidate.photoUrl!}
                      alt={candidate.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  ) : (
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="text-lg">
                        {getInitials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {isEditing && (
                    <div className="w-full flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handlePhotoFileChange}
                        disabled={uploading}
                        title="Upload candidate photo"
                        className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-muted file:text-muted-foreground"
                      />
                      {photoPreview && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={handlePhotoUpload}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload Photo'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="name" className="mb-2">
                      Candidate Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Position</div>
                        {isEditing ? (
                          <Select
                            value={formData.positionId}
                            onValueChange={(val) =>
                              setFormData((prev) => ({ ...prev, positionId: val }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              {positions.map((pos) => (
                                <SelectItem key={pos.id} value={pos.id}>
                                  {pos.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {candidate.position.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <Vote className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Votes Received</div>
                          <div className="text-lg font-bold text-primary">
                            {candidate._count.votes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Manifesto */}
              <div>
                <Label htmlFor="manifesto" className="mb-2">
                  Manifesto
                </Label>
                {isEditing ? (
                  <>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleManifestoFileChange}
                      disabled={manifestoUploading}
                      title="Upload manifesto document (PDF only)"
                      className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-muted file:text-muted-foreground"
                    />
                    {manifestoPreviewName && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="h-5 w-5 text-red-600" />
                        <span className="text-xs">{manifestoPreviewName}</span>
                        <Button
                          size="sm"
                          onClick={handleManifestoUpload}
                          disabled={manifestoUploading}
                        >
                          {manifestoUploading ? 'Uploading...' : 'Upload Manifesto'}
                        </Button>
                      </div>
                    )}
                  </>
                ) : candidate.manifesto && candidate.manifesto.startsWith('http') ? (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(candidate.manifesto!, '_blank')}
                      title="View Manifesto"
                    >
                      <FileText className="h-4 w-4 mr-2 text-red-600" />
                      View Manifesto
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No manifesto provided</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
