import React, { useState } from 'react';
import { ChevronLeft, Share2, Download, Check } from 'lucide-react';

// --- GEOMETRÍAS SVG (Autocontenidas) ---
// Flor de la Vida simplificada (unos pocos círculos para el mockup)
const FlorDeLaVida = ({ color = "#BE9650", opacity = 0.8, scale = 1 }: { color?: string; opacity?: number; scale?: number }) => (
  <svg 
    viewBox="0 0 100 100" 
    style={{ 
      width: `${100 * scale}%`, 
      height: `${100 * scale}%`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity,
      filter: `drop-shadow(0 0 4px ${color}80)`
    }}
  >
    <g stroke={color} strokeWidth="1" fill="none">
      <circle cx="50" cy="50" r="20" />
      <circle cx="50" cy="30" r="20" />
      <circle cx="50" cy="70" r="20" />
      <circle cx="32.68" cy="40" r="20" />
      <circle cx="67.32" cy="40" r="20" />
      <circle cx="32.68" cy="60" r="20" />
      <circle cx="67.32" cy="60" r="20" />
    </g>
  </svg>
);

// Hexagrama
const Hexagrama = ({ color = "#7FD1C0", opacity = 0.8, scale = 1 }: { color?: string; opacity?: number; scale?: number }) => (
  <svg 
    viewBox="0 0 100 100" 
    style={{ 
      width: `${100 * scale}%`, 
      height: `${100 * scale}%`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity,
      filter: `drop-shadow(0 0 6px ${color}90)`
    }}
  >
    <g stroke={color} strokeWidth="1.2" fill="none">
      <polygon points="50,20 80,70 20,70" />
      <polygon points="50,80 20,30 80,30" />
      <circle cx="50" cy="50" r="34" />
    </g>
  </svg>
);

// Círculos concéntricos
const CirculosConcentricos = ({ color = "#B69BE0", opacity = 0.6, scale = 1 }: { color?: string; opacity?: number; scale?: number }) => (
  <svg 
    viewBox="0 0 100 100" 
    style={{ 
      width: `${100 * scale}%`, 
      height: `${100 * scale}%`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity,
      filter: `drop-shadow(0 0 8px ${color}60)`
    }}
  >
    <g stroke={color} strokeWidth="0.8" fill="none">
      <circle cx="50" cy="50" r="45" />
      <circle cx="50" cy="50" r="38" />
      <circle cx="50" cy="50" r="31" />
    </g>
  </svg>
);


export function ExportarPoster() {
  const [formato, setFormato] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [incluirMarca, setIncluirMarca] = useState(true);

  // Determinar las proporciones del preview según el formato
  const getPreviewDimensions = () => {
    switch (formato) {
      case '1:1': return { width: 280, height: 280 };
      case '9:16': return { width: 180, height: 320 };
      case '16:9': return { width: 320, height: 180 };
    }
  };

  const previewDim = getPreviewDimensions();

  return (
    <div 
      className="w-full min-h-screen relative overflow-hidden font-sans text-white flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #090D20 0%, #080A18 50%, #06070F 100%)',
        width: '390px',
        height: '844px',
        margin: '0 auto',
      }}
    >
      {/* Halo de fondo genérico tenue */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(190, 150, 80, 0.15) 0%, rgba(127, 209, 192, 0.05) 50%, transparent 100%)' }}
      />

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 pt-[52px] pb-4 relative z-10">
        <button className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} style={{ color: '#EDE1D3' }} />
        </button>
        <h1 className="text-lg font-medium tracking-wide" style={{ color: '#EDE1D3' }}>
          Exportar póster
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-6 pt-6 pb-8 relative z-10 overflow-y-auto">
        
        {/* PREVIEW ÁREA */}
        <div className="flex-1 flex items-center justify-center w-full min-h-[340px] mb-8">
          <div 
            className="relative flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ease-out"
            style={{
              width: `${previewDim.width}px`,
              height: `${previewDim.height}px`,
              background: 'linear-gradient(135deg, #0A0F24 0%, #060814 100%)',
              boxShadow: '0 0 0 1px rgba(190, 150, 80, 0.3), 0 20px 40px rgba(0,0,0,0.5)',
              borderRadius: formato === '1:1' ? '12px' : '16px'
            }}
          >
            {/* Composicióm de Geometrías */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <CirculosConcentricos scale={0.9} />
              <Hexagrama scale={0.7} opacity={0.5} />
              <FlorDeLaVida scale={0.5} />
            </div>

            {/* Marca de agua */}
            {incluirMarca && (
              <div 
                className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center text-center opacity-80"
              >
                <p className="text-[9px] tracking-[0.2em] font-light uppercase" style={{ color: '#D6A85B' }}>
                  RESONANCIA
                </p>
                <p className="text-[10px] tracking-wide mt-1" style={{ color: '#EDE1D3' }}>
                  Flor dorada
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLES */}
        <div className="w-full flex flex-col gap-6">
          
          {/* Formatos */}
          <div>
            <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#7A8FA8' }}>Formato</h2>
            <div className="flex gap-3">
              {[
                { id: '1:1', label: 'Cuadrado 1:1' },
                { id: '9:16', label: 'Historia 9:16' },
                { id: '16:9', label: 'Horizontal 16:9' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormato(f.id as any)}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 border"
                  style={{
                    backgroundColor: formato === f.id ? 'rgba(190, 150, 80, 0.1)' : 'rgba(190,150,80,0.05)',
                    borderColor: formato === f.id ? '#BE9650' : '#161f33',
                    color: formato === f.id ? '#BE9650' : '#EDE1D3'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Marca */}
          <div 
            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer"
            style={{ backgroundColor: 'rgba(190,150,80,0.05)', borderColor: '#161f33' }}
            onClick={() => setIncluirMarca(!incluirMarca)}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: '#EDE1D3' }}>Incluir marca RESONANCIA</p>
              <p className="text-xs mt-1" style={{ color: '#7A8FA8' }}>Muestra el logo y nombre de la composición</p>
            </div>
            <div 
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${incluirMarca ? 'bg-[#BE9650]' : 'bg-[#161f33]'}`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${incluirMarca ? 'translate-x-6' : 'translate-x-0'}`} 
              />
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="w-full mt-8 flex flex-col gap-3">
          <button 
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium tracking-wide transition-opacity active:opacity-80"
            style={{ backgroundColor: '#BE9650', color: '#06070F' }}
          >
            <Download size={20} />
            <span>Guardar imagen</span>
          </button>
          
          <button 
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium tracking-wide border transition-all active:bg-white/5"
            style={{ borderColor: '#161f33', color: '#EDE1D3' }}
          >
            <Share2 size={20} />
            <span>Compartir</span>
          </button>
        </div>

        <p className="text-[11px] mt-6 text-center" style={{ color: '#7A8FA8' }}>
          Imagen estática · para video, próximamente
        </p>

      </main>
    </div>
  );
}
