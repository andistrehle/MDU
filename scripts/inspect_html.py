#!/usr/bin/env python3
"""Fetch one page and dump the raw HTML around the player table."""
import urllib.request

url = "https://dartunion.de/player_main_public.php?ddSelectTeam=67"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode("utf-8", errors="replace")

# Find the section with "Spieler" or player table
idx = html.find("Spieler")
if idx >= 0:
    print("=== AROUND 'Spieler' ===")
    print(html[max(0,idx-200):idx+500])

# Also find any table
idx2 = html.find("<table")
while idx2 >= 0:
    end = html.find("</table>", idx2)
    snippet = html[idx2:end+8] if end >= 0 else html[idx2:idx2+1000]
    if "MDU" in snippet or "Nachname" in snippet or "Spieler" in snippet:
        print("\n=== TABLE CONTAINING MDU/Nachname ===")
        print(snippet[:2000])
        break
    idx2 = html.find("<table", idx2+1)
