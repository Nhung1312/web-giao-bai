import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, ExternalLink, X, Download, Share2 } from 'lucide-react';
import { Assignment } from '../types';

interface QRCodeModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ assignment, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Link bài tập
  const origin = window.location.origin;
  const assignmentLink = `${origin}/join?code=${assignment.assignmentCode}`;

  useEffect(() => {
    if (isOpen && assignment.assignmentCode) {
      QRCode.toDataURL(assignmentLink, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e3a8a', // Deep navy blue
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Lỗi tạo QR:', err));
    }
  }, [isOpen, assignment.assignmentCode, assignmentLink]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(assignment.assignmentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(assignmentLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${assignment.assignmentCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <h3 className="font-bold text-lg">Chia sẻ bài tập cho học sinh</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-2">
            <span className="inline-block bg-blue-100 text-blue-800 font-semibold text-xs px-2.5 py-0.5 rounded-full mb-1">
              Lớp {assignment.grade} • {assignment.className ? `Lớp ${assignment.className}` : 'Tất cả học sinh'}
            </span>
            <h4 className="font-bold text-slate-800 text-base line-clamp-1">{assignment.title}</h4>
          </div>

          {/* QR Code Canvas */}
          <div className="my-4 inline-block p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code ${assignment.assignmentCode}`}
                className="w-52 h-52 mx-auto object-contain rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center bg-slate-50 text-slate-400">
                Đang tạo mã QR...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Học sinh dùng Zalo hoặc Camera điện thoại để quét mã QR làm bài ngay!
          </p>

          {/* Mã bài tập lớn */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 mb-4">
            <span className="text-xs uppercase font-medium text-indigo-600 block mb-0.5">
              Mã bài tập
            </span>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-mono font-extrabold text-indigo-900 tracking-wider">
                {assignment.assignmentCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 bg-white text-indigo-600 hover:text-indigo-800 rounded-lg border border-indigo-200 shadow-xs hover:bg-indigo-50 transition-all flex items-center text-xs font-medium"
                title="Sao chép mã"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã chép link</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Sao chép link</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Tải ảnh QR</span>
            </button>
          </div>

          {/* Test direct join button */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href={`#assignment=${assignment.assignmentCode}`}
              onClick={onClose}
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Mở trang làm bài ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
