import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, Badge, Button, Input, Label } from "../components/ui";
import { formatCurrency, cn } from "../lib/utils";
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, Package,
  Calculator, Box, ShoppingBag, Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image, Link as LinkIcon,
  Heading1, Heading2, Heading3, Code, Percent, Upload
} from "lucide-react";
import { toast } from "../hooks/use-toast";
import { useLocation } from "wouter";
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TiptapUnderline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { mergeAttributes, Node } from "@tiptap/core";

async function uploadEditorImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);
  try {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers["authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/editor-upload", { method: "POST", body: formData, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.error || "이미지 업로드에 실패했습니다";
      alert(msg);
      return null;
    }
    const data = await res.json();
    return data.url;
  } catch (err) {
    console.error("Image upload error:", err);
    alert("이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");
    return null;
  }
}

function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [resizing, setResizing] = useState(false);
  const startRef = useRef<{ x: number; w: number }>({ x: 0, w: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const imgEl = imgRef.current;
    if (!imgEl) return;
    setResizing(true);
    startRef.current = { x: e.clientX, w: imgEl.offsetWidth };
    const onMouseMove = (ev: MouseEvent) => {
      const newW = Math.max(50, startRef.current.w + (ev.clientX - startRef.current.x));
      updateAttributes({ width: newW });
    };
    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <NodeViewWrapper as="span" className="inline-block relative group" style={{ width: node.attrs.width ? `${node.attrs.width}px` : undefined }}>
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        style={{ width: node.attrs.width ? `${node.attrs.width}px` : "100%", display: "block", borderRadius: "0.5rem" }}
        className={cn("max-w-full", selected && "ring-2 ring-blue-400")}
        draggable={false}
      />
      <div
        onMouseDown={onMouseDown}
        className={cn(
          "absolute top-0 right-0 w-3 h-full cursor-ew-resize",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          resizing && "opacity-100"
        )}
        style={{ background: "linear-gradient(to left, rgba(59,130,246,0.3), transparent)" }}
      />
      <div
        onMouseDown={onMouseDown}
        className={cn(
          "absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-blue-400 rounded-tl-md rounded-br-md",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          resizing && "opacity-100"
        )}
      />
      {node.attrs.width && (
        <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {Math.round(node.attrs.width)}px
        </span>
      )}
    </NodeViewWrapper>
  );
}

const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, parseHTML: (el) => el.getAttribute("width") || el.style.width?.replace("px", "") || null, renderHTML: (attrs) => attrs.width ? { width: attrs.width, style: `width: ${attrs.width}px` } : {} },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

interface ProductOption {
  io_no: number;
  io_id: string;
  io_price: number;
  io_stock_qty: number;
  io_type: string;
  io_use: string;
  _key?: string;
  _discount?: number;
  _boxCount?: number;
}

function ProductImageUpload({ currentImage, productId, onUploaded, uploadedImage, slotNumber, onRemove }: {
  currentImage: string | null;
  productId: string;
  onUploaded: (url: string) => void;
  uploadedImage?: string;
  slotNumber?: number;
  onRemove?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayImage = uploadedImage === "__REMOVE__" ? null : (uploadedImage || currentImage);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const url = await uploadEditorImage(file);
    setUploading(false);
    if (url) {
      setImgError(false);
      onUploaded(url);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => fileRef.current?.click()}
      className={cn(
        "relative border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden aspect-square",
        dragging ? "border-blue-400 bg-blue-50" : displayImage && !imgError ? "border-slate-200" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50",
        uploading && "opacity-60 pointer-events-none",
        uploadedImage && "ring-2 ring-emerald-400"
      )}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {displayImage && !imgError ? (
        <div className="relative w-full h-full">
          <img src={displayImage} alt={`이미지 ${slotNumber}`} className="w-full h-full object-cover rounded-lg" onError={() => setImgError(true)} />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <span className="text-white font-bold text-xs bg-black/60 px-2 py-1 rounded">변경</span>
          </div>
          <span className="absolute top-1.5 left-1.5 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded font-bold">{slotNumber}</span>
          {onRemove && (
            <button onClick={handleRemove} className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 hover:opacity-100 transition-opacity" title="이미지 삭제">×</button>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-300">
          <Upload className="w-5 h-5" />
          <span className="text-[10px] font-bold">이미지 {slotNumber}</span>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
}

function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => customFetch<any>("/api/admin/categories"),
  });
}

function useAdminProductDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin-product-detail", id],
    queryFn: () => customFetch<any>(`/api/admin/products/${id}`),
    enabled: !!id && id !== "new",
  });
}

