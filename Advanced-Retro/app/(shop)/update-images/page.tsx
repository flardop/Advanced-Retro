'use client';

import { useState } from 'react';

export default function UpdateImagesPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(false);

  const updateAllImages = async () => {
    if (!confirm('¿Estás seguro de que quieres actualizar las imágenes de todos los productos? Esto puede tardar varios minutos.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/products/update-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceUpdate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando imágenes');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
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
            🖼️ Actualizar Imágenes de Productos
          </h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="font-semibold text-blue-900 mb-2">ℹ️ ¿Qué hace esto?</h2>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Busca imágenes automáticamente para todos los productos sin imágenes válidas</li>
              <li>Usa el nombre del producto para buscar en LibRetro, IGDB y Splash!</li>
              <li>Actualiza el campo <code className="bg-blue-100 px-1 rounded">images[]</code> en la base de datos</li>
              <li>Puede tardar varios minutos dependiendo de cuántos productos tengas</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={forceUpdate}
                onChange={(e) => setForceUpdate(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Forzar actualización (actualizar incluso productos que ya tienen imágenes)
              </span>
            </label>
          </div>

          <button
            onClick={updateAllImages}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '⏳ Actualizando imágenes...' : '🚀 Actualizar Todas las Imágenes'}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              ❌ {error}
            </div>
          )}

          {results && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Resultados</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-700">{results.updated}</div>
                  <div className="text-sm text-green-600 mt-1">Actualizados</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-700">{results.skipped}</div>
                  <div className="text-sm text-yellow-600 mt-1">Saltados</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-700">{results.errors}</div>
                  <div className="text-sm text-red-600 mt-1">Errores</div>
                </div>
              </div>

              {results.details && results.details.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Detalles:</h3>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Estado
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Imagen
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.details.map((detail: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{detail.name}</td>
                            <td className="px-4 py-2 text-sm">
                              {detail.status === 'updated' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Actualizado
                                </span>
                              )}
                              {detail.status === 'skipped' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⏭️ Saltado
                                </span>
                              )}
                              {detail.status === 'not_found' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  ⚠️ No encontrado
                                </span>
                              )}
                              {detail.status === 'error' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  ❌ Error
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {detail.imageUrl && (
                                <a
                                  href={detail.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                                >
                                  Ver
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                • Los productos con imágenes válidas se saltan automáticamente (a menos que actives la opción Forzar actualización)
              </li>
              <li>
                • Si un producto no encuentra imagen, puedes buscarla manualmente en{' '}
                <a href="/test-images" className="text-blue-600 hover:text-blue-800 underline">
                  /test-images
                </a>
              </li>
              <li>
                • El proceso puede tardar varios minutos. No cierres esta página hasta que termine.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
