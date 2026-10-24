import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

// Components
import { Layout } from "./components/layout";

// Pages
import Login from "./pages/login";
import Register from "./pages/register";
import PendingApproval from "./pages/pending";
import Catalog from "./pages/catalog";
import Cart from "./pages/cart";
import OrderHistory from "./pages/order-history";
import OrderDetail from "./pages/order-detail";
import AdminDashboard from "./pages/admin-dashboard";
import AdminMembers from "./pages/admin-members";
import AdminOrders from "./pages/admin-orders";
import ProductDetail from "./pages/product-detail";
import Profile from "./pages/profile";
import Addresses from "./pages/addresses";
import AdminBankSettings from "./pages/admin-bank-settings";
import AdminMenuOrder from "./pages/admin-menu-order";
import AdminSettlement from "./pages/admin-settlement";
import AdminProducts from "./pages/admin-products";
import AdminProductDetail from "./pages/admin-product-detail";
import AdminCategories from "./pages/admin-categories";
import AdminCoupons from "./pages/admin-coupons";
import AdminPoints from "./pages/admin-points";
import AdminBanners from "./pages/admin-banners";
import AdminMainShop from "./pages/admin-main-shop";
import AdminGifts from "./pages/admin-gifts";
import AdminGiftCategories from "./pages/admin-gift-categories";
import Notices from "./pages/notices";
import AdminNoticeEdit from "./pages/admin-notice-edit";
import Inquiries from "./pages/inquiries";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

const AuthWrapper = ({ children, adminOnly }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false } });

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login");
    }
  }, [isLoading, error, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  if (adminOnly && !user.is_admin) {
    setLocation("/");
    return null;
  }

  if (user.is_admin && location === "/") {
    setLocation("/admin");
    return null;
  }

  if (!user.is_admin && !user.is_approved && location !== "/pending") {
    setLocation("/pending");
    return null;
  }

  return <Layout user={user}>{children}</Layout>;
};

const ProtectedRoute = ({ component: Component, adminOnly, path }: { component: any, adminOnly?: boolean, path: string }) => {
  return (
    <Route path={path}>
      {(params) => (
        <AuthWrapper adminOnly={adminOnly}>
          <Component params={params} />
        </AuthWrapper>
      )}
    </Route>
  );
};

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Pending state is standalone to avoid infinite loops in Layout */}
      <Route path="/pending">
        <AuthWrapper><PendingApproval /></AuthWrapper>
      </Route>

      <ProtectedRoute path="/" component={Catalog} />
      <ProtectedRoute path="/products/:id" component={ProductDetail} />
      <ProtectedRoute path="/cart" component={Cart} />
      <ProtectedRoute path="/orders" component={OrderHistory} />
      <ProtectedRoute path="/orders/:id" component={OrderDetail} />
      <ProtectedRoute path="/addresses" component={Addresses} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/notices" component={Notices} />
      <ProtectedRoute path="/admin/notices/new" component={() => <AdminNoticeEdit />} adminOnly />
      <ProtectedRoute path="/admin/notices/:id/edit" component={({ params }: any) => <AdminNoticeEdit noticeId={Number(params.id)} />} adminOnly />
      <ProtectedRoute path="/inquiries" component={Inquiries} />
      
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin/members" component={AdminMembers} adminOnly />
      <ProtectedRoute path="/admin/orders" component={AdminOrders} adminOnly />
      <ProtectedRoute path="/admin/settlement" component={AdminSettlement} adminOnly />
      <ProtectedRoute path="/admin/products/new" component={() => <AdminProductDetail params={{ id: "new" }} />} adminOnly />
      <ProtectedRoute path="/admin/products/:id" component={AdminProductDetail} adminOnly />
      <ProtectedRoute path="/admin/products" component={AdminProducts} adminOnly />
      <ProtectedRoute path="/admin/categories" component={AdminCategories} adminOnly />
      <ProtectedRoute path="/admin/coupons" component={AdminCoupons} adminOnly />
      <ProtectedRoute path="/admin/points" component={AdminPoints} adminOnly />
      <ProtectedRoute path="/admin/banners" component={AdminBanners} adminOnly />
      <ProtectedRoute path="/admin/main-shop/:section" component={AdminMainShop} adminOnly />
      <ProtectedRoute path="/admin/main-shop" component={AdminMainShop} adminOnly />
      <ProtectedRoute path="/admin/gifts" component={AdminGifts} adminOnly />
      <ProtectedRoute path="/admin/gift-categories" component={AdminGiftCategories} adminOnly />
      <ProtectedRoute path="/admin/bank" component={AdminBankSettings} adminOnly />
      <ProtectedRoute path="/admin/menu-order" component={AdminMenuOrder} adminOnly />
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
