import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface TerminalViewProps {
  title?: string;
  command?: string;
  logs: { timestamp?: string; level?: string; message: string }[] | string;
  maxHeight?: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  title = 'bash - /bin/bash (x86_64)',
  command,
  logs,
  maxHeight = 'max-h-72',
}) => {
  const [copied, setCopied] = useState(false);

  const fullText = Array.isArray(logs)
    ? logs.map((l) => `${l.timestamp ? `[${l.timestamp}] ` : ''}${l.level ? `${l.level}: ` : ''}${l.message}`).join('\n')
    : logs;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#08482D]/20 bg-[#0C1510] overflow-hidden shadow-lg font-mono-tech text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#14231B] border-b border-[#08482D]/30 text-slate-300">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#DAE7C7]" />
            {title}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-[#DAE7C7] transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Terminal Content */}
      <div className={`p-4 overflow-y-auto space-y-1.5 text-slate-200 ${maxHeight}`}>
        {command && (
          <div className="text-[#DAE7C7] font-bold mb-2 flex items-center space-x-1.5">
            <span className="text-[#34D399]">root@warehousex-srv01:~#</span>
            <span className="text-white">{command}</span>
          </div>
        )}

        {Array.isArray(logs) ? (
          logs.map((log, index) => {
            let color = 'text-slate-300';
            if (log.level === 'SUCCESS') color = 'text-[#34D399] font-bold';
            if (log.level === 'WARNING') color = 'text-[#FCD34D] font-medium';
            if (log.level === 'CRITICAL' || log.level === 'ERROR') color = 'text-[#F87171] font-bold';
            if (log.level === 'INFO') color = 'text-[#93C5FD]';

            return (
              <div key={index} className="leading-relaxed flex items-start space-x-2">
                {log.timestamp && <span className="text-slate-500 select-none">[{log.timestamp}]</span>}
                {log.level && <span className={`uppercase font-bold ${color}`}>[{log.level}]</span>}
                <span className={color}>{log.message}</span>
              </div>
            );
          })
        ) : (
          <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 text-[11px]">
            {logs}
          </pre>
        )}
      </div>
    </div>
  );
};
