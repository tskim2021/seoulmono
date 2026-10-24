import Layout from "@/components/Layout";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, MessageSquare, Phone, Mail, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function CustomerService() {
  useSEO({
    title: "カスタマーセンター",
    description: "ソウルモノ カスタマーセンター - お知らせ、FAQ、お問い合わせ",
  });

  return (
    <Layout>
      <div className="container py-12">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">カスタマーセンター</h1>
          <p className="text-muted-foreground text-lg">
            무엇을 도와드릴까요? 궁금하신 사항을 빠르게 해결해드립니다.
          </p>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/bbs/board.php?bo_table=notice">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>お知らせ</CardTitle>
                    <CardDescription>最新情報とイベント</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  탈모학교의 최신 소식, 이벤트, 정책 변경 사항을 확인하세요.
                </p>
                <Button variant="link" className="mt-4 p-0">
                  공지사항 보기 →
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/customer-service/faq">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>FAQ</CardTitle>
                    <CardDescription>よくあるご質問</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  자주 묻는 질문과 답변을 확인하고 빠르게 문제를 해결하세요.
                </p>
                <Button variant="link" className="mt-4 p-0">
                  FAQ 보기 →
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/customer-service/inquiry">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>お問い合わせ</CardTitle>
                    <CardDescription>個別相談</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  궁금하신 사항을 문의하시면 빠르게 답변해드립니다.
                </p>
                <Button variant="link" className="mt-4 p-0">
                  문의하기 →
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 연락처 정보 */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>カスタマーセンター ご利用案内</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">メールでのお問い合わせ</h3>
                  <p className="text-sm text-muted-foreground">help@talmoschool.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">ご相談について</h3>
                  <p className="text-sm text-muted-foreground">ご相談はお問い合わせ掲示板またはメールでお願いいたします。</p>
                  <p className="text-sm text-muted-foreground">リアルタイム相談を実施中</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">注文締切時間</h3>
                  <p className="text-sm text-muted-foreground">平日 午前10:00</p>
                  <p className="text-sm text-muted-foreground">平日午前10時までのご注文は当日出荷を依頼します</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 자주 찾는 도움말 */}
        <div>
          <h2 className="text-2xl font-bold mb-6">よく見られているヘルプ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/customer-service/faq?category=order">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">注文・お支払い</h3>
                  <p className="text-sm text-muted-foreground">
                    주문 방법, 결제 수단, 주문 취소 및 변경에 대한 안내
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/customer-service/faq?category=shipping">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">配送</h3>
                  <p className="text-sm text-muted-foreground">
                    배송 조회, 배송비, 배송 기간에 대한 안내
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/customer-service/faq?category=return">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">返品・交換</h3>
                  <p className="text-sm text-muted-foreground">
                    반품/교환 신청 방법, 환불 절차에 대한 안내
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/customer-service/faq?category=member">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">会員情報</h3>
                  <p className="text-sm text-muted-foreground">
                    회원 가입, 정보 수정, 등급 및 포인트에 대한 안내
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
