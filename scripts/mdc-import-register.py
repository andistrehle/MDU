#!/usr/bin/env python3
# ============================================================
# MDC — das Passnummern-Register aus der Arbeitsmappe einlesen
# ============================================================
#
# Quelle ist das Blatt „Teilnehmer" der Arbeitsmappe des Betreibers. Es ist
# seit September 2026 die maßgebliche Liste: Wem gehört welche Nummer.
#
#   Aufruf:  python3 scripts/mdc-import-register.py <mappe.xlsm>
#   Braucht: pip install openpyxl
#
# Warum getrennt vom Saison-Import: Das Register gilt für alle Saisons, die
# Ergebnisse gelten je Saison. Wer eine alte Mappe einliest, um eine alte
# Saison nachzutragen, soll damit nicht das aktuelle Register überschreiben.
#
# Gelesen wird Blatt „Teilnehmer", Spalten A–D:
#
#   A  Passnr.   B  Name (Nachname)   C  Vorname   D  Weibl. („x" = Damen)
#
# Zeilen ohne Namen sind freie Nummern — die Mappe hat sie vorgezählt. Sie
# kommen NICHT in die erzeugte Datei; eine Nummer, die dort nicht steht, ist
# frei.
#
# Erzeugt (komplett überschrieben):
#
#   data/register.generated.ts
#
# Das Format ist bewusst dasselbe wie bei einer Ranglistenzeile
# (`data/parse-ranking.ts`), damit Spieler-ID, Spitzname und Schreibweise
# genau so entstehen wie bei allen anderen — Platz, Anzahl TN und Punkte
# stehen auf 0, die kommen aus den Turnieren.
#
#   'Platz|Passnr.|NACHNAME|VORNAME|Anzahl TN|Punkte|%|Trend'
#
# Abgebrochen wird bei allem, was nicht eindeutig ist — lieber kein Import als
# ein stilles Durcheinander im Register:
#
#   • Passnummer doppelt vergeben
#   • Zeile mit Nummer, aber ohne Namen (oder umgekehrt)
#   • Passnummer keine ganze Zahl oder kleiner als 1
# ============================================================

import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit('Fehlt: openpyxl  →  pip install openpyxl')

BLATT = 'Teilnehmer'
ZIEL = Path('data/register.generated.ts')


def leer(wert) -> bool:
    return wert is None or str(wert).strip() == ''


def lies(pfad: Path):
    wb = openpyxl.load_workbook(pfad, data_only=True, read_only=True)
    if BLATT not in wb.sheetnames:
        sys.exit(f'In {pfad.name} gibt es kein Blatt „{BLATT}".')
    ws = wb[BLATT]

    eintraege = []
    gesehen = {}
    frei = 0

    for nr, (passnr, name, vorname, weibl) in enumerate(
        ws.iter_rows(min_row=2, max_col=4, values_only=True), start=2
    ):
        ohne_namen = leer(name) and leer(vorname)
        if leer(passnr) and ohne_namen:
            continue
        if ohne_namen:
            frei += 1
            continue
        if leer(passnr):
            sys.exit(f'Zeile {nr}: Name „{vorname} {name}" ohne Passnummer.')
        if leer(name) or leer(vorname):
            sys.exit(f'Zeile {nr}: Passnr. {passnr} hat nur einen halben Namen.')
        if not isinstance(passnr, int) or passnr < 1:
            sys.exit(f'Zeile {nr}: „{passnr}" ist keine Passnummer.')
        if passnr in gesehen:
            sys.exit(
                f'Zeile {nr}: Passnr. {passnr} steht schon in Zeile {gesehen[passnr]}. '
                'Im Register darf jede Nummer nur einmal vorkommen.'
            )
        gesehen[passnr] = nr

        eintraege.append({
            'passNr': passnr,
            'name': str(name).strip().upper(),
            'vorname': ' '.join(str(vorname).split()).upper(),
            'weiblich': str(weibl).strip().lower() == 'x',
        })

    return sorted(eintraege, key=lambda e: e['passNr']), frei


def zeile(e) -> str:
    return f"0|{e['passNr']}|{e['name']}|{e['vorname']}|0|0||"


def schreibe(eintraege):
    maenner = [e for e in eintraege if not e['weiblich']]
    frauen = [e for e in eintraege if e['weiblich']]
    hoechste = max(e['passNr'] for e in eintraege)
    luecken = hoechste - len(eintraege)

    def block(name, liste, kommentar):
        zeilen = '\n'.join(f"  '{zeile(e)}'," for e in liste)
        return f'/** {kommentar} */\nexport const {name}: string[] = [\n{zeilen}\n];\n'

    inhalt = f'''// ============================================================
// MDC — Passnummern-Register
// ============================================================
//
// ERZEUGT — nicht von Hand bearbeiten. Quelle ist das Blatt „Teilnehmer" der
// Arbeitsmappe des Betreibers, eingelesen mit
// `scripts/mdc-import-register.py`.
//
// Das ist die maßgebliche Antwort auf „wem gehört welche Nummer". Anders als
// die Ranglisten, die immer nur eine Saison beschreiben, gilt das Register
// über alle Saisons: Eine Nummer, die hier steht, gehört dieser Person —
// auch wenn sie noch nie gespielt hat. Eine Nummer, die hier NICHT steht, ist
// frei.
//
// {len(eintraege)} vergebene Nummern, höchste ist die {hoechste},
// {luecken} freie Nummern darunter.
//
// Format wie eine Ranglistenzeile, damit Spieler-ID und Schreibweise genau so
// entstehen wie überall sonst — Platz, Anzahl TN und Punkte stehen auf 0:
//
//   'Platz|Passnr.|NACHNAME|VORNAME|Anzahl TN|Punkte|%|Trend'
// ============================================================

{block('REGISTER_MEN_RAW', maenner, 'Herren mit MDC-Pass, nach Nummer.')}
{block('REGISTER_WOMEN_RAW', frauen, 'Damen mit MDC-Pass, nach Nummer.')}'''

    ZIEL.write_text(inhalt, encoding='utf-8')
    return len(maenner), len(frauen), hoechste, luecken


def main():
    if len(sys.argv) != 2:
        sys.exit('Aufruf: python3 scripts/mdc-import-register.py <mappe.xlsm>')
    pfad = Path(sys.argv[1])
    if not pfad.exists():
        sys.exit(f'Nicht gefunden: {pfad}')

    eintraege, frei = lies(pfad)
    if not eintraege:
        sys.exit(f'Im Blatt „{BLATT}" steht keine einzige Nummer mit Namen.')

    m, w, hoechste, luecken = schreibe(eintraege)
    print(f'gelesen: {len(eintraege)} Nummern ({m} Herren, {w} Damen)')
    print(f'         höchste Nummer {hoechste}, {luecken} Lücken darunter, '
          f'{frei} vorgezählte Leerzeilen in der Mappe')
    print(f'  geschrieben: {ZIEL}')


if __name__ == '__main__':
    main()
