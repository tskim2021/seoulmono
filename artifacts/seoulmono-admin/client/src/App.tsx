import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import BoardList from "./pages/BoardList";
import PostDetail from "./pages/PostDetail";
import PostWrite from "./pages/PostWrite";
import MyPage from "./pages/MyPage";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import MyPoints from "./pages/MyPoints";
import MyAddresses from "./pages/MyAddresses";
import Notifications from "./pages/Notifications";
import MyProfile from "@/pages/MyProfile";
import MyRestockAlerts from "./pages/MyRestockAlerts";
import Compare from "@/pages/Compare";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductExcelUpload from "./pages/AdminProductExcelUpload";
import AdminTrackingExcelUpload from "./pages/AdminTrackingExcelUpload";
import AdminPaymentManagement from "./pages/AdminPaymentManagement";
import ReviewWrite from "./pages/ReviewWrite";
import PostEdit from "./pages/PostEdit";
import MyCoupons from "@/pages/MyCoupons";
import MyReviews from "@/pages/MyReviews";
import ShippingChatbot from "./pages/ShippingChatbot";
import CustomerService from "./pages/CustomerService";
import FAQ from "./pages/FAQ";
import Inquiry from "./pages/Inquiry";
import InquiryDetail from "./pages/InquiryDetail";
import MyInquiries from "./pages/MyInquiries";
import MyQnA from "./pages/MyQnA";
import NewsList from "./pages/NewsList";
import NewsDetail from "./pages/NewsDetail";
import DiscussionList from "./pages/DiscussionList";
import DiscussionDetail from "./pages/DiscussionDetail";
import DiscussionWrite from "./pages/DiscussionWrite";
import InfoBoardList from "./pages/InfoBoardList";
import InfoBoardDetail from "./pages/InfoBoardDetail";
import InfoBoardWrite from "./pages/InfoBoardWrite";
import GnuboardBoard from "./pages/GnuboardBoard";
import ReviewList from "./pages/ReviewList";
import QnAList from "./pages/QnAList";
import QnADetail from "./pages/QnADetail";
import Login from "./pages/Login";
import ForgotAccount from "./pages/ForgotAccount";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ShippingGuide from "./pages/ShippingGuide";

function Router() {
  return (
    <Switch>
      {/* sorosoro-admin2: 관리자 전용 배포이므로 루트는 대시보드로 보낸다.
          AdminDashboard 는 내부에서 /admin/* 로 다시 라우팅하므로
          "/" 에 직접 걸면 그 내부 라우터가 404 를 낸다. */}
      <Route path="/"><Redirect to="/admin" /></Route>
      {/* E-commerce */}
      <Route path="/products" component={Products} />
      <Route path="/products/:category" component={Products} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/shop/item.php" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/compare" component={Compare} />
      <Route path="/checkout" component={Checkout} />
      {/* News */}
      <Route path="/news" component={NewsList} />
      <Route path="/news/:id" component={NewsDetail} />
      {/* Discussions */}
      <Route path="/discussions" component={DiscussionList} />
      <Route path="/discussions/write" component={DiscussionWrite} />
      <Route path="/discussions/:id/edit" component={DiscussionWrite} />
      <Route path="/discussions/:id" component={DiscussionDetail} />
      {/* Info Board */}
      <Route path="/bbs/board.php" component={GnuboardBoard} />
      <Route path="/shop/itemuseview.php" component={() => {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const isId = params.get("is_id");
        if (isId) return <PostDetail postIdProp={Number(isId)} />;
        return <ReviewList />;
      }} />
      <Route path="/info-board" component={InfoBoardList} />
      <Route path="/info-board/write" component={InfoBoardWrite} />
      <Route path="/info-board/edit/:id" component={InfoBoardWrite} />
      <Route path="/info-board/:id" component={InfoBoardDetail} />
      {/* Community */}
      <Route path="/shop/itemuselist.php" component={ReviewList} />
      <Route path="/community/review" component={ReviewList} />
      <Route path="/community/qna" component={QnAList} />
      <Route path="/community/qna/:id" component={({ params }: any) => <QnADetail postId={Number(params.id)} />} />
      <Route path="/community/:slug" component={BoardList} />
      <Route path="/community/:slug/write" component={PostWrite} />
      <Route path="/community/post/:id/edit" component={PostEdit} />
      <Route path="/community/post/:id" component={PostDetail} />
      {/* Review */}
      <Route path="/login" component={Login} />
      <Route path="/forgot-account" component={ForgotAccount} />
      <Route path="/review/write" component={ReviewWrite} />
      {/* Static pages */}
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/shipping-guide" component={ShippingGuide} />
      {/* My Page */}
      <Route path="/mypage" component={MyPage} />
      <Route path="/mypage/orders" component={MyOrders} />
      <Route path="/mypage/orders/:id" component={OrderDetail} />
      <Route path="/mypage/points" component={MyPoints} />
      <Route path="/mypage/addresses" component={MyAddresses} />
      <Route path="/mypage/notifications" component={Notifications} />
      <Route path="/mypage/coupons" component={MyCoupons} />
      <Route path="/mypage/reviews" component={MyReviews} />
      <Route path="/mypage/qna" component={MyQnA} />
      <Route path="/mypage/inquiries" component={MyInquiries} />
          <Route path="/mypage/profile" component={MyProfile} />
      <Route path="/mypage/price-alerts" component={() => { window.location.replace("/wishlist"); return null; }} />
      <Route path="/mypage/restock-alerts" component={MyRestockAlerts} />
      {/* Shipping Chatbot */}
      <Route path="/shipping-chatbot" component={ShippingChatbot} />
      {/* Customer Service */}
      <Route path="/customer-service" component={CustomerService} />
      <Route path="/customer-service/faq" component={FAQ} />
      <Route path="/customer-service/inquiry" component={Inquiry} />
      <Route path="/inquiry/:id" component={InquiryDetail} />
      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/*" component={AdminDashboard} />
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <WouterRouter base="/admin">
            <ScrollToTop />
            <Router />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
