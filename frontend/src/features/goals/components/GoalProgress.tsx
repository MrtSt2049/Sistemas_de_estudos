import { METRIC_LABELS, type Goal } from "@/features/goals/api";

/** Progresso calculado pelo servidor; o texto acompanha a barra. */
export function GoalProgress({ goal }: { goal: Goal }) {
  const percent = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
  const reached = goal.current_value >= goal.target_value;

  return (
    <div className="space-y-1">
      <div
        role="progressbar"
        aria-label={goal.title}
        aria-valuemin={0}
        aria-valuemax={goal.target_value}
        aria-valuenow={Math.min(goal.current_value, goal.target_value)}
        className="h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className={reached ? "h-full bg-ok" : "h-full bg-accent-solid"}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="font-mono text-xs text-muted">
        {goal.current_value} / {goal.target_value} · {METRIC_LABELS[goal.metric]}
        {reached ? " · alvo atingido" : ""}
      </p>
    </div>
  );
}
