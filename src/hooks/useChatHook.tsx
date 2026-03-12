import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import axiosInstance from '../api/axiosInstance';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

interface RNFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
}

/**
 * Ensure the file is in a readable local path (Android only).
 * For content:// URIs, copies to cache since stat() paths may not
 * be directly readable on Android 10+ (scoped storage).
 */
async function ensureLocalFile(
  uri: string,
  fileName: string,
): Promise<{ path: string; isCopy: boolean }> {
  if (uri.startsWith('file://')) {
    return { path: uri.replace('file://', ''), isCopy: false };
  }
  if (uri.startsWith('content://')) {
    const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/upload_${Date.now()}_${fileName}`;
    await ReactNativeBlobUtil.fs.cp(uri, cachePath);
    return { path: cachePath, isCopy: true };
  }
  return { path: uri, isCopy: false };
}

export function useChatUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      chatId,
      onProgress,
      signal,
    }: {
      file: RNFile;
      chatId: string;
      onProgress?: (p: number) => void;
      signal?: AbortSignal;
    }) => {
      const fileName = encodeURIComponent(file.name.replaceAll(' ', '_'));
      const fileType = file.mimeType || 'application/octet-stream';

      // Step 1: start upload
      const { data: startRes } = await axiosInstance.post(
        '/chat/upload/start',
        { fileName, fileType, chatId },
      );

      const { uploadId, key } = startRes;

      // Step 2: create blob from file URI (works reliably on iOS)
      // On Android we'll use ReactNativeBlobUtil instead
      const isAndroid = Platform.OS === 'android';

      let blob: Blob | null = null;
      if (!isAndroid) {
        const fetchedFile = await fetch(file.uri);
        blob = await fetchedFile.blob();
      }

      const fileSize = isAndroid ? file.size : blob!.size;

      // Step 3: split into chunks
      const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
      const parts = Array.from({ length: totalParts }, (_, i) => i + 1);

      // Step 4: get presigned URLs
      const { data: urlRes } = await axiosInstance.post('/chat/upload/parts', {
        uploadId,
        key,
        parts,
      });

      const urls = urlRes.urls;
      const uploadedParts: any[] = [];
      let totalBytesUploaded = 0;

      if (isAndroid) {
        // =================== ANDROID ===================
        // Use ReactNativeBlobUtil for reliable binary upload
        const { path: filePath, isCopy } = await ensureLocalFile(
          file.uri,
          file.name,
        );

        console.log('[ChatUpload] Android filePath:', filePath, 'isCopy:', isCopy);

        try {
          for (const part of urls) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

            const start = (part.partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, fileSize);
            const chunkSize = end - start;

            let response;
            let tempChunkPath: string | null = null;

            if (totalParts === 1) {
              // Single part — upload original file directly via wrap()
              response = await ReactNativeBlobUtil.fetch(
                'PUT',
                part.signedUrl,
                { 'Content-Type': fileType },
                ReactNativeBlobUtil.wrap(filePath),
              );
            } else {
              // Multi part — use fs.slice() to extract exact byte range
              tempChunkPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/chunk_${part.partNumber}_${Date.now()}`;
              await ReactNativeBlobUtil.fs.slice(
                filePath,
                tempChunkPath,
                start,
                end,
              );

              response = await ReactNativeBlobUtil.fetch(
                'PUT',
                part.signedUrl,
                { 'Content-Type': fileType },
                ReactNativeBlobUtil.wrap(tempChunkPath),
              );

              // Cleanup chunk temp file
              ReactNativeBlobUtil.fs.unlink(tempChunkPath).catch(() => {});
            }

            const status = response.respInfo.status;
            console.log('[ChatUpload] Part', part.partNumber, 'status:', status);

            if (status < 200 || status >= 300) {
              throw new Error(`Chunk upload failed with status ${status}`);
            }

            const etag =
              response.respInfo.headers['Etag'] ||
              response.respInfo.headers['ETag'] ||
              response.respInfo.headers['etag'];

            totalBytesUploaded += chunkSize;
            const pct = (totalBytesUploaded / fileSize) * 100;
            onProgress?.(Math.min(pct, 100));

            uploadedParts.push({
              ETag: etag?.replace(/"/g, ''),
              PartNumber: part.partNumber,
            });
          }
        } finally {
          // Cleanup the cached copy if we made one
          if (isCopy) {
            ReactNativeBlobUtil.fs.unlink(filePath).catch(() => {});
          }
        }
      } else {
        // =================== iOS ===================
        // Original working approach: fetch + blob.slice()
        for (const part of urls) {
          const start = (part.partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, blob!.size);
          const chunk = blob!.slice(start, end);

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
          }

          const etag =
            response.headers.get('Etag') || response.headers.get('ETag');

          totalBytesUploaded += end - start;
          const pct = (totalBytesUploaded / blob!.size) * 100;
          onProgress?.(Math.min(pct, 100));

          uploadedParts.push({
            ETag: etag?.replace(/"/g, ''),
            PartNumber: part.partNumber,
          });
        }
      }

      // Step 5: complete upload
      const { data: completeRes } = await axiosInstance.post(
        '/chat/upload/complete',
        { uploadId, key, parts: uploadedParts },
      );

      return completeRes.fileUrl as string;
    },
    meta: {
      showToast: false,
    },
  });
}
