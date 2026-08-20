import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getBoletaById, getEmpresaById } from '../db/database';
import { LOGO_BASE64 } from '../logobase64';
import { App } from '@capacitor/app';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatShortDate } from '../utils/format';

const EMPRESA_NOMBRE = 'Tierra Paraguay E.A.S';
const EMPRESA_RUC = '80158613-5';

export default function BoletaDetail({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [boleta, setBoleta] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    loadBoleta();
  }, [id]);

  const loadBoleta = async () => {
    const data = await getBoletaById(id);
    if (data) {
      setBoleta(data);
    } else {
      navigate('/');
    }
  };

  const generarHTML = () => {
    if (!boleta) return '';

    const logoImg = `<img src="${LOGO_BASE64}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:10px">`;

    const serviciosHTML = boleta.servicios.map(s => `
      <tr>
        <td style="border:1px solid #ddd;padding:8px;text-align:center">${formatShortDate(s.fecha)}</td>
        <td style="border:1px solid #ddd;padding:8px">${s.tipo_mercaderia.charAt(0).toUpperCase() + s.tipo_mercaderia.slice(1)}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:center">${s.cantidad} ${s.unidad}</td>
        <td style="border:1px solid #ddd;padding:8px">${s.descripcion || '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleta #${boleta.numero} - ${EMPRESA_NOMBRE}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #ea580c; padding-bottom: 15px; }
          .header h1 { color: #ea580c; margin: 0; font-size: 24px; }
          .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info div { width: 48%; }
          .info h3 { color: #666; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; }
          .info p { margin: 2px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f4f4f4; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; }
          td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
          .total { text-align: right; font-weight: bold; margin-top: 10px; font-size: 16px; }
          .extra { margin-top: 15px; font-size: 13px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #ea580c; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex;align-items:center;justify-content:center">
            ${logoImg}
            <div>
              <h1>${EMPRESA_NOMBRE}</h1>
              <p>RUC: ${EMPRESA_RUC}</p>
            </div>
          </div>
        </div>

        <div class="info">
          <div>
            <h3>Empresa</h3>
            <p>${boleta.empresa_nombre}</p>
            <p style="font-size:12px;color:#666">${boleta.direccion_entrega}</p>
          </div>
          <div style="text-align:right">
            <h2 style="color:#ea580c;margin:0">#${boleta.numero}</h2>
            <p style="color:#666;font-size:13px">${formatShortDate(boleta.fecha)}</p>
          </div>
        </div>

        <div class="info">
          <div>
            <h3>Conductor</h3>
            <p>${boleta.conductor_nombre}</p>
            <p style="font-size:12px;color:#666">${boleta.vehiculo_label ? `Vehículo: ${boleta.vehiculo_label}` : `Chapa: ${boleta.chapa}`}</p>
          </div>
        </div>

        <table>
          <tr>
            <th>Fecha</th>
            <th>Mercaderia</th>
            <th style="text-align:center">Cantidad</th>
            <th>Descripcion</th>
          </tr>
          ${serviciosHTML}
        </table>

        <div class="total">Total: ${boleta.resumen_total || boleta.total_m3 + ' m3'}</div>

        ${boleta.factura_numero || boleta.observacion ? `
          <div class="extra">
            ${boleta.factura_numero ? `<p><strong>Factura:</strong> ${boleta.factura_numero}</p>` : ''}
            ${boleta.observacion ? `<p><strong>Observacion:</strong> ${boleta.observacion}</p>` : ''}
          </div>
        ` : ''}

        <div class="footer">
          ${EMPRESA_NOMBRE} - RUC ${EMPRESA_RUC}
        </div>
      </body>
      </html>
    `;
  };

  const showOverlay = () => {
    if (!boleta) return;
    setOverlayVisible(true);
  };

  useEffect(() => {
    if (!overlayVisible || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(generarHTML());
    doc.close();
  }, [overlayVisible]);

  const captureBoleta = async () => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;height:1px;border:none;z-index:-1;opacity:0';
    document.body.appendChild(iframe);
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(generarHTML().replace('<html>', '<html style="width:794px">').replace('width=device-width, initial-scale=1.0', 'width=794'));
      doc.close();
      await new Promise(r => setTimeout(r, 800));
      const body = iframe.contentDocument.body;
      const w = body.scrollWidth || 794;
      const h = body.scrollHeight;
      const canvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h
      });
      return canvas;
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const shareOrDownload = async (blob, nombre, titulo) => {
    const file = new File([blob], nombre, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: titulo });
        return;
      } catch {}
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareAsPDF = async () => {
    if (!boleta) return;
    try {
      const canvas = await captureBoleta();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const blob = pdf.output('blob');
      await shareOrDownload(blob, `Boleta-${boleta.numero}.pdf`, `Boleta #${boleta.numero} - ${EMPRESA_NOMBRE}`);
    } catch {}
  };

  const shareAsImage = async (format = 'jpeg') => {
    if (!boleta) return;
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    try {
      const canvas = await captureBoleta();
      const blob = await new Promise(r => canvas.toBlob(r, mime, 0.92));
      if (!blob) return;
      await shareOrDownload(blob, `Boleta-${boleta.numero}.${ext}`, `Boleta #${boleta.numero} - ${EMPRESA_NOMBRE}`);
    } catch {}
  };

  const buildBoletaText = () => {
    const titulo = `${EMPRESA_NOMBRE} - Boleta #${boleta.numero}`;
    return `*${titulo}*\n\n` +
      `Fecha: ${formatShortDate(boleta.fecha)}\n` +
      `Empresa: ${boleta.empresa_nombre}\n` +
      `Direccion: ${boleta.direccion_entrega}\n` +
      `${boleta.vehiculo_label ? `Vehículo: ${boleta.vehiculo_label}` : `Chapa: ${boleta.chapa}`}\n` +
      `Conductor: ${boleta.conductor_nombre}\n\n` +
      `*Servicios:*\n` +
      boleta.servicios.map((s, i) =>
        `${i+1}. ${s.tipo_mercaderia} - ${s.cantidad} ${s.unidad} (${formatShortDate(s.fecha)})`
      ).join('\n') + '\n\n' +
      `Total: ${boleta.resumen_total || boleta.total_m3 + ' m3'}\n` +
      (boleta.factura_numero ? `Factura: ${boleta.factura_numero}\n` : '') +
      (boleta.observacion ? `Observacion: ${boleta.observacion}\n` : '') +
      `\n${EMPRESA_NOMBRE} - RUC ${EMPRESA_RUC}`;
  };

  const getPhone = async () => {
    let phone = (boleta.telefono_empresa || '').replace(/\D/g, '');
    if (!phone && boleta.empresa_id) {
      const empresa = await getEmpresaById(boleta.empresa_id);
      phone = (empresa?.telefono || '').replace(/\D/g, '');
    }
    return phone;
  };

  const shareBoleta = async (plataforma) => {
    const titulo = `${EMPRESA_NOMBRE} - Boleta #${boleta.numero}`;
    const texto = buildBoletaText();

    if (plataforma === 'whatsapp') {
      const phone = await getPhone();
      const waUrl = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`
        : `https://wa.me/?text=${encodeURIComponent(texto)}`;
      try {
        await App.openUrl({ url: waUrl });
      } catch {
        window.open(waUrl, '_blank');
      }
    } else {
      try {
        await navigator.share({ title: titulo, text: texto });
        return;
      } catch {}
      try {
        await navigator.clipboard.writeText(texto);
        alert('Texto copiado al portapapeles');
      } catch {
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
      }
    }
  };

  if (!boleta) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm font-medium active:scale-95 transition"
        >
          Volver
        </button>
        {(user.role === 'admin' || user.role === 'superadmin') && (
          <button
            onClick={() => navigate('/editar/' + boleta.id)}
            className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg active:bg-gray-200 dark:active:bg-gray-600"
            title="Editar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_BASE64} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <h1 className="text-xl font-bold text-primary-600">{EMPRESA_NOMBRE}</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">RUC: {EMPRESA_RUC}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">#{boleta.numero}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">{formatShortDate(boleta.fecha)}</p>
          </div>
        </div>

        <div className="border-t border-primary-600 pt-3 mt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">EMPRESA</p>
              <p className="font-medium text-gray-900 dark:text-white">{boleta.empresa_nombre}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{boleta.direccion_entrega}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">CONDUCTOR</p>
              <p className="font-medium text-gray-900 dark:text-white">{boleta.conductor_nombre}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{boleta.vehiculo_label ? `Vehículo: ${boleta.vehiculo_label}` : `Chapa: ${boleta.chapa}`}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg mb-2 text-xs font-medium text-gray-600 dark:text-gray-300 grid grid-cols-4 gap-2">
            <span>Fecha</span>
            <span>Mercaderia</span>
            <span className="text-right">Cantidad</span>
            <span>Descripcion</span>
          </div>
          {boleta.servicios.map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 py-2 text-sm border-t border-gray-100 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">{formatShortDate(s.fecha)}</span>
              <span className="capitalize text-gray-900 dark:text-white">{s.tipo_mercaderia}</span>
              <span className="text-right text-gray-900 dark:text-white">{s.cantidad} {s.unidad}</span>
              <span className="text-gray-600 dark:text-gray-400">{s.descripcion || '-'}</span>
            </div>
          ))}
          <div className="border-t-2 border-gray-300 dark:border-gray-600 mt-2 pt-2 text-right font-bold text-gray-900 dark:text-white">
            Total: {boleta.resumen_total || boleta.total_m3 + ' m3'}
          </div>
        </div>

        {(boleta.factura_numero || boleta.observacion) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 text-sm">
            {boleta.factura_numero && <p className="text-gray-900 dark:text-white"><span className="font-medium">Factura:</span> {boleta.factura_numero}</p>}
            {boleta.observacion && <p className="text-gray-900 dark:text-white"><span className="font-medium">Observacion:</span> {boleta.observacion}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={shareAsPDF}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition text-xs"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          <span>PDF</span>
        </button>
        <button
          onClick={showOverlay}
          className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition text-xs"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          <span>VER</span>
        </button>
        <button
          onClick={() => shareBoleta('whatsapp')}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition text-xs"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          <span>WhatsApp</span>
        </button>
      </div>

      {overlayVisible && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => setOverlayVisible(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={() => shareAsImage('jpeg')}
              className="px-4 py-2 rounded-lg bg-gray-800 dark:bg-gray-600 text-white text-sm font-medium"
            >
              Compartir JPG
            </button>
          </div>
          <iframe
            ref={iframeRef}
            className="flex-1 w-full border-0"
            title="Reporte"
          />
        </div>
      )}
    </div>
  );
}
