import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Shield, CheckCircle, Users, Play } from 'lucide-react';

interface Testimonio {
  type: 'instagram' | 'video';
  url: string;
}

interface InstagramTestimonialsProps {
  testimonios: Testimonio[];
}

export function InstagramTestimonials({ testimonios }: InstagramTestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentTestimonio = testimonios[currentIndex];

  useEffect(() => {
    if (currentTestimonio?.type === 'instagram') {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;

      if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
        document.body.appendChild(script);
      }

      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
          setTimeout(() => setIsLoading(false), 1000);
        }
      };
    } else {
      setIsLoading(false);
    }
  }, [currentTestimonio]);

  useEffect(() => {
    if (currentTestimonio?.type === 'instagram' && window.instgrm) {
      window.instgrm.Embeds.process();
    }
  }, [currentIndex, currentTestimonio]);

  useEffect(() => {
    if (videoRef.current && currentTestimonio?.type === 'video') {
      videoRef.current.load();
    }
  }, [currentIndex, currentTestimonio]);

  if (!testimonios || testimonios.length === 0) {
    return null;
  }

  const extractPostId = (url: string) => {
    const match = url.match(/\/(p|reel)\/([^/?]+)/);
    return match ? match[2] : null;
  };

  const getEmbedUrl = (url: string) => {
    const postId = extractPostId(url);
    if (!postId) return null;

    if (url.includes('/reel/')) {
      return `https://www.instagram.com/reel/${postId}/embed/captioned`;
    }
    return `https://www.instagram.com/p/${postId}/embed/captioned`;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonios.length);
    setIsLoading(true);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonios.length) % testimonios.length);
    setIsLoading(true);
  };

  return (
    <div className="py-16 bg-gradient-to-br from-gray-900 via-blue-900/30 to-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full font-bold mb-4 border-2 border-green-500/30">
            <Shield className="w-5 h-5" />
            100% CONFIABLE Y SEGURO
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Lo Que Dicen Nuestros Ganadores
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Miles de personas ya han confiado en nosotros. ¡Mira sus testimonios reales!
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="font-semibold">Sorteos Transparentes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="font-semibold">Pagos Inmediatos</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-green-400" />
              <span className="font-semibold">Miles de Participantes</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-lg mx-auto">
          <div className="bg-black rounded-2xl shadow-2xl overflow-hidden relative">
            {currentTestimonio?.type === 'video' ? (
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-[600px] object-contain"
                  controls
                  playsInline
                  preload="metadata"
                >
                  <source src={currentTestimonio.url} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="h-[600px] flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}

                <div className={isLoading ? 'hidden' : 'block'}>
                  <iframe
                    key={currentIndex}
                    src={getEmbedUrl(currentTestimonio?.url || '') || ''}
                    className="w-full h-[600px] border-0"
                    scrolling="no"
                    allowTransparency={true}
                    allow="encrypted-media"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </>
            )}
          </div>

          {testimonios.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-16 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-3 shadow-xl transition-all hover:scale-110 z-10"
                aria-label="Anterior testimonio"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-16 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-3 shadow-xl transition-all hover:scale-110 z-10"
                aria-label="Siguiente testimonio"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="flex justify-center gap-2 mt-6">
                {testimonios.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsLoading(true);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-blue-500'
                        : 'w-2 bg-gray-500 hover:bg-gray-400'
                    }`}
                    aria-label={`Ir a testimonio ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Testimonios reales de usuarios
          </p>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}
