import React, { useEffect, useRef, useState } from "react";
import { Copy, Check, WrapText } from "lucide-react";
interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "python",
  title,
}) => {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [wrap, setWrap] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  };
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{title || language}</span>
        <div>
          <button
            onClick={() => setWrap(!wrap)}
            aria-pressed={wrap}
            title="自动换行"
            aria-label="代码自动换行"
          >
            <WrapText size={15} />
          </button>
          <button onClick={copy} aria-label="复制代码">
            {status === "copied" ? <Check size={14} /> : <Copy size={14} />}
            <span aria-live="polite">
              {status === "copied"
                ? "已复制"
                : status === "error"
                  ? "复制失败，请手动选择"
                  : "复制"}
            </span>
          </button>
        </div>
      </div>
      <pre
        className={wrap ? "code-wrap" : ""}
        tabIndex={0}
        aria-label={title || `${language} 代码`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};
