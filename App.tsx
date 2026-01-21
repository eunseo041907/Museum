
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Artwork, Guest, WeatherType, UserState } from './types';
import MuseumHall from './components/MuseumHall';
import WeatherEffects from './components/WeatherEffects';
import ImageUploader from './components/ImageUploader';
import ArtworkDetailModal from './components/ArtworkDetailModal';
import AuctionModal from './components/AuctionModal';
import GuestDetailModal from './components/GuestDetailModal';

const INITIAL_GUESTS: Guest[] = [
  { 
    id: 'g1', 
    name: '김선생', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', 
    fullBodyImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1&top=shortHair&clothing=suit',
    personality: '엄격하고 분석적임', 
    speechStyle: '~인 듯하군.', 
    affinity: 45, 
    ownedArtworks: ['황금빛 고찰'],
    recentCritique: '구도가 매우 안정적이야.',
    isCritiqueActive: true,
    initialFacing: 'left',
    critiqueHistory: []
  },
  { 
    id: 'g2', 
    name: '이지은', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', 
    fullBodyImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2&top=longHair&clothing=dress',
    personality: '감성적이고 활발함', 
    speechStyle: '완전 대박이에요!', 
    affinity: 80, 
    ownedArtworks: [],
    recentCritique: '색감이 너무 영롱해요!',
    isCritiqueActive: true,
    initialFacing: 'right',
    critiqueHistory: []
  },
];

const INITIAL_USER: UserState = {
  username: '사용자',
  profilePic: 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
  balance: 100000000,
  collection: [
    { 
        id: 'a1', indexNumber: 1, title: '황금빛 고찰', artist: '미지의 예술가', 
        imageUrl: 'https://picsum.photos/seed/art1/600/800', description: '인간의 내면을 황금색으로 투영한 작품.', 
        cast: ['g1', 'g2'], owner: '김선생', price: 34000000, estAuctionPrice: 40000000, 
        isApproved: true, critiques: [], registeredAt: Date.now() - 100000000,
        lastCleanedAt: Date.now(), dailyClickCount: 0, lastClickDate: new Date().toDateString(),
        totalViewTime: 120000
    },
    { 
        id: 'a2', indexNumber: 2, title: '디지털 몽상', artist: '사이보그', 
        imageUrl: 'https://picsum.photos/seed/art2/600/800', description: '기계가 꿈꾸는 미래의 모습.', 
        cast: ['g2'], owner: '익명', price: 28000000, estAuctionPrice: 30000000, 
        isApproved: true, critiques: [], registeredAt: Date.now() - 50000000,
        lastCleanedAt: Date.now(), dailyClickCount: 0, lastClickDate: new Date().toDateString(),
        totalViewTime: 45000
    },
  ],
  backgrounds: { day: null, night: null }
};

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

type AudioSource = { type: 'youtube' | 'file', url: string } | null;

interface DailyCritiqueState {
    date: string;
    targetGuestIds: string[]; 
    completedGuestIds: string[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hall' | 'guests' | 'upload' | 'collection' | 'profile'>('hall');
  const [user, setUser] = useState<UserState>(INITIAL_USER);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [weather, setWeather] = useState<WeatherType>(WeatherType.SUNNY);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [auctionArtwork, setAuctionArtwork] = useState<Artwork | null>(null);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  // Audio State
  const [globalMusicSource, setGlobalMusicSource] = useState<AudioSource>(null);
  const [activeArtMusic, setActiveArtMusic] = useState<AudioSource>(null);
  
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);

  const [dailyCritiqueState, setDailyCritiqueState] = useState<DailyCritiqueState>({ date: '', targetGuestIds: [], completedGuestIds: [] });
  
  const viewingStartRef = useRef<number>(0);

  const globalYTRef = useRef<any>(null);
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  const artYTRef = useRef<any>(null);
  const artAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fade Interval Refs to prevent conflicts
  const globalFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const artFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [uploadForm, setUploadForm] = useState({ title: '', desc: '', cast: [] as string[], price: 0, imageUrl: '' });
  const [guestForm, setGuestForm] = useState({ id: '', name: '', personality: '', speechStyle: '', avatar: '', body: '', facing: 'left' as 'left'|'right' });
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  
  const [sortOption, setSortOption] = useState<'newest'|'oldest'|'priceDesc'>('newest');
  const [newlyRegisteredArtId, setNewlyRegisteredArtId] = useState<string | undefined>(undefined);

