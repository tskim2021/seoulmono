import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminTrackingExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templateQuery = trpc.excelUpload.getTrackingTemplate.useQuery();
  const parseMutation = trpc.excelUpload.parseTrackingExcel.useMutation();
  const bulkCreateMutation = trpc.excelUpload.bulkCreateShipments.useMutation();

  // 템플릿 다운로드
  const handleDownloadTemplate = () => {
    if (!templateQuery.data) return;
    
    const ws = XLSX.utils.json_to_sheet(templateQuery.data.template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "운송장목록");
    XLSX.writeFile(wb, "운송장_업로드_템플릿.xlsx");
    toast.success("템플릿이 다운로드되었습니다");
  };

  // 파일 선택
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error("엑셀 파일(.xlsx, .xls, .csv)만 업로드 가능합니다");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다");
      return;
    }

    setFile(selectedFile);
    setValidationResult(null);
    setUploadResult(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setPreviewData(jsonData.slice(0, 10)); // 최대 10개만 미리보기
    };
    reader.readAsBinaryString(selectedFile);
  };

  // 유효성 검증
  const handleValidate = async () => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = btoa(
          new Uint8Array(event.target?.result as ArrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const result = await parseMutation.mutateAsync({ base64Data });
        setValidationResult(result);

        if (result.success) {
          toast.success(`검증 완료: ${result.validRows}개 운송장 등록 가능`);
        } else {
          toast.error(`검증 실패: ${result.errorRows}개 오류 발견`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error(error.message || "검증 중 오류가 발생했습니다");
    }
  };

  // 업로드 실행
  const handleUpload = async () => {
    if (!validationResult || !validationResult.success) {
      toast.error("먼저 유효성 검증을 완료해주세요");
      return;
    }

    setUploading(true);
    try {
      const result = await bulkCreateMutation.mutateAsync({
        shipments: validationResult.validatedData,
      });
      setUploadResult(result);
      toast.success(`업로드 완료: 성공 ${result.successCount}건, 실패 ${result.failCount}건`);
    } catch (error: any) {
      toast.error(error.message || "업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">운송장 대량 엑셀 업로드</h1>
        <p className="text-muted-foreground">엑셀 파일로 여러 주문의 운송장 번호를 한 번에 등록할 수 있습니다</p>
      </div>

      {/* 템플릿 다운로드 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              엑셀 템플릿 다운로드
            </h3>
            <p className="text-sm text-muted-foreground">올바른 형식의 엑셀 파일을 다운로드하여 작성하세요</p>
          </div>
          <Button onClick={handleDownloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            템플릿 다운로드
          </Button>
        </div>
      </Card>

      {/* 파일 업로드 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">1. 엑셀 파일 선택</h3>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            파일 선택
          </Button>
          {file && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>{file.name}</span>
              <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>
      </Card>

      {/* 미리보기 */}
      {previewData.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">2. 데이터 미리보기 (최대 10개)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  {Object.keys(previewData[0]).map((key) => (
                    <th key={key} className="border px-3 py-2 text-left font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-b">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="border px-3 py-2">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button onClick={handleValidate} disabled={parseMutation.isPending}>
              {parseMutation.isPending ? "검증 중..." : "유효성 검증"}
            </Button>
          </div>
        </Card>
      )}

      {/* 검증 결과 */}
      {validationResult && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">3. 검증 결과</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">전체 행:</span>
              <span className="font-medium">{validationResult.totalRows}개</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">유효한 행:</span>
              <span className="font-medium text-green-600">{validationResult.validRows}개</span>
            </div>
            {validationResult.errorRows > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">오류 행:</span>
                  <span className="font-medium text-destructive">{validationResult.errorRows}개</span>
                </div>
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    오류 상세
                  </h4>
                  <div className="space-y-2 text-sm">
                    {validationResult.errors.map((err: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-medium">행 {err.row} (주문번호: {formatOrderNumber(err.orderNumber)}, 아이템ID: {err.itemId}):</span>
                        <span className="text-destructive">{err.errors.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {validationResult.success && (
            <div className="mt-4">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "업로드 중..." : `${validationResult.validRows}개 운송장 등록`}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 업로드 결과 */}
      {uploadResult && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">4. 업로드 결과</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">성공:</span>
              <span className="font-medium text-green-600">{uploadResult.successCount}건</span>
            </div>
            {uploadResult.failCount > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">실패:</span>
                  <span className="font-medium text-destructive">{uploadResult.failCount}건</span>
                </div>
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                  <h4 className="font-medium mb-2">실패 상세</h4>
                  <div className="space-y-2 text-sm">
                    {uploadResult.results
                      .filter((r: any) => !r.success)
                      .map((r: any, i: number) => (
                        <div key={i}>
                          <span className="font-medium">{formatOrderNumber(r.orderNumber)} (아이템ID: {r.orderItemId}):</span> {r.error}
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
