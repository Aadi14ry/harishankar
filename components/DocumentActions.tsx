"use client";

import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

const documentPath = "/document.png";
const databaseName = "harishankar-document-library";

type StoredDocument = { id: string; file: File };
type LegacyDocument = StoredDocument & { url: string };
type SavedDocument = {
  id: string;
  name: string;
  mimeType: string;
  fileSizeBytes: string;
  createdAt: string;
};
type GalleryDocument = {
  id: string;
  name: string;
  url: string;
  downloadUrl: string;
  type: "image" | "pdf";
  isOriginal: boolean;
  isLocal: boolean;
};
type Notice = { type: "success" | "error"; message: string };
const maxDocumentSize = 10 * 1024 * 1024;
const supportedMimeTypes = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function openDocumentDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("documents")) {
        database.createObjectStore("documents", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open document storage."));
    request.onblocked = () => reject(new Error("Document storage is blocked by another tab."));
  });
}

function readRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not read document storage."));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save document."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Document save was cancelled."));
  });
}

async function loadOriginalDocumentVisible(): Promise<boolean> {
  const database = await openDocumentDatabase();
  const transaction = database.transaction("settings", "readonly");
  const visible = await readRequest<boolean | undefined>(
    transaction.objectStore("settings").get("originalDocumentVisible"),
  );
  return visible !== false;
}

async function loadLegacyDocuments(): Promise<StoredDocument[]> {
  const database = await openDocumentDatabase();
  const transaction = database.transaction("documents", "readonly");
  return readRequest<StoredDocument[]>(transaction.objectStore("documents").getAll());
}

async function deleteLegacyDocument(id: string): Promise<void> {
  const database = await openDocumentDatabase();
  const transaction = database.transaction("documents", "readwrite");
  const completed = waitForTransaction(transaction);
  transaction.objectStore("documents").delete(id);
  await completed;
}

async function saveOriginalDocumentVisible(visible: boolean): Promise<void> {
  const database = await openDocumentDatabase();
  const transaction = database.transaction("settings", "readwrite");
  const completed = waitForTransaction(transaction);
  transaction.objectStore("settings").put(visible, "originalDocumentVisible");
  await completed;
}

async function fetchSavedDocuments(): Promise<SavedDocument[]> {
  const response = await fetch("/api/documents", { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | { documents?: SavedDocument[]; error?: string }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Documents could not be loaded.");
  }
  return payload?.documents ?? [];
}

async function uploadDocument(file: File): Promise<SavedDocument> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/documents", { method: "POST", body: formData });
  const payload = (await response.json().catch(() => null)) as
    | { document?: SavedDocument; error?: string }
    | null;
  if (!response.ok || !payload?.document) {
    throw new Error(payload?.error ?? "The document could not be saved.");
  }
  return payload.document;
}

async function responseError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? "The document could not be deleted.";
}

