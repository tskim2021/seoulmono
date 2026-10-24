import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch, getGetNoticesQueryKey } from "@workspace/api-client-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Underline } from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon, Palette, RotateCcw,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, Paperclip, X, FileText, Loader2, Save,
} from "lucide-react";
import { toast } from "../hooks/use-toast";
import { Button } from "../components/ui";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function isImageFile(file: any) {
  if (file.isImage !== undefined) return file.isImage;
  const ext = (file.filename || file.originalname || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(ext);
}

function getAuthFileUrl(url: string) {
  const token = localStorage.getItem("token");
  if (!token) return url;
  return `${url}?token=${encodeURIComponent(token)}`;
}

const PRESET_COLORS = [
  { label: "標準", value: "" },
  { label: "赤", value: "#e53e3e" },
  { label: "オレンジ", value: "#dd6b20" },
  { label: "青", value: "#2b6cb0" },
  { label: "緑", value: "#276749" },
  { label: "紫", value: "#6b46c1" },
  { label: "グレー", value: "#718096" },
];

function NoticeEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ blockquote: false, code: false, codeBlock: false, horizontalRule: false }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: "min-h-[400px] px-6 py-5 text-sm text-slate-800 focus:outline-none leading-relaxed prose prose-slate max-w-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    const incoming = value || "";
    const normalized = cur === "<p></p>" ? "" : cur;
    if (normalized !== incoming) editor.commands.setContent(incoming);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setColorOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!editor) return <div className="h-[400px] border-2 rounded-xl animate-pulse bg-slate-50" />;

  const tb = (active: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded-md transition-colors ${active ? "bg-primary/15 text-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
    >
      {children}
    </button>
  );

  const sep = <div className="w-px h-4 bg-slate-200 mx-0.5" />;
  const activeColor = editor.getAttributes("textStyle").color || "";

  return (
    <div className="border-2 rounded-xl overflow-visible transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
      {/* 툴바 */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-100 bg-slate-50/80 rounded-t-xl flex-wrap">
        {/* 제목 */}
        {tb(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 size={15} />, "見出し1")}
        {tb(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={15} />, "見出し2")}
        {tb(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 size={15} />, "見出し3")}
        {sep}
        {/* 글자 서식 */}
        {tb(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold size={14} />, "太字")}
        {tb(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic size={14} />, "斜体")}
        {tb(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={14} />, "下線")}
        {sep}
        {/* 정렬 */}
        {tb(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <AlignLeft size={14} />, "左揃え")}
        {tb(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <AlignCenter size={14} />, "中央揃え")}
        {tb(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), <AlignRight size={14} />, "右揃え")}
        {tb(editor.isActive({ textAlign: "justify" }), () => editor.chain().focus().setTextAlign("justify").run(), <AlignJustify size={14} />, "両端揃え")}
        {sep}
        {/* 목록 */}
        {tb(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List size={14} />, "箇条書き")}
        {tb(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={14} />, "番号付きリスト")}
        {sep}
        {/* 색상 */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            title="文字色"
            onMouseDown={e => { e.preventDefault(); setColorOpen(o => !o); }}
            className="flex items-center gap-1 p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Palette size={14} />
            <span className="w-3 h-3 rounded-full border border-slate-300" style={{ background: activeColor || "#333" }} />
          </button>
          {colorOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1.5 flex-wrap w-44">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onMouseDown={e => {
                    e.preventDefault();
                    if (c.value === "") editor.chain().focus().unsetColor().run();
                    else editor.chain().focus().setColor(c.value).run();
                    setColorOpen(false);
                  }}
                  className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full border-2 border-slate-200" style={{ background: c.value || "#333", borderColor: activeColor === c.value ? "#1D8A5A" : undefined }} />
                  <span className="text-[9px] text-slate-500">{c.label}</span>
                </button>
              ))}
              <label className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" title="自分で選択">
                <input type="color" className="w-5 h-5 rounded-full border border-slate-200 cursor-pointer" defaultValue={activeColor || "#000000"}
                  onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} />
                <span className="text-[9px] text-slate-500">指定</span>
              </label>
            </div>
          )}
        </div>
        {sep}
        {tb(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), <RotateCcw size={13} />, "書式をクリア")}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

interface Props {
  noticeId?: number;
}

