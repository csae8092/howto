import remark from 'remark'
import stripMarkdown from 'strip-markdown'
import type { Transformer } from 'unified'
import type * as Unist from 'unist'
import type { VFile } from 'vfile'

/**
 * Adds reading time to VFile data.
 */
export default function attacher(): Transformer {
  const WORDS_PER_MINUTE = 265
  /** Uses `alt` text for images, keeps footnotes. */
  const processor = remark().use(stripMarkdown)

  return transformer

  function transformer(tree: Unist.Node, file: VFile) {
    const plainText = processor.stringify(processor.runSync(tree))

    const words = plainText.trim().split(/\s+/)
    const minutes = Math.ceil(words.length / WORDS_PER_MINUTE)

    file.data = file.data ?? {}
    const data = file.data as { timeToRead: number }
    data.timeToRead = minutes
  }

  /**
   * Counting words with retext would be a little bit more precise,
   * (the main difference is that retext correctly removes punctuation,
   * while the naive approach above still has punctuation only "words",
   * like "-" or "&", and also still includes footnote references like "\\[^1]")
   * but is 10x slower unfortunately.
   */
  // function transformer(tree: Unist.Node) {
  //   let wordCount = 0

  //   const processor = unified().use(retextEnglish).use(countWords)
  //   unified().use(remarkRetext, processor).runSync(tree)

  //   const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE)

  //   file.data = file.data ?? {}
  //   const data = file.data as { timeToRead: number }
  //   data.timeToRead = minutes

  //   function countWords() {
  //     return transformer

  //     function transformer(tree: Unist.Node) {
  //       visit(tree, 'WordNode', () => {
  //         wordCount++
  //       })
  //     }
  //   }
  // }
}
