import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM, type Message } from "../_core/llm";

export const addressRouter = router({
  translateToEnglish: publicProcedure
    .input(z.object({
      koreanText: z.string().min(1).max(500),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a translator that converts Korean text to English. If the input is a Korean person name, romanize it following the Revised Romanization of Korean (e.g. 홍길동 → Hong Gildong, 김철수 → Kim Cheolsu). If it is an address, translate it to English. Return only the English text without any additional explanation.",
            },
            {
              role: "user",
              content: `Translate to English:\n\n${input.koreanText}`,
            },
          ],
        });

        const content = response.choices[0]?.message?.content;
        const englishText = typeof content === 'string' ? content.trim() : "";
        
        if (!englishText) {
          throw new Error("Translation failed");
        }

        return { success: true, englishText };
      } catch (error) {
        console.error("Address translation error:", error);
        const romanized = romanizeKorean(input.koreanText);
        return { success: false, englishText: romanized, error: "Translation service unavailable" };
      }
    }),
});

function romanizeKorean(text: string): string {
  const initials = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
  const medials = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
  const finals = ["","k","k","k","n","n","n","t","l","l","l","l","l","l","l","l","m","p","p","t","t","ng","t","t","k","t","p","t"];

  const surnameMap: Record<string, string> = {
    "김":"Kim","이":"Lee","박":"Park","최":"Choi","정":"Jung","강":"Kang","조":"Cho",
    "윤":"Yoon","장":"Jang","임":"Lim","한":"Han","오":"Oh","서":"Seo","신":"Shin",
    "권":"Kwon","황":"Hwang","안":"Ahn","송":"Song","류":"Ryu","유":"Yoo","전":"Jeon",
    "홍":"Hong","고":"Ko","문":"Moon","양":"Yang","손":"Son","배":"Bae","백":"Baek",
    "허":"Heo","남":"Nam","심":"Shim","노":"Noh","하":"Ha","곽":"Kwak","성":"Sung",
    "차":"Cha","주":"Joo","우":"Woo","민":"Min","구":"Koo","나":"Na","진":"Jin",
    "지":"Ji","엄":"Eom","채":"Chae","원":"Won","천":"Cheon","방":"Bang","공":"Gong",
    "현":"Hyun","함":"Ham","변":"Byun","염":"Yeom","여":"Yeo","추":"Chu","도":"Do",
    "소":"So","석":"Seok","선":"Sun","설":"Seol","마":"Ma","길":"Gil","연":"Yeon",
    "위":"Wi","표":"Pyo","명":"Myung","기":"Ki","반":"Ban","라":"Ra","왕":"Wang",
    "금":"Geum","옥":"Ok","육":"Yuk","인":"In","맹":"Maeng","제":"Je","모":"Mo",
    "탁":"Tak","국":"Kook","어":"Eo","은":"Eun","편":"Pyeon","봉":"Bong","사":"Sa",
  };

  function syllableToRoman(ch: string): string {
    const code = ch.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return ch;
    const offset = code - 0xAC00;
    const iIdx = Math.floor(offset / (21 * 28));
    const mIdx = Math.floor((offset % (21 * 28)) / 28);
    const fIdx = offset % 28;
    return initials[iIdx] + medials[mIdx] + finals[fIdx];
  }

  const trimmed = text.trim();
  if (trimmed.length >= 2 && trimmed.length <= 4) {
    const first = trimmed[0];
    const rest = trimmed.slice(1);
    if (surnameMap[first]) {
      const givenRoman = [...rest].map(c => syllableToRoman(c)).join("");
      const capitalized = givenRoman.charAt(0).toUpperCase() + givenRoman.slice(1);
      return `${surnameMap[first]} ${capitalized}`;
    }
  }

  return [...trimmed].map(c => syllableToRoman(c)).join("");
}
