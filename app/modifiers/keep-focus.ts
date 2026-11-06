import { modifier } from 'ember-modifier';

/**
 * Stops a button from taking focus when it's pressed, so focus stays in the
 * text box. On a phone, this keeps the keyboard open. The button's click
 * still works as normal.
 */
export default modifier((element: HTMLElement) => {
  const keep = (event: Event) => event.preventDefault();
  element.addEventListener('pointerdown', keep);
  element.addEventListener('mousedown', keep);
  return () => {
    element.removeEventListener('pointerdown', keep);
    element.removeEventListener('mousedown', keep);
  };
});
