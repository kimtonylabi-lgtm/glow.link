import { FALLBACK_NEWS } from './data/news-fallback';

export interface NewsItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

function cleanText(text: string): string {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&#34;/g, '"')
        .trim();
}

export async function getNews(query: string): Promise<NewsItem[]> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.warn('Naver API credentials missing. Returning fallback data.');
        return [];
    }

    try {
        const response = await fetch(
            `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=4&sort=sim`,
            {
                headers: {
                    'X-Naver-Client-Id': CLIENT_ID,
                    'X-Naver-Client-Secret': CLIENT_SECRET,
                },
                cache: 'no-store', // Force cache purge for hotfix
            }
        );

        if (!response.ok) {
            throw new Error(`Naver API error: ${response.status}`);
        }

        const data = await response.json();
        return data.items.map((item: any) => {
            const finalLink = cleanText(item.originallink || item.link);
            console.log(`[News API] Query: ${query} | Title: ${cleanText(item.title)} | Final Link: ${finalLink}`);
            return {
                title: cleanText(item.title),
                link: finalLink,
                description: cleanText(item.description),
                pubDate: item.pubDate,
            };
        });
    } catch (error) {
        console.error(`Failed to fetch news for query "${query}":`, error);
        return [];
    }
}

export async function getTrendPortalData() {
    const [industry, trends, exhibitionNews] = await Promise.all([
        getNews('화장품 용기 OR 친환경 패키징 OR 화장품 부자재'),
        getNews('2026 글로벌 뷰티 트렌드 OR 화장품 트렌드'),
        getNews('2026 화장품 박람회 OR 뷰티 전시회'),
    ]);

    return {
        industry: industry.length > 0 ? industry : FALLBACK_NEWS.industry,
        trends: trends.length > 0 ? trends : FALLBACK_NEWS.trends,
        exhibitionNews: exhibitionNews.length > 0 ? exhibitionNews : FALLBACK_NEWS.exhibitions,
    };
}
