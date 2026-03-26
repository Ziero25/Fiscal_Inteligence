# Directive: Get Top Fiscal Posts in Brazil

## Goal
Fetch the 100 most recent articles, posts, or news related to the fiscal/tax area in Brazil. Evaluate their engagement or relevance (based on available metrics or recency/relevance heuristics) and extract the top 5.

## Inputs
- Search query keywords: "área fiscal Brasil", "reforma tributária", "impostos Brasil", "notícias fiscais"
- Number of posts to fetch: 100
- Number of top posts to extract: 5

## Tools/Scripts to Use
- `execution/get_posts.py`

## Outputs
- A temporary JSON file in `.tmp/fiscal_posts_raw.json` containing the 100 posts.
- A temporary markdown/JSON file `.tmp/top_5_fiscal_posts.md` containing the analyzed top 5 posts.
- Ultimately, deliver the result to the user.

## Edge Cases
- If the search engine does not return exactly 100 posts, retrieve as many as possible up to 100.
- If no engagement metrics are strictly available (since public news APIs might not expose social shares), rank them by a heuristic such as source credibility, keyword relevance, or recency.