export default function DocumentActions() {
  const [originalDocumentVisible, setOriginalDocumentVisible] = useState(true);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [legacyDocuments, setLegacyDocuments] = useState<LegacyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
    isOriginal: boolean;
    isLocal: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    const urls = objectUrls.current;

    const restoreDocuments = async () => {
      let legacyFiles: StoredDocument[] = [];
      try {
        legacyFiles = await loadLegacyDocuments();
      } catch {
        legacyFiles = [];
      }

      let originalVisible = true;
      try {
        originalVisible = await loadOriginalDocumentVisible();
      } catch {
        originalVisible = true;
      }
      if (cancelled) return;

      const localDocuments = legacyFiles.map(({ id, file }) => {
          const url = URL.createObjectURL(file);
          urls.add(url);
          return { id, file, url };
        });
      setLegacyDocuments(localDocuments);
      setOriginalDocumentVisible(originalVisible);

      try {
        const remoteDocuments = await fetchSavedDocuments();
        if (cancelled) return;
        setSavedDocuments(remoteDocuments);

        let migratedCount = 0;
        let failedCount = 0;
        for (const legacyDocument of localDocuments) {
          if (cancelled) return;
          try {
            const savedDocument = await uploadDocument(legacyDocument.file);
            setSavedDocuments((current) => [savedDocument, ...current]);
            migratedCount += 1;
            await deleteLegacyDocument(legacyDocument.id);
            URL.revokeObjectURL(legacyDocument.url);
            urls.delete(legacyDocument.url);
            setLegacyDocuments((current) =>
              current.filter((document) => document.id !== legacyDocument.id),
            );
          } catch {
            failedCount += 1;
          }
        }

        if (migratedCount > 0 || failedCount > 0) {
          setNotice({
            type: failedCount > 0 ? "error" : "success",
            message:
              failedCount > 0
                ? `${migratedCount} older document${migratedCount === 1 ? " was" : "s were"} moved to your account. ${failedCount} remain saved on this browser.`
                : `${migratedCount} saved document${migratedCount === 1 ? " was" : "s were"} moved to your account.`,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Account documents could not be loaded. Check the database setup and server configuration.",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void restoreDocuments();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const addDocuments = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (selectedFiles.length === 0) return;

    const acceptedFiles = selectedFiles.filter(
      (file) => supportedMimeTypes.has(file.type) && file.size > 0 && file.size <= maxDocumentSize,
    );
    if (acceptedFiles.length === 0) {
      setNotice({
        type: "error",
        message: "Choose a PDF, JPEG, PNG, GIF, or WebP file smaller than 10 MB.",
      });
      return;
    }

    setIsSaving(true);
    const uploadedDocuments: SavedDocument[] = [];
    let failedCount = selectedFiles.length - acceptedFiles.length;
    let firstError = "";

    for (const file of acceptedFiles) {
      try {
        uploadedDocuments.push(await uploadDocument(file));
      } catch (error) {
        failedCount += 1;
        if (!firstError && error instanceof Error) firstError = error.message;
      }
    }

    if (uploadedDocuments.length > 0) {
      setSavedDocuments((current) => [...uploadedDocuments.reverse(), ...current]);
    }
    setIsSaving(false);

    if (failedCount === 0) {
      setNotice({
        type: "success",
        message:
          uploadedDocuments.length === 1
            ? "Document saved to your account."
            : `${uploadedDocuments.length} documents saved to your account.`,
      });
    } else {
      setNotice({
        type: "error",
        message: `${uploadedDocuments.length} saved, ${failedCount} failed. ${firstError}`.trim(),
      });
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      if (documentToDelete.isOriginal) {
        await saveOriginalDocumentVisible(false);
        setOriginalDocumentVisible(false);
      } else if (documentToDelete.isLocal) {
        await deleteLegacyDocument(documentToDelete.id);
        const removedDocument = legacyDocuments.find(
          (document) => document.id === documentToDelete.id,
        );
        if (removedDocument) {
          URL.revokeObjectURL(removedDocument.url);
          objectUrls.current.delete(removedDocument.url);
        }
        setLegacyDocuments((current) =>
          current.filter((document) => document.id !== documentToDelete.id),
        );
      } else {
        const response = await fetch(`/api/documents/${documentToDelete.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(await responseError(response));
        }
        setSavedDocuments((current) =>
          current.filter((document) => document.id !== documentToDelete.id),
        );
      }

      setDocumentToDelete(null);
      setNotice({ type: "success", message: "Document deleted successfully." });
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "The document could not be deleted. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const documents: GalleryDocument[] = [
    ...(originalDocumentVisible
      ? [{
          id: "original",
          name: "Citizenship document",
          url: documentPath,
          type: "image" as const,
          isOriginal: true,
          isLocal: false,
          downloadUrl: documentPath,
        }]
      : []),
    ...savedDocuments.map((document) => ({
      id: document.id,
      name: document.name,
      url: `/api/documents/${document.id}/file`,
      downloadUrl: `/api/documents/${document.id}/file?download=1`,
      type: document.mimeType === "application/pdf" ? ("pdf" as const) : ("image" as const),
      isOriginal: false,
      isLocal: false,
    })),
    ...legacyDocuments.map(({ id, file, url }) => ({
      id,
      name: file.name,
      url,
      downloadUrl: url,
      type: file.type === "application/pdf" ? ("pdf" as const) : ("image" as const),
      isOriginal: false,
      isLocal: true,
    })),
  ];

  const printDocument = (url: string, type: "image" | "pdf") => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      window.print();
      return;
    }

    const preview =
      type === "pdf"
        ? `<iframe src="${url}" title="Document" onload="window.focus(); window.print(); window.close();"></iframe>`
        : `<img src="${url}" alt="Document" onload="window.focus(); window.print(); window.close();" />`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Document</title>
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              width: 100%;
              height: 100%;
              background: #ffffff;
              overflow: hidden;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 5mm;
            }
            img, iframe {
              display: block;
              width: auto;
              height: 100%;
              max-width: 100%;
              max-height: calc(100vh - 10mm);
              object-fit: contain;
              border: 0;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
                overflow: hidden;
              }
              body {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 5mm;
              }
              img, iframe {
                width: 200mm;
                height: 287mm;
                max-width: 200mm;
                max-height: 287mm;
                page-break-before: avoid;
                page-break-after: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${preview}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section className="w-full max-w-[1400px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#30303e]">
            Documents
          </h2>
          <p className="mt-1 text-xs font-medium text-[#666672]">
            {isLoading
              ? "Loading saved documents..."
              : `${documents.length} ${documents.length === 1 ? "file" : "files"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            multiple
            onChange={addDocuments}
            className="sr-only"
            tabIndex={-1}
            disabled={isLoading || isSaving}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-[#ff9589] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#30303e] shadow-md transition hover:bg-[#ff7f73] focus:outline-none focus:ring-2 focus:ring-[#ff9589] focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:text-sm"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {isSaving ? "Saving..." : "Add"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-5 flex items-center gap-2 border-l-2 bg-white px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-[#4c956c] text-[#315e43]"
              : "border-[#db7169] text-[#713d3a]"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 md:grid-cols-3">
        {!isLoading && documents.map((document) => (
          <article
            key={document.id}
            className="overflow-hidden bg-white shadow-[10px_12px_18px_rgba(0,0,0,0.16)]"
          >
            <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#e5e5e7] px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-[#30303e]" title={document.name}>
                {document.name}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteError("");
                  setDocumentToDelete(document);
                }}
                aria-label={`Delete ${document.name}`}
                title="Delete document"
                className="shrink-0 rounded-md p-2 text-[#666672] transition hover:bg-[#f3eeee] hover:text-[#30303e] focus:outline-none focus:ring-2 focus:ring-[#ff9589]"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-[3/4] w-full bg-white">
              {document.type === "pdf" ? (
                <iframe
                  src={document.url}
                  title={document.name}
                  className="h-full w-full border-0"
                />
              ) : (
                <Image
                  src={document.url}
                  alt={document.name}
                  width={1400}
                  height={1800}
                  unoptimized={!document.isOriginal}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <div className="flex gap-2 border-t border-[#e5e5e7] p-3">
              <a
                href={document.downloadUrl}
                download={document.isOriginal || document.isLocal ? document.name : undefined}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#ff9589] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#30303e] transition hover:bg-[#ff7f73] focus:outline-none focus:ring-2 focus:ring-[#ff9589] focus:ring-offset-2"
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Download
              </a>
              <button
                type="button"
                onClick={() => printDocument(document.url, document.type)}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#30303e] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#252532] focus:outline-none focus:ring-2 focus:ring-[#30303e] focus:ring-offset-2"
              >
                <Printer aria-hidden="true" className="h-4 w-4" />
                Print
              </button>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && documents.length === 0 && (
        <p className="border border-dashed border-[#d7d3d1] px-5 py-10 text-center text-sm text-[#74747e]">
          No documents yet. Select Add to choose images or PDFs.
        </p>
      )}

      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191922]/55 px-4 py-6">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            aria-describedby="delete-document-description"
            className="w-full max-w-[420px] bg-[#f7f6f4] p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center bg-[#f4e4e2] text-[#b64f48]">
              <Trash2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 id="delete-document-title" className="text-lg font-bold text-[#30303e]">
              Delete this document?
            </h3>
            <p id="delete-document-description" className="mt-2 text-sm leading-6 text-[#74747e]">
              <span className="font-semibold text-[#4a4a55]">{documentToDelete.name}</span>
              {documentToDelete.isOriginal
                ? " will be hidden from this browser."
                : documentToDelete.isLocal
                  ? " will be removed from this browser."
                  : " will be permanently deleted from your account and private file storage."}
              {" This action cannot be undone."}
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 text-sm text-[#a13f38]">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocumentToDelete(null)}
                disabled={isDeleting}
                className="min-h-10 rounded-md border border-[#d8d6d7] px-4 text-sm font-semibold text-[#4a4a55] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff9589] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#30303e] px-4 text-sm font-bold text-white transition hover:bg-[#252532] focus:outline-none focus:ring-2 focus:ring-[#ff9589] disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
