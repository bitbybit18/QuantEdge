# sentiment.py
# Sentiment analysis using FinBERT
# FinBERT is a BERT model fine-tuned on financial text

from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# ─────────────────────────────────────────
# Load FinBERT model
# This runs once when the server starts
# ─────────────────────────────────────────

print("Loading FinBERT model...")

# FinBERT is hosted on HuggingFace
# First run downloads it (~500MB), then it's cached locally
MODEL_NAME = "ProsusAI/finbert"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model     = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

# Create a pipeline — simplifies running the model
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model=model,
    tokenizer=tokenizer,
    device=-1,  # -1 = CPU (use 0 for GPU if available)
    truncation=True,
    max_length=512
)

print("FinBERT loaded successfully!")


# ─────────────────────────────────────────
# FETCH NEWS
# Gets recent news articles for a ticker
# ─────────────────────────────────────────
def fetch_news(ticker: str, company_name: str = None, days: int = 7):
    """
    Fetches recent news articles about a stock
    Uses NewsAPI to get headlines
    """

    if not NEWS_API_KEY:
        raise ValueError("NEWS_API_KEY not found in .env file")

    # Search by ticker and company name for better results
    query = ticker
    if company_name:
        query = f"{ticker} OR {company_name}"

    # Calculate date range
    from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    to_date   = datetime.now().strftime("%Y-%m-%d")

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "from": from_date,
        "to": to_date,
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": 20,        # max 20 articles
        "apiKey": NEWS_API_KEY,
    }

    response = requests.get(url, params=params)
    data     = response.json()

    if data.get("status") != "ok":
        raise ValueError(f"NewsAPI error: {data.get('message', 'Unknown error')}")

    articles = data.get("articles", [])

    # Extract just what we need
    cleaned = []
    for article in articles:
        if article.get("title") and article.get("description"):
            cleaned.append({
                "title":       article["title"],
                "description": article.get("description", ""),
                "url":         article.get("url", ""),
                "source":      article.get("source", {}).get("name", "Unknown"),
                "publishedAt": article.get("publishedAt", ""),
            })

    return cleaned


# ─────────────────────────────────────────
# ANALYZE SENTIMENT
# Runs FinBERT on each article
# ─────────────────────────────────────────
def analyze_sentiment(articles: list):
    """
    Runs FinBERT sentiment analysis on each article
    Returns individual scores + aggregate score
    """

    if not articles:
        return {
            "overall": "neutral",
            "score": 0,
            "articles": []
        }

    results = []
    positive_count = 0
    negative_count = 0
    neutral_count  = 0
    total_score    = 0

    for article in articles:
        # Combine title + description for better context
        text = f"{article['title']}. {article['description']}"

        # Truncate to 512 tokens (FinBERT limit)
        text = text[:512]

        try:
            # Run through FinBERT
            result = sentiment_pipeline(text)[0]

            label = result["label"].lower()    # positive/negative/neutral
            score = result["score"]            # confidence 0-1

            # Convert to numeric score
            # positive = +1, negative = -1, neutral = 0
            if label == "positive":
                numeric_score = score
                positive_count += 1
            elif label == "negative":
                numeric_score = -score
                negative_count += 1
            else:
                numeric_score = 0
                neutral_count += 1

            total_score += numeric_score

            results.append({
                "title":       article["title"],
                "source":      article["source"],
                "url":         article["url"],
                "publishedAt": article["publishedAt"],
                "sentiment":   label,
                "confidence":  round(score * 100, 1),
                "score":       round(numeric_score, 4),
            })

        except Exception as e:
            print(f"Error analyzing article: {e}")
            continue

    # Calculate overall sentiment
    num_articles = len(results)
    avg_score    = total_score / num_articles if num_articles > 0 else 0

    # Determine overall label
    if avg_score > 0.1:
        overall = "positive"
    elif avg_score < -0.1:
        overall = "negative"
    else:
        overall = "neutral"

    return {
        "overall":        overall,
        "score":          round(avg_score, 4),
        "score_percent":  round((avg_score + 1) / 2 * 100, 1),  # 0-100 scale
        "total_articles": num_articles,
        "breakdown": {
            "positive": positive_count,
            "negative": negative_count,
            "neutral":  neutral_count,
        },
        "articles": results[:10],  # return top 10
    }


# ─────────────────────────────────────────
# COMPANY NAME LOOKUP
# Maps ticker to company name for better news search
# ─────────────────────────────────────────
TICKER_TO_COMPANY = {
    "AAPL":  "Apple",
    "MSFT":  "Microsoft",
    "GOOGL": "Google Alphabet",
    "AMZN":  "Amazon",
    "TSLA":  "Tesla",
    "META":  "Meta Facebook",
    "NVDA":  "Nvidia",
    "NFLX":  "Netflix",
    "AMD":   "AMD",
    "INTC":  "Intel",
}

def get_company_name(ticker: str):
    return TICKER_TO_COMPANY.get(ticker.upper(), ticker)