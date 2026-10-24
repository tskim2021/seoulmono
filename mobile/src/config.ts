const INJECTED_JAVASCRIPT = `
    "use strict";
(() => {
    var t = {
        notification: {
            checkPermission: "CHECK_NOTIFICATION_PERMISSION",
            getToken: "GET_NOTIFICATION_TOKEN"
        },
        location: {
            checkPermission: "CHECK_LOCATION_PERMISSION",
            getCurrentPosition: "GET_CURRENT_POSITION"
        },
        device: {
            getInfo: "GET_DEVICE_INFO"
        },
        linking: {
            openSettings: "OPEN_SETTINGS",
            externalBrowser: "EXTERNAL_BROWSER",
            inappBrowser: "INAPP_BROWSER"
        },
        kakao: {
            login: "KAKAO_LOGIN",
            logout: "KAKAO_LOGOUT",
            unlink: "KAKAO_UNLINK"
        },
        naver: {
            login: "NAVER_LOGIN",
            logout: "NAVER_LOGOUT",
            unlink: "NAVER_UNLINK"
        }
    };
    (function() {
        if (window.isWebviewInitialized) return !1;
        var u = window.ReactNativeWebView;
        if (!u) return !1;
        var l = e => {
                try {
                    u.postMessage(typeof e == "string" ? e : JSON.stringify(e))
                } catch (a) {
                    console.warn("Failed to post message:", a)
                }
            },
            d = e => {
                var a = history[e];
                return function(...i) {
                    var g = a.apply(this, i);
                    return l({
                        key: e,
                        value: "navigationStateChange"
                    }), g
                }
            };
        history.pushState = d("pushState"), history.replaceState = d("replaceState"), window.addEventListener("popstate", () => {
            l({
                key: "popstate",
                value: "navigationStateChange"
            })
        }), window.postMessage = l;
        let o = new Map,
            n = (e, a, c) => {
                if (o.has(e)) return;
                let i = m => {
                    let v = m;
                    if (typeof v.data == "string") try {
                        let s = JSON.parse(v.data);
                        if (s.key === e) {
                            let w = o.get(e);
                            w && (w(s.value), o.delete(e)), window.removeEventListener("message", i), document.removeEventListener("message", i)
                        }
                    } catch (s) {
                        console.error("Invalid message format", s)
                    }
                };
                c && o.set(e, c), window.addEventListener("message", i), document.addEventListener("message", i), setTimeout(() => {
                    window.postMessage({
                        key: e,
                        value: a
                    })
                }, 0);
                let g = setTimeout(() => {
                    [t.kakao.login, t.naver.login].indexOf(e) === -1 && (o.delete(e), window.removeEventListener("message", i), document.removeEventListener("message", i))
                }, 1e3);
                return () => {
                    clearTimeout(g), o.delete(e), window.removeEventListener("message", i), document.removeEventListener("message", i)
                }
            };
        return window.appify = {
            device: {
                getInfo: e => n("DEVICE_INFO", null, e)
            },
            notification: {
                checkPermission: e => n(t.notification.checkPermission, null, e),
                getToken: e => n(t.notification.getToken, null, e)
            },
            location: {
                checkPermission: e => n(t.location.checkPermission, null, e),
                getCurrentPosition: e => n(t.location.getCurrentPosition, null, e)
            },
            linking: {
                openSettings: () => n(t.linking.openSettings, null),
                externalBrowser: e => n(t.linking.externalBrowser, e, () => {}),
                inappBrowser: e => n(t.linking.inappBrowser, e, () => {})
            },
            kakao: {
                login: e => n(t.kakao.login, null, e),
                logout: () => n(t.kakao.logout, null),
                unlink: () => n(t.kakao.unlink, null)
            },
            naver: {
                login: e => n(t.naver.login, null, e),
                logout: () => n(t.naver.logout, null),
                unlink: () => n(t.naver.unlink, null)
            }
        }, window.isWebview = !0, window.isWebviewInitialized = !0, !0
    })();
})()
`;

export const config = {
  appName: 'seoulmono.com',
  url: 'https://seoulmono.com',
  customUserAgent: 'appify/1.0.0,ReactNativeWebView',
  injectedJavaScript: INJECTED_JAVASCRIPT,

  naver: {
    appName: 'seoulmono',
    consumerKey: 'N5AUEgBbV3LSk6KjkU4N',
    consumerSecret: '',
    serviceUrlSchemeIOS: 'seoulmono',
    disableNaverAppAuthIOS: false,
  },
  apple: {
    clientId: 'com.gongimnara.ios.service',
    redirectUri: 'https://www.gongim.com/front/html/login.php',
  },
  google: {
    webClientId: '',
  },
};
