#!/usr/bin/env python3
"""
fetch_player_photos.py — Sprint 4.2
====================================
Downloads publicly visible player photos from dartunion.de and patches
lib/data/players.ts with photoUrl fields.

Usage:
    python scripts/fetch_player_photos.py

What it does:
  1. Uses scraped photo data (licenseNumber → sourceUrl) embedded below.
  2. Matches against PLAYERS in players.ts via licenseNumber (primary) or name.
  3. Downloads photos to public/player-photos/{player-id}.jpg
  4. Writes scripts/player_photos_map.json with the mapping.
  5. Patches lib/data/players.ts to add photoUrl fields.

Only downloads publicly accessible images from dartunion.de.
Does not overwrite existing local photos if already present.
"""

import json
import re
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE_URL = "https://dartunion.de/"
DEFAULT_PHOTO = "images/player/default.png"

# ──────────────────────────────────────────────────────────────────────────────
# SCRAPED DATA: licenseNumber → photo path on dartunion.de
# Source: ranking01.php pages LigaId 88, 89, 90, 91, 92, 94
# ──────────────────────────────────────────────────────────────────────────────

PHOTO_DATA = [
    # ── LA LIGA (LigaId=88) ───────────────────────────────────────────────
    ("MDU 3711",      "ZLATKO LOZANCIC",          "images/player/6900a19b433dd.JPG"),
    ("MDU 3714",      "STEFAN SCHIEGG",            "images/player/690d0753bd160.JPG"),
    ("MDU 26 5512",   "MAXIMILIAN BURGIS",         "images/player/653e480b4b502.JPG"),
    ("MDU 26 6203",   "MARKUS HARTMANN",           "images/player/6734ccfd9784f.JPG"),
    ("MDU 26 6204",   "ANDRE SCHWARZ",             "images/player/5bc4ff314a40d.JPG"),
    ("MDU 26 6205",   "DRAGAN HERCEG",             "images/player/65211f9331e8b.JPG"),
    ("MDU 26 5707",   "THOMAS FRAUNDORFER",        "images/player/691c430cbff9d.JPG"),
    ("MDU 71066",     "PATRICK RUHLAND",           "images/player/6900a23abaa5c.JPG"),
    ("MDU 3703",      "MARKUS SCHNEIDER",          "images/player/690d0685d6cb3.JPG"),
    ("MDU 26 1006",   "AVNI LOSHI",                "images/player/657d8aa59d1a8.JPG"),
    ("MDU 26 5503",   "CLAUS ZIEBUHR",             "images/player/58b7285dc358f.JPG"),
    ("MDU 26 3704",   "NICO VASILIADIS",           "images/player/653159b300151.JPG"),
    ("MDU 7111",      "RICHI PANKRATZ",            "images/player/6900a143b8a95.JPG"),
    ("MDU 26 5510",   "STJEPAN FELJAN",            "images/player/673330fd45a2e.JPG"),
    ("MDU 26 3703",   "SILVI LINDNER",             "images/player/6574aa8b9de75.JPG"),
    ("MDU 26 6201",   "ZLATKO JURIC",              "images/player/5dbee4e3c8003.JPG"),
    ("MDU 26 5502",   "GELI GALATOVIC",            "images/player/653e461fc52e7.JPG"),
    ("MDU 26 1012",   "ZORAN SUBOTIC",             "images/player/692758882a0f1.JPG"),
    ("MDU 26 1007",   "FATMIR HASANAJ",            "images/player/63f8ce7ee4f00.JPG"),
    ("MDU 26 5514",   "FLORIAN PREIS",             "images/player/690d005da2203.JPG"),
    ("MDU 50001",     "TONI BAUER",                "images/player/68f22a0b9b0c9.JPG"),
    ("MDU 1643",      "MANFRED EISCHER",           "images/player/6531552434e0a.JPG"),
    ("MDU 1639",      "BENE WOLF",                 "images/player/6531552cdd2c9.JPG"),
    ("MDU 26 5310",   "ALEXANDER RESCH",           "images/player/6172235ff39d9.JPG"),
    ("MDU 26 3706",   "FLORIAN STECKERMEIER",      "images/player/653154ae08565.JPG"),
    ("MDU 26 6207",   "FLORIAN WIMMER",            "images/player/5bc4ff5e36f0b.JPG"),
    ("MDU 26 1003",   "DADO PAJDAKOVIC",           "images/player/5da2c769819f6.JPG"),
    ("MDU 3713",      "ANDREJ TERESCHENKO",        "images/player/690d072a2caa2.JPG"),
    ("MDU 7107",      "CHRISS LWOWSKI",            "images/player/6900a2b76a85c.JPG"),
    ("MDU 3709",      "DEJAN KOVRILJA",            "images/player/690d07364b302.JPG"),
    ("MDU 26 5507",   "SASCHA BERNARDI",           "images/player/6531547df398f.JPG"),
    ("MDU 26 3702",   "HANSI SLIWANSKI",           "images/player/5bc49e18b3836.JPG"),
    ("MDU 26 1010",   "OORRI ARSEN",               "images/player/67d995ea263dd.JPG"),
    ("MDU 26 5505",   "CHRISTIAN REITER",          "images/player/59f0bde8a0f4f.JPG"),
    ("MDU 26 5309",   "DANIEL RESCH",              "images/player/59f0eec1a7673.JPG"),
    ("MDU 26 1011",   "ARBEN HALITJAHA",           "images/player/67e82fa397fc0.JPG"),
    ("MDU 26 5306",   "ANDREAS KNOBLAUCH",         "images/player/5cb256a5c8e3d.JPG"),
    ("MDU 26 5517",   "MLADEN OBRSTAR",            "images/player/690f60699bb22.JPG"),
    ("MDU 26 3705",   "JASON JEDLICKA",            "images/player/61722c02a3004.JPG"),
    ("MDU 2699",      "CHRIS SCHAEFFER",           "images/player/653154b743aed.JPG"),
    ("MDU 26 1004",   "BOBBY VAYRYNEN",            "images/player/5ce0499b92611.JPG"),
    ("MDU 26 6208",   "MARTIN DEGEL",              "images/player/690d043b74db1.JPG"),
    ("MDU 71099",     "JIMMY POGREMNO",            "images/player/6900a29eedcb4.JPG"),
    ("MDU 26 5511",   "ALEX STRIGL",               "images/player/59f0bdef90f16.JPG"),
    ("MDU 26 5516",   "PHILIPP STEINBRÜCK",        "images/player/680d3a281bca4.JPG"),
    ("MDU 26 6206",   "CHRISTIAN SOWITSCH",        "images/player/6172247acfbb5.JPG"),
    ("MDU 26 5301",   "HUBERT KANDLBINDER",        "images/player/5c55cc1bb6fec.JPG"),
    ("MDU 26 5504",   "STEVEN EISENHOFER",         "images/player/6176475301fd2.JPG"),
    ("MDU 3716",      "DIRK WEGNER",               "images/player/690d06f793555.PNG"),
    ("MDU 3710",      "ANTUN MADAROS",             "images/player/690d0740128cf.JPG"),
    ("MDU 26 5515",   "DIRK STEINBRÜCK",           "images/player/680d39d4d7d1c.JPG"),
    ("MDU 7106",      "ALEX RALL",                 "images/player/672deb6df31af.JPG"),
    ("MDU 7112",      "MARTIN LEHNER",             "images/player/6900a2ac12da4.JPG"),
    ("MDU 1642",      "STEPHAN DUCKE",             "images/player/653155368873d.JPG"),
    ("MDU 26 1001",   "DIETER ROGGE",              "images/player/58a8a33adfc0e.JPG"),
    ("MDU 26 5506",   "JOHANNES SCHWAIGER",        "images/player/62a08ecd6e152.JPG"),
    ("MDU 26 5501",   "MELANIE PREISENDÖRFER",     "images/player/58a8bed227e02.JPG"),
    ("MDU 26 5303",   "INA SCHÄPER",               "images/player/5cb2422934ceb.JPG"),
    ("MDU 7108",      "GUENES CAM",                "images/player/6900a29290c7b.JPG"),
    ("MDU 26 6202",   "WOLFGANG STRAUBINGER",      "images/player/5bc4ff76e4b26.JPG"),
    ("MDU 26 5304",   "THOMAS SAMHUBER",           "images/player/5cb242e4223f7.JPG"),

    # ── PLAYOFFS A LIGA AUFSTIEG (LigaId=89) ──────────────────────────────
    ("MDU 26 4708",   "JÖRG KONRAD",               "images/player/67225eec14817.JPG"),
    ("MDU 26 2008",   "STEFAN PIPEREA",            "images/player/6908d2080b5bc.JPG"),
    ("MDU 26 3305",   "STEFAN ARMBRUSTER",         "images/player/65a25d16db562.JPG"),
    ("MDU 26 2807",   "ZOLTAN TOTH",               "images/player/65686d78784a9.JPG"),
    ("MDU 26 8205",   "MICHAEL DAXENBERGER",       "images/player/5bb4d3e014c5c.JPG"),
    ("MDU 26 2002",   "HANS REINICKE",             "images/player/5bb4d6beaa4f2.JPG"),
    ("MDU 6002",      "AXEL HEIDER",               "images/player/5a093df6ec5c0.PNG"),
    ("MDU 26 8208",   "AXEL HILGER",               "images/player/617227de3549b.JPG"),
    ("MDU 26 6001",   "GERHART ROMBOY",            "images/player/589e1ea9e2754.JPG"),
    ("MDU 26 2801",   "MANUEL BUCHHOLZ",           "images/player/5bc9f81a304dc.JPG"),
    ("MDU 26 2802",   "THOMAS KÜBLBÖCK",           "images/player/5e4aed4f2ca8d.JPG"),
    ("MDU 26 2804",   "MARKUS GRÖTSCH",            "images/player/690dae92ab129.JPG"),
    ("MDU 26 2006",   "SANEL TOKALIC",             "images/player/5be87365a9fc0.JPG"),
    ("MDU 26 8204",   "MAX HOLZHÄUSER",            "images/player/6a2117ff84728.JPG"),
    ("MDU 26 8211",   "MICHAEL PLESA",             "images/player/5bb4d41b7f484.JPG"),
    ("MDU 6006",      "MICHAEL KLOS",              "images/player/59f888d480354.JPG"),
    ("MDU 6008",      "THOMAS HACKL",              "images/player/589e2259e1d76.JPG"),
    ("MDU 6010",      "DOUGLAS KELTERBORN",        "images/player/690dcaf88f50f.JPG"),
    ("MDU 6005",      "HARALD RATHGEB",            "images/player/616fe18f56201.JPG"),
    ("MDU 26 3308",   "SVEN ARMBRUSTER",           "images/player/65a25cf5b45d5.JPG"),
    ("MDU 26 2805",   "MARKUS ATTENBERGER",        "images/player/5da3bc89e94fc.JPG"),
    ("MDU 26 4712",   "LUTZ STOCKNER",             "images/player/6720b143c84fe.JPG"),
    ("MDU 26 8210",   "CHRISTIAN COHNEN",          "images/player/5f4781a05600a.JPG"),
    ("MDU 26 8212",   "HANS ZIEGLER",              "images/player/653f96b41ffe8.JPG"),
    ("MDU 26 2001",   "THOMAS WAGNER",             "images/player/5bb3419a5b1ad.JPG"),
    ("MDU 26 4710",   "PATRICK SPÄTH",             "images/player/6723a2eb9678c.JPG"),
    ("MDU 26 2005",   "RALF SCHRICKER",            "images/player/5bb4d6d7f2a54.JPG"),
    ("MDU 26 2810",   "BERNHARD BRUNNER",          "images/player/5bc9f88f53167.JPG"),
    ("MDU 26 8201",   "MAIK KOENIG",               "images/player/59e4981714074.JPG"),
    ("MDU 26 2003",   "MARTIN HELMBRECHT",         "images/player/5bb4d6a84e998.JPG"),
    ("MDU 26 3304",   "WILLI BLOMANN",             "images/player/5ddc088956433.JPG"),
    ("MDU 26 8206",   "ROBERT PLESA",              "images/player/5bb4d404dee0f.JPG"),
    ("MDU 26 3301",   "HARRY SPITZENBERGER",       "images/player/5b241c24b38ff.JPG"),
    ("MDU 6007",      "ROMANO KASPAR",             "images/player/64180b4b1624d.JPG"),
    ("MDU 26 3302",   "ALINA PREISENDOERFER",      "images/player/65a25d39cf779.JPG"),
    ("MDU 26 8209",   "MARIO BAURIEDL",            "images/player/5bb4d423ec50d.JPG"),
    ("MDU 6009",      "RICKEY EISEB",              "images/player/65211fb1cb252.JPG"),
    ("MDU 26 8203",   "HEIKE SCHWARZ",             "images/player/5bb4d3f8a6d64.JPG"),
    ("MDU 26 8207",   "FRIEDHELM JENEMANN",        "images/player/59f0f3d20cbb9.JPG"),
    ("MDU 26 2809",   "RAINER LANGHOF",            "images/player/634820f1e0144.JPG"),
    ("MDU 26 4702",   "LILO ERNST",                "images/player/6529e8b0732f4.JPG"),
    ("MDU 6004",      "PETER GROSSWIESER",         "images/player/5a093caedf0fa.PNG"),
    ("MDU 26 4709",   "NATASCHA LAUSCH",           "images/player/6720fefe04624.JPG"),

    # ── PLAYOFFS B LIGA AUFSTIEG (LigaId=90) ──────────────────────────────
    ("MDU 26 7907",   "STEFAN WITTECK",            "images/player/67192b16de3d2.JPG"),
    ("MDU 26 5905",   "MANUEL RAUCH",              "images/player/58c5e724b4dc9.JPG"),
    ("MDU 26 4905",   "BERNHARD HOFFMANN",         "images/player/65c9c394614d9.JPG"),
    ("MDU 26 1106",   "DANIEL RICHTER",            "images/player/63726fd77dd95.JPG"),
    ("MDU 26 4908",   "MICHAEL SCHREIL",           "images/player/6527c49955198.JPG"),
    ("MDU 26 7905",   "FRANZ FREINBERGER",         "images/player/670f98aedc31d.JPG"),
    ("MDU 5607",      "THOMAS SCHMID",             "images/player/59f0e7891431b.JPG"),
    ("MDU 26 1109",   "MANFRED KLING",             "images/player/65338ab4c18d2.JPG"),
    ("MDU 26 3805",   "MARKUS KUCHENBAUR",         "images/player/6533992e33e4e.JPG"),
    ("MDU 26 5903",   "MORITZ BECKER",             "images/player/58e7eecca8d38.JPG"),
    ("MDU 26 4909",   "SVEN ALBRECHT",             "images/player/6553409f3c081.JPG"),
    ("MDU 26 4901",   "CHRISTIAN MATEJKA",         "images/player/652120bf08224.JPG"),
    ("MDU 5611",      "BENJAMIN KOUHI",            "images/player/679b88462f551.JPG"),
    ("MDU 26 1107",   "DOMINIK POPPE",             "images/player/5bb4d7d00d6cc.JPG"),
    ("MDU 5609",      "ANDRE WIDL",                "images/player/692840fdea98f.JPG"),
    ("MDU 26 7908",   "PATRICK SCHMELZER",         "images/player/67e31d785929c.JPG"),
    ("MDU 26 5907",   "CHRISTIAN KUNTSCHER",       "images/player/5bdca1f5482d8.JPG"),
    ("MDU 26 1110",   "WALTER STECKERMEIER",       "images/player/690dacfb73d8f.JPG"),
    ("MDU 5604",      "CHRISTIANE KOPP",           "images/player/59f0e734ca168.JPG"),
    ("MDU 26 3804",   "ANDY BENDA",                "images/player/672f8f216f35d.JPG"),
    ("MDU 26 1105",   "GEORG BLEICHER",            "images/player/5da1c45ce8919.JPG"),
    ("MDU 26 7901",   "THOMAS REISINGER",          "images/player/670f96f642e78.JPG"),
    ("MDU 26 3801",   "STEPHANIE VACCARO",         "images/player/65339ce331671.JPG"),
    ("MDU 26 4903",   "JÖRG SCHMIDT",              "images/player/67a7321b53637.JPG"),
    ("MDU 26 1104",   "HEINZ ROGGAN",              "images/player/5dadb731ae016.JPG"),
    ("MDU 26 3811",   "DOMINIK BRENGEL",           "images/player/672f8f00486c1.JPG"),
    ("MDU 26 3808",   "ULI BIBER",                 "images/player/672f8f3e79558.JPG"),
    ("MDU 5606",      "JAN GROVES",                "images/player/5c3a563e831ff.JPG"),
    ("MDU 26 7906",   "STEFAN ZÜCKERT",            "images/player/67192aef71256.JPG"),
    ("MDU 26 5901",   "ANDREAS STREHLE",           "images/player/58b61536e1c87.JPG"),
    ("MDU 26 4904",   "YVES SCHERER",              "images/player/652120ce47a3c.JPG"),
    ("MDU 26 3809",   "PHILIPP URBAN",             "images/player/672f8ed85608d.JPG"),
    ("MDU 26 3813",   "ALEXANDER JAWORECK",        "images/player/65339fb609da6.JPG"),
    ("MDU 26 5908",   "TIM WEBER",                 "images/player/58b616270a07f.JPG"),
    ("MDU 26 7904",   "DANIELA SCHMELZER",         "images/player/690daf0adc189.JPG"),
    ("MDU 5602",      "ANGELA HIRT",               "images/player/65476c35a75b4.JPG"),
    ("MDU 26 1108",   "MARCELLINO BERG",           "images/player/63726fb8c2ff9.JPG"),
    ("MDU 26 3806",   "KLAUS WASNER",              "images/player/65339d771cac0.JPG"),
    ("MDU 26 3814",   "YVES MÜHRER",               "images/player/69ef1f4c0cd65.JPG"),
    ("MDU 26 5902",   "JULIA STREHLE",             "images/player/5f087f2b263f1.JPG"),
    ("MDU 26 3810",   "RALF MÜLLER",               "images/player/690d5ca6e4c29.JPG"),
    ("MDU 26 5904",   "MATTHIAS MAYRING",          "images/player/5da2e41ab8ee5.JPG"),
    ("MDU 26 5906",   "SEBASTIAN ROGGE",           "images/player/58c5e76517a72.JPG"),
    ("MDU 26 1103",   "CHRISTINE PLUTA",           "images/player/65394f9968af4.JPG"),
    ("MDU 26 5909",   "CHRISTOPH PREISS",          "images/player/635d47e4ed469.JPG"),
    ("MDU 5601",      "THOMAS GÄMMERLER",          "images/player/59fccc7b0e058.JPG"),
    ("MDU 26 4902",   "TAMARA KARNOLL",            "images/player/63481911c4f02.JPG"),
    ("MDU 26 7903",   "ERIKA REISINGER",           "images/player/670f97c607e6f.JPG"),

    # ── PLAYOFFS A LIGA ABSTIEG (LigaId=91) ───────────────────────────────
    ("MDU 26 4804",   "FABIAN HILSE",              "images/player/67333cadb510d.JPG"),
    ("MDU 26 8704",   "THORSTEN EDELMANN",         "images/player/672f9b524f73e.JPG"),
    ("MDU 26 8703",   "FLORIAN FINK",              "images/player/5bdc9fc05a7c9.JPG"),
    ("MDU 26 1508",   "REINER SCHLUTOW",           "images/player/591751fcde31b.JPG"),
    ("MDU 26 4803",   "THOMAS HILSE",              "images/player/5e206dcc7ac29.JPG"),
    ("MDU 26 4308",   "MARKUS HECHT",              "images/player/690b3074890b1.JPG"),
    ("MDU 26 4302",   "STEFANO BERNECKER",         "images/player/5bc9d3edd5fde.JPG"),
    ("MDU 26 4307",   "LUDWIG PLOETZ",             "images/player/5bc9d3a466013.JPG"),
    ("MDU 26 8701",   "CHRISTIAN ROCK",            "images/player/58b34bfd672ec.JPG"),
    ("MDU 26 1501",   "ANNETT MEYER",              "images/player/617221efa6314.JPG"),
    ("MDU 26 4801",   "UTE HOFMANN",               "images/player/5a84582153267.JPG"),
    ("MDU 26 1504",   "GABRIELE PINTARIC",         "images/player/672f972bdf2f3.JPG"),
    ("MDU 26 4805",   "DIETHARD ELLING",           "images/player/690e273badd25.JPG"),
    ("MDU 26 8709",   "HERBERT OHLENFORST",        "images/player/69c0e70889f5e.JPG"),
    ("MDU 26 4301",   "THOMAS HOFSTETTER",         "images/player/5f9a9fec388e1.JPG"),
    ("MDU 26 4802",   "PETER SONNTAG",             "images/player/63439e4b2f257.JPG"),
    ("MDU 26 1505",   "MICHAEL SCHÖPPE",           "images/player/58ba1f33aca57.JPG"),
    ("MDU 26 8702",   "CHRISTIAN KABERMANN",       "images/player/5bc0696a62959.JPG"),
    ("MDU 26 4305",   "FRANZ GEGENFURTNER",        "images/player/65330d9c6b1d6.JPG"),
    ("MDU 26 1507",   "BOSKO LEBAR",               "images/player/5a2b8f163fd7f.JPG"),
    ("MDU 26 1506",   "ANDRE MEYER",               "images/player/6172220ccc2f9.JPG"),
    ("MDU 26 8705",   "PHILLIP EDELMANN",          "images/player/67c027dacd414.JPG"),
    ("MDU 26 4303",   "MARTINA BÖKEL",             "images/player/6529ef0f31e71.JPG"),
    ("MDU 26 1509",   "MANUEL SCHÄFFLER",          "images/player/674bae65406c7.JPG"),

    # ── PLAYOFFS B LIGA ABSTIEG (LigaId=92) ───────────────────────────────
    ("MDU 26 5708",   "STEPHAN SOOS",              "images/player/69c0f3a30e59b.JPG"),
    ("MDU 26 3911",   "ARMIN ABRAHAM",             "images/player/690aff8d2f6ca.JPG"),
    ("MDU 26 9806",   "MICHAEL EXNER",             "images/player/59f0cfc9c1cd5.JPG"),
    ("MDU 26 3910",   "DANIEL LEITZE",             "images/player/6915c58273318.JPG"),
    ("MDU 26 9805",   "CHRISTIAN HAUMER",          "images/player/672caa1a881a6.JPG"),
    ("MDU 26 8504",   "ROBERT WALTER",             "images/player/6710de368cc26.JPG"),
    ("MDU 26 5706",   "FLORIAN DOSPIL",            "images/player/6533923173a2a.JPG"),
    ("MDU 26 9801",   "TORSTEN BAUER",             "images/player/690d12ed02af8.JPG"),
    ("MDU 26 8501",   "FRANZ EBERL",               "images/player/6710de07bbdfe.JPG"),
    ("MDU 26 7306",   "FLORIAN ERHARD",            "images/player/652f00900fac0.JPG"),
    ("MDU 26 8503",   "JUSTIN-MARCO EBERL",        "images/player/653389ddbccfb.JPG"),
    ("MDU 26 5103",   "BEATRIX PAINTNER-TUITE",    "images/player/65a2ebe01d267.JPG"),
    ("MDU 26 5106",   "FRITZ MÜLLER",              "images/player/5e440e49482e1.JPG"),
    ("MDU 26 7305",   "MARKUS KNIEHL",             "images/player/6529ed84c6a62.JPG"),
    ("MDU 26 7311",   "IOANNIS PECHLIVANIDIS",     "images/player/6555d496871b2.JPG"),
    ("MDU 26 3904",   "SYLWESTER GNATOWSKI",       "images/player/674bb64253e89.JPG"),
    ("MDU 26 7313",   "ERDAL MEMET",               "images/player/6744e09e1a0cb.JPG"),
    ("MDU 26 5109",   "PATRICK MEYER",             "images/player/65a2ec8c0a9af.JPG"),
    ("MDU 26 5701",   "STEFAN FISCHER",            "images/player/65310d26e8a63.JPG"),
    ("MDU 26 3908",   "MARTIN MARCINKO",           "images/player/69f70b19a193e.JPG"),
    ("MDU 26 4004",   "NEBOJSA BOLE PETROVIC",     "images/player/69c3dd34ea422.JPG"),
    ("MDU 26 8502",   "SABINE EBERL",              "images/player/6710dde8bf336.JPG"),
    ("MDU 26 9802",   "MARVIN KOMMESCHER",         "images/player/691a927b3a690.JPG"),
    ("MDU 26 3812",   "STEFAN FRIEDEL",            "images/player/6991b44f59cf1.JPG"),
    ("MDU 26 5712",   "REINER HECKMANN",           "images/player/69ada36989247.JPG"),
    ("MDU 14487",     "MARIO KRAUSS",              "images/player/6533897f0ea06.JPG"),
    ("MDU 26 5704",   "ULI KURZ",                  "images/player/65310d01bd5e4.JPG"),
    ("MDU 26 5107",   "ROBERT HOPPE",              "images/player/65dcbbbb4c96e.JPG"),
    ("MDU 26 3902",   "PETRA BACHMAIR",            "images/player/6533aa58315cc.JPG"),
    ("MDU 26 5105",   "STEFAN ARNOLD",             "images/player/5a7af2e7554a5.JPG"),
    ("MDU 26 7321",   "MICHAEL DÖRNER",            "images/player/6a099b02c962d.JPG"),
    ("MDU 26 5703",   "HELMUT FOLIE",              "images/player/6529e64550635.JPG"),
    ("MDU 26 5108",   "CHRISTOPH LÖB",             "images/player/655516f5a025b.JPG"),
    ("MDU 26 5120",   "HANS BURKHARDT",            "images/player/6792231e195a4.JPG"),
    ("MDU 26 3905",   "PETRA ROHR",                "images/player/68012229e5373.JPG"),
    ("MDU 26 7302",   "ELY REITER",                "images/player/652eff689d7aa.JPG"),
    ("MDU 26 7304",   "DENISE WUDTKE KNIEHL",      "images/player/652effe3ce67c.JPG"),
    ("MDU 26 5710",   "MARKUS HIERMANN",           "images/player/690d7032d15d6.JPG"),
    ("MDU 26 9808",   "ROBERTO ALTAVILLA",         "images/player/697cf188b9dfc.JPG"),
    ("MDU 26 8505",   "KARIN WALTER",              "images/player/69c0f62ce13d6.JPG"),
    ("MDU 26 7301",   "PETER DÜRRBECK",            "images/player/652f00b6ecadf.JPG"),
    ("MDU 26 9804",   "LUCAS RUHLAND",             "images/player/691a92cf4111e.JPG"),
    ("MDU 26 3906",   "RALF SCHWEITZER",           "images/player/5bc49afc98cbd.JPG"),
    ("MDU 26 3907",   "STEVE LEWIK",               "images/player/6533aa744d6ee.JPG"),
    ("MDU 26 3909",   "PAWEL SZYMANSKI",           "images/player/6169b5a918ca0.JPG"),
    ("MDU 26 5702",   "TAMARA WEINBERGER",         "images/player/65310cd813818.JPG"),

    # ── C LIGA (LigaId=94) ─────────────────────────────────────────────────
    ("MDU 26 8907",   "BENJAMIN BAUER",            "images/player/690d0d5454137.JPG"),
    ("MDU 26 8109",   "LINDA MAIER",               "images/player/690b0ce79c40e.JPG"),
    ("MDU 26 6301",   "LUKASZ WIACEK",             "images/player/67193398e5916.JPG"),
    ("MDU 26 6302",   "KOSTAS TSOPANOGLOU",        "images/player/5f9629ca7e28e.JPG"),
    ("MDU 26 8107",   "PETER KEIL",                "images/player/690e4ae6aeddd.JPG"),
    ("MDU 26 6501",   "MARCUS KAMPMANN",           "images/player/65ae5f0eb1166.JPG"),
    ("MDU 26 8905",   "JESSICA VON MAHREN",        "images/player/690aefd1260ed.JPG"),
    ("MDU 26 8904",   "JOHANNA ATTENBERGER",       "images/player/690aef7b4a962.JPG"),
    ("MDU 26 8104",   "MARKUS STEYER",             "images/player/690b0ca872247.JPG"),
    ("MDU 26 6508",   "JÖRG HIRSCHFELD",           "images/player/675730385241d.JPG"),
    ("MDU 26 9007",   "MITA BURDULEA",             "images/player/5c0aeb6549cc1.JPG"),
    ("MDU 26 6507",   "ATHANASIOS KARAGKIOZDIS",   "images/player/654a2ad21edb1.JPG"),
    ("MDU 26 8105",   "STEPHAN BRUNNER",           "images/player/5894e3d141257.JPG"),
    ("MDU 26 9002",   "DANIEL FÖRSTER",            "images/player/58c5e345779d7.JPG"),
    ("MDU 26 9008",   "MARTINA KABILKA",           "images/player/5bb003bd48c8f.JPG"),
    ("MDU 26 8901",   "SUSANNE BAUER",             "images/player/690d1333c1036.JPG"),
    ("MDU 26 2909",   "ALEXANDER LACHNER",         "images/player/68f227ebe48ae.JPG"),
    ("MDU 26 2908",   "ERWIN KAMMERGRUBER",        "images/player/68f228290abbd.JPG"),
    ("MDU 26 2906",   "CHRISTIAN SCHMIDT",         "images/player/690aff5af23c4.JPG"),
    ("MDU 26 9005",   "ALEXANDRA BRUNNER",         "images/player/58c5e2f7a414e.JPG"),
    ("MDU 26 6504",   "DESPINA ASSIMENIDU",        "images/player/654a2a3b45598.JPG"),
    ("MDU 26 2904",   "WOLFGANG RETTKE",           "images/player/690b0b649bd34.JPG"),
    ("MDU 26 6303",   "WALTRAUD KRANABETTER",      "images/player/6366c844d5223.JPG"),
    ("MDU 26 2913",   "STEFAN VEITINGER",          "images/player/68f227fdb8842.JPG"),
    ("MDU 26 8902",   "STEFANIE ATTENBERGER",      "images/player/690aef9562601.JPG"),
    ("MDU 26 9010",   "PETRA RÖDL",                "images/player/654e8b7d1c449.PNG"),
    ("MDU 26 6309",   "MICHAEL GROSS",             "images/player/5f9629f318830.JPG"),
    ("MDU 26 6304",   "HERBERT KRANABETTER",       "images/player/616a9162227b1.JPG"),
    ("MDU 26 6506",   "DIMITRIOS PAPADOPOULOS",    "images/player/654a2aa87c2ac.JPG"),
    ("MDU 26 2901",   "JUTTA LACHNER",             "images/player/68f2271ef2886.JPG"),
    ("MDU 26 9006",   "MARIA HOFNER",              "images/player/58bada350187f.JPG"),
    ("MDU 26 6308",   "ROBERT STELZIG",            "images/player/651d98dd44f04.JPG"),
    ("MDU 26 9009",   "CHRISTOPH WEINBERGER",      "images/player/6530ffdba2ef6.JPG"),
    ("MDU 26 2907",   "STEFAN BAYER",              "images/player/68f2283f201cd.JPG"),
    ("MDU 26 6306",   "ERWIN LISTL",               "images/player/651d98ff50798.JPG"),
    ("MDU 26 6510",   "IANNIS TERTIROGLOU",        "images/player/699593a60157b.JPG"),
    ("MDU 26 9003",   "KARSTEN DASSLER",           "images/player/58c5e3f53ae5c.JPG"),
    ("MDU 26 8106",   "MONIKA MAIER",              "images/player/690b0c7af044f.JPG"),
    ("MDU 26 8113",   "REINHOLD BEHREND",          "images/player/690b0a7b5a0ef.JPG"),
    ("MDU 26 8114",   "EIKE SCHUSTER",             "images/player/69203849aa1c1.JPG"),
    ("MDU 26 6305",   "ANDREAS KIRSCHBAUER",       "images/player/691cd55ec5c27.JPG"),
    ("MDU 26 8908",   "FABIAN MAHR",               "images/player/690d0d1320fb1.JPG"),
    ("MDU 26 9004",   "TORSTEN GRUNER",            "images/player/58c5e2bbcdd20.JPG"),
    ("MDU 26 8112",   "JÜRGEN BAUMSTARK",          "images/player/69183be5ad1b8.JPG"),
    ("MDU 26 8903",   "LEA BAUER",                 "images/player/690d0d2b2b88a.JPG"),
    ("MDU 26 2903",   "SEBASTIAN KADJUREK",        "images/player/68f22738bbd02.JPG"),
    ("MDU 26 9011",   "PATRICIA DUESING",          "images/player/6530ffc432b0f.JPG"),
    ("MDU 26 6509",   "VASSILIOS PAPADOPOULOS",    "images/player/65ae5f1f46bf1.JPG"),
    ("MDU 26 8108",   "ROMAN TREICHEL",            "images/player/58c5ec12bd558.JPG"),
    ("MDU 26 9001",   "MICHAEL BERGER",            "images/player/58c5e43d97dfc.JPG"),
    ("MDU 26 2910",   "STEFAN KUGLER",             "images/player/68f227b286c22.JPG"),
    ("MDU 26 8110",   "NIK PREIS",                 "images/player/690b0cc96960a.JPG"),
    ("MDU 26 2902",   "REBECCA KRANABETTER",       "images/player/68f22758e95e6.JPG"),
    ("MDU 26 8906",   "MICHAELA EXNER",            "images/player/690aeff268a1f.JPG"),
    ("MDU 26 6502",   "MICHAEL SIGL",              "images/player/65363be3a0a13.JPG"),
    ("MDU 26 8115",   "CLAUDIA VASZI",             "images/player/6920388e094e5.JPG"),
]

