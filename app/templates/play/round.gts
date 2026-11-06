import type { TOC } from '@ember/component/template-only';
import { pageTitle } from 'ember-page-title';
import PlayRound from 'headband/components/play-round';
import type { Category } from 'headband/categories';

const PlayRoundTemplate: TOC<{ Args: { model: Category } }> = <template>
  {{pageTitle @model.name}}
  <PlayRound @category={{@model}} />
</template>;

export default PlayRoundTemplate;
