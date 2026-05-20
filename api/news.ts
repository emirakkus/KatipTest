// Vercel Serverless Function - Zabıt Katipliği Haberleri
// RSS feed'lerden ve Google News'dan haber çeker

export const config = {
  runtime: 'edge',
};

interface NewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
}

async function fetchRSS(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'KatipTest/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const text = await res.text();
    
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(text)) !== null && items.length < 10) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      
      if (title && title.length > 10) {
        items.push({
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          link,
          date: pubDate ? new Date(pubDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
          source
        });
      }
    }
    
    return items;
  } catch {
    return [];
  }
}

async function fetchGoogleNews(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=tr&gl=TR&ceid=TR:tr`;
  return fetchRSS(url, 'Google News');
}

export default async function handler(req: Request) {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const queries = [
      'zabıt katibi sınav',
      'adalet bakanlığı personel alım',
      'zabıt katipliği',
      'adalet bakanlığı sınav'
    ];

    const allResults = await Promise.all(queries.map(q => fetchGoogleNews(q)));
    
    // Birleştir ve tekrarları kaldır
    const seen = new Set<string>();
    const news: NewsItem[] = [];
    
    allResults.flat().forEach(item => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        news.push(item);
      }
    });

    // Tarihe göre sırala
    news.sort((a, b) => {
      const da = a.date.split('.').reverse().join('');
      const db = b.date.split('.').reverse().join('');
      return db.localeCompare(da);
    });

    return new Response(JSON.stringify({ 
      news: news.slice(0, 15),
      lastUpdated: new Date().toISOString(),
      success: true
    }), { headers });

  } catch {
    return new Response(JSON.stringify({ 
      news: [],
      lastUpdated: new Date().toISOString(),
      success: false,
      error: 'Haberler yüklenemedi'
    }), { headers, status: 500 });
  }
}