# ──────────────────────────────────────────────────────────────────────────────

def normalize_license(s: str) -> str:
    return s.strip().upper()

def build_license_map() -> dict:
    """Build licenseNumber → (name, source_path) mapping, deduplicated."""
    result = {}
    for lic, name, path in PHOTO_DATA:
        key = normalize_license(lic)
        if key not in result and path != DEFAULT_PHOTO:
            result[key] = (name, path)
    return result

def parse_players_ts(ts_path: Path) -> list:
    """
    Parse players.ts and return list of dicts with:
      { line_num, id, licenseNumber, raw_line }
    """
    content = ts_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    players = []
    # Match lines like: { id: 'foo', ..., licenseNumber: 'MDU 26 1234', ... }
    id_re = re.compile(r"id:\s*'([^']+)'")
    lic_re = re.compile(r"licenseNumber:\s*'([^']+)'")
    photo_re = re.compile(r"photoUrl:\s*'([^']+)'")

    for i, line in enumerate(lines):
        if "id:" not in line or "firstName:" not in line:
            continue
        id_m = id_re.search(line)
        lic_m = lic_re.search(line)
        if not id_m:
            continue
        players.append({
            "line_num": i,
            "id": id_m.group(1),
            "licenseNumber": normalize_license(lic_m.group(1)) if lic_m else None,
            "has_photo": bool(photo_re.search(line)),
            "raw_line": line,
        })
    return players, lines

