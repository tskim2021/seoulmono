import { useEffect } from "react";

interface SEOOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  keywords?: string;
  noindex?: boolean;
}

const SITE_NAME = "ソウルモノ 管理者";
const DEFAULT_DESCRIPTION = "커뮤니티와 쇼핑이 하나로 연결된 새로운 쇼핑 경험을 만나보세요. 상품 리뷰부터 자유로운 소통까지, 탈모학교에서 시작하세요.";
const DEFAULT_OG_IMAGE = "/og-default.png";

function setMetaTag(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function removeMetaTag(name: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.remove();
}

export function useSEO(options: SEOOptions) {
  useEffect(() => {
    const prevTitle = document.title;

    // Title
    if (options.title) {
      document.title = `${options.title} | ${SITE_NAME}`;
    } else {
      document.title = SITE_NAME;
    }

    // Description
    setMetaTag("description", options.description ?? DEFAULT_DESCRIPTION);

    // Keywords
    if (options.keywords) {
      setMetaTag("keywords", options.keywords);
    }

    // Robots
    if (options.noindex) {
      setMetaTag("robots", "noindex, nofollow");
    } else {
      setMetaTag("robots", "index, follow");
    }

    // Open Graph
    setMetaTag("og:title", options.ogTitle ?? options.title ?? SITE_NAME, true);
    setMetaTag("og:description", options.ogDescription ?? options.description ?? DEFAULT_DESCRIPTION, true);
    setMetaTag("og:image", options.ogImage ?? DEFAULT_OG_IMAGE, true);
    setMetaTag("og:type", options.ogType ?? "website", true);
    setMetaTag("og:site_name", SITE_NAME, true);
    if (options.ogUrl) {
      setMetaTag("og:url", options.ogUrl, true);
    }

    // Twitter Card
    setMetaTag("twitter:card", "summary_large_image", true);
    setMetaTag("twitter:title", options.ogTitle ?? options.title ?? SITE_NAME, true);
    setMetaTag("twitter:description", options.ogDescription ?? options.description ?? DEFAULT_DESCRIPTION, true);
    setMetaTag("twitter:image", options.ogImage ?? DEFAULT_OG_IMAGE, true);

    return () => {
      document.title = prevTitle;
      if (options.noindex) {
        removeMetaTag("robots");
      }
    };
  }, [options.title, options.description, options.ogTitle, options.ogDescription, options.ogImage, options.ogType, options.ogUrl, options.keywords, options.noindex]);
}
