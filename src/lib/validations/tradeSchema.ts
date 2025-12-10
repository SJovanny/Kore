// ============================================================================
// SCHÉMA ZOD - Validation du Trade Entry Form
// ============================================================================

import { z } from "zod";

// Enums correspondant à la base de données
export const TradeDirection = z.enum(["LONG", "SHORT"]);
export const TradeStatus = z.enum(["PENDING", "OPEN", "CLOSED", "CANCELLED"]);
export const TradeMode = z.enum(["LIVE", "BACKTEST"]);

export type TradeDirectionType = z.infer<typeof TradeDirection>;
export type TradeStatusType = z.infer<typeof TradeStatus>;
export type TradeModeType = z.infer<typeof TradeMode>;

// Schéma de base pour le formulaire (sans transformation pour React Hook Form)
const psychologySchema = z.object({
  tiltScore: z
    .number()
    .min(1, "Le score de tilt doit être entre 1 et 10")
    .max(10, "Le score de tilt doit être entre 1 et 10")
    .optional(),

  confidenceLevel: z
    .number()
    .min(1, "Le niveau de confiance doit être entre 1 et 10")
    .max(10, "Le niveau de confiance doit être entre 1 et 10")
    .optional(),

  stressLevel: z
    .number()
    .min(1, "Le niveau de stress doit être entre 1 et 10")
    .max(10, "Le niveau de stress doit être entre 1 et 10")
    .optional(),

  emotionTags: z.array(z.string()).default([]),

  disciplineRating: z.boolean().optional(),

  notes: z.string().max(1000, "Notes psychologiques trop longues").optional(),
});

// Schéma pour le formulaire (input)
export const createTradeFormSchema = z.object({
  // Informations de base
  symbol: z
    .string()
    .min(1, "Le symbole est requis")
    .max(20, "Le symbole ne doit pas dépasser 20 caractères"),

  direction: TradeDirection,

  mode: TradeMode,

  // Sélection portfolio et stratégie
  portfolioId: z.string().min(1, "Portfolio requis"),
  strategyId: z.string().optional().nullable(),

  // Prix et quantités (utilisation de string pour précision décimale)
  entryPrice: z
    .string()
    .min(1, "Le prix d'entrée est requis")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Le prix d'entrée doit être un nombre positif",
    }),

  quantity: z
    .string()
    .min(1, "La quantité est requise")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "La quantité doit être un nombre positif",
    }),

  // Stop Loss et Take Profit
  stopLoss: z
    .string()
    .min(1, "Le stop loss est requis")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Le stop loss doit être un nombre positif",
    }),

  takeProfit: z.string().optional(),

  // Notes et documentation
  setupNotes: z.string().max(2000, "Notes trop longues").optional(),

  // Tags
  tags: z.array(z.string()).default([]),

  // Screenshot
  screenshotUrl: z.string().url().optional().nullable(),

  // Timeframe du graphique
  chartTimeframe: z.string().max(10).optional(),

  // Section Psychologie
  psychology: psychologySchema.optional(),
});

// Schéma de validation serveur (avec transformation)
export const createTradeSchema = createTradeFormSchema.transform((data) => ({
  ...data,
  symbol: data.symbol.toUpperCase(),
}));

// Types
export type CreateTradeFormInput = z.input<typeof createTradeFormSchema>;
export type CreateTradeInput = z.output<typeof createTradeSchema>;

// Schéma pour la mise à jour d'un trade
export const updateTradeSchema = createTradeFormSchema.partial().extend({
  id: z.string().uuid("ID de trade invalide"),
  status: TradeStatus.optional(),
  exitPrice: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0),
      { message: "Le prix de sortie doit être un nombre positif" }
    ),
  exitNotes: z.string().max(2000).optional(),
  lessonsLearned: z.string().max(2000).optional(),
});

export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;

// Constantes pour les émotions prédéfinies
export const EMOTION_TAGS = [
  { value: "CALM", label: "😌 Calme", color: "bg-green-500" },
  { value: "FOCUSED", label: "🎯 Concentré", color: "bg-blue-500" },
  { value: "CONFIDENT", label: "💪 Confiant", color: "bg-emerald-500" },
  { value: "FEARFUL", label: "😰 Peur", color: "bg-yellow-500" },
  { value: "GREEDY", label: "🤑 Avidité", color: "bg-orange-500" },
  { value: "FOMO", label: "😫 FOMO", color: "bg-red-500" },
  { value: "REVENGE", label: "😤 Revenge", color: "bg-red-600" },
  { value: "OVERCONFIDENT", label: "🦸 Sur-confiant", color: "bg-purple-500" },
  { value: "ANXIOUS", label: "😟 Anxieux", color: "bg-amber-500" },
  { value: "IMPATIENT", label: "⏰ Impatient", color: "bg-pink-500" },
] as const;

// Constantes pour les timeframes
export const CHART_TIMEFRAMES = [
  { value: "1M", label: "1 Minute" },
  { value: "5M", label: "5 Minutes" },
  { value: "15M", label: "15 Minutes" },
  { value: "30M", label: "30 Minutes" },
  { value: "1H", label: "1 Heure" },
  { value: "4H", label: "4 Heures" },
  { value: "D1", label: "Journalier" },
  { value: "W1", label: "Hebdomadaire" },
  { value: "MN", label: "Mensuel" },
] as const;
