const { Database } = require("./client");


function getPublicPosts() {
  return Database.collection('posts').find(
    {
      'visibility': 'public'
    },
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

function getAllPosts() {
  return Database.collection('posts').find(
    {},
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

function updatePodcastNameBySlug(slug, podcastName) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { title: podcastName } });
}

function updateTimeCodeBySlug(slug, index, time, description, isPublicValue) {
  return Database.collection('posts').updateOne(
    { slug: slug },
    {
      $set: {
        [`charters.${index}.time`]: time,
        [`charters.${index}.description`]: description,
        [`charters.${index}.isPublic`]: isPublicValue,
      }
    }
  );
}

function updateLinkBySlug(slug, index, link, title) {
  return Database.collection('posts').updateOne(
    { slug: slug },
    {
      $set: {
        [`links.${index}.link`]: link,
        [`links.${index}.title`]: title
      }
    }
  );
}

function getPostBySlug(slug) {
  return Database.collection('posts').findOne({ slug: slug });
}

module.exports = {
  getPublicPosts,
  getAllPosts,
  getPostBySlug,
  updatePodcastNameBySlug,
  updateTimeCodeBySlug,
  updateLinkBySlug,
}
