
import React, { useState, useEffect } from 'react';
import { AuctionItem, UserState } from '../types';

interface AuctionProps {
  user: UserState;
  onBid: (amount: number) => void;
}

const AuctionHouse: React.FC<AuctionProps> = ({ user, onBid }) => {
  const [item, setItem] = useState<AuctionItem | null>(null);
  const [bidValue, setBidValue] = useState<number>(0);

  useEffect(() => {
    // Mock auction start
    const newItem: AuctionItem = {
      id: 'auc-1',
      title: 'Vivid Nebula #402',
      artist: 'AI Oracle',
      imageUrl: 'https://picsum.photos/seed/nebula/800/800',
      description: 'A cosmic dance captured in algorithmic strokes. Truly a masterpiece of the digital age.',
      category: 'Special',
      views: 0,
      likes: 0,
      viewTime: 0,
      uploadDate: new Date().toISOString(),
      price: 1200,
      currentBid: 1250,
      highestBidder: 'Collector_X',
      timeLeft: 120
    };
    setItem(newItem);
    setBidValue(newItem.currentBid + 100);

    const timer = setInterval(() => {
      setItem(prev => {
        if (!prev || prev.timeLeft <= 0) return prev;
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!item) return <div className="p-20 text-center">Preparing next auction...</div>;

  const handleBid = () => {
    if (user.balance >= bidValue) {
      onBid(bidValue);
      setItem(prev => prev ? { ...prev, currentBid: bidValue, highestBidder: 'You' } : null);
      setBidValue(bidValue + 100);
    } else {
      alert("Insufficient funds! Sell more art to earn Aura coins.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 bg-neutral-900 border border-amber-900/40 rounded-xl shadow-2xl">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative group overflow-hidden rounded-lg">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover border-4 border-amber-900" />
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            LIVE AUCTION
          </div>
        </div>
        
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-cinzel text-amber-500 mb-2">{item.title}</h2>
            <p className="text-gray-400 text-sm italic mb-6">"{item.description}"</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-black/40 rounded border border-white/5">
                <span className="text-gray-500">Highest Bid</span>
                <span className="text-2xl font-bold text-amber-400">{item.currentBid} Aura</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/40 rounded border border-white/5">
                <span className="text-gray-500">Bidder</span>
                <span className="text-sm font-mono text-blue-400">{item.highestBidder}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/40 rounded border border-white/5">
                <span className="text-gray-500">Time Remaining</span>
                <span className="text-xl font-bold text-red-500">
                  {Math.floor(item.timeLeft / 60)}:{(item.timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <div className="flex gap-4">
               <input 
                type="number"
                value={bidValue}
                onChange={(e) => setBidValue(Number(e.target.value))}
                className="flex-1 bg-black border border-amber-900 p-3 rounded text-amber-400 text-center text-xl font-bold focus:outline-none"
               />
               <button 
                onClick={handleBid}
                className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-8 py-3 rounded transition-colors"
               >
                 PLACE BID
               </button>
            </div>
            <p className="text-center text-xs text-gray-600">Minimum bid increment: 100 Aura</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionHouse;
