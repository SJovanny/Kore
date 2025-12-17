"use client";

// ============================================================================
// GOALS & NOTES PANEL - Objectifs de trading et notes rapides
// ============================================================================

import { useState } from "react";
import {
    Target,
    Plus,
    Pin,
    Trash2,
    MessageSquare,
    TrendingUp,
    Pencil,
    Check,
    X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================================
// TYPES
// ============================================================================

interface TradingGoal {
    id: string;
    title: string;
    targetValue: number;
    currentValue: number;
    goalType: "profit" | "trades" | "winrate" | "custom";
    isCompleted: boolean;
}

interface QuickNote {
    id: string;
    content: string;
    noteType: "thought" | "lesson" | "observation";
    pinned: boolean;
    createdAt: string;
}

interface GoalsNotesPanelProps {
    goals?: TradingGoal[];
    notes?: QuickNote[];
    onAddGoal?: (goal: Partial<TradingGoal>) => void;
    onUpdateGoal?: (id: string, updates: Partial<TradingGoal>) => void;
    onDeleteGoal?: (id: string) => void;
    onAddNote?: (note: string) => void;
    onDeleteNote?: (id: string) => void;
    onTogglePin?: (id: string) => void;
}

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_GOALS: TradingGoal[] = [
    {
        id: "1",
        title: "Profit mensuel 1000$",
        targetValue: 1000,
        currentValue: 720,
        goalType: "profit",
        isCompleted: false,
    },
    {
        id: "2",
        title: "50 trades ce mois",
        targetValue: 50,
        currentValue: 32,
        goalType: "trades",
        isCompleted: false,
    },
    {
        id: "3",
        title: "Win Rate > 60%",
        targetValue: 60,
        currentValue: 68,
        goalType: "winrate",
        isCompleted: true,
    },
];

const DEMO_NOTES: QuickNote[] = [
    {
        id: "1",
        content: "Ne pas trader pendant les annonces NFP",
        noteType: "lesson",
        pinned: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: "2",
        content: "Revoir setup breakout sur EURUSD",
        noteType: "observation",
        pinned: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: "3",
        content: "Session Londres plus rentable que NY",
        noteType: "thought",
        pinned: false,
        createdAt: new Date().toISOString(),
    },
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface GoalItemProps {
    goal: TradingGoal;
    onUpdate?: (updates: Partial<TradingGoal>) => void;
    onDelete?: () => void;
}

function GoalItem({ goal, onUpdate, onDelete }: GoalItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(goal.title);
    const [editCurrent, setEditCurrent] = useState(goal.currentValue.toString());
    const [editTarget, setEditTarget] = useState(goal.targetValue.toString());

    const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);

    const handleSave = () => {
        onUpdate?.({
            title: editTitle,
            currentValue: parseFloat(editCurrent) || 0,
            targetValue: parseFloat(editTarget) || 1,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditTitle(goal.title);
        setEditCurrent(goal.currentValue.toString());
        setEditTarget(goal.targetValue.toString());
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="space-y-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre de l'objectif"
                    className="h-7 text-sm"
                />
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Actuel</label>
                        <Input
                            type="number"
                            value={editCurrent}
                            onChange={(e) => setEditCurrent(e.target.value)}
                            className="h-7 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Objectif</label>
                        <Input
                            type="number"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                            className="h-7 text-sm"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={handleCancel}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="default"
                        className="h-6 px-2"
                        onClick={handleSave}
                    >
                        <Check className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className={cn(goal.isCompleted && "text-emerald-600")}>
                    {goal.title}
                </span>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                        {goal.currentValue}/{goal.targetValue}
                    </span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
                    >
                        <Pencil className="w-3 h-3 text-slate-500" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-opacity"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
            <Progress
                value={progress}
                className={cn(
                    "h-2",
                    goal.isCompleted && "[&>div]:bg-emerald-500"
                )}
            />
        </div>
    );
}

function NoteItem({
    note,
    onDelete,
    onTogglePin,
}: {
    note: QuickNote;
    onDelete?: () => void;
    onTogglePin?: () => void;
}) {
    return (
        <div
            className={cn(
                "group flex items-start gap-2 p-2 rounded-lg transition-colors",
                note.pinned
                    ? "bg-amber-50 dark:bg-amber-900/10"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {note.content}
                </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onTogglePin}
                    className={cn(
                        "p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700",
                        note.pinned && "text-amber-500"
                    )}
                >
                    <Pin className="w-3 h-3" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-1 rounded hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GoalsNotesPanel({
    goals = DEMO_GOALS,
    notes = DEMO_NOTES,
    onAddGoal,
    onUpdateGoal,
    onDeleteGoal,
    onAddNote,
    onDeleteNote,
    onTogglePin,
}: GoalsNotesPanelProps) {
    const [newNote, setNewNote] = useState("");
    const [localGoals, setLocalGoals] = useState(goals);

    const handleAddNote = () => {
        if (newNote.trim()) {
            onAddNote?.(newNote.trim());
            setNewNote("");
        }
    };

    const handleUpdateGoal = (id: string, updates: Partial<TradingGoal>) => {
        // Update locally for demo mode
        setLocalGoals((prev) =>
            prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
        );
        onUpdateGoal?.(id, updates);
    };

    const handleDeleteGoal = (id: string) => {
        setLocalGoals((prev) => prev.filter((g) => g.id !== id));
        onDeleteGoal?.(id);
    };

    const sortedNotes = [...notes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Objectifs & Notes
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Goals Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            Objectifs
                        </h3>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => onAddGoal?.({})}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Ajouter
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {localGoals.slice(0, 3).map((goal) => (
                            <GoalItem
                                key={goal.id}
                                goal={goal}
                                onUpdate={(updates) => handleUpdateGoal(goal.id, updates)}
                                onDelete={() => handleDeleteGoal(goal.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700" />

                {/* Notes Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes Rapides
                    </h3>

                    {/* Add Note Input */}
                    <div className="flex gap-2 mb-2">
                        <Input
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Nouvelle note..."
                            className="h-8 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2"
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Notes List */}
                    <ScrollArea className="flex-1 -mx-2">
                        <div className="space-y-1 px-2">
                            {sortedNotes.map((note) => (
                                <NoteItem
                                    key={note.id}
                                    note={note}
                                    onDelete={() => onDeleteNote?.(note.id)}
                                    onTogglePin={() => onTogglePin?.(note.id)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

