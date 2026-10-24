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
    XLSX.utils.book_append_sheet(wb, ws, "追跡番号リスト");
    XLSX.writeFile(wb, "追跡番号_アップロードテンプレート.xlsx");
    toast.success("テンプレートをダウンロードしました");
  };

  // 파일 선택
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error("Excelファイル(.xlsx, .xls, .csv)のみアップロードできます");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("ファイルサイズは10MB以下にしてください");
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
          toast.success(`検証完了: ${result.validRows}件の追跡番号を登録できます`);
        } else {
          toast.error(`検証失敗: ${result.errorRows}件のエラーが見つかりました`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error(error.message || "検証中にエラーが発生しました");
    }
  };

  // 업로드 실행
  const handleUpload = async () => {
    if (!validationResult || !validationResult.success) {
      toast.error("先に検証を完了してください");
      return;
    }

    setUploading(true);
    try {
      const result = await bulkCreateMutation.mutateAsync({
        shipments: validationResult.validatedData,
      });
      setUploadResult(result);
      toast.success(`アップロード完了: 成功 ${result.successCount}件、失敗 ${result.failCount}件`);
    } catch (error: any) {
      toast.error(error.message || "アップロード中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">追跡番号Excel一括アップロード</h1>
        <p className="text-muted-foreground">Excelファイルで複数注文の追跡番号を一括登録できます</p>
      </div>

      {/* 템플릿 다운로드 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Excelテンプレートのダウンロード
            </h3>
            <p className="text-sm text-muted-foreground">正しい形式のExcelファイルをダウンロードして作成してください</p>
          </div>
          <Button onClick={handleDownloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            テンプレートをダウンロード
          </Button>
        </div>
      </Card>

      {/* 파일 업로드 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">1. Excelファイルを選択</h3>
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
            ファイルを選択
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
          <h3 className="font-semibold mb-4">2. データプレビュー (最大10件)</h3>
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
              {parseMutation.isPending ? "検証中..." : "検証する"}
            </Button>
          </div>
        </Card>
      )}

      {/* 검증 결과 */}
      {validationResult && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">3. 検証結果</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">全行数:</span>
              <span className="font-medium">{validationResult.totalRows}件</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">有効な行:</span>
              <span className="font-medium text-green-600">{validationResult.validRows}件</span>
            </div>
            {validationResult.errorRows > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">エラー行:</span>
                  <span className="font-medium text-destructive">{validationResult.errorRows}件</span>
                </div>
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    エラー詳細
                  </h4>
                  <div className="space-y-2 text-sm">
                    {validationResult.errors.map((err: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-medium">{err.row}行目 (注文番号: {formatOrderNumber(err.orderNumber)}, アイテムID: {err.itemId}):</span>
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
                {uploading ? "アップロード中..." : `${validationResult.validRows}件の追跡番号を登録`}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 업로드 결과 */}
      {uploadResult && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">4. アップロード結果</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">成功:</span>
              <span className="font-medium text-green-600">{uploadResult.successCount}件</span>
            </div>
            {uploadResult.failCount > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">失敗:</span>
                  <span className="font-medium text-destructive">{uploadResult.failCount}件</span>
                </div>
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                  <h4 className="font-medium mb-2">失敗詳細</h4>
                  <div className="space-y-2 text-sm">
                    {uploadResult.results
                      .filter((r: any) => !r.success)
                      .map((r: any, i: number) => (
                        <div key={i}>
                          <span className="font-medium">{formatOrderNumber(r.orderNumber)} (アイテムID: {r.orderItemId}):</span> {r.error}
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
