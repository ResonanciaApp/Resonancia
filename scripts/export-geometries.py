#!/usr/bin/env python3
"""
Exporta todas las geometrías de Geometrix como archivos SVG individuales
y los empaca en un ZIP listo para descargar.
"""

import math, os, zipfile

C = 50
TARGET_EXTENT = 39
EXTENTS = {
    "caleidoscopio": 44, "flor-vida": 36, "semilla-vida": 39, "vesica": 36,
    "metatron": 40, "merkaba": 40, "sri-yantra": 47, "toroide": 43,
    "mandala": 46, "espiral": 47, "pentagrama": 46, "hexagrama": 45,
    "triquetra": 40, "arbol-vida": 47, "fruto-vida": 39, "huevo-vida": 41,
    "cubo-vida": 36, "octagrama": 46, "eneagrama": 47, "nudo-celta": 40,
    "yin-yang": 46, "circulos": 46, "loto": 46, "cuadrado": 40,
    "circulo": 42, "triangulo": 44, "tetraedro": 44, "hexaedro": 40,
    "octaedro": 42, "icosaedro": 43, "dodecaedro": 44, "cuboctaedro": 40,
    "espiral-fibonacci": 47, "decagrama": 46, "cruz-solar": 42,
    "roseta-ocho": 46, "vector-equilibrium": 40, "metatron-expandido": 45,
    "torus-infinito": 45, "ivm": 40, "estrella-tetraedrica": 44,
    "hexagono-sagrado": 42, "estrella-12": 46, "estrella": 46,
}

NAMES = {
    "caleidoscopio": "Caleidoscopio", "flor-vida": "Flor de la Vida",
    "semilla-vida": "Semilla de la Vida", "vesica": "Vesica Piscis",
    "metatron": "Cubo de Metatron", "merkaba": "Merkaba",
    "sri-yantra": "Sri Yantra", "toroide": "Toroide",
    "mandala": "Mandala", "espiral": "Espiral Logaritmica",
    "pentagrama": "Pentagrama", "hexagrama": "Hexagrama",
    "triquetra": "Triquetra", "arbol-vida": "Arbol de la Vida",
    "fruto-vida": "Fruto de la Vida", "huevo-vida": "Huevo de la Vida",
    "cubo-vida": "Cubo de la Vida", "octagrama": "Octagrama",
    "eneagrama": "Eneagrama", "nudo-celta": "Nudo Celta",
    "yin-yang": "Yin Yang", "circulos": "Circulos Concentricos",
    "loto": "Loto", "cuadrado": "Cuadrado", "circulo": "Circulo",
    "triangulo": "Triangulo", "tetraedro": "Tetraedro",
    "hexaedro": "Hexaedro (Cubo)", "octaedro": "Octaedro",
    "icosaedro": "Icosaedro", "dodecaedro": "Dodecaedro",
    "cuboctaedro": "Cuboctaedro", "espiral-fibonacci": "Espiral Fibonacci",
    "decagrama": "Decagrama", "cruz-solar": "Cruz Solar",
    "roseta-ocho": "Roseta de Ocho", "vector-equilibrium": "Vector Equilibrium",
    "metatron-expandido": "Metatron Expandido", "torus-infinito": "Torus Infinito",
    "ivm": "IVM (Lattice Isotropica)", "estrella-tetraedrica": "Estrella Tetraedrica",
    "hexagono-sagrado": "Hexagono Sagrado", "estrella-12": "Estrella de 12 Puntas",
    "estrella": "Estrella (Heptagrama)",
}

