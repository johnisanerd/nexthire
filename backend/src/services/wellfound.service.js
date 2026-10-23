const { ApifyClient } = require('apify-client');
const JobCache = require('../models/jobCache.model');
const {
  WELLFOUND_ACTOR_ID,
  wellfoundRunInput,
  mapWellfoundItems,
} = require('./wellfound.adapter');

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

const scrapeWellfound = async (role) => {
  const query = role.toLowerCase().trim();

  // Check cache first
  const cached = await JobCache.findOne({
    query,
    source: 'wellfound',
    expiresAt: { $gt: new Date() }
  });

  if (cached) {
    console.log(`Wellfound cache hit for: ${query}`);
    return cached.jobs;
  }

  console.log(`Wellfound cache miss — calling Apify for: ${query}`);

  try {
    const run = await client.actor(WELLFOUND_ACTOR_ID).call(wellfoundRunInput(role));

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const jobs = mapWellfoundItems(items);

    // Save to cache
    await JobCache.findOneAndUpdate(
      { query, source: 'wellfound' },
      {
        query,
        source: 'wellfound',
        jobs,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    console.log(`Wellfound: ${jobs.length} jobs scraped and cached for: ${query}`);
    return jobs;

  } catch (error) {
    console.error(`Wellfound scraping failed: ${error.message}`);
    return [];
  }
};

module.exports = { scrapeWellfound };
