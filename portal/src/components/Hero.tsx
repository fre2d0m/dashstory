import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 hero-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/90 to-purple-600/90" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-1.5 bg-white/10 rounded-full text-white/90 text-sm mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            全新发布 - AI语音解读功能
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            让数据讲述
            <br />
            <span className="text-yellow-300">自己的故事</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-xl text-white/80 max-w-2xl mx-auto">
            DashStory将复杂的数据仪表板转化为直观的AI语音解读。
            <br />
            5秒内，让每个人都能理解数据背后的洞察。
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              免费开始使用
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center">
              <Play className="w-5 h-5 mr-2" />
              观看演示
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-white">5秒</div>
              <div className="text-sm text-white/70">生成解读</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm text-white/70">识别准确率</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-sm text-white/70">企业信任</div>
            </div>
          </div>
        </div>

        {/* Demo Preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="p-8 flex items-center justify-center min-h-[300px] text-gray-400">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>产品演示视频</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
