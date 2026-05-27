import urllib.request, urllib.parse, re, sys

def fetch_ranking(liga_id):
    url = f"https://dartunion.de/ranking01.php?LigaId={liga_id}"
    req = urllib.request.Request(url, method="POST",
          headers={"Content-Type": "application/x-www-form-urlencoded",
                   "User-Agent": "MDU-Platform-Scraper/1.0"},
          data=b"")
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode("latin-1")

def parse_table(html, liga_id):
    # Find table rows with team data
    # dartunion.de ranking table has rows like:
    # <tr> <td>1</td> <td>Team Name</td> <td>Sp.Tage</td> <td>Punkte</td> <td>Spiele</td> <td>Legs</td> <td>g/u/v</td> </tr>
    rows = re.findall(r'<tr[^>]*>([\s\S]*?)</tr>', html, re.IGNORECASE)
    results = []
    for row in rows:
        cells = re.findall(r'<td[^>]*>([\s\S]*?)</td>', row, re.IGNORECASE)
        if len(cells) < 6:
            continue
        # Clean HTML tags from cells
        clean = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
        # Check if first cell is a number (position)
        if not re.match(r'^\d+$', clean[0]):
            continue
        results.append(clean)
    return results

leagues = [
    (88, "la"),
    (89, "playoffs-a-aufstieg"),
    (90, "playoffs-b-aufstieg"),
    (91, "playoffs-a-abstieg"),
    (92, "playoffs-b-abstieg"),
    (94, "c"),
]

for liga_id, name in leagues:
    print(f"\n=== Liga {liga_id} ({name}) ===")
    try:
        html = fetch_ranking(liga_id)
        rows = parse_table(html, liga_id)
        if not rows:
            print("  NO ROWS FOUND")
            # Print a snippet of the HTML to diagnose
            # Find the table area
            tbl = re.search(r'<table[^>]*ranking[^>]*>[\s\S]{0,3000}', html, re.IGNORECASE)
            if tbl:
                print("  TABLE SNIPPET:", tbl.group(0)[:500])
            else:
                print("  HTML SNIPPET:", html[2000:3500])
        else:
            for r in rows:
                print("  ", r)
    except Exception as e:
        print(f"  ERROR: {e}")
