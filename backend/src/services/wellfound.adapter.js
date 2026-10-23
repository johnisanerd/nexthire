/**
 * Map Wellfound Apify rows onto NextHire's existing job field names.
 * Offline-only helpers. Tests import this module and do not call Apify.
 */

const WELLFOUND_ACTOR_ID = 'johnvc/wellfound-jobs-api';

function wellfoundRunInput(role) {
  return {
    keyword: role,
    maxItems: 35,
    includeDescription: true,
  };
}

function companyName(item) {
  if (item.company && typeof item.company === 'object') {
    return item.company.name || 'Startup';
  }
  if (typeof item.company === 'string' && item.company) {
    return item.company;
  }
  return item.companyName || 'Startup';
}

function locationName(item) {
  if (Array.isArray(item.locationNames) && item.locationNames.length) {
    return item.locationNames[0];
  }
  if (item.location && typeof item.location === 'object') {
    return item.location.name || item.location.display_name || 'Remote';
  }
  return item.location || item.jobLocation || 'Remote';
}

function isNoticeRow(item) {
  return Boolean(item.free_tier_notice) || item.result_type === 'notice';
}

function mapWellfoundItem(item) {
  const title = item.title || item.jobTitle || 'Job Opening';
  const company = companyName(item);
  return {
    id: `wellfound_${item.id || item.jobId || Math.random().toString(36).substr(2, 9)}`,
    title,
    company,
    location: locationName(item),
    description: item.description || item.jobDescription ||
      `${title} opportunity at ${company}. ${item.compensation || item.compensationRaw || ''}`,
    applyUrl: item.url || item.jobUrl || 'https://wellfound.com/jobs',
    stipend: item.compensation || item.compensationRaw || item.salary || '',
    postedAt: item.postedAt || '',
    isRemote: item.remote || item.isRemote || false,
    employmentType: item.jobType || 'Full-time',
    source: 'Wellfound',
    companyLogo: item.companyLogo || (item.company && item.company.logo) || null,
  };
}

function mapWellfoundItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((item) => item && !isNoticeRow(item)).map(mapWellfoundItem);
}

module.exports = {
  WELLFOUND_ACTOR_ID,
  wellfoundRunInput,
  mapWellfoundItem,
  mapWellfoundItems,
};
