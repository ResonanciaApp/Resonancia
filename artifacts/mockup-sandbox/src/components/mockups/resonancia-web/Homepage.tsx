import React from 'react';
import { Play, Sparkles, Moon, Headphones, Wind, CheckCircle2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function Homepage() {
  return (
    <div className="min-h-screen font-sans selection:bg-[#BE9650] selection:text-[#0B0F14]" style={{ backgroundColor: '#0B0F14', color: '#EDE1D3' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        .font-serif {
          font-family: 'Cormorant Garamond', serif;
        }
        .font-sans {
          font-family: 'Inter', sans-serif;
        }
        
        .bg-card-glass {
          background-color: rgba(190, 150, 80, 0.05);
          border: 1px solid rgba(190, 150, 80, 0.15);
        }
        
        .text-gold { color: #BE9650; }
        .text-gold-light { color: #D6A85B; }
        .text-secondary { color: #7A8FA8; }
        
        .bg-gold { background-color: #BE9650; }
        .bg-gold:hover { background-color: #D6A85B; }
        
        .border-gold { border-color: rgba(190, 150, 80, 0.15); }
        .border-gold-solid { border-color: #BE9650; }
        
        .hero-gradient {
          background: radial-gradient(circle at 70% 50%, rgba(190, 150, 80, 0.08) 0%, transparent 50%),
                      radial-gradient(circle at 30% 80%, rgba(190, 150, 80, 0.05) 0%, transparent 40%);
        }
      `}} />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-gold backdrop-blur-md" style={{ backgroundColor: 'rgba(11, 15, 20, 0.8)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-widest text-gold">RESONANCIA</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#biblioteca" className="hover:text-gold transition-colors text-secondary">Biblioteca</a>
            <a href="#meditaciones" className="hover:text-gold transition-colors text-secondary">Meditaciones</a>
            <a href="#musica" className="hover:text-gold transition-colors text-secondary">Música</a>
            <a href="#precios" className="hover:text-gold transition-colors text-secondary">Precios</a>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="hover:text-gold hover:bg-transparent text-[#EDE1D3]">
              Iniciar sesión
            </Button>
            <Button className="bg-gold text-[#0B0F14] hover:bg-[#D6A85B] border-0 rounded-none px-6">
              Empezar gratis
            </Button>
          </div>
          
          <button className="md:hidden text-gold">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden hero-gradient">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.1] mb-6">
              Tu santuario de <br/><span className="text-gold italic">calma interior</span>
            </h1>
            <p className="text-lg md:text-xl text-secondary mb-10 max-w-lg leading-relaxed font-light">
              Descubre un refugio de paz con meditaciones guiadas, sonidos ancestrales y música diseñada para tu bienestar mental.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gold text-[#0B0F14] hover:bg-[#D6A85B] border-0 rounded-none h-14 px-8 text-base">
                Empezar gratis
              </Button>
              <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-[#0B0F14] rounded-none h-14 px-8 text-base bg-transparent">
                Ver contenido
              </Button>
            </div>
          </div>
          
          {/* Abstract SVG Decoration */}
          <div className="relative flex justify-center items-center h-[400px] md:h-[500px]">
            <svg viewBox="0 0 400 400" className="w-full max-w-[400px] opacity-80" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BE9650" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#D6A85B" stopOpacity="0.2" />
                </linearGradient>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#BE9650" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0B0F14" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="200" cy="200" r="200" fill="url(#glow)" />
              <circle cx="200" cy="200" r="140" fill="none" stroke="url(#gold-grad)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="200" cy="200" r="100" fill="none" stroke="url(#gold-grad)" strokeWidth="2" />
              <circle cx="200" cy="200" r="60" fill="none" stroke="url(#gold-grad)" strokeWidth="1" />
              
              <path d="M 200 40 L 200 100 M 200 300 L 200 360 M 40 200 L 100 200 M 300 200 L 360 200" stroke="#BE9650" strokeWidth="1" strokeOpacity="0.5" />
              <path d="M 87 87 L 130 130 M 270 270 L 313 313 M 87 313 L 130 270 M 270 130 L 313 87" stroke="#BE9650" strokeWidth="1" strokeOpacity="0.5" />
              
              <circle cx="200" cy="200" r="20" fill="#BE9650" fillOpacity="0.8" />
            </svg>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="biblioteca" className="py-20 border-t border-gold relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-gold mb-4">Explora la biblioteca</h2>
              <p className="text-secondary max-w-xl">Encuentra la práctica perfecta para cada momento de tu día.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: "Meditaciones Guiadas", desc: "Prácticas para reducir ansiedad, enfocar la mente y estar presente." },
              { icon: Play, title: "Sonidos Ancestrales", desc: "Frecuencias de cuencos tibetanos y gongs para relajación profunda." },
              { icon: Wind, title: "Naturaleza", desc: "Grabaciones inmersivas de lluvia, bosques y océanos." },
              { icon: Moon, title: "Para Dormir", desc: "Historias y paisajes sonoros diseñados para inducir el sueño." }
            ].map((cat, i) => (
              <Card key={i} className="bg-card-glass border-gold rounded-none p-6 hover:bg-[rgba(190,150,80,0.08)] transition-all cursor-pointer group">
                <cat.icon className="w-10 h-10 text-gold mb-6 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl mb-3">{cat.title}</h3>
                <p className="text-sm text-secondary font-light leading-relaxed">{cat.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Resonancia */}
      <section className="py-24 relative overflow-hidden">
        {/* Background decorative SVG */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-center opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
             <pattern id="pattern-circles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
               <circle cx="50" cy="50" r="40" fill="none" stroke="#BE9650" strokeWidth="1"/>
             </pattern>
             <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-gold mb-6">¿Por qué RESONANCIA?</h2>
            <p className="text-secondary max-w-2xl mx-auto text-lg">Diseñado específicamente para nuestra cultura, con atención al detalle sonoro.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-card-glass flex items-center justify-center mb-6">
                <span className="font-serif text-3xl text-gold">ES</span>
              </div>
              <h3 className="font-serif text-2xl mb-3">100% en español</h3>
              <p className="text-secondary font-light">Contenido original creado por guías y terapeutas hispanohablantes. Sin traducciones.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-card-glass flex items-center justify-center mb-6">
                <Headphones className="w-8 h-8 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl mb-3">Audio de alta fidelidad</h3>
              <p className="text-secondary font-light">Grabaciones binaurales y masterización profesional para una experiencia inmersiva.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-card-glass flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl mb-3">Sin distracciones</h3>
              <p className="text-secondary font-light">Una interfaz oscura, elegante y minimalista que invita a soltar el estrés visual.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-24 border-t border-gold bg-[#080B0F]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-gold mb-6">Comienza tu viaje</h2>
            <p className="text-secondary text-lg">Elige el plan que mejor resuene contigo.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Free Tier */}
            <Card className="bg-transparent border border-[rgba(190,150,80,0.2)] rounded-none p-8 md:p-10">
              <h3 className="font-serif text-3xl mb-2 text-[#EDE1D3]">Esencial</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-light text-gold">Gratis</span>
              </div>
              <p className="text-secondary mb-8 h-12">Acceso a una selección curada para empezar a meditar.</p>
              
              <ul className="space-y-4 mb-10">
                {['10 meditaciones básicas', '3 sonidos ancestrales', 'Temporizador simple', 'Sin anuncios'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#EDE1D3]">
                    <CheckCircle2 className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    {feat}
                  </li>
                ))}
              </ul>
              
              <Button variant="outline" className="w-full border-gold text-[#EDE1D3] hover:bg-[rgba(190,150,80,0.1)] hover:text-gold rounded-none h-12 bg-transparent">
                Crear cuenta gratuita
              </Button>
            </Card>
            
            {/* Premium Tier */}
            <Card className="bg-card-glass border-gold-solid rounded-none p-8 md:p-12 relative overflow-hidden transform md:scale-105 shadow-2xl shadow-[rgba(190,150,80,0.05)]">
              <div className="absolute top-0 right-0 bg-gold text-[#0B0F14] text-xs font-bold px-4 py-1 uppercase tracking-widest">
                Recomendado
              </div>
              
              <h3 className="font-serif text-3xl mb-2 text-gold">Premium</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-medium text-[#EDE1D3]">$4.99</span>
                <span className="text-secondary">/ mes</span>
              </div>
              <p className="text-secondary mb-8 h-12">Acceso ilimitado a todo el catálogo de audio y herramientas.</p>
              
              <ul className="space-y-4 mb-10">
                {['Catálogo completo (+200 pistas)', 'Sonidos y frecuencias binaurales', 'Descarga para modo offline', 'Mezclador de sonidos', 'Estadísticas de progreso'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#EDE1D3]">
                    <CheckCircle2 className="w-5 h-5 text-gold" strokeWidth={1.5} />
                    {feat}
                  </li>
                ))}
              </ul>
              
              <Button className="w-full bg-gold text-[#0B0F14] hover:bg-[#D6A85B] border-0 rounded-none h-14 text-base font-medium">
                Prueba de 7 días
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold py-12 bg-[#0B0F14]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-serif text-xl font-bold tracking-widest text-gold opacity-70">
            RESONANCIA
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-secondary">
            <a href="#" className="hover:text-gold transition-colors">Términos de servicio</a>
            <a href="#" className="hover:text-gold transition-colors">Privacidad</a>
            <a href="#" className="hover:text-gold transition-colors">Contacto</a>
            <a href="#" className="hover:text-gold transition-colors">Instagram</a>
          </div>
          
          <div className="text-sm text-secondary opacity-60">
            © {new Date().getFullYear()} RESONANCIA.
          </div>
        </div>
      </footer>
    </div>
  );
}
