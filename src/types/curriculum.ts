// src/types/curriculum.ts

/**
 * Types pour le programme scolaire ivoirien et le contenu pédagogique.
 */

/**
 * Niveaux scolaires du système éducatif ivoirien.
 * Correspond au type SQL `student_level`.
 */
export type StudentLevel =
  | '6eme' | '5eme' | '4eme' | '3eme'   // Collège
  | '2nde' | '1ere' | 'tle'              // Lycée
  | 'l1' | 'l2' | 'l3' | 'm1' | 'm2';  // Université

/** Cycle scolaire */
export type SchoolCycle = 'college' | 'lycee' | 'universite';

/** Matière du programme ivoirien */
export interface Subject {
  /** Identifiant unique (ex: "mathematiques", "francais") */
  id: string;
  /** Nom affiché (ex: "Mathématiques", "Français") */
  name: string;
  /** Icône ou emoji associée */
  icon: string;
  /** Niveaux où cette matière est enseignée */
  levels: StudentLevel[];
}

/** Chapitre / topic dans une matière */
export interface Topic {
  /** Identifiant unique */
  id: string;
  /** Matière parente */
  subjectId: string;
  /** Nom du chapitre */
  name: string;
  /** Niveau scolaire */
  level: StudentLevel;
  /** Ordre d'affichage dans la progression */
  order: number;
  /** Prérequis (IDs de topics qui doivent être maîtrisés avant) */
  prerequisites: string[];
}

/** Contenu pédagogique stocké avec embedding pour RAG */
export interface CurriculumContent {
  /** Identifiant unique */
  id: string;
  /** Niveau scolaire */
  level: StudentLevel;
  /** Matière */
  subject: string;
  /** Chapitre */
  topic: string;
  /** Titre du contenu */
  title: string;
  /** Contenu textuel complet */
  content: string;
  /** Source du contenu (manuel, programme officiel, etc.) */
  source: string | null;
  /** Date de création */
  createdAt: Date;
}

/** Type d'exercice */
export type ExerciseType = 'qcm' | 'redaction' | 'calcul' | 'photo';

/** Exercice pédagogique */
export interface Exercise {
  /** Identifiant unique */
  id: string;
  /** Contenu associé */
  contentId: string | null;
  /** Type d'exercice */
  type: ExerciseType;
  /** Difficulté de 1 (facile) à 5 (très difficile) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Données de l'exercice (structure dépend du type) */
  data: QCMData | RedactionData | CalculData | PhotoData;
  /** Date de création */
  createdAt: Date;
}

/** Données spécifiques à un QCM */
export interface QCMData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** Données spécifiques à une rédaction */
export interface RedactionData {
  prompt: string;
  guidelines: string[];
  sampleAnswer: string;
}

/** Données spécifiques à un calcul */
export interface CalculData {
  question: string;
  expectedAnswer: string;
  tolerance: number;
  steps: string[];
}

/** Données spécifiques à un exercice photo (brouillon) */
export interface PhotoData {
  instructions: string;
  topic: string;
  evaluationCriteria: string[];
}

/** Niveau de maîtrise affiché dans l'arbre */
export interface MasteryLevel {
  /** Identifiant du noeud */
  id: string;
  /** Matière */
  subject: string;
  /** Chapitre */
  topic: string;
  /** Niveau de maîtrise */
  level: 'novice' | 'apprenti' | 'confirme' | 'expert' | 'maitre';
  /** Nombre d'exercices complétés */
  exercisesCompleted: number;
  /** Dernier score obtenu (0.0 à 1.0) */
  lastScore: number | null;
}
