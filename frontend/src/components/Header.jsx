// frontend/src/components/Header.jsx
import { useState, useEffect, useRef } from 'react';

export default function Header({ selectedModels, setSelectedModels, availableModels }) {
  const [popupModel, setPopupModel] = useState(null);
  const popupRef = useRef(null);

  // Close on ESC or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPopupModel(null);
    };

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupModel(null);
      }
    };

    if (popupModel) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popupModel]);

  const toggleModelSelection = (modelName) => {
    if (selectedModels.includes(modelName)) {
      setSelectedModels(prev => prev.filter(name => name !== modelName));
    } else if (selectedModels.length < 4) {
      setSelectedModels(prev => [...prev, modelName]);
    }
    setPopupModel(null);
  };

  const selectedModelObjects = availableModels?.filter(m => selectedModels.includes(m.name)) || [];
  const unselectedModels = availableModels?.filter(m => !selectedModels.includes(m.name)) || [];

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-4">
      <h2 className="text-xl font-semibold text-center text-white mb-4">🤖 AI Debate Arena</h2>

      {/* Selected Models */}
      <div className="flex gap-4 mb-4 overflow-x-auto hide-scrollbar">
        {selectedModelObjects.map((model) => (
          <div
            key={model.name}
            className="text-center group flex-shrink-0 cursor-pointer"
            onClick={() => setPopupModel(model)}
          >
            <img
              src={`/assets/avatars/${model.avatar}`}
              alt={model.name}
              className="w-12 h-12 rounded-full border-2 border-blue-500 ring-2 ring-blue-400 transition-transform group-hover:scale-110"
            />
            <p className="text-xs text-white mt-1">{model.displayName}</p>
          </div>
        ))}
      </div>

      {/* Add More Button */}
      <div className="text-center mb-2">
        <button
          onClick={() => unselectedModels.length > 0 && setPopupModel(unselectedModels[0])}
          className="text-sm text-green-400 underline hover:text-green-300 focus:outline-none"
        >
          {unselectedModels.length > 0
            ? `➕ Add a model (${unselectedModels.length} available)`
            : "✅ All models added"}
        </button>
      </div>

      {/* Model Details Popup */}
      {popupModel && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-start justify-center pt-20">
          <div
            ref={popupRef}
            className="bg-gray-800 text-white rounded-lg shadow-2xl w-11/12 max-w-md border border-gray-600 overflow-hidden"
          >
            <div className="flex">
              <div className="p-4 bg-gray-700">
                <img
                  src={`/assets/avatars/${popupModel.avatar}`}
                  alt={popupModel.name}
                  className="w-16 h-16 rounded-full"
                />
              </div>
              <div className="flex-1 p-4 space-y-3">
                <h3 className="font-bold text-lg">{popupModel.displayName}</h3>
                <p className="text-sm text-gray-300">{popupModel.description}</p>
                <div className="text-xs space-y-1">
                  <div>Joined: <span className="text-blue-400">{popupModel.memberSince}</span></div>
                  <div>Debates: <span className="text-green-400">{popupModel.debatesFinished}</span></div>
                </div>
                <div className="space-y-2 mt-3">
                  {Object.entries(popupModel.traits).map(([trait, value]) => (
                    <div key={trait} className="text-xs">
                      {trait.charAt(0).toUpperCase() + trait.slice(1)}
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => toggleModelSelection(popupModel.name)}
                  className={`w-full py-2 text-sm font-semibold rounded transition focus:outline-none ${
                    selectedModels.includes(popupModel.name)
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {selectedModels.includes(popupModel.name) ? 'Remove' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      {selectedModels.length < 2 && (
        <p className="text-center text-red-400 text-sm mt-3">
          ⚠️ Select at least 2 models to debate
        </p>
      )}
    </header>
  );
}