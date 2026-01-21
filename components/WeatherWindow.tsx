
import React from 'react';
import { WeatherType } from '../types';

interface Props {
  weather: WeatherType;
}

const WeatherWindow: React.FC<Props> = ({ weather }) => {
  const getSkyColor = () => {
    switch (weather) {
      case WeatherType.SUNNY: return 'from-blue-400 to-blue-600';
      case WeatherType.RAINY: return 'from-gray-700 to-gray-900';
      case WeatherType.SNOWY: return 'from-blue-100 to-blue-300';
      case WeatherType.CLOUDY: return 'from-gray-400 to-gray-600';
      default: return 'from-blue-500 to-blue-700';
    }
  };

  return (
    <div className="w-48 h-64 border-4 border-amber-900 rounded-t-full relative overflow-hidden bg-gradient-to-b shadow-inner">
      <div className={`absolute inset-0 bg-gradient-to-b ${getSkyColor()} transition-colors duration-1000`}></div>
      {weather === WeatherType.RAINY && (
        <div className="absolute inset-0 opacity-50">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute bg-white/40 w-px h-4 animate-rain" style={{ left: `${i * 5}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random()}s` }}></div>
          ))}
        </div>
      )}
      {weather === WeatherType.SNOWY && (
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute bg-white rounded-full w-1 h-1 animate-snow" style={{ left: `${Math.random() * 100}%`, top: '-10px', animationDelay: `${Math.random() * 5}s` }}></div>
          ))}
        </div>
      )}
      {weather === WeatherType.SUNNY && (
        <div className="absolute top-4 right-4 w-10 h-10 bg-yellow-300 rounded-full blur-sm animate-pulse"></div>
      )}
      <style>{`
        @keyframes rain { 0% { transform: translateY(-100%); } 100% { transform: translateY(500%); } }
        @keyframes snow { 0% { transform: translateY(-10px) translateX(0); } 100% { transform: translateY(300px) translateX(20px); } }
        .animate-rain { animation: rain 0.8s linear infinite; }
        .animate-snow { animation: snow 4s linear infinite; }
      `}</style>
    </div>
  );
};

export default WeatherWindow;
