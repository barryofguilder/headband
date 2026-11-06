import type { TOC } from '@ember/component/template-only';
import ScreenHeader from 'headband/components/screen-header';
import CategoryForm from 'headband/components/category-form';
import type { Category } from 'headband/categories';

const MyCategoriesEdit: TOC<{ Args: { model: Category } }> = <template>
  <ScreenHeader @title="Edit category" @backTo="my-categories.index" />
  <CategoryForm @category={{@model}} />
</template>;

export default MyCategoriesEdit;
