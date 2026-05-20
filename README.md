# Whiteboard App

Application web fullstack de type whiteboard permettant de créer des tableaux de travail infinis, d'y uploader des images, d'ajouter du texte, des dessins et des formes géométriques, et de les manipuler librement.

---

## Démarrage rapide — tester en 3 minutes

```bash
git clone <url-du-repo>
cd whiteboard-app
docker-compose up --build
```

Puis ouvrir **http://localhost** et suivre ces étapes :

1. **Créer un compte** — cliquer sur "Register", entrer un email et mot de passe
2. **Créer un whiteboard** — cliquer sur "Nouveau tableau" dans le Dashboard
3. **Uploader une image** — cliquer sur l'icône image dans la sidebar, choisir un fichier PNG/JPEG/WebP
4. **Manipuler l'image** — déplacer, redimensionner, tourner avec la souris
5. **Ajouter du texte** — appuyer sur `T` ou double-cliquer sur le canvas
6. **Dessiner** — appuyer sur `P` pour le crayon, `R` pour un rectangle, `O` pour une ellipse
7. **Ajuster les propriétés** — sélectionner un élément, le panneau de droite s'affiche
8. **Exporter** — bouton Export PNG ou JPEG dans la sidebar
9. **Naviguer** — molette pour zoomer, clic milieu ou espace+drag pour se déplacer
10. **Annuler** — `Ctrl+Z` à tout moment, `Ctrl+Y` pour refaire

> Toutes les modifications sont sauvegardées automatiquement en base de données.

---

## Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | React + TypeScript + Vite | Typage strict, composants réactifs, build ultra-rapide |
| Canvas | Konva.js (react-konva) | Librairie canvas 2D mature, gestion native drag/resize/rotation, bien documentée |
| Backend | Node.js + Express + TypeScript | Léger, sans surcharge, maîtrisé, suffisant pour une API REST |
| Base de données | SQLite + Prisma 5 | Zéro configuration, fichier unique, Prisma apporte le typage fort et les migrations |
| Auth | JWT + bcryptjs | Standard industrie, stateless, pas de gestion de session côté serveur |
| Stockage images | Système de fichiers + Multer | Simple, suffisant pour ce contexte, facilement remplaçable par S3 |
| Conteneurisation | Docker + Nginx | Lancement en une commande, environnement reproductible sur n'importe quelle machine |

---

## Prérequis

**Option A — Docker (recommandé)**
- Docker >= 24
- Docker Compose >= 2

**Option B — Manuel**
- Node.js >= 18
- npm >= 9

---

## Lancement

### Option A — Docker

```bash
git clone <url-du-repo>
cd whiteboard-app
docker-compose up --build
```

- Frontend : http://localhost
- Backend  : http://localhost:3001

> Si vous modifiez le schéma Prisma, relancez avec :
> ```bash
> docker-compose down -v && docker-compose up --build
> ```

### Option B — Manuel

**Backend**
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
# Démarre sur http://localhost:3001
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# Démarre sur http://localhost:5173
```

---

## Variables d'environnement

Fichier `backend/.env.example` :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret_here"
PORT=3001
```

---

## Architecture

### Flux général

```
Navigateur
    │
    ▼
Nginx (port 80)
    ├── /api/*  ──────────────► Express API (port 3001)
    │                               │
    │                               ├── middleware/auth.ts  (vérif JWT)
    │                               ├── routes/auth.ts      (register/login)
    │                               ├── routes/whiteboards.ts
    │                               ├── routes/images.ts    (upload Multer)
    │                               ├── routes/texts.ts
    │                               ├── routes/drawings.ts
    │                               └── routes/shapes.ts
    │                                       │
    │                                       ▼
    │                               Prisma ORM ──► SQLite (dev.db)
    │                               uploads/     ──► fichiers images
    │
    └── /*      ──────────────► React App (fichiers statiques)
                                    │
                                    ├── Dashboard   (liste whiteboards)
                                    └── Whiteboard  (canvas Konva)
```

### Structure des fichiers

