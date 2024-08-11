import { Database } from "./client.js";

export function getPublicPosts() {
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

export function getPodcastForRss() {
  return Database.collection('posts').find(
    {
      'visibility': 'public',
      'type': 'public'
    },
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

export function getAllPosts() {
  return Database.collection('posts').find(
    {},
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

export function updatePodcastNameBySlug(slug, podcastName) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { title: podcastName } });
}

export function updateTimeCodeBySlug(slug, index, time, description, isPublicValue) {
  const timeInSeconds = time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
  return Database.collection('posts').updateOne(
    { slug: slug },
    {
      $set: {
        [`charters.${index}.time`]: time,
        [`charters.${index}.description`]: description,
        [`charters.${index}.isPublic`]: isPublicValue,
        [`charters.${index}.timeInSeconds`]: timeInSeconds,
      }
    }
  );
}

export function updateLinkBySlug(slug, index, link, title) {
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

export function getPostBySlug(slug) {
  return Database.collection('posts').findOne({ slug: slug });
}

export function updateMontageStatusBySlug(slug, status) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { montage_status: status } });
}

export function publishPodcast(slug) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { visibility: 'public' } });
}

export function unpublishPodcast(slug) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { visibility: 'private' } });
}

