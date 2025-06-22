// hooks/useDataLogger.ts
import { useCallback } from 'react';

export const useDataLogger = () => {
  const saveBlob = useCallback(async (blob: Blob, type: 'img' | 'log') => {
    const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const folder = type === 'img' ? 'img' : 'log';
    const filename = `app/data/${folder}/${ts}.${type === 'img' ? 'jpg' : 'txt'}`;
    const buffer = await blob.arrayBuffer();
    const blobForSave = new Blob([buffer], {
      type: type === 'img' ? 'image/jpeg' : 'text/plain',
    });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blobForSave);
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, []);

  const saveText = useCallback(async (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    await saveBlob(blob, 'log');
  }, [saveBlob]);

  return { saveBlob, saveText };
};
