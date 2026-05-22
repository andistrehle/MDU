#!/usr/bin/env python3
"""
Convert scripts/players_scraped.json → TypeScript Player[] and TeamPlayerAssignment[] entries.

Usage: python scripts/generate_player_ts.py
Outputs: scripts/players_generated.ts
"""
import json
import re
import unicodedata
from pathlib import Path

def slugify(s):
    """Convert 'Max Müller' to 'max-mueller'."""
    # Normalize unicode (ü→ue, ö→oe, ä→ae, ß→ss)
    replacements = {"ü":"ue","Ü":"ue","ö":"oe","Ö":"oe","ä":"ae","Ä":"ae","ß":"ss",
                    "é":"e","è":"e","ê":"e","à":"a","â":"a","î":"i","ô":"o","û":"u",
                    "ç":"c","ñ":"n"}
    result = s
    for k, v in replacements.items():
        result = result.replace(k, v)
    # Remove remaining non-ASCII
    result = unicodedata.normalize('NFKD', result).encode('ascii', 'ignore').decode('ascii')
    # lowercase, replace spaces/dots/commas with hyphens
    result = re.sub(r"[^a-z0-9]+", "-", result.lower()).strip("-")
    return result

def make_player_id(first, last, team_slug, existing_ids):
    """Generate a unique player id slug."""
    base = slugify(f"{first}-{last}")
    if base not in existing_ids:
        return base
    # If collision, append team suffix
    suffixed = f"{base}-{team_slug.split('-')[0]}"
    if suffixed not in existing_ids:
        return suffixed
    # If still collision, add a number
    i = 2
    while f"{base}-{i}" in existing_ids:
        i += 1
    return f"{base}-{i}"

def title_case_name(s):
    """Properly title-case a name, handling particles."""
    parts = s.split()
    result = []
    for p in parts:
        if p.lower() in ("de", "van", "von", "der", "den", "te", "ten"):
            result.append(p.lower())
        else:
            result.append(p.capitalize())
    return " ".join(result)

def escape_ts(s):
    return s.replace("'", "\\'").replace('"', '\\"')