export default function AdminNoticeEdit({ noticeId }: Props) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isEdit = !!noticeId;

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [deleteFiles, setDeleteFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filePreviews = useMemo(() => {
    return files.map(f => {
      const ext = f.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
      const isImg = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(ext);
      return { file: f, isImg, url: isImg ? URL.createObjectURL(f) : null };
    });
  }, [files]);

  useEffect(() => {
    return () => { filePreviews.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); }); };
  }, [filePreviews]);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["notice-detail", noticeId],
    queryFn: () => customFetch<any>(`/api/boards/notice/${noticeId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (detail) {
      setSubject(detail.wr_subject || "");
      setContent(detail.wr_content || "");
      setExistingFiles(detail.files || []);
    }
  }, [detail]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("content", content);
      files.forEach(f => fd.append("files", f));
      const token = localStorage.getItem("token");
      const res = await fetch("/api/boards/notice", {
        method: "POST", body: fd,
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "登録に失敗しました");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "お知らせを登録しました" });
      queryClient.invalidateQueries({ queryKey: getGetNoticesQueryKey() });
      navigate("/notices");
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("content", content);
      fd.append("deleteFiles", JSON.stringify(deleteFiles));
      files.forEach(f => fd.append("files", f));
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/boards/notice/${noticeId}`, {
        method: "PUT", body: fd,
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "更新に失敗しました");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "お知らせを更新しました" });
      queryClient.invalidateQueries({ queryKey: getGetNoticesQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["notice-detail", noticeId] });
      navigate(`/notices`);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const toggleDeleteExisting = (filename: string) => {
    setDeleteFiles(prev => prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]);
  };

  if (isEdit && detailLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/notices")}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            一覧へ
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="text-2xl font-black text-slate-900">{isEdit ? "お知らせの編集" : "お知らせの作成"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/notices")} disabled={isSaving}>キャンセル</Button>
          <Button
            onClick={() => isEdit ? updateMutation.mutate() : createMutation.mutate()}
            disabled={isSaving || !subject.trim() || !content.trim()}
          >
            {isSaving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />保存中...</> : <><Save className="w-4 h-4 mr-1" />{isEdit ? "更新を保存" : "登録する"}</>}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* 제목 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2">件名</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="お知らせの件名を入力してください"
            className="w-full h-11 px-4 border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-slate-50 focus:bg-white"
          />
        </div>

        {/* 본문 에디터 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2">内容</label>
          <NoticeEditor value={content} onChange={setContent} />
        </div>

        {/* 기존 첨부파일 (수정 모드) */}
        {isEdit && existingFiles.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">既存の添付ファイル</label>
            <div className="space-y-2">
              {existingFiles.map((file: any) => {
                const isImg = isImageFile(file);
                const willDelete = deleteFiles.includes(file.filename);
                return (
                  <div key={file.filename} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${willDelete ? "bg-red-50 border-red-200 opacity-60" : "bg-slate-50 border-slate-200"}`}>
                    {isImg ? (
                      <img src={getAuthFileUrl(file.url)} alt={file.originalname} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <span className={`flex-1 text-sm truncate ${willDelete ? "line-through text-slate-400" : "text-slate-700"}`}>{file.originalname}</span>
                    {file.size && <span className="text-xs text-slate-400 shrink-0">{formatFileSize(file.size)}</span>}
                    <button
                      type="button"
                      onClick={() => toggleDeleteExisting(file.filename)}
                      className={`shrink-0 p-1.5 rounded-lg transition-colors ${willDelete ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}
                      title={willDelete ? "削除を取り消す" : "削除"}
                    >
                      {willDelete ? <span className="text-xs font-bold">復元</span> : <X className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
            {deleteFiles.length > 0 && (
              <p className="text-xs text-red-500 mt-2">{deleteFiles.length}件のファイルは保存時に削除されます。</p>
            )}
          </div>
        )}

        {/* 새 파일 첨부 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-3">
            {isEdit ? "新しいファイルを追加" : "添付ファイル"} <span className="text-slate-400 font-normal">(最大5件、各20MB)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => {
              const selected = Array.from(e.target.files || []);
              setFiles(prev => [...prev, ...selected].slice(0, 5));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-slate-500 flex items-center justify-center gap-2"
          >
            <Paperclip className="w-4 h-4" /> クリックしてファイルを選択
          </button>
          {filePreviews.length > 0 && (
            <div className="mt-3 space-y-2">
              {filePreviews.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 border border-blue-200">
                  {p.isImg && p.url ? (
                    <img src={p.url} alt={p.file.name} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-blue-200" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                  )}
                  <span className="flex-1 text-sm text-slate-700 truncate">{p.file.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatFileSize(p.file.size)}</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="ghost" onClick={() => navigate("/notices")} disabled={isSaving}>キャンセル</Button>
          <Button
            onClick={() => isEdit ? updateMutation.mutate() : createMutation.mutate()}
            disabled={isSaving || !subject.trim() || !content.trim()}
            className="px-8"
          >
            {isSaving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />保存中...</> : <><Save className="w-4 h-4 mr-1" />{isEdit ? "更新を保存" : "登録する"}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
