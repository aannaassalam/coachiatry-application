import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

interface RNFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
}

export function useChatUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      chatId,
      onProgress,
      signal,
    }: {
      file: RNFile; // Note the interface change
      chatId: string;
      onProgress?: (p: number) => void;
      signal?: AbortSignal;
    }) => {
      const fileName = encodeURIComponent(file.name.replaceAll(' ', '_'));
      const fileType = file.mimeType || 'application/octet-stream';

      // Step 0: Create a Blob pointer (Does not load file into memory)
      // This is the magic part that enables .slice() in React Native
      const fetchedFile = await fetch(file.uri);
      const blob = await fetchedFile.blob();

      try {
        // Step 1: start upload (Same as Web)
        const { data: startRes } = await axiosInstance.post(
          '/chat/upload/start',
          {
            fileName,
            fileType,
            chatId,
          },
        );

        const { uploadId, key } = startRes;

        // Step 2: split into chunks
        const totalParts = Math.ceil(blob.size / CHUNK_SIZE);
        const parts = Array.from({ length: totalParts }, (_, i) => i + 1);

        // Step 3: get presigned URLs (Same as Web)
        const { data: urlRes } = await axiosInstance.post(
          '/chat/upload/parts',
          {
            uploadId,
            key,
            parts,
          },
        );

        const urls = urlRes.urls;
        const uploadedParts: any[] = [];
        let totalBytesUploaded = 0;

        // Step 4: upload each part
        for (const part of urls) {
          const start = (part.partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, blob.size);
          const chunk = blob.slice(start, end);

          const response = await fetch(part.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': fileType },
            body: chunk,
            signal,
          });

          if (!response.ok) {
            throw new Error(
              `Chunk upload failed with status ${response.status}`,
            );
          } // 🔴 FIX: Extract ETag from fetch response headers and remove quotes

          const etag =
            response.headers.get('Etag') || response.headers.get('ETag');

          totalBytesUploaded += end - start;
          const pct = (totalBytesUploaded / blob.size) * 100;

          console.log(pct, 'percentage');

          onProgress?.(Math.min(pct, 100));

          uploadedParts.push({
            ETag: etag?.replace(/"/g, ''), // Remove surrounding quotes
            PartNumber: part.partNumber,
          });
        }

        // Step 5: complete upload (Same as Web)
        const { data: completeRes } = await axiosInstance.post(
          '/chat/upload/complete',
          {
            uploadId,
            key,
            parts: uploadedParts,
          },
        );

        return completeRes.fileUrl as string;
      } finally {
        // Step 6: Cleanup the main blob pointer to free native memory
        // (blob as any).close();
      }
    },
    meta: {
      showToast: false,
    },
  });
}
