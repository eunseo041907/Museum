
import React, { useState, useEffect } from 'react';
// Fix: Guest is the correct exported member from types
import { Artwork, Guest } from '../types';
// Fix: getGuestCritique is the correct exported member from geminiService
import { getGuestCritique } from '../services/geminiService';

interface MuseumRoomProps {
  category: string;
  artworks: Artwork[];
  // Fix: use Guest type instead of non-existent Character
  characters: Guest[];
  onArtClick: (art: Artwork) => void;
}

const MuseumRoom: React.FC<MuseumRoomProps> = ({ category, artworks, characters, onArtClick }) => {
  const [activeCritique, setActiveCritique] = useState<{char: string, text: string} | null>(null);
  // Fix: use Guest type instead of non-existent Character
  const [selectedChar, setSelectedChar] = useState<Guest | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (artworks.length > 0 && characters.length > 0) {
        const randomArt = artworks[Math.floor(Math.random() * artworks.length)];
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        setSelectedChar(randomChar);
        // Fix: Call getGuestCritique instead of getCharacterCritique
        const critique = await getGuestCritique(randomArt, randomChar);
        setActiveCritique({ char: randomChar.name, text: critique });
        
        setTimeout(() => setActiveCritique(null), 8000);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [artworks, characters]);

  return (
    <div className="relative min-h-screen py-20 px-4 md:px-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1a1a1e] to-black -z-10"></div>
      
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-cinzel text-amber-500 uppercase tracking-widest">{category} Hall</h2>
        <div className="w-24 h-1 bg-amber-600 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 perspective-1000">
        {artworks.map((art) => (
          <div 
            key={art.id}
            onClick={() => onArtClick(art)}
            className="group relative cursor-pointer transform transition-all duration-500 hover:scale-105"
          >
            {/* Frame Decoration */}
            <div className="absolute -inset-4 border-8 border-amber-900 shadow-2xl rounded shadow-amber-900/20 group-hover:border-amber-700 transition-colors"></div>
            <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden">
              <img 
                src={art.imageUrl} 
                alt={art.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <p className="text-sm font-medium text-amber-300">@{art.artist}</p>
                <h3 className="text-xl font-cinzel text-white">{art.title}</h3>
              </div>
            </div>
            <div className="mt-8 text-center bg-black/50 backdrop-blur-sm p-2 rounded border border-amber-900/30">
              <p className="text-xs text-amber-600 uppercase tracking-tighter">Verified Exhibition Item</p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Character Comment */}
      {activeCritique && selectedChar && (
        <div className="fixed bottom-24 right-8 z-40 animate-bounce-slow">
           <div className="bg-white text-black p-4 rounded-2xl rounded-br-none shadow-2xl max-w-xs relative">
              <p className="text-sm italic">"{activeCritique.text}"</p>
              <div className="mt-2 flex items-center gap-2">
                <img src={selectedChar.avatar} className="w-8 h-8 rounded-full border border-gray-200" alt="Avatar"/>
                <span className="text-xs font-bold text-gray-600">{activeCritique.char}</span>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default MuseumRoom;