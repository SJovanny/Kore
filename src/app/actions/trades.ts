// ============================================================================
// SERVER ACTIONS - Gestion des Trades
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTradeSchema, type CreateTradeInput } from "@/lib/validations/tradeSchema";

// Type pour le résultat des actions
type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Crée un nouveau trade dans la base de données
 * Gère l'insertion sécurisée avec validation Zod et RLS Supabase
 */
export async function createTrade(
    formData: CreateTradeInput
): Promise<ActionResult<{ tradeId: string }>> {
    try {
        // 1. Validation des données avec Zod
        const validatedData = createTradeSchema.safeParse(formData);

        if (!validatedData.success) {
            return {
                success: false,
                error: validatedData.error.issues.map((i) => i.message).join(", "),
            };
        }

        const data = validatedData.data;

        // 2. Récupération du client Supabase (avec session utilisateur)
        const supabase = await createClient();

        // 3. Vérification de l'authentification
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: "Vous devez être connecté pour créer un trade",
            };
        }

        // 4. Calcul des métriques de risque
        const entryPrice = parseFloat(data.entryPrice);
        const stopLoss = parseFloat(data.stopLoss);
        const quantity = parseFloat(data.quantity);
        const takeProfit = data.takeProfit ? parseFloat(data.takeProfit) : null;

        const isLong = data.direction === "LONG";
        const riskPerShare = isLong
            ? entryPrice - stopLoss
            : stopLoss - entryPrice;
        const totalRisk = Math.abs(riskPerShare * quantity);

        let rMultiple: number | null = null;
        if (takeProfit) {
            const potentialGain = isLong
                ? takeProfit - entryPrice
                : entryPrice - takeProfit;
            rMultiple = riskPerShare !== 0 ? potentialGain / Math.abs(riskPerShare) : null;
        }

        // 5. Insertion du trade
        const { data: trade, error: insertError } = await supabase
            .from("trades")
            .insert({
                user_id: user.id,
                portfolio_id: data.portfolioId,
                strategy_id: data.strategyId || null,
                symbol: data.symbol,
                direction: data.direction,
                mode: data.mode,
                status: "OPEN",
                entry_date: new Date().toISOString(),
                entry_price: entryPrice,
                quantity: quantity,
                planned_stop_loss: stopLoss,
                planned_take_profit: takeProfit,
                risk_amount: totalRisk,
                r_multiple: rMultiple,
                setup_notes: data.setupNotes || null,
                screenshot_url: data.screenshotUrl || null,
                chart_timeframe: data.chartTimeframe || null,
                tags: data.tags,
            })
            .select("id")
            .single();

        if (insertError) {
            console.error("Erreur insertion trade:", insertError);
            return {
                success: false,
                error: `Erreur lors de la création du trade: ${insertError.message}`,
            };
        }

        // 6. Création de l'exécution d'entrée
        const { error: executionError } = await supabase.from("executions").insert({
            trade_id: trade.id,
            user_id: user.id,
            execution_type: "ENTRY",
            price: entryPrice,
            quantity: quantity,
            executed_at: new Date().toISOString(),
        });

        if (executionError) {
            console.error("Erreur insertion exécution:", executionError);
            // On ne fail pas le trade pour ça, juste un warning
        }

        // 7. Création du log psychologique si fourni
        if (data.psychology) {
            const { error: psychError } = await supabase
                .from("psychology_logs")
                .insert({
                    trade_id: trade.id,
                    user_id: user.id,
                    tilt_score: data.psychology.tiltScore || null,
                    confidence_level: data.psychology.confidenceLevel || null,
                    stress_level: data.psychology.stressLevel || null,
                    emotion_tags: data.psychology.emotionTags || [],
                    discipline_rating: data.psychology.disciplineRating ?? null,
                    notes: data.psychology.notes || null,
                    logged_at: new Date().toISOString(),
                });

            if (psychError) {
                console.error("Erreur insertion psychology log:", psychError);
            }
        }

        // 8. Revalidation du cache
        revalidatePath("/dashboard");
        revalidatePath("/trades");

        return {
            success: true,
            data: { tradeId: trade.id },
        };
    } catch (error) {
        console.error("Erreur inattendue createTrade:", error);
        return {
            success: false,
            error: "Une erreur inattendue s'est produite",
        };
    }
}

/**
 * Upload une image vers Supabase Storage
 * Retourne l'URL publique de l'image
 */
export async function uploadTradeScreenshot(
    formData: FormData
): Promise<ActionResult<{ url: string }>> {
    try {
        const file = formData.get("file") as File;

        if (!file) {
            return { success: false, error: "Aucun fichier fourni" };
        }

        // Validation du type de fichier
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: "Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.",
            };
        }

        // Validation de la taille (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                success: false,
                error: "Le fichier est trop volumineux (max 5MB)",
            };
        }

        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: "Vous devez être connecté pour uploader une image",
            };
        }

        // Génération d'un nom unique
        const timestamp = Date.now();
        const extension = file.name.split(".").pop();
        const fileName = `${user.id}/${timestamp}.${extension}`;

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("trade-screenshots")
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Erreur upload:", uploadError);
            return {
                success: false,
                error: `Erreur lors de l'upload: ${uploadError.message}`,
            };
        }

        // Récupération de l'URL publique
        const {
            data: { publicUrl },
        } = supabase.storage.from("trade-screenshots").getPublicUrl(fileName);

        return {
            success: true,
            data: { url: publicUrl },
        };
    } catch (error) {
        console.error("Erreur inattendue uploadTradeScreenshot:", error);
        return {
            success: false,
            error: "Une erreur inattendue s'est produite lors de l'upload",
        };
    }
}

/**
 * Récupère les portfolios de l'utilisateur
 */
export async function getUserPortfolios(): Promise<
    ActionResult<Array<{ id: string; name: string; portfolio_type: string }>>
> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Non authentifié" };
        }

        const { data, error } = await supabase
            .from("portfolios")
            .select("id, name, portfolio_type")
            .eq("is_active", true)
            .order("is_default", { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error("Erreur getUserPortfolios:", error);
        return { success: false, error: "Erreur lors de la récupération des portfolios" };
    }
}

/**
 * Récupère les stratégies de l'utilisateur
 */
export async function getUserStrategies(): Promise<
    ActionResult<Array<{ id: string; name: string }>>
> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Non authentifié" };
        }

        const { data, error } = await supabase
            .from("strategies")
            .select("id, name")
            .eq("is_active", true)
            .order("name");

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error("Erreur getUserStrategies:", error);
        return { success: false, error: "Erreur lors de la récupération des stratégies" };
    }
}
