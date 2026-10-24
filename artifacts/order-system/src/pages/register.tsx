import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label, Card } from "../components/ui";
import { ArrowLeft, CheckCircle2, Upload, FileText, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const schema = z.object({
  mb_id: z.string().min(4, "4文字以上で入力してください"),
  mb_password: z.string().min(6, "6文字以上で入力してください"),
  password_confirm: z.string(),
  mb_name: z.string().min(2, "担当者名を入力してください"),
  mb_email: z.string().email("メールアドレスの形式が正しくありません"),
  mb_hp: z.string().min(10, "連絡先を入力してください"),
  company_name: z.string().min(1, "会社名を入力してください"),
  business_number: z.string().min(10, "事業者登録番号を入力してください"),
  representative: z.string().min(2, "代表者名を入力してください"),
  business_type: z.string().optional(),
  business_category: z.string().optional(),
  company_address: z.string().min(5, "事業所の住所を入力してください"),
}).refine((data) => data.mb_password === data.password_confirm, {
  message: "パスワードが一致しません",
  path: ["password_confirm"],
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError("ファイルサイズは10MB以下にしてください。");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "webp"];
    if (!ext || !allowed.includes(ext)) {
      setFileError("PDF、JPG、PNGファイルのみアップロードできます。");
      return;
    }

    setFileError("");
    setLicenseFile(file);
  };

  const removeFile = () => {
    setLicenseFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: FormValues) => {
    if (!licenseFile) {
      setFileError("事業者登録証を添付してください。");
      return;
    }

    setIsPending(true);
    try {
      const formData = new FormData();
      const { password_confirm, ...submitData } = data;
      Object.entries(submitData).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
      });
      formData.append("business_license", licenseFile);

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "登録申請中にエラーが発生しました。");
      }

      setSuccess(true);
    } catch (err: any) {
      alert(err.message || "登録申請中にエラーが発生しました。");
    } finally {
      setIsPending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">登録申請が完了しました</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            取引先の登録申請を受け付けました。<br/>
            事業者登録証の確認後、管理者が承認すると<br/>
            ログインしてご利用いただけます。
          </p>
          <Link href="/login" className="block">
            <Button size="lg" className="w-full">ログインページに戻る</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/login" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </Link>
        
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">取引先 登録申請</h1>
          <p className="text-slate-500 text-lg">事業者情報を正確にご入力ください。</p>
        </div>

        <Card className="p-8 md:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">1</span>
                アカウント情報
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label required>ID</Label>
                  <Input {...register("mb_id")} error={errors.mb_id?.message} placeholder="英数字の組み合わせ" />
                </div>
                <div className="hidden md:block"></div>
                <div>
                  <Label required>パスワード</Label>
                  <Input type="password" {...register("mb_password")} error={errors.mb_password?.message} />
                </div>
                <div>
                  <Label required>パスワード（確認）</Label>
                  <Input type="password" {...register("password_confirm")} error={errors.password_confirm?.message} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200"></div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">2</span>
                事業者・担当者情報
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label required>会社名（法人名）</Label>
                  <Input {...register("company_name")} error={errors.company_name?.message} />
                </div>
                <div>
                  <Label required>事業者登録番号</Label>
                  <Input {...register("business_number")} error={errors.business_number?.message} placeholder="123-45-67890" />
                </div>
                <div>
                  <Label required>代表者名</Label>
                  <Input {...register("representative")} error={errors.representative?.message} />
                </div>
                <div>
                  <Label>業態</Label>
                  <Input {...register("business_type")} error={errors.business_type?.message} />
                </div>
                <div>
                  <Label>業種</Label>
                  <Input {...register("business_category")} error={errors.business_category?.message} />
                </div>
                <div className="md:col-span-2">
                  <Label required>事業所の住所</Label>
                  <Input {...register("company_address")} error={errors.company_address?.message} />
                </div>
                
                <div>
                  <Label required>担当者名</Label>
                  <Input {...register("mb_name")} error={errors.mb_name?.message} />
                </div>
                <div>
                  <Label required>担当者の連絡先</Label>
                  <Input {...register("mb_hp")} error={errors.mb_hp?.message} placeholder="010-0000-0000" />
                </div>
                <div className="md:col-span-2">
                  <Label required>担当者のメールアドレス</Label>
                  <Input type="email" {...register("mb_email")} error={errors.mb_email?.message} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200"></div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">3</span>
                事業者登録証の添付
              </h3>
              <p className="text-sm text-slate-500 mb-4">事業者登録証のコピーを添付してください。(PDF、JPG、PNG / 最大10MB)</p>
              
              {!licenseFile ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all">
                  <Upload className="w-10 h-10 text-slate-400 mb-3" />
                  <span className="text-sm font-semibold text-slate-600">ファイルを選択するかドラッグしてください</span>
                  <span className="text-xs text-slate-400 mt-1">PDF、JPG、PNG (最大10MB)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{licenseFile.name}</p>
                      <p className="text-xs text-slate-500">{(licenseFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={removeFile} className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
              {fileError && <p className="text-sm text-red-500 mt-2">{fileError}</p>}
            </div>

            <div className="pt-6">
              <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={isPending}>
                {isPending ? "申請処理中..." : "登録を申請する"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
