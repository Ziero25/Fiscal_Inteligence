import urllib.request
import urllib.parse
import json
import os
import datetime

def main():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) width/1000'
    }
    # Query related to tax/fiscal in Brazil
    query = '(fiscal OR tributário OR imposto OR contabilidade) (brasil OR br)'
    encoded_query = urllib.parse.quote(query)
    
    # t=week for the past week, sort=new for recent, limit=100 for 100 posts
    url = f'https://www.reddit.com/search.json?q={encoded_query}&sort=new&t=week&limit=100'
    
    req = urllib.request.Request(url, headers=headers)
    
    os.makedirs('.tmp', exist_ok=True)
    
    try:
        print(f"Fetching posts from {url}")
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"Error fetching data: {response.status}")
                return
            
            data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Exception during request: {e}")
        return

    posts = data.get('data', {}).get('children', [])
    print(f"Fetched {len(posts)} posts.")
    
    if len(posts) == 0:
        print("No posts found for the query.")
        return

    # Save raw data
    with open('.tmp/reddit_fiscal_posts_raw.json', 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    # Rank by engagement (score + num_comments)
    def calculate_engagement(post_data):
        score = post_data.get('score', 0)
        comments = post_data.get('num_comments', 0)
        return score + comments

    valid_posts = []
    for p in posts:
        pd = p.get('data', {})
        valid_posts.append({
            'title': pd.get('title', 'No Title'),
            'subreddit': pd.get('subreddit_name_prefixed', 'Unknown'),
            'url': 'https://www.reddit.com' + pd.get('permalink', ''),
            'score': pd.get('score', 0),
            'num_comments': pd.get('num_comments', 0),
            'engagement': calculate_engagement(pd),
            'created_utc': pd.get('created_utc', 0),
            'text': pd.get('selftext', '')[:200] + '...' if pd.get('selftext') else ''
        })
        
    # Sort by engagement descending
    valid_posts.sort(key=lambda x: x['engagement'], reverse=True)
    top_5 = valid_posts[:5]
    
    # Save top 5
    out_path = '.tmp/top_5_reddit_fiscal_posts.md'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("# Top 5 Reddit Posts about Fiscal/Tax in Brazil (Past Week)\n\n")
        f.write("Ranked by Total Engagement (Upvotes + Comments)\n\n")
        for i, post in enumerate(top_5, 1):
            date_str = datetime.datetime.fromtimestamp(post['created_utc']).strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"## {i}. {post['title']}\n")
            f.write(f"- **Subreddit**: {post['subreddit']}\n")
            f.write(f"- **Engagement Score**: {post['engagement']} (Upvotes: {post['score']}, Comments: {post['num_comments']})\n")
            f.write(f"- **Date**: {date_str}\n")
            f.write(f"- **Link**: {post['url']}\n")
            if post['text'].strip() != '...':
                f.write(f"- **Preview**: {post['text']}\n")
            f.write("\n")

    print(f"Success! Extracted and wrote {len(top_5)} top posts to {out_path}.")

if __name__ == "__main__":
    main()
