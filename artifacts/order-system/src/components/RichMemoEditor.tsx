import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Underline } from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Palette, RotateCcw } from "lucide-react";

const PRESET_COLORS = [
  { label: "標準", value: "" },
  { label: "赤", value: "#e53e3e" },
  { label: "オレンジ", value: "#dd6b20" },
  { label: "青", value: "#2b6cb0" },
  { label: "緑", value: "#276749" },
  { label: "紫", value: "#6b46c1" },
  { label: "グレー", value: "#718096" },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichMemoEditor({ value, onChange }: Props) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, blockquote: false, code: false, codeBlock: false, horizontalRule: false }),
      TextStyle,
      Color,
      Underline,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: "min-h-[96px] px-4 py-3 text-sm text-slate-800 focus:outline-none leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    const incoming = value || "";
    const normalized = cur === "<p></p>" ? "" : cur;
    if (normalized !== incoming) {
      editor.commands.setContent(incoming);
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!editor) return null;

  const toolBtn = (active: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded-md transition-colors ${active ? "bg-primary/15 text-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
    >
      {children}
    </button>
  );

  const activeColor = editor.getAttributes("textStyle").color || "";

  return (
    <div className="border-2 rounded-xl overflow-visible transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
      {/* 툴바 */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
        {toolBtn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold size={14} />, "太字")}
        {toolBtn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic size={14} />, "斜体")}
        {toolBtn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={14} />, "下線")}

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* 색상 피커 */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            title="文字色"
            onMouseDown={e => { e.preventDefault(); setColorOpen(o => !o); }}
            className="flex items-center gap-1 p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Palette size={14} />
            <span
              className="w-3 h-3 rounded-full border border-slate-300"
              style={{ background: activeColor || "#333" }}
            />
          </button>
          {colorOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1.5 flex-wrap w-40">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onMouseDown={e => {
                    e.preventDefault();
                    if (c.value === "") {
                      editor.chain().focus().unsetColor().run();
                    } else {
                      editor.chain().focus().setColor(c.value).run();
                    }
                    setColorOpen(false);
                  }}
                  className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded-full border-2 border-slate-200"
                    style={{ background: c.value || "#333", borderColor: activeColor === c.value ? "#1D8A5A" : undefined, borderWidth: activeColor === c.value ? 2 : 1 }}
                  />
                  <span className="text-[9px] text-slate-500">{c.label}</span>
                </button>
              ))}
              {/* 직접 색상 입력 */}
              <label className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" title="自分で選択">
                <input
                  type="color"
                  className="w-5 h-5 rounded-full border border-slate-200 cursor-pointer"
                  defaultValue={activeColor || "#000000"}
                  onInput={e => {
                    editor.chain().focus().setColor((e.target as HTMLInputElement).value).run();
                  }}
                />
                <span className="text-[9px] text-slate-500">指定</span>
              </label>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {toolBtn(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), <RotateCcw size={13} />, "書式をクリア")}
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} />
    </div>
  );
}
