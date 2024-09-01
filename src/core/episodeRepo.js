import { Database } from "./client.js";

export function getPublicPosts(showSlug) {
  return Database.collection('posts').find(
    {
      'visibility': 'public',
      'showSlug': showSlug
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

export function getAllPosts(showSlug) {
  return Database.collection('posts').find(
    {
      'showSlug': showSlug
    },
    {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

export function updatePodcastNameBySlug(showSlug, episodeSlug, podcastName) {
  return Database.collection('posts').updateOne({
    showSlug: showSlug,
    slug: episodeSlug
  }, {
    $set: { title: podcastName }
  });
}

export function updateTimeCodeBySlug(showSlug, episodeSlug, index, time, description, isPublicValue) {
  const timeInSeconds = time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
  return Database.collection('posts').updateOne(
    {
      showSlug: showSlug,
      slug: episodeSlug
    },
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

export function getPostBySlug(showSlug, episodeSlug) {
  return Database.collection('posts').findOne({ slug: episodeSlug, showSlug: showSlug });
}

export function updateMontageStatusBySlug(slug, status) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { montage_status: status } });
}

export function updateMontageStatusToSuccessBySlug(slug, publicAudioFile) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { montage_status: 'success', publicAudioFile: publicAudioFile } });
}

export function publishPodcast(slug) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { visibility: 'public' } });
}

export function unpublishPodcast(slug) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { visibility: 'private' } });
}

