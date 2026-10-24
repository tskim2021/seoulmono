import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label, Card } from "../components/ui";
import { ArrowLeft, CheckCircle2, Upload, FileText, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const schema = z.object({
  mb_id: z.string().min(4, "4자 이상 입력해주세요"),
  mb_password: z.string().min(6, "6자 이상 입력해주세요"),
  password_confirm: z.string(),
  mb_name: z.string().min(2, "담당자명을 입력해주세요"),
  mb_email: z.string().email("올바른 이메일 형식이 아닙니다"),
  mb_hp: z.string().min(10, "연락처를 입력해주세요"),
  company_name: z.string().min(1, "상호명을 입력해주세요"),
  business_number: z.string().min(10, "사업자등록번호를 입력해주세요"),
  representative: z.string().min(2, "대표자명을 입력해주세요"),
  business_type: z.string().optional(),
  business_category: z.string().optional(),
  company_address: z.string().min(5, "사업장 주소를 입력해주세요"),
}).refine((data) => data.mb_password === data.password_confirm, {
  message: "비밀번호가 일치하지 않습니다",
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
      setFileError("파일 크기는 10MB 이하만 가능합니다.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "webp"];
    if (!ext || !allowed.includes(ext)) {
      setFileError("PDF, JPG, PNG 파일만 업로드 가능합니다.");
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
      setFileError("사업자등록증을 첨부해주세요.");
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
        throw new Error(err.error || "가입 신청 중 오류가 발생했습니다.");
      }

      setSuccess(true);
    } catch (err: any) {
      alert(err.message || "가입 신청 중 오류가 발생했습니다.");
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">가입 신청 완료</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            파트너사 가입 신청이 성공적으로 접수되었습니다.<br/>
            사업자등록증 확인 후 관리자가 승인하면<br/>
            로그인하여 이용하실 수 있습니다.
          </p>
          <Link href="/login" className="block">
            <Button size="lg" className="w-full">로그인 페이지로 돌아가기</Button>
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
          돌아가기
        </Link>
        
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">파트너사 가입 신청</h1>
          <p className="text-slate-500 text-lg">사업자 정보를 정확하게 입력해 주시기 바랍니다.</p>
        </div>

        <Card className="p-8 md:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">1</span>
                계정 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label required>아이디</Label>
                  <Input {...register("mb_id")} error={errors.mb_id?.message} placeholder="영문/숫자 조합" />
                </div>
                <div className="hidden md:block"></div>
                <div>
                  <Label required>비밀번호</Label>
                  <Input type="password" {...register("mb_password")} error={errors.mb_password?.message} />
                </div>
                <div>
                  <Label required>비밀번호 확인</Label>
                  <Input type="password" {...register("password_confirm")} error={errors.password_confirm?.message} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200"></div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">2</span>
                사업자 및 담당자 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label required>상호명 (법인명)</Label>
                  <Input {...register("company_name")} error={errors.company_name?.message} />
                </div>
                <div>
                  <Label required>사업자등록번호</Label>
                  <Input {...register("business_number")} error={errors.business_number?.message} placeholder="123-45-67890" />
                </div>
                <div>
                  <Label required>대표자명</Label>
                  <Input {...register("representative")} error={errors.representative?.message} />
                </div>
                <div>
                  <Label>업태</Label>
                  <Input {...register("business_type")} error={errors.business_type?.message} />
                </div>
                <div>
                  <Label>종목</Label>
                  <Input {...register("business_category")} error={errors.business_category?.message} />
                </div>
                <div className="md:col-span-2">
                  <Label required>사업장 주소</Label>
                  <Input {...register("company_address")} error={errors.company_address?.message} />
                </div>
                
                <div>
                  <Label required>담당자명</Label>
                  <Input {...register("mb_name")} error={errors.mb_name?.message} />
                </div>
                <div>
                  <Label required>담당자 연락처</Label>
                  <Input {...register("mb_hp")} error={errors.mb_hp?.message} placeholder="010-0000-0000" />
                </div>
                <div className="md:col-span-2">
                  <Label required>담당자 이메일</Label>
                  <Input type="email" {...register("mb_email")} error={errors.mb_email?.message} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200"></div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">3</span>
                사업자등록증 첨부
              </h3>
              <p className="text-sm text-slate-500 mb-4">사업자등록증 사본을 첨부해주세요. (PDF, JPG, PNG / 최대 10MB)</p>
              
              {!licenseFile ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all">
                  <Upload className="w-10 h-10 text-slate-400 mb-3" />
                  <span className="text-sm font-semibold text-slate-600">파일을 선택하거나 드래그하세요</span>
                  <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (최대 10MB)</span>
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
                {isPending ? "신청 처리 중..." : "가입 신청하기"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
