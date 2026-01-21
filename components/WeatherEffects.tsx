
import React from 'react';
import { WeatherType } from '../types';

interface WeatherProps {
  type: WeatherType;
}

const WeatherEffects: React.FC<WeatherProps> = ({ type }) => {
  if (type === WeatherType.SUNNY) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1 bg-white/5 rotate-45 blur-xl animate-pulse"></div>
      </div>
    );
  }

  if (type === WeatherType.RAINY) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-blue-200 w-px h-8"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `rain-fall ${0.5 + Math.random() * 0.5}s linear infinite`,
              animationDelay: `${Math.random()}s`
            }}
          />
        ))}
        <style>{`
          @keyframes rain-fall {
            0% { transform: translateY(-100vh); }
            100% { transform: translateY(100vh); }
          }
        `}</style>
      </div>
    );
  }

  if (type === WeatherType.SNOWY) {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-50">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full w-1 h-1"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `snow-fall ${3 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random()}s`
              }}
            />
          ))}
          <style>{`
            @keyframes snow-fall {
              0% { transform: translate(0, -10px); }
              100% { transform: translate(20px, 100vh); }
            }
          `}</style>
        </div>
      );
  }

  return null;
};

export default WeatherEffects;