let keyCounter = 0;
function nextKey() { return `opt_${++keyCounter}_${Date.now()}`; }

function generateItemId() {
  return String(Date.now());
}

const emptyProduct = {
  it_id: "", it_name: "", it_price: 0, it_cust_price: 0,
  it_stock_qty: 0, ca_id: "", it_maker: "", it_origin: "",
  it_use: "1", it_notax: "0", it_shelf_life: "", it_order: 0, it_explan: "", it_sell_email: "",
};

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const url = await uploadEditorImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
    e.target.value = "";
  };


  const addLink = () => {
    const url = prompt("링크 URL을 입력하세요:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const btn = (active: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        active ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-200 bg-slate-50/50">
      {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold className="w-4 h-4" />, "굵게")}
      {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic className="w-4 h-4" />, "기울임")}
      {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon className="w-4 h-4" />, "밑줄")}
      <div className="w-px h-5 bg-slate-200 mx-1" />
      {btn(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 className="w-4 h-4" />, "제목1")}
      {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="w-4 h-4" />, "제목2")}
      {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="w-4 h-4" />, "제목3")}
      <div className="w-px h-5 bg-slate-200 mx-1" />
      {btn(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <AlignLeft className="w-4 h-4" />, "왼쪽")}
      {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <AlignCenter className="w-4 h-4" />, "가운데")}
      {btn(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), <AlignRight className="w-4 h-4" />, "오른쪽")}
      <div className="w-px h-5 bg-slate-200 mx-1" />
      {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List className="w-4 h-4" />, "목록")}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="w-4 h-4" />, "번호목록")}
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      {btn(false, addImage, <Upload className="w-4 h-4" />, "이미지 업로드 (드래그도 가능)")}
      {btn(editor.isActive("link"), addLink, <LinkIcon className="w-4 h-4" />, "링크")}
      {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), <Code className="w-4 h-4" />, "코드")}
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button
        type="button"
        onClick={() => {
          const html = prompt("HTML 소스를 입력하세요:", editor.getHTML());
          if (html !== null) editor.commands.setContent(html);
        }}
        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100"
        title="HTML 소스 편집"
      >
        HTML
      </button>
    </div>
  );
}

