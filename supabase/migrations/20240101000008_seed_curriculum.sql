-- 008_seed_curriculum.sql
-- Seed du programme scolaire ivoirien : 6 chapitres représentatifs + 1 QCM par chapitre.
--
-- Choix pédagogique : on couvre 4 matières (maths, physique-chimie, français, SVT)
-- et 3 niveaux (4ème, 1ère, terminale) pour valider l'arbre /arbre visuellement
-- et tester le pipeline RAG sur des cas variés.
--
-- Les analogies sont volontairement locales (marché de Treichville, gbaka, manguier
-- d'Abidjan) — c'est l'identité du tuteur Djeli.
--
-- IMPORTANT — embeddings :
-- La colonne `embedding` est laissée à NULL ici. La fonction match_curriculum_content
-- filtre sur `embedding IS NOT NULL`, donc le RPC retournera 0 résultat tant que les
-- embeddings ne sont pas remplis. Le fallback non-vectoriel de rag.ts prend alors le
-- relais (filtrage par level + subject), ce qui est suffisant pour les tests.
-- Pour activer la similarité vectorielle, lance `npm run db:embed` une fois que
-- GOOGLE_AI_API_KEY est définie.

-- ============================================================================
-- 1. Contenus pédagogiques
-- ============================================================================

INSERT INTO curriculum_content (level, subject, topic, title, content, source) VALUES

-- Maths 4ème — Pythagore
(
  '4eme',
  'mathematiques',
  'Théorème de Pythagore',
  'Le théorème de Pythagore et ses applications',
  'Le théorème de Pythagore est une des propriétés les plus utilisées en géométrie. Il s''énonce ainsi : dans un triangle rectangle, le carré de la longueur de l''hypoténuse (le côté opposé à l''angle droit) est égal à la somme des carrés des longueurs des deux autres côtés.

Si l''on note a et b les longueurs des deux côtés de l''angle droit et c la longueur de l''hypoténuse, on a : a² + b² = c².

Exemple concret : pour vérifier qu''un mur du marché de Treichville est bien d''équerre, un maçon peut mesurer 3 m sur un côté, 4 m sur l''autre et la diagonale doit faire exactement 5 m, car 3² + 4² = 9 + 16 = 25 = 5². On appelle (3, 4, 5) un triplet pythagoricien.

Réciproque du théorème : si dans un triangle de côtés a, b et c on a a² + b² = c², alors le triangle est rectangle en l''angle opposé au côté c. Cela permet de prouver qu''un triangle est rectangle uniquement à partir des longueurs de ses côtés.

Applications fréquentes : calculer une distance inaccessible (hauteur d''un poteau à partir de son ombre), vérifier l''équerrage d''une construction, calculer la diagonale d''un rectangle.',
  'Programme officiel CI - 4ème'
),

-- Maths 4ème — Proportionnalité
(
  '4eme',
  'mathematiques',
  'Proportionnalité',
  'Tableaux de proportionnalité et coefficient',
  'Deux grandeurs sont proportionnelles lorsque l''on passe des valeurs de l''une aux valeurs de l''autre en multipliant toujours par le même nombre, appelé coefficient de proportionnalité.

Exemple : au marché d''Adjamé, 1 kg de tomates coûte 500 FCFA. Pour 3 kg, on paie 1500 FCFA ; pour 5 kg, on paie 2500 FCFA. Le coefficient de proportionnalité est 500 (le prix au kilo).

Tableau de proportionnalité :
| Masse (kg) | 1   | 3    | 5    |
| Prix (FCFA)| 500 | 1500 | 2500 |

Pour reconnaître un tableau de proportionnalité, on vérifie que tous les quotients d''une ligne par l''autre donnent le même nombre : 1500 / 3 = 500 ; 2500 / 5 = 500. C''est bien proportionnel.

La règle de trois (ou produit en croix) permet de calculer une quatrième valeur manquante. Si 4 cahiers coûtent 1200 FCFA, combien coûtent 7 cahiers ? On a 7 × 1200 / 4 = 2100 FCFA.

Pourcentages : un pourcentage est un cas particulier de proportionnalité où l''on rapporte à 100. 20 % de 1500 FCFA = 1500 × 20 / 100 = 300 FCFA.',
  'Programme officiel CI - 4ème'
),

-- Maths Terminale — Dérivées
(
  'tle',
  'mathematiques',
  'Dérivation',
  'Nombre dérivé et fonction dérivée',
  'La dérivée d''une fonction f en un point a, notée f''(a), représente le coefficient directeur de la tangente à la courbe de f au point d''abscisse a. Géométriquement, c''est la pente de la courbe en ce point.

Définition : f''(a) = lim (h→0) [f(a+h) - f(a)] / h, lorsque cette limite existe.

Interprétation physique : si f(t) représente la position d''un véhicule à l''instant t, alors f''(t) est sa vitesse instantanée. Par exemple, si la position d''un gbaka sur l''autoroute du Nord est donnée par f(t) = 60t (en km, avec t en heures), alors f''(t) = 60 km/h : c''est sa vitesse constante.

Dérivées usuelles à connaître :
- (k)'' = 0 (constante)
- (x)'' = 1
- (xⁿ)'' = n·xⁿ⁻¹
- (1/x)'' = -1/x²
- (√x)'' = 1/(2√x)
- (eˣ)'' = eˣ
- (ln x)'' = 1/x
- (sin x)'' = cos x ; (cos x)'' = -sin x

Règles de calcul : (u + v)'' = u'' + v'' ; (k·u)'' = k·u'' ; (u·v)'' = u''·v + u·v'' ; (u/v)'' = (u''·v - u·v'') / v².

Applications : étudier les variations d''une fonction (f''(x) > 0 ⟹ f croissante), trouver les extremums, optimiser (maximum de bénéfice, minimum de coût).',
  'Programme officiel CI - Terminale C/D'
),

-- Physique-Chimie 1ère — Lois de Newton
(
  '1ere',
  'physique_chimie',
  'Lois de Newton',
  'Les trois lois de Newton : principe d''inertie, principe fondamental, action-réaction',
  'Les trois lois de Newton fondent la mécanique classique. Elles décrivent comment les forces agissent sur le mouvement des objets.

Première loi (principe d''inertie) : tout corps persévère dans son état de repos ou de mouvement rectiligne uniforme si aucune force ne s''exerce sur lui, ou si la somme des forces qui s''exercent sur lui est nulle. Exemple : un sac posé sur un siège de gbaka tend à rester immobile quand le véhicule freine — c''est pour cela que les bagages "avancent" lors d''un freinage brusque.

Deuxième loi (principe fondamental de la dynamique) : la somme des forces exercées sur un objet est égale au produit de sa masse par son accélération. ΣF = m·a. Cette loi est centrale : elle permet de prédire le mouvement à partir des forces, ou inversement de calculer une force à partir d''un mouvement observé. Si une force de 200 N s''exerce sur un cycliste de 50 kg, son accélération est a = 200 / 50 = 4 m/s².

Troisième loi (action-réaction) : à toute action correspond une réaction de même intensité mais de sens opposé. Quand on pousse une charrette au marché, la charrette nous pousse en retour avec la même intensité, mais nous ne reculons pas car nos pieds exercent des forces de frottement sur le sol.

Applications : calcul de trajectoires (chute libre, projectile), étude du freinage, conception de structures.',
  'Programme officiel CI - 1ère D'
),

-- Français 1ère — Subjonctif
(
  '1ere',
  'francais',
  'Le subjonctif',
  'Le mode subjonctif : valeurs et emplois',
  'Le subjonctif est un mode personnel qui exprime généralement une action envisagée, souhaitée, redoutée, hypothétique, ou non encore réalisée — par opposition à l''indicatif qui présente l''action comme un fait réel.

Conjugaison du présent (verbe "que je parle") :
- que je parle, que tu parles, qu''il parle
- que nous parlions, que vous parliez, qu''ils parlent

Emplois principaux :

1. Après les verbes de volonté, sentiment, doute, nécessité :
"Je veux qu''il vienne" — "Il faut que tu travailles" — "Je doute qu''elle réussisse"

2. Après certaines conjonctions : pour que, afin que, bien que, quoique, avant que, à condition que, pourvu que.
"Bien qu''il pleuve, je sors" — "Pourvu qu''il arrive à temps !"

3. Dans les propositions relatives exprimant un souhait, un but ou une caractéristique recherchée :
"Je cherche un livre qui soit facile à lire."

4. En proposition indépendante pour exprimer un ordre à la 3ème personne, un souhait, ou une supposition :
"Qu''il entre !" — "Vive la République !"

Attention au piège : "espérer que" est suivi de l''indicatif ("J''espère qu''il viendra"), mais "souhaiter que" est suivi du subjonctif ("Je souhaite qu''il vienne"). Cette nuance traduit que l''espoir est plus assertif que le souhait.',
  'Programme officiel CI - 1ère'
),

-- SVT 4ème — Reproduction des plantes à fleurs
(
  '4eme',
  'svt',
  'Reproduction des plantes à fleurs',
  'La reproduction sexuée des plantes à fleurs',
  'La fleur est l''organe reproducteur des plantes à fleurs (angiospermes). Elle contient les structures mâles (étamines) et femelles (pistil) nécessaires à la reproduction.

Anatomie d''une fleur typique :
- Le pistil (organe femelle) est composé du stigmate (sommet collant), du style (tige) et de l''ovaire (à la base, contenant les ovules).
- Les étamines (organe mâle) portent au sommet l''anthère qui produit le pollen.
- Les pétales attirent les pollinisateurs par leur couleur et leur parfum.
- Les sépales protègent la fleur en bouton.

La pollinisation est le transport du pollen d''une étamine vers le stigmate d''un pistil. Elle peut être :
- Anémophile : par le vent (graminées, comme le maïs cultivé en région de Bouaké).
- Entomophile : par les insectes (abeilles, papillons), attirés par le nectar.
- Zoogame : par d''autres animaux (oiseaux, chauves-souris).

Après la pollinisation, le grain de pollen germe sur le stigmate et un tube pollinique descend dans le style jusqu''à l''ovule. La fécondation a lieu : un noyau mâle fusionne avec le noyau de l''ovule. L''ovule fécondé devient une graine, et l''ovaire qui le contient devient un fruit.

Exemple local : le manguier (Mangifera indica), très présent à Abidjan, produit des fleurs en panicules. Une fois pollinisées par les insectes, ces fleurs donnent les mangues qui sont vendues en saison sur les marchés.',
  'Programme officiel CI - 4ème'
);

-- ============================================================================
-- 2. Exercices QCM (un par chapitre, difficulté 2-3)
-- ============================================================================

INSERT INTO exercises (content_id, type, difficulty, data)
SELECT id, 'qcm', 2, jsonb_build_object(
  'question', 'Dans un triangle rectangle dont les côtés de l''angle droit mesurent 6 cm et 8 cm, quelle est la longueur de l''hypoténuse ?',
  'options', jsonb_build_array('10 cm', '14 cm', '12 cm', 'Impossible à calculer'),
  'correctIndex', 0,
  'explanation', 'D''après le théorème de Pythagore : c² = 6² + 8² = 36 + 64 = 100, donc c = 10 cm. (6, 8, 10) est un triplet pythagoricien (multiple de 3, 4, 5).'
)
FROM curriculum_content
WHERE level = '4eme' AND subject = 'mathematiques' AND topic = 'Théorème de Pythagore';

INSERT INTO exercises (content_id, type, difficulty, data)
SELECT id, 'qcm', 2, jsonb_build_object(
  'question', 'Si 4 mangues coûtent 600 FCFA, combien coûtent 7 mangues au même prix unitaire ?',
  'options', jsonb_build_array('1050 FCFA', '900 FCFA', '1200 FCFA', '1500 FCFA'),
  'correctIndex', 0,
  'explanation', 'Règle de trois : prix de 7 mangues = 7 × 600 / 4 = 4200 / 4 = 1050 FCFA. Le coefficient de proportionnalité (prix unitaire) est 600/4 = 150 FCFA par mangue.'
)
FROM curriculum_content
WHERE level = '4eme' AND subject = 'mathematiques' AND topic = 'Proportionnalité';

INSERT INTO exercises (content_id, type, difficulty, data)
SELECT id, 'qcm', 3, jsonb_build_object(
  'question', 'Quelle est la dérivée de la fonction f(x) = 3x² - 5x + 2 ?',
  'options', jsonb_build_array('f''(x) = 6x - 5', 'f''(x) = 6x² - 5', 'f''(x) = 3x - 5', 'f''(x) = 6x - 5x'),
  'correctIndex', 0,
  'explanation', 'On dérive terme à terme : (3x²)'' = 6x, (-5x)'' = -5, (2)'' = 0. Donc f''(x) = 6x - 5.'
)
FROM curriculum_content
WHERE level = 'tle' AND subject = 'mathematiques' AND topic = 'Dérivation';

INSERT INTO exercises (content_id, type, difficulty, data)
SELECT id, 'qcm', 2, jsonb_build_object(
  'question', 'Une force de 100 N est appliquée à un objet de 25 kg. Quelle est son accélération ?',
  'options', jsonb_build_array('4 m/s²', '0,25 m/s²', '125 m/s²', '2500 m/s²'),
  'correctIndex', 0,
  'explanation', 'D''après la 2ème loi de Newton : a = F / m = 100 / 25 = 4 m/s². L''unité s''obtient par N/kg = (kg·m/s²)/kg = m/s².'
)
FROM curriculum_content
WHERE level = '1ere' AND subject = 'physique_chimie' AND topic = 'Lois de Newton';

INSERT INTO exercises (content_id, type, difficulty, data)
SELECT id, 'qcm', 3, jsonb_build_object(
  'question', 'Dans laquelle de ces phrases le verbe doit-il être au subjonctif ?',
  'options', jsonb_build_array(
    'Il faut que tu (venir) demain.',
    'J''espère qu''il (venir) demain.',
    'Je sais qu''il (venir) demain.',
    'Il pense qu''elle (venir) demain.'
  ),
  'correctIndex', 0,
  'explanation', 'Après "il faut que" (verbe de nécessité), on utilise le subjonctif : "Il faut que tu viennes". Les autres verbes (espérer, savoir, penser à la forme affirmative) sont suivis de l''indicatif.'
)
FROM curriculum_content
WHERE level = '1ere' AND subject = 'francais' AND topic = 'Le subjonctif';

INSERT INTO exercises (content_id, type, difficulty, data)
SELECT id, 'qcm', 2, jsonb_build_object(
  'question', 'Quel organe de la fleur produit le pollen ?',
  'options', jsonb_build_array('L''anthère (au sommet de l''étamine)', 'Le stigmate', 'L''ovaire', 'Le pétale'),
  'correctIndex', 0,
  'explanation', 'Le pollen est produit par l''anthère, située au sommet de l''étamine (organe mâle). Le stigmate est la partie femelle qui reçoit le pollen lors de la pollinisation.'
)
FROM curriculum_content
WHERE level = '4eme' AND subject = 'svt' AND topic = 'Reproduction des plantes à fleurs';
