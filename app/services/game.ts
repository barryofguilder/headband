import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export interface RoundResult {
  categoryId: string;
  correct: string[];
  passed: string[];
}

/**
 * Holds the most recent round so the results screen can show it.
 */
export default class GameService extends Service {
  @tracked lastResult?: RoundResult;
}
