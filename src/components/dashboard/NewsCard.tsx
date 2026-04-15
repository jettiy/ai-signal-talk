'use client';
import { Clock, ExternalLink, Tag } from 'lucide-react';

interface NewsItem {
  symbol: string;
  publishedDate: string;
  title: string;
  text: string;
  source: string;
  image: string;
  url: string;
}

interface AiTag {
  label: string;
  type: 'LONG' | 'SHORT' | 'NEUTRAL';
}

interface Props {
  news: NewsItem;
  tags?: AiTag[];
  impact?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const impactColors = {
  CRITICAL: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
  HIGH: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' },
  MEDIUM: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  LOW: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', dot: 'bg-gray-500' },
};

export default function NewsCard({ news, tags = [], impact = 'MEDIUM' }: Props) {
  const colors = impactColors[impact];
  const isPositive = news.text.includes('상승') || news.text.includes('增加') || news.text.includes('增加');

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-4 hover:opacity-90 transition-opacity`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
            {impact}
          </span>
          <span className="text-gray-500 text-xs">{news.source}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-xs shrink-0">
          <Clock className="w-3 h-3" />
          {timeAgo(news.publishedDate)}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white text-sm font-semibold leading-snug mb-2 line-clamp-2">
        {news.title}
      </h3>

      {/* Summary */}
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">
        {news.text.slice(0, 150)}
      </p>

      {/* Tags row */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
              tag.type === 'LONG'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : tag.type === 'SHORT'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
            }`}>
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}