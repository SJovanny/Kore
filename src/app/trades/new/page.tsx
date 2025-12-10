// ============================================================================
// PAGE: Nouveau Trade
// ============================================================================

import { AddTradeForm } from "@/components/trades/AddTradeForm";
import { getUserPortfolios, getUserStrategies } from "@/app/actions/trades";

export default async function NewTradePage() {
    // Récupération des données côté serveur
    const [portfoliosResult, strategiesResult] = await Promise.all([
        getUserPortfolios(),
        getUserStrategies(),
    ]);

    // Pour le développement, utilisons des données mock si non connecté
    const portfolios = portfoliosResult.success
        ? portfoliosResult.data
        : [
            { id: "mock-1", name: "Demo Account", portfolio_type: "DEMO" },
            { id: "mock-2", name: "Live Trading", portfolio_type: "PERSONAL" },
        ];

    const strategies = strategiesResult.success
        ? strategiesResult.data
        : [
            { id: "mock-s1", name: "Breakout Strategy" },
            { id: "mock-s2", name: "Mean Reversion" },
            { id: "mock-s3", name: "Trend Following" },
        ];

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Nouveau Trade
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Enregistrez un nouveau trade dans votre journal
                    </p>
                </div>

                {/* Form */}
                <AddTradeForm portfolios={portfolios} strategies={strategies} />
            </div>
        </div>
    );
}
