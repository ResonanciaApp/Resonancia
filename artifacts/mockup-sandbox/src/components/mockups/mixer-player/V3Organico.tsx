import React, { useState } from 'react';
import { ChevronDown, Pause, Clock, Check, Heart, Plus } from 'lucide-react';

export function V3Organico() {
  const [tormentaVol, setTormentaVol] = useState(70);
  const [nocheVol, setNocheVol] = useState(45);

  return (
    <div style={{ minHeight: '100vh', background: '#090F17' }} className="flex flex-col text-white font-sans overflow-hidden">
      <style>{`
        .slider-organic {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: rgba(190, 150, 80, 0.1);
          border-radius: 4px;
          outline: none;
          transition: background 0.2s;
        }
        
        .slider-organic::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #BE9650;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(190, 150, 80, 0.5);
        }
        
        .slider-organic::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #BE9650;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 6px rgba(190, 150, 80, 0.5);
        }

        .gold-glow {
          transition: all 0.2s ease;
        }
        
        .gold-glow:hover, .gold-glow:active {
          color: #BE9650;
          text-shadow: 0 0 8px rgba(190, 150, 80, 0.3);
        }
        
        .gold-glow:hover svg, .gold-glow:active svg {
          filter: drop-shadow(0 0 4px rgba(190, 150, 80, 0.4));
          color: #BE9650;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-6 pt-12">
        <button className="gold-glow text-gray-400">
          <ChevronDown size={24} />
        </button>
        <h1 className="text-lg font-medium tracking-wide text-gray-100">Lluvia nocturna</h1>
        <button className="gold-glow text-sm font-medium text-gray-400 uppercase tracking-wider">Cerrar</button>
      </div>

      {/* Tracks */}
      <div className="px-4 py-4 space-y-6 flex-1 mt-4">
        {/* Track 1 */}
        <div style={{ background: '#131820' }} className="rounded-[28px] p-5 shadow-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-200 font-medium">Tormenta</span>
            <span className="text-[#BE9650] text-sm opacity-80">{tormentaVol}%</span>
          </div>
          <div className="relative w-full h-4 flex items-center">
            <div 
              className="absolute left-0 h-1 rounded-l-full pointer-events-none"
              style={{ 
                width: `${tormentaVol}%`,
                background: 'linear-gradient(90deg, rgba(190,150,80,0.2) 0%, rgba(190,150,80,0.6) 100%)'
              }}
            />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={tormentaVol}
              onChange={(e) => setTormentaVol(Number(e.target.value))}
              className="slider-organic absolute inset-0 z-10 bg-transparent m-0"
            />
          </div>
        </div>

        {/* Track 2 */}
        <div style={{ background: '#131820' }} className="rounded-[28px] p-5 shadow-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-200 font-medium">Noche</span>
            <span className="text-[#BE9650] text-sm opacity-80">{nocheVol}%</span>
          </div>
          <div className="relative w-full h-4 flex items-center">
            <div 
              className="absolute left-0 h-1 rounded-l-full pointer-events-none"
              style={{ 
                width: `${nocheVol}%`,
                background: 'linear-gradient(90deg, rgba(190,150,80,0.2) 0%, rgba(190,150,80,0.6) 100%)'
              }}
            />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={nocheVol}
              onChange={(e) => setNocheVol(Number(e.target.value))}
              className="slider-organic absolute inset-0 z-10 bg-transparent m-0"
            />
          </div>
        </div>

        {/* Add Sound Button */}
        <div className="flex justify-center mt-8">
          <button className="gold-glow flex items-center gap-2 text-[#BE9650] opacity-80 font-medium tracking-wide py-2">
            <Plus size={20} />
            <span>Agregar sonidos</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 pb-12 pt-4 flex flex-col gap-10">
        <div className="flex justify-center items-center gap-16">
          <button className="gold-glow flex flex-col items-center gap-2 text-gray-300">
            <Clock size={28} strokeWidth={1.5} />
            <span className="text-xs tracking-wider uppercase opacity-80">Timer</span>
          </button>
          
          <button className="gold-glow flex flex-col items-center gap-3 text-[#BE9650]">
            <Pause size={56} strokeWidth={1} fill="currentColor" className="opacity-90" />
            <span className="text-xs tracking-widest uppercase font-medium">Pausar</span>
          </button>
          
          <div className="w-[28px]"></div> {/* Spacer to balance Timer */}
        </div>

        <div className="flex justify-between items-center px-2 mt-4">
          <button className="gold-glow flex items-center gap-2 text-gray-300">
            <Check size={20} strokeWidth={1.5} />
            <span className="text-sm font-medium tracking-wide">Actualizar</span>
          </button>
          
          <button className="gold-glow flex items-center gap-2 text-gray-300">
            <Heart size={20} strokeWidth={1.5} />
            <span className="text-sm font-medium tracking-wide">Guardar nueva</span>
          </button>
        </div>
      </div>
    </div>
  );
}
