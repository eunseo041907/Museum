
import React, { useRef, useState } from 'react';

interface Props {
  onImageSelect: (base64: string) => void;
  defaultImage?: string;
  label: string;
  shape?: 'circle' | 'rect' | 'full';
}

const ImageUploader: React.FC<Props> = ({ onImageSelect, defaultImage, label, shape = 'rect' }) => {
  const [preview, setPreview] = useState<string | undefined>(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageSelect(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer overflow-hidden border-2 border-dashed border-amber-500/50 hover:border-amber-500 transition-all group bg-black/20
          ${shape === 'circle' ? 'w-24 h-24 rounded-full' : shape === 'full' ? 'w-full h-64 rounded-lg' : 'w-32 h-40 rounded-lg'}
        `}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-amber-600 font-bold text-xs">
            CLICK TO UPLOAD
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px]">
          변경하기
        </div>
      </div>
      <span className="text-[10px] text-amber-600 font-bold uppercase">{label}</span>
      <input 
        type="file" 
        accept="image/png, image/jpeg" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
};

export default ImageUploader;