def local_ext(source_path: str) -> str:
    """Return lowercase extension: .jpg or .png"""
    if source_path.upper().endswith(".PNG"):
        return ".png"
    return ".jpg"

def download_photo(source_path: str, dest: Path, delay: float = 0.3) -> bool:
    """Download a single photo. Returns True on success."""
    if dest.exists():
        print(f"  [skip] {dest.name} already exists")
        return True
    url = BASE_URL + source_path
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MDUPlatform/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        dest.write_bytes(data)
        print(f"  [ok]   {dest.name} ({len(data)//1024} KB)")
        time.sleep(delay)
        return True
    except Exception as e:
        print(f"  [fail] {source_path}: {e}")
        return False

def patch_players_ts(ts_path: Path, patches: dict) -> int:
    """
    patches: { player_id: photoUrl_string }
    Returns number of lines patched.
    """
    content = ts_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    count = 0
    id_re = re.compile(r"(  \{ id: '([^']+)'.*?)(,?\s*\})(,?)(.*)")

    new_lines = []
    for line in lines:
        if "id:" not in line or "firstName:" not in line:
            new_lines.append(line)
            continue
        id_m = re.search(r"id:\s*'([^']+)'", line)
        if not id_m:
            new_lines.append(line)
            continue
        pid = id_m.group(1)
        if pid not in patches:
            new_lines.append(line)
            continue
        photo_url = patches[pid]
        # Already has photoUrl? skip
        if "photoUrl:" in line:
            new_lines.append(line)
            continue
        # Insert photoUrl before closing }, but after last field
        # Line looks like: { id: '...', ..., status: 'active' },  // TC
        # We insert photoUrl: '...' before the trailing },
        comment_m = re.search(r"(,?\s*)(\}\s*,?\s*)(//.*)?$", line)
        if comment_m:
            before = line[:comment_m.start()]
            trailing_comma = "," if comment_m.group(2).strip().startswith("}") else ""
            comment = f"  {comment_m.group(3)}" if comment_m.group(3) else ""
            closing = comment_m.group(2).rstrip()
            line = f"{before}, photoUrl: '{photo_url}' {closing},{comment}"
        new_lines.append(line)
        count += 1
    ts_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    return count

