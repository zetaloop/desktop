import { GitProgressParser } from './git'

/**
 * Highly approximate (some would say outright inaccurate) division
 * of the individual progress reporting steps in a push operation
 */
const steps = [
  { title: '正在压缩对象', weight: 0.2 },
  { title: '正在发送对象', weight: 0.7 },
  { title: '远程端：正在解析增量', weight: 0.1 },
]

/**
 * A utility class for interpreting the output from `git push --progress`
 * and turning that into a percentage value estimating the overall progress
 * of the clone.
 */
export class PushProgressParser extends GitProgressParser {
  public constructor() {
    super(steps)
  }
}
