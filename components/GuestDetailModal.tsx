
import React from 'react';
import { Guest } from '../types';

interface Props {
  guest: Guest;
  onClose: () => void;
}

const GuestDetailModal: React.FC<Props> = ({ guest, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-[#1a1a1d] text-white rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-amber-900/50 max-h-[85vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-900/80 transition-colors"
        >
          ✕
        </button>

        {/* Left: Avatar / Full Body */}
        <div className="md:w-2/5 bg-gradient-to-b from-neutral-800 to-black relative flex items-end justify-center pt-10 overflow-hidden border-r border-amber-900/30">
           <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-amber-900/20 to-transparent"></div>
           <img 
             src={guest.fullBodyImage || guest.avatar} 
             alt={guest.name} 
             className="relative z-10 h-[90%] w-auto object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
           />
           <div className="absolute bottom-4 bg-black/70 px-4 py-1 rounded-full border border-amber-600/50 text-amber-500 font-cinzel font-bold text-lg">
             {guest.name}
           </div>
        </div>

        {/* Right: Details */}
        <div className="md:w-3/5 p-8 overflow-y-auto custom-scrollbar">
           <h2 className="text-3xl font-cinzel text-amber-500 mb-1 border-b border-amber-900/30 pb-2">GUEST PROFILE</h2>
           <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">Visitor ID: {guest.id}</p>

           <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/40 p-3 rounded border border-white/5">
                    <span className="text-amber-700 font-bold text-[10px] uppercase block mb-1">Personality</span>
                    <span className="text-sm text-gray-200">{guest.personality}</span>
                 </div>
                 <div className="bg-black/40 p-3 rounded border border-white/5">
                    <span className="text-amber-700 font-bold text-[10px] uppercase block mb-1">Speech Style</span>
                    <span className="text-sm text-gray-200">{guest.speechStyle}</span>
                 </div>
              </div>

              {/* Affinity */}
              <div className="bg-black/40 p-4 rounded border border-white/5">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-amber-700 font-bold text-[10px] uppercase">Affinity Level</span>
                    <span className="text-amber-500 font-mono font-bold">{guest.affinity}%</span>
                 </div>
                 <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-700 to-amber-500" 
                      style={{ width: `${Math.min(100, guest.affinity)}%` }}
                    ></div>
                 </div>
              </div>

              {/* Owned Artworks */}
              <div>
                 <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase flex items-center gap-2">
                    <span>👑 Collection</span>
                    <span className="bg-amber-900 text-amber-200 text-[10px] px-1.5 rounded-full">{guest.ownedArtworks.length}</span>
                 </h3>
                 <div className="flex flex-wrap gap-2">
                    {guest.ownedArtworks.length > 0 ? (
                        guest.ownedArtworks.map((art, i) => (
                           <span key={i} className="text-xs bg-amber-900/30 text-amber-200 border border-amber-800/50 px-3 py-1 rounded-full">
                              {art}
                           </span>
                        ))
                    ) : (
                        <p className="text-xs text-gray-600 italic">No artworks owned yet.</p>
                    )}
                 </div>
              </div>

              {/* Critique History */}
              <div className="pt-4 border-t border-gray-800">
                 <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">💬 Critique History</h3>
                 <div className="bg-black/30 rounded-lg p-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {guest.critiqueHistory && guest.critiqueHistory.length > 0 ? (
                       guest.critiqueHistory.map((history, idx) => (
                          <div key={idx} className="p-3 mb-1 bg-white/5 hover:bg-white/10 rounded transition-colors border-l-2 border-amber-700/50">
                             <p className="text-[10px] text-amber-600 font-bold mb-1">
                                {history.artTitle}
                             </p>
                             <p className="text-xs text-gray-300 italic">
                                "{history.text}"
                             </p>
                          </div>
                       ))
                    ) : (
                       <div className="p-4 text-center text-gray-600 text-xs italic">
                          아직 남긴 감상평이 없습니다.
                       </div>
                    )}
                 </div>
                 <p className="text-[10px] text-gray-600 mt-2 text-right">* These critiques are spoken randomly near the artwork.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailModal;
