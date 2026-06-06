import React from 'react';
import { ChevronDown, Pause, Clock, Plus, Check, Heart } from 'lucide-react';

export function V1Flotante() {
  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-end" 
      style={{ background: '#090F17', color: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <style>{`
        .zen-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          outline: none;
          margin: 16px 0;
        }
        .zen-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
          transition: transform 0.2s ease;
        }
        .zen-slider::-webkit-slider-thumb:hover {
          transform: scale(1.5);
        }
      `}</style>
      
      <div className="w-full max-w-md mx-auto flex flex-col px-8 pb-16 pt-12 gap-12">
        {/* Header */}
        <div className="flex items-center justify-between text-white/60">
          <button className="hover:text-white transition-colors">
            <ChevronDown className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <h2 className="text-lg font-light tracking-widest text-white/90">Lluvia nocturna</h2>
          <button className="text-sm tracking-wider hover:text-white transition-colors">
            Cerrar
          </button>
        </div>

        {/* Tracks */}
        <div className="flex flex-col gap-10 mt-6">
          {/* Track 1 */}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl flex-shrink-0 bg-gradient-to-br from-[#1E293B] to-[#0F172A] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1595167099719-75f111812833?auto=format&fit=crop&q=80&w=200')] bg-cover bg-center mix-blend-overlay"></div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="text-base font-light tracking-wide text-white/80">Tormenta</span>
              <input type="range" className="zen-slider" defaultValue="75" />
            </div>
          </div>
          
          {/* Track 2 */}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl flex-shrink-0 bg-gradient-to-br from-[#312E81] to-[#1E1B4B] shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1507502707541-f369a3b18502?auto=format&fit=crop&q=80&w=200')] bg-cover bg-center mix-blend-overlay"></div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="text-base font-light tracking-wide text-white/80">Noche</span>
              <input type="range" className="zen-slider" defaultValue="45" />
            </div>
          </div>
        </div>

        {/* Add sounds */}
        <div className="flex justify-center mt-4">
          <button className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white/80 transition-colors">
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            <span>Agregar sonidos</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-24 mt-12 mb-6">
          <button className="flex flex-col items-center gap-4 text-white/70 hover:text-white transition-all hover:scale-105">
            <Pause className="w-10 h-10 font-light" strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-[0.2em]">Pausar</span>
          </button>
          <button className="flex flex-col items-center gap-4 text-white/70 hover:text-white transition-all hover:scale-105">
            <Clock className="w-10 h-10 font-light" strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-[0.2em]">45:00</span>
          </button>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between mt-4">
          <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#BE9650]/80 hover:text-[#BE9650] transition-colors">
            <Check className="w-4 h-4" strokeWidth={1.5} />
            <span>Actualizar</span>
          </button>
          <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#BE9650]/80 hover:text-[#BE9650] transition-colors">
            <Heart className="w-4 h-4" strokeWidth={1.5} />
            <span>Guardar nueva</span>
          </button>
        </div>
      </div>
    </div>
  );
}