export default function AdminProductDetail({ params }: { params: { id: string } }) {
  const productId = params.id;
  const isNew = productId === "new";
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: catData } = useAdminCategories();
  const allCategories = (catData?.categories || []).filter((c: any) => String(c.ca_use) === "1");
  const level1Cats = allCategories.filter((c: any) => c.ca_id.length === 2);
  const level2Cats = allCategories.filter((c: any) => c.ca_id.length === 4);
  const level3Cats = allCategories.filter((c: any) => c.ca_id.length === 6);

  const [cat1, setCat1] = useState("");
  const [cat2, setCat2] = useState("");
  const [cat3, setCat3] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [catSearchOpen, setCatSearchOpen] = useState(false);
  const catSearchRef = useRef<HTMLDivElement>(null);

  const { data: productData, isLoading } = useAdminProductDetail(isNew ? null : productId);

  const [form, setForm] = useState<any>({ ...emptyProduct });
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [boxQty, setBoxQty] = useState<number>(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({ inline: true, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapUnderline,
      TextStyle,
      Color,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[250px] px-4 py-3 focus:outline-none",
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        files.forEach(async (file) => {
          const url = await uploadEditorImage(file);
          if (url) {
            const imgNode = view.state.schema.nodes.image;
            if (imgNode) {
              const node = imgNode.create({ src: url });
              const insertPos = pos?.pos ?? view.state.selection.head;
              view.dispatch(view.state.tr.insert(insertPos, node));
            }
          }
        });
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        const imageItems = Array.from(items).filter(i => i.type.startsWith("image/"));
        if (!imageItems.length) return false;
        event.preventDefault();
        imageItems.forEach(async (item) => {
          const file = item.getAsFile();
          if (!file) return;
          const url = await uploadEditorImage(file);
          if (url) {
            const imgNode = view.state.schema.nodes.image;
            if (imgNode) {
              const node = imgNode.create({ src: url });
              view.dispatch(view.state.tr.insert(view.state.selection.head, node));
            }
          }
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (isNew && !loaded) {
      setForm({ ...emptyProduct, it_id: generateItemId() });
      setOptions([]);
      setLoaded(true);
    } else if (productData && !loaded) {
      const caId = productData.ca_id || "";
      if (caId.length >= 2) setCat1(caId.substring(0, 2));
      if (caId.length >= 4) setCat2(caId.substring(0, 4));
      if (caId.length >= 6) setCat3(caId.substring(0, 6));
      setForm({
        it_id: productData.it_id,
        it_name: productData.it_name,
        it_price: productData.it_price,
        it_cust_price: productData.it_cust_price,
        it_stock_qty: productData.it_stock_qty,
        ca_id: productData.ca_id,
        it_maker: productData.it_maker,
        it_origin: productData.it_origin,
        it_use: productData.it_use,
        it_notax: productData.it_notax || "0",
        it_shelf_life: productData.it_shelf_life || "",
        it_order: productData.it_order,
        it_explan: productData.it_explan,
        it_sell_email: productData.it_sell_email || "",
      });
      if (editor && productData.it_explan) {
        editor.commands.setContent(productData.it_explan);
      }
      const loadedCustPrice = Number(productData.it_cust_price) || 0;
      const loadedBasePrice = Number(productData.it_price) || 0;

      let detectedBoxQty = Number(productData.box_qty) || 0;
      if (!detectedBoxQty) {
        const firstBox = (productData.options || []).find((o: any) => o.io_id.includes("박스"));
        if (firstBox) {
          const m = firstBox.io_id.match(/(\d+)개입/);
          if (m) detectedBoxQty = Number(m[1]);
        }
      }

      const opts = (productData.options || []).map((o: any) => {
        const isBox = o.io_id.includes("박스");
        let bc = 1;
        if (isBox) {
          const bm = o.io_id.match(/^(\d+)박스/);
          if (bm) bc = Number(bm[1]);
          if (bc <= 0) bc = 1;
        }
        const finalP = loadedBasePrice + (Number(o.io_price) || 0);
        const totalBase = isBox ? loadedBasePrice * detectedBoxQty * bc : loadedBasePrice;
        const disc = totalBase > 0 && isBox
          ? Math.round((1 - finalP / totalBase) * 100 * 10) / 10
          : (loadedCustPrice > 0 ? Math.round((1 - finalP / loadedCustPrice) * 100 * 10) / 10 : 0);
        return { ...o, _key: nextKey(), _discount: disc > 0 ? disc : 0, _boxCount: isBox ? bc : undefined };
      });
      setOptions(opts);

      if (detectedBoxQty > 0) {
        setBoxQty(detectedBoxQty);
      } else {
        const singleBoxOpt = (productData.options || []).find((o: any) => o.io_id.includes("박스"));
        if (singleBoxOpt) {
          const m2 = singleBoxOpt.io_id.match(/(\d+)개입/);
          if (m2) setBoxQty(Number(m2[1]));
        }
      }

      setLoaded(true);
    }
  }, [productData, isNew, loaded, editor]);

  useEffect(() => {
    if (editor && productData?.it_explan && loaded) {
      const currentHtml = editor.getHTML();
      if (currentHtml === "<p></p>" && productData.it_explan) {
        editor.commands.setContent(productData.it_explan);
      }
    }
  }, [editor, productData, loaded]);

  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isNew) {
        return customFetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      return customFetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: async () => {
      const targetId = isNew ? form.it_id : productId;
      await customFetch(`/api/admin/products/${targetId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          options: options.map((o) => ({
            io_id: o.io_id,
            io_price: o.io_price,
            io_stock_qty: o.io_stock_qty,
            io_type: o.io_type,
            io_use: o.io_use,
          })),
        }),
      });
      toast({ title: isNew ? "상품이 등록되었습니다" : "상품이 수정되었습니다" });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-detail"] });
      navigate("/admin/products");
    },
    onError: (err: any) => {
      toast({ title: "저장 실패", description: err?.message || "오류가 발생했습니다", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!form.it_name) { toast({ title: "상품명을 입력해주세요", variant: "destructive" }); return; }
    let itId = form.it_id;
    if (isNew && !itId) { itId = generateItemId(); update("it_id", itId); }
    const hasBoxOpt = options.some(o => o.io_id.includes("박스"));
    if (hasBoxOpt && boxQty <= 0) {
      toast({ title: "1박스 입수량을 입력해주세요", description: "박스 옵션이 있으면 입수량이 필수입니다.", variant: "destructive" });
      return;
    }
    const editorHtml = editor?.getHTML() || "";
    saveMutation.mutate({ ...form, it_id: itId, it_explan: editorHtml, box_qty: boxQty });
  };

  const addOption = (type: "box" | "piece" | "custom") => {
    if (type === "box" && boxQty <= 0) {
      toast({ title: "1박스 입수량을 먼저 입력해주세요", variant: "destructive" });
      return;
    }
    let newOpt: ProductOption;
    if (type === "box") {
      const bc = 1;
      const label = `${bc}박스(${bc * boxQty}개입)`;
      newOpt = { io_no: 0, io_id: label, io_price: 0, io_stock_qty: 0, io_type: "0", io_use: "1", _key: nextKey(), _discount: 0, _boxCount: bc };
    } else if (type === "piece") {
      newOpt = { io_no: 0, io_id: "낱개", io_price: 0, io_stock_qty: 0, io_type: "0", io_use: "1", _key: nextKey(), _discount: 0 };
    } else {
      newOpt = { io_no: 0, io_id: "", io_price: 0, io_stock_qty: 0, io_type: "0", io_use: "1", _key: nextKey(), _discount: 0 };
    }
    setOptions((prev) => [...prev, newOpt]);
  };

  const updateOption = (key: string, field: string, value: any) => {
    setOptions((prev) => prev.map((o) => o._key === key ? { ...o, [field]: value } : o));
  };

  const removeOption = (key: string) => {
    setOptions((prev) => prev.filter((o) => o._key !== key));
  };

  const applyDiscount = useCallback((key: string, discountPercent: number) => {
    setOptions((prev) => prev.map((o) => {
      if (o._key !== key) return o;
      const bp = Number(form.it_price) || 0;
      const isBox = o.io_id.includes("박스");
      if (isBox) {
        const bc = o._boxCount || 1;
        const totalBase = bp * boxQty * bc;
        const discountedTotal = Math.round(totalBase * (1 - discountPercent / 100));
        const addPrice = discountedTotal - bp;
        return { ...o, io_price: addPrice, _discount: discountPercent };
      } else {
        const cp = Number(form.it_cust_price) || 0;
        if (cp <= 0) return o;
        const discountedTotal = Math.round(cp * (1 - discountPercent / 100));
        const addPrice = discountedTotal - bp;
        return { ...o, io_price: addPrice, _discount: discountPercent };
      }
    }));
  }, [form.it_cust_price, form.it_price]);

  const updateBoxQtyLabels = useCallback((qty: number) => {
    setBoxQty(qty);
    if (qty > 0) {
      setOptions((prev) => prev.map((o) => {
        if (o.io_id.includes("박스")) {
          const bc = o._boxCount || 1;
          return { ...o, io_id: `${bc}박스(${bc * qty}개입)` };
        }
        return o;
      }));
    }
  }, []);

  if (!isNew && isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  const getCatPath = (cat: any): string => {
    if (!cat) return "";
    if (cat.ca_id.length === 2) return cat.ca_name;
    if (cat.ca_id.length === 4) {
      const p1 = allCategories.find((c: any) => c.ca_id === cat.ca_id.substring(0, 2));
      return `${p1?.ca_name || ""} > ${cat.ca_name}`;
    }
    const p1 = allCategories.find((c: any) => c.ca_id === cat.ca_id.substring(0, 2));
    const p2 = allCategories.find((c: any) => c.ca_id === cat.ca_id.substring(0, 4));
    return `${p1?.ca_name || ""} > ${p2?.ca_name || ""} > ${cat.ca_name}`;
  };

  const selectCategory = (cat: any) => {
    const caId = cat.ca_id;
    setCat1(caId.length >= 2 ? caId.substring(0, 2) : "");
    setCat2(caId.length >= 4 ? caId.substring(0, 4) : "");
    setCat3(caId.length >= 6 ? caId.substring(0, 6) : "");
    update("ca_id", caId);
    setCatSearch("");
    setCatSearchOpen(false);
  };

  const filteredCats = catSearch.trim()
    ? allCategories.filter((c: any) => getCatPath(c).toLowerCase().includes(catSearch.toLowerCase()))
    : allCategories;

  const selectedCatObj = allCategories.find((c: any) => c.ca_id === form.ca_id);

  const basePrice = Number(form.it_price) || 0;
  const custPrice = Number(form.it_cust_price) || 0;
  const boxOpt1 = options.find(o => o.io_id.includes("박스") && (o._boxCount || 1) === 1 && o.io_use === "1");
  const boxFinalPrice = boxOpt1 ? basePrice + (Number(boxOpt1.io_price) || 0) : null;
  const unitPricePerItem = boxFinalPrice && boxQty > 0 ? Math.round(boxFinalPrice / boxQty) : null;

  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/admin/products")} className="text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isNew ? "상품 등록" : "상품 수정"}
          </h1>
          {!isNew && (
            <p className="text-sm text-slate-500 mt-0.5">상품코드: <span className="font-mono font-bold">{productId}</span></p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="h-11 px-6">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saveMutation.isPending ? "저장 중..." : "저장"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3 space-y-3">
          <Card className="p-4 space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> 기본 정보
            </h2>

            {isNew && (
              <div>
                <Label>상품코드</Label>
                <Input value={form.it_id} readOnly className="bg-slate-50 text-slate-500 cursor-default" />
                <p className="text-xs text-slate-400 mt-1">자동 생성됩니다</p>
              </div>
            )}

            <div>
              <Label>상품명 *</Label>
              <Input value={form.it_name} onChange={(e: any) => update("it_name", e.target.value)} placeholder="상품명을 입력하세요" className="text-base" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>카테고리</Label>
                {/* 검색창 */}
                <div className="relative mb-2" ref={catSearchRef}>
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-xl bg-white border-2 border-border text-sm focus:outline-none focus:border-primary transition-all"
                    placeholder={selectedCatObj ? getCatPath(selectedCatObj) : "카테고리 검색..."}
                    value={catSearch}
                    onFocus={() => setCatSearchOpen(true)}
                    onChange={(e) => { setCatSearch(e.target.value); setCatSearchOpen(true); }}
                    onBlur={() => setTimeout(() => setCatSearchOpen(false), 150)}
                  />
                  {catSearchOpen && (
                    <div className="absolute z-50 w-full bg-white border-2 border-primary rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                      {filteredCats.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-400">검색 결과 없음</div>
                      ) : filteredCats.map((cat: any) => (
                        <button
                          key={cat.ca_id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${cat.ca_id === form.ca_id ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-slate-50"}`}
                          onMouseDown={() => selectCategory(cat)}
                        >
                          {getCatPath(cat)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* 기존 단계별 select (보조용) */}
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-9 px-2 rounded-lg bg-white border border-border text-xs focus:outline-none focus:border-primary transition-all text-slate-500"
                    value={cat1}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCat1(v);
                      setCat2("");
                      setCat3("");
                      update("ca_id", v);
                    }}
                  >
                    <option value="">1차 선택</option>
                    {level1Cats.map((c: any) => (
                      <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>
                    ))}
                  </select>
                  <select
                    className="flex-1 h-9 px-2 rounded-lg bg-white border border-border text-xs focus:outline-none focus:border-primary transition-all disabled:bg-slate-50 disabled:text-slate-300 text-slate-500"
                    value={cat2}
                    disabled={!cat1}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCat2(v);
                      setCat3("");
                      update("ca_id", v || cat1);
                    }}
                  >
                    <option value="">2차 선택</option>
                    {level2Cats.filter((c: any) => c.ca_id.startsWith(cat1)).map((c: any) => (
                      <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>
                    ))}
                  </select>
                  <select
                    className="flex-1 h-9 px-2 rounded-lg bg-white border border-border text-xs focus:outline-none focus:border-primary transition-all disabled:bg-slate-50 disabled:text-slate-300 text-slate-500"
                    value={cat3}
                    disabled={!cat2}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCat3(v);
                      update("ca_id", v || cat2);
                    }}
                  >
                    <option value="">3차 선택</option>
                    {level3Cats.filter((c: any) => c.ca_id.startsWith(cat2)).map((c: any) => (
                      <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>판매상태</Label>
                <select
                  className="w-full h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
                  value={form.it_use}
                  onChange={(e) => update("it_use", e.target.value)}
                >
                  <option value="1">판매중</option>
                  <option value="0">판매중지</option>
                </select>
              </div>
              <div>
                <Label>과세구분</Label>
                <select
                  className="w-full h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
                  value={form.it_notax}
                  onChange={(e) => update("it_notax", e.target.value)}
                >
                  <option value="0">과세</option>
                  <option value="1">면세</option>
                </select>
              </div>
              <div>
                <Label>유통기한</Label>
                <Input
                  value={form.it_shelf_life}
                  onChange={(e: any) => update("it_shelf_life", e.target.value)}
                  placeholder="예: 2025-12-31, 6개월, 1년"
                />
              </div>
            </div>

            <div>
              <Label>상품 이미지 (1~10)</Label>
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-2 mt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <ProductImageUpload
                    key={n}
                    slotNumber={n}
                    currentImage={productData?.[`it_img${n}`] || null}
                    productId={productId || ""}
                    onUploaded={(url) => update(`it_img${n}_uploaded`, url)}
                    uploadedImage={form[`it_img${n}_uploaded`]}
                    onRemove={() => update(`it_img${n}_uploaded`, "__REMOVE__")}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>상품 상세설명</Label>
              <div className="border-2 border-border rounded-xl overflow-hidden bg-white focus-within:border-primary transition-all">
                <EditorToolbar editor={editor} />
                <EditorContent editor={editor} />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> 옵션 관리
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addOption("box")} className="h-8">
                  <Box className="w-3.5 h-3.5 mr-1" /> 박스 옵션
                </Button>
                <Button variant="outline" size="sm" onClick={() => addOption("piece")} className="h-8">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1" /> 낱개 옵션
                </Button>
                <Button variant="outline" size="sm" onClick={() => addOption("custom")} className="h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> 기타 옵션
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Box className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">박스 포장 설정</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-amber-700 font-medium whitespace-nowrap">1박스 입수량</label>
                <Input
                  type="number"
                  value={boxQty || ""}
                  onChange={(e: any) => updateBoxQtyLabels(Number(e.target.value) || 0)}
                  placeholder="예: 24"
                  className="w-24 text-center font-bold"
                />
                <span className="text-sm text-amber-600">개</span>
                {boxQty > 0 && <span className="text-xs text-amber-500 ml-2">박스 옵션에 자동 반영됩니다</span>}
              </div>
            </div>

            {boxQty > 0 && unitPricePerItem && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs text-emerald-600">낱개 단가</span>
                    <p className="text-lg font-black">{formatCurrency(unitPricePerItem)}</p>
                  </div>
                  <span className="text-emerald-300">=</span>
                  <div>
                    <span className="text-xs text-emerald-600">1박스 가격</span>
                    <p className="font-bold">{formatCurrency(boxFinalPrice!)}</p>
                  </div>
                  <span className="text-emerald-300">÷</span>
                  <div>
                    <span className="text-xs text-emerald-600">입수량</span>
                    <p className="font-bold">{boxQty}개</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
              <p className="font-bold">자동 계산 안내</p>
              <p>• <strong>박스 옵션</strong>: 할인율(%) 입력 시 → 박스당 가격 = 판매가 × (1 - 할인율%)</p>
              <p>• 예) 10박스, 10% 할인 → 박스당 {formatCurrency(Math.round(basePrice * 0.9))}, 합계 {formatCurrency(Math.round(basePrice * 10 * 0.9))}</p>
              <p>• <strong>낱개/기타 옵션</strong>: 할인율은 소비자가({formatCurrency(custPrice)}) 기준으로 계산됩니다.</p>
            </div>

            {options.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-bold">등록된 옵션이 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">위 버튼으로 박스/낱개/기타 옵션을 추가하세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((opt, idx) => {
                  const finalPrice = basePrice + (Number(opt.io_price) || 0);
                  const isBox = opt.io_id.includes("박스");
                  const isPiece = opt.io_id.includes("낱개");
                  const bc = opt._boxCount || 1;
                  const totalBase = isBox ? basePrice * boxQty * bc : 0;
                  const effectiveDiscount = isBox && totalBase > 0
                    ? Math.round((1 - finalPrice / totalBase) * 100 * 10) / 10
                    : (custPrice > 0 ? Math.round((1 - finalPrice / custPrice) * 100 * 10) / 10 : 0);
                  return (
                    <div key={opt._key} className={cn(
                      "border-2 rounded-xl p-4 transition-all",
                      isBox ? "border-orange-200 bg-orange-50/30" :
                      isPiece ? "border-green-200 bg-green-50/30" :
                      "border-slate-200 bg-white"
                    )}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                        {isBox && <Badge className="bg-orange-100 text-orange-700 text-[10px]">박스</Badge>}
                        {isPiece && <Badge className="bg-green-100 text-green-700 text-[10px]">낱개</Badge>}
                        {!isBox && !isPiece && <Badge className="bg-slate-100 text-slate-600 text-[10px]">기타</Badge>}
                        <div className="flex-1" />
                        <div className="flex items-center gap-1.5">
                          <label className="flex items-center gap-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={opt.io_use === "1"}
                              onChange={(e) => updateOption(opt._key!, "io_use", e.target.checked ? "1" : "0")}
                              className="rounded"
                            />
                            <span className="text-slate-500">사용</span>
                          </label>
                          <button onClick={() => removeOption(opt._key!)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className={cn(
                        "rounded-lg px-4 py-3 mb-3",
                        isBox ? "bg-orange-100/70" : isPiece ? "bg-green-100/70" : "bg-slate-100/70"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-600">최종 판매가 (합계)</span>
                          <div className="flex items-center gap-3">
                            {isBox && effectiveDiscount > 0 && (
                              <span className="text-sm text-red-500 font-bold">{effectiveDiscount}% 할인</span>
                            )}
                            {!isBox && custPrice > 0 && effectiveDiscount > 0 && (
                              <span className="text-sm text-red-500 font-bold">소비자가 대비 {effectiveDiscount}% 할인</span>
                            )}
                            <span className={cn(
                              "text-2xl font-black tracking-tight",
                              isBox ? "text-orange-700" : isPiece ? "text-green-700" : "text-slate-900"
                            )}>
                              {formatCurrency(finalPrice)}
                            </span>
                          </div>
                        </div>
                        {isBox && bc > 0 && (
                          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-orange-200/50">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500">박스당</span>
                              <span className="text-sm font-black text-orange-700">{formatCurrency(Math.round(finalPrice / bc))}</span>
                            </div>
                            {boxQty > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">낱개</span>
                                <span className="text-sm font-bold text-slate-700">{formatCurrency(Math.round(finalPrice / (bc * boxQty)))}</span>
                              </div>
                            )}
                            {boxQty > 0 && (
                              <span className="text-xs text-slate-400">총 {bc * boxQty}개</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={cn("grid gap-3", isBox ? "grid-cols-5" : "grid-cols-4")}>
                        {isBox && (
                          <div>
                            <label className="text-xs text-slate-500 font-bold mb-1 block">박스 수량</label>
                            <Input
                              type="number"
                              value={bc}
                              onChange={(e: any) => {
                                const newBc = Math.max(1, Number(e.target.value) || 1);
                                const newLabel = `${newBc}박스(${newBc * boxQty}개입)`;
                                const disc = opt._discount || 0;
                                let newIoPrice: number;
                                if (disc > 0) {
                                  const newTotal = basePrice * boxQty * newBc;
                                  newIoPrice = Math.round(newTotal * (1 - disc / 100)) - basePrice;
                                } else {
                                  newIoPrice = basePrice * (newBc - 1);
                                }
                                setOptions((prev) => prev.map((o) =>
                                  o._key === opt._key ? { ...o, _boxCount: newBc, io_id: newLabel, io_price: newIoPrice } : o
                                ));
                              }}
                              min={1}
                              className="font-bold"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-slate-500 font-bold mb-1 block">옵션명</label>
                          <Input
                            value={opt.io_id}
                            onChange={(e: any) => updateOption(opt._key!, "io_id", e.target.value)}
                            placeholder={isBox ? "예: 1박스(24개입)" : "예: 낱개"}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold mb-1 block">
                            <span className="flex items-center gap-1">할인율 <Percent className="w-3 h-3" /></span>
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={opt._discount || ""}
                              onChange={(e: any) => {
                                const pct = Number(e.target.value) || 0;
                                updateOption(opt._key!, "_discount", pct);
                                applyDiscount(opt._key!, pct);
                              }}
                              placeholder="0"
                              className="pr-6"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold mb-1 block">추가금 (원)</label>
                          <Input
                            type="number"
                            value={opt.io_price}
                            onChange={(e: any) => {
                              const price = Number(e.target.value);
                              updateOption(opt._key!, "io_price", price);
                              if (isBox) {
                                const tb = basePrice * boxQty * bc;
                                const fp = basePrice + price;
                                const pct = tb > 0 ? Math.round((1 - fp / tb) * 100 * 10) / 10 : 0;
                                updateOption(opt._key!, "_discount", pct > 0 ? pct : 0);
                              } else if (custPrice > 0) {
                                const fp = basePrice + price;
                                const pct = Math.round((1 - fp / custPrice) * 100 * 10) / 10;
                                updateOption(opt._key!, "_discount", pct > 0 ? pct : 0);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold mb-1 block">재고수량</label>
                          <Input
                            type="number"
                            value={opt.io_stock_qty}
                            onChange={(e: any) => updateOption(opt._key!, "io_stock_qty", Number(e.target.value))}
                          />
                        </div>
                      </div>
                      {false && isBox && bc > 1 && boxQty > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          총 {bc * boxQty}개 | 낱개 단가 {formatCurrency(Math.round(finalPrice / (bc * boxQty)))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="p-4 space-y-3">
            <h2 className="text-base font-black text-slate-900">가격 정보</h2>
            <div>
              <Label>소비자가 (원)</Label>
              <Input type="number" value={form.it_cust_price} onChange={(e: any) => update("it_cust_price", Number(e.target.value))} />
              <p className="text-xs text-slate-400 mt-1">할인율 계산의 기준이 됩니다</p>
            </div>
            <div>
              <Label>판매가 (원) *</Label>
              <Input type="number" value={form.it_price} onChange={(e: any) => update("it_price", Number(e.target.value))} className="font-bold text-lg" />
              <p className="text-xs text-slate-400 mt-1">옵션 최종가의 기준이 됩니다</p>
            </div>
            <div>
              <Label>재고수량</Label>
              <Input type="number" value={form.it_stock_qty} onChange={(e: any) => update("it_stock_qty", Number(e.target.value))} />
            </div>

            {unitPricePerItem && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">낱개 단가</p>
                <p className="text-lg font-black text-emerald-600">{formatCurrency(unitPricePerItem)}</p>
                <p className="text-[10px] text-slate-400">{formatCurrency(boxFinalPrice!)} ÷ {boxQty}개</p>
              </div>
            )}

            {options.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500">옵션별 가격 요약</p>
                {options.filter(o => o.io_use === "1").map((opt) => {
                  const fp = basePrice + (Number(opt.io_price) || 0);
                  const isBox = opt.io_id.includes("박스");
                  const bc = opt._boxCount || 1;
                  return (
                    <div key={opt._key} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 truncate max-w-[100px]">{opt.io_id || "(이름없음)"}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(fp)}</span>
                      </div>
                      {isBox && bc > 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>박스당 {formatCurrency(Math.round(fp / bc))}</span>
                          {boxQty > 0 && <span>낱개 {formatCurrency(Math.round(fp / (bc * boxQty)))}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="text-base font-black text-slate-900">부가 정보</h2>
            <div>
              <Label>제조사</Label>
              <Input value={form.it_maker} onChange={(e: any) => update("it_maker", e.target.value)} placeholder="제조사" />
            </div>
            <div>
              <Label>원산지</Label>
              <Input value={form.it_origin} onChange={(e: any) => update("it_origin", e.target.value)} placeholder="원산지" />
            </div>
            <div>
              <Label>정렬순서</Label>
              <Input type="number" value={form.it_order} onChange={(e: any) => update("it_order", Number(e.target.value))} />
              <p className="text-xs text-slate-400 mt-1">숫자가 작을수록 앞에 표시</p>
            </div>
            <div>
              <Label>판매자 이메일</Label>
              <Input value={form.it_sell_email} onChange={(e: any) => update("it_sell_email", e.target.value)} placeholder="이메일 주소" />
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 pb-8">
        <Button variant="ghost" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 목록으로
        </Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="h-11 px-8">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saveMutation.isPending ? "저장 중..." : isNew ? "상품 등록" : "변경사항 저장"}
        </Button>
      </div>
    </div>
  );
}
