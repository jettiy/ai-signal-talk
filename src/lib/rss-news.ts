import { NewsItem } from './types';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const DEFAULT_SYMBOL = 'MARKET';

function extractTag(item: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = item.match(regex);
  if (!match) return '';
  return match[1].replace(/<!\\[CDATA\\[|\\]\\]>/g, '').trim();
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRssFeed(url: string, source: string, limit = 15): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item[\s\S]*?<\/item>/gi);
    if (!items) return [];

    return items.slice(0, limit).map((raw) => {
      const title = stripHtml(extractTag(raw, 'title'));
      const link = extractTag(raw, 'link');
      const pubDate = extractTag(raw, 'pubDate') || new Date().toISOString();
      const description = stripHtml(extractTag(raw, 'description'));

      return {
        symbol: DEFAULT_SYMBOL,
        publishedDate: pubDate,
        title,
        text: description,
        source,
        image: '',
        url: link || '',
      };
    }).filter((item) => item.title);
  } catch {
    return [];
  }
}

export async function fetchYahooNews(): Promise<NewsItem[]> {
  return fetchRssFeed('https://finance.yahoo.com/rss/topstories', 'Yahoo Finance');
}

export async function fetchBloombergNews(): Promise<NewsItem[]> {
  return fetchRssFeed('https://feeds.bloomberg.com/markets/news.rss', 'Bloomberg');
}

export async function fetchSeekingAlphaNews(): Promise<NewsItem[]> {
  return fetchRssFeed('https://seekingalpha.com/market_currents.xml', 'Seeking Alpha');
}
