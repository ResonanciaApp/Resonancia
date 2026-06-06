import React, { useState } from "react";
import { X, Pause, Check, Heart } from "lucide-react";
import "./_group.css";

export function V4Etereo() {
  const [vol1, setVol1] = useState(70);
  const [vol2, setVol2] = useState(40);

  return (
    <div className="w-full h-full min-h-[800px] max-w-[400px] mx-auto bg-[#090F17] text-white flex flex-col relative overflow-hidden animate-breathe-bg">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-8 z-10">
        <h2 className="text-xs font-light tracking-widest uppercase text-white/50">Lluvia nocturna</h2>
        <button className="text-white/30 hover:text-white transition-colors p-2">
          <X className="w-5 h-5" strokeWidth={1} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-10 z-10 space-y-20">
        
        {/* Pistas */}
        <div className="space-y-12 w-full max-w-[280px] mx-auto">
          <div className="space-y-4 group">
            <div className="flex justify-between text-[11px] font-light text-white/40 tracking-wider">
              <span>Tormenta</span>
            </div>
            <input 
              type="range" 
              className="slider-ethereal" 
              min="0" 
              max="100" 
              value={vol1}
              onChange={(e) => setVol1(parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-4 group">
            <div className="flex justify-between text-[11px] font-light text-white/40 tracking-wider">
              <span>Noche</span>
            </div>
            <input 
              type="range" 
              className="slider-ethereal" 
              min="0" 
              max="100" 
              value={vol2}
              onChange={(e) => setVol2(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Control central */}
        <div className="flex flex-col items-center justify-center mt-8 relative">
          {/* Ring pulsante */}
          <div className="absolute w-[120px] h-[120px] rounded-full border border-[#BE9650] animate-breathe pointer-events-none" />
          
          <button className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-[#BE9650] bg-[#BE9650]/5 hover:bg-[#BE9650]/10 transition-colors">
            <Pause className="w-8 h-8" strokeWidth={1} />
          </button>

          {/* Timer */}
          <div className="mt-12 text-[10px] tracking-[0.2em] font-light text-white/30">
            30:00
          </div>
        </div>

      </div>

      {/* Footer controls */}
      <div className="pb-12 pt-8 flex justify-center items-center gap-20 z-10">
        <button className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-[#BE9650] transition-colors rounded-full">
          <Check className="w-4 h-4" strokeWidth={1} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-[#BE9650] transition-colors rounded-full">
          <Heart className="w-4 h-4" strokeWidth={1} />
        </button>
      </div>

    </div>
  );
}
