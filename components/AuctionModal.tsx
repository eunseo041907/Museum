
import React, { useState, useEffect, useRef } from 'react';
import { Artwork, Guest } from '../types';

interface Props {
  artwork: Artwork;
  guests: Guest[];
  onClose: () => void;
  onAuctionEnd: (winnerName: string, finalPrice: number) => void;
  userBalance: number;
}

const AuctionModal: React.FC<Props> = ({ artwork, guests, onClose, onAuctionEnd, userBalance }) => {
  // 경매 참여자: 손님들 + 사용자
  const [participants, setParticipants] = useState<{id: string, name: string, isUser: boolean, avatar: string}[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  
  const [currentBid, setCurrentBid] = useState(Math.max(artwork.price, 20000000));
  const [lastBidder, setLastBidder] = useState<string>(artwork.owner);
  const [logs, setLogs] = useState<string[]>(['경매가 시작되었습니다!']);
  const [myBidAmount, setMyBidAmount] = useState(0);
  
  const [isEnded, setIsEnded] = useState(false);
  const [winner, setWinner] = useState<{name: string, price: number} | null>(null);

  // 초기화: 참가자 전체 셔플
  useEffect(() => {
    const guestParticipants = guests.map(g => ({ id: g.id, name: g.name, isUser: false, avatar: g.avatar }));
    const userParticipant = { id: 'user', name: '나 (User)', isUser: true, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=user' };
    
    // 유저 포함 전체 섞기
    const allParticipants = [...guestParticipants, userParticipant].sort(() => Math.random() - 0.5);
    
    setParticipants(allParticipants);
    setCurrentTurnIndex(0); 
    setMyBidAmount(Math.max(artwork.price, 20000000) + 1000000); 
  }, [guests, artwork.price, artwork.owner]);

  // 턴 진행시 내 입찰가 자동 갱신 (사용자 턴이 되면 즉시 업데이트)
  useEffect(() => {
     if(participants.length > 0 && participants[currentTurnIndex]?.isUser) {
         setMyBidAmount(currentBid + 1000000);
     }
  }, [currentTurnIndex, currentBid, participants]);

  // 턴 진행 로직
  useEffect(() => {
    if (isEnded || participants.length === 0) return;

    const currentParticipant = participants[currentTurnIndex];

    if (!currentParticipant.isUser) {
        // 손님 턴: 1.5초 후 자동 입찰 또는 패스
        const timer = setTimeout(() => {
            // 무한 한도: 가격이 높아져도 포기하지 않고 계속 입찰할 확률 유지 (70%)
            const willBid = Math.random() > 0.3;

            if (willBid) {
                // 최소 50만불 ~ 최대 1000만불 인상 (과감한 베팅)
                const raise = Math.floor(Math.random() * 9500000) + 500000;
                const newBid = currentBid + raise;
                handleBid(currentParticipant.name, newBid);
            } else {
                handlePass(currentParticipant.name);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }
    // 유저 턴일때는 대기 (유저 입력 기다림)
  }, [currentTurnIndex, isEnded, participants, currentBid]);


  const handleBid = (bidderName: string, amount: number) => {
      setCurrentBid(amount);
      setLastBidder(bidderName);
      setLogs(prev => [`${bidderName}: $${amount.toLocaleString()} 제시!`, ...prev].slice(0, 6));

      // 랜덤 낙찰 로직 (Sudden Death)
      // 낙찰 확률 20%로 상향
      if (Math.random() < 0.20 && amount > artwork.price) {
          endAuction(bidderName, amount);
      } else {
          nextTurn();
      }
  };

  const handlePass = (name: string) => {
      setLogs(prev => [`${name}: 패스합니다.`, ...prev].slice(0, 6));
      nextTurn();
  };

  const nextTurn = () => {
      setCurrentTurnIndex(prev => (prev + 1) % participants.length);
  };

  const endAuction = (winnerName: string, price: number) => {
      setIsEnded(true);
      setWinner({ name: winnerName, price });
      setLogs(prev => [`🔔 쾅! 쾅! 낙찰되었습니다!`, ...prev]);
      
      setTimeout(() => {
          onAuctionEnd(winnerName, price);
      }, 4000);
  };

  // 유저 액션
  const onUserBid = () => {
      if (myBidAmount <= currentBid) return alert(`현재가($${currentBid.toLocaleString()})보다 높게 불러야 합니다.`);
      if (myBidAmount > userBalance) return alert("자산이 부족합니다.");
      handleBid('나 (User)', myBidAmount);
  };

  const onUserPass = () => {
      handlePass('나 (User)');
  };

  const currentPerson = participants[currentTurnIndex];

  return (
    <div className="fixed inset-0 z-[200] bg-[#3a0000] flex flex-col items-center overflow-hidden">
      {/* 극장 커튼 및 조명 */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent z-10"></div>
      <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[150%] h-[100%] bg-red-900 rounded-[50%] blur-3xl opacity-50 pointer-events-none"></div>
      
      {/* 무대 중앙 작품 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-20 w-full max-w-6xl mt-10">
         <h1 className="text-5xl font-cinzel text-amber-500 mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] animate-pulse">THE RED AUCTION</h1>
         
         <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-black p-2 border-4 border-amber-900 shadow-2xl">
               <img src={artwork.imageUrl} className="h-[35vh] object-contain" alt="Art" />
            </div>
            
            {/* 현재 상태 표시 */}
            <div className="absolute top-full left-0 right-0 mt-4 text-center">
               <p className="text-5xl font-mono font-bold text-white drop-shadow-md tracking-tighter">${currentBid.toLocaleString()}</p>
               <p className="text-amber-400 font-bold mt-2">Last Bidder: {lastBidder}</p>
               {isEnded && <p className="text-4xl text-green-500 font-black mt-2 animate-bounce">SOLD TO {winner?.name}!</p>}
            </div>
         </div>
      </div>

      {/* 하단 관객석 (모든 게스트 + 유저) */}
      <div className="h-[250px] w-full bg-gradient-to-t from-black via-[#1a0000] to-transparent relative mt-auto z-30 flex items-end justify-center gap-4 px-10 pb-10 overflow-x-auto overflow-y-visible">
         {participants.map((p, i) => {
             const isTurn = i === currentTurnIndex;
             return (
                <div key={p.id} className={`relative flex-shrink-0 flex flex-col items-center transition-all duration-500 ${isTurn ? 'scale-110 z-40' : 'opacity-60 scale-90 z-10'}`}>
                    {/* 턴 표시 화살표 */}
                    {isTurn && !isEnded && <div className="absolute -top-24 text-4xl text-yellow-500 animate-bounce">⬇</div>}
                    
                    {/* 말풍선 (잘림 방지: z-index 높임, overflow-visible 유지) */}
                    {logs[0]?.startsWith(p.name) && (
                        <div className="absolute -top-20 z-50 bg-white text-black px-4 py-2 rounded-2xl text-sm font-bold shadow-lg border-2 border-amber-500 whitespace-nowrap min-w-[100px] text-center animate-in zoom-in">
                        {logs[0].split(': ')[1]}
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b-2 border-r-2 border-amber-500"></div>
                        </div>
                    )}
                    
                    <img 
                        src={p.avatar} 
                        className={`w-24 h-24 rounded-full border-4 ${isTurn ? 'border-yellow-500 shadow-[0_0_20px_rgba(255,215,0,0.6)]' : 'border-gray-700'}`} 
                        alt={p.name} 
                    />
                    <div className={`mt-2 px-3 py-1 rounded text-xs font-bold ${isTurn ? 'bg-yellow-600 text-black' : 'bg-black/50 text-gray-400'}`}>
                        {p.name}
                    </div>
                </div>
             );
         })}
      </div>

      {/* 컨트롤 패널 (유저 턴일 때만 활성화) */}
      <div className="absolute bottom-10 right-10 bg-black/90 p-6 rounded-2xl border border-amber-600 z-50 w-96 shadow-2xl">
         <div className="h-24 overflow-y-auto text-xs space-y-1 mb-4 text-gray-300 font-mono scrollbar-hide">
             {logs.map((l, i) => <p key={i} className={i===0?'text-yellow-400 font-bold text-sm':''}>{l}</p>)}
         </div>

         {!isEnded && currentPerson?.isUser ? (
             <div className="space-y-2 animate-pulse border border-yellow-500/50 p-2 rounded">
                 <p className="text-center text-yellow-500 font-bold mb-1">YOUR TURN!</p>
                 <div className="flex gap-2">
                    <input 
                        type="number" 
                        className="flex-1 bg-white/10 text-white p-2 rounded border border-gray-600 font-mono text-right"
                        placeholder="금액 입력"
                        value={myBidAmount}
                        onChange={e=>setMyBidAmount(Number(e.target.value))}
                    />
                    <button onClick={onUserBid} className="bg-amber-600 px-4 py-2 rounded text-white font-bold whitespace-nowrap hover:bg-amber-500 shadow-[0_0_10px_rgba(255,165,0,0.5)]">
                        BID
                    </button>
                 </div>
                 <button onClick={onUserPass} className="w-full bg-gray-700 py-2 rounded text-gray-300 font-bold hover:bg-gray-600 border border-gray-600">
                    PASS (건너뛰기)
                 </button>
             </div>
         ) : (
             !isEnded && (
                 <div className="text-center text-gray-500 py-4 italic border border-gray-800 rounded">
                     Waiting for {currentPerson?.name}...
                 </div>
             )
         )}

         {isEnded && (
             <button onClick={onClose} className="w-full mt-4 bg-gradient-to-r from-green-700 to-green-900 py-3 rounded text-white font-bold hover:scale-105 transition-transform shadow-lg">
                 경매장 나가기
             </button>
         )}
         
         {!isEnded && <button onClick={onClose} className="mt-2 text-xs text-red-900 underline w-full text-center hover:text-red-500">포기하고 나가기</button>}
      </div>
    </div>
  );
};

export default AuctionModal;
