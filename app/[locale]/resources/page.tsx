import { createUrlSearchParams } from "@acdh-oeaw/lib";
import type { Metadata, ResolvingMetadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale as setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MainContent } from "@/components/main-content";
import { ResourcesSection } from "@/components/resources-section";
import { PageTitle } from "@/components/ui/page-title";
import type { Locale } from "@/config/i18n.config";
import { createResourceFiltersSearchParamsSchema } from "@/lib/schemas/resource-filter-schema";

interface ResourcesPageProps {
	params: {
		locale: Locale;
	};
	searchParams: Record<string, Array<string> | string>;
}

export async function generateMetadata(
	props: ResourcesPageProps,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const { params } = props;

	const { locale } = params;
	const t = await getTranslations({ locale, namespace: "ResourcesPage" });

	const metadata: Metadata = {
		title: t("meta.title"),
	};

	return metadata;
}

export default function ResourcesPage(props: ResourcesPageProps): ReactNode {
	const { params, searchParams } = props;

	const { locale } = params;
	setRequestLocale(locale);

	const t = useTranslations("ResourcesPage");

	const urlSearchParams = createUrlSearchParams(searchParams);

	const searchParamsSchema = createResourceFiltersSearchParamsSchema(locale);

	const filters = searchParamsSchema.parse({
		limit: urlSearchParams.get("limit"),
		locale: urlSearchParams.get("locale"),
		page: urlSearchParams.get("page"),
		q: urlSearchParams.get("q")?.trim().toLocaleLowerCase(),
		tag: urlSearchParams.getAll("tag"),
	});

	return (
		<MainContent className="container grid grid-rows-[auto_1fr] gap-y-8 py-4 xs:py-8 md:py-12">
			<div className="w-full">
				<PageTitle>{t("title")}</PageTitle>
			</div>

			<ResourcesSection filters={filters} />
		</MainContent>
	);
}
