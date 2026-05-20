import jsPDF from 'jspdf';
import type { TestResult } from '../types';

const toPdfSafe = (text: string) =>
  text
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');

export function generateResultPdf(latestResult: TestResult) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 50;

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 110, 'F');
  pdf.setTextColor(245, 158, 11);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.text('KatipTest Sonuc Raporu', pageWidth / 2, 45, { align: 'center' });
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(12);
  pdf.text('Zabit Katipligi Sinav Simulasyonu', pageWidth / 2, 68, { align: 'center' });
  pdf.text(`Tarih: ${toPdfSafe(latestResult.date)}`, pageWidth / 2, 88, { align: 'center' });

  y = 145;
  const rows = [
    ['Dogru Kelime', String(latestResult.netWords)],
    ['Yanlis Kelime', String(latestResult.grossWords - latestResult.netWords)],
    ['Toplam Kelime', String(latestResult.grossWords)],
    ['Dogru Karakter', String(latestResult.correctChars)],
    ['Yanlis Karakter', String(latestResult.incorrectChars)],
    ['Toplam Karakter', String(latestResult.totalChars)],
    ['WPM', String(latestResult.wpm)],
    ['Dogruluk', `${latestResult.accuracy}%`],
  ] as const;

  const drawCard = (x: number, yPos: number, label: string, value: string, color: [number, number, number]) => {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x, yPos, 240, 52, 8, 8, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(x, yPos, 240, 52, 8, 8, 'S');
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(label, x + 12, yPos + 18);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(value, x + 12, yPos + 39);
  };

  rows.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 40 : 300;
    if (i % 2 === 0 && i > 0) y += 70;
    const color: [number, number, number] =
      label.includes('Yanlis') ? [239, 68, 68] :
      label.includes('Dogruluk') ? [34, 197, 94] :
      label === 'WPM' ? [245, 158, 11] : [15, 23, 42];
    drawCard(x, y, label, value, color);
  });

  y += 95;
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Genel Degerlendirme', 40, y);
  y += 20;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  const errorRate = latestResult.grossWords > 0 ? ((latestResult.grossWords - latestResult.netWords) / latestResult.grossWords) * 100 : 0;
  const resultText = latestResult.netWords >= 90 && errorRate <= 40
    ? 'Aday 90 kelime hedefini gecmis ve anlam butunlugu kosulunu saglamistir.'
    : 'Adayin sonucu hedef veya hata orani bakimindan gelistirme gerektirmektedir.';
  const wrapped = pdf.splitTextToSize(resultText, pageWidth - 80);
  pdf.text(wrapped, 40, y);
  y += wrapped.length * 16 + 16;

  if (latestResult.wordErrorDetails && latestResult.wordErrorDetails.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Kelime Hata Detayi', 40, y);
    y += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    latestResult.wordErrorDetails.slice(0, 12).forEach((d) => {
      const line = `Beklenen: ${toPdfSafe(d.expected)} | Yazilan: ${toPdfSafe(d.typed)} | Tip: ${toPdfSafe(d.errorType)} | Hata: ${d.charErrors}`;
      const lines = pdf.splitTextToSize(line, pageWidth - 80);
      pdf.text(lines, 40, y);
      y += lines.length * 14 + 4;
    });
  }

  pdf.save(`katiptest-rapor-${Date.now()}.pdf`);
}
