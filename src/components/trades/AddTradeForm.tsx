// ============================================================================
// SMART TRADE ENTRY FORM - Formulaire de Saisie Intelligent
// ============================================================================
// Composant client avec calculs temps réel, drag & drop, et section psychologie

"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    TrendingUp,
    TrendingDown,
    Upload,
    X,
    Calculator,
    Brain,
    Target,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    ImageIcon,
} from "lucide-react";

// Composants shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

// Schéma et types
import {
    createTradeFormSchema,
    type CreateTradeFormInput,
    EMOTION_TAGS,
    CHART_TIMEFRAMES,
} from "@/lib/validations/tradeSchema";

// Server Actions
import { createTrade, uploadTradeScreenshot } from "@/app/actions/trades";

// ============================================================================
// TYPES
// ============================================================================

interface Portfolio {
    id: string;
    name: string;
    portfolio_type: string;
}

interface Strategy {
    id: string;
    name: string;
}

interface AddTradeFormProps {
    portfolios: Portfolio[];
    strategies: Strategy[];
    onSuccess?: (tradeId: string) => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function AddTradeForm({
    portfolios,
    strategies,
    onSuccess,
}: AddTradeFormProps) {
    const [isPending, startTransition] = useTransition();
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // Configuration du formulaire avec React Hook Form + Zod
    const form = useForm<CreateTradeFormInput>({
        resolver: zodResolver(createTradeFormSchema),
        defaultValues: {
            symbol: "",
            direction: "LONG",
            mode: "LIVE",
            portfolioId: portfolios[0]?.id || "",
            strategyId: null,
            entryPrice: "",
            quantity: "",
            stopLoss: "",
            takeProfit: "",
            setupNotes: "",
            tags: [],
            chartTimeframe: "",
            psychology: {
                tiltScore: 5,
                confidenceLevel: 5,
                stressLevel: 5,
                emotionTags: [],
                disciplineRating: true,
                notes: "",
            },
        },
    });

    // Valeurs observées pour les calculs temps réel
    const watchedValues = form.watch([
        "entryPrice",
        "stopLoss",
        "takeProfit",
        "quantity",
        "direction",
    ]);

    // ============================================================================
    // CALCULS TEMPS RÉEL
    // ============================================================================

    const calculations = useMemo(() => {
        const [entryPrice, stopLoss, takeProfit, quantity, direction] = watchedValues;

        const entry = parseFloat(entryPrice || "0") || 0;
        const sl = parseFloat(stopLoss || "0") || 0;
        const tp = parseFloat(takeProfit || "0") || 0;
        const qty = parseFloat(quantity || "0") || 0;
        const isLong = direction === "LONG";

        // Risque par action
        let riskPerShare = 0;
        if (entry > 0 && sl > 0) {
            riskPerShare = isLong ? entry - sl : sl - entry;
        }

        // Risque total
        const totalRisk = Math.abs(riskPerShare * qty);

        // Gain potentiel par action
        let gainPerShare = 0;
        if (entry > 0 && tp > 0) {
            gainPerShare = isLong ? tp - entry : entry - tp;
        }

        // R-Multiple potentiel
        let rMultiple = 0;
        if (riskPerShare !== 0 && gainPerShare !== 0) {
            rMultiple = gainPerShare / Math.abs(riskPerShare);
        }

        // Gain potentiel total
        const potentialGain = gainPerShare * qty;

        // Validation du stop loss
        const isValidStopLoss =
            (isLong && sl < entry) || (!isLong && sl > entry) || sl === 0 || entry === 0;

        // Validation du take profit
        const isValidTakeProfit =
            (isLong && tp > entry) || (!isLong && tp < entry) || tp === 0 || entry === 0;

        return {
            riskPerShare: Math.abs(riskPerShare),
            totalRisk,
            gainPerShare: Math.abs(gainPerShare),
            potentialGain,
            rMultiple,
            isValidStopLoss,
            isValidTakeProfit,
        };
    }, [watchedValues]);

    // ============================================================================
    // GESTION DU DRAG & DROP
    // ============================================================================

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, []);

