import generated from './sites.generated.json';
import { authoredTopics } from './topics';
import { probQuestions } from './grad-prob';
import { analiseQuestions } from './grad-analise';
import { aplicadaQuestions } from './grad-aplicada';
import { obmuQuestions } from './obmu';
import { cpQuestions } from './cp';
import type { ContentMaterial, ContentQuestion, ContentTopic } from './types';

/**
 * Versão do conteúdo-base. Aumente ao ADICIONAR itens novos: o seed insere apenas os ids ainda
 * inexistentes (nunca recria o que você apagou nem sobrescreve o que você editou).
 */
export const CONTENT_VERSION = 1;

export const contentTopics: ContentTopic[] = [...(generated.topics as ContentTopic[]), ...authoredTopics];

export const contentQuestions: ContentQuestion[] = [
  ...(generated.questions as ContentQuestion[]),
  ...probQuestions,
  ...analiseQuestions,
  ...aplicadaQuestions,
  ...obmuQuestions,
  ...cpQuestions,
];

export const contentMaterials: ContentMaterial[] = generated.materials as ContentMaterial[];
