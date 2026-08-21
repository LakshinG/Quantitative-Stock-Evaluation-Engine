import yfinance as yf
from transformers import pipeline

# Initialize the FinBERT pipeline once
# We use ProsusAI/finbert as it's specifically trained on financial data
sentiment_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")

def get_ticker_news(ticker: str, limit: int = 5):
    """
    Fetches recent news for a ticker using yfinance.
    """
    try:
        stock = yf.Ticker(ticker)
        news = stock.news
        if not news:
            return []
        
        # Extract titles
        headlines = []
        for item in news[:limit]:
            if 'content' in item and 'title' in item['content']:
                headlines.append(item['content']['title'])
            elif 'title' in item:
                headlines.append(item['title'])
        return headlines
    except Exception as e:
        print(f"Error fetching news for {ticker}: {e}")
        return []

def analyze_sentiment(ticker: str):
    """
    Fetches news and returns an aggregated sentiment score.
    Returns: dict with 'sentiment' (bullish/bearish/neutral), 'score', and 'headlines'.
    """
    headlines = get_ticker_news(ticker)
    
    if not headlines:
        return {
            "ticker": ticker,
            "sentiment": "neutral",
            "score": 0.0,
            "news": []
        }
        
    results = sentiment_pipeline(headlines)
    
    # Calculate aggregated score
    # ProsusAI/finbert outputs labels: 'positive', 'negative', 'neutral'
    score_map = {'positive': 1, 'negative': -1, 'neutral': 0}
    
    total_score = 0
    for res in results:
        label = res['label']
        confidence = res['score']
        total_score += score_map.get(label, 0) * confidence
        
    avg_score = total_score / len(results) if results else 0
    
    overall_sentiment = "neutral"
    if avg_score > 0.1:
         overall_sentiment = "bullish"
    elif avg_score < -0.1:
         overall_sentiment = "bearish"
         
    return {
        "ticker": ticker,
        "sentiment": overall_sentiment,
        "score": round(avg_score, 2),
        "news": [{"headline": h, "label": r['label'], "confidence": round(r['score'], 2)} for h, r in zip(headlines, results)]
    }

# For testing
if __name__ == "__main__":
    print(analyze_sentiment("AAPL"))
