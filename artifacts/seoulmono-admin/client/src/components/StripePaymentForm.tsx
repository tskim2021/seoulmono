import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Lock } from "lucide-react";

export interface StripeCardHandle {
  createPaymentMethod(): Promise<string>;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#18181b",
      fontFamily: "'Pretendard', sans-serif",
      "::placeholder": { color: "#a1a1aa" },
    },
    invalid: { color: "#ef4444" },
  },
};

// 카드 입력 내부 컴포넌트 (Elements 컨텍스트 안에서 실행)
const StripeCardInner = forwardRef<StripeCardHandle>((_, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    async createPaymentMethod() {
      if (!stripe || !elements) throw new Error("Stripe가 로드되지 않았습니다.");

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error("카드 정보를 입력해주세요.");

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
      });

      if (error) throw new Error(error.message ?? "카드 정보를 확인해주세요.");
      return paymentMethod!.id;
    },
  }));

  const handleChange = (field: string) => (e: any) => {
    if (e.error) {
      setCardErrors(prev => ({ ...prev, [field]: e.error.message }));
    } else {
      setCardErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">カード番号</label>
        <div className="border rounded-lg px-3 py-3 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 transition-all">
          <CardNumberElement options={CARD_ELEMENT_OPTIONS} onChange={handleChange("number")} />
        </div>
        {cardErrors.number && <p className="text-xs text-red-500 mt-1">{cardErrors.number}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">有効期限</label>
          <div className="border rounded-lg px-3 py-3 bg-background focus-within:ring-2 focus-within:ring-ring transition-all">
            <CardExpiryElement options={CARD_ELEMENT_OPTIONS} onChange={handleChange("expiry")} />
          </div>
          {cardErrors.expiry && <p className="text-xs text-red-500 mt-1">{cardErrors.expiry}</p>}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">CVC</label>
          <div className="border rounded-lg px-3 py-3 bg-background focus-within:ring-2 focus-within:ring-ring transition-all">
            <CardCvcElement options={CARD_ELEMENT_OPTIONS} onChange={handleChange("cvc")} />
          </div>
          {cardErrors.cvc && <p className="text-xs text-red-500 mt-1">{cardErrors.cvc}</p>}
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
        <Lock className="w-3 h-3" />
        카드 정보는 Stripe에 암호화되어 전송됩니다
      </p>
    </div>
  );
});

StripeCardInner.displayName = "StripeCardInner";

// 외부 컴포넌트: publishableKey만 받아 Elements 제공 (clientSecret 불필요)
export const StripeCardInput = forwardRef<StripeCardHandle, {
  publishableKey: string;
}>(({ publishableKey }, ref) => {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        locale: "ko",
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#18181b", borderRadius: "8px" },
        },
      }}
    >
      <StripeCardInner ref={ref} />
    </Elements>
  );
});

StripeCardInput.displayName = "StripeCardInput";