CATEGORIES = {
    "caleidoscopio": "formas", "flor-vida": "sagradas", "semilla-vida": "sagradas",
    "vesica": "sagradas", "metatron": "sagradas", "merkaba": "sagradas",
    "sri-yantra": "sagradas", "toroide": "sagradas", "mandala": "sagradas",
    "espiral": "sagradas", "pentagrama": "sagradas", "hexagrama": "sagradas",
    "triquetra": "sagradas", "arbol-vida": "sagradas", "fruto-vida": "sagradas",
    "huevo-vida": "sagradas", "cubo-vida": "sagradas", "octagrama": "formas",
    "eneagrama": "sagradas", "nudo-celta": "sagradas", "yin-yang": "sagradas",
    "circulos": "formas", "loto": "sagradas", "cuadrado": "formas",
    "circulo": "formas", "triangulo": "formas", "tetraedro": "poliedros",
    "hexaedro": "poliedros", "octaedro": "poliedros", "icosaedro": "poliedros",
    "dodecaedro": "poliedros", "cuboctaedro": "poliedros",
    "espiral-fibonacci": "formas", "decagrama": "formas", "cruz-solar": "formas",
    "roseta-ocho": "formas", "vector-equilibrium": "poliedros",
    "metatron-expandido": "sagradas", "torus-infinito": "sagradas",
    "ivm": "poliedros", "estrella-tetraedrica": "poliedros",
    "hexagono-sagrado": "sagradas", "estrella-12": "formas", "estrella": "formas",
}

def pt(r, angle_deg, cx=C, cy=C):
    a = math.radians(angle_deg)
    return cx + r * math.cos(a), cy + r * math.sin(a)

def poly(r, sides, rot=-90, cx=C, cy=C):
    pts = []
    for i in range(sides):
        x, y = pt(r, rot + i * 360 / sides, cx, cy)
        pts.append(f"{x:.2f},{y:.2f}")
    return " ".join(pts)

def lattice(R, rings, angle_deg=0):
    pts = []
    a = math.radians(angle_deg)
    ax = (R * math.cos(a), R * math.sin(a))
    bx = (R * math.cos(math.pi/3 + a), R * math.sin(math.pi/3 + a))
    for i in range(-rings, rings+1):
        for j in range(-rings, rings+1):
            dist = (abs(i) + abs(j) + abs(i+j)) / 2
            if dist <= rings:
                pts.append((C + i*ax[0] + j*bx[0], C + i*ax[1] + j*bx[1]))
    return pts

def circle(cx, cy, r, **attrs):
    a = " ".join(f'{k}="{v}"' for k,v in attrs.items())
    return f'<circle cx="{cx:.4f}" cy="{cy:.4f}" r="{r:.4f}"{" " + a if a else ""}/>'

def line(x1, y1, x2, y2, **attrs):
    a = " ".join(f'{k}="{v}"' for k,v in attrs.items())
    return f'<line x1="{x1:.4f}" y1="{y1:.4f}" x2="{x2:.4f}" y2="{y2:.4f}"{" " + a if a else ""}/>'

def polygon(points, **attrs):
    a = " ".join(f'{k}="{v}"' for k,v in attrs.items())
    return f'<polygon points="{points}"{" " + a if a else ""}/>'

def path(d, **attrs):
    a = " ".join(f'{k}="{v}"' for k,v in attrs.items())
    return f'<path d="{d}"{" " + a if a else ""}/>'

def ellipse(cx, cy, rx, ry, transform="", **attrs):
    t = f' transform="{transform}"' if transform else ""
    a = " ".join(f'{k}="{v}"' for k,v in attrs.items())
    return f'<ellipse cx="{cx:.4f}" cy="{cy:.4f}" rx="{rx:.4f}" ry="{ry:.4f}"{t}{" " + a if a else ""}/>'

