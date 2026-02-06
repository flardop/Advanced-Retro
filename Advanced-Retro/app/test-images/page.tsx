'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function TestImagesPage() {
  const [gameName, setGameName] = useState('Pokemon Red');
  const [platform, setPlatform] = useState<'game-boy' | 'game-boy-color' | 'game-boy-advance'>('game-boy-color');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const searchImages = async () => {
    if (!gameName.trim()) {
      setError('Por favor ingresa un nombre de juego');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(
        `/api/games/images?gameName=${encodeURIComponent(gameName)}&platform=${platform}`
      );
      const data = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Error buscando imágenes');
      }
    } catch (err) {
      setError('Error de conexión. Verifica que el servidor esté corriendo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🎮 Buscador de Imágenes de Juegos Retro
          </h1>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Juego
              </label>
              <input
                id="gameName"
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchImages()}
                placeholder="Ej: Pokemon Red, Zelda Links Awakening..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                💡 Tip: Usa nombres en inglés para mejores resultados
              </p>
            </div>

            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="game-boy">Game Boy (Original)</option>
                <option value="game-boy-color">Game Boy Color</option>
                <option value="game-boy-advance">Game Boy Advance</option>
              </select>
            </div>

            <button
              onClick={searchImages}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '🔍 Buscando...' : '🔍 Buscar Imágenes'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              ❌ {error}
            </div>
          )}

          {results && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Resultados ({results.count} imagen{results.count !== 1 ? 'es' : ''} encontrada{results.count !== 1 ? 's' : ''})
              </h2>

              <div className="space-y-6">
                {results.images.map((img: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="relative w-32 h-40 bg-white rounded border border-gray-300 overflow-hidden">
                          <Image
                            src={img.url}
                            alt={results.gameName}
                            fill
                            className="object-contain"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            {img.source.toUpperCase()}
                          </span>
                          <span className="ml-2 inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                            {img.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 break-all font-mono">
                          {img.url}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(img.url);
                            alert('URL copiada al portapapeles!');
                          }}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          📋 Copiar URL
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Cómo usar esta URL:</h3>
                <pre className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 overflow-x-auto">
{`// En tu código:
const imageUrl = "${results.images[0]?.url}";

// Actualizar producto en Supabase:
await supabase
  .from('products')
  .update({ images: [imageUrl] })
  .eq('id', productId);`}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📚 Fuentes de Imágenes
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <strong>LibRetro:</strong> CDN gratuito con alta calidad (recomendado)
              </li>
              <li>
                <strong>IGDB:</strong> API completa (requiere configuración opcional)
              </li>
              <li>
                <strong>Splash:</strong> Directorio de juegos retro
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              Ver documentación completa en:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">docs/GAME_IMAGES_API.md</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
