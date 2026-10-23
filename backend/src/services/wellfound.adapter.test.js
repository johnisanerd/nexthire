const test = require('node:test');
const assert = require('node:assert/strict');
const {
  WELLFOUND_ACTOR_ID,
  wellfoundRunInput,
  mapWellfoundItems,
} = require('./wellfound.adapter');

const JOHNVC_ROW = {
  title: 'Software Engineer',
  url: 'https://wellfound.com/jobs/example',
  description: 'Build product at a startup.',
  postedAt: '2026-10-01T00:00:00Z',
  remote: true,
  locationNames: ['Remote'],
  compensationRaw: '$120k-$160k',
  company: {
    name: 'Example Startup',
    slug: 'example-startup',
  },
};

const FLAT_ROW = {
  jobTitle: 'Backend Engineer',
  companyName: 'Flat Co',
  location: 'Dublin',
  jobUrl: 'https://wellfound.com/jobs/flat',
  jobDescription: 'Ship APIs.',
  postedAt: '2026-09-15',
};

test('actor id is the live Wellfound actor', () => {
  assert.equal(WELLFOUND_ACTOR_ID, 'johnvc/wellfound-jobs-api');
  assert.equal(WELLFOUND_ACTOR_ID.includes('crawlerbros'), false);
});

test('run input maps role and cap', () => {
  assert.deepEqual(wellfoundRunInput('software engineer'), {
    keyword: 'software engineer',
    maxItems: 35,
    includeDescription: true,
  });
});

test('nested company name is not stringified', () => {
  const [row] = mapWellfoundItems([JOHNVC_ROW]);
  assert.equal(row.title, 'Software Engineer');
  assert.equal(row.company, 'Example Startup');
  assert.equal(row.company.includes('{'), false);
  assert.equal(row.location, 'Remote');
  assert.equal(row.applyUrl, 'https://wellfound.com/jobs/example');
  assert.equal(row.stipend, '$120k-$160k');
});

test('flat previous-actor rows still map', () => {
  const [row] = mapWellfoundItems([FLAT_ROW]);
  assert.equal(row.title, 'Backend Engineer');
  assert.equal(row.company, 'Flat Co');
  assert.equal(row.location, 'Dublin');
  assert.equal(row.applyUrl, 'https://wellfound.com/jobs/flat');
});

test('notice rows are dropped', () => {
  const rows = mapWellfoundItems([
    { free_tier_notice: true, message: 'upgrade' },
    JOHNVC_ROW,
  ]);
  assert.equal(rows.length, 1);
});
