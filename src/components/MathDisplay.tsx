import React from 'react';

interface MathDisplayProps {
  text: string;
  className?: string;
}

/**
 * Hiển thị văn bản Toán học THCS đẹp mắt và rõ ràng.
 * Hỗ trợ hiển thị phân số (a/b), số mũ (^2), căn bậc hai (√), dấu nhân (×), dấu chia (:), v.v.
 */
export const MathDisplay: React.FC<MathDisplayProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Xử lý xuống dòng và giữ nguyên định dạng
  const paragraphs = text.split('\n');

  return (
    <div className={`leading-relaxed font-sans text-slate-800 ${className}`}>
      {paragraphs.map((p, pIdx) => (
        <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
          {renderFormattedText(p)}
        </p>
      ))}
    </div>
  );
};

function renderFormattedText(str: string): React.ReactNode[] {
  // Tách các từ và định dạng số mũ như ^2, ^3 hoặc phân số nếu cần
  const parts = str.split(/(\^[0-9a-zA-Z]+|\b[0-9]+(?:\/[0-9]+)+\b|\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold text **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Exponent ^2
    if (part.startsWith('^')) {
      return (
        <sup key={index} className="text-xs font-semibold text-indigo-700">
          {part.substring(1)}
        </sup>
      );
    }

    return <span key={index}>{part}</span>;
  });
}
