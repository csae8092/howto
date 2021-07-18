import { join } from 'path'

import withExtractedTableOfContents from '@stefanprobst/rehype-extract-toc'
import type { Toc } from '@stefanprobst/rehype-extract-toc'
import withSyntaxHighlighting from '@stefanprobst/rehype-shiki'
import withHeadingIds from 'rehype-slug'
import withFootnotes from 'remark-footnotes'
import withGitHubMarkdown from 'remark-gfm'
import { getHighlighter } from 'shiki'
import type { VFile } from 'vfile'

import type { Licence, LicenceId } from '@/cms/api/licences.api'
import { getLicenceById } from '@/cms/api/licences.api'
import { getPersonById } from '@/cms/api/people.api'
import type { Person, PersonId } from '@/cms/api/people.api'
import { getTagById } from '@/cms/api/tags.api'
import type { Tag, TagId } from '@/cms/api/tags.api'
import type { Locale } from '@/i18n/i18n.config'
import { extractFrontmatter } from '@/mdx/extractFrontmatter'
import withDownloadsLinks from '@/mdx/plugins/rehype-download-links'
import withHeadingLinks from '@/mdx/plugins/rehype-heading-links'
import withImageCaptions from '@/mdx/plugins/rehype-image-captions'
import withLazyLoadingImages from '@/mdx/plugins/rehype-lazy-loading-images'
import withNoReferrerLinks from '@/mdx/plugins/rehype-no-referrer-links'
import withReadingTime from '@/mdx/plugins/remark-reading-time'
import withTypographicQuotesAndDashes from '@/mdx/plugins/remark-smartypants'
import { readFile } from '@/mdx/readFile'
import { readFolder } from '@/mdx/readFolder'
import type { FilePath, IsoDateString } from '@/utils/ts/aliases'

const postsFolder = join(process.cwd(), 'content', 'posts')
const postExtension = '.mdx'

export interface PostId {
  /** Slug. */
  id: string
}

type ID = PostId['id']

export interface PostFrontmatter {
  uuid: string
  title: string
  shortTitle?: string
  lang: 'en' | 'de'
  date: IsoDateString
  version: string
  authors: Array<PersonId['id']>
  contributors?: Array<PersonId['id']>
  editors?: Array<PersonId['id']>
  tags: Array<TagId['id']>
  featuredImage?: FilePath
  abstract: string
  licence: LicenceId['id']
  toc?: boolean
}

export interface PostMetadata
  extends Omit<
    PostFrontmatter,
    'authors' | 'editors' | 'contributors' | 'tags' | 'licence'
  > {
  authors: Array<Person>
  contributors?: Array<Person>
  editors?: Array<Person>
  tags: Array<Tag>
  licence: Licence
}

export interface PostData {
  /** Metadata. */
  metadata: PostMetadata
  /** Table of contents. */
  toc: Toc
  /** Time to read, in minutes. */
  timeToRead: number
}

export interface Post extends PostId {
  /** Metadata and table of contents. */
  data: PostData
  /** Mdx compiled to function body. Must be hydrated on the client with `useMdx`. */
  code: string
}

export interface PostPreview extends PostId, PostMetadata {}

/**
 * Returns all post ids (slugs).
 */
export async function getPostIds(_locale: Locale): Promise<Array<string>> {
  const ids = await readFolder(postsFolder)

  return ids
}

/**
 * Returns post content, table of contents, and metadata.
 */
export async function getPostById(id: ID, locale: Locale): Promise<Post> {
  const [file, metadata] = await readFileAndGetPostMetadata(id, locale)
  const code = String(await compileMdx(file))
  const vfileData = file.data as { toc: Toc; timeToRead: number }

  const data = {
    metadata,
    toc: vfileData.toc,
    timeToRead: vfileData.timeToRead,
  }

  return {
    id,
    data,
    code,
  }
}

/**
 * Returns all posts, sorted by date.
 */
export async function getPosts(locale: Locale): Promise<Array<Post>> {
  const ids = await getPostIds(locale)

  const posts = await Promise.all(
    ids.map(async (id) => {
      return getPostById(id, locale)
    }),
  )

  posts.sort((a, b) =>
    a.data.metadata.date === b.data.metadata.date
      ? 0
      : a.data.metadata.date > b.data.metadata.date
      ? -1
      : 1,
  )

  return posts
}

/**
 * Returns metadata for post.
 */
