import React, { useState, useRef } from 'react';

const ReceiptUpload = ({ onSaved }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setItems([]); 
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append('receipt', file);

      const uploadRes = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      setUploadedUrl(uploadData.url);

      // 2. Analyze Image
      setUploading(false);
      setAnalyzing(true);

      const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });

      if (!analyzeRes.ok) throw new Error('Analysis failed');
      const analyzeData = await analyzeRes.json();
      setItems(analyzeData.items);
    } catch (error) {
      console.error(error);
      alert('Ошибка обработки чека: ' + error.message);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!uploadedUrl || !items.length) return;
    setSaving(true);
    try {
      const saveRes = await fetch('http://localhost:3000/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedUrl,
          items: items
        }),
      });
      
      if (!saveRes.ok) throw new Error('Save failed');
      const saveData = await saveRes.json();
      
      alert(`Чек сохранен! Всего: €${saveData.total}`);
      if (onSaved) onSaved(); // Trigger refresh
      
      // Reset
      setFile(null); 
      setPreview(null); 
      setItems([]);
      setUploadedUrl(null);

    } catch (error) {
      console.error(error);
      alert('Ошибка при сохранении: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 w-full max-w-md mx-auto">
      <div 
        className="w-full aspect-[3/4] bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden relative shadow-sm hover:border-emerald-500 transition-colors cursor-pointer group"
        onClick={() => !uploading && !analyzing && fileInputRef.current.click()}
      >
        {preview ? (
          <img src={preview} alt="Receipt Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-6 transition-transform group-hover:scale-105">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Нажми, чтобы сфоткать чек</p>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
      </div>

      {preview && !items.length && (
        <button
          onClick={handleUpload}
          disabled={uploading || analyzing}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
            uploading || analyzing 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-500/30'
          }`}
        >
          {uploading ? 'Загрузка...' : analyzing ? 'Анализ... 🤖' : 'Сканировать чек'}
        </button>
      )}

      {items.length > 0 && (
        <div className="w-full bg-white rounded-2xl shadow-xl p-6 border border-slate-100 animation-fade-in-up">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Товары из чека</h3>
          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">x{item.qty}</span>
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.price ? `€${item.price.toFixed(2)}` : '-'}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={() => { setFile(null); setPreview(null); setItems([]); setUploadedUrl(null); }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                disabled={saving}
             >
               Повторить
             </button>
             <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:bg-slate-400"
                disabled={saving}
             >
               {saving ? 'Сохранение...' : 'Подтвердить и Сохранить'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;
