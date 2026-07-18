import urllib.request
import os

urls = {
    "1_landing_page.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0MzIyZmQzYWMwMGRiNDAxN2NmMjFiZjJkEgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086",
    "2_login_signup.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0MzAxN2NjYmYwMzM4NThlNzYxMjIwOWFjEgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086",
    "3_dashboard.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0MzBlMjNhNzMwNDMxMWQzOGNmMjVlZTgwEgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086",
    "4_new_scan.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0MzQ4Y2M0Y2QwNDMxMWQzOGNmMjVlZTgwEgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086",
    "5_quality_analysis.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0MzQ0NTYyMTEwNWMyZmNhMTgzMjI3MGNlEgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086",
    "6_screening_result.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0MzQ1MjRjOTYwNzc5YmZmYjc2MWQ3ZDQ4EgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086",
    "7_scan_history.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0NDU3Y2VmMWYwMmE5OTY1NmI5MzFkZjI3EgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086",
    "8_health_assistant.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NWM0NDUxYjhiM2EwMzM4NThlNzYxMjIwOWFjEgsSBxD3iLiDzBUYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjY2NzA5NTEwNTE4NTM2OTMyMw&filename=&opi=89354086"
}

output_dir = "original_html"
os.makedirs(output_dir, exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0'}

for name, url in urls.items():
    print(f"Downloading {name}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            with open(os.path.join(output_dir, name), "w", encoding="utf-8") as f:
                f.write(html)
        print(f"Successfully downloaded {name}")
    except Exception as e:
        print(f"Failed to download {name}: {e}")