    const handleFileSelect = useCallback((file: File) => {
        // Validation du type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            setSubmitStatus({
                type: "error",
                message: "Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.",
            });
            return;
        }

        // Validation de la taille (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setSubmitStatus({
                type: "error",
                message: "Le fichier est trop volumineux (max 5MB)",
            });
            return;
        }

        setScreenshotFile(file);
        setScreenshotPreview(URL.createObjectURL(file));
        setSubmitStatus(null);
    }, []);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    const removeScreenshot = useCallback(() => {
        if (screenshotPreview) {
            URL.revokeObjectURL(screenshotPreview);
        }
        setScreenshotFile(null);
        setScreenshotPreview(null);
    }, [screenshotPreview]);

    // ============================================================================
    // GESTION DES TAGS D'ÉMOTIONS
    // ============================================================================

    const toggleEmotionTag = useCallback(
        (tag: string) => {
            const currentTags = form.getValues("psychology.emotionTags") || [];
            const newTags = currentTags.includes(tag)
                ? currentTags.filter((t: string) => t !== tag)
                : [...currentTags, tag];
            form.setValue("psychology.emotionTags", newTags);
        },
        [form]
    );

    // ============================================================================
    // SOUMISSION DU FORMULAIRE
    // ============================================================================

    const onSubmit = async (data: CreateTradeFormInput) => {
        setSubmitStatus(null);

        startTransition(async () => {
            try {
                // Upload de la capture d'écran si présente
                let screenshotUrl: string | null = null;
                if (screenshotFile) {
                    const formData = new FormData();
                    formData.append("file", screenshotFile);
                    const uploadResult = await uploadTradeScreenshot(formData);

                    if (uploadResult.success) {
                        screenshotUrl = uploadResult.data.url;
                    } else {
                        setSubmitStatus({
                            type: "error",
                            message: `Erreur upload image: ${uploadResult.error}`,
                        });
                        return;
                    }
                }

                // Création du trade
                const result = await createTrade({
                    ...data,
                    tags: data.tags || [],
                    screenshotUrl,
                    psychology: data.psychology ? {
                        ...data.psychology,
                        emotionTags: data.psychology.emotionTags || [],
                    } : undefined,
                });

                if (result.success) {
                    setSubmitStatus({
                        type: "success",
                        message: "Trade créé avec succès!",
                    });
                    form.reset();
                    removeScreenshot();
                    onSuccess?.(result.data.tradeId);
                } else {
                    setSubmitStatus({
                        type: "error",
                        message: result.error,
                    });
                }
            } catch (error) {
                console.error("Erreur soumission:", error);
                setSubmitStatus({
                    type: "error",
                    message: "Une erreur inattendue s'est produite",
                });
            }
        });
    };

    // ============================================================================
    // RENDU
    // ============================================================================

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Status Message */}
                {submitStatus && (
                    <div
                        className={`p-4 rounded-lg flex items-center gap-2 ${submitStatus.type === "success"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}
                    >
                        {submitStatus.type === "success" ? (
                            <CheckCircle2 className="h-5 w-5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5" />
                        )}
                        <span>{submitStatus.message}</span>
                    </div>
                )}

                {/* Direction Selector */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="direction"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Direction du Trade</FormLabel>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant={field.value === "LONG" ? "default" : "outline"}
                                        className={`h-16 text-lg font-semibold transition-all ${field.value === "LONG"
                                            ? "bg-green-600 hover:bg-green-700 text-white"
                                            : "hover:border-green-500 hover:text-green-500"
                                            }`}
                                        onClick={() => field.onChange("LONG")}
                                    >
                                        <TrendingUp className="mr-2 h-6 w-6" />
                                        LONG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={field.value === "SHORT" ? "default" : "outline"}
                                        className={`h-16 text-lg font-semibold transition-all ${field.value === "SHORT"
                                            ? "bg-red-600 hover:bg-red-700 text-white"
                                            : "hover:border-red-500 hover:text-red-500"
                                            }`}
                                        onClick={() => field.onChange("SHORT")}
                                    >
                                        <TrendingDown className="mr-2 h-6 w-6" />
                                        SHORT
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Trade Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Informations du Trade
                        </CardTitle>
                        <CardDescription>
                            Entrez les détails de votre position
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Symbol, Mode, Timeframe */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="symbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Symbole *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="EURUSD, BTCUSDT, AAPL..."
                                                {...field}
                                                className="uppercase"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mode</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="LIVE">🔴 Live</SelectItem>
                                                <SelectItem value="BACKTEST">📊 Backtest</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="chartTimeframe"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Timeframe</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CHART_TIMEFRAMES.map((tf) => (
                                                    <SelectItem key={tf.value} value={tf.value}>
                                                        {tf.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Portfolio & Strategy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="portfolioId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Portfolio *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez un portfolio" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {portfolios.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({p.portfolio_type})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="strategyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stratégie</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez (optionnel)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {strategies.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Prices & Risk Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Prix & Gestion du Risque
                        </CardTitle>
                        <CardDescription>
                            Les calculs se mettent à jour automatiquement
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Price Inputs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="entryPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prix d'Entrée *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="0.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantité *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="0.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="stopLoss"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stop Loss *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="0.00"
                                                className={
                                                    !calculations.isValidStopLoss
                                                        ? "border-red-500 focus:ring-red-500"
                                                        : ""
                                                }
                                                {...field}
                                            />
                                        </FormControl>
                                        {!calculations.isValidStopLoss && (
                                            <p className="text-xs text-red-500">
                                                Stop Loss invalide pour cette direction
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="takeProfit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Take Profit</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="0.00"
                                                className={
                                                    !calculations.isValidTakeProfit
                                                        ? "border-red-500 focus:ring-red-500"
                                                        : ""
                                                }
                                                {...field}
                                            />
                                        </FormControl>
                                        {!calculations.isValidTakeProfit && (
                                            <p className="text-xs text-red-500">
                                                Take Profit invalide pour cette direction
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Real-time Calculations Display */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Risque / Unité
                                </p>
                                <p className="text-xl font-bold text-red-500">
                                    ${calculations.riskPerShare.toFixed(4)}
                                </p>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Risque Total
                                </p>
                                <p className="text-xl font-bold text-red-500">
                                    ${calculations.totalRisk.toFixed(2)}
                                </p>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Gain Potentiel
                                </p>
                                <p className="text-xl font-bold text-green-500">
                                    ${calculations.potentialGain.toFixed(2)}
                                </p>
                            </div>

                            <div
                                className={`p-4 rounded-lg border ${calculations.rMultiple >= 2
                                    ? "bg-green-500/10 border-green-500/30"
                                    : calculations.rMultiple >= 1
                                        ? "bg-yellow-500/10 border-yellow-500/30"
                                        : "bg-muted/50"
                                    }`}
                            >
                                <p className="text-sm text-muted-foreground mb-1">R-Multiple</p>
                                <p
                                    className={`text-xl font-bold ${calculations.rMultiple >= 2
                                        ? "text-green-500"
                                        : calculations.rMultiple >= 1
                                            ? "text-yellow-500"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    {calculations.rMultiple.toFixed(2)}R
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Screenshot Upload Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Capture d'Écran
                        </CardTitle>
                        <CardDescription>
                            Ajoutez une capture de votre graphique (optionnel)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!screenshotPreview ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragOver
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    className="hidden"
                                    id="screenshot-upload"
                                />
                                <label
                                    htmlFor="screenshot-upload"
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-primary">
                                            Cliquez pour uploader
                                        </span>{" "}
                                        ou glissez-déposez
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PNG, JPG, WebP ou GIF (max 5MB)
                                    </p>
                                </label>
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden">
                                <img
                                    src={screenshotPreview}
                                    alt="Preview"
                                    className="w-full h-48 object-contain bg-muted"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={removeScreenshot}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Psychology Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            État Mental
                        </CardTitle>
                        <CardDescription>
                            Évaluez votre état psychologique avant ce trade
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Sliders */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="psychology.confidenceLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Confiance</FormLabel>
                                            <span className="text-sm font-bold">{field.value}/10</span>
                                        </div>
                                        <FormControl>
                                            <Slider
                                                value={[field.value || 5]}
                                                onValueChange={(value) => field.onChange(value[0])}
                                                min={1}
                                                max={10}
                                                step={1}
                                                className="py-2"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            1 = Très bas, 10 = Très élevé
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="psychology.stressLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Stress</FormLabel>
                                            <span className="text-sm font-bold">{field.value}/10</span>
                                        </div>
                                        <FormControl>
                                            <Slider
                                                value={[field.value || 5]}
                                                onValueChange={(value) => field.onChange(value[0])}
                                                min={1}
                                                max={10}
                                                step={1}
                                                className="py-2"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            1 = Calme, 10 = Très stressé
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="psychology.tiltScore"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between items-center mb-2">
                                            <FormLabel>Niveau de Tilt</FormLabel>
                                            <span className="text-sm font-bold">{field.value}/10</span>
                                        </div>
                                        <FormControl>
                                            <Slider
                                                value={[field.value || 5]}
                                                onValueChange={(value) => field.onChange(value[0])}
                                                min={1}
                                                max={10}
                                                step={1}
                                                className="py-2"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            1 = Aucun tilt, 10 = Full tilt
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Emotion Tags */}
                        <div>
                            <Label className="mb-3 block">Tags Émotionnels</Label>
                            <div className="flex flex-wrap gap-2">
                                {EMOTION_TAGS.map((tag) => {
                                    const isSelected = (
                                        form.getValues("psychology.emotionTags") || []
                                    ).includes(tag.value);
                                    return (
                                        <Badge
                                            key={tag.value}
                                            variant={isSelected ? "default" : "outline"}
                                            className={`cursor-pointer transition-all hover:scale-105 ${isSelected ? tag.color : ""
                                                }`}
                                            onClick={() => toggleEmotionTag(tag.value)}
                                        >
                                            {tag.label}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        {/* Discipline Check */}
                        <FormField
                            control={form.control}
                            name="psychology.disciplineRating"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-3">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </FormControl>
                                    <FormLabel className="!mt-0 cursor-pointer">
                                        Ce trade respecte mon plan de trading et mes règles
                                    </FormLabel>
                                </FormItem>
                            )}
                        />

                        {/* Psychology Notes */}
                        <FormField
                            control={form.control}
                            name="psychology.notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes sur votre état mental</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Comment vous sentez-vous? Y a-t-il des facteurs externes qui pourraient influencer votre trading?"
                                            {...field}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Setup Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notes du Setup</CardTitle>
                        <CardDescription>
                            Décrivez le setup que vous avez identifié
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="setupNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Décrivez le pattern, les niveaux clés, la raison de ce trade..."
                                            {...field}
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg font-semibold"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Création en cours...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Créer le Trade
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
