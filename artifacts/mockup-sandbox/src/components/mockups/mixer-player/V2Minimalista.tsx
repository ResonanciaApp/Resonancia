import React from 'react';
import { X } from 'lucide-react';

export function V2Minimalista() {
  return (
    <div 
      className="min-h-screen flex flex-col relative text-white" 
      style={{
        background: '#090F17', 
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <style>{`
        .custom-slider {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
          outline: none;
        }
        .custom-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 1.5px;
          background: rgba(255, 255, 255, 0.15);
        }
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 2px;
          width: 16px;
          background: #BE9650;
          margin-top: -0.25px;
          border-radius: 0;
          cursor: pointer;
        }
        .custom-slider::-moz-range-track {
          width: 100%;
          height: 1.5px;
          background: rgba(255, 255, 255, 0.15);
        }
        .custom-slider::-moz-range-thumb {
          height: 2px;
          width: 16px;
          background: #BE9650;
          border: none;
          border-radius: 0;
          cursor: pointer;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-12 pb-8">
        <div className="w-6"></div> {/* Spacer for centering */}
        <h1 className="text-xs tracking-[0.2em] font-light text-white/70">
          lluvia nocturna
        </h1>
        <button className="text-white/70 hover:text-white transition-colors">
          <X size={20} strokeWidth={1} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-8">
        {/* Play/Pause Control */}
        <div className="flex flex-col items-center justify-center space-y-4 mb-24">
          <button className="text-2xl tracking-[0.2em] font-light text-white hover:text-[#BE9650] transition-colors">
            PAUSAR
          </button>
          <button className="text-[10px] tracking-[0.15em] text-white/40 uppercase">
            · timer ·
          </button>
        </div>

        {/* Tracks */}
        <div className="space-y-12">
          {/* Track 1 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-[0.15em] text-white/80">
                Tormenta
              </span>
              <span className="text-[10px] text-[#BE9650]">70%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              defaultValue="70" 
              className="custom-slider w-full"
            />
          </div>

          {/* Track 2 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-[0.15em] text-white/80">
                Noche
              </span>
              <span className="text-[10px] text-[#BE9650]">45%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              defaultValue="45" 
              className="custom-slider w-full"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pb-12 pt-8 flex justify-center items-center text-[10px] tracking-[0.15em] uppercase text-white/40">
        <button className="hover:text-white transition-colors">actualizar</button>
        <span className="mx-3">·</span>
        <button className="hover:text-white transition-colors">guardar nueva</button>
      </div>
    </div>
  );
}
