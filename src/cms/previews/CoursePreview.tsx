import { compile } from '@mdx-js/mdx'
import withSyntaxHighlighting from '@stefanprobst/rehype-shiki'
import type { PreviewTemplateComponentProps } from 'netlify-cms-core'
import { useEffect, useMemo, useState } from 'react'
import withHeadingIds from 'rehype-slug'
import withGitHubMarkdown from 'remark-gfm'
import type { Highlighter } from 'shiki'

import type { CourseFrontmatter, CourseMetadata } from '@/cms/api/courses.api'
import { getSyntaxHighlighter } from '@/cms/previews/getSyntaxHighlighter'
import { Preview } from '@/cms/previews/Preview'
import { Spinner } from '@/common/Spinner'
import withHeadingLinks from '@/mdx/plugins/rehype-heading-links'
import withImageCaptions from '@/mdx/plugins/rehype-image-captions'
import withNoReferrerLinks from '@/mdx/plugins/rehype-no-referrer-links'
import withCmsPreviewAssets from '@/mdx/plugins/remark-cms-preview-assets'
import withTypographicQuotesAndDashes from '@/mdx/plugins/remark-smartypants'
import { useDebouncedState } from '@/utils/useDebouncedState'
import { Course } from '@/views/Course'

const initialMetadata: CourseMetadata = {
  tags: [],
  uuid: '',
  title: '',
  lang: 'en',
  date: new Date(0).toISOString(),
  version: '',
  abstract: '',
  resources: [],
}

/**
 * CMS preview for course.
 */
export function CoursePreview(props: PreviewTemplateComponentProps): JSX.Element {
  const entry = useDebouncedState(props.entry, 250)
  const { fieldsMetaData, getAsset } = props

  const data = entry.get('data')
  const body = entry.getIn(['data', 'body'])

  const [metadata, setMetadata] = useState<CourseMetadata>(initialMetadata)
  const [mdxContent, setMdxContent] = useState<Error | string | null>(null)
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)

  useEffect(() => {
    async function initializeHighlighter() {
      const highlighter = await getSyntaxHighlighter()
      setHighlighter(highlighter)
    }

    initializeHighlighter()
  }, [])

  const compileMdx = useMemo(() => {
    if (highlighter == null) return null

    return async (code: string) => {
      return String(
        await compile(code, {
          outputFormat: 'function-body',
          useDynamicImport: false,
          remarkPlugins: [
            withGitHubMarkdown,
            withTypographicQuotesAndDashes,
            [withCmsPreviewAssets, getAsset],
          ],
          rehypePlugins: [
            [withSyntaxHighlighting, { highlighter }],
            withHeadingIds,
            withHeadingLinks,
            withNoReferrerLinks,
            withImageCaptions,
          ],
        }),
      )
    }
  }, [getAsset, highlighter])

  useEffect(() => {
    function resolveRelation(path: Array<string>, id: string) {
      const metadata = fieldsMetaData.getIn([...path, id])
      if (metadata == null) return null
      return { id, ...metadata.toJS() }
    }

    const { body: _, ...partialFrontmatter } = data.toJS()
    const frontmatter = partialFrontmatter as Partial<CourseFrontmatter>

    const editors = Array.isArray(frontmatter.editors)
      ? frontmatter.editors
          .map((id) => {
            return resolveRelation(['editors', 'people'], id)
          })
          .filter(Boolean)
          .map((editor) => {
            // FIXME: how to resolve asset path on related item?
            // We cannot use `getAsset` because that is bound to the `posts` collection.
            return {
              ...editor,
              avatar: undefined,
            }
          })
      : []

    const tags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags
          .map((id) => {
            return resolveRelation(['tags', 'tags'], id)
          })
          .filter(Boolean)
      : []

    const resources = Array.isArray(frontmatter.resources)
      ? frontmatter.resources
          .map((id) => {
            return resolveRelation(['resources', 'posts'], id)
          })
          .filter(Boolean)
      : []

    const date =
      frontmatter.date == null || frontmatter.date.length === 0
        ? initialMetadata.date
        : frontmatter.date

    const featuredImage =
      frontmatter.featuredImage != null
        ? String(getAsset(frontmatter.featuredImage))
        : frontmatter.featuredImage

    const metadata = {
      ...initialMetadata,
      ...frontmatter,
      date,
      editors,
      tags,
      resources,
      featuredImage,
    }

    setMetadata(metadata)
  }, [data, fieldsMetaData, getAsset])

  useEffect(() => {
    let wasCanceled = false

    async function processMdx() {
      try {
        if (compileMdx == null) return Promise.resolve()
        const code = await compileMdx(body)

        if (!wasCanceled) {
          setMdxContent(code)
        }
      } catch (error) {
        console.error(error)
        setMdxContent(new Error('Failed to render mdx.'))
      }
    }

    processMdx()

    return () => {
      wasCanceled = true
    }
  }, [body, compileMdx])

  return (
    <Preview {...props}>
      {typeof mdxContent === 'string' ? (
        <div className="mx-auto w-full max-w-6xl rounded bg-brand-black p-8 text-white">
          <Course
            course={{
              id: entry.get('slug'),
              code: mdxContent,
              data: {
                metadata,
              },
            }}
            lastUpdatedAt={null}
            isPreview
          />
        </div>
      ) : mdxContent instanceof Error ? (
        <div>
          <p>Failed to render preview.</p>
          <p>This usually indicates a syntax error in the Markdown content.</p>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Spinner className="h-6 w-6 text-brand-blue" aria-label="Loading..." />
          <p>Trying to render preview...</p>
        </div>
      )}
    </Preview>
  )
}
