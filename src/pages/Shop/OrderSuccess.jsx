import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, PackageSearch, ArrowLeft } from 'lucide-react';
import { useOrderPaymentResult, useOrderTracking } from '@/api/plugins/ecommerce';
import { PaymentResult } from '@joorchin/site-ui';
import Reveal from '@/components/Reveal';
import { ROUTES } from '@/lib/routes';
import { EASE } from '@/lib/motion';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const result = useOrderPaymentResult({ search: params.toString() });
  const { orderId } = result;
  const { data: tracking } = useOrderTracking(orderId);

  return (
    <div className="container-max section-padding">
      <div className="mx-auto max-w-xl text-center">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-brand-50 text-brand-600"
        >
          {result.state === 'paid' ? <CheckCircle2 size={44} strokeWidth={1.2} /> : <PackageSearch size={44} strokeWidth={1.2} />}
        </motion.span>

        <Reveal delay={0.15}>
          <PaymentResult state={result.state} message={result.message} sandbox={result.sandbox} onRetry={result.order?.status === 'pending' ? () => void result.retry() : undefined} />

          {orderId && (
            <p className="mt-6 inline-block border border-line bg-card px-6 py-3 font-display text-sm tracking-wide text-neutral-600">
              کد سفارش: <strong className="text-ink">{orderId}</strong>
            </p>
          )}

          {(tracking?.trackingNumber || tracking?.status) && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
              className="mt-8 flex items-start gap-4 border border-line bg-card p-6 text-start"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-brand-700">
                <PackageSearch size={19} strokeWidth={1.6} />
              </span>
              <span className="text-sm leading-7">
                <strong className="block font-medium">پیگیری مرسوله</strong>
                {tracking.trackingNumber && (
                  <span className="mt-1 block font-display text-neutral-600">
                    {tracking.trackingNumber}
                  </span>
                )}
                {tracking.status && (
                  <span className="mt-1 block text-xs text-neutral-500">وضعیت: {tracking.status}</span>
                )}
              </span>
            </motion.div>
          )}

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link to={ROUTES.shop} className="btn-primary">
              ادامه خرید
              <ArrowLeft size={16} strokeWidth={1.6} />
            </Link>
            <Link to={ROUTES.home} className="btn-outline">
              بازگشت به خانه
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
