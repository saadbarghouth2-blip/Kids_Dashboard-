export type DrawAction =
  | { kind: "circle"; center: [number, number]; radiusM: number; label?: string }
  | { kind: "polyline"; points: [number, number][]; label?: string }
  | { kind: "polygon"; rings: [number, number][][]; label?: string }
  | { kind: "text"; at: [number, number]; text: string }
  | { kind: "focusPlaces"; placeIds: string[] };

export type LayerAction = Partial<{
  showEgypt: boolean;
  showNile: boolean;
  showDelta: boolean;
  showHeat: boolean;
  showCoords: boolean;
  showLabels: boolean;
  showPlaces: boolean;
}>;

export type AnswerAction = {
  flyToPlaceId?: string;
  highlightPlaceIds?: string[];
  draw?: DrawAction[];
  setLayers?: LayerAction;
};

export type QuizQuestion = {
  id: string;
  lessonId: "water" | "minerals" | "projects";
  difficulty: 1 | 2 | 3;
  prompt: string;
  expectedKeywords?: string[];
  answer: {
    title: string;
    paragraphs: string[];
    quickFacts?: { k: string; v: string }[];
    nextSuggestions?: string[];
  };
  action?: AnswerAction;
};
