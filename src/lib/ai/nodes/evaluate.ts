// src/lib/ai/nodes/evaluate.ts

/**
 * Noeud évaluation / correction d'exercices.
 *
 * Ce noeud :
 * 1. Analyse la réponse de l'élève (texte, calcul, QCM ou photo de brouillon)
 * 2. Génère un feedback constructif via Gemini 1.5 Pro
 * 3. Extrait un score normalisé (0.0 à 1.0) + le niveau de maîtrise atteint
 * 4. Retourne la correction dans l'état (la mise à jour de `mastery_tree`
 *    est faite par la route API avec le client Supabase authentifié)
 */

import { buildSystemPrompt } from '@/lib/ai/prompts/system';
import { getGeminiModel, type DjeliState } from '@/lib/ai/agent';
import { GEMINI_SMART_MODEL } from '@/lib/ai/models';
import type { StudentLevel } from '@/types/curriculum';

/**
 * Prompt d'évaluation : on demande à Gemini de retourner un JSON
 * contenant le score et le feedback, pour pouvoir mettre à jour la progression.
 */
function buildEvaluationPrompt(
  studentAnswer: string,
  subject: string,
  topic: string
): string {
  return `Tu es un correcteur pédagogique bienveillant pour un élève ivoirien.

## Sujet
Matière : ${subject}
Chapitre : ${topic || '(non spécifié)'}

## Réponse de l'élève
${studentAnswer}

## Ta mission
1. Analyse la réponse pour évaluer sa correction et sa qualité de raisonnement.
2. Identifie les points positifs (ce qui est bien fait).
3. Identifie les erreurs ou les points à améliorer.
4. Propose une correction pas-à-pas quand c'est pertinent.
5. Conclus par un encouragement concret.

Réponds avec un JSON strict (sans markdown, sans backticks) au format :
{
  "score": <nombre entre 0 et 1, 0 = tout faux, 1 = parfait>,
  "feedback": "<feedback complet en français, pédagogique, avec des étapes numérotées si besoin>"
}`;
}

/**
 * Parse la réponse JSON de Gemini pour extraire score + feedback.
 * En cas d'échec, retourne un feedback brut et un score nul.
 */
function parseEvaluationResponse(responseText: string): {
  score: number;
  feedback: string;
} {
  const cleaned = responseText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'score' in parsed &&
      'feedback' in parsed
    ) {
      const obj = parsed as { score: unknown; feedback: unknown };

      const score =
        typeof obj.score === 'number'
          ? Math.min(1, Math.max(0, obj.score))
          : 0;
      const feedback =
        typeof obj.feedback === 'string' ? obj.feedback : cleaned;

      return { score, feedback };
    }
  } catch {
    // Parsing failed — on retombe sur le texte brut
  }

  return { score: 0, feedback: cleaned || responseText };
}

/**
 * Évalue la réponse d'un élève et génère un feedback pédagogique.
 */
export async function evaluateNode(
  state: DjeliState
): Promise<Partial<DjeliState>> {
  const model = getGeminiModel(GEMINI_SMART_MODEL);

  if (!model) {
    return {
      response:
        "Je ne peux pas corriger ta réponse maintenant — le service IA n'est pas configuré.",
      score: null,
    };
  }

  const systemPrompt = buildSystemPrompt({
    level: state.level as StudentLevel,
    subject: state.subject,
    emotionalState: state.emotionalState,
    mastery: state.mastery,
  });

  const userPrompt = buildEvaluationPrompt(
    state.lastUserMessage,
    state.subject,
    state.topic
  );

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: systemPrompt,
    });

    const responseText = result.response.text();
    const { score, feedback } = parseEvaluationResponse(responseText);

    return {
      response: feedback,
      score,
    };
  } catch (error) {
    console.error(
      '[Evaluate] Erreur Gemini :',
      error instanceof Error ? error.message : error
    );
    return {
      response:
        "Une erreur est survenue pendant la correction. Réessaie dans un instant.",
      score: null,
    };
  }
}