export async function getPostPreviewById(
  id: ID,
  locale: Locale,
): Promise<PostPreview> {
  const [, metadata] = await readFileAndGetPostMetadata(id, locale)

  return { id, ...metadata }
}

/**
 * Returns metadata for all posts, sorted by date.
 */
export async function getPostPreviews(
  locale: Locale,
): Promise<Array<PostPreview>> {
  const ids = await getPostIds(locale)

  const metadata = await Promise.all(
    ids.map(async (id) => {
      return getPostPreviewById(id, locale)
    }),
  )

  metadata.sort((a, b) => (a.date === b.date ? 0 : a.date > b.date ? -1 : 1))

  return metadata
}

/**
 * Reads post file.
 */
async function getPostFile(id: ID, locale: Locale): Promise<VFile> {
  const filePath = getPostFilePath(id, locale)
  const file = await readFile(filePath)

  return file
}

/**
 * Returns file path for post.
 */
export function getPostFilePath(id: ID, _locale: Locale): FilePath {
  const filePath = join(postsFolder, id, 'index' + postExtension)

  return filePath
}

/**
 * Extracts post metadata and resolves foreign-key relations.
 */
async function getPostMetadata(
  file: VFile,
  locale: Locale,
): Promise<PostMetadata> {
  const matter = await getPostFrontmatter(file, locale)

  const metadata = {
    ...matter,
    authors: Array.isArray(matter.authors)
      ? await Promise.all(
          matter.authors.map((id) => {
            return getPersonById(id, locale)
          }),
        )
      : [],
    editors: Array.isArray(matter.editors)
      ? await Promise.all(
          matter.editors.map((id) => {
            return getPersonById(id, locale)
          }),
        )
      : [],
    contributors: Array.isArray(matter.contributors)
      ? await Promise.all(
          matter.contributors.map((id) => {
            return getPersonById(id, locale)
          }),
        )
      : [],
    tags: Array.isArray(matter.tags)
      ? await Promise.all(
          matter.tags.map((id) => {
            return getTagById(id, locale)
          }),
        )
      : [],
    licence: await getLicenceById(matter.licence, locale),
  }

  return metadata
}

/**
 * Extracts post frontmatter.
 */
async function getPostFrontmatter(
  file: VFile,
  _locale: Locale,
): Promise<PostFrontmatter> {
  extractFrontmatter(file)

  const { matter } = file.data as { matter: PostFrontmatter }

  return matter
}

/**
 * Compiles markdown and mdx content to function body.
 * Must be hydrated on the client with `useMdx`.
 *
 * Treats `.md` files as markdown, and `.mdx` files as mdx.
 *
 * Supports CommonMark, GitHub Markdown, and Pandoc Footnotes.
 */
async function compileMdx(file: VFile): Promise<VFile> {
  /**
   * Using a dynamic import for `xdm`, which is an ESM-only package,
   * so `getPostPreviews` can be called in scripts with `ts-node`.
   */
  const { compile } = await import('xdm')

  const highlighter = await getHighlighter({ theme: 'material-palenight' })

  return compile(file, {
    outputFormat: 'function-body',
    useDynamicImport: false,
    remarkPlugins: [
      withGitHubMarkdown,
      withFootnotes,
      withTypographicQuotesAndDashes,
      withReadingTime,
    ],
    rehypePlugins: [
      [withSyntaxHighlighting, { highlighter }],
      withHeadingIds,
      withExtractedTableOfContents,
      withHeadingLinks,
      withNoReferrerLinks,
      withLazyLoadingImages,
      withImageCaptions,
      withDownloadsLinks,
    ],
  })
}

/**
 * Cache for post metadata.
 */
const postCache: Record<Locale, Map<string, Promise<[VFile, PostMetadata]>>> = {
  de: new Map(),
  en: new Map(),
}

/**
 * Caches post metadata and vfile.
 *
 * VFile must be cached as well because post body is stripped of frontmatter.
 *
 * TODO: we should just use `remark-mdx-frontmatter` for getPostbyId, and for the post
 * previews just cache metadata, not the stripped vfile as well. so we don't have to
 * keep it in memory.
 */
async function readFileAndGetPostMetadata(id: ID, locale: Locale) {
  const cache = postCache[locale]

  if (!cache.has(id)) {
    cache.set(
      id,
      getPostFile(id, locale).then(async (file) => {
        const metadata = await getPostMetadata(file, locale)
        return [file, metadata]
      }),
    )
  }

  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  return cache.get(id)!
}
