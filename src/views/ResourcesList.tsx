import Link from 'next/link'

import type { PostPreview } from '@/cms/api/posts.api'
import { getFullName } from '@/cms/utils/getFullName'
import { routes } from '@/navigation/routes.config'

const MAX_AUTHORS = 3

export interface ResourcesListProps {
  resources: Array<PostPreview>
}

/**
 * Lists one page of resources.
 */
export function ResourcesList(props: ResourcesListProps): JSX.Element {
  const { resources } = props

  return (
    <ul className="grid gap-6 xs:grid-cols-cards">
      {resources.map((resource) => {
        return (
          <li key={resource.id}>
            <ResourcePreviewCard resource={resource} />
          </li>
        )
      })}
    </ul>
  )
}

interface ResourcePreviewCardProps {
  resource: ResourcesListProps['resources'][number]
}

/**
 * Resource preview.
 */
function ResourcePreviewCard(props: ResourcePreviewCardProps): JSX.Element {
  const { resource } = props
  const { id, title, authors, abstract } = resource

  const href = routes.resource({ kind: 'posts', id })

  return (
    <article className="flex flex-col overflow-hidden transition border rounded shadow-sm border-neutral-150 hover:shadow-md">
      <div className="flex flex-col px-10 py-10 space-y-5">
        <h2 className="text-2xl font-semibold">
          <Link href={href}>
            <a className="transition hover:text-primary-600">{title}</a>
          </Link>
        </h2>
        <div className="leading-7 text-neutral-500">{abstract}</div>
      </div>
      <footer className="flex items-center justify-between px-10 py-5 bg-neutral-100">
        <dl>
          {Array.isArray(authors) && authors.length > 0 ? (
            <div>
              <dt className="sr-only">Authors</dt>
              <dd>
                <ul className="flex items-center space-x-1">
                  {authors.slice(0, MAX_AUTHORS).map((author) => {
                    return (
                      <li key={author.id}>
                        <span className="sr-only">{getFullName(author)}</span>
                        {author.avatar !== undefined ? (
                          <img
                            src={author.avatar}
                            alt=""
                            loading="lazy"
                            className="object-cover w-8 h-8 rounded-full"
                          />
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>
        <Link href={href}>
          <a className="transition hover:text-primary-600">Read more &rarr;</a>
        </Link>
      </footer>
    </article>
  )
}
