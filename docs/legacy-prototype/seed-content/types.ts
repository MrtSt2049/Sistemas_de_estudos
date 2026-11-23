// Formato do conteúdo-base (tópicos, questões, resumos) carregado por db/seed-content.ts.
// Texto no dialeto do renderer (lib/latex/renderer.ts): $..$, $$..$$, **negrito**, listas "- ", ```código```.

export type ContentTopic = {
  id: string;
  courseId: string;
  unit: string | null;
  title: string;
  order: number;
};

export type ContentQuestion = {
  id: string;
  track: 'grad' | 'obmu' | 'cp';
  courseId?: string | null;
  title: string;
  statement: string;
  source?: string | null;
  number?: string | null;
  difficulty: number; // 1..5
  tags?: string | null;
  prerequisites?: string | null;
  hint1?: string | null;
  hint2?: string | null;
  hint3?: string | null;
  officialSolution?: string | null;
  complexity?: string | null;
  url?: string | null;
};

export type ContentMaterial = {
  id: string;
  kind: string;
  front: 'grad' | 'obmu' | 'cp';
  courseId?: string | null;
  title: string;
  author?: string | null;
  reference?: string | null;
  url?: string | null;
  status?: string | null;
  notes?: string | null;
};
