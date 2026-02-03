import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-gradient-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          准备好让您的数据开口说话了吗？
        </h2>
        <p className="mt-4 text-xl text-white/80">
          立即开始免费试用，体验AI驱动的数据解读
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
          >
            免费开始使用
            <ArrowRight className="inline-block ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
          >
            查看文档
          </Link>
        </div>
      </div>
    </section>
  );
}