def main():
    project_root = Path(__file__).parent.parent
    photos_dir = project_root / "public" / "player-photos"
    photos_dir.mkdir(parents=True, exist_ok=True)
    ts_path = project_root / "lib" / "data" / "players.ts"
    map_path = project_root / "scripts" / "player_photos_map.json"

    print("=== MDU Platform — Sprint 4.2: Fetch Player Photos ===\n")

    # Build license → photo mapping
    lic_map = build_license_map()
    print(f"Photo source entries (non-default): {len(lic_map)}")

    # Parse players.ts
    players, _ = parse_players_ts(ts_path)
    print(f"Players in players.ts: {len(players)}\n")

    # Match players to photos via licenseNumber
    matched = []   # (player, source_path, local_name)
    unmatched_players = []

    for p in players:
        lic = p["licenseNumber"]
        if lic and lic in lic_map:
            _, source_path = lic_map[lic]
            ext = local_ext(source_path)
            local_name = f"{p['id']}{ext}"
            matched.append((p, source_path, local_name))
        else:
            unmatched_players.append(p)

    print(f"Matched:   {len(matched)}")
    print(f"Unmatched: {len(unmatched_players)} (no photo or not in active leagues)\n")

    # Download photos
    print("--- Downloading photos ---")
    success_count = 0
    patches = {}  # player_id → /player-photos/filename

    for p, source_path, local_name in matched:
        dest = photos_dir / local_name
        ok = download_photo(source_path, dest)
        if ok:
            success_count += 1
            patches[p["id"]] = f"/player-photos/{local_name}"

    print(f"\nDownloaded: {success_count} / {len(matched)}")

    # Write mapping JSON
    map_out = {pid: url for pid, url in patches.items()}
    map_path.write_text(json.dumps(map_out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote mapping: {map_path}")

    # Patch players.ts
    print("\n--- Patching lib/data/players.ts ---")
    patched = patch_players_ts(ts_path, patches)
    print(f"Patched {patched} player entries with photoUrl.")

    # Summary of unmatched
    if unmatched_players:
        print(f"\n--- Players without photo ({len(unmatched_players)}) ---")
        for p in unmatched_players[:20]:
            lic = p["licenseNumber"] or "no license"
            print(f"  {p['id']} ({lic})")
        if len(unmatched_players) > 20:
            print(f"  ... and {len(unmatched_players)-20} more")

    print("\n✓ Done. Run `npm run dev` to verify.")

if __name__ == "__main__":
    main()