```
whiteboard-app/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # 6 modèles : User, Whiteboard, ImageNode, TextNode, DrawingNode, ShapeNode
│   ├── uploads/                 # Images stockées localement
│   └── src/
│       ├── index.ts             # Point d'entrée Express
│       ├── middleware/
│       │   └── auth.ts          # Vérification JWT sur toutes les routes protégées
│       └── routes/
│           ├── auth.ts          # POST /register, POST /login
│           ├── whiteboards.ts   # CRUD whiteboards
│           ├── images.ts        # Upload + CRUD images par whiteboard
│           ├── texts.ts         # CRUD textes par whiteboard
│           ├── drawings.ts      # CRUD dessins libres par whiteboard
│           └── shapes.ts        # CRUD formes géométriques par whiteboard
└── frontend/
    └── src/
        ├── App.tsx              # Routing entre Dashboard et Whiteboard
        ├── types/index.ts       # Interfaces TypeScript partagées
        ├── hooks/
        │   ├── useAuth.ts       # Gestion token JWT (login/logout/état)
        │   └── useTheme.ts      # Dark / Light mode persisté en localStorage
        ├── services/
        │   └── api.ts           # Toutes les requêtes axios vers le backend
        └── components/
            ├── Auth/LoginPage.tsx
            ├── Dashboard/Dashboard.tsx
            └── Whiteboard/
                ├── Whiteboard.tsx      # Canvas principal, gestion outils, undo/redo
                ├── ImageNode.tsx       # Rendu image avec filtres Konva
                ├── TextNode.tsx        # Texte éditable inline
                ├── DrawingNode.tsx     # Dessin libre (Konva Line)
                ├── ShapeNode.tsx       # Formes géométriques
                ├── Minimap.tsx         # Vue miniature de navigation
                └── PropertiesBar.tsx   # Panneau propriétés contextuel
```

---

## Fonctionnalités

### Authentification
- Inscription et connexion par email / mot de passe
- Token JWT valable 7 jours (session persistante)
- Toutes les routes API sont protégées

### Dashboard
- Liste de tous les whiteboards de l'utilisateur avec statistiques (nb images, textes)
- Créer, renommer, supprimer un whiteboard
- Mode clair / sombre, sauvegardé en localStorage

### Canvas Whiteboard
- Zone de travail infinie (pan + zoom molette)
- Grille de points animée en arrière-plan
- Minimap de navigation
- Undo / Redo complet (Ctrl+Z / Ctrl+Y) — historique toutes catégories d'éléments
- Sauvegarde automatique à chaque modification

### Outils disponibles

| Outil | Raccourci | Description |
|-------|-----------|-------------|
| Sélection | V | Déplacer, redimensionner, tourner un élément |
| Crayon | P | Dessin libre lisse |
| Rectangle | R | Tracer un rectangle |
| Ellipse | O | Tracer une ellipse |
| Flèche | A | Tracer une flèche |
| Image | — | Upload PNG / JPEG / WebP |
| Texte | T | Ajouter du texte, double-clic pour éditer inline |

### Actions sur les éléments
- Avancer / Reculer dans l'ordre d'affichage (zIndex)
- Dupliquer (Ctrl+D)
- Verrouiller / Déverrouiller (L)
- Supprimer (Suppr)

### Panneau de propriétés
- **Image** : brightness, contrast, blur, opacity, grayscale, sepia
- **Texte** : fontFamily, fontStyle, align, color, fontSize
- **Dessin** : color, strokeWidth, opacity
- **Forme** : stroke, fill, strokeWidth, opacity

### Export
- Export du whiteboard en PNG et JPEG

### Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| V / P / R / O / A / T | Changer d'outil |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+D | Dupliquer la sélection |
| L | Verrouiller / Déverrouiller |
| Suppr | Supprimer la sélection |
| Échap | Désélectionner |
| ? | Afficher l'aide des raccourcis |
| Double-clic canvas | Ajouter un texte |

---

## Limites connues

- Pas de collaboration temps réel (un seul utilisateur par whiteboard à la fois)
- Stockage images local — non adapté à un déploiement multi-serveurs ou cloud
- Pas de tests automatisés (unitaires ou d'intégration)
- Pas de pipeline CI/CD

---

## Pistes d'évolution

- **Collaboration temps réel** via WebSocket (Socket.io) — curseurs multiples synchronisés
- **Stockage cloud** des images (AWS S3, Cloudflare R2) pour un déploiement scalable
- **Tests** unitaires (Vitest) et d'intégration (Supertest)
- **CI/CD** avec GitHub Actions (lint, build, tests à chaque push)
- **Export PDF** du whiteboard
- **Partage public** d'un whiteboard en lecture seule via lien
