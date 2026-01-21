
import React, { useState, useRef, useEffect } from 'react';
import { Artwork, Guest } from '../types';
import ImageUploader from './ImageUploader';

interface Props {
  artwork: Artwork;
  guests: Guest[];
  userBalance: number;
  onClose: () => void;
  onUpdateArtwork: (updated: Artwork) => void;
  onStartAuction: () => void;
  onAddCritique: (guestId: string, text: string) => void;
  onClean: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onDelete: () => void;
  onSell: () => void;
  allArtworks: Artwork[];
}

const ArtworkDetailModal: React.FC<Props> = ({ artwork, guests, userBalance, onClose, onUpdateArtwork, onStartAuction, onAddCritique, onClean, onNavigate, onDelete, onSell, allArtworks }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [musicInput, setMusicInput] = useState(artwork.musicUrl || '');
  const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // 판매 확인 상태
  const [sellConfirm, setSellConfirm] = useState(false);

  const [sessionDuration, setSessionDuration] = useState(0);

  // Modal View State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Drag threshold check to distinguish click from drag
  const dragDistanceRef = useRef(0);

  // Fullscreen View State
  const [fsZoom, setFsZoom] = useState(1);
  const [fsPos, setFsPos] = useState({ x: 0, y: 0 });
  const [fsDragging, setFsDragging] = useState(false);
  const [fsDragStart, setFsDragStart] = useState({ x: 0, y: 0 });

  const [selectedCriticId, setSelectedCriticId] = useState(guests[0]?.id || '');
  const [critiqueText, setCritiqueText] = useState('');

  const isOwner = artwork.owner === '나 (User)';

  useEffect(() => {
    setIsFullScreen(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setMusicInput(artwork.musicUrl || '');
    setIsEditing(false);
    setIsMusicMenuOpen(false);
    setSellConfirm(false); // Reset sell confirm state on art change
    
    const startTime = Date.now();
    setSessionDuration(0);
    const interval = setInterval(() => {
        setSessionDuration(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [artwork.id]);

  const getRankingStats = () => {
     const currentTotalTime = (artwork.totalViewTime || 0) + sessionDuration;
     const sorted = [...allArtworks].map(a => 
         a.id === artwork.id ? { ...a, totalViewTime: currentTotalTime } : a
     ).sort((a,b) => (b.totalViewTime || 0) - (a.totalViewTime || 0));

     const rank = sorted.findIndex(a => a.id === artwork.id) + 1;
     const topPercent = allArtworks.length > 1 
        ? Math.round((rank / allArtworks.length) * 100)
        : 100;
     
     const seconds = Math.floor((currentTotalTime / 1000) % 60);
     const minutes = Math.floor((currentTotalTime / 1000 / 60));
     const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

     return { rank, topPercent, timeStr };
  };

  const { rank, topPercent, timeStr } = getRankingStats();

  const handleYouTubeSubmit = () => {
      onUpdateArtwork({ 
          ...artwork, 
          musicUrl: musicInput, 
          audioFile: undefined // Clear conflicting file
      });
      alert("YouTube theme music set!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          onUpdateArtwork({ 
              ...artwork, 
              musicUrl: '', // Clear conflicting URL
              audioFile: url 
          });
          setMusicInput('');
          alert("Local audio file set!");
      }
  };

  const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          const response = await fetch(artwork.imageUrl, { mode: 'cors', credentials: 'omit' });
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${artwork.title.replace(/\s+/g, '_')}_Original.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      } catch (error) {
          const link = document.createElement('a');
          link.href = artwork.imageUrl;
          link.download = `${artwork.title.replace(/\s+/g, '_')}_Original.png`;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  // --- Modal View Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const newZoom = Math.min(5, Math.max(0.5, zoomLevel - e.deltaY * 0.001));
      setZoomLevel(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          e.preventDefault();
          const newX = e.clientX - dragStart.x;
          const newY = e.clientY - dragStart.y;
          
          const dist = Math.sqrt(Math.pow(newX - position.x, 2) + Math.pow(newY - position.y, 2));
          dragDistanceRef.current += dist;

          setPosition({ x: newX, y: newY });
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
      if (dragDistanceRef.current < 5) {
         setFsZoom(1);
         setFsPos({x:0, y:0});
         setIsFullScreen(true);
      }
  };

  // --- Fullscreen View Handlers ---
  const handleFsWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const newZoom = Math.min(5, Math.max(0.5, fsZoom - e.deltaY * 0.001));
      setFsZoom(newZoom);
  };

  const handleFsMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setFsDragging(true);
      setFsDragStart({ x: e.clientX - fsPos.x, y: e.clientY - fsPos.y });
  };

  const handleFsMouseMove = (e: React.MouseEvent) => {
      if (fsDragging) {
          e.preventDefault();
          e.stopPropagation();
          setFsPos({ x: e.clientX - fsDragStart.x, y: e.clientY - fsDragStart.y });
      }
  };

  const handleFsMouseUp = () => {
      setFsDragging(false);
  };

  const preventBubble = (e: React.MouseEvent) => e.stopPropagation();

  const dustAmount = (Date.now() - artwork.lastCleanedAt) / (1000 * 60 * 60 * 24);
  const isDirty = dustAmount > 0.5;

  return (
    <>
    {isFullScreen && (
        <div 
           className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden animate-in fade-in duration-200 cursor-move"
           onWheel={handleFsWheel}
           onMouseDown={handleFsMouseDown}
           onMouseMove={handleFsMouseMove}
           onMouseUp={handleFsMouseUp}
           onMouseLeave={handleFsMouseUp}
        >
            <div className="absolute top-5 left-5 text-white/50 text-xs pointer-events-none z-[210]">
               Scroll to Zoom • Drag to Move
            </div>
            
            <div className="absolute top-5 right-5 flex gap-3 z-[210]">
                <button onClick={handleDownload} onMouseDown={preventBubble} onMouseUp={preventBubble} className="bg-white/10 hover:bg-white/30 text-white p-2 rounded-full transition-colors" title="Download">⬇️</button>
                <button onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }} onMouseDown={preventBubble} onMouseUp={preventBubble} className="bg-white/10 hover:bg-red-900/50 text-white px-3 py-1 rounded-full transition-colors font-bold">✕ Close</button>
            </div>

            <img 
               src={artwork.imageUrl} 
               className="max-w-none origin-center transition-transform duration-75 ease-linear" 
               style={{ transform: `translate(${fsPos.x}px, ${fsPos.y}px) scale(${fsZoom})`, height: '90vh' }}
               alt={artwork.title} 
               draggable={false}
            />
        </div>
    )}

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-6xl bg-[#121214] text-white rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-amber-900/30 max-h-[90vh]">
        
        {/* Left: Image Canvas */}
        <div 
            className="md:w-3/5 bg-black relative flex items-center justify-center overflow-hidden cursor-move group"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
        >
          <button onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }} onMouseDown={preventBubble} onMouseUp={preventBubble} className="absolute left-4 z-40 bg-black/40 hover:bg-amber-600/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">◀</button>
          <button onClick={(e) => { e.stopPropagation(); onNavigate('next'); }} onMouseDown={preventBubble} onMouseUp={preventBubble} className="absolute right-4 z-40 bg-black/40 hover:bg-amber-600/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">▶</button>
          <button onClick={handleDownload} onMouseDown={preventBubble} onMouseUp={preventBubble} className="absolute top-4 right-4 z-40 bg-black/50 hover:bg-amber-600 text-white p-2 rounded-full transition-colors border border-white/20 opacity-0 group-hover:opacity-100" title="Download Original">⬇️</button>

           {isDirty && (
              <button
                  onClick={(e) => { e.stopPropagation(); onClean(); }}
                  onMouseDown={preventBubble}
                  onMouseUp={preventBubble}
                  className="absolute top-4 left-4 z-40 bg-white/10 hover:bg-blue-500/80 text-white px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md transition-all shadow-lg opacity-80 hover:opacity-100 animate-pulse text-xs font-bold flex items-center gap-1"
                  title="Clean Artwork ($100)"
              >
                  ✨ Clean ($100)
              </button>
           )}

          <div 
             className="relative transition-transform duration-75 ease-linear" 
             style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})` }}
          >
             <img src={artwork.imageUrl} className="max-h-[80vh] max-w-full object-contain shadow-[0_0_50px_rgba(255,165,0,0.2)] pointer-events-none" alt={artwork.title} />
             <div 
                className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] pointer-events-none transition-opacity duration-1000"
                style={{ opacity: Math.min(0.9, dustAmount * 0.03) }}
             ></div>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-xs text-gray-300 pointer-events-none whitespace-nowrap">
             Click Image to Fullscreen • Drag to Pan • Scroll to Zoom ({Math.round(zoomLevel * 100)}%)
          </div>

          {isEditing && (
             <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 cursor-default" onMouseDown={preventBubble} onMouseUp={preventBubble}>
                <ImageUploader label="Change Art Image" defaultImage={artwork.imageUrl} onImageSelect={(base64) => onUpdateArtwork({...artwork, imageUrl: base64})} shape="rect" />
             </div>
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="md:w-2/5 p-8 overflow-y-auto custom-scrollbar bg-[#1a1a1d] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 mr-4">
               <p className="text-amber-600 text-[10px] font-bold tracking-widest mb-1">COLLECTION #{String(artwork.indexNumber).padStart(3,'0')}</p>
               {isEditing ? (
                   <input className="text-3xl font-cinzel text-white bg-black border-b border-gray-600 w-full mb-1 focus:outline-none focus:border-amber-500" value={artwork.title} onChange={(e) => onUpdateArtwork({...artwork, title: e.target.value})} />
               ) : (
                   <h2 className="text-3xl font-cinzel text-white">{artwork.title}</h2>
               )}
               <p className="text-gray-400 italic text-sm">by {artwork.artist}</p>
               <p className="text-gray-600 text-[10px] mt-1">Registered: {new Date(artwork.registeredAt).toLocaleString('ko-KR')}</p>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="text-xs border border-gray-600 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors whitespace-nowrap">
              {isEditing ? 'Save/Close' : 'Edit Info'}
            </button>
          </div>

          <div className="flex gap-4 mb-6">
             <div className="flex-1 bg-black/40 p-3 rounded border border-white/5 flex flex-col items-center">
                 <span className="text-[10px] text-gray-500 uppercase">My Viewing Time</span>
                 <span className="text-xl font-mono text-amber-500">{timeStr}</span>
             </div>
             <div className="flex-1 bg-black/40 p-3 rounded border border-white/5 flex flex-col items-center">
                 <span className="text-[10px] text-gray-500 uppercase">Popularity</span>
                 <span className="text-xl font-mono text-green-500">Top {topPercent}%</span>
             </div>
          </div>

          {/* Theme Music Section */}
          <div className="bg-neutral-800 p-4 rounded-xl border border-amber-900/30 mb-6 transition-all">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <span>🎵 THEME MUSIC</span>
                    {artwork.musicUrl ? (
                        <span className="text-[10px] bg-red-900 text-red-200 px-2 py-0.5 rounded-full">YouTube</span>
                    ) : artwork.audioFile ? (
                        <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full">File</span>
                    ) : (
                        <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">None</span>
                    )}
                </h3>
                <button 
                    onClick={() => setIsMusicMenuOpen(!isMusicMenuOpen)}
                    className="text-xs bg-black/50 hover:bg-amber-700 hover:text-white border border-gray-600 px-3 py-1 rounded transition-colors"
                >
                    {isMusicMenuOpen ? 'Hide Settings' : 'Edit Music'}
                </button>
             </div>
             
             {isMusicMenuOpen && (
                <div className="space-y-4 animate-in slide-in-from-top-2 border-t border-gray-700 pt-3">
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Option 1: YouTube Link</p>
                        <div className="flex gap-2">
                            <input placeholder="Paste YouTube URL..." value={musicInput} onChange={(e) => setMusicInput(e.target.value)} className="flex-1 bg-black border border-gray-700 p-2 rounded text-xs text-white focus:border-amber-500 outline-none" />
                            <button onClick={handleYouTubeSubmit} className="bg-amber-700 hover:bg-amber-600 text-white text-xs px-3 rounded font-bold">Apply Link</button>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-neutral-800 px-2 text-gray-500 text-[10px]">Or</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Option 2: Local Audio File</p>
                        <label className="flex items-center justify-center w-full cursor-pointer bg-black border border-dashed border-gray-600 hover:border-amber-500 hover:bg-white/5 p-3 rounded transition-all group">
                            <div className="text-center">
                                <p className="text-xs text-gray-300 group-hover:text-white">📂 Click to Upload Audio File</p>
                                <p className="text-[9px] text-gray-500 mt-0.5">(mp3, wav, etc.)</p>
                            </div>
                            <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>
             )}
          </div>

          <div className="space-y-6 text-sm flex-1">
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                {isEditing ? (
                    <textarea className="w-full bg-black text-white p-2 rounded border border-gray-700 h-24 focus:border-amber-500 outline-none" value={artwork.description} onChange={(e) => onUpdateArtwork({...artwork, description: e.target.value})} />
                ) : (
                    <p className="leading-relaxed text-gray-300">"{artwork.description}"</p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-black/30 p-2 rounded"><span className="text-amber-700 font-bold uppercase text-[10px] block">Owner</span><span className="font-bold">{artwork.owner}</span></div>
              <div className="bg-black/30 p-2 rounded"><span className="text-amber-700 font-bold uppercase text-[10px] block">Price</span><span className="font-mono text-green-500">${artwork.price.toLocaleString()}</span></div>
            </div>
            
            {/* SELL / AUCTION BUTTONS */}
            {isOwner ? (
                <div className="flex gap-2">
                    <button onClick={onStartAuction} className="flex-1 py-3 bg-red-900/50 hover:bg-red-800 text-white font-cinzel font-bold rounded border border-red-800 text-xs shadow-lg">
                        AUCTION
                    </button>
                    {sellConfirm ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSell(); }} 
                            onMouseLeave={() => setSellConfirm(false)}
                            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-cinzel font-bold rounded border border-red-400 text-xs shadow-[0_0_15px_rgba(255,0,0,0.5)] animate-pulse"
                        >
                            REALLY SELL? (Click)
                        </button>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSellConfirm(true); }} 
                            className="flex-1 py-3 bg-gradient-to-r from-green-800 to-green-600 hover:scale-105 transition-transform text-white font-cinzel font-bold rounded border border-green-500 text-xs shadow-lg"
                        >
                            SELL INSTANTLY (+${artwork.price.toLocaleString()})
                        </button>
                    )}
                </div>
            ) : (
                <button onClick={onStartAuction} className="w-full py-3 bg-gradient-to-r from-red-900 to-red-700 text-white font-cinzel font-bold rounded shadow-lg hover:scale-105 transition-transform border border-red-800">
                    OPEN AUCTION
                </button>
            )}

            <div className="bg-neutral-800 p-4 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">Add Critique</h3>
                <div className="flex gap-2">
                    <select className="bg-black text-xs p-2 rounded border border-gray-600 w-1/3 text-white" value={selectedCriticId} onChange={e => setSelectedCriticId(e.target.value)}>{guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                    <input className="flex-1 bg-black text-xs p-2 rounded border border-gray-600 text-white" placeholder="Type comment..." value={critiqueText} onChange={e => setCritiqueText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && critiqueText) { onAddCritique(selectedCriticId, critiqueText); setCritiqueText(''); } }} />
                    <button onClick={() => { if(critiqueText) { onAddCritique(selectedCriticId, critiqueText); setCritiqueText(''); } }} className="bg-amber-700 text-white text-xs px-3 rounded font-bold hover:bg-amber-600">+</button>
                </div>
            </div>
            <div className="flex-1">
               <h3 className="font-cinzel text-amber-600 text-sm border-b border-amber-900/30 pb-2 mb-2">CRITIQUES HISTORY</h3>
               <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                 {artwork.critiques.length > 0 ? artwork.critiques.map((c, i) => (
                   <div key={i} className="text-xs bg-black/20 p-2 rounded"><span className="text-amber-500 font-bold mr-2">{c.guestName}:</span><span className="text-gray-400">{c.text}</span></div>
                 )) : <p className="text-xs text-gray-600 italic">No critiques yet.</p>}
               </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800">
             <button onClick={() => { if(confirm('정말 폐기하시겠습니까? (복구 불가)')) onDelete(); }} className="w-full py-3 rounded border border-red-900/50 text-red-700 hover:bg-red-900/20 hover:text-red-500 hover:border-red-500 transition-all text-xs font-bold tracking-widest">DISCARD ARTWORK</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ArtworkDetailModal;
