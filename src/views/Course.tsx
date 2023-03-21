import Image from 'next/image'
import Link from 'next/link'

import AvatarIcon from '@/assets/icons/user.svg?symbol'
import type { Course as CourseData } from '@/cms/api/courses.api'
import { Figure } from '@/cms/components/Figure'
import { Tabs } from '@/cms/components/Tabs'
import { getFullName } from '@/cms/utils/getFullName'
import { Icon } from '@/common/Icon'
import { PageTitle } from '@/common/PageTitle'
import { ResponsiveImage } from '@/common/ResponsiveImage'
import { useI18n } from '@/i18n/useI18n'
import { Mdx } from '@/mdx/Mdx'
import { routes } from '@/navigation/routes.config'
import type { IsoDateString } from '@/utils/ts/aliases'
import { EditLink } from '@/views/EditLink'
import { ResourcesList } from '@/views/ResourcesList'

export interface CourseProps {
  course: CourseData
  lastUpdatedAt: IsoDateString | null
  isPreview?: boolean
}

export function Course(props: CourseProps): JSX.Element {
  const { course, lastUpdatedAt, isPreview } = props
  const { metadata } = course.data
  const { resources } = metadata

  const { t, formatDate } = useI18n()

  return (
    <div className="grid space-y-12">
      <div className="prose-sm prose-invert max-w-none sm:prose sm:prose-invert sm:max-w-none">
        <Mdx code={course.code} components={{ Figure, Image: ResponsiveImage, Tabs }} />
      </div>
      {resources.length > 0 ? (
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold">{t('common.lessons')}</h2>
          <ResourcesList posts={resources} />
        </div>
      ) : null}
      <footer>
        {lastUpdatedAt != null ? (
          <p className="text-right text-sm text-neutral-300">
            <span>{t('common.lastUpdated')}: </span>
            <time dateTime={lastUpdatedAt}>
              {formatDate(new Date(lastUpdatedAt), undefined, {
                dateStyle: 'medium',
              })}
            </time>
          </p>
        ) : null}
        {isPreview !== true ? (
          <EditLink
            collection="courses"
            id={course.id}
            className="flex items-center justify-end space-x-1.5 text-sm text-neutral-300"
          >
            <span className="text-right">{t('common.suggestChangesToCourse')}</span>
          </EditLink>
        ) : null}
      </footer>
    </div>
  )
}

export interface CourseHeaderProps {
  course: CourseData
  lastUpdatedAt: IsoDateString | null
  isPreview?: boolean
}

export function CourseHeader(props: CourseHeaderProps): JSX.Element {
  const { course } = props
  const { metadata } = course.data
  const { title, date: publishDate, editors: authors = [], tags } = metadata

  const { t, formatDate } = useI18n()

  return (
    <header className="space-y-10">
      <dl>
        {tags.length > 0 ? (
          <div className="">
            <dt className="sr-only inline">{t('common.tags')}:</dt>
            <dd className="inline">
              <ul className="inline text-xs font-bold uppercase tracking-wide text-brand-light-blue">
                {tags.map((tag, index) => {
                  return (
                    <li key={tag.id} className="inline">
                      <Link
                        className="transition hover:text-white focus:outline-none focus-visible:ring focus-visible:ring-brand-light-blue"
                        href={routes.tag({ id: tag.id })}
                      >
                        <span className={index !== 0 ? 'ml-1' : undefined}>{tag.name}</span>
                      </Link>
                      {index !== tags.length - 1 ? ', ' : null}
                    </li>
                  )
                })}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
      <PageTitle>{title}</PageTitle>
      <dl className="grid grid-cols-2 items-center border-y border-neutral-200 py-4 text-sm text-neutral-100">
        <div className="space-y-1">
          {authors.length > 0 ? (
            <div>
              <dt className="sr-only">{t('common.authors')}</dt>
              <dd>
                <ul className="space-y-2">
                  {authors.map((author) => {
                    return (
                      <li key={author.id}>
                        <div className="flex items-center space-x-2">
                          {author.avatar != null ? (
                            <Image
                              src={author.avatar}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                              width={32}
                              height={32}
                            />
                          ) : (
                            <Icon
                              icon={AvatarIcon}
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                          )}
                          <Link className="underline" href={routes.author({ id: author.id })}>
                            {getFullName(author)}
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </dd>
            </div>
          ) : null}
        </div>
        <div className="space-y-1 text-right">
          <div>
            <dt className="sr-only">{t('common.publishDate')}</dt>
            <dd>
              <time dateTime={publishDate}>
                {formatDate(new Date(publishDate), undefined, {
                  dateStyle: 'long',
                })}
              </time>
            </dd>
          </div>
        </div>
      </dl>
    </header>
  )
}