def main():
    data_path = Path("scripts/players_scraped.json")
    if not data_path.exists():
        print("ERROR: scripts/players_scraped.json not found. Run scrape_players.py first.")
        return

    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)

    # Team slug → league mapping (for comments)
    TEAM_LEAGUES = {
        "spartans": "La Liga",
        "ohne-jackie": "La Liga",
        "dc-null-bull": "La Liga",
        "jolly-pirates-kts": "La Liga",
        "les-dartagnons": "La Liga",
        "no-maam": "La Liga",
        "alptraum": "A1 Liga",
        "dc-animals-ii": "A1 Liga",
        "gambas": "A1 Liga",
        "spartans-vi": "A1 Liga",
        "sound-warriors": "A1 Liga",
        "game-over": "A1 Liga",
        "treff-nix-freimann": "A2 Liga",
        "silberpfeile-ii": "A2 Liga",
        "jolly-pirates-v": "A2 Liga",
        "de-wolperdinga": "A2 Liga",
        "oldies-co": "A2 Liga",
        "flying-fighters": "B1 Liga",
        "master-of-desaster": "B1 Liga",
        "flying-seven": "B1 Liga",
        "lucky-darts-one": "B1 Liga",
        "de-hutzeldarter": "B1 Liga",
        "massl-ghabt": "B1 Liga",
        "belfort-evolution": "B2 Liga",
        "fiaker-deife": "B2 Liga",
        "freibad-bazis": "B2 Liga",
        "team-desaster": "B2 Liga",
        "dc-dark-angels": "B2 Liga",
        "de-vogelwuidn": "B2 Liga",
        "wild-indians": "C Liga",
        "muenchen-0815": "C Liga",
        "lucky-darts-two": "C Liga",
        "funny-darters": "C Liga",
        "black-devils": "C Liga",
        "fuenf-sterne-boazn": "C Liga",
    }

    TEAM_NAMES = {
        "spartans": "SPARTANS",
        "ohne-jackie": "OHNE JACKIE",
        "dc-null-bull": "DC NULL BULL",
        "jolly-pirates-kts": "JOLLY PIRATES KT'S",
        "les-dartagnons": "LES DARTAGNONS",
        "no-maam": "NO MA'AM",
        "alptraum": "ALPTRAUM",
        "dc-animals-ii": "DC ANIMALS II",
        "gambas": "GAMBAS",
        "spartans-vi": "SPARTANS VI",
        "sound-warriors": "SOUND WARRIOR'S",
        "game-over": "GAME OVER",
        "treff-nix-freimann": "TREFF NIX FREIMANN",
        "silberpfeile-ii": "SILBERPFEILE II",
        "jolly-pirates-v": "JOLLY PIRATES V",
        "de-wolperdinga": "DE WOLPERDINGA",
        "oldies-co": "OLDIES & CO",
        "flying-fighters": "FLYING FIGHTERS",
        "master-of-desaster": "MASTER OF DESASTER",
        "flying-seven": "FLYING SEVEN",
        "lucky-darts-one": "LUCKY DARTS ONE",
        "de-hutzeldarter": "DE HUTZELDARTER",
        "massl-ghabt": "MASSL GHABT",
        "belfort-evolution": "BELFORT EVOLUTION",
        "fiaker-deife": "FIAKER DEIFE",
        "freibad-bazis": "FREIBAD BAZIS",
        "team-desaster": "TEAM DESASTER",
        "dc-dark-angels": "DC DARK ANGELS",
        "de-vogelwuidn": "DE VOGELWUID'N",
        "wild-indians": "WILD INDIANS",
        "muenchen-0815": "MÜNCHEN 08/15",
        "lucky-darts-two": "LUCKY DARTS TWO",
        "funny-darters": "FUNNY DARTERS MUNICH",
        "black-devils": "BLACK DEVILS",
        "fuenf-sterne-boazn": "5 STERNE BOAZN TEAM",
    }

    # Build PLAYERS array and TEAM_PLAYER_ASSIGNMENTS
    all_player_ids = {}  # player_slug → Player record
    player_id_set = set()
    assignments = []

    players_by_team = {}  # team_slug → list of (player_id, Player, isCaptain)

    for team_slug, players in data.items():
        if not players:
            players_by_team[team_slug] = []
            continue
        team_entries = []
        for p in players:
            first = title_case_name(p["firstName"])
            last = title_case_name(p["lastName"])
            pid = make_player_id(first, last, team_slug, player_id_set)
            player_id_set.add(pid)
            player_rec = {
                "id": pid,
                "firstName": first,
                "lastName": last,
                "licenseNumber": p["licenseNumber"],
                "status": "active",
            }
            all_player_ids[pid] = player_rec
            team_entries.append((pid, player_rec, p["isCaptain"]))
        players_by_team[team_slug] = team_entries

    # Generate players.ts content
    players_lines = []
    players_lines.append("// ============================================================")
    players_lines.append("// Players — Münchner Dart Union")
    players_lines.append("// ============================================================")
    players_lines.append("//")
    players_lines.append("// Source: dartunion.de/player_main_public.php?ddSelectTeam=XX")
    players_lines.append("// Scraped: 22.05.2026")
    players_lines.append("//")
    players_lines.append("// DO NOT invent or add players not verified from dartunion.de.")
    players_lines.append("//")
    players_lines.append("// ============================================================")
    players_lines.append("")
    players_lines.append("export type PlayerStatus = 'active' | 'inactive' | 'substitute' | 'unknown';")
    players_lines.append("")
    players_lines.append("export interface Player {")
    players_lines.append("  /** Unique slug identifier (e.g. 'max-mustermann') */")
    players_lines.append("  id: string;")
    players_lines.append("  firstName: string;")
    players_lines.append("  lastName: string;")
    players_lines.append("  /** Optional display name override (e.g. nickname). Falls back to \"firstName lastName\". */")
    players_lines.append("  displayName?: string;")
    players_lines.append("  /** License number as shown on dartunion.de, e.g. \"MDU 26 2003\". Null if unavailable. */")
    players_lines.append("  licenseNumber?: string;")
    players_lines.append("  status: PlayerStatus;")
    players_lines.append("}")
    players_lines.append("")
    players_lines.append("// ── Player roster — Saison 2026 ──────────────────────────────")
    players_lines.append("export const PLAYERS: Player[] = [")

    # Group by league for comments
    current_league = None
    TEAM_ORDER = [
        "spartans","ohne-jackie","dc-null-bull","jolly-pirates-kts","les-dartagnons","no-maam",
        "alptraum","dc-animals-ii","gambas","spartans-vi","sound-warriors","game-over",
        "treff-nix-freimann","silberpfeile-ii","jolly-pirates-v","de-wolperdinga","oldies-co",
        "flying-fighters","master-of-desaster","flying-seven","lucky-darts-one","de-hutzeldarter","massl-ghabt",
        "belfort-evolution","fiaker-deife","freibad-bazis","team-desaster","dc-dark-angels","de-vogelwuidn",
        "wild-indians","muenchen-0815","lucky-darts-two","funny-darters","black-devils","fuenf-sterne-boazn",
    ]

    for team_slug in TEAM_ORDER:
        if team_slug not in players_by_team:
            continue
        league = TEAM_LEAGUES.get(team_slug, "")
        team_name = TEAM_NAMES.get(team_slug, team_slug.upper())
        entries = players_by_team[team_slug]

        if league != current_league:
            players_lines.append(f"")
            players_lines.append(f"  // ── {league.upper()} ─────────────────────────────────────────────")
            current_league = league

        if entries:
            players_lines.append(f"  // {team_name}")
            for pid, p, is_cap in entries:
                cap_comment = " // TC" if is_cap else ""
                ln_padded = p['licenseNumber'].ljust(16)
                fn = escape_ts(p["firstName"])
                ln = escape_ts(p["lastName"])
                lic = p["licenseNumber"]
                players_lines.append(
                    f"  {{ id: '{pid}', firstName: '{fn}', lastName: '{ln}', "
                    f"licenseNumber: '{lic}', status: 'active' }},{cap_comment}"
                )
        else:
            players_lines.append(f"  // {team_name} — no player data available")

    players_lines.append("];")
    players_lines.append("")
    players_lines.append("/** Returns a player by id, or undefined. */")
    players_lines.append("export function findPlayer(id: string): Player | undefined {")
    players_lines.append("  return PLAYERS.find(p => p.id === id);")
    players_lines.append("}")
    players_lines.append("")
    players_lines.append("/**")
    players_lines.append(" * Returns the display name for a player.")
    players_lines.append(" * Uses player.displayName if set, otherwise \"firstName lastName\".")
    players_lines.append(" */")
    players_lines.append("export function getPlayerDisplayName(player: Player): string {")
    players_lines.append("  return player.displayName ?? `${player.firstName} ${player.lastName}`.trim();")
    players_lines.append("}")

    # Generate assignment snippet
    assign_lines = []
    assign_lines.append("")
    assign_lines.append("// ── Team-player assignments · Saison 2026 ────────────────────")
    assign_lines.append("// Source: dartunion.de · scraped 22.05.2026")
    assign_lines.append("// isCaptain confirmed from dartunion.de Kapitän column.")
    assign_lines.append("export const TEAM_PLAYER_ASSIGNMENTS: TeamPlayerAssignment[] = [")

    current_league = None
    for team_slug in TEAM_ORDER:
        if team_slug not in players_by_team:
            continue
        league = TEAM_LEAGUES.get(team_slug, "")
        team_name = TEAM_NAMES.get(team_slug, team_slug.upper())
        entries = players_by_team[team_slug]

        if league != current_league:
            assign_lines.append(f"")
            assign_lines.append(f"  // ── {league.upper()} ─────────────────────────────────────────────")
            current_league = league

        if entries:
            assign_lines.append(f"  // {team_name}")
            # Short prefix for assignment id
            prefix_map = {
                "spartans": "spa", "ohne-jackie": "oj", "dc-null-bull": "dnb",
                "jolly-pirates-kts": "jpk", "les-dartagnons": "ld", "no-maam": "nm",
                "alptraum": "alt", "dc-animals-ii": "dca", "gambas": "gmb",
                "spartans-vi": "sp6", "sound-warriors": "sow", "game-over": "gmo",
                "treff-nix-freimann": "tnf", "silberpfeile-ii": "sil", "jolly-pirates-v": "jpv",
                "de-wolperdinga": "dwp", "oldies-co": "old",
                "flying-fighters": "flf", "master-of-desaster": "mod", "flying-seven": "fl7",
                "lucky-darts-one": "ld1", "de-hutzeldarter": "dhd", "massl-ghabt": "msg",
                "belfort-evolution": "bev", "fiaker-deife": "fdf", "freibad-bazis": "fbb",
                "team-desaster": "tds", "dc-dark-angels": "dda", "de-vogelwuidn": "dvn",
                "wild-indians": "wid", "muenchen-0815": "m08", "lucky-darts-two": "ldt",
                "funny-darters": "fd", "black-devils": "blk", "fuenf-sterne-boazn": "fsb",
            }
            pfx = prefix_map.get(team_slug, team_slug[:3])
            for pid, p, is_cap in entries:
                cap_str = "true " if is_cap else "false"
                assign_id = f"tpa-2026-{pfx}-{pid}"
                assign_lines.append(
                    f"  {{ id: '{assign_id}', seasonId: 'season-2026', teamId: '{team_slug}', "
                    f"playerId: '{pid}', status: 'active', isCaptain: {cap_str} }},"
                )
        else:
            assign_lines.append(f"  // {team_name} — no player data available")

    assign_lines.append("];")

    # Write output
    out_path = Path("scripts/players_generated.ts")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(players_lines))
        f.write("\n\n// === ASSIGNMENTS SNIPPET (paste into assignments.ts) ===\n")
        f.write("\n".join(assign_lines))
        f.write("\n")

    total_players = sum(len(v) for v in players_by_team.values())
    print(f"Generated {out_path}")
    print(f"Total players: {total_players} across {len(players_by_team)} teams")

if __name__ == "__main__":
    main()
