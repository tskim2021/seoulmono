import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function PopularKeywords() {
  const { data: keywords } = trpc.product.popularKeywords.useQuery();

  if (!keywords || keywords.length === 0) return null;

  return (
    <section className="mt-10">
      <h3 className="text-[22px] font-extrabold">
        人気キーワード <span className="text-muted-foreground font-normal">&rsaquo;</span>
      </h3>
      <div className="mt-4 bg-[#181a1f] rounded-xl px-7 py-5 flex items-center gap-3 overflow-x-auto">
        {keywords.map((k, i) => (
          <div key={k.keyword} className="flex items-center flex-1 gap-3.5 min-w-fit">
            <Link href={`/products?search=${encodeURIComponent(k.keyword)}`}>
              <div>
                <div className="text-gray-500 text-[13px] font-bold">{String(i + 1).padStart(2, "0")}</div>
                <div className="text-white text-[15px] font-semibold mt-1 whitespace-nowrap">{k.keyword}</div>
              </div>
            </Link>
            {i < keywords.length - 1 && <div className="w-px h-[30px] bg-[#33363d] ml-auto shrink-0" />}
          </div>
        ))}
      </div>
    </section>
  );
}
