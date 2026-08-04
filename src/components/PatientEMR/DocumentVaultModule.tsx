import React, { useState } from 'react';
import { ClinicalMedia, Patient } from '../../types';
import { formatDate } from '../../utils/formatters';
import { FileText, Image as ImageIcon, Plus, Trash2, Eye, Upload, Tag, X, Loader2 } from 'lucide-react';
import { uploadClinicFile, deleteClinicFile } from '../../utils/supabaseMultiTenant';

interface DocumentVaultModuleProps {
  patient: Patient;
  onUpdateMedia: (media: ClinicalMedia[]) => void;
}

export const DocumentVaultModule: React.FC<DocumentVaultModuleProps> = ({
  patient,
  onUpdateMedia,
}) => {
  const [mediaList, setMediaList] = useState<ClinicalMedia[]>(patient.media || []);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [previewMedia, setPreviewMedia] = useState<ClinicalMedia | null>(null);

  // New Media Form State
  const [titleInput, setTitleInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<ClinicalMedia['category']>('IOPA X-Ray');
  const [notesInput, setNotesInput] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const categories = ['All', 'OPG', 'IOPA X-Ray', 'Intraoral Photo', 'CT Scan', 'Lab Report'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      if (!titleInput) {
        setTitleInput(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    setIsUploading(true);
    let finalUrl = fileDataUrl;
    let filePath: string | undefined = undefined;

    if (selectedFile) {
      const uploaded = await uploadClinicFile(selectedFile, 'patients', patient.id);
      if (uploaded) {
        finalUrl = uploaded.url || fileDataUrl;
        filePath = uploaded.path;
      }
    }

    // Use uploaded file URL or a realistic dental X-ray/document placeholder
    const sampleXrayPlaceholder =
      categoryInput === 'OPG'
        ? 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80'
        : categoryInput === 'Lab Report'
        ? 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80';

    const newMediaItem: ClinicalMedia = {
      id: `media-${Date.now()}`,
      patientId: patient.id,
      title: titleInput.trim(),
      category: categoryInput,
      date: new Date().toISOString().split('T')[0],
      url: finalUrl || sampleXrayPlaceholder,
      filePath,
      tags: [categoryInput, 'Vault File'],
      notes: notesInput.trim() || undefined,
    };

    const updated = [newMediaItem, ...mediaList];
    setMediaList(updated);
    onUpdateMedia(updated);

    // Reset Form
    setTitleInput('');
    setNotesInput('');
    setFileDataUrl('');
    setSelectedFile(null);
    setIsUploading(false);
    setIsUploadOpen(false);
  };

  const handleDeleteMedia = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document/X-ray file?')) {
      const mediaItem = mediaList.find((m) => m.id === id);
      if (mediaItem?.filePath) {
        await deleteClinicFile(mediaItem.filePath);
      }
      const updated = mediaList.filter((m) => m.id !== id);
      setMediaList(updated);
      onUpdateMedia(updated);
    }
  };

  const filteredMedia = activeCategoryFilter === 'All'
    ? mediaList
    : mediaList.filter((m) => m.category === activeCategoryFilter);

  return (
    <div className="space-y-6 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs">
              Clinical Vault
            </span>
            <h2 className="text-base font-extrabold text-zinc-900">
              Patient Documents, X-Rays & Lab Vault
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Store and view IOPA X-rays, OPG scans, photos, and laboratory receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 bg-[#3BA7F5] hover:bg-sky-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload File / X-Ray</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategoryFilter === cat
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedia.map((media) => (
          <div
            key={media.id}
            className="group relative bg-zinc-50 rounded-2xl border border-zinc-200 hover:border-purple-300 overflow-hidden shadow-2xs hover:shadow-md transition-all space-y-2 flex flex-col"
          >
            {/* Image Thumbnail Header */}
            <div className="relative h-44 bg-zinc-900 overflow-hidden flex items-center justify-center">
              <img
                src={media.url}
                alt={media.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
              />

              <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border border-white/20">
                {media.category}
              </span>

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMedia(media)}
                  className="px-3 py-1.5 bg-white/90 hover:bg-white text-zinc-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMedia(media.id)}
                  className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl shadow-md transition-all cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-zinc-900 truncate">{media.title}</h3>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  Uploaded: {formatDate(media.date)}
                </span>
              </div>

              {media.notes && (
                <p className="text-[11px] text-zinc-600 line-clamp-2 bg-white p-2 rounded-lg border border-zinc-200">
                  {media.notes}
                </p>
              )}
            </div>
          </div>
        ))}

        {filteredMedia.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-400 text-xs">
            No files or X-rays uploaded in this vault category.
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-white border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" />
                <span>Upload Clinical Media / Lab Receipt</span>
              </h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-zinc-700 font-bold block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tooth #30 Post-RCT IOPA X-Ray"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-[#3BA7F5]"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-bold block mb-1">Category *</label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value as any)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900"
                >
                  <option value="IOPA X-Ray">IOPA X-Ray</option>
                  <option value="OPG">OPG Full Mouth Scan</option>
                  <option value="Intraoral Photo">Intraoral Photo</option>
                  <option value="CT Scan">3D CBCT Scan</option>
                  <option value="Lab Report">Lab Receipt / Workorder</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-700 font-bold block mb-1">Select File (JPG, PNG, PDF)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full p-2 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-bold block mb-1">Clinical Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Radiographic observations, bone loss height, periapical lesion notes..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-[#3BA7F5]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save to Vault
                </button>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 text-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-purple-900 text-purple-200 px-2 py-0.5 rounded border border-purple-700">
                  {previewMedia.category}
                </span>
                <h3 className="text-sm font-extrabold text-white mt-0.5">{previewMedia.title}</h3>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={previewMedia.url}
                alt={previewMedia.title}
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>

            {previewMedia.notes && (
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-300">
                <span className="font-bold text-zinc-400 block text-[10px] uppercase">Notes:</span>
                <p>{previewMedia.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
