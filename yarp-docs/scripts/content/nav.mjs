import { GROUPS, APPENDIX } from './ia.mjs';

// Built from ia.mjs's structural GROUPS plus each locale's own title index
// (built once by render-page.mjs's buildTitleIndex from every page's
// frontmatter) - never from a separately-authored nav file, so a page's
// title and its nav entry's title can't independently drift the way they
// did before this pass (the "es mismatches its own nav 31/36" finding).
// groupLabelIndex is the same shape as titleIndex (Map<locale, Map<id,
// label>>), sourced from content/<locale>/_groups.json - group labels
// aren't a page's own content, so they get their own small per-locale file
// rather than living in any single page's frontmatter.
export function buildNavTree(locale, titleIndex, groupLabelIndex) {
  const bySlug = titleIndex.get(locale) ?? new Map();
  const fallback = titleIndex.get('en');
  const labelsForLocale = groupLabelIndex.get(locale) ?? new Map();
  const labelsFallback = groupLabelIndex.get('en') ?? new Map();

  function titleFor(slug) {
    return bySlug.get(slug) ?? fallback.get(slug);
  }

  function labelFor(groupId, englishLabel) {
    return labelsForLocale.get(groupId) ?? labelsFallback.get(groupId) ?? englishLabel;
  }

  return {
    locale,
    groups: GROUPS.map((group, groupIndex) => ({
      id: group.id,
      label: labelFor(group.id, group.label),
      order: groupIndex + 1,
      items: group.items.map((item, itemIndex) => ({
        slug: item.slug,
        title: titleFor(item.slug),
        order: itemIndex + 1,
        kind: 'doc',
      })),
    })),
    appendix: APPENDIX.map((item, itemIndex) => ({
      slug: item.slug,
      title: titleFor(item.slug),
      order: itemIndex + 1,
      kind: 'appendix',
    })),
  };
}
