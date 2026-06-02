"use client";

const documentPath = "/document.png";

export default function DocumentActions() {
  const printDocument = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Harishankar Chaudhary Document</title>
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
            img {
              display: block;
              width: auto;
              height: auto;
              max-width: 100%;
              max-height: calc(100vh - 10mm);
              object-fit: contain;
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
              img {
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
          <img src="${documentPath}" alt="Citizenship document" onload="window.focus(); window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex w-full max-w-[900px] items-center justify-end gap-3">
      <a
        href={documentPath}
        download="harishankar-chaudhary-document.png"
        className="rounded-md bg-[#ff9589] px-5 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#30303e] shadow-md transition hover:bg-[#ff7f73] focus:outline-none focus:ring-2 focus:ring-[#ff9589] focus:ring-offset-2"
      >
        Download
      </a>
      <button
        type="button"
        onClick={printDocument}
        className="rounded-md bg-[#30303e] px-5 py-2 text-sm font-black uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-[#252532] focus:outline-none focus:ring-2 focus:ring-[#30303e] focus:ring-offset-2"
      >
        Print
      </button>
    </div>
  );
}
