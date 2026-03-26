$UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width/1000"
$Query = [uri]::EscapeDataString("(fiscal OR tributário OR imposto OR contabilidade) (brasil OR br)")
$Url = "https://www.reddit.com/search.json?q=$Query&sort=new&t=week&limit=100"

$TmpPath = Join-Path $PSScriptRoot "..\.tmp"
if (-Not (Test-Path $TmpPath)) {
    New-Item -ItemType Directory -Force -Path $TmpPath | Out-Null
}

try {
    Write-Host "Fetching posts from $Url"
    $response = Invoke-RestMethod -Uri $Url -Headers @{"User-Agent"=$UserAgent} -Method Get
} catch {
    Write-Error "Error fetching data: $_"
    exit 1
}

$posts = $response.data.children
Write-Host "Fetched $($posts.Length) posts."

if ($posts.Length -eq 0) {
    Write-Host "No posts found for the query."
    exit 0
}

# Save raw data
$rawPath = Join-Path $TmpPath "reddit_fiscal_posts_raw.json"
$posts | ConvertTo-Json -Depth 10 | Set-Content $rawPath -Encoding UTF8

$validPosts = @()
foreach ($p in $posts) {
    $pd = $p.data
    $score = if ($pd.score) { $pd.score } else { 0 }
    $comments = if ($pd.num_comments) { $pd.num_comments } else { 0 }
    $engagement = $score + $comments
    
    $createdDate = [datetime]::new(1970,1,1,0,0,0,0,'Utc').AddSeconds($pd.created_utc).ToLocalTime()
    $excerpt = if ($pd.selftext) { if ($pd.selftext.Length -gt 200) { $pd.selftext.Substring(0, 200) + '...' } else { $pd.selftext } } else { "" }
    
    $validPosts += [PSCustomObject]@{
        title = $pd.title
        subreddit = $pd.subreddit_name_prefixed
        url = "https://www.reddit.com" + $pd.permalink
        score = $score
        num_comments = $comments
        engagement = $engagement
        created_utc = $createdDate
        text = $excerpt
    }
}

$top5 = $validPosts | Sort-Object -Property engagement -Descending | Select-Object -First 5

$outPath = Join-Path $TmpPath "top_5_reddit_fiscal_posts.md"
$content = "# Top 5 Reddit Posts about Fiscal/Tax in Brazil (Past Week)`n`nRanked by Total Engagement (Upvotes + Comments)`n`n"
$i = 1
foreach ($post in $top5) {
    $dateStr = $post.created_utc.ToString("yyyy-MM-dd HH:mm:ss")
    $content += "## $i. $($post.title)`n"
    $content += "- **Subreddit**: $($post.subreddit)`n"
    $content += "- **Engagement Score**: $($post.engagement) (Upvotes: $($post.score), Comments: $($post.num_comments))`n"
    $content += "- **Date**: $dateStr`n"
    $content += "- **Link**: $($post.url)`n"
    if (![string]::IsNullOrWhiteSpace($post.text)) {
        $content += "- **Preview**: $($post.text.Replace("`n", " "))`n"
    }
    $content += "`n"
    $i++
}

Set-Content $outPath -Value $content -Encoding UTF8
Write-Host "Success! Extracted and wrote $($top5.Count) top posts to $outPath."