def glyph_elements(gid, sw):
    elems = []
    hw = sw * 0.5

    if gid == "caleidoscopio":
        r = 44
        for ri in [8, 16, 24, 32, 40]:
            elems.append(f'<circle cx="{C}" cy="{C}" r="{ri}" opacity="0.4"/>')
        for i in range(12):
            a = i * math.pi / 6
            x2, y2 = C + r * math.cos(a), C + r * math.sin(a)
            elems.append(f'<line x1="{C}" y1="{C}" x2="{x2:.2f}" y2="{y2:.2f}" opacity="0.3"/>')
        elems.append(circle(C, C, r))
        elems.append(circle(C, C, r * 0.55))
        elems.append(circle(C, C, r * 0.25))

    elif gid == "flor-vida":
        cs = lattice(11, 2, -30)
        for x, y in cs:
            elems.append(circle(x, y, 11))
        elems.append(circle(C, C, 33))
        elems.append(circle(C, C, 36))

    elif gid == "semilla-vida":
        cs = lattice(13, 1, -30)
        for x, y in cs:
            elems.append(circle(x, y, 13))
        elems.append(circle(C, C, 39))

    elif gid == "vesica":
        d = 12
        elems.append(circle(C - d, C, 24))
        elems.append(circle(C + d, C, 24))

    elif gid == "metatron":
        D = 16
        centers = [(C, C)]
        for a in [-90, -30, 30, 90, 150, 210]:
            centers.append(pt(D, a))
        for a in [-90, -30, 30, 90, 150, 210]:
            centers.append(pt(2 * D, a))
        lines_inner = []
        for i in range(len(centers)):
            for j in range(i+1, len(centers)):
                lines_inner.append(line(centers[i][0], centers[i][1], centers[j][0], centers[j][1]))
        elems.append(f'<g stroke-width="{hw:.3f}" stroke-opacity="0.5">{"".join(lines_inner)}</g>')
        for x, y in centers:
            elems.append(circle(x, y, D / 2))

    elif gid == "merkaba":
        ups = [line(*pt(40, a), C, C) for a in [-90, 30, 150]]
        dns = [line(*pt(40, a), C, C) for a in [90, 210, 330]]
        elems.append(polygon(poly(40, 3, -90)))
        elems.append(polygon(poly(40, 3, 90)))
        elems.append(f'<g stroke-width="{hw:.3f}" stroke-opacity="0.5">{"".join(ups+dns)}</g>')

    elif gid == "hexagrama":
        elems.append(circle(C, C, 45))
        elems.append(polygon(poly(38, 3, -90)))
        elems.append(polygon(poly(38, 3, 90)))

    elif gid == "sri-yantra":
        for r in [44, 35, 26, 17, 9]:
            elems.append(polygon(poly(r, 3, 90)))
        elems.append(circle(C, C, 47))
        for r in [40, 31, 22, 13]:
            elems.append(polygon(poly(r, 3, -90)))
        elems.append(circle(C, C, 1.8))

    elif gid == "toroide":
        N = 12
        for i in range(N):
            elems.append(f'<ellipse cx="{C}" cy="{C}" rx="43" ry="13" transform="rotate({i*180/N} {C} {C})"/>')
        elems.append(circle(C, C, 5))

    elif gid == "mandala":
        elems.append(circle(C, C, 46))
        elems.append(circle(C, C, 33))
        elems.append(circle(C, C, 6))
        for i in range(12):
            ang = i * 30
            px, py = pt(22, ang)
            elems.append(f'<ellipse cx="{px:.4f}" cy="{py:.4f}" rx="5" ry="12" transform="rotate({ang+90} {px:.4f} {py:.4f})"/>')
        for i in range(12):
            ang = i * 30 + 15
            px, py = pt(39, ang)
            elems.append(f'<ellipse cx="{px:.4f}" cy="{py:.4f}" rx="3.5" ry="8" transform="rotate({ang+90} {px:.4f} {py:.4f})"/>')

    elif gid == "espiral":
        pts = []
        deg = 0
        while deg <= 1080:
            t = math.radians(deg)
            r = 2.0 * math.exp(0.158 * t)
            if r > 47: break
            a = t - math.pi / 2
            pts.append(f"{C + r*math.cos(a):.2f},{C + r*math.sin(a):.2f}")
            deg += 7
        d = "M" + pts[0] + " " + " ".join("L" + p for p in pts[1:])
        elems.append(path(d))

    elif gid == "pentagrama":
        v = [pt(42, -90 + i * 72) for i in range(5)]
        order = [0, 2, 4, 1, 3]
        pts = " ".join(f"{v[i][0]:.2f},{v[i][1]:.2f}" for i in order)
        elems.append(circle(C, C, 46))
        elems.append(polygon(pts))

    elif gid == "triquetra":
        for ang in [-90, 30, 150]:
            x, y = pt(11, ang)
            elems.append(circle(x, y, 20))
        elems.append(circle(C, C, 40))

    elif gid == "arbol-vida":
        nodes = [(50,9),(73,23),(27,23),(73,45),(27,45),(50,56),(73,67),(27,67),(50,78),(50,92)]
        paths_def = [(0,1),(0,2),(1,2),(1,3),(2,4),(1,5),(2,5),(3,4),(3,5),(4,5),
                     (3,6),(4,7),(5,6),(5,7),(5,8),(6,7),(6,8),(7,8),(6,9),(7,9),(8,9),(0,5)]
        ls = [line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1]) for a,b in paths_def]
        elems.append(f'<g stroke-width="{sw*0.55:.3f}" stroke-opacity="0.55">{"".join(ls)}</g>')
        for x, y in nodes:
            elems.append(circle(x, y, 5.5))

    elif gid == "fruto-vida":
        D = 15.5
        centers = [(C, C)]
        for a in [-90, -30, 30, 90, 150, 210]:
            centers.append(pt(D, a))
        for a in [-90, -30, 30, 90, 150, 210]:
            centers.append(pt(2 * D, a))
        for x, y in centers:
            elems.append(circle(x, y, D / 2))

    elif gid == "huevo-vida":
        D = 13
        cs = [pt(D, a) for a in [0, 60, 120, 180, 240, 300]]
        for x, y in cs:
            elems.append(circle(x, y, D))
        elems.append(circle(C, C, 41))

    elif gid == "cubo-vida":
        front = [(25.5,38.5),(61.5,38.5),(61.5,74.5),(25.5,74.5)]
        off = (13, -13)
        back = [(x+off[0], y+off[1]) for x,y in front]
        sq = lambda pts: " ".join(f"{x},{y}" for x,y in pts)
        elems.append(polygon(sq(front)))
        elems.append(polygon(sq(back)))
        for i in range(4):
            elems.append(line(front[i][0], front[i][1], back[i][0], back[i][1]))

    elif gid == "octagrama":
        elems.append(circle(C, C, 46))
        elems.append(polygon(poly(42, 4, -90)))
        elems.append(polygon(poly(42, 4, -45)))

    elif gid == "eneagrama":
        p = [pt(44, -90 + i * 40) for i in range(9)]
        fmt = lambda idx: " ".join(f"{p[i][0]:.2f},{p[i][1]:.2f}" for i in idx)
        elems.append(circle(C, C, 47))
        elems.append(polygon(fmt([0,3,6])))
        elems.append(polygon(fmt([1,4,2,8,5,7])))
        for x, y in p:
            elems.append(circle(x, y, 1.8))

    elif gid == "nudo-celta":
        s = 13
        pts = []
        for deg in range(0, 361, 4):
            t = math.radians(deg)
            x = C + s * (math.sin(t) + 2 * math.sin(2*t))
            y = C + s * (math.cos(t) - 2 * math.cos(2*t))
            pts.append(f"{x:.2f},{y:.2f}")
        d = "M" + pts[0] + " " + " ".join("L" + p for p in pts[1:]) + " Z"
        elems.append(path(d))

    elif gid == "yin-yang":
        elems.append(circle(C, C, 46))
        elems.append(path("M50,4 A23,23 0 0 1 50,50 A23,23 0 0 0 50,96"))
        elems.append(circle(C, 27, 4))
        elems.append(circle(C, 73, 4))

    elif gid == "circulos":
        for r in [10, 20, 30, 40, 46]:
            elems.append(circle(C, C, r))
        elems.append(circle(C, C, 2.5))

    elif gid == "loto":
        elems.append(circle(C, C, 46))
        for i in range(12):
            ang = i * 30
            px, py = pt(30, ang)
            elems.append(f'<ellipse cx="{px:.4f}" cy="{py:.4f}" rx="5" ry="16" transform="rotate({ang+90} {px:.4f} {py:.4f})"/>')
        for i in range(12):
            ang = i * 30 + 15
            px, py = pt(16, ang)
            elems.append(f'<ellipse cx="{px:.4f}" cy="{py:.4f}" rx="3.5" ry="9" transform="rotate({ang+90} {px:.4f} {py:.4f})"/>')
        elems.append(circle(C, C, 5))

    elif gid == "cuadrado":
        elems.append(polygon(poly(40, 4, -45)))

    elif gid == "circulo":
        elems.append(circle(C, C, 42))

    elif gid == "triangulo":
        elems.append(polygon(poly(44, 3, -90)))

    elif gid == "tetraedro":
        verts = [pt(42, -90 + i * 120) for i in range(3)]
        for i in range(3):
            nx, ny = verts[(i+1) % 3]
            x, y = verts[i]
            elems.append(line(x, y, nx, ny))
            elems.append(f'<line x1="{x:.4f}" y1="{y:.4f}" x2="{C}" y2="{C}" stroke-opacity="0.5"/>')
        elems.append(circle(C, C, 3))

    elif gid == "hexaedro":
        v = [pt(37, i * 60 - 30) for i in range(6)]
        for i in range(6):
            nx, ny = v[(i+1) % 6]
            elems.append(line(v[i][0], v[i][1], nx, ny))
        for a, b in [(0,3),(1,4),(2,5)]:
            elems.append(line(v[a][0], v[a][1], v[b][0], v[b][1]))

    elif gid == "octaedro":
        r = 40
        pts_list = [(C, C-r), (C+r, C), (C, C+r), (C-r, C)]
        for i in range(4):
            nx, ny = pts_list[(i+1) % 4]
            elems.append(line(pts_list[i][0], pts_list[i][1], nx, ny))
        elems.append(f'<line x1="{C}" y1="{C-r}" x2="{C}" y2="{C+r}" stroke-opacity="0.5"/>')
        elems.append(f'<line x1="{C-r}" y1="{C}" x2="{C+r}" y2="{C}" stroke-opacity="0.5"/>')
        elems.append(circle(C, C, 3))

    elif gid == "icosaedro":
        top = (C, C - 40)
        bot = (C, C + 40)
        up = [pt(20, -90 + i * 72) for i in range(5)]
        lo = [pt(34, -90 + 36 + i * 72) for i in range(5)]
        ls = []
        for i in range(5):
            ls.append(line(top[0], top[1], up[i][0], up[i][1]))
            nx, ny = up[(i+1) % 5]
            ls.append(line(up[i][0], up[i][1], nx, ny))
            ls.append(line(up[i][0], up[i][1], lo[i][0], lo[i][1]))
            ls.append(line(up[i][0], up[i][1], lo[(i+4)%5][0], lo[(i+4)%5][1]))
        for i in range(5):
            ls.append(line(bot[0], bot[1], lo[i][0], lo[i][1]))
            nx, ny = lo[(i+1) % 5]
            ls.append(line(lo[i][0], lo[i][1], nx, ny))
        elems.extend(ls)
        elems.append(circle(top[0], top[1], 2))
        elems.append(circle(bot[0], bot[1], 2))

    elif gid == "dodecaedro":
        p1 = [pt(15, -90 + i * 72) for i in range(5)]
        p2 = [pt(28, -90 + 36 + i * 72) for i in range(5)]
        p3 = [pt(42, -90 + i * 72) for i in range(5)]
        for ring in [p1, p2, p3]:
            for i in range(5):
                nx, ny = ring[(i+1) % 5]
                elems.append(line(ring[i][0], ring[i][1], nx, ny))
        for i in range(5):
            elems.append(line(p1[i][0], p1[i][1], p2[i][0], p2[i][1]))
        for i in range(5):
            elems.append(line(p2[i][0], p2[i][1], p3[i][0], p3[i][1]))
            elems.append(line(p2[i][0], p2[i][1], p3[(i+1)%5][0], p3[(i+1)%5][1]))

    elif gid == "cuboctaedro":
        outer = [pt(38, i * 60) for i in range(6)]
        inner = [pt(22, i * 60 + 30) for i in range(6)]
        for i in range(6):
            nx, ny = outer[(i+1) % 6]
            elems.append(line(outer[i][0], outer[i][1], nx, ny))
            elems.append(f'<line x1="{outer[i][0]:.4f}" y1="{outer[i][1]:.4f}" x2="{C}" y2="{C}" stroke-opacity="0.4"/>')
        for i in range(6):
            nx, ny = inner[(i+1) % 6]
            elems.append(line(inner[i][0], inner[i][1], nx, ny))
            elems.append(line(outer[i][0], outer[i][1], inner[i][0], inner[i][1]))
        elems.append(circle(C, C, 2.5))

    elif gid == "vector-equilibrium":
        v = [pt(38, i * 60) for i in range(6)]
        for i in range(6):
            nx, ny = v[(i+1) % 6]
            elems.append(line(v[i][0], v[i][1], nx, ny))
            elems.append(line(v[i][0], v[i][1], C, C))
        for i in range(0, 6, 2):
            ax, ay = v[i]; bx, by = v[(i+2) % 6]
            elems.append(f'<line x1="{ax:.4f}" y1="{ay:.4f}" x2="{bx:.4f}" y2="{by:.4f}" stroke-opacity="0.45"/>')
        elems.append(circle(C, C, 38))
        elems.append(circle(C, C, 3))

    elif gid == "espiral-fibonacci":
        def spiral(direction):
            pts = []
            deg = 0
            while deg <= 1080:
                t = math.radians(deg)
                r = 1.9 * math.exp(0.158 * t)
                if r > 46: break
                pts.append(f"{C + r*math.cos(direction*t - math.pi/2):.2f},{C + r*math.sin(direction*t - math.pi/2):.2f}")
                deg += 6
            return "M" + pts[0] + " " + " ".join("L" + p for p in pts[1:])
        elems.append(path(spiral(1)))
        elems.append(f'<path d="{spiral(-1)}" stroke-opacity="0.45"/>')
        elems.append(circle(C, C, 2))

    elif gid == "decagrama":
        elems.append(circle(C, C, 46))
        elems.append(polygon(poly(40, 5, -90)))
        elems.append(polygon(poly(40, 5, -90 + 36)))

    elif gid == "estrella-tetraedrica":
        elems.append(polygon(poly(40, 3, -90)))
        elems.append(polygon(poly(40, 3, 90)))
        elems.append(polygon(poly(20, 3, 90)))
        elems.append(polygon(poly(20, 3, -90)))
        elems.append(circle(C, C, 12))

    elif gid == "estrella-12":
        elems.append(circle(C, C, 46))
        elems.append(polygon(poly(40, 6, -90)))
        elems.append(polygon(poly(40, 6, -60)))
        elems.append(circle(C, C, 3))

    elif gid == "estrella":
        v7 = [pt(40, -90 + i * (360/7)) for i in range(7)]
        order7 = [0, 2, 4, 6, 1, 3, 5]
        pts = " ".join(f"{v7[i][0]:.2f},{v7[i][1]:.2f}" for i in order7)
        elems.append(circle(C, C, 44))
        elems.append(polygon(pts))

    elif gid == "cruz-solar":
        r = 40
        elems.append(circle(C, C, r))
        elems.append(circle(C, C, r * 0.33))
        elems.append(line(C, C - r, C, C + r))
        elems.append(line(C - r, C, C + r, C))

    elif gid == "roseta-ocho":
        elems.append(circle(C, C, 44))
        elems.append(circle(C, C, 5))
        for i in range(8):
            ang = i * 45
            px, py = pt(22, ang)
            elems.append(f'<ellipse cx="{px:.4f}" cy="{py:.4f}" rx="7" ry="19" transform="rotate({ang+90} {px:.4f} {py:.4f})"/>')

    elif gid == "hexagono-sagrado":
        v = [pt(38, i * 60) for i in range(6)]
        for i in range(6):
            nx, ny = v[(i+1) % 6]
            elems.append(line(v[i][0], v[i][1], nx, ny))
        for i in range(6):
            for j in range(i+2, 6):
                if i == 0 and j == 5: continue
                elems.append(f'<line x1="{v[i][0]:.4f}" y1="{v[i][1]:.4f}" x2="{v[j][0]:.4f}" y2="{v[j][1]:.4f}" stroke-opacity="0.45"/>')
        elems.append(circle(C, C, 40))
        elems.append(circle(C, C, 22))
        elems.append(circle(C, C, 3))

    elif gid == "metatron-expandido":
        D = 13
        c0 = (C, C)
        r1 = [pt(D, a) for a in [-90, -30, 30, 90, 150, 210]]
        r2 = [pt(2*D, a) for a in [-90, -30, 30, 90, 150, 210]]
        all_c = [c0] + r1 + r2
        inner = []
        for i in range(len(all_c)):
            for j in range(i+1, len(all_c)):
                inner.append(line(all_c[i][0], all_c[i][1], all_c[j][0], all_c[j][1]))
        r3 = [pt(3*D, a) for a in range(0, 360, 30)]
        ring_lines = []
        for i in range(12):
            nx, ny = r3[(i+1) % 12]
            ring_lines.append(line(r3[i][0], r3[i][1], nx, ny))
        elems.append(f'<g stroke-width="{hw:.3f}" stroke-opacity="0.3">{"".join(inner)}</g>')
        elems.extend(ring_lines)
        for x, y in all_c:
            elems.append(circle(x, y, D / 2))
        for x, y in r3:
            elems.append(circle(x, y, D / 3))

    elif gid == "torus-infinito":
        for i in range(8):
            elems.append(f'<ellipse cx="{C}" cy="{C}" rx="43" ry="12" transform="rotate({i*22.5} {C} {C})"/>')
            elems.append(f'<ellipse cx="{C}" cy="{C}" rx="12" ry="43" transform="rotate({i*22.5} {C} {C})" stroke-opacity="0.5"/>')
        elems.append(circle(C, C, 43))

    elif gid == "ivm":
        R = 12
        pts_list = lattice(R, 3, -30)
        ls = []
        for i in range(len(pts_list)):
            for j in range(i+1, len(pts_list)):
                dx = pts_list[j][0] - pts_list[i][0]
                dy = pts_list[j][1] - pts_list[i][1]
                if math.sqrt(dx*dx + dy*dy) < R * 1.05:
                    ls.append(line(pts_list[i][0], pts_list[i][1], pts_list[j][0], pts_list[j][1]))
        elems.extend(ls)

    return "\n  ".join(elems)

