#!/usr/bin/env python3
"""
Scrape all MDU player rosters from dartunion.de.
One request at a time with 5s delays to avoid HTTP 429.
Outputs results to scripts/players_scraped.json
"""
import time
import re
import json
import urllib.request
from html import unescape
from math import ceil

DELAY = 5.0  # seconds between requests

# All 35 teams: (team_id_slug, ddSelectTeam)
TEAMS = [
    # La Liga
    ("spartans",           137),
    ("ohne-jackie",        148),
    ("dc-null-bull",        73),
    ("jolly-pirates-kts",   57),
    ("les-dartagnons",      67),
    ("no-maam",            143),
    # A1 Liga
    ("alptraum",           139),
    ("dc-animals-ii",      150),
    ("gambas",              70),
    ("spartans-vi",        157),
    ("sound-warriors",      59),
    ("game-over",           36),
    # A2 Liga
    ("treff-nix-freimann", 118),
    ("silberpfeile-ii",    105),
    ("jolly-pirates-v",     93),
    ("de-wolperdinga",      55),
    ("oldies-co",          109),
    # B1 Liga
    ("flying-fighters",    185),
    ("master-of-desaster", 106),
    ("flying-seven",       193),
    ("lucky-darts-one",     98),
    ("de-hutzeldarter",     49),
    ("massl-ghabt",        187),
    # B2 Liga
    ("belfort-evolution",  125),
    ("fiaker-deife",       189),
    ("freibad-bazis",       89),
    ("team-desaster",      188),
    ("dc-dark-angels",     196),
    ("de-vogelwuidn",      141),
    # C Liga
    ("wild-indians",        90),
    ("muenchen-0815",      153),
    ("lucky-darts-two",    201),
    ("funny-darters",      190),
    ("black-devils",        91),
    ("fuenf-sterne-boazn",  84),
]

BASE = "https://dartunion.de/player_main_public.php"

def fetch_page(team_id, page_num, total_rows):
    if page_num == 0:
        url = f"{BASE}?ddSelectTeam={team_id}"
    else:
        url = f"{BASE}?pageNum_rsPlayer={page_num}&totalRows_rsPlayer={total_rows}&ddSelectTeam={team_id}"

    print(f"  GET {url}", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        # dartunion.de uses ISO-8859-1 (Latin-1) / Windows-1252 encoding
        raw = resp.read()
        return raw.decode("utf-8")

def parse_players(html):
    """
    Extract player rows from id="datatable".
    Row structure: checkbox | image | Nachname | Vorname | Passnr. | Kapitän
    """
    players = []

    # Pagination: "Spieler X bis Y von Z"
    pag = re.search(r'Spieler\s+(\d+)\s+bis\s+(\d+)\s+von\s+(\d+)', html)
    total = int(pag.group(3)) if pag else None

    # Find rows with id="datarow"
    for row_match in re.finditer(r'<tr[^>]*id=["\']datarow["\'][^>]*>(.*?)</tr>', html, re.DOTALL | re.IGNORECASE):
        row_html = row_match.group(1)
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row_html, re.DOTALL | re.IGNORECASE)
        # Columns: 0=checkbox, 1=image, 2=Nachname, 3=Vorname, 4=Passnr., 5=Kapitän
        if len(cells) >= 5:
            last_name  = unescape(re.sub(r'<[^>]+>', '', cells[2])).strip()
            first_name = unescape(re.sub(r'<[^>]+>', '', cells[3])).strip()
            license_nr = unescape(re.sub(r'<[^>]+>', '', cells[4])).strip()
            captain_cell = unescape(re.sub(r'<[^>]+>', '', cells[5])).strip() if len(cells) > 5 else ''
            is_captain = captain_cell.upper() == 'TC'

            if last_name and license_nr:
                players.append({
                    "lastName":     last_name,
                    "firstName":    first_name,
                    "licenseNumber": license_nr,
                    "isCaptain":    is_captain,
                })

    return players, total

def scrape_team(slug, team_id):
    print(f"\n[{slug}] ddSelectTeam={team_id}", flush=True)
    all_players = []

    # Page 0 (first page)
    try:
        html = fetch_page(team_id, 0, None)
    except Exception as e:
        print(f"  ERROR page 1: {e}", flush=True)
        return []

    players, total = parse_players(html)
    all_players.extend(players)
    print(f"  Page 1: {len(players)} players (total={total})", flush=True)

    if total and total > 5:
        num_pages = ceil(total / 5)
        for page in range(1, num_pages):
            time.sleep(DELAY)
            try:
                html = fetch_page(team_id, page, total)
            except Exception as e:
                print(f"  ERROR page {page+1}: {e}", flush=True)
                break
            page_players, _ = parse_players(html)
            all_players.extend(page_players)
            print(f"  Page {page+1}: {len(page_players)} players", flush=True)

    print(f"  => {len(all_players)} total", flush=True)
    return all_players

def main():
    results = {}

    for slug, team_id in TEAMS:
        players = scrape_team(slug, team_id)
        results[slug] = players
        # Save incrementally after each team
        with open("scripts/players_scraped.json", "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"  Saved {len(results)}/{len(TEAMS)} teams", flush=True)
        time.sleep(DELAY)

    print("\nDone! All teams saved to scripts/players_scraped.json")

if __name__ == "__main__":
    main()
