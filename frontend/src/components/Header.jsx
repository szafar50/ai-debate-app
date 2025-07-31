import { useState, useEffect, useRef } from 'react';

export default function Header({ selectedModels, setSelectedModels, availableModels }) {
  const [popupModel, setPopupModel] = useState(null);
  const popupRef = useRef(null);

  const selectedModelObjects = availableModels?.filter((m) => selectedModels.includes(m.name)) || [];
  const unselectedModels = availableModels?.filter((m) => !selectedModels.includes(m.name)) || [];

  // Close on ESC or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closePopup();
    };

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        closePopup();
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

  const closePopup = () => setPopupModel(null);

  const toggleModelSelection = (modelName) => {
    if (selectedModels.includes(modelName)) {
      setSelectedModels((prev) => prev.filter((name) => name !== modelName));
    } else if (selectedModels.length < 4) {
      setSelectedModels((prev) => [...prev, modelName]);
    }
    closePopup();
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-4">
      <h2 className="text-xl font-semibold text-center text-white mb-4">🤖 AI Debate Arena</h2>

      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {selectedModelObjects.length > 0 ? (
          selectedModelObjects.map((model) => (
            <button
              key={model.name}
              onClick={() => setPopupModel(model)}
              className="group text-center focus:outline-none"
              aria-label={`View ${model.displayName}`}
            >
              <img
                src={`/assets/avatars/${model.avatar}`}
                alt={model.displayName}
                className="w-12 h-12 rounded-full border-2 border-blue-500 ring-2 ring-blue-400 transition-transform group-hover:scale-110"
              />
              <p className="text-xs text-white mt-1">{model.displayName}</p>
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic">No models selected</p>
        )}
      </div>

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

      {popupModel && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-start justify-center pt-20">
          <div
            ref={popupRef}
            className="bg-gray-800 text-white rounded-lg shadow-2xl w-11/12 max-w-md border border-gray-600 overflow-hidden animate-fade-in"
          >
            <div className="flex">
              {/* Avatar Panel */}
              <div className="p-4 bg-gray-700">
                <img
                  src={`/assets/avatars/${popupModel.avatar}`}
                  alt={popupModel.name}
                  className="w-16 h-16 rounded-full"
                />
              </div>

              {/* Info */}
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
                  {selectedModels.includes(popupModel.name) ? 'Remove from Debate' : 'Add to Debate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedModels.length < 2 && (
        <p className="text-center text-red-400 text-sm mt-3">
          ⚠️ Select at least 2 models to start a debate
        </p>
      )}
    </header>
  );
}
