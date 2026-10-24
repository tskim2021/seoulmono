import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, Button } from "../components/ui";
import { GripVertical, Save, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface MenuItem {
  id: string;
  label: string;
  type: "list" | "page";
  href: string;
  highlight?: boolean;
  gift?: boolean;
}

export default function AdminMenuOrder() {
  const queryClient = useQueryClient();
  const { data: apiItems, isLoading } = useQuery({
    queryKey: ["menu-order"],
    queryFn: () => customFetch<MenuItem[]>("/api/settings/menu-order"),
  });

  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (apiItems) setItems(apiItems);
  }, [apiItems]);

  const saveMutation = useMutation({
    mutationFn: (order: string[]) =>
      customFetch("/api/settings/menu-order", {
        method: "PUT",
        body: JSON.stringify({ order }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-order"] });
      toast({ title: "저장 완룋", description: "메뉴 순서가 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "오류", description: "저장 실패", variant: "destructive" });
    },
  });

  function moveUp(i: number) {
    if (i <= 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setItems(next);
  }

  function moveDown(i: number) {
    if (i >= items.length - 1) return;
    const next = [...items];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setItems(next);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">상단 메뉴 순서 설정</h1>
      <Card className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            불러오는 중...
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              ↑↓ 버튼으로 메뉴 순서를 바꾸고 저장해 주세요.
            </p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                >
                  <GripVertical size={16} className="text-gray-400" />
                  <span className="font-semibold flex-1">
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-400">{item.href}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === items.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => saveMutation.mutate(items.map(it => it.id))}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                저장
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
