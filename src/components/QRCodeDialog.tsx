import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { DownloadIcon, PrinterIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface QRCodeDialogProps {
  trigger: React.ReactNode;
  value: string;
  title: string;
  itemName: string;
}

export function QRCodeDialog({ trigger, value, title, itemName }: QRCodeDialogProps) {
  const [open, setOpen] = useState(false);

  const handleDownloadQR = (format: "normal" | "label", e: React.MouseEvent) => {
    e.stopPropagation();
    const svg = document.getElementById(`item-qr-code-${format}`);
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-code-${itemName.toLowerCase().replace(/\s+/g, "-")}${format === "label" ? "-label" : ""}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  const handlePrintLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Calculate dimensions for 1.25" x 3.5" at 96 DPI
    const width = 1.25 * 96;
    const height = 3.5 * 96;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code Label</title>
          <style>
            @page {
              size: 3.5in 1.25in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: ${width}px;
              height: ${height}px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .label-container {
              display: flex;
              align-items: center;
              width: 100%;
              height: 100%;
              padding: 4px;
              box-sizing: border-box;
            }
            .qr-code {
              height: 100%;
              width: auto;
            }
            .text-content {
              margin-left: 8px;
              font-family: Arial, sans-serif;
              font-size: 10px;
              overflow: hidden;
            }
            @media print {
              body {
                width: 3.5in;
                height: 1.25in;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${document.getElementById("item-qr-code-label")?.outerHTML || ""}
            <div class="text-content">
              <div style="font-weight: bold;">${itemName}</div>
              <div>Scan for details</div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
            <QRCodeSVG
              id="item-qr-code-normal"
              value={value}
              size={256}
              level="H"
              includeMargin
            />
            <Button
              onClick={(e) => handleDownloadQR("normal", e)}
              className="mt-4 flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
            <div className="flex items-center gap-4 w-full" style={{ height: "120px" }}>
              <QRCodeSVG
                id="item-qr-code-label"
                value={value}
                size={120}
                level="H"
                includeMargin={false}
              />
              <div className="text-sm">
                <div className="font-bold">{itemName}</div>
                <div className="text-muted-foreground">Scan for details</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={(e) => handleDownloadQR("label", e)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Download Label
              </Button>
              <Button
                onClick={handlePrintLabel}
                className="flex items-center gap-2"
              >
                <PrinterIcon className="h-4 w-4" />
                Print Label
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 