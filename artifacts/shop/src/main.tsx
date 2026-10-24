import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

declare global {
  interface Window {
    Kakao: any;
  }
}

const kakaoJsKey = import.meta.env.VITE_KAKAO_JS_KEY;
if (kakaoJsKey && window.Kakao && !window.Kakao.isInitialized()) {
  try {
    window.Kakao.init(kakaoJsKey);
  } catch (e) {
    console.error("Kakao SDK init failed:", e);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