def make_svg(gid):
    extent = EXTENTS.get(gid, 44)
    k = TARGET_EXTENT / extent
    sw = 1.2 / k
    t = C - C * k
    name = NAMES.get(gid, gid)
    cat = CATEGORIES.get(gid, "")

    content = glyph_elements(gid, sw)

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!-- {name} | Categoría: {cat} | Geometrix — RESONANCIA -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="500" height="500">
  <rect width="100" height="100" fill="#0B0F14"/>
  <g
    transform="translate({t:.4f} {t:.4f}) scale({k:.5f})"
    stroke="#BE9650"
    fill="none"
    stroke-width="{sw:.4f}"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
  {content}
  </g>
</svg>'''
    return svg

# Generar todos los SVGs
gids = list(EXTENTS.keys())
output_dir = "/tmp/geometrix-svgs"
os.makedirs(output_dir, exist_ok=True)

for gid in gids:
    try:
        svg = make_svg(gid)
        fname = os.path.join(output_dir, f"{gid}.svg")
        with open(fname, "w", encoding="utf-8") as f:
            f.write(svg)
        print(f"✓ {gid}")
    except Exception as e:
        print(f"✗ {gid}: {e}")

# Empacar en ZIP
zip_path = "geometrix-geometrias.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for gid in gids:
        fname = os.path.join(output_dir, f"{gid}.svg")
        if os.path.exists(fname):
            zf.write(fname, f"geometrix/{gid}.svg")

print(f"\n✅ ZIP generado: {zip_path} ({os.path.getsize(zip_path)//1024} KB)")
print(f"   {len(gids)} geometrías exportadas")
