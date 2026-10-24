import { useState, useCallback, useEffect } from "react";
import DaumPostcodeEmbed from "react-daum-postcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Search, Globe, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export interface AddressData {
  zipCode: string;
  address1: string;       // 한글 기본주소 (도로명)
  address2: string;       // 상세주소 (사용자 입력)
  addressEn1: string;     // 영문 기본주소
  addressEn2: string;     // 영문 상세주소 (사용자 입력)
  sido: string;
  sigungu: string;
  bname: string;
  buildingName: string;
}

interface KoreanAddressSearchProps {
  value?: Partial<AddressData>;
  onChange: (data: AddressData) => void;
  showEnglishPreview?: boolean;  // 영문 주소 미리보기 표시 여부
  compact?: boolean;             // 컴팩트 모드 (주문서용)
  className?: string;
}

export default function KoreanAddressSearch({
  value,
  onChange,
  showEnglishPreview = true,
  compact = false,
  className = "",
}: KoreanAddressSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEnglish, setShowEnglish] = useState(true);  // 기본으로 영문 주소 필드 표시
  const [detail, setDetail] = useState(value?.address2 ?? "");
  const [detailEn, setDetailEn] = useState(value?.addressEn2 ?? "");

  // 외부 value가 바뀌면 (저장된 주소 불러오기 등) 내부 state 동기화
  useEffect(() => {
    setDetail(value?.address2 ?? "");
    setDetailEn(value?.addressEn2 ?? "");
  }, [value?.address2, value?.addressEn2]);
  const [isTranslating, setIsTranslating] = useState(false);
  const translateMut = trpc.address.translateToEnglish.useMutation();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleComplete = useCallback((data: any) => {
    // 도로명 주소 우선, 없으면 지번 주소
    const korAddress = data.roadAddress || data.jibunAddress || data.address;
    const engAddress = data.roadAddressEnglish || data.jibunAddressEnglish || data.addressEnglish;

    // 건물명이 있으면 한글 주소에 추가
    let extraAddress = "";
    if (data.bname) extraAddress += data.bname;
    if (data.buildingName) {
      extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
    }
    const fullKorAddress = extraAddress ? `${korAddress} (${extraAddress})` : korAddress;

    const newData: AddressData = {
      zipCode: data.zonecode,
      address1: fullKorAddress,
      address2: detail,
      addressEn1: engAddress,
      addressEn2: detailEn,
      sido: data.sido,
      sigungu: data.sigungu,
      bname: data.bname,
      buildingName: data.buildingName || "",
    };

    onChange(newData);
    setIsOpen(false);
    // 영문 주소 자동 표시
    if (showEnglishPreview) setShowEnglish(true);
  }, [detail, detailEn, onChange, showEnglishPreview]);

  const handleDetailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDetail(val);
    if (value?.address1) {
      onChange({ ...value as AddressData, address2: val });
    }
    
    // 자동 번역: 입력 멈춘 후 1초 뒤에 번역 시작
    if (debounceTimer) clearTimeout(debounceTimer);
    
    if (val && showEnglish) {
      const timer = setTimeout(async () => {
        setIsTranslating(true);
        try {
          const result = await translateMut.mutateAsync({ koreanText: val });
          setDetailEn(result.englishText);
          if (value?.address1) {
            onChange({ ...value as AddressData, address2: val, addressEn2: result.englishText });
          }
        } catch (error) {
          console.error("Translation error:", error);
        } finally {
          setIsTranslating(false);
        }
      }, 1000);
      setDebounceTimer(timer);
    }
  }, [value, onChange, debounceTimer, showEnglish, translateMut]);

  const handleDetailEnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDetailEn(val);
    if (value?.address1) {
      onChange({ ...value as AddressData, addressEn2: val });
    }
  }, [value, onChange]);



  const hasAddress = !!value?.address1;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 주소 검색 버튼 + 우편번호 */}
      <div className="flex gap-2">
        <Input
          readOnly
          value={value?.zipCode ?? ""}
          placeholder="郵便番号"
          className="w-28 bg-muted/50 cursor-pointer"
          onClick={() => setIsOpen(true)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="gap-2 shrink-0"
        >
          <Search className="w-4 h-4" />
          {compact ? "住所検索" : "住所を探す"}
        </Button>
      </div>

      {/* 한글 주소 - 항상 표시 */}
      <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <Input
                readOnly
                value={value?.address1 ?? ""}
                className="bg-muted/50"
                onClick={() => setIsOpen(true)}
              />
            </div>
          </div>
          <Input
            value={detail}
            onChange={handleDetailChange}
            placeholder="詳細住所を入力（棟・号室など）"
            className="ml-6"
          />
        </div>

      {/* 영문 주소 토글 */}
      {hasAddress && showEnglishPreview && (
        <div className="ml-6">
          <button
            type="button"
            onClick={() => setShowEnglish(!showEnglish)}
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            <Globe className="w-3.5 h-3.5" />
            영문 주소 {showEnglish ? "접기" : "확인/수정"}
            {showEnglish ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showEnglish && (
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" />
                English Address (국제배송용)
              </p>
              <Input
                readOnly
                value={value?.addressEn1 ?? ""}
                className="bg-white dark:bg-background text-sm"
                placeholder="英語基本住所（自動変換）"
              />
              <div className="space-y-2 relative">
                <Input
                  value={detailEn}
                  onChange={handleDetailEnChange}
                  placeholder="Detail address in English (Apt, Unit, Floor, etc.)"
                  className="text-sm"
                />
                {isTranslating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                국제배송을 위해 영문 주소가 필요합니다. 상세주소를 입력하면 자동으로 영문으로 번역됩니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 다음 주소 검색 다이얼로그 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              주소 검색
            </DialogTitle>
          </DialogHeader>
          <div className="h-[450px]">
            {isOpen && (
              <DaumPostcodeEmbed
                key="daum-postcode"
                onComplete={handleComplete}
                style={{ width: "100%", height: "100%" }}
                autoClose={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
