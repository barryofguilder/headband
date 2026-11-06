import type { TOC } from '@ember/component/template-only';
import { on } from '@ember/modifier';
import showModal from 'headband/modifiers/show-modal';

interface ConfirmDialogSignature {
  Args: {
    title: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  Blocks: {
    default: [];
  };
}

/**
 * A pop-up that asks before doing something that can't be undone. Escape
 * or Cancel closes it. The browser focuses Cancel first, since it comes
 * first, so a stray tap or Enter never deletes anything.
 */
const ConfirmDialog: TOC<ConfirmDialogSignature> = <template>
  <dialog
    class="bg-plum-700 m-auto w-[min(24rem,calc(100%-2rem))] rounded-3xl p-6 text-white backdrop:bg-black/60"
    aria-labelledby="confirm-dialog-title"
    {{showModal}}
    {{on "cancel" @onCancel}}
    data-test-confirm-dialog
  >
    <h2 id="confirm-dialog-title" class="text-2xl font-bold">{{@title}}</h2>
    <div class="mt-2 text-lg text-white/90">{{yield}}</div>
    <div class="mt-6 grid grid-cols-2 gap-3">
      <button
        type="button"
        class="min-h-14 rounded-2xl bg-white/15 text-lg font-semibold active:bg-white/25"
        {{on "click" @onCancel}}
        data-test-confirm-cancel
      >
        Cancel
      </button>
      <button
        type="button"
        class="text-plum-900 min-h-14 rounded-2xl bg-white text-lg font-semibold active:bg-white/80"
        {{on "click" @onConfirm}}
        data-test-confirm
      >
        {{@confirmLabel}}
      </button>
    </div>
  </dialog>
</template>;

export default ConfirmDialog;
