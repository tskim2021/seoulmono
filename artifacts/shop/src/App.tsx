import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import KakaoFloat from "@/components/KakaoFloat";
import Home from "@/pages/Home";
import List from "@/pages/List";
import Item from "@/pages/Item";
import Cart from "@/pages/Cart";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RegisterSuccess from "@/pages/RegisterSuccess";

import SearchPage from "@/pages/SearchPage";
import CategoryPage from "@/pages/CategoryPage";
import Mypage from "@/pages/Mypage";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFail from "@/pages/PaymentFail";
import KakaoCallback from "@/pages/KakaoCallback";
import NaverCallback from "@/pages/NaverCallback";
import Company from "@/pages/Company";
import Terms from "@/pages/Terms";
import Tokushoho from "@/pages/Tokushoho";
import Privacy from "@/pages/Privacy";
import FaqPage from "@/pages/Faq";
import NoticePage from "@/pages/Notice";
import NoticeDetailPage from "@/pages/NoticeDetail";
import ReviewDetailPage from "@/pages/ReviewDetail";
import CustomerServicePage from "@/pages/CustomerService";
import GiftPage from "@/pages/Gift";
import GiftDetailPage from "@/pages/GiftDetail";
import GiftRecipientPage from "@/pages/GiftRecipient";
import GiftMyPage from "@/pages/GiftMy";
import GiftOrderDetailPage from "@/pages/GiftOrderDetail";
import GiftCustomPage from "@/pages/GiftCustom";
import GiftCartPage from "@/pages/GiftCartPage";
import PartnershipPage from "@/pages/Partnership";
import GroupBuyPage from "@/pages/GroupBuy";
import FindAccount from "@/pages/FindAccount";
import TodayDealPage from "@/pages/TodayDeal";
import EventsPage, { EventDetailPage } from "@/pages/Events";
import OrderDetailPage from "@/pages/OrderDetailPage";
import B2BPage from "@/pages/B2BPage";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function NotFound() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, color: "#ddd", marginBottom: 16 }}>404</h1>
      <p style={{ fontSize: 18, color: "#666" }}>페이지를 찾을 수 없습니다</p>
    </div>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const [cartTick] = useState(0);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "clip", width: "100%", maxWidth: 1280, margin: "0 auto", boxShadow: "0 0 40px rgba(0,0,0,0.08)" }}>
      <ScrollToTop />
      <Header />
      <main style={{ flex: 1, paddingBottom: "var(--mobile-nav-height, 0px)" }}>
        {location === "/" ? <Home /> : <Switch>
          <Route path="/list" component={List} />
          <Route path="/products" component={List} />
          <Route path="/search" component={SearchPage} />
          <Route path="/item/:id" component={Item} />
          <Route path="/cart" component={Cart} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/register-success" component={RegisterSuccess} />
          <Route path="/find-account" component={FindAccount} />
          <Route path="/mypage" component={Mypage} />
          <Route path="/mypage/order/:odId" component={OrderDetailPage} />
          <Route path="/company" component={Company} />
          <Route path="/terms" component={Terms} />
          <Route path="/tokushoho" component={Tokushoho} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/notice" component={NoticePage} />
          <Route path="/notices/:id" component={NoticeDetailPage} />
          <Route path="/notices" component={NoticePage} />
          <Route path="/reviews/:id" component={ReviewDetailPage} />
          <Route path="/cs" component={CustomerServicePage} />
          <Route path="/partnership" component={PartnershipPage} />
          <Route path="/gift" component={GiftPage} />
          <Route path="/gift/my" component={GiftMyPage} />
          <Route path="/gift/order/:id" component={GiftOrderDetailPage} />
          <Route path="/gift/custom" component={GiftCustomPage} />
          <Route path="/gift/cart" component={GiftCartPage} />
          <Route path="/gift/:id" component={GiftDetailPage} />
          <Route path="/groupbuy" component={GroupBuyPage} />
          <Route path="/todaydeal" component={TodayDealPage} />
          <Route path="/events/:id" component={EventDetailPage} />
          <Route path="/events" component={EventsPage} />
          <Route path="/info" component={NotFound} />
          <Route component={NotFound} />
        </Switch>}
      </main>
      <Footer />
      <MobileBottomNav />
      <KakaoFloat />
    </div>
  );
}

function CategoryLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", maxWidth: 1280, margin: "0 auto", width: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.08)" }}>
      <main style={{ flex: 1, paddingBottom: "var(--mobile-nav-height, 0px)" }}>
        <CategoryPage />
      </main>
      <MobileBottomNav />
      <KakaoFloat />
    </div>
  );
}

function App() {
  return (
    <WouterRouter base={(() => { const p = window.location.pathname; return (p === "/shop" || p.startsWith("/shop/")) ? "/shop" : ""; })()}>
      <AuthProvider>
        <Switch>
          <Route path="/checkout" component={Checkout} />
          <Route path="/payment/success" component={PaymentSuccess} />
          <Route path="/payment/fail" component={PaymentFail} />
          <Route path="/kakao-callback" component={KakaoCallback} />
          <Route path="/naver-callback" component={NaverCallback} />
          <Route path="/category" component={CategoryLayout} />
          <Route path="/gift/recipient/:token" component={GiftRecipientPage} />
          <Route path="/gift/receive/:token" component={GiftRecipientPage} />
          <Route path="/b2b" component={B2BPage} />
          <Route component={AppLayout} />
        </Switch>
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
