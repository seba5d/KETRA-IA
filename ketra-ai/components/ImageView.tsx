import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { ImageIcon, SparklesIcon, DownloadIcon, UploadIcon, CloseIcon } from './icons';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textToImagePrompts = [
    "Retrato de um astronauta em um capacete de vidro quebrado, estrelas refletidas, fotorrealista.",
    "Uma cidade cyberpunk enevoada à noite, com luzes de neon e carros voadores, estilo anime detalhado.",
    "Um gato majestoso vestindo uma armadura real, sentado em um trono, pintura a óleo digital.",
    "Floresta encantada com cogumelos bioluminescentes e um caminho de pedras brilhantes, fantasia, 4k."
  ];
  
  const imageEditPrompts = [
    "Adicione óculos de sol estilosos",
    "Mude o fundo para uma paisagem de ficção científica",
    "Transforme em um personagem de anime",
    "Aplique um efeito de neon vibrante"
  ];

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadedImage({ base64: base64String, mimeType: file.type });
        setImageUrl(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else if(file) {
      setError("Por favor, selecione um arquivo de imagem válido.");
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragEvents = (e: React.DragEvent, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const clearUploadedImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImage(null);
    setImageUrl(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleGenerateImage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      if (uploadedImage) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: uploadedImage.base64, mimeType: uploadedImage.mimeType } },
              { text: prompt },
            ],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            setImageUrl(`data:${part.inlineData.mimeType};base64,${base64ImageBytes}`);
            return;
          }
        }
        throw new Error("A imagem editada não foi encontrada na resposta da API.");
      } else {
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
          },
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        setImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);
      }
    } catch (err) {
      console.error('Image operation failed:', err);
      setError('Falha na operação com a imagem. O prompt pode ter sido bloqueado ou ocorreu um erro. Por favor, tente novamente com um prompt ou imagem diferente.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, aspectRatio, uploadedImage]);

  const handleDownloadImage = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ketra-ai-${uploadedImage ? 'edited' : 'generated'}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, uploadedImage]);

  const AspectRatioButton: React.FC<{ value: '1:1' | '16:9' | '9:16'; label: string }> = ({ value, label }) => (
    <button type="button" onClick={() => setAspectRatio(value)} className={`px-3 py-1 text-sm rounded-md transition-colors ${aspectRatio === value ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
      {label}
    </button>
  );

  const promptsToShow = uploadedImage ? imageEditPrompts : textToImagePrompts;

  return (
    <div className="flex flex-col h-full bg-black/20 items-center p-4 md:p-8">
      <div className="w-full max-w-4xl flex flex-col h-full">
        <div 
          className="flex-1 flex items-center justify-center p-4"
          onDrop={handleDrop}
          onDragOver={(e) => handleDragEvents(e, true)}
          onDragLeave={(e) => handleDragEvents(e, false)}
        >
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full h-full border-2 border-dashed rounded-2xl flex items-center justify-center bg-gray-900/20 transition-colors duration-300 ${isDragging ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-700/50'} ${!isLoading && 'cursor-pointer'}`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="hidden" />
            
            {imageUrl && !isLoading && (
              <button onClick={handleDownloadImage} className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 text-sm bg-black/50 text-gray-200 rounded-lg hover:bg-cyan-500 hover:text-white transition-all duration-300 backdrop-blur-sm ring-1 ring-white/10" aria-label="Baixar imagem">
                <DownloadIcon className="h-5 w-5" />
                <span>Baixar</span>
              </button>
            )}

            {uploadedImage && !imageUrl && !isLoading && (
              <button onClick={clearUploadedImage} className="absolute top-4 right-4 z-10 flex items-center justify-center h-8 w-8 bg-black/50 text-gray-200 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 backdrop-blur-sm ring-1 ring-white/10" aria-label="Remover imagem">
                <CloseIcon className="h-5 w-5" />
              </button>
            )}

            {isLoading ? (
              <div className="text-center text-gray-400">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="mt-4 font-medium">Ketra está criando sua visão...</p>
                <p className="text-sm text-gray-500">Isso pode levar um momento.</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400 p-8">
                <h3 className="font-bold text-lg">Falha na Geração</h3>
                <p className="text-sm">{error}</p>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Gerado por Ketra AI" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : uploadedImage ? (
                <img src={`data:${uploadedImage.mimeType};base64,${uploadedImage.base64}`} alt="Imagem para editar" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                <UploadIcon className="h-16 w-16 mx-auto text-gray-600" />
                <h3 className="mt-4 text-lg font-medium">Gerar ou Editar Imagem</h3>
                <p className="max-w-md mx-auto">Arraste uma imagem aqui, ou clique para selecionar. Depois, descreva o que você quer criar ou modificar.</p>
              </div>
            )}
          </div>
        </div>

        <div className="py-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">Sem ideias? Tente um destes:</h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {promptsToShow.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(p)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs bg-gray-700/80 text-gray-300 rounded-full hover:bg-gray-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleGenerateImage} className="space-y-4 pt-4 border-t border-gray-800/50">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={uploadedImage ? "ex.: adicione um chapéu de mago no gato" : "ex.: Uma foto de um guerreiro de anime futurista..."}
              disabled={isLoading}
              rows={3}
              className="w-full bg-gray-800/70 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 resize-none"
            />
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  {!uploadedImage ? (
                    <>
                      <span className="text-sm font-medium text-gray-400">Proporção:</span>
                      <AspectRatioButton value="1:1" label="Quadrado" />
                      <AspectRatioButton value="16:9" label="Paisagem" />
                      <AspectRatioButton value="9:16" label="Retrato" />
                    </>
                  ) : <p className="text-sm text-gray-400">A edição manterá a proporção original.</p>}
              </div>
              <button type="submit" disabled={isLoading || !prompt.trim()} className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 shadow-lg shadow-cyan-500/20">
                <SparklesIcon className="h-5 w-5" />
                {uploadedImage ? 'Editar' : 'Gerar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImageView;
