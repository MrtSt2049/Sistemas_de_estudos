import type { TopicNode } from "@/features/disciplines/api";

export interface FlatTopic {
  node: TopicNode;
  depth: number;
}

/** Achata a árvore em ordem de exibição (pré-ordem). */
export function flattenTree(nodes: TopicNode[], depth = 1): FlatTopic[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flattenTree(node.children, depth + 1)]);
}
