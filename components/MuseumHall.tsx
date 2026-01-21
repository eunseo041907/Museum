
import React, { useState, useEffect, useRef } from 'react';
import { Artwork, Guest, WeatherType } from '../types';
import { getGuestCritique } from '../services/geminiService';

interface Props {
  artworks: Artwork[];
  guests: Guest[];
  weather: WeatherType;
  isDarkMode: boolean;
  customBackground: string | null;
  onCritiqueUpdate: (artId: string, guestName: string, text: string) => void;
  onArtClick: (art: Artwork) => void;
  onMusicPlayerClick: () => void;
  newArtId?: string;
  onCleanArt: (art: Artwork) => void; // 먼지 닦기 핸들러
  // Daily Critique
  checkCanCritique: (guestId: string) => boolean;
  onCritiqueGenerated: (guestId: string) => void;
}

interface GuestState {
  id: string;
  x: number;
  targetX: number;
  state: 'walking' | 'viewing';
  facingRight: boolean; // 현재 렌더링 시 오른쪽을 보고 있는지
  viewingArtId: string | null;
  message: string | null;
  isHearting: boolean;
}

const MuseumHall: React.FC<Props> = ({ artworks, guests, weather, isDarkMode, customBackground, onCritiqueUpdate, onArtClick, onMusicPlayerClick, newArtId, onCleanArt, checkCanCritique, onCritiqueGenerated }) => {
  const [guestStates, setGuestStates] = useState<Record<string, GuestState>>({});
  const hallRef = useRef<HTMLDivElement>(null);
  const artRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // 작품 수에 따라 홀 길이 동적 계산
  const hallWidth = Math.max(2000, artworks.length * 600 + 1000);

  // 자동 스크롤
  useEffect(() => {
    if (newArtId && artRefs.current[newArtId]) {
      artRefs.current[newArtId]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [newArtId]);

  // 게스트 초기 상태 설정
  useEffect(() => {
    const initialStates: Record<string, GuestState> = {};
    guests.forEach(g => {
      if (!guestStates[g.id]) {
        initialStates[g.id] = {
          id: g.id,
          x: Math.random() * (hallWidth - 200) + 100,
          targetX: Math.random() * (hallWidth - 200) + 100,
          state: 'walking',
          facingRight: true,
          viewingArtId: null,
          message: null,
          isHearting: false
        };
      }
    });
    setGuestStates(prev => ({ ...prev, ...initialStates }));
  }, [guests.length]);

  // 5분에 한 번씩 과거 회상 (Random Recall)
  useEffect(() => {
    const RECALL_INTERVAL = 300000; // 5분 (300,000ms)

    const timer = setInterval(() => {
        setGuestStates(prev => {
            const next = { ...prev };
            let updated = false;

            Object.keys(next).forEach(id => {
                const guest = guests.find(g => g.id === id);
                const currentState = next[id];

                // 움직이는 중이고(감상중 아님), 메세지가 없고, 과거 기록이 있을 때
                if (guest && guest.critiqueHistory.length > 0 && currentState.state === 'walking' && !currentState.message) {
                    const randomCritique = guest.critiqueHistory[Math.floor(Math.random() * guest.critiqueHistory.length)];
                    
                    next[id] = {
                        ...currentState,
                        message: `(회상) ${randomCritique.text}` // 과거 감상평 출력
                    };
                    updated = true;

                    // 5초 뒤 메세지 삭제
                    setTimeout(() => {
                        setGuestStates(curr => ({
                            ...curr,
                            [id]: { ...curr[id], message: null }
                        }));
                    }, 5000);
                }
            });

            return updated ? next : prev;
        });
    }, RECALL_INTERVAL);

    return () => clearInterval(timer);
  }, [guests]); // guests가 바뀌면 타이머 리셋 (상호작용 중에는 회상 안함)

  // 게스트 AI 루프 (이동 및 행동)
  useEffect(() => {
    const interval = setInterval(() => {
      setGuestStates(prev => {
        const next = { ...prev };
        
        Object.keys(next).forEach(key => {
          const guest = guests.find(g => g.id === key);
          const state = next[key];
          if (!guest) return;

          if (state.state === 'walking') {
            const dx = state.targetX - state.x;
            const distance = Math.abs(dx);
            const speed = 2; // 이동 속도

            // 방향 결정 (이미지 반전 로직을 위해)
            const isMovingRight = dx > 0;
            state.facingRight = isMovingRight; 

            if (distance < 10) {
              // 목적지 도착 -> 감상 모드 전환
              state.state = 'viewing';
              
              // 주변에 작품이 있는지 확인
              const nearbyArt = artworks.find(a => {
                  const artEl = artRefs.current[a.id];
                  if (!artEl) return false;
                  return Math.abs(artEl.offsetLeft + 150 - state.x) < 200; // 작품 중심부 근처
              });

              if (nearbyArt) {
                 state.viewingArtId = nearbyArt.id;
                 state.targetX = state.x; // 정지

                 // 출연진이면 하트
                 if (nearbyArt.cast.includes(guest.id)) {
                    state.isHearting = true;
                    setTimeout(() => {
                        setGuestStates(curr => ({...curr, [key]: {...curr[key], isHearting: false}}));
                    }, 3000);
                 }

                 // 감상평 로직 (비동기 처리)
                 (async () => {
                     let text = "";
                     const history = guest.critiqueHistory.filter(h => h.artId === nearbyArt.id);
                     
                     // 1. 기존 기록이 있으면 50% 확률로 다시 말하기 (Silent 모드 방지)
                     if (history.length > 0 && Math.random() > 0.5) {
                         text = history[Math.floor(Math.random() * history.length)].text;
                     } 
                     // 2. 새로운 감상평 생성 (일일 제한 확인)
                     else if (guest.isCritiqueActive && checkCanCritique(guest.id)) {
                         try {
                             text = await getGuestCritique(nearbyArt, guest);
                             onCritiqueUpdate(nearbyArt.id, guest.name, text); // 기록 저장
                             onCritiqueGenerated(guest.id); // 일일 완료 처리
                         } catch (e) {
                             console.error("Critique failed", e);
                         }
                     }

                     if (text) {
                         setGuestStates(curr => ({...curr, [key]: {...curr[key], message: text}}));
                         setTimeout(() => {
                             setGuestStates(curr => ({...curr, [key]: {...curr[key], message: null}}));
                         }, 6000);
                     }
                 })();

                 // 감상 후 다시 이동 (5~10초 후)
                 setTimeout(() => {
                    setGuestStates(curr => {
                        if (!curr[key]) return curr;
                        return {
                            ...curr,
                            [key]: {
                                ...curr[key],
                                state: 'walking',
                                targetX: Math.random() * (hallWidth - 200) + 100,
                                viewingArtId: null
                            }
                        };
                    });
                 }, Math.random() * 5000 + 5000);
              } else {
                 // 주변에 작품 없으면 바로 다른 곳으로 이동
                 state.state = 'walking';
                 state.targetX = Math.random() * (hallWidth - 200) + 100;
              }
            } else {
              // 이동 중
              state.x += isMovingRight ? speed : -speed;
            }
          }
        });
        return next;
      });
    }, 1000 / 60); // 60fps 부드러운 이동

    return () => clearInterval(interval);
  }, [artworks, guests, hallWidth]);


  // 먼지 계산
  const getDustOpacity = (art: Artwork) => {
     const daysSinceClean = (Date.now() - art.lastCleanedAt) / (1000 * 60 * 60 * 24);
     return Math.min(0.9, daysSinceClean * 0.03); 
  };
  
  const isLoved = (art: Artwork) => art.dailyClickCount >= 5;

  return (
    <div className={`overflow-x-auto overflow-y-hidden relative h-[750px] transition-colors duration-1000 ${isDarkMode ? 'bg-[#121212]' : 'bg-[#e0e0e0]'}`} ref={hallRef}>
      
      <div style={{ width: `${hallWidth}px` }} className="h-full relative flex flex-col justify-end">
        
        {/* 1. 벽면 (커스텀 배경이 있으면 기본 벽면을 덮음) */}
        {customBackground ? (
          <div 
             className="absolute inset-0 z-0" 
             style={{ 
                 backgroundImage: `url(${customBackground})`, 
                 backgroundRepeat: 'repeat-x', 
                 backgroundSize: 'auto 100%' 
             }}
          ></div>
        ) : (
          <div className={`absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply ${isDarkMode ? 'bg-[url("https://www.transparenttextures.com/patterns/black-mamba.png")]' : 'bg-neutral-200 bg-[url("https://www.transparenttextures.com/patterns/white-diamond.png")]'}`}></div>
        )}

        {/* 2. 조명 효과 (Spotlights) */}
        {!isDarkMode ? (
           <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none z-10"></div>
        ) : (
           <div className="absolute inset-0 bg-black/40 pointer-events-none z-10"></div>
        )}

        {/* 3. 바닥 */}
        <div className={`absolute bottom-0 left-0 right-0 h-48 border-t-8 ${isDarkMode ? 'border-[#333] bg-[#1a1a1a]' : 'border-[#8B4513] bg-[#3d2b1f]'} z-20`}>
            <div className={`absolute inset-0 opacity-20 bg-[url("https://www.transparenttextures.com/patterns/wood-pattern.png")]`}></div>
            <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-black/90' : 'from-black/40'} to-transparent`}></div>
        </div>

        {/* 4. 작품 및 앤틱 가구 */}
        {/* 작품 위치 조정: mb-12로 바닥쪽으로 내림 */}
        <div className="flex items-end px-40 mb-12 z-30 relative space-x-48">
          
          <div className="relative group cursor-pointer flex-shrink-0" onClick={onMusicPlayerClick}>
              <div className="w-32 h-40 bg-[url('https://cdn-icons-png.flaticon.com/512/2402/2402246.png')] bg-contain bg-no-repeat bg-bottom drop-shadow-2xl transition-transform group-hover:scale-110"></div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/70 text-amber-500 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-amber-600">
                🎵 Audio System
              </div>
          </div>

          {artworks.map((art) => (
            <div 
              key={art.id} 
              ref={(el) => { artRefs.current[art.id] = el; }}
              onClick={() => onArtClick(art)} 
              className="relative group flex-shrink-0 flex flex-col items-center cursor-pointer"
            >
               {/* 핀조명 */}
               <div className={`absolute top-[-150px] left-1/2 -translate-x-1/2 w-[400px] h-[600px] bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none blur-2xl ${isDarkMode ? 'opacity-80' : 'opacity-30'}`}></div>

               {/* 액자 */}
               <div className="relative p-4 bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] shadow-2xl rounded-lg transition-transform duration-500 group-hover:-translate-y-4">
                 <div className="border border-[#725424] p-1 bg-black relative overflow-hidden">
                    {/* 먼지 */}
                    <div 
                        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] pointer-events-auto z-20 cursor-sw-resize hover:bg-red-500/10 transition-colors"
                        style={{ opacity: getDustOpacity(art) }}
                        onClick={(e) => { e.stopPropagation(); onCleanArt(art); }}
                        title="닦아서 청소하기 ($100)"
                    ></div>

                    {/* 애정 상태 */}
                    {isLoved(art) && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 via-green-500/20 to-blue-500/20 mix-blend-overlay animate-pulse pointer-events-none z-10"></div>
                    )}

                    <img src={art.imageUrl} className="h-[320px] w-auto object-contain max-w-[500px]" alt={art.title} />
                 </div>
               </div>

               {/* 황금빛 명찰 */}
               <div className="mt-8 relative w-[220px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700 rounded-lg transform skew-x-[-10deg] shadow-lg border border-yellow-200"></div>
                  <div className="relative z-10 py-2 px-3 text-center transform skew-x-[-10deg] flex flex-col items-center">
                     <span className="font-cinzel font-bold text-amber-900/40 text-[8px] tracking-[0.2em] mb-0.5">
                        #{String(art.indexNumber).padStart(3, '0')}
                     </span>
                     <p className="font-cinzel font-black text-black text-sm uppercase tracking-widest truncate w-full mb-1">
                        {art.title}
                     </p>
                     <div className="w-10 h-px bg-amber-900/30 mb-1"></div>
                     <div className="flex justify-between items-center w-full px-1">
                        <span className="text-[9px] font-serif text-amber-900 font-bold truncate max-w-[100px]">
                           {art.owner}
                        </span>
                        <span className="text-[10px] font-mono text-red-900 font-black">
                           ${art.price.toLocaleString()}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* 5. 펜스 */}
        <div className="absolute bottom-40 left-0 w-full h-24 pointer-events-none z-40 flex items-end px-10">
           {Array.from({ length: Math.ceil(hallWidth / 150) }).map((_, i) => (
             <div key={i} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${i * 150 + 50}px` }}>
               <div className="w-3 h-20 bg-gradient-to-r from-yellow-800 via-yellow-300 to-yellow-800 rounded-t-full shadow-lg relative z-20">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-yellow-500 rounded-full shadow-sm"></div>
               </div>
               <svg className="absolute top-[12px] left-[6px] w-[150px] h-[60px] overflow-visible z-10" style={{ pointerEvents: 'none' }}>
                  <path d="M 0 0 Q 75 40 150 0" stroke="#800000" strokeWidth="4" fill="none" className="drop-shadow-md" />
               </svg>
             </div>
           ))}
        </div>

        {/* 6. 캐릭터 */}
        <div className="relative h-48 w-full z-50 pointer-events-none">
           {guests.map(guest => {
             const state = guestStates[guest.id];
             if (!state) return null;
             
             let transform = '';
             if (state.facingRight) {
                 transform = guest.initialFacing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
             } else {
                 transform = guest.initialFacing === 'left' ? 'scaleX(1)' : 'scaleX(-1)';
             }

             return (
               <div 
                 key={guest.id}
                 className="absolute transition-transform duration-[16ms] linear flex flex-col items-center"
                 style={{ left: state.x, bottom: '50px' }}
               >
                 {state.message && (
                   <div className={`mb-3 p-3 rounded-2xl shadow-xl max-w-[220px] text-xs font-serif leading-relaxed animate-in zoom-in slide-in-from-bottom-2 duration-500 relative border ${isDarkMode ? 'bg-black/90 text-white border-gray-700' : 'bg-white/95 text-black border-amber-200'}`}>
                     <span className="text-[9px] text-amber-500 block mb-1 font-bold">{artworks.find(a=>a.id===state.viewingArtId)?.title || '작품'}</span>
                     "{state.message}"
                     <div className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-b border-r ${isDarkMode ? 'bg-black border-gray-700' : 'bg-white border-amber-200'}`}></div>
                   </div>
                 )}
                 {state.isHearting && (
                     <div className="absolute top-[-40px] text-4xl animate-bounce">💖</div>
                 )}
                 <img 
                   src={guest.fullBodyImage || guest.avatar} 
                   className="h-44 w-auto object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]"
                   style={{ transform }}
                   alt={guest.name} 
                 />
                 <div className="bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full mt-1 backdrop-blur-sm border border-white/20">
                   {guest.name}
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default MuseumHall;
