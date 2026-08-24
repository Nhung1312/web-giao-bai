import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathDisplayProps {
  text?: string | null;
  className?: string;
  inline?: boolean;
}

/**
 * Intelligent LaTeX & KaTeX parser for Vietnamese Secondary School Mathematics (Toán THCS Lớp 6 - 9)
 * Supports:
 * - Standard LaTeX Block formulas: `$$...$$` or `\[...\]`
 * - Standard LaTeX Inline formulas: `$...$` or `\(...\)`
 * - Vietnamese Math notations: fractions (e.g. 2/5, -3/7), square roots (√2x-6), powers (x^2, x²), subscripts (x₁), angles (\widehat{ABC}, \angle A), degrees (90°), vectors (\vec{AB}).
 * - Safe rendering: will not crash on malformed inputs.
 */
export const MathDisplay: React.FC<MathDisplayProps> = ({ 
  text, 
  className = '',
  inline = false 
}) => {
  if (!text || typeof text !== 'string') return null;

  if (inline) {
    return (
      <span className={`inline-math-container text-inherit font-normal ${className}`}>
        {renderInlineContent(text)}
      </span>
    );
  }

  // Split lines
  const lines = text.split(/\r?\n/);

  return (
    <div className={`math-display-container text-inherit leading-relaxed break-words ${className}`}>
      {lines.map((line, lIdx) => {
        if (!line.trim()) {
          return <div key={lIdx} className="h-2" />;
        }

        return (
          <div key={lIdx} className={lIdx > 0 ? 'mt-2' : ''}>
            {renderLineContent(line)}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Pre-processes and normalizes raw math symbols into clean LaTeX strings
 */
function normalizeToLatex(formula: string): string {
  return formula.trim()
    // Unicode superscripts & subscripts
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/⁵/g, '^5')
    .replace(/₁/g, '_1')
    .replace(/₂/g, '_2')
    .replace(/₃/g, '_3')
    .replace(/₄/g, '_4')
    // Degree symbol: 90° -> 90^\circ
    .replace(/(\d+)\s*°/g, '$1^\\circ')
    .replace(/°/g, '^\\circ')
    // Multiplication and division
    .replace(/·/g, ' \\cdot ')
    .replace(/×/g, ' \\times ')
    .replace(/÷/g, ' \\div ')
    .replace(/:/g, ' : ')
    // Plus-minus
    .replace(/±/g, ' \\pm ')
    // Comparison and logic symbols
    .replace(/≥/g, ' \\ge ')
    .replace(/≤/g, ' \\le ')
    .replace(/≠/g, ' \\neq ')
    .replace(/≈/g, ' \\approx ')
    .replace(/<=>/g, ' \\Leftrightarrow ')
    .replace(/=>/g, ' \\Rightarrow ')
    .replace(/->/g, ' \\rightarrow ')
    .replace(/Δ/g, ' \\Delta ')
    .replace(/π/g, ' \\pi ')
    // Geometry angle representations: \hat{ABC} -> \widehat{ABC}
    .replace(/\\hat\{([a-zA-Z0-9]+)\}/g, '\\widehat{$1}')
    // Unicode square root: √A or √(2x-6) -> \sqrt{A} or \sqrt{2x-6}
    .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
}

/**
 * Renders a KaTeX formula to HTML string safely
 */
function renderKaTeX(formula: string, isBlock: boolean): string {
  try {
    const cleanFormula = normalizeToLatex(formula);
    return katex.renderToString(cleanFormula, {
      displayMode: isBlock,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: true
    });
  } catch (e) {
    return `<span class="font-mono text-indigo-600">${escapeHtml(formula)}</span>`;
  }
}

/**
 * Parses and renders a line with block equations ($$...$$ or \[...\]) and inline content
 */
function renderLineContent(line: string): React.ReactNode {
  // Regex to split block math
  const blockRegex = /(\$\$.*?\$\$|\\\[.*?\\\])/gs;
  const segments = line.split(blockRegex);

  return segments.map((seg, idx) => {
    if (!seg) return null;

    // $$...$$
    if (seg.startsWith('$$') && seg.endsWith('$$') && seg.length >= 4) {
      const formula = seg.slice(2, -2);
      const html = renderKaTeX(formula, true);
      return (
        <div
          key={idx}
          className="my-3 overflow-x-auto py-1 text-center font-serif text-inherit katex-block-wrapper"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // \[...\]
    if (seg.startsWith('\\[') && seg.endsWith('\\]') && seg.length >= 4) {
      const formula = seg.slice(2, -2);
      const html = renderKaTeX(formula, true);
      return (
        <div
          key={idx}
          className="my-3 overflow-x-auto py-1 text-center font-serif text-inherit katex-block-wrapper"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    return <span key={idx} className="text-inherit">{renderInlineContent(seg)}</span>;
  });
}

/**
 * Parses inline math ($...$ or \(...\)), bolding (**...**), and auto-detects un-wrapped fractions / exponents / symbols
 */
function renderInlineContent(text: string): React.ReactNode {
  // Regex to split standard LaTeX inline math and bold markers
  const inlineRegex = /(\$(?!\$).*?\$|\\\(.*?\\\)|(?:\*\*.*?\*\*))/g;
  const parts = text.split(inlineRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline math $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      const formula = part.slice(1, -1);
      const html = renderKaTeX(formula, false);
      return (
        <span
          key={index}
          className="inline-block align-baseline mx-0.5 text-inherit"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // Inline math \(...\)
    if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
      const formula = part.slice(2, -2);
      const html = renderKaTeX(formula, false);
      return (
        <span
          key={index}
          className="inline-block align-baseline mx-0.5 text-inherit"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // Markdown bold **bold**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-inherit">
          {renderInlineContent(part.slice(2, -2))}
        </strong>
      );
    }

    // Plain text: auto-detect math expressions like 1/2, x^2, √5, 45°
    return <span key={index} className="text-inherit">{renderSmartMathText(part)}</span>;
  });
}

/**
 * Smart detection for raw math expressions in plain text:
 * - Standalone fractions: 1/2, -3/7, 24/36, a/b
 * - Powers: x^2, (x+1)^2, 10^5, a^n
 * - Roots: √25, √(2x-6), \sqrt{...}
 * - Angle notations: \widehat{ABC}, \angle A
 * - Degrees: 90°, 45°
 * - Special math symbols: \frac{a}{b}, \le, \ge, \neq, \pm
 */
function renderSmartMathText(str: string): React.ReactNode {
  // Check if string contains any mathematical tokens
  // 1. standalone fraction: -?\d+(?:\.\d+)?\/\d+(?:\.\d+)?
  // 2. exponent: [a-zA-Z0-9\(\)]+\^[0-9a-zA-Z\+\-]+
  // 3. square roots: √\([^)]+\)|√\s*\d+|\\sqrt\{[^}]+\}
  // 4. angles: \\widehat\{[a-zA-Z0-9]+\}|\\angle\s+[A-Za-z0-9]+
  // 5. degrees: \d+°
  // 6. LaTeX commands: \\frac\{[^}]+\}\{[^}]+\}
  // Match math tokens: standalone fractions (-?a/b), exponents (x^2), roots (√x), angles (\widehat{ABC}), degrees (90°), LaTeX fractions (\frac{a}{b})
  const pattern = /(-?\d+(?:\.\d+)?\/\d+(?:\.\d+)?)|([a-zA-Z0-9()]+\^[0-9a-zA-Z+-]+)|(√\([^)]+\)|√\s*[0-9a-zA-Z]+|\\sqrt\{[^{}]+\})|(\\widehat\{[a-zA-Z0-9]+\}|\\angle\s+[A-Za-z0-9]+)|(\d+°)|(\\frac\{[^{}]+\}\{[^{}]+\})/g;

  if (!pattern.test(str)) {
    return str;
  }

  pattern.lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(str)) !== null) {
    const matchStart = match.index;
    const matchText = match[0];

    // Push preceding text
    if (matchStart > lastIndex) {
      nodes.push(str.substring(lastIndex, matchStart));
    }

    let latexCode = '';

    if (match[1]) {
      // Fraction 1/2 or -3/7
      const fracParts = match[1].split('/');
      latexCode = `\\frac{${fracParts[0]}}{${fracParts[1]}}`;
    } else if (match[2]) {
      // Exponent x^2
      latexCode = match[2];
    } else if (match[3]) {
      // Square root
      latexCode = match[3];
    } else if (match[4]) {
      // Angle
      latexCode = match[4];
    } else if (match[5]) {
      // Degree 90°
      const num = match[5].replace('°', '');
      latexCode = `${num}^\\circ`;
    } else if (match[6]) {
      // \frac{...}{...}
      latexCode = match[6];
    } else {
      latexCode = matchText;
    }

    if (latexCode) {
      const html = renderKaTeX(latexCode, false);
      nodes.push(
        <span
          key={`math-token-${matchStart}`}
          className="inline-block align-baseline mx-0.5 text-inherit"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else {
      nodes.push(matchText);
    }

    lastIndex = matchStart + matchText.length;
  }

  if (lastIndex < str.length) {
    nodes.push(str.substring(lastIndex));
  }

  return nodes;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