  useEffect(() => {
      const today = new Date().toDateString();
      const stored = localStorage.getItem('dailyCritiqueState');
      let newState: DailyCritiqueState;
      if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.date !== today) {
              newState = initializeDailyCritiques(today);
          } else {
              newState = parsed;
          }
      } else {
          newState = initializeDailyCritiques(today);
      }
      setDailyCritiqueState(newState);
      localStorage.setItem('dailyCritiqueState', JSON.stringify(newState));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests.length]); 

  const initializeDailyCritiques = (date: string): DailyCritiqueState => {
      const shuffled = [...guests].sort(() => 0.5 - Math.random());
      const targets = shuffled.slice(0, 3).map(g => g.id);
      return { date, targetGuestIds: targets, completedGuestIds: [] };
  };

  const checkCanCritique = (guestId: string): boolean => {
      return dailyCritiqueState.targetGuestIds.includes(guestId) && 
             !dailyCritiqueState.completedGuestIds.includes(guestId);
  };

  const markCritiqueComplete = (guestId: string) => {
      setDailyCritiqueState(prev => {
          const newState = {
              ...prev,
              completedGuestIds: [...prev.completedGuestIds, guestId]
          };
          localStorage.setItem('dailyCritiqueState', JSON.stringify(newState));
          return newState;
      });
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        globalYTRef.current = new window.YT.Player('yt-global-player', {
          height: '0', width: '0',
          playerVars: { loop: 1, playlist: '' }, 
          events: {
            'onReady': (event: any) => {
               if(globalMusicSource?.type === 'youtube') {
                   event.target.playVideo();
                   setIsPlaying(true);
               }
            },
            'onStateChange': (event: any) => {
                if(event.data === window.YT.PlayerState.ENDED) event.target.playVideo(); 
                // Only update playing state if art music is not active (to avoid confusing UI)
                if(activeArtMusic === null) setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            }
          }
        });

        artYTRef.current = new window.YT.Player('yt-art-player', {
            height: '0', width: '0',
            playerVars: { loop: 1 },
            events: {
              'onStateChange': (event: any) => {
                  if(event.data === window.YT.PlayerState.ENDED) event.target.playVideo();
              }
            }
        });
      };
    }
  }, []);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fadeAudio = (
      target: 'global' | 'art', 
      direction: 'in' | 'out', 
      callback?: () => void
  ) => {
      const isGlobal = target === 'global';
      const ytPlayer = isGlobal ? globalYTRef.current : artYTRef.current;
      const htmlAudio = isGlobal ? globalAudioRef.current : artAudioRef.current;
      const intervalRef = isGlobal ? globalFadeRef : artFadeRef;
      
      if (intervalRef.current) clearInterval(intervalRef.current);

      const maxVol = volume; 
      const steps = 30; // 30 steps
      const duration = 1500; // 1.5s transition
      const stepTime = duration / steps;
      let currentStep = 0;

      // Start Play if fading in
      if (direction === 'in') {
          if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
              ytPlayer.setVolume(0);
              ytPlayer.playVideo();
          }
          if (htmlAudio) {
              htmlAudio.volume = 0;
              htmlAudio.play().catch(() => {});
          }
      }

      intervalRef.current = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;
          // ease-in-out effect
          const ease = progress < .5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
          
          const currentVol = direction === 'in' ? ease * maxVol : (1 - ease) * maxVol;
          
          if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
              ytPlayer.setVolume(currentVol);
          }
          if (htmlAudio) {
              htmlAudio.volume = currentVol / 100;
          }

          if (currentStep >= steps) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;
              
              if (direction === 'out') {
                  // Pause to keep position
                  if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
                  if (htmlAudio) htmlAudio.pause();
              }
              if (callback) callback();
          }
      }, stepTime);
  };

  // 1. Global Music Source Change
  useEffect(() => {
      if(globalYTRef.current?.stopVideo) globalYTRef.current.stopVideo();
      if(globalAudioRef.current) { globalAudioRef.current.pause(); globalAudioRef.current = null; }

      if (!globalMusicSource) {
          setIsPlaying(false);
          return;
      }

      if (globalMusicSource.type === 'youtube') {
          const vId = extractVideoId(globalMusicSource.url);
          if (globalYTRef.current && vId) {
              globalYTRef.current.loadPlaylist([vId], 0);
              globalYTRef.current.setLoop(true);
              globalYTRef.current.setVolume(volume);
              
              if (!activeArtMusic) { 
                  globalYTRef.current.playVideo();
                  setIsPlaying(true);
              } else {
                  globalYTRef.current.pauseVideo();
              }
          }
      } else {
          const audio = new Audio(globalMusicSource.url);
          audio.loop = true;
          audio.volume = volume / 100;
          globalAudioRef.current = audio;
          if (!activeArtMusic) {
              audio.play().catch(console.error);
              setIsPlaying(true);
          }
      }
  }, [globalMusicSource]);

  // 2. Volume Change
  useEffect(() => {
      // Direct volume set, careful not to override fade logic if fading
      // Just updating the "max" concept effectively
      if (!globalFadeRef.current) {
          if (globalYTRef.current?.setVolume) globalYTRef.current.setVolume(volume);
          if (globalAudioRef.current) globalAudioRef.current.volume = volume / 100;
      }
      if (!artFadeRef.current) {
          if (artYTRef.current?.setVolume) artYTRef.current.setVolume(volume);
          if (artAudioRef.current) artAudioRef.current.volume = volume / 100;
      }
  }, [volume]);

  // 3. Smart Transition Logic
  useEffect(() => {
      const art = selectedArtwork;
      
      const targetArtMusic: AudioSource = (art?.musicUrl) 
          ? { type: 'youtube', url: art.musicUrl } 
          : (art?.audioFile) ? { type: 'file', url: art.audioFile } 
          : null;

      const isArtMusicPlaying = !!activeArtMusic;
      const isTargetArtMusic = !!targetArtMusic;

      if (art) {
          // Inside Modal
          if (isTargetArtMusic) {
              // Target has music
              if (isArtMusicPlaying) {
                  // Crossfade A -> B
                  fadeAudio('art', 'out', () => {
                      loadArtMusic(targetArtMusic);
                      fadeAudio('art', 'in');
                  });
              } else {
                  // Global -> Art
                  fadeAudio('global', 'out'); // Pause global
                  loadArtMusic(targetArtMusic);
                  fadeAudio('art', 'in');
              }
          } else {
              // Target has NO music (should play global)
              if (isArtMusicPlaying) {
                  // Art -> Global
                  fadeAudio('art', 'out');
                  setActiveArtMusic(null);
                  if (globalMusicSource) fadeAudio('global', 'in');
              } else {
                  // Global -> Global (Ensure it's playing if paused/lowered)
                  if (globalMusicSource) fadeAudio('global', 'in');
              }
          }
      } else {
          // Exiting Modal
          if (isArtMusicPlaying) {
              fadeAudio('art', 'out');
              setActiveArtMusic(null);
              if (globalMusicSource) fadeAudio('global', 'in');
          } else {
               if (globalMusicSource) fadeAudio('global', 'in');
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtwork]);

  const loadArtMusic = (source: AudioSource) => {
      if (!source) return;
      
      if (artAudioRef.current) { artAudioRef.current.pause(); artAudioRef.current = null; }
      
      if (source.type === 'youtube') {
          const vId = extractVideoId(source.url);
          if (artYTRef.current && vId) {
              artYTRef.current.loadVideoById(vId);
              artYTRef.current.setVolume(0); 
          }
      } else {
          const audio = new Audio(source.url);
          audio.loop = true;
          audio.volume = 0; 
          artAudioRef.current = audio;
      }
      setActiveArtMusic(source);
  };

  useEffect(() => {
    const hour = new Date().getHours();
    setIsDarkMode(hour >= 18 || hour < 6);
  }, []);

  const handleCleanArt = (art: Artwork) => {
      setUser(prev => ({
          ...prev,
          balance: prev.balance + 100,
          collection: prev.collection.map(a => a.id === art.id ? { ...a, lastCleanedAt: Date.now() } : a)
      }));
  };

  const handleArtClick = (art: Artwork) => {
      viewingStartRef.current = Date.now();
      const today = new Date().toDateString();
      const newCount = art.lastClickDate === today ? art.dailyClickCount + 1 : 1;
      const updatedArt = { ...art, dailyClickCount: newCount, lastClickDate: today };
      handleUpdateArtwork(updatedArt);
      setSelectedArtwork(updatedArt);
  };

  const calculatePriceUpdate = (art: Artwork, duration: number) => {
      const TEN_MINUTES = 10 * 60 * 1000;
      const currentTotal = art.totalViewTime || 0;
      const newTotal = currentTotal + duration;
      
      // Calculate how many 10-minute blocks existed before vs now
      const oldBlocks = Math.floor(currentTotal / TEN_MINUTES);
      const newBlocks = Math.floor(newTotal / TEN_MINUTES);
      const gainedBlocks = newBlocks - oldBlocks;

      if (gainedBlocks > 0) {
          const increaseRate = art.owner === '나 (User)' ? 3000000 : 1000000;
          return {
              price: art.price + (gainedBlocks * increaseRate),
              totalViewTime: newTotal
          };
      }
      
      return { price: art.price, totalViewTime: newTotal };
  };

  const handleCloseModal = () => {
      if (selectedArtwork && viewingStartRef.current > 0) {
          const duration = Date.now() - viewingStartRef.current;
          
          // Price Increase Logic
          const { price, totalViewTime } = calculatePriceUpdate(selectedArtwork, duration);

          const updatedArt = { 
              ...selectedArtwork, 
              totalViewTime, 
              price 
          };
          handleUpdateArtwork(updatedArt);
      }
      viewingStartRef.current = 0;
      setSelectedArtwork(null);
  };

  const handleUpdateArtwork = (updated: Artwork) => {
    setUser(prev => ({
      ...prev,
      collection: prev.collection.map(a => a.id === updated.id ? updated : a)
    }));
    if (selectedArtwork && selectedArtwork.id === updated.id) {
         setSelectedArtwork(updated); 
    }
  };

  const sortedCollection = useMemo(() => {
      const list = [...user.collection];
      if (sortOption === 'newest') return list.sort((a,b) => b.registeredAt - a.registeredAt);
      if (sortOption === 'oldest') return list.sort((a,b) => a.registeredAt - b.registeredAt);
      if (sortOption === 'priceDesc') return list.sort((a,b) => b.price - a.price);
      return list;
  }, [user.collection, sortOption]);

  const handleNavigateArtwork = (direction: 'prev' | 'next') => {
      if (!selectedArtwork) return;
      
      // Save current artwork stats before navigating
      if (viewingStartRef.current > 0) {
          const duration = Date.now() - viewingStartRef.current;
          
          // Price Increase Logic
          const { price, totalViewTime } = calculatePriceUpdate(selectedArtwork, duration);

          const updatedPrevArt = { 
              ...selectedArtwork, 
              totalViewTime,
              price
          };
          handleUpdateArtwork(updatedPrevArt);
      }
      
      const currentIndex = sortedCollection.findIndex(a => a.id === selectedArtwork.id);
      if (currentIndex === -1) return;
      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= sortedCollection.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = sortedCollection.length - 1;
      const nextArt = sortedCollection[nextIndex];
      viewingStartRef.current = Date.now();
      setSelectedArtwork(nextArt);
  };

  const handleSellArt = (art: Artwork) => {
      if (!art) return;
      // Removed window.confirm to avoid blocking issues. 
      // The button now has an internal "Confirm" state.

      const salePrice = art.price;

      // Optimistic update
      setUser(prev => ({
          ...prev,
          balance: prev.balance + salePrice,
          collection: prev.collection.map(a => a.id === art.id ? { ...a, owner: 'Pearce Museum' } : a)
      }));

      // Directly update selectedArtwork state if it matches
      if (selectedArtwork && selectedArtwork.id === art.id) {
          setSelectedArtwork(prev => prev ? ({ ...prev, owner: 'Pearce Museum' }) : null);
      }
      
      // Optional: Add a non-blocking toast or just log it
      console.log(`Sold ${art.title} for ${salePrice}`);
  };

  const handleAddCritique = (guestId: string, text: string) => {
      if (!selectedArtwork) return;
      const updatedArt = {
          ...selectedArtwork,
          critiques: [{ guestName: guests.find(g=>g.id===guestId)?.name || 'Unknown', text }, ...selectedArtwork.critiques]
      };
      handleUpdateArtwork(updatedArt);
      setSelectedArtwork(updatedArt);
      setGuests(prev => prev.map(g => {
          if (g.id === guestId) {
              return { 
                  ...g, 
                  critiqueHistory: [...g.critiqueHistory, { artId: updatedArt.id, artTitle: updatedArt.title, text }]
              };
          }
          return g;
      }));
  };

  const handleGuestEdit = (guest: Guest) => {
      setGuestForm({
          id: guest.id, name: guest.name, personality: guest.personality, speechStyle: guest.speechStyle,
          avatar: guest.avatar, body: guest.fullBodyImage, facing: guest.initialFacing
      });
      setIsEditingGuest(true);
  };

  const saveGuest = () => {
      if (isEditingGuest) {
          setGuests(prev => prev.map(g => g.id === guestForm.id ? {
              ...g, name: guestForm.name, personality: guestForm.personality, speechStyle: guestForm.speechStyle,
              avatar: guestForm.avatar, fullBodyImage: guestForm.body, initialFacing: guestForm.facing
          } : g));
          setIsEditingGuest(false);
      } else {
          const newGuest: Guest = {
            id: Date.now().toString(), name: guestForm.name, avatar: guestForm.avatar, fullBodyImage: guestForm.body,
            personality: guestForm.personality, speechStyle: guestForm.speechStyle, affinity: 0, ownedArtworks: [], 
            isCritiqueActive: true, critiqueHistory: [], initialFacing: guestForm.facing
          };
          setGuests([...guests, newGuest]);
      }
      setGuestForm({ id: '', name: '', personality: '', speechStyle: '', avatar: '', body: '', facing: 'left' });
  };

  const handleDeleteArt = (e: React.MouseEvent, artId: string) => {
      e.stopPropagation(); e.preventDefault();
      // eslint-disable-next-line no-restricted-globals
      if (confirm("정말로 이 작품을 삭제하시겠습니까? (복구 불가)")) {
          setUser(prev => ({...prev, collection: prev.collection.filter(c => c.id !== artId)}));
      }
  };

  const handleDownload = (e: React.MouseEvent, art: Artwork) => {
      e.stopPropagation();
      const link = document.createElement('a'); link.href = art.imageUrl; link.download = `${art.title.replace(/\s+/g, '_')}_AuraMuseum.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleDeleteGuest = (e: React.MouseEvent, guestId: string) => {
      e.stopPropagation(); e.preventDefault();
      // eslint-disable-next-line no-restricted-globals
      if (confirm("정말로 이 손님을 목록에서 삭제하시겠습니까?")) {
          setGuests(prev => prev.filter(g => g.id !== guestId));
      }
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-[#faf9f6] text-neutral-900'}`}>
      <WeatherEffects type={weather} />
      
      <div id="yt-global-player" className="fixed bottom-0 left-0 w-1 h-1 opacity-0 pointer-events-none" />
      <div id="yt-art-player" className="fixed bottom-0 left-0 w-1 h-1 opacity-0 pointer-events-none" />

      {/* 배경 설정 모달 */}
      {isBgModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setIsBgModalOpen(false)}>
              <div className="bg-neutral-900 p-6 rounded-xl w-96 border border-amber-600" onClick={e=>e.stopPropagation()}>
                  <h3 className="text-amber-500 font-cinzel mb-4 text-center">Customize Background</h3>
                  <div className="space-y-4">
                      <ImageUploader label="Day" shape="rect" defaultImage={user.backgrounds.day || ''} onImageSelect={(b64) => setUser(p => ({...p, backgrounds: {...p.backgrounds, day: b64}}))} />
                      <ImageUploader label="Night" shape="rect" defaultImage={user.backgrounds.night || ''} onImageSelect={(b64) => setUser(p => ({...p, backgrounds: {...p.backgrounds, night: b64}}))} />
                      <button onClick={() => setUser(p => ({...p, backgrounds: { day: null, night: null }}))} className="w-full bg-gray-700 py-2 rounded text-white text-xs">Reset to Default</button>
                  </div>
              </div>
          </div>
      )}

      {/* 전역 음악 설정 모달 */}
      {isMusicModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setIsMusicModalOpen(false)}>
              <div className="bg-neutral-900 p-6 rounded-xl w-96 border border-amber-600 text-center" onClick={e=>e.stopPropagation()}>
                  <h3 className="text-amber-500 font-cinzel mb-4">MUSEUM GLOBAL BGM</h3>
                  <p className="text-gray-400 text-xs mb-4">Set background music for the hall.</p>
                  <input placeholder="YouTube URL..." onChange={(e) => setGlobalMusicSource({type:'youtube', url:e.target.value})} className="w-full bg-black p-2 rounded border border-gray-700 mb-2 text-white" />
                  <div className="text-gray-500 text-xs mb-4">- OR -</div>
                  <input type="file" accept="audio/*" onChange={(e) => { const file = e.target.files?.[0]; if(file) setGlobalMusicSource({type:'file', url: URL.createObjectURL(file)}); }} className="text-white text-xs" />
                  <button onClick={() => setIsMusicModalOpen(false)} className="mt-4 w-full bg-amber-700 py-2 rounded text-white">CLOSE</button>
              </div>
          </div>
      )}

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b p-4 flex justify-between items-center transition-all ${isDarkMode ? 'bg-black/90 border-amber-900/20 shadow-2xl' : 'bg-white/90 border-amber-100 shadow-md'}`}>
        <div className="flex items-center gap-3 w-1/4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-8 h-8 rounded-full border flex items-center justify-center text-lg flex-shrink-0`}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          <h1 onClick={() => setIsBgModalOpen(true)} className="font-cinzel tracking-[0.2em] text-lg font-bold cursor-pointer hover:text-amber-500 transition-colors whitespace-nowrap hidden sm:block">
            PEARCE MUSEUM
          </h1>
        </div>
        <div className="flex-1 flex justify-center">
            <div className="flex gap-6 md:gap-10 text-[11px] md:text-xs font-bold tracking-widest uppercase items-center">
                <button onClick={() => setActiveTab('hall')} className={`hover:scale-105 transition-transform ${activeTab === 'hall' ? 'text-amber-500 border-b border-amber-500 pb-1' : 'text-gray-400 hover:text-white'}`}>Hall</button>
                <button onClick={() => setActiveTab('collection')} className={`hover:scale-105 transition-transform ${activeTab === 'collection' ? 'text-amber-500 border-b border-amber-500 pb-1' : 'text-gray-400 hover:text-white'}`}>Archive</button>
                <button onClick={() => setActiveTab('guests')} className={`hover:scale-105 transition-transform ${activeTab === 'guests' ? 'text-amber-500 border-b border-amber-500 pb-1' : 'text-gray-400 hover:text-white'}`}>Guests</button>
                <button onClick={() => setActiveTab('upload')} className="bg-amber-800/80 px-4 py-1.5 rounded text-white hover:bg-amber-600 transition-all border border-amber-600/50">Register Art</button>
            </div>
        </div>
        <div className="flex items-center gap-4 w-1/4 justify-end">
           <div className="hidden lg:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10 mr-2">
                <span className="text-[9px] text-amber-500 font-bold w-12 truncate text-center">{isPlaying ? 'ON AIR' : 'OFF'}</span>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-12 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
           </div>
           <div className="flex items-center gap-3">
               <div className="flex flex-col items-end justify-center">
                   <span className="text-amber-500 font-mono text-xs font-bold hidden md:inline">${user.balance.toLocaleString()}</span>
                   <button onClick={() => setIsMusicModalOpen(true)} className="text-[9px] text-gray-400 hover:text-amber-400 flex items-center gap-1 mt-0.5 transition-colors" title="Global BGM Settings">
                       <span className="text-[8px]">🎵</span> BGM
                   </button>
               </div>
               <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full border-2 border-amber-600 overflow-hidden flex-shrink-0">
                   <img src={user.profilePic} alt="Me" className="w-full h-full object-cover" />
               </button>
           </div>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        {activeTab === 'hall' && (
          <MuseumHall 
            artworks={user.collection} guests={guests} weather={weather} isDarkMode={isDarkMode}
            customBackground={isDarkMode ? user.backgrounds.night : user.backgrounds.day}
            newArtId={newlyRegisteredArtId}
            onCritiqueUpdate={(id, name, text) => setUser(prev => ({...prev, collection: prev.collection.map(a => a.id === id ? { ...a, critiques: [{ guestName: name, text }, ...a.critiques] } : a)}))}
            onArtClick={handleArtClick} onMusicPlayerClick={() => setIsMusicModalOpen(true)} onCleanArt={handleCleanArt}
            checkCanCritique={checkCanCritique} onCritiqueGenerated={markCritiqueComplete}
          />
        )}
        {/* collection tab etc ... (no changes needed for other tabs) */}
        {activeTab === 'collection' && (
           <div className="max-w-7xl mx-auto px-6 py-10 min-h-[80vh]">
              <div className="flex justify-between items-end mb-8 border-b border-gray-700 pb-4">
                 <h2 className="text-3xl font-cinzel text-amber-600">ARCHIVE</h2>
                 <div className="flex gap-2">
                    <button onClick={() => setSortOption('newest')} className={`text-xs px-2 py-1 ${sortOption==='newest'?'text-amber-500':'text-gray-500'}`}>Newest</button>
                    <button onClick={() => setSortOption('oldest')} className={`text-xs px-2 py-1 ${sortOption==='oldest'?'text-amber-500':'text-gray-500'}`}>Oldest</button>
                    <button onClick={() => setSortOption('priceDesc')} className={`text-xs px-2 py-1 ${sortOption==='priceDesc'?'text-amber-500':'text-gray-500'}`}>Price</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {sortedCollection.map(art => (
                    <div key={art.id} className="group relative bg-black rounded-lg overflow-hidden border border-amber-900/30 hover:border-amber-600 transition-all hover:-translate-y-2">
                       <div onClick={() => handleArtClick(art)} className="aspect-[3/4] overflow-hidden relative cursor-pointer bg-neutral-900">
                          <img src={art.imageUrl} className="w-full h-full object-contain hover:scale-105 transition-transform" alt={art.title} />
                          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-[9px] text-amber-500 rounded font-mono">#{String(art.indexNumber).padStart(3, '0')}</div>
                          <button onClick={(e) => handleDownload(e, art)} className="absolute bottom-2 right-2 bg-black/60 hover:bg-amber-600 text-white p-1.5 rounded-full z-20 transition-colors opacity-0 group-hover:opacity-100" title="Download Image">⬇️</button>
                       </div>
                       <div className="p-3 flex justify-between items-center text-xs text-gray-400 bg-neutral-900">
                          <div className="flex flex-col"><span className="font-bold text-white truncate w-32">{art.title}</span><span className="text-[9px]">${art.price.toLocaleString()}</span></div>
                          <button onClick={(e) => handleDeleteArt(e, art.id)} className="text-red-500 hover:text-red-400 font-bold px-2 py-1 z-[100] hover:bg-white/10 rounded border border-red-900/30 cursor-pointer">X</button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
        {activeTab === 'guests' && (
          <div className="max-w-5xl mx-auto px-6 py-10">
            <h2 className="text-3xl font-cinzel text-center text-amber-600 mb-12">GUEST LIST</h2>
            <div className="bg-neutral-900 p-6 rounded-xl border border-amber-900/50 mb-10">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-cinzel text-amber-500">{isEditingGuest ? 'EDIT GUEST INFO' : 'INVITE NEW GUEST'}</h3>
                 {isEditingGuest && <button onClick={() => { setIsEditingGuest(false); setGuestForm({ id: '', name: '', personality: '', speechStyle: '', avatar: '', body: '', facing: 'left' }); }} className="text-xs text-red-500">CANCEL</button>}
               </div>
               <div className="flex gap-4">
                   <div className="flex flex-col gap-2">
                      <ImageUploader label="Face" shape="circle" defaultImage={guestForm.avatar} onImageSelect={b64 => setGuestForm(p => ({...p, avatar: b64}))} />
                      <ImageUploader label="Body" shape="rect" defaultImage={guestForm.body} onImageSelect={b64 => setGuestForm(p => ({...p, body: b64}))} />
                   </div>
                   <div className="flex-1 space-y-2">
                      <input className="w-full bg-black p-2 rounded border border-gray-700 text-sm text-white" placeholder="Name" value={guestForm.name} onChange={e => setGuestForm(p => ({...p, name: e.target.value}))} />
                      <input className="w-full bg-black p-2 rounded border border-gray-700 text-sm text-white" placeholder="Personality" value={guestForm.personality} onChange={e => setGuestForm(p => ({...p, personality: e.target.value}))} />
                      <input className="w-full bg-black p-2 rounded border border-gray-700 text-sm text-white" placeholder="Speech Style" value={guestForm.speechStyle} onChange={e => setGuestForm(p => ({...p, speechStyle: e.target.value}))} />
                      <div className="flex gap-4 items-center text-xs text-gray-400">
                         <span>Initial Facing:</span>
                         <label><input type="radio" name="facing" checked={guestForm.facing === 'left'} onChange={() => setGuestForm(p => ({...p, facing: 'left'}))} /> Left</label>
                         <label><input type="radio" name="facing" checked={guestForm.facing === 'right'} onChange={() => setGuestForm(p => ({...p, facing: 'right'}))} /> Right</label>
                      </div>
                      <button onClick={saveGuest} className={`w-full py-2 rounded font-bold text-white mt-2 ${isEditingGuest ? 'bg-green-700 hover:bg-green-600' : 'bg-amber-700 hover:bg-amber-600'}`}>{isEditingGuest ? 'UPDATE GUEST' : 'INVITE'}</button>
                   </div>
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {guests.map(g => (
                    <div key={g.id} onClick={() => setSelectedGuest(g)} className="relative bg-neutral-800 p-4 rounded-lg border border-white/5 group hover:border-amber-500 transition-colors cursor-pointer">
                        <div className="absolute top-2 right-2 flex gap-1 z-[100]" onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); handleGuestEdit(g); }} className="text-[10px] bg-blue-900 px-2 py-0.5 rounded text-white hover:bg-blue-800">EDIT</button>
                            <button onClick={(e) => handleDeleteGuest(e, g.id)} className="text-[10px] bg-red-900 px-2 py-0.5 rounded text-white hover:bg-red-800 cursor-pointer">DEL</button>
                        </div>
                        <img src={g.avatar} className="w-16 h-16 rounded-full border border-amber-600 mb-2 mx-auto object-cover" alt={g.name} />
                        <p className="text-center font-bold text-amber-500">{g.name}</p>
                        <p className="text-[10px] text-center text-gray-400 truncate">{g.personality}</p>
                        <div className="mt-2 flex justify-center" onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); setGuests(prev => prev.map(p => p.id === g.id ? {...p, isCritiqueActive: !p.isCritiqueActive} : p)); }} className={`text-[10px] px-2 py-1 rounded-full border ${g.isCritiqueActive ? 'bg-green-900 border-green-500 text-green-300' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>{g.isCritiqueActive ? '💬 Auto Critique: ON' : '🔇 Auto Critique: OFF'}</button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
        {activeTab === 'upload' && (
           <div className="max-w-xl mx-auto py-10 px-6">
              <h2 className="text-2xl font-cinzel text-center mb-6 text-amber-500">ART REGISTRATION</h2>
              <div className="bg-neutral-900 p-8 rounded-xl border border-amber-900/40 space-y-6">
                 <div className="flex justify-center"><ImageUploader label="Art Image" shape="full" onImageSelect={(b64) => setUploadForm({...uploadForm, imageUrl: b64})} /></div>
                 <input placeholder="Title" className="w-full bg-black p-3 border border-gray-700 rounded text-white" onChange={e => setUploadForm({...uploadForm, title: e.target.value})} />
                 <textarea placeholder="Description" className="w-full bg-black p-3 border border-gray-700 rounded h-24 text-white" onChange={e => setUploadForm({...uploadForm, desc: e.target.value})} />
                 <div>
                    <p className="text-xs text-amber-600 mb-2 font-bold">CAST</p>
                    <div className="flex flex-wrap gap-2">{guests.map(g => (<button key={g.id} onClick={() => { const cast = uploadForm.cast.includes(g.id) ? uploadForm.cast.filter(id => id !== g.id) : [...uploadForm.cast, g.id]; setUploadForm({...uploadForm, cast}); }} className={`px-3 py-1 rounded-full text-xs border ${uploadForm.cast.includes(g.id) ? 'bg-amber-600 border-amber-600 text-white' : 'border-gray-600 text-gray-400'}`}>{g.name}</button>))}</div>
                 </div>
                 <input type="number" placeholder="Price ($1M - $10M)" className="w-full bg-black p-3 border border-gray-700 rounded text-white" onChange={e => setUploadForm({...uploadForm, price: Number(e.target.value)})} />
                 <button onClick={() => {
                    if (uploadForm.price < 1000000 || uploadForm.price > 10000000) return alert('Check Price Range!');
                    const newArt: Artwork = {
                        id: Date.now().toString(), indexNumber: user.collection.length + 1, title: uploadForm.title, artist: user.username, imageUrl: uploadForm.imageUrl,
                        description: uploadForm.desc, cast: uploadForm.cast, 
                        owner: 'Pearce Museum', // CHANGED: Museum owns it immediately
                        price: uploadForm.price, estAuctionPrice: uploadForm.price * 1.2,
                        isApproved: true, critiques: [], registeredAt: Date.now(), lastCleanedAt: Date.now(), dailyClickCount: 0, lastClickDate: new Date().toDateString(), totalViewTime: 0
                    };
                    setUser(p => ({ ...p, collection: [...p.collection, newArt], balance: p.balance + newArt.price }));
                    setNewlyRegisteredArtId(newArt.id); setActiveTab('hall');
                 }} className="w-full bg-amber-700 py-3 rounded font-bold hover:bg-amber-600 text-white">REGISTER (SELL TO MUSEUM)</button>
              </div>
           </div>
        )}
        {activeTab === 'profile' && (
           <div className="max-w-4xl mx-auto py-10 px-6">
               <div className="flex flex-col items-center mb-10">
                   <div className="mb-4"><ImageUploader label="EDIT PROFILE PIC" shape="circle" defaultImage={user.profilePic} onImageSelect={(b64) => setUser(p => ({...p, profilePic: b64}))} /></div>
                   <h2 className="text-3xl font-cinzel text-amber-500">{user.username}</h2>
                   <div className="mt-4 p-4 bg-neutral-900 border border-amber-600 rounded-xl min-w-[300px] text-center">
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Assets</p>
                       <p className="text-2xl font-mono font-bold text-green-500">${user.balance.toLocaleString()}</p>
                   </div>
               </div>
               <h3 className="text-xl font-cinzel text-amber-600 mb-6 border-b border-gray-700 pb-2">MY COLLECTION</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {user.collection.filter(art => art.owner === '나 (User)').length > 0 ? (
                      user.collection.filter(art => art.owner === '나 (User)').map(art => (
                          <div key={art.id} onClick={() => handleArtClick(art)} className="bg-neutral-800 p-2 rounded cursor-pointer border border-transparent hover:border-amber-500">
                              <img src={art.imageUrl} className="w-full aspect-square object-cover mb-2 rounded" alt="art" />
                              <p className="text-center text-xs font-bold text-white truncate">{art.title}</p>
                              <p className="text-center text-[9px] text-gray-500">${art.price.toLocaleString()}</p>
                          </div>
                      ))
                  ) : <p className="col-span-4 text-center text-gray-500">소유한 작품이 없습니다.</p>}
               </div>
           </div>
        )}
      </main>

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork} guests={guests} userBalance={user.balance} onClose={handleCloseModal}
          onUpdateArtwork={handleUpdateArtwork} onStartAuction={() => { setAuctionArtwork(selectedArtwork); setSelectedArtwork(null); }}
          onAddCritique={handleAddCritique} onClean={() => handleCleanArt(selectedArtwork)} onNavigate={handleNavigateArtwork}
          onDelete={() => { setUser(prev => ({...prev, collection: prev.collection.filter(c => c.id !== selectedArtwork.id)})); setSelectedArtwork(null); }}
          onSell={() => selectedArtwork && handleSellArt(selectedArtwork)}
          allArtworks={user.collection}
        />
      )}
      {selectedGuest && <GuestDetailModal guest={selectedGuest} onClose={() => setSelectedGuest(null)} />}
      {auctionArtwork && (
        <AuctionModal artwork={auctionArtwork} guests={guests} userBalance={user.balance} onClose={() => setAuctionArtwork(null)}
           onAuctionEnd={(winner, price) => { handleUpdateArtwork({ ...auctionArtwork, owner: winner, price }); if(winner === '나 (User)') setUser(p => ({...p, balance: p.balance - price})); setAuctionArtwork(null); }}
        />
      )}
    </div>
  );
};

export default App;
