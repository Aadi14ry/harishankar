"use client";

import Image from "next/image";
import { Download, Plus, Printer, X } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

const documentPath = "/document.png";

export default function DocumentActions() {
  const [originalDocumentVisible, setOriginalDocumentVisible] = useState(true);
  const [addedDocuments, setAddedDocuments] = useState<
    { file: File; url: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const addDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const documents = Array.from(event.target.files ?? [])
      .filter(
        (file) => file.type.startsWith("image/") || file.type === "application/pdf",
      )
      .map((file) => {
        const url = URL.createObjectURL(file);
        objectUrls.current.add(url);
        return { file, url };
      });

    setAddedDocuments((current) => [...current, ...documents]);
    event.target.value = "";
  };

  const removeDocument = (url: string) => {
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
    setAddedDocuments((current) => current.filter((document) => document.url !== url));
  };

  const documents = [
    ...(originalDocumentVisible
      ? [{
          id: "original",
          name: "Citizenship document",
          url: documentPath,
          downloadName: "harishankar-chaudhary-document.png",
          type: "image" as const,
          isOriginal: true,
        }]
      : []),
    ...addedDocuments.map(({ file, url }) => ({
      id: url,
      name: file.name,
      url,
      downloadName: file.name,
      type: file.type === "application/pdf" ? ("pdf" as const) : ("image" as const),
      isOriginal: false,
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
            {documents.length} {documents.length === 1 ? "file" : "files"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={addDocuments}
            className="sr-only"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-[#ff9589] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#30303e] shadow-md transition hover:bg-[#ff7f73] focus:outline-none focus:ring-2 focus:ring-[#ff9589] focus:ring-offset-2 sm:text-sm"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 md:grid-cols-3">
        {documents.map((document) => (
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
                onClick={() =>
                  document.isOriginal
                    ? setOriginalDocumentVisible(false)
                    : removeDocument(document.url)
                }
                aria-label={`Remove ${document.name}`}
                className="shrink-0 rounded-md p-2 text-[#666672] transition hover:bg-[#f3eeee] hover:text-[#30303e] focus:outline-none focus:ring-2 focus:ring-[#ff9589]"
              >
                <X aria-hidden="true" className="h-4 w-4" />
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
                href={document.url}
                download={document.downloadName}
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
    </section>
  );
}
