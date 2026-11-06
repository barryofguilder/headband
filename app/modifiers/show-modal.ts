import { modifier } from 'ember-modifier';

/**
 * Opens a `<dialog>` as a modal when it's rendered.
 */
export default modifier((element: HTMLDialogElement) => {
  if (!element.open) {
    element.showModal();
  }
});
