# Directive: Get Top Reddit Fiscal Posts in Brazil

## Goal
Fetch the 100 most recent posts on Reddit related to the fiscal and tax area in Brazil. Evaluate their engagement (upvotes + comments) and extract the top 5 of the week.

## Inputs
- Search query keywords: `fiscal OR tributário OR imposto brasil`
- Target platform: Reddit
- Number of posts to fetch: 100
- Number of top posts to extract: 5

## Tools/Scripts to Use
- `execution/get_reddit_posts.py`

## Outputs
- A temporary JSON file in `.tmp/reddit_fiscal_posts_raw.json` containing the raw posts.
- A temporary markdown file `.tmp/top_5_reddit_fiscal_posts.md` containing the analyzed top 5 posts.
- The results are presented to the user.

## Edge Cases
- Reddit search API may return fewer than 100 posts depending on the volume of the past week.
- If the Reddit API blocks the request, ensure a proper User-Agent header is set.
